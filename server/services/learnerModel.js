const { getSQLiteDb } = require('../db');

/**
 * Updates concept mastery using exponential moving average
 * Formula: mastery = (mastery * 0.7) + (isCorrect ? 0.3 : 0)
 * Also updates confidence score based on consistency
 */
async function updateConceptMastery(studentId, conceptName, isCorrect, timeSpent) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Get existing mastery record
    sqliteDb.get(
      `SELECT * FROM concept_mastery WHERE student_id = ? AND concept_name = ?`,
      [studentId, conceptName],
      (err, existing) => {
        if (err) {
          return reject(err);
        }

        if (existing) {
          // Update existing record using exponential moving average
          const newMastery = (existing.mastery_level * 0.7) + (isCorrect ? 0.3 : 0);
          const newAttemptsCount = existing.attempts_count + 1;
          const newCorrectCount = existing.correct_count + (isCorrect ? 1 : 0);
          
          // Calculate average time spent
          const totalTime = (existing.average_time_spent || 0) * (newAttemptsCount - 1) + timeSpent;
          const newAverageTime = totalTime / newAttemptsCount;

          // Calculate confidence score based on consistency
          // Higher confidence if more attempts and consistent performance
          const accuracy = newCorrectCount / newAttemptsCount;
          const consistency = 1 - Math.abs(accuracy - newMastery); // How close accuracy is to mastery
          const newConfidence = Math.min(0.95, Math.max(0.1, (consistency * 0.6) + (Math.min(newAttemptsCount / 20, 1) * 0.4)));

          sqliteDb.run(
            `UPDATE concept_mastery 
             SET mastery_level = ?, 
                 confidence_score = ?, 
                 last_practiced = CURRENT_TIMESTAMP,
                 attempts_count = ?,
                 correct_count = ?,
                 average_time_spent = ?
             WHERE id = ?`,
            [newMastery, newConfidence, newAttemptsCount, newCorrectCount, newAverageTime, existing.id],
            function(updateErr) {
              if (updateErr) {
                return reject(updateErr);
              }
              resolve({
                id: existing.id,
                mastery_level: newMastery,
                confidence_score: newConfidence,
                attempts_count: newAttemptsCount,
                correct_count: newCorrectCount
              });
            }
          );
        } else {
          // Create new record
          const id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          const initialMastery = isCorrect ? 0.3 : 0;
          const initialConfidence = 0.1;

          sqliteDb.run(
            `INSERT INTO concept_mastery 
             (id, student_id, concept_name, mastery_level, confidence_score, last_practiced, attempts_count, correct_count, average_time_spent)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1, ?, ?)`,
            [id, studentId, conceptName, initialMastery, initialConfidence, isCorrect ? 1 : 0, timeSpent],
            function(insertErr) {
              if (insertErr) {
                return reject(insertErr);
              }
              resolve({
                id,
                mastery_level: initialMastery,
                confidence_score: initialConfidence,
                attempts_count: 1,
                correct_count: isCorrect ? 1 : 0
              });
            }
          );
        }
      }
    );
  });
}

/**
 * Returns student's knowledge state with concepts categorized by mastery level
 */
async function getStudentKnowledgeState(studentId) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    sqliteDb.all(
      `SELECT concept_name, mastery_level, confidence_score, last_practiced, attempts_count, correct_count
       FROM concept_mastery 
       WHERE student_id = ?
       ORDER BY mastery_level DESC`,
      [studentId],
      (err, concepts) => {
        if (err) {
          return reject(err);
        }

        const mastered = [];
        const learning = [];
        const weak = [];
        let totalMastery = 0;

        concepts.forEach(concept => {
          totalMastery += concept.mastery_level;
          
          if (concept.mastery_level > 0.8) {
            mastered.push({
              concept_name: concept.concept_name,
              mastery_level: concept.mastery_level,
              confidence_score: concept.confidence_score,
              last_practiced: concept.last_practiced,
              attempts_count: concept.attempts_count,
              correct_count: concept.correct_count
            });
          } else if (concept.mastery_level >= 0.3) {
            learning.push({
              concept_name: concept.concept_name,
              mastery_level: concept.mastery_level,
              confidence_score: concept.confidence_score,
              last_practiced: concept.last_practiced,
              attempts_count: concept.attempts_count,
              correct_count: concept.correct_count
            });
          } else {
            weak.push({
              concept_name: concept.concept_name,
              mastery_level: concept.mastery_level,
              confidence_score: concept.confidence_score,
              last_practiced: concept.last_practiced,
              attempts_count: concept.attempts_count,
              correct_count: concept.correct_count
            });
          }
        });

        const overallMasteryScore = concepts.length > 0 ? totalMastery / concepts.length : 0;

        resolve({
          mastered_concepts: mastered,
          learning_concepts: learning,
          weak_concepts: weak,
          overall_mastery_score: overallMasteryScore,
          total_concepts: concepts.length
        });
      }
    );
  });
}

