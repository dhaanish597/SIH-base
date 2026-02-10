const { getSQLiteDb } = require('../db');

/**
 * Calculate optimal pacing parameters for a student
 * @param {string} studentId - Student ID
 * @param {string} subject - Subject (optional filter)
 * @returns {Promise<Object>} Pacing object with recommendations
 */
async function calculateOptimalPacing(studentId, subject = null) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Get student learning profile
    sqliteDb.get(
      `SELECT 
        average_learning_velocity,
        engagement_score,
        optimal_difficulty_level,
        preferred_learning_style
       FROM student_learning_profile
       WHERE student_id = ?`,
      [studentId],
      (profileErr, profile) => {
        if (profileErr) {
          return reject(profileErr);
        }

        // If no profile exists, create default values
        const velocity = profile?.average_learning_velocity || 1.0; // questions per minute
        const engagement = profile?.engagement_score || 0.5;
        const difficulty = profile?.optimal_difficulty_level || 0.5;

        // Calculate questions per session based on velocity and engagement
        // Base: velocity * 15 minutes (typical session)
        // Adjust based on engagement: higher engagement = longer sessions
        const baseSessionMinutes = 15;
        const engagementMultiplier = 0.5 + (engagement * 1.0); // Range: 0.5 to 1.5
        const sessionMinutes = baseSessionMinutes * engagementMultiplier;
        const questionsPerSession = Math.round(velocity * sessionMinutes);

        // Break frequency: suggest break every 20-30 minutes
        // Higher engagement = longer before break needed
        const baseBreakInterval = 20; // minutes
        const breakIntervalMinutes = baseBreakInterval + (engagement * 10); // 20-30 min range
        const breakFrequency = Math.round(breakIntervalMinutes);

        // Optimal session duration based on engagement patterns
        // Analyze recent sessions to find optimal length
        let sessionDurationMinutes = sessionMinutes;

        // Query recent session data to find average session duration
        let sessionQuery = `
          SELECT 
            DATE(completed_at) as session_date,
            COUNT(*) as questions_count,
            SUM(time_spent) as total_time_seconds,
            MAX(completed_at) - MIN(completed_at) as session_span_seconds
          FROM student_progress
          WHERE student_id = ?
            AND completed_at >= datetime('now', '-7 days')
        `;
        const sessionParams = [studentId];

        if (subject) {
          sessionQuery += ` AND lesson_id IN (SELECT id FROM lessons WHERE subject = ?)`;
          sessionParams.push(subject);
        }

        sessionQuery += `
          GROUP BY DATE(completed_at)
          ORDER BY session_date DESC
          LIMIT 10
        `;

        sqliteDb.all(sessionQuery, sessionParams, (sessionErr, sessions) => {
          if (sessionErr) {
            // If query fails, use defaults
            return resolve({
              questionsPerSession: Math.max(5, Math.min(questionsPerSession, 50)),
              breakFrequency: breakFrequency,
              sessionDuration: Math.round(sessionDurationMinutes),
              dailyGoal: Math.round(questionsPerSession * 2), // 2 sessions per day
              recommendations: {
                optimalSessionLength: `${Math.round(sessionDurationMinutes)} minutes`,
                breakAfter: `${breakFrequency} minutes`,
                questionsPerDay: Math.round(questionsPerSession * 2)
              }
            });
          }

          // Calculate average session duration from recent sessions
          if (sessions && sessions.length > 0) {
            const totalDuration = sessions.reduce((sum, s) => {
              // Use session_span_seconds if available, otherwise estimate from time_spent
              const duration = s.session_span_seconds || (s.total_time_seconds || 0);
              return sum + duration;
            }, 0);
            const avgDurationSeconds = totalDuration / sessions.length;
            const avgDurationMinutes = avgDurationSeconds / 60;

            // Use actual average if it's reasonable (between 5 and 60 minutes)
            if (avgDurationMinutes >= 5 && avgDurationMinutes <= 60) {
              sessionDurationMinutes = avgDurationMinutes;
            }
          }

          // Daily goal: Based on velocity and engagement
          // Higher engagement = more questions per day
          const baseDailyGoal = velocity * 30; // 30 minutes of learning per day
          const engagementBoost = engagement * 0.5; // Up to 50% boost
          const dailyGoal = Math.round(baseDailyGoal * (1 + engagementBoost));

          resolve({
            questionsPerSession: Math.max(5, Math.min(questionsPerSession, 50)),
            breakFrequency: breakFrequency,
            sessionDuration: Math.round(sessionDurationMinutes),
            dailyGoal: Math.max(10, Math.min(dailyGoal, 100)),
            recommendations: {
              optimalSessionLength: `${Math.round(sessionDurationMinutes)} minutes`,
              breakAfter: `${breakFrequency} minutes`,
              questionsPerDay: Math.max(10, Math.min(dailyGoal, 100)),
              velocity: Math.round(velocity * 10) / 10,
              engagementLevel: Math.round(engagement * 100) + '%'
            }
          });
        });
      }
    );
  });
}

