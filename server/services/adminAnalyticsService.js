const { getSQLiteDb } = require('../db');

/**
 * Get comprehensive platform-wide analytics for admin
 * @returns {Promise<Object>} Platform analytics with insights
 */
async function getPlatformAnalytics() {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Step 1: Get total users and active users
    sqliteDb.all(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
        COUNT(CASE WHEN role = 'teacher' THEN 1 END) as total_teachers,
        COUNT(CASE WHEN role = 'school' THEN 1 END) as total_schools,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN last_login >= datetime('now', '-30 days') THEN 1 END) as active_last_30_days
       FROM users`,
      [],
      (usersErr, usersStats) => {
        if (usersErr) {
          return reject(usersErr);
        }

        const userStats = usersStats[0] || {
          total_users: 0,
          total_students: 0,
          total_teachers: 0,
          total_schools: 0,
          active_users: 0,
          active_last_30_days: 0
        };

        // Step 2: Get completion rates
        sqliteDb.all(
          `SELECT 
            COUNT(DISTINCT student_id) as students_with_progress,
            COUNT(DISTINCT lesson_id) as unique_lessons_completed,
            AVG(score) as avg_score,
            COUNT(*) as total_completions
           FROM student_progress`,
          [],
          (completionErr, completionStats) => {
            if (completionErr) {
              return reject(completionErr);
            }

            const completion = completionStats[0] || {
              students_with_progress: 0,
              unique_lessons_completed: 0,
              avg_score: 0,
              total_completions: 0
            };

            const completionRate = userStats.total_students > 0
              ? (completion.students_with_progress / userStats.total_students) * 100
              : 0;

            // Step 3: Get school performance comparison
            sqliteDb.all(
              `SELECT 
                s.name as school_name,
                COUNT(DISTINCT u.id) as student_count,
                AVG(sp.score) as avg_score,
                COUNT(DISTINCT sp.student_id) as students_with_progress,
                COUNT(DISTINCT sp.lesson_id) as lessons_completed
               FROM schools s
               LEFT JOIN users u ON s.id = u.school_id AND u.role = 'student'
               LEFT JOIN student_progress sp ON u.id = sp.student_id
               GROUP BY s.id, s.name
               HAVING student_count > 0
               ORDER BY avg_score DESC`,
              [],
              (schoolErr, schoolData) => {
                if (schoolErr) {
                  return reject(schoolErr);
                }

                const schoolPerformanceComparison = (schoolData || []).map(school => ({
                  schoolName: school.school_name,
                  studentCount: school.student_count || 0,
                  avgScore: Math.round(school.avg_score || 0),
                  completionRate: school.student_count > 0
                    ? Math.round((school.students_with_progress / school.student_count) * 100)
                    : 0,
                  lessonsCompleted: school.lessons_completed || 0
                }));

                // Step 4: Get subject difficulty analysis
                sqliteDb.all(
                  `SELECT 
                    l.subject,
                    AVG(sp.score) as avg_score,
                    AVG(sp.time_spent) as avg_time,
                    AVG(l.difficulty) as avg_difficulty,
                    COUNT(DISTINCT sp.student_id) as student_count,
                    COUNT(*) as total_attempts
                   FROM lessons l
                   JOIN student_progress sp ON l.id = sp.lesson_id
                   GROUP BY l.subject
                   ORDER BY avg_score DESC`,
                  [],
                  (subjectErr, subjectData) => {
                    if (subjectErr) {
                      return reject(subjectErr);
                    }

                    const subjectDifficultyAnalysis = (subjectData || []).map(subject => {
                      // Normalize difficulty from 1-10 scale to 0-1
                      const normalizedDifficulty = (subject.avg_difficulty || 5) / 10;
                      // Calculate difficulty score (inverse of performance, normalized)
                      const difficultyScore = 1 - ((subject.avg_score || 0) / 100);

                      return {
                        subject: subject.subject,
                        avgScore: Math.round(subject.avg_score || 0),
                        avgTime: Math.round(subject.avg_time || 0),
                        difficultyScore: Math.round(difficultyScore * 100) / 100,
                        studentCount: subject.student_count || 0,
                        totalAttempts: subject.total_attempts || 0
                      };
                    });

                    // Step 5: Get top struggling concepts
                    sqliteDb.all(
                      `SELECT 
                        concept_name,
                        AVG(mastery_level) as avg_mastery,
                        COUNT(DISTINCT student_id) as student_count,
                        COUNT(*) as total_attempts,
                        AVG(confidence_score) as avg_confidence
                       FROM concept_mastery
                       GROUP BY concept_name
                       HAVING student_count >= 3
                       ORDER BY avg_mastery ASC
                       LIMIT 10`,
                      [],
                      (conceptErr, conceptData) => {
                        if (conceptErr) {
                          return reject(conceptErr);
                        }

                        const topStrugglingConcepts = (conceptData || []).map(concept => ({
                          concept: concept.concept_name,
                          avgMastery: Math.round(concept.avg_mastery * 100) / 100,
                          masteryPercent: Math.round(concept.avg_mastery * 100),
                          studentCount: concept.student_count || 0,
                          totalAttempts: concept.total_attempts || 0,
                          avgConfidence: Math.round(concept.avg_confidence * 100) / 100
                        }));

                        // Step 6: Get engagement trends (last 30 days)
                        sqliteDb.all(
                          `SELECT 
                            DATE(completed_at) as date,
                            COUNT(DISTINCT student_id) as active_students,
                            COUNT(*) as total_activities,
                            AVG(score) as avg_score,
                            SUM(time_spent) as total_time_spent
                           FROM student_progress
                           WHERE completed_at >= datetime('now', '-30 days')
                           GROUP BY DATE(completed_at)
                           ORDER BY date ASC`,
                          [],
                          (trendErr, trendData) => {
                            if (trendErr) {
                              return reject(trendErr);
                            }

                            const engagementTrends = (trendData || []).map(trend => ({
                              date: trend.date,
                              activeStudents: trend.active_students || 0,
                              totalActivities: trend.total_activities || 0,
                              avgScore: Math.round(trend.avg_score || 0),
                              totalTimeSpent: trend.total_time_spent || 0
                            }));

                            // Calculate overall engagement score
                            const totalDays = engagementTrends.length;
                            const avgDailyActive = totalDays > 0
                              ? engagementTrends.reduce((sum, t) => sum + t.activeStudents, 0) / totalDays
                              : 0;
                            const platformEngagementScore = userStats.total_students > 0
                              ? Math.min(1.0, (avgDailyActive / userStats.total_students))
                              : 0;

                            // Step 7: Calculate platform health and generate insights
                            const platformEngagementScoreRounded = Math.round(platformEngagementScore * 100) / 100;
                            
                            const insights = generateInsights({
                              topStrugglingConcepts,
                              subjectDifficultyAnalysis,
                              engagementTrends,
                              completionRate,
                              schoolPerformanceComparison,
                              platformEngagementScore: platformEngagementScoreRounded
                            });

                            resolve({
                              totalUsers: userStats.total_users,
                              activeUsers: userStats.active_users,
                              totalStudents: userStats.total_students,
                              totalTeachers: userStats.total_teachers,
                              totalSchools: userStats.total_schools,
                              activeLast30Days: userStats.active_last_30_days,
                              completionRates: {
                                overall: Math.round(completionRate * 100) / 100,
                                studentsWithProgress: completion.students_with_progress,
                                totalStudents: userStats.total_students,
                                uniqueLessonsCompleted: completion.unique_lessons_completed,
                                totalCompletions: completion.total_completions
                              },
                              schoolPerformanceComparison,
                              subjectDifficultyAnalysis,
                              topStrugglingConcepts,
                              engagementTrends,
                              platformEngagementScore: platformEngagementScoreRounded,
                              insights
                            });
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
}

/**
 * Generate AI insights based on analytics data
 * @param {Object} data - Analytics data
 * @returns {Object} Generated insights
 */
function generateInsights(data) {
  const { topStrugglingConcepts, subjectDifficultyAnalysis, engagementTrends, completionRate, schoolPerformanceComparison } = data;

  const insights = {
    topStrugglingConcepts: [],
    recommendedContentUpdates: [],
    engagementTrends: '',
    platformHealth: ''
  };

  // Top struggling concepts
  if (topStrugglingConcepts && topStrugglingConcepts.length > 0) {
    const top3 = topStrugglingConcepts.slice(0, 3);
    insights.topStrugglingConcepts = top3.map(c => ({
      concept: c.concept,
      masteryPercent: c.masteryPercent,
      recommendation: `Consider creating additional practice exercises or visual aids for "${c.concept}" as ${c.studentCount} students are struggling (avg mastery: ${c.masteryPercent}%)`
    }));
  }

  // Recommended content updates
  const recommendations = [];
  
  // Check for subjects with low scores
  if (subjectDifficultyAnalysis && subjectDifficultyAnalysis.length > 0) {
    const strugglingSubjects = subjectDifficultyAnalysis.filter(s => s.avgScore < 70);
    strugglingSubjects.forEach(subject => {
      recommendations.push({
        subject: subject.subject,
        reason: `Low average score (${subject.avgScore}%)`,
        suggestion: `Review and update ${subject.subject} content. Consider adding more examples, interactive exercises, or adjusting difficulty levels.`
      });
    });
  }

  // Check for concepts needing attention
  if (topStrugglingConcepts && topStrugglingConcepts.length > 0) {
    const criticalConcepts = topStrugglingConcepts.filter(c => c.masteryPercent < 50).slice(0, 3);
    criticalConcepts.forEach(concept => {
      recommendations.push({
        concept: concept.concept,
        reason: `Critical mastery level (${concept.masteryPercent}%)`,
        suggestion: `Create targeted remediation content for "${concept.concept}". Consider video tutorials, step-by-step guides, or gamified practice.`
      });
    });
  }

  insights.recommendedContentUpdates = recommendations;

  // Engagement trends analysis
  if (engagementTrends && engagementTrends.length > 0) {
    const recentTrends = engagementTrends.slice(-7); // Last 7 days
    const earlierTrends = engagementTrends.slice(0, Math.max(0, engagementTrends.length - 7));
    
    const recentAvg = recentTrends.length > 0
      ? recentTrends.reduce((sum, t) => sum + t.activeStudents, 0) / recentTrends.length
      : 0;
    const earlierAvg = earlierTrends.length > 0
      ? earlierTrends.reduce((sum, t) => sum + t.activeStudents, 0) / earlierTrends.length
      : 0;

    const trendDirection = recentAvg > earlierAvg ? 'increasing' : recentAvg < earlierAvg ? 'decreasing' : 'stable';
    const changePercent = earlierAvg > 0 ? Math.abs(((recentAvg - earlierAvg) / earlierAvg) * 100) : 0;

    insights.engagementTrends = `Platform engagement is ${trendDirection}. ` +
      `Average daily active students: ${Math.round(recentAvg)} (${trendDirection === 'increasing' ? '+' : trendDirection === 'decreasing' ? '-' : ''}${Math.round(changePercent)}% vs previous period). ` +
      `Overall completion rate: ${Math.round(completionRate)}%. ` +
      `Consider ${trendDirection === 'decreasing' ? 'promoting new content or running engagement campaigns' : trendDirection === 'increasing' ? 'maintaining momentum with fresh content' : 'monitoring trends closely'}.`;
  } else {
    insights.engagementTrends = 'Insufficient engagement data for trend analysis. Encourage more student activity to generate insights.';
  }

  // Platform health
  const healthScore = calculatePlatformHealth({
    completionRate,
    platformEngagementScore: data.platformEngagementScore || 0,
    schoolPerformanceComparison
  });

  insights.platformHealth = `Platform health score: ${healthScore.score}/100 (${healthScore.status}). ` +
    `${healthScore.recommendations.join(' ')}`;

  return insights;
}

/**
 * Calculate platform health score
 * @param {Object} metrics - Platform metrics
 * @returns {Object} Health score and recommendations
 */
function calculatePlatformHealth(metrics) {
  const { completionRate, platformEngagementScore, schoolPerformanceComparison } = metrics;

  // Calculate health score (0-100)
  const completionWeight = 0.3;
  const engagementWeight = 0.4;
  const schoolPerformanceWeight = 0.3;

  const completionScore = Math.min(100, (completionRate / 100) * 100);
  const engagementScore = Math.min(100, platformEngagementScore * 100);
  
  // Average school performance
  const avgSchoolScore = schoolPerformanceComparison && schoolPerformanceComparison.length > 0
    ? schoolPerformanceComparison.reduce((sum, s) => sum + s.avgScore, 0) / schoolPerformanceComparison.length
    : 0;
  const schoolScore = Math.min(100, avgSchoolScore);

  const healthScore = Math.round(
    (completionScore * completionWeight) +
    (engagementScore * engagementWeight) +
    (schoolScore * schoolPerformanceWeight)
  );

  let status = 'Excellent';
  const recommendations = [];

  if (healthScore < 50) {
    status = 'Critical';
    recommendations.push('Immediate action required: Low completion rates and engagement.');
  } else if (healthScore < 70) {
    status = 'Needs Improvement';
    recommendations.push('Focus on increasing student engagement and completion rates.');
  } else if (healthScore < 85) {
    status = 'Good';
    recommendations.push('Platform is performing well. Continue monitoring and optimizing.');
  } else {
    status = 'Excellent';
    recommendations.push('Platform is performing excellently. Maintain current strategies.');
  }

  if (completionRate < 30) {
    recommendations.push('Consider implementing gamification or rewards to boost completion rates.');
  }

  if (platformEngagementScore < 0.3) {
    recommendations.push('Engagement is low. Review content quality and student onboarding.');
  }

  return {
    score: healthScore,
    status,
    recommendations,
    breakdown: {
      completionScore: Math.round(completionScore),
      engagementScore: Math.round(engagementScore),
      schoolScore: Math.round(schoolScore)
    }
  };
}

module.exports = {
  getPlatformAnalytics
};