/**
 * Updates student learning profile based on activity data
 * activityData: { timeSpent, questionsAnswered, correctAnswers, modality }
 */
async function updateLearningProfile(studentId, activityData) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    const { timeSpent, questionsAnswered, correctAnswers, modality } = activityData;

    // Get existing profile
    sqliteDb.get(
      `SELECT * FROM student_learning_profile WHERE student_id = ?`,
      [studentId],
      (err, existing) => {
        if (err) {
          return reject(err);
        }

        if (existing) {
          // Update learning velocity (questions per minute)
          const currentVelocity = existing.average_learning_velocity || 0;
          const sessionVelocity = questionsAnswered > 0 && timeSpent > 0 
            ? (questionsAnswered / (timeSpent / 60)) 
            : currentVelocity;
          const newVelocity = (currentVelocity * 0.7) + (sessionVelocity * 0.3);

          // Update optimal difficulty based on performance
          const accuracy = questionsAnswered > 0 ? correctAnswers / questionsAnswered : 0;
          // If accuracy is too high (>0.9), increase difficulty; if too low (<0.6), decrease
          let newOptimalDifficulty = existing.optimal_difficulty_level || 0.5;
          if (accuracy > 0.9) {
            newOptimalDifficulty = Math.min(1.0, newOptimalDifficulty + 0.05);
          } else if (accuracy < 0.6) {
            newOptimalDifficulty = Math.max(0.1, newOptimalDifficulty - 0.05);
          }

          // Update engagement score (based on activity frequency and performance)
          const engagementBoost = questionsAnswered > 5 ? 0.1 : 0.05;
          const newEngagement = Math.min(1.0, (existing.engagement_score || 0.5) + engagementBoost);

          // Update time spent by modality
          const styleMap = {
            'visual': 'visual',
            'video': 'visual',
            'interactive': 'practice',
            'practice': 'practice',
            'kinesthetic': 'practice',
            'text': 'reading',
            'reading': 'reading'
          };
          
          const modalityType = modality ? styleMap[modality.toLowerCase()] : null;
          let timeVisual = existing.time_spent_visual || 0;
          let timeReading = existing.time_spent_reading || 0;
          let timePractice = existing.time_spent_practice || 0;
          
          // Add time spent to appropriate modality
          if (modalityType === 'visual') {
            timeVisual += timeSpent || 0;
          } else if (modalityType === 'reading') {
            timeReading += timeSpent || 0;
          } else if (modalityType === 'practice') {
            timePractice += timeSpent || 0;
          }

          // Update preferred learning style based on modality (legacy logic)
          let newStyle = existing.preferred_learning_style || 'mixed';
          if (modality) {
            const mappedStyle = styleMap[modality.toLowerCase()];
            if (mappedStyle === 'visual') {
              newStyle = 'visual';
            } else if (mappedStyle === 'reading') {
              newStyle = 'reading';
            } else if (mappedStyle === 'practice') {
              newStyle = 'kinesthetic';
            }
          }

          sqliteDb.run(
            `UPDATE student_learning_profile 
             SET preferred_learning_style = ?,
                 average_learning_velocity = ?,
                 optimal_difficulty_level = ?,
                 engagement_score = ?,
                 time_spent_visual = ?,
                 time_spent_reading = ?,
                 time_spent_practice = ?,
                 last_updated = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [newStyle, newVelocity, newOptimalDifficulty, newEngagement, timeVisual, timeReading, timePractice, existing.id],
            function(updateErr) {
              if (updateErr) {
                return reject(updateErr);
              }
              resolve({
                id: existing.id,
                preferred_learning_style: newStyle,
                average_learning_velocity: newVelocity,
                optimal_difficulty_level: newOptimalDifficulty,
                engagement_score: newEngagement
              });
            }
          );
        } else {
          // Create new profile
          const id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          const initialVelocity = questionsAnswered > 0 && timeSpent > 0 
            ? (questionsAnswered / (timeSpent / 60)) 
            : 1.0;
          const initialDifficulty = 0.5;
          const initialEngagement = 0.5;
          
          const styleMap = {
            'visual': 'visual',
            'video': 'visual',
            'interactive': 'kinesthetic',
            'text': 'reading',
            'reading': 'reading',
            'kinesthetic': 'kinesthetic'
          };
          const initialStyle = modality ? (styleMap[modality.toLowerCase()] || 'mixed') : 'mixed';

          // Initialize time spent by modality based on initial modality
          let initialTimeVisual = 0;
          let initialTimeReading = 0;
          let initialTimePractice = 0;
          
          if (modality) {
            const mappedStyle = styleMap[modality.toLowerCase()];
            if (mappedStyle === 'visual') {
              initialTimeVisual = timeSpent || 0;
            } else if (mappedStyle === 'reading') {
              initialTimeReading = timeSpent || 0;
            } else if (mappedStyle === 'practice') {
              initialTimePractice = timeSpent || 0;
            }
          }

          sqliteDb.run(
            `INSERT INTO student_learning_profile 
             (id, student_id, preferred_learning_style, average_learning_velocity, optimal_difficulty_level, engagement_score, time_spent_visual, time_spent_reading, time_spent_practice, last_updated)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [id, studentId, initialStyle, initialVelocity, initialDifficulty, initialEngagement, initialTimeVisual, initialTimeReading, initialTimePractice],
            function(insertErr) {
              if (insertErr) {
                return reject(insertErr);
              }
              resolve({
                id,
                preferred_learning_style: initialStyle,
                average_learning_velocity: initialVelocity,
                optimal_difficulty_level: initialDifficulty,
                engagement_score: initialEngagement
              });
            }
          );
        }
      }
    );
  });
}