/**
 * Check if student should take a break based on current session time
 * @param {string} studentId - Student ID
 * @param {number} currentSessionTime - Current session time in minutes
 * @returns {Promise<Object>} Object with shouldBreak boolean and reason
 */
async function shouldTakeBreak(studentId, currentSessionTime) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Get optimal session duration from profile
    sqliteDb.get(
      `SELECT 
        average_learning_velocity,
        engagement_score
       FROM student_learning_profile
       WHERE student_id = ?`,
      [studentId],
      (profileErr, profile) => {
        if (profileErr) {
          return reject(profileErr);
        }

        const engagement = profile?.engagement_score || 0.5;
        
        // Calculate optimal duration based on engagement
        // Higher engagement = can work longer before break
        const baseOptimalDuration = 20; // minutes
        const engagementAdjustment = engagement * 10; // 0-10 minutes adjustment
        const optimalDuration = baseOptimalDuration + engagementAdjustment; // 20-30 minutes

        // Check if current session exceeds optimal duration
        const shouldBreak = currentSessionTime >= optimalDuration;
        
        // Also check recent performance degradation (if available)
        // Query last few questions to see if performance is dropping
        sqliteDb.all(
          `SELECT score, time_spent, completed_at
           FROM student_progress
           WHERE student_id = ?
             AND completed_at >= datetime('now', '-1 hour')
           ORDER BY completed_at DESC
           LIMIT 5`,
          [studentId],
          (perfErr, recentScores) => {
            let performanceDeclining = false;
            let reason = '';

            if (!perfErr && recentScores && recentScores.length >= 3) {
              // Check if scores are declining
              const scores = recentScores.map(s => s.score || 0);
              const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
              const secondHalf = scores.slice(Math.ceil(scores.length / 2));
              
              const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
              const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
              
              // If second half is significantly lower, performance is declining
              if (avgSecond < avgFirst - 10) {
                performanceDeclining = true;
              }
            }

            if (shouldBreak) {
              if (performanceDeclining) {
                reason = `Session duration (${Math.round(currentSessionTime)} min) exceeds optimal (${Math.round(optimalDuration)} min) and performance is declining.`;
              } else {
                reason = `Session duration (${Math.round(currentSessionTime)} min) exceeds optimal duration (${Math.round(optimalDuration)} min).`;
              }
            } else if (performanceDeclining) {
              reason = 'Performance is declining. Consider taking a short break.';
            } else {
              reason = `Current session (${Math.round(currentSessionTime)} min) is within optimal range.`;
            }

            resolve({
              shouldBreak: shouldBreak || performanceDeclining,
              currentSessionTime: Math.round(currentSessionTime),
              optimalDuration: Math.round(optimalDuration),
              reason,
              performanceDeclining
            });
          }
        );
      }
    );
  });
}

/**
 * Adjust content pace based on recent performance
 * @param {string} studentId - Student ID
 * @param {Object} recentPerformance - Optional performance data (if not provided, will query)
 * @returns {Promise<Object>} Updated pacing recommendations
 */
