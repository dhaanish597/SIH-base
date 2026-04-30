// Feedback engine — Prisma version. Same external API:
//   generatePostQuizFeedback(studentId, quizResults)
//   generateRealTimeHint(questionId, studentAnswer, attemptNumber)
//   explainConcept(conceptName, studentLevel)

const prisma = require('../lib/prisma');
const learnerModel = require('./learnerModel');

const hintCache = new Map();

async function generatePostQuizFeedback(studentId, quizResults) {
  const { quizId, answers } = quizResults || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new Error('Invalid quiz results: answers array required');
  }

  // 1) Update concept mastery for each concept tag in each answer
  for (const a of answers) {
    if (Array.isArray(a.conceptTags)) {
      for (const concept of a.conceptTags) {
        try {
          await learnerModel.updateConceptMastery(studentId, concept, !!a.isCorrect, a.timeSpent || 0);
        } catch (e) {
          console.error(`mastery update failed for ${concept}:`, e.message);
        }
      }
    }
  }

  // 2) Per-concept stats
  const conceptStats = {};
  for (const a of answers) {
    const concepts = a.conceptTags || [];
    for (const concept of concepts) {
      if (!conceptStats[concept]) {
        conceptStats[concept] = { concept, total: 0, correct: 0, questions: [], errorTypes: {} };
      }
      conceptStats[concept].total++;
      if (a.isCorrect) conceptStats[concept].correct++;
      conceptStats[concept].questions.push({
        questionId: a.questionId,
        isCorrect: !!a.isCorrect,
        errorType: a.errorType || null,
      });
      if (!a.isCorrect && a.errorType) {
        conceptStats[concept].errorTypes[a.errorType] =
          (conceptStats[concept].errorTypes[a.errorType] || 0) + 1;
      }
    }
  }

  // 3) Build breakdown / strengths / weaknesses
  const conceptBreakdown = [];
  const strengths = [];
  const weaknesses = [];

  for (const stats of Object.values(conceptStats)) {
    const mastery = stats.total > 0 ? stats.correct / stats.total : 0;
    let feedback;
    if (mastery >= 0.8) {
      feedback = `Excellent work on ${stats.concept}! You're mastering this concept.`;
      strengths.push({ concept: stats.concept, mastery, questionsCount: stats.total });
    } else if (mastery >= 0.5) {
      feedback = `Good progress on ${stats.concept}. Keep practicing to improve further.`;
    } else {
      feedback = `Let's practice more ${stats.concept}. `;
      const errorTypes = Object.keys(stats.errorTypes);
      if (errorTypes.length > 0) {
        const dominant = errorTypes.reduce((a, b) =>
          stats.errorTypes[a] > stats.errorTypes[b] ? a : b,
        );
        switch (dominant) {
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
        concept: stats.concept,
        mastery,
        questionsCount: stats.total,
        errorTypes: stats.errorTypes,
      });
    }
    conceptBreakdown.push({
      concept: stats.concept,
      mastery: Math.round(mastery * 100) / 100,
      questions: stats.total,
      correct: stats.correct,
      feedback,
    });
  }

  // 4) Overall score
  const totalCorrect = answers.filter((a) => a.isCorrect).length;
  const overallScore = answers.length > 0 ? totalCorrect / answers.length : 0;

  // 5) Recommendations for weak concepts — try to surface lessons / quizzes
  // tagged with the concept the student has struggled with
  const recommendations = [];
  for (const w of weaknesses.slice(0, 5)) {
    const lessons = await prisma.lesson.findMany({
      where: {
        // Soft match — lesson title or content may mention the concept
        OR: [
          { title: { contains: w.concept, mode: 'insensitive' } },
          { content: { contains: w.concept, mode: 'insensitive' } },
        ],
      },
      include: { subject: true },
      take: 2,
    });
    for (const l of lessons) {
      recommendations.push({
        type: 'lesson',
        concept: w.concept,
        content: { id: l.id, title: l.title, subject: l.subject?.name || 'General' },
      });
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        lesson: {
          OR: [
            { title: { contains: w.concept, mode: 'insensitive' } },
            { content: { contains: w.concept, mode: 'insensitive' } },
          ],
        },
      },
      include: { lesson: { include: { subject: true } } },
      take: 2,
    });
    for (const q of quizzes) {
      recommendations.push({
        type: 'quiz',
        concept: w.concept,
        content: {
          id: q.id,
          title: `${q.lesson.title} - Quiz`,
          subject: q.lesson.subject?.name || 'General',
        },
      });
    }
  }

  // 6) Personalized message
  const scorePercent = Math.round(overallScore * 100);
  let personalizedMessage;
  if (overallScore >= 0.9) personalizedMessage = `Outstanding performance! You scored ${scorePercent}%. You're excelling across all concepts.`;
  else if (overallScore >= 0.7) personalizedMessage = `Great job! You scored ${scorePercent}%. You're doing well, with some areas to strengthen.`;
  else if (overallScore >= 0.5) personalizedMessage = `Good effort! You scored ${scorePercent}%. Focus on the concepts you found challenging.`;
  else personalizedMessage = `You scored ${scorePercent}%. Don't worry — every mistake is a learning opportunity. Review the concepts and try again!`;

  if (strengths.length > 0) personalizedMessage += ` You're particularly strong in: ${strengths.map((s) => s.concept).join(', ')}.`;
  if (weaknesses.length > 0) personalizedMessage += ` Focus on improving: ${weaknesses.map((w) => w.concept).join(', ')}.`;

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    conceptBreakdown,
    strengths,
    weaknesses,
    recommendations: recommendations.slice(0, 10),
    personalizedMessage,
  };
}