/**
 * Detect learning style based on time spent in different modalities
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Detected learning style and percentages
 */
async function detectLearningStyle(studentId) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Get learning profile with time spent by modality
    sqliteDb.get(
      `SELECT 
        time_spent_visual,
        time_spent_reading,
        time_spent_practice,
        preferred_learning_style
       FROM student_learning_profile
       WHERE student_id = ?`,
      [studentId],
      (err, profile) => {
        if (err) {
          return reject(err);
        }

        if (!profile) {
          // No profile exists, return default
          return resolve({
            learningStyle: 'mixed',
            percentages: {
              visual: 0,
              reading: 0,
              practice: 0
            },
            confidence: 0
          });
        }

        const timeVisual = profile.time_spent_visual || 0;
        const timeReading = profile.time_spent_reading || 0;
        const timePractice = profile.time_spent_practice || 0;
        const totalTime = timeVisual + timeReading + timePractice;

        // Calculate percentages
        const percentages = {
          visual: totalTime > 0 ? (timeVisual / totalTime) * 100 : 0,
          reading: totalTime > 0 ? (timeReading / totalTime) * 100 : 0,
          practice: totalTime > 0 ? (timePractice / totalTime) * 100 : 0
        };

        // Determine learning style based on percentages
        let detectedStyle = 'mixed';
        const threshold = 60; // 60% threshold

        if (percentages.visual >= threshold) {
          detectedStyle = 'visual';
        } else if (percentages.reading >= threshold) {
          detectedStyle = 'reading';
        } else if (percentages.practice >= threshold) {
          detectedStyle = 'kinesthetic';
        } else {
          detectedStyle = 'mixed';
        }

        // Calculate confidence based on how clear the preference is
        const maxPercentage = Math.max(percentages.visual, percentages.reading, percentages.practice);
        const confidence = totalTime > 0 ? Math.min(1.0, maxPercentage / 100) : 0;

        // Update profile if style has changed
        if (detectedStyle !== profile.preferred_learning_style) {
          sqliteDb.run(
            `UPDATE student_learning_profile
             SET preferred_learning_style = ?,
                 last_updated = CURRENT_TIMESTAMP
             WHERE student_id = ?`,
            [detectedStyle, studentId],
            (updateErr) => {
              if (updateErr) {
                console.error('Error updating learning style:', updateErr);
                // Don't fail, just log the error
              }
              resolve({
                learningStyle: detectedStyle,
                percentages,
                confidence,
                previousStyle: profile.preferred_learning_style,
                updated: true
              });
            }
          );
        } else {
          resolve({
            learningStyle: detectedStyle,
            percentages,
            confidence,
            previousStyle: profile.preferred_learning_style,
            updated: false
          });
        }
      }
    );
  });
}