async function adjustContentPace(studentId, recentPerformance = null) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // If recentPerformance not provided, query last 10 quiz results
    if (!recentPerformance) {
      sqliteDb.all(
        `SELECT 
          score,
          time_spent,
          completed_at,
          lesson_id
         FROM student_progress
         WHERE student_id = ?
           AND completed_at >= datetime('now', '-7 days')
         ORDER BY completed_at DESC
         LIMIT 10`,
        [studentId],
        (queryErr, results) => {
          if (queryErr) {
            return reject(queryErr);
          }
          processPerformanceAdjustment(studentId, results || [], resolve, reject);
        }
      );
    } else {
      processPerformanceAdjustment(studentId, Array.isArray(recentPerformance) ? recentPerformance : [recentPerformance], resolve, reject);
    }
  });
}

function processPerformanceAdjustment(studentId, recentResults, resolve, reject) {
  const sqliteDb = getSQLiteDb();
  
  // Analyze performance trends
  if (recentResults.length < 3) {
    // Not enough data, return current pacing
    return calculateOptimalPacing(studentId)
      .then(pacing => resolve({
        ...pacing,
        adjustment: 'insufficient_data',
        message: 'Not enough recent performance data to adjust pacing.'
      }))
      .catch(reject);
  }

  // Calculate performance trend
  const scores = recentResults.map(r => r.score || 0);
  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.ceil(scores.length / 2));
  
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const performanceChange = avgSecond - avgFirst;
  const isImproving = performanceChange > 5; // 5 point improvement
  const isDeclining = performanceChange < -5; // 5 point decline

  // Get current profile
  sqliteDb.get(
    `SELECT * FROM student_learning_profile WHERE student_id = ?`,
    [studentId],
    (profileErr, profile) => {
      if (profileErr) {
        return reject(profileErr);
      }

      if (!profile) {
        return reject(new Error('Student learning profile not found'));
      }

      const currentVelocity = profile.average_learning_velocity || 1.0;
      const currentEngagement = profile.engagement_score || 0.5;
      
      let newVelocity = currentVelocity;
      let newEngagement = currentEngagement;
      let adjustment = 'maintained';
      let message = '';
      let suggestions = [];

      if (isImproving) {
        // Increase questions per session (increase velocity slightly)
        newVelocity = Math.min(5.0, currentVelocity * 1.1); // 10% increase, max 5 q/min
        adjustment = 'increased';
        message = 'Performance is improving! Increasing recommended questions per session.';
        suggestions.push('You can handle more questions per session');
        suggestions.push('Consider slightly longer study sessions');
      } else if (isDeclining) {
        // Decrease questions per session, suggest breaks
        newVelocity = Math.max(0.5, currentVelocity * 0.9); // 10% decrease, min 0.5 q/min
        newEngagement = Math.max(0.3, currentEngagement * 0.95); // Slight engagement decrease
        adjustment = 'decreased';
        message = 'Performance is declining. Reducing recommended questions per session and suggesting more breaks.';
        suggestions.push('Take more frequent breaks (every 15-20 minutes)');
        suggestions.push('Reduce questions per session');
        suggestions.push('Consider shorter study sessions');
      } else {
        // Maintain current pace
        message = 'Performance is stable. Maintaining current pacing recommendations.';
        suggestions.push('Continue with current study pace');
      }

      // Update profile
      sqliteDb.run(
        `UPDATE student_learning_profile
         SET average_learning_velocity = ?,
             engagement_score = ?,
             last_updated = CURRENT_TIMESTAMP
         WHERE student_id = ?`,
        [newVelocity, newEngagement, studentId],
        function(updateErr) {
          if (updateErr) {
            return reject(updateErr);
          }

          // Get updated pacing
          calculateOptimalPacing(studentId)
            .then(pacing => {
              resolve({
                ...pacing,
                adjustment,
                message,
                suggestions,
                previousVelocity: Math.round(currentVelocity * 10) / 10,
                newVelocity: Math.round(newVelocity * 10) / 10,
                performanceChange: Math.round(performanceChange * 10) / 10,
                averageScore: Math.round((avgFirst + avgSecond) / 2)
              });
            })
            .catch(reject);
        }
      );
    }
  );
}

module.exports = {
  calculateOptimalPacing,
  shouldTakeBreak,
  adjustContentPace
};