function generateRealTimeHint(questionId, studentAnswer, attemptNumber) {
  const attempt = Math.min(attemptNumber || 1, 3);
  const cacheKey = `${questionId}_${attempt}`;
  if (hintCache.has(cacheKey)) return hintCache.get(cacheKey);

  let hint = { attempt, message: '', type: 'general' };
  switch (attempt) {
    case 1:
      hint = { attempt, message: 'Think about the key concept here. What is this question really asking?', type: 'conceptual' };
      break;
    case 2:
      hint = { attempt, message: 'Remember: review the relevant formula or concept. Break the problem into smaller steps.', type: 'guided' };
      break;
    case 3:
      hint = {
        attempt,
        message:
          'Step-by-step: identify what you know and what you need to find. Then apply the appropriate method one step at a time.',
        type: 'detailed',
      };
      break;
    default:
      hint = { attempt, message: 'Take your time and think through each step carefully.', type: 'encouragement' };
  }
  hintCache.set(cacheKey, hint);
  setTimeout(() => hintCache.delete(cacheKey), 3600000);
  return hint;
}

const EXPLANATIONS = {
  linear_equations: {
    beginner: {
      text: 'A linear equation is like a balance scale. Both sides must be equal. For example, if x + 3 = 7, then x = 4 because 4 + 3 = 7.',
      example: 'Example: Solve x + 5 = 12. Subtract 5 from both sides: x = 7.',
    },
    intermediate: {
      text: 'Linear equations have variables raised to the power of 1. They form straight lines when graphed. The general form is y = mx + b.',
      example: 'Example: y = 2x + 3 has slope 2 and crosses the y-axis at (0, 3).',
    },
    advanced: {
      text: 'Linear equations represent proportional relationships. Solve via algebra, graphing, or matrices. Systems can have one, infinite, or no solutions.',
      example: 'Example: Solve 2x + y = 5 and x - y = 1: x = 2, y = 1.',
    },
  },
  fractions: {
    beginner: {
      text: 'A fraction shows parts of a whole. The numerator counts the parts you have; the denominator says how many parts make a whole.',
      example: 'Example: 3/4 means 3 out of 4 equal parts.',
    },
    intermediate: {
      text: 'To add/subtract fractions, find a common denominator. To multiply, multiply tops and bottoms. To divide, multiply by the reciprocal.',
      example: 'Example: 1/2 + 1/3 = 3/6 + 2/6 = 5/6.',
    },
    advanced: {
      text: 'Fractions are rational numbers. Convert to decimals/percents, simplify improper fractions, and apply rules consistently.',
      example: 'Example: (2/3) ÷ (4/5) = (2/3) × (5/4) = 5/6.',
    },
  },
  patterns: {
    beginner: {
      text: 'Patterns follow a rule. Look at what changes and what stays the same.',
      example: 'Example: 2, 4, 6, 8... add 2 each time.',
    },
    intermediate: {
      text: 'Patterns can be arithmetic (add/subtract) or geometric (multiply/divide). Find the rule, predict the next.',
      example: 'Example: 3, 6, 12, 24... multiply by 2.',
    },
    advanced: {
      text: 'Arithmetic: a_n = a_1 + (n-1)d. Geometric: a_n = a_1 × r^(n-1). Special sequences (e.g., Fibonacci) follow other rules.',
      example: 'Example: Fibonacci 1,1,2,3,5,8 — each is the sum of the prior two.',
    },
  },
  number_theory: {
    beginner: {
      text: 'Number theory studies whole numbers and their properties — like which numbers divide evenly into others.',
      example: 'Example: 6 has factors 1, 2, 3, 6.',
    },
    intermediate: {
      text: 'Topics: prime numbers, factors, multiples, divisibility rules.',
      example: 'Example: 7 is prime; only 1 and 7 divide it.',
    },
    advanced: {
      text: 'Modular arithmetic, GCD/LCM, and theorems like Fermat\'s Little Theorem.',
      example: 'Example: GCD(48, 18) = 6; LCM(48, 18) = 144.',
    },
  },
};

async function explainConcept(conceptName, studentLevel) {
  const level = studentLevel || 'beginner';
  const key = String(conceptName || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const c = EXPLANATIONS[key];
  if (c && c[level]) {
    return { concept: conceptName, level, explanation: c[level].text, example: c[level].example, source: 'built-in' };
  }
  return {
    concept: conceptName,
    level,
    explanation: `${conceptName} is an important concept. Review your notes and textbook for detailed explanations.`,
    example: 'Practice problems related to this concept to improve your understanding.',
    source: 'generic',
  };
}

module.exports = { generatePostQuizFeedback, generateRealTimeHint, explainConcept };
