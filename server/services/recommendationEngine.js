const { getSQLiteDb } = require('../db');
const learnerModel = require('./learnerModel');

/**
 * Get recommended content based on student's knowledge state and learning profile
 * @param {string} studentId - Student ID
 * @param {object} options - Options: { limit: 5, subject: null }
 * @returns {Promise<Array>} Array of recommended content items
 */
async function getRecommendedContent(studentId, options = {}) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    const { limit = 5, subject = null } = options;

    // Step 1: Get student knowledge state
    learnerModel.getStudentKnowledgeState(studentId)
      .then(knowledgeState => {
        // Extract weak and learning concepts
        const weakConcepts = knowledgeState.weak_concepts.map(c => c.concept_name);
        const learningConcepts = knowledgeState.learning_concepts.map(c => c.concept_name);
        const allTargetConcepts = [...weakConcepts, ...learningConcepts];

        // Step 2: Get learning profile
        sqliteDb.get(
          `SELECT preferred_learning_style, optimal_difficulty_level 
           FROM student_learning_profile 
           WHERE student_id = ?`,
          [studentId],
          (profileErr, profile) => {
            if (profileErr) {
              return reject(profileErr);
            }

            const preferredStyle = profile?.preferred_learning_style || 'mixed';
            const optimalDifficulty = profile?.optimal_difficulty_level || 0.5;
            const difficultyMin = Math.max(0, optimalDifficulty - 0.2);
            const difficultyMax = Math.min(1, optimalDifficulty + 0.2);

            // Helper function to determine content modality
            const getContentModality = (content, type) => {
              if (type === 'quiz') {
                return 'practice'; // Quizzes are practice/kinesthetic
              }
              // For lessons, infer from content
              const contentLower = (content || '').toLowerCase();
              if (contentLower.includes('video') || contentLower.includes('image') || 
                  contentLower.includes('interactive') || contentLower.includes('game')) {
                return 'visual';
              }
              // Default to reading for text-based lessons
              return 'reading';
            };

            // Helper function to check if modality matches learning style
            const modalityMatchesStyle = (modality, style) => {
              if (style === 'mixed') return true; // Mixed learners can use any modality
              if (style === 'visual' && modality === 'visual') return true;
              if (style === 'reading' && modality === 'reading') return true;
              if (style === 'kinesthetic' && modality === 'practice') return true;
              return false;
            };

            // Step 3: Query lessons
            let lessonsQuery = `
              SELECT id, title, subject, difficulty, language, content, created_at
              FROM lessons
              WHERE 1=1
            `;
            const lessonsParams = [];

            if (subject) {
              lessonsQuery += ` AND subject = ?`;
              lessonsParams.push(subject);
            }

            // Note: concept_tags field may not exist in lessons table yet
            // This query will work once concept_tags is added, or we can match via other means
            sqliteDb.all(lessonsQuery, lessonsParams, (lessonsErr, lessons) => {
              if (lessonsErr) {
                return reject(lessonsErr);
              }

              // Step 4: Query quizzes with their lessons
              const quizzesQuery = `
                SELECT q.id, q.lesson_id, q.total_points, q.grade, q.created_at,
                       l.title as lesson_title, l.subject, l.difficulty, l.language
                FROM quizzes q
                JOIN lessons l ON q.lesson_id = l.id
                WHERE 1=1
              `;
              const quizzesParams = [];

              if (subject) {
                quizzesQuery += ` AND l.subject = ?`;
                quizzesParams.push(subject);
              }

              sqliteDb.all(quizzesQuery, quizzesParams, (quizzesErr, quizzes) => {
                if (quizzesErr) {
                  return reject(quizzesErr);
                }

                // Step 5: Score and rank content
                const recommendations = [];

                // Process lessons
                lessons.forEach(lesson => {
                  let priorityScore = 0;
                  const reasons = [];

                  // Check difficulty match
                  const lessonDifficulty = lesson.difficulty / 10; // Normalize from 1-10 to 0-1
                  if (lessonDifficulty >= difficultyMin && lessonDifficulty <= difficultyMax) {
                    priorityScore += 0.3;
                    reasons.push('Matches optimal difficulty');
                  }

                  // Check learning style match
                  const lessonModality = getContentModality(lesson.content, 'lesson');
                  if (modalityMatchesStyle(lessonModality, preferredStyle)) {
                    priorityScore += 0.5; // Boost for matching learning style
                    reasons.push(`Recommended for your ${preferredStyle} learning style`);
                  }

                  // Subject match (already filtered, but add reason)
                  if (subject && lesson.subject === subject) {
                    reasons.push(`Subject: ${subject}`);
                  }

                  // Estimate time based on difficulty (higher difficulty = more time)
                  const estimatedTime = Math.round(15 + (lessonDifficulty * 15)); // 15-30 minutes

                  recommendations.push({
                    type: 'lesson',
                    id: lesson.id,
                    title: lesson.title,
                    subject: lesson.subject,
                    chapter: null, // Not in schema
                    reason: reasons.length > 0 ? reasons.join(', ') : 'Available content',
                    priority_score: priorityScore,
                    estimatedTime: estimatedTime,
                    difficulty: lessonDifficulty,
                    modality: lessonModality,
                    matchesLearningStyle: modalityMatchesStyle(lessonModality, preferredStyle)
                  });
                });

                // Process quizzes
                quizzes.forEach(quiz => {
                  let priorityScore = 0;
                  const reasons = [];

                  // Check difficulty match
                  const quizDifficulty = quiz.difficulty / 10; // Normalize from 1-10 to 0-1
                  if (quizDifficulty >= difficultyMin && quizDifficulty <= difficultyMax) {
                    priorityScore += 0.3;
                    reasons.push('Matches optimal difficulty');
                  }

                  // Check learning style match (quizzes are practice/kinesthetic)
                  const quizModality = 'practice';
                  if (modalityMatchesStyle(quizModality, preferredStyle)) {
                    priorityScore += 0.5; // Boost for matching learning style
                    reasons.push(`Recommended for your ${preferredStyle} learning style`);
                  }

                  // Subject match
                  if (subject && quiz.subject === subject) {
                    reasons.push(`Subject: ${subject}`);
                  }

                  // Estimate time based on total points (assume 1 point = 1 minute)
                  const estimatedTime = Math.max(5, Math.min(30, quiz.total_points));

                  recommendations.push({
                    type: 'quiz',
                    id: quiz.id,
                    title: quiz.lesson_title || `Quiz for ${quiz.lesson_id}`,
                    subject: quiz.subject,
                    chapter: null,
                    reason: reasons.join(', '),
                    priority_score: priorityScore,
                    estimatedTime: estimatedTime,
                    difficulty: quizDifficulty,
                    lesson_id: quiz.lesson_id,
                    modality: quizModality,
                    matchesLearningStyle: modalityMatchesStyle(quizModality, preferredStyle)
                  });
                });

                // Step 6: Enhance scoring with concept matching
                // Query student_progress to find lessons that target weak/learning concepts
                if (allTargetConcepts.length > 0) {
                  sqliteDb.all(
                    `SELECT DISTINCT lesson_id, concept_tags 
                     FROM student_progress 
                     WHERE student_id = ? AND concept_tags IS NOT NULL AND concept_tags != ''`,
                    [studentId],
                    (progressErr, progressRecords) => {
                      if (!progressErr && progressRecords && progressRecords.length > 0) {
                        progressRecords.forEach(progress => {
                          try {
                            const conceptTags = JSON.parse(progress.concept_tags || '[]');
                            const matchingConcepts = conceptTags.filter(c => 
                              allTargetConcepts.includes(c)
                            );

                            if (matchingConcepts.length > 0) {
                              // Find recommendation for this lesson
                              const rec = recommendations.find(r => 
                                r.id === progress.lesson_id || r.lesson_id === progress.lesson_id
                              );

                              if (rec) {
                                // Check if any matching concepts are weak
                                const weakMatches = matchingConcepts.filter(c => 
                                  weakConcepts.includes(c)
                                );
                                const learningMatches = matchingConcepts.filter(c => 
                                  learningConcepts.includes(c)
                                );

                                if (weakMatches.length > 0) {
                                  rec.priority_score += 1.0;
                                  rec.reason = `Targets weak concepts: ${weakMatches.join(', ')}`;
                                } else if (learningMatches.length > 0) {
                                  rec.priority_score += 0.7;
                                  rec.reason = `Targets learning concepts: ${learningMatches.join(', ')}`;
                                }
                              } else {
                                // Lesson not in recommendations yet, but targets concepts
                                // Could add it, but for now we'll skip to avoid duplicates
                              }
                            }
                          } catch (e) {
                            // Invalid JSON, skip
                          }
                        });
                      }

                      // Sort by priority score descending
                      recommendations.sort((a, b) => b.priority_score - a.priority_score);

                      // Return top N recommendations
                      resolve(recommendations.slice(0, limit));
                    }
                  );
                } else {
                  // No target concepts, just sort and return
                  recommendations.sort((a, b) => b.priority_score - a.priority_score);
                  resolve(recommendations.slice(0, limit));
                }
              });
            });
          }
        );
      })
      .catch(reject);
  });
}

