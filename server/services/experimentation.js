const { getSQLiteDb } = require('../db');

const STRATEGIES = ['mastery_based', 'sequence_based', 'engagement_based'];

/**
 * Get or assign a recommendation strategy for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<string>} Strategy name
 */
async function getStudentStrategy(studentId) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Check if student already has an assigned strategy
    sqliteDb.get(
      `SELECT strategy FROM experiments WHERE student_id = ?`,
      [studentId],
      (err, existing) => {
        if (err) {
          return reject(err);
        }

        if (existing && existing.strategy) {
          // Student already has a strategy assigned
          return resolve(existing.strategy);
        }

        // Assign a random strategy (50/50 split between strategies)
        // For simplicity, we'll use a hash of student_id to ensure consistent assignment
        const hash = simpleHash(studentId);
        const strategyIndex = hash % STRATEGIES.length;
        const assignedStrategy = STRATEGIES[strategyIndex];

        // Store the assignment
        const experimentId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        sqliteDb.run(
          `INSERT INTO experiments (id, student_id, strategy, assigned_at, last_updated)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [experimentId, studentId, assignedStrategy],
          (insertErr) => {
            if (insertErr) {
              // If insert fails, try to update (in case of race condition)
              sqliteDb.run(
                `UPDATE experiments SET strategy = ?, last_updated = CURRENT_TIMESTAMP WHERE student_id = ?`,
                [assignedStrategy, studentId],
                (updateErr) => {
                  if (updateErr) {
                    return reject(updateErr);
                  }
                  resolve(assignedStrategy);
                }
              );
            } else {
              resolve(assignedStrategy);
            }
          }
        );
      }
    );
  });
}

/**
 * Track experiment outcomes for a student
 * @param {string} studentId - Student ID
 * @param {Object} outcomes - { learningGains, engagement, completion }
 * @returns {Promise<Object>} Updated experiment record
 */
async function trackOutcomes(studentId, outcomes) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    const { learningGains, engagement, completion } = outcomes;

    // Get current experiment record
    sqliteDb.get(
      `SELECT * FROM experiments WHERE student_id = ?`,
      [studentId],
      (err, existing) => {
        if (err) {
          return reject(err);
        }

        if (!existing) {
          // Create new experiment record if it doesn't exist
          const experimentId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          const defaultStrategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];
          
          sqliteDb.run(
            `INSERT INTO experiments (id, student_id, strategy, learning_gains, engagement_score, completion_rate, assigned_at, last_updated)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [experimentId, studentId, defaultStrategy, learningGains || null, engagement || null, completion || null],
            (insertErr) => {
              if (insertErr) {
                return reject(insertErr);
              }
              resolve({
                studentId,
                strategy: defaultStrategy,
                learningGains: learningGains || null,
                engagement: engagement || null,
                completion: completion || null
              });
            }
          );
        } else {
          // Update existing record
          // Use exponential moving average to update metrics
          const currentLearningGains = existing.learning_gains || 0;
          const currentEngagement = existing.engagement_score || 0;
          const currentCompletion = existing.completion_rate || 0;

          const newLearningGains = learningGains !== null && learningGains !== undefined
            ? (currentLearningGains * 0.7) + (learningGains * 0.3)
            : currentLearningGains;

          const newEngagement = engagement !== null && engagement !== undefined
            ? (currentEngagement * 0.7) + (engagement * 0.3)
            : currentEngagement;

          const newCompletion = completion !== null && completion !== undefined
            ? (currentCompletion * 0.7) + (completion * 0.3)
            : currentCompletion;

          sqliteDb.run(
            `UPDATE experiments 
             SET learning_gains = ?,
                 engagement_score = ?,
                 completion_rate = ?,
                 last_updated = CURRENT_TIMESTAMP
             WHERE student_id = ?`,
            [newLearningGains, newEngagement, newCompletion, studentId],
            (updateErr) => {
              if (updateErr) {
                return reject(updateErr);
              }
              resolve({
                studentId,
                strategy: existing.strategy,
                learningGains: newLearningGains,
                engagement: newEngagement,
                completion: newCompletion
              });
            }
          );
        }
      }
    );
  });
}

/**
 * Get experiment statistics for all strategies
 * @returns {Promise<Array>} Statistics for each strategy
 */
async function getExperimentStats() {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    sqliteDb.all(
      `SELECT 
        strategy,
        COUNT(*) as student_count,
        AVG(learning_gains) as avg_learning_gains,
        AVG(engagement_score) as avg_engagement,
        AVG(completion_rate) as avg_completion
       FROM experiments
       GROUP BY strategy`,
      [],
      (err, results) => {
        if (err) {
          return reject(err);
        }

        const stats = STRATEGIES.map(strategy => {
          const result = results.find(r => r.strategy === strategy);
          return {
            strategy,
            studentCount: result?.student_count || 0,
            avgLearningGains: result?.avg_learning_gains ? Math.round(result.avg_learning_gains * 100) / 100 : 0,
            avgEngagement: result?.avg_engagement ? Math.round(result.avg_engagement * 100) / 100 : 0,
            avgCompletion: result?.avg_completion ? Math.round(result.avg_completion * 100) / 100 : 0
          };
        });

        resolve(stats);
      }
    );
  });
}

/**
 * Simple hash function for consistent student assignment
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

module.exports = {
  getStudentStrategy,
  trackOutcomes,
  getExperimentStats
};