/**
 * Returns recommended difficulty level (0-1) based on recent performance
 */
async function getRecommendedDifficulty(studentId, subject) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Get learning profile for optimal difficulty
    sqliteDb.get(
      `SELECT optimal_difficulty_level, engagement_score 
       FROM student_learning_profile 
       WHERE student_id = ?`,
      [studentId],
      (err, profile) => {
        if (err) {
          return reject(err);
        }

        if (profile && profile.optimal_difficulty_level !== null) {
          // Use profile's optimal difficulty as base
          let recommendedDifficulty = profile.optimal_difficulty_level;

          // Adjust based on recent performance in the subject
          // Get recent progress for this subject (if subject filtering is available)
          sqliteDb.all(
            `SELECT sp.score, sp.time_spent, sp.attempts, l.difficulty
             FROM student_progress sp
             JOIN lessons l ON sp.lesson_id = l.id
             WHERE sp.student_id = ? 
               AND l.subject = ?
               AND sp.completed_at >= datetime('now', '-7 days')
             ORDER BY sp.completed_at DESC
             LIMIT 10`,
            [studentId, subject],
            (progressErr, recentProgress) => {
              if (progressErr) {
                // If error, just return profile difficulty
                return resolve({
                  difficulty: recommendedDifficulty,
                  source: 'profile',
                  confidence: profile.engagement_score || 0.5
                });
              }

              if (recentProgress && recentProgress.length > 0) {
                // Calculate average performance
                const avgScore = recentProgress.reduce((sum, p) => sum + (p.score || 0), 0) / recentProgress.length;
                const avgDifficultyRaw = recentProgress.reduce((sum, p) => sum + (p.difficulty || 5), 0) / recentProgress.length;
                
                // Normalize lesson difficulty from integer (1-10) to 0-1 scale
                const avgDifficulty = avgDifficultyRaw / 10;
                
                // Normalize score (assuming max score is 100)
                const normalizedScore = avgScore / 100;

                // Adjust difficulty: if performing well, increase; if struggling, decrease
                if (normalizedScore > 0.8) {
                  recommendedDifficulty = Math.min(1.0, recommendedDifficulty + 0.1);
                } else if (normalizedScore < 0.6) {
                  recommendedDifficulty = Math.max(0.1, recommendedDifficulty - 0.1);
                }

                // Blend with recent average difficulty
                recommendedDifficulty = (recommendedDifficulty * 0.6) + (avgDifficulty * 0.4);
              }

              resolve({
                difficulty: Math.max(0.1, Math.min(1.0, recommendedDifficulty)),
                source: recentProgress && recentProgress.length > 0 ? 'recent_performance' : 'profile',
                confidence: profile.engagement_score || 0.5
              });
            }
          );
        } else {
          // No profile exists, return default difficulty
          resolve({
            difficulty: 0.5,
            source: 'default',
            confidence: 0.3
          });
        }
      }
    );
  });
}

module.exports = {
  updateConceptMastery,
  getStudentKnowledgeState,
  updateLearningProfile,
  getRecommendedDifficulty,
  detectLearningStyle
};