/**
 * Get personalized learning path for a subject
 * @param {string} studentId - Student ID
 * @param {string} subject - Subject name
 * @returns {Promise<Array>} Ordered sequence of content
 */
async function getPersonalizedLearningPath(studentId, subject) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Get all lessons and quizzes for the subject
    sqliteDb.all(
      `SELECT l.id, l.title, l.difficulty, l.subject,
              'lesson' as type
       FROM lessons l
       WHERE l.subject = ?
       
       UNION ALL
       
       SELECT q.id, l.title || ' - Quiz' as title, l.difficulty, l.subject,
              'quiz' as type
       FROM quizzes q
       JOIN lessons l ON q.lesson_id = l.id
       WHERE l.subject = ?
       
       ORDER BY difficulty ASC`,
      [subject, subject],
      (err, contentItems) => {
        if (err) {
          return reject(err);
        }

        // Get student's concept mastery
        sqliteDb.all(
          `SELECT concept_name, mastery_level 
           FROM concept_mastery 
           WHERE student_id = ?`,
          [studentId],
          (masteryErr, masteryRecords) => {
            if (masteryErr) {
              return reject(masteryErr);
            }

            const masteryMap = {};
            masteryRecords.forEach(m => {
              masteryMap[m.concept_name] = m.mastery_level;
            });

            // Build learning path
            // For now, order by difficulty (prerequisites would need a separate table)
            // In a real system, you'd have a prerequisites table
            const learningPath = contentItems.map((item, index) => {
              // Check prerequisites (would need concept_tags or prerequisites table)
              // For now, assume prerequisites are concepts with lower difficulty
              const prerequisites = [];
              
              // Estimate prerequisites based on difficulty
              if (item.difficulty > 1) {
                prerequisites.push(`Master concepts at difficulty ${item.difficulty - 1}`);
              }

              // Estimate time based on type and difficulty
              const baseTime = item.type === 'quiz' ? 10 : 20;
              const estimatedTime = baseTime + (item.difficulty * 2);

              return {
                order: index + 1,
                contentId: item.id,
                type: item.type,
                title: item.title,
                estimatedTime: estimatedTime,
                prerequisites: prerequisites,
                difficulty: item.difficulty
              };
            });

            resolve(learningPath);
          }
        );
      }
    );
  });
}

