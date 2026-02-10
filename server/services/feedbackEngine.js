const { getSQLiteDb } = require('../db');
const learnerModel = require('./learnerModel');
const { inferErrorType } = require('../utils/questionMapper');

// In-memory storage for hints (could be moved to database)
const hintCache = new Map();

/**
 * Generate comprehensive post-quiz feedback
 * @param {string} studentId - Student ID
 * @param {Object} quizResults - Quiz results object
 * @param {string} quizResults.quizId - Quiz ID
 * @param {Array} quizResults.answers - Array of answer objects
 * @returns {Promise<Object>} Feedback object with breakdown, strengths, weaknesses, and recommendations
 */
async function generatePostQuizFeedback(studentId, quizResults) {
  return new Promise(async (resolve, reject) => {
    try {
      const { quizId, answers } = quizResults;
      
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return reject(new Error('Invalid quiz results: answers array required'));
      }

      // Step 1: Update concept mastery for each answer
      const conceptUpdates = [];
      for (const answer of answers) {
        const { questionId, isCorrect, conceptTags, timeSpent, errorType, studentAnswer, correctAnswer } = answer;
        
        // Update mastery for each concept in the question
        if (conceptTags && Array.isArray(conceptTags) && conceptTags.length > 0) {
          for (const concept of conceptTags) {
            try {
              await learnerModel.updateConceptMastery(studentId, concept, isCorrect, timeSpent || 0);
              conceptUpdates.push({ concept, isCorrect, timeSpent: timeSpent || 0 });
            } catch (err) {
              console.error(`Error updating mastery for concept ${concept}:`, err);
            }
          }
        }
      }

      // Step 2: Calculate concept breakdown
      const conceptStats = {};
      
      answers.forEach(answer => {
        const concepts = answer.conceptTags || [];
        concepts.forEach(concept => {
          if (!conceptStats[concept]) {
            conceptStats[concept] = {
              concept,
              total: 0,
              correct: 0,
              questions: [],
              errorTypes: {}
            };
          }
          
          conceptStats[concept].total++;
          if (answer.isCorrect) {
            conceptStats[concept].correct++;
          }
          
          conceptStats[concept].questions.push({
            questionId: answer.questionId,
            isCorrect: answer.isCorrect,
            errorType: answer.errorType || null
          });
          
          // Track error types
          if (!answer.isCorrect && answer.errorType) {
            conceptStats[concept].errorTypes[answer.errorType] = 
              (conceptStats[concept].errorTypes[answer.errorType] || 0) + 1;
          }
        });
      });

      // Step 3: Calculate mastery per concept and generate feedback
      const conceptBreakdown = [];
      const strengths = [];
      const weaknesses = [];
      
      for (const [concept, stats] of Object.entries(conceptStats)) {
        const mastery = stats.total > 0 ? stats.correct / stats.total : 0;
        
        // Generate feedback message
        let feedback = '';
        if (mastery >= 0.8) {
          feedback = `Excellent work on ${concept}! You're mastering this concept.`;
          strengths.push({
            concept,
            mastery,
            questionsCount: stats.total
          });
        } else if (mastery >= 0.5) {
          feedback = `Good progress on ${concept}. Keep practicing to improve further.`;
        } else {
          feedback = `Let's practice more ${concept}. `;
          
          // Add specific feedback based on error types
          const errorTypes = Object.keys(stats.errorTypes);
          if (errorTypes.length > 0) {
            const dominantError = errorTypes.reduce((a, b) => 
              stats.errorTypes[a] > stats.errorTypes[b] ? a : b
            );
            
            switch (dominantError) {
              case 'calculation':
                feedback += 'Focus on your calculation steps and double-check your arithmetic.';
                break;
              case 'concept':
                feedback += 'Review the core concepts and definitions.';
                break;
              case 'application':
                feedback += 'Practice applying this concept to different problem types.';
                break;
              case 'careless':
                feedback += 'Take your time and review your answers before submitting.';
                break;
              default:
                feedback += 'Review the explanations and try similar problems.';
            }
          } else {
            feedback += 'Review the explanations and try similar problems.';
          }
          
          weaknesses.push({
            concept,
            mastery,
            questionsCount: stats.total,
            errorTypes: stats.errorTypes
          });
        }
        
        conceptBreakdown.push({
          concept,
          mastery: Math.round(mastery * 100) / 100,
          questions: stats.total,
          correct: stats.correct,
          feedback
        });
      }

      // Step 4: Calculate overall score
      const totalCorrect = answers.filter(a => a.isCorrect).length;
      const overallScore = answers.length > 0 ? totalCorrect / answers.length : 0;

      // Step 5: Generate recommendations for weak concepts
      const recommendations = [];
      const sqliteDb = getSQLiteDb();
      
      if (sqliteDb && weaknesses.length > 0) {
        // Use Promise.all to wait for all recommendation queries
        const recommendationPromises = weaknesses.map(weakness => {
          return new Promise((resolve) => {
            const conceptRecommendations = [];
            let queriesCompleted = 0;
            const totalQueries = 2; // lessons + quizzes
            
            const checkComplete = () => {
              queriesCompleted++;
              if (queriesCompleted === totalQueries) {
                resolve(conceptRecommendations);
              }
            };
            
            // Find lessons targeting this concept
            sqliteDb.all(
              `SELECT DISTINCT sp.lesson_id, l.title, l.subject, l.difficulty,
                      'lesson' as type
               FROM student_progress sp
               JOIN lessons l ON sp.lesson_id = l.id
               WHERE sp.student_id = ?
                 AND sp.concept_tags IS NOT NULL
                 AND sp.concept_tags LIKE ?
               LIMIT 2`,
              [studentId, `%${weakness.concept}%`],
              (err, lessons) => {
                if (!err && lessons) {
                  lessons.forEach(lesson => {
                    conceptRecommendations.push({
                      type: 'lesson',
                      concept: weakness.concept,
                      content: {
                        id: lesson.lesson_id,
                        title: lesson.title,
                        subject: lesson.subject
                      }
                    });
                  });
                }
                checkComplete();
              }
            );
            
            // Also search for quizzes
            sqliteDb.all(
              `SELECT DISTINCT q.id, l.title || ' - Quiz' as title, l.subject, l.difficulty,
                      'quiz' as type, q.lesson_id
               FROM student_progress sp
               JOIN lessons l ON sp.lesson_id = l.id
               JOIN quizzes q ON q.lesson_id = l.id
               WHERE sp.student_id = ?
                 AND sp.concept_tags IS NOT NULL
                 AND sp.concept_tags LIKE ?
               LIMIT 2`,
              [studentId, `%${weakness.concept}%`],
              (err, quizzes) => {
                if (!err && quizzes) {
                  quizzes.forEach(quiz => {
                    conceptRecommendations.push({
                      type: 'quiz',
                      concept: weakness.concept,
                      content: {
                        id: quiz.id,
                        title: quiz.title,
                        subject: quiz.subject
                      }
                    });
                  });
                }
                checkComplete();
              }
            );
          });
        });
        
        // Wait for all recommendations
        const allRecommendations = await Promise.all(recommendationPromises);
        recommendations.push(...allRecommendations.flat());
      }

      // Step 6: Generate personalized message
      let personalizedMessage = '';
      const scorePercent = Math.round(overallScore * 100);
      
      if (overallScore >= 0.9) {
        personalizedMessage = `Outstanding performance! You scored ${scorePercent}%. You're excelling across all concepts.`;
      } else if (overallScore >= 0.7) {
        personalizedMessage = `Great job! You scored ${scorePercent}%. You're doing well, with some areas to strengthen.`;
      } else if (overallScore >= 0.5) {
        personalizedMessage = `Good effort! You scored ${scorePercent}%. Focus on the concepts you found challenging.`;
      } else {
        personalizedMessage = `You scored ${scorePercent}%. Don't worry - every mistake is a learning opportunity. Review the concepts and try again!`;
      }
      
      if (strengths.length > 0) {
        personalizedMessage += ` You're particularly strong in: ${strengths.map(s => s.concept).join(', ')}.`;
      }
      
      if (weaknesses.length > 0) {
        personalizedMessage += ` Focus on improving: ${weaknesses.map(w => w.concept).join(', ')}.`;
      }

      // Return feedback with all data
      resolve({
        overallScore: Math.round(overallScore * 100) / 100,
        conceptBreakdown,
        strengths,
        weaknesses,
        recommendations: recommendations.slice(0, 10), // Limit to 10 recommendations
        personalizedMessage
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate real-time hints based on attempt number
 * @param {string} questionId - Question ID
 * @param {any} studentAnswer - Student's current answer
 * @param {number} attemptNumber - Current attempt (1, 2, 3, etc.)
 * @returns {Object} Hint object with message and type
 */
function generateRealTimeHint(questionId, studentAnswer, attemptNumber) {
  const attempt = Math.min(attemptNumber || 1, 3); // Cap at 3 attempts
  
  // Check cache for previous hints
  const cacheKey = `${questionId}_${attempt}`;
  if (hintCache.has(cacheKey)) {
    return hintCache.get(cacheKey);
  }

  let hint = {
    attempt: attempt,
    message: '',
    type: 'general'
  };

  switch (attempt) {
    case 1:
      hint.message = 'Think about the key concept here. What is this question really asking?';
      hint.type = 'conceptual';
      break;
      
    case 2:
      hint.message = 'Remember: Review the relevant formula or concept. Break down the problem into smaller steps.';
      hint.type = 'guided';
      break;
      
    case 3:
      hint.message = 'Step-by-step guidance: Start by identifying what you know and what you need to find. Then apply the appropriate method step by step.';
      hint.type = 'detailed';
      break;
      
    default:
      hint.message = 'Take your time and think through each step carefully.';
      hint.type = 'encouragement';
  }

  // Store in cache (expires after 1 hour)
  hintCache.set(cacheKey, hint);
  setTimeout(() => hintCache.delete(cacheKey), 3600000);

  return hint;
}

/**
 * Explain a concept at the student's level
 * @param {string} conceptName - Name of the concept
 * @param {string} studentLevel - Student level: 'beginner' | 'intermediate' | 'advanced'
 * @returns {Promise<Object>} Explanation object with text and examples
 */
async function explainConcept(conceptName, studentLevel) {
  return new Promise((resolve, reject) => {
    const level = studentLevel || 'beginner';
    const concept = conceptName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Get student's mastery level for this concept to determine level
    const sqliteDb = getSQLiteDb();
    if (sqliteDb) {
      // This would typically get the student's actual mastery
      // For now, we'll use the provided level
    }

    // Concept explanations database (could be expanded or moved to database)
    const explanations = {
      'linear_equations': {
        beginner: {
          text: 'A linear equation is like a balance scale. Both sides must be equal. For example, if x + 3 = 7, then x = 4 because 4 + 3 = 7.',
          example: 'Example: Solve x + 5 = 12. Subtract 5 from both sides: x = 7.'
        },
        intermediate: {
          text: 'Linear equations have variables raised to the power of 1. They form straight lines when graphed. The general form is y = mx + b, where m is the slope and b is the y-intercept.',
          example: 'Example: y = 2x + 3 has slope 2 and crosses the y-axis at (0, 3).'
        },
        advanced: {
          text: 'Linear equations represent proportional relationships. They can be solved using algebraic manipulation, graphing, or matrix methods. Systems of linear equations can have one, infinite, or no solutions.',
          example: 'Example: Solve the system: 2x + y = 5 and x - y = 1. Using elimination: x = 2, y = 1.'
        }
      },
      'fractions': {
        beginner: {
          text: 'A fraction shows parts of a whole. The top number (numerator) tells how many parts you have. The bottom number (denominator) tells how many equal parts make up the whole.',
          example: 'Example: 3/4 means you have 3 out of 4 equal parts.'
        },
        intermediate: {
          text: 'Fractions can be added, subtracted, multiplied, and divided. To add or subtract, find a common denominator. To multiply, multiply numerators and denominators. To divide, multiply by the reciprocal.',
          example: 'Example: 1/2 + 1/3 = 3/6 + 2/6 = 5/6'
        },
        advanced: {
          text: 'Fractions are rational numbers. They can be converted to decimals, percentages, or mixed numbers. Operations with fractions follow specific rules, and improper fractions can be simplified.',
          example: 'Example: (2/3) ÷ (4/5) = (2/3) × (5/4) = 10/12 = 5/6'
        }
      },
      'patterns': {
        beginner: {
          text: 'Patterns are sequences that follow a rule. Look for what changes and what stays the same. Common patterns include counting up, counting down, or repeating shapes.',
          example: 'Example: 2, 4, 6, 8... The pattern is adding 2 each time.'
        },
        intermediate: {
          text: 'Mathematical patterns can be arithmetic (adding/subtracting), geometric (multiplying/dividing), or based on position. You can find the rule and predict future numbers.',
          example: 'Example: 3, 6, 12, 24... Each number is doubled (multiply by 2).'
        },
        advanced: {
          text: 'Patterns can be described using formulas. Arithmetic sequences use a_n = a_1 + (n-1)d. Geometric sequences use a_n = a_1 × r^(n-1). Fibonacci and other special sequences have unique properties.',
          example: 'Example: Fibonacci: 1, 1, 2, 3, 5, 8... Each number is the sum of the two before it.'
        }
      },
      'number_theory': {
        beginner: {
          text: 'Number theory studies whole numbers and their properties. It looks at patterns in numbers, like which numbers can be divided evenly by others.',
          example: 'Example: 6 can be divided by 1, 2, 3, and 6. These are its factors.'
        },
        intermediate: {
          text: 'Number theory explores prime numbers, factors, multiples, and divisibility rules. Prime numbers have exactly two factors: 1 and themselves.',
          example: 'Example: 7 is prime because it can only be divided by 1 and 7.'
        },
        advanced: {
          text: 'Number theory includes concepts like modular arithmetic, greatest common divisors, least common multiples, and theorems like Fermat\'s Little Theorem and the Chinese Remainder Theorem.',
          example: 'Example: GCD(48, 18) = 6, LCM(48, 18) = 144'
        }
      }
    };

    // Get explanation for concept
    const conceptExplanation = explanations[concept];
    
    if (conceptExplanation && conceptExplanation[level]) {
      resolve({
        concept: conceptName,
        level: level,
        explanation: conceptExplanation[level].text,
        example: conceptExplanation[level].example,
        source: 'built-in'
      });
    } else {
      // Fallback explanation
      resolve({
        concept: conceptName,
        level: level,
        explanation: `${conceptName} is an important concept. Review your notes and textbook for detailed explanations.`,
        example: 'Practice problems related to this concept to improve your understanding.',
        source: 'generic'
      });
    }
  });
}

module.exports = {
  generatePostQuizFeedback,
  generateRealTimeHint,
  explainConcept
};