/**
 * Get review recommendations based on spaced repetition
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Concepts that need review
 */
async function getReviewRecommendations(studentId) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Find concepts with mastery > 0.8 but last practiced > 7 days ago
    sqliteDb.all(
      `SELECT concept_name, mastery_level, last_practiced,
              CAST((julianday('now') - julianday(last_practiced)) AS INTEGER) as days_since_practice
       FROM concept_mastery
       WHERE student_id = ?
         AND mastery_level > 0.8
         AND last_practiced IS NOT NULL
         AND julianday('now') - julianday(last_practiced) > 7
       ORDER BY days_since_practice DESC`,
      [studentId],
      (err, concepts) => {
        if (err) {
          return reject(err);
        }

        // For each concept, find related content
        const reviewRecommendations = [];
        let processed = 0;

        if (concepts.length === 0) {
          return resolve([]);
        }

        concepts.forEach(concept => {
          // Find lessons/quizzes that might cover this concept
          // We'll search student_progress for concept_tags containing this concept
          sqliteDb.all(
            `SELECT DISTINCT sp.lesson_id, l.title, l.subject, l.difficulty,
                    'lesson' as type
             FROM student_progress sp
             JOIN lessons l ON sp.lesson_id = l.id
             WHERE sp.student_id = ?
               AND sp.concept_tags IS NOT NULL
               AND sp.concept_tags LIKE ?
             LIMIT 3`,
            [studentId, `%${concept.concept_name}%`],
            (contentErr, recommendedContent) => {
              processed++;

              // Also check quizzes
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
                [studentId, `%${concept.concept_name}%`],
                (quizErr, quizzes) => {
                  const allContent = [
                    ...(recommendedContent || []),
                    ...(quizzes || [])
                  ].map(c => ({
                    id: c.id || c.lesson_id,
                    type: c.type,
                    title: c.title,
                    subject: c.subject
                  }));

                  reviewRecommendations.push({
                    concept_name: concept.concept_name,
                    subject: allContent[0]?.subject || 'General',
                    mastery_level: concept.mastery_level,
                    days_since_practice: concept.days_since_practice,
                    recommendedContent: allContent
                  });

                  // When all concepts are processed, resolve
                  if (processed === concepts.length) {
                    resolve(reviewRecommendations);
                  }
                }
              );
            }
          );
        });
      }
    );
  });
}

module.exports = {
  getRecommendedContent,
  getPersonalizedLearningPath,
  getReviewRecommendations
};
