const { getSQLiteDb } = require('../db');

/**
 * Get comprehensive class analytics for a teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Analytics object with class metrics
 */
async function getClassAnalytics(teacherId) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // First, get teacher info to find their school and classes
    sqliteDb.get(
      `SELECT school_id, classes_handled, subjects_taught 
       FROM users 
       WHERE id = ? AND role = 'teacher'`,
      [teacherId],
      (teacherErr, teacher) => {
        if (teacherErr) {
          return reject(teacherErr);
        }

        if (!teacher) {
          return reject(new Error('Teacher not found'));
        }

        const schoolId = teacher.school_id;
        const classesHandled = teacher.classes_handled 
          ? teacher.classes_handled.split(',').map(c => c.trim()).filter(Boolean)
          : [];

        // Build query to get students in teacher's classes
        let studentQuery = `
          SELECT DISTINCT u.id, u.name, u.class, u.email
          FROM users u
          WHERE u.role = 'student' 
            AND u.status = 'active'
        `;
        const studentParams = [];

        if (schoolId) {
          studentQuery += ` AND u.school_id = ?`;
          studentParams.push(schoolId);
        }

        if (classesHandled.length > 0) {
          const placeholders = classesHandled.map(() => '?').join(',');
          studentQuery += ` AND u.class IN (${placeholders})`;
          studentParams.push(...classesHandled);
        }

        sqliteDb.all(studentQuery, studentParams, (studentErr, students) => {
          if (studentErr) {
            return reject(studentErr);
          }

          const studentIds = students.map(s => s.id);
          if (studentIds.length === 0) {
            return resolve({
              totalStudents: 0,
              activeToday: 0,
              averageCompletion: 0,
              averageScore: 0,
              atRiskStudents: [],
              topPerformers: [],
              strugglingStudents: [],
              subjectPerformance: {},
              weeklyEngagement: []
            });
          }

          const placeholders = studentIds.map(() => '?').join(',');

          // Get active students today
          sqliteDb.all(
            `SELECT DISTINCT student_id 
             FROM student_progress 
             WHERE student_id IN (${placeholders})
               AND DATE(completed_at) = DATE('now')`,
            studentIds,
            (activeErr, activeRows) => {
              const activeToday = activeRows ? activeRows.length : 0;

              // Get average completion and score
              sqliteDb.all(
                `SELECT 
                  COUNT(DISTINCT sp.lesson_id) as lessons_completed,
                  AVG(sp.score) as avg_score,
                  sp.student_id
                 FROM student_progress sp
                 WHERE sp.student_id IN (${placeholders})
                 GROUP BY sp.student_id`,
                studentIds,
                (progressErr, progressRows) => {
                  const totalLessons = progressRows.reduce((sum, r) => sum + (r.lessons_completed || 0), 0);
                  const averageCompletion = progressRows.length > 0 
                    ? totalLessons / progressRows.length 
                    : 0;
                  
                  const totalScore = progressRows.reduce((sum, r) => sum + (r.avg_score || 0), 0);
                  const averageScore = progressRows.length > 0 
                    ? totalScore / progressRows.length 
                    : 0;

                  // Get student mastery and engagement
                  sqliteDb.all(
                    `SELECT 
                      cm.student_id,
                      AVG(cm.mastery_level) as avg_mastery,
                      slp.engagement_score
                     FROM concept_mastery cm
                     LEFT JOIN student_learning_profile slp ON cm.student_id = slp.student_id
                     WHERE cm.student_id IN (${placeholders})
                     GROUP BY cm.student_id, slp.engagement_score`,
                    studentIds,
                    (masteryErr, masteryRows) => {
                      // Get student names for at-risk, top performers, struggling
                      const masteryMap = {};
                      masteryRows.forEach(row => {
                        masteryMap[row.student_id] = {
                          mastery: row.avg_mastery || 0,
                          engagement: row.engagement_score || 0
                        };
                      });

                      // Identify at-risk students
                      const atRiskStudents = students
                        .filter(s => {
                          const stats = masteryMap[s.id] || { mastery: 0, engagement: 0 };
                          return stats.engagement < 0.4 || stats.mastery < 0.3;
                        })
                        .map(s => ({
                          id: s.id,
                          name: s.name,
                          class: s.class,
                          mastery: masteryMap[s.id]?.mastery || 0,
                          engagement: masteryMap[s.id]?.engagement || 0
                        }));

                      // Top performers
                      const topPerformers = students
                        .filter(s => {
                          const mastery = masteryMap[s.id]?.mastery || 0;
                          return mastery > 0.8;
                        })
                        .map(s => ({
                          id: s.id,
                          name: s.name,
                          class: s.class,
                          mastery: masteryMap[s.id]?.mastery || 0
                        }));

                      // Struggling students
                      const strugglingStudents = students
                        .filter(s => {
                          const mastery = masteryMap[s.id]?.mastery || 0;
                          return mastery < 0.5 && mastery > 0; // Exclude students with no data
                        })
                        .map(s => ({
                          id: s.id,
                          name: s.name,
                          class: s.class,
                          mastery: masteryMap[s.id]?.mastery || 0
                        }));

                      // Get subject performance
                      sqliteDb.all(
                        `SELECT 
                          l.subject,
                          AVG(sp.score) as avg_score,
                          COUNT(DISTINCT sp.student_id) as student_count
                         FROM student_progress sp
                         JOIN lessons l ON sp.lesson_id = l.id
                         WHERE sp.student_id IN (${placeholders})
                         GROUP BY l.subject`,
                        studentIds,
                        (subjectErr, subjectRows) => {
                          const subjectPerformance = {};
                          if (subjectRows) {
                            subjectRows.forEach(row => {
                              subjectPerformance[row.subject] = Math.round(row.avg_score || 0);
                            });
                          }

                          // Get weekly engagement
                          sqliteDb.all(
                            `SELECT 
                              CASE CAST(strftime('%w', completed_at) AS INTEGER)
                                WHEN 0 THEN 'Sunday'
                                WHEN 1 THEN 'Monday'
                                WHEN 2 THEN 'Tuesday'
                                WHEN 3 THEN 'Wednesday'
                                WHEN 4 THEN 'Thursday'
                                WHEN 5 THEN 'Friday'
                                WHEN 6 THEN 'Saturday'
                              END as day,
                              COUNT(DISTINCT student_id) as active_count,
                              COUNT(*) as total_activities
                             FROM student_progress
                             WHERE student_id IN (${placeholders})
                               AND completed_at >= datetime('now', '-7 days')
                             GROUP BY day
                             ORDER BY 
                               CASE day
                                 WHEN 'Monday' THEN 1
                                 WHEN 'Tuesday' THEN 2
                                 WHEN 'Wednesday' THEN 3
                                 WHEN 'Thursday' THEN 4
                                 WHEN 'Friday' THEN 5
                                 WHEN 'Saturday' THEN 6
                                 WHEN 'Sunday' THEN 7
                               END`,
                            studentIds,
                            (weeklyErr, weeklyRows) => {
                              const weeklyEngagement = [];
                              const totalStudents = studentIds.length;

                              if (weeklyRows) {
                                weeklyRows.forEach(row => {
                                  // Calculate engagement as percentage of students active
                                  const engagement = totalStudents > 0 
                                    ? (row.active_count / totalStudents) 
                                    : 0;
                                  weeklyEngagement.push({
                                    day: row.day,
                                    engagement: Math.round(engagement * 100) / 100,
                                    activeCount: row.active_count,
                                    totalActivities: row.total_activities
                                  });
                                });
                              }

                              // Fill in missing days with 0 engagement
                              const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                              days.forEach(day => {
                                if (!weeklyEngagement.find(e => e.day === day)) {
                                  weeklyEngagement.push({
                                    day,
                                    engagement: 0,
                                    activeCount: 0,
                                    totalActivities: 0
                                  });
                                }
                              });

                              resolve({
                                totalStudents: studentIds.length,
                                activeToday,
                                averageCompletion: Math.round(averageCompletion * 100) / 100,
                                averageScore: Math.round(averageScore * 100) / 100,
                                atRiskStudents,
                                topPerformers,
                                strugglingStudents,
                                subjectPerformance,
                                weeklyEngagement: weeklyEngagement.sort((a, b) => {
                                  const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
                                  return dayOrder[a.day] - dayOrder[b.day];
                                })
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
        });
      }
    );
  });
}

/**
 * Get detailed analytics for a specific student
 * @param {string} teacherId - Teacher ID (for verification)
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Detailed student analytics
 */
async function getStudentDetailedAnalytics(teacherId, studentId) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Verify teacher and get their classes
    sqliteDb.get(
      `SELECT school_id, classes_handled 
       FROM users 
       WHERE id = ? AND role = 'teacher'`,
      [teacherId],
      (teacherErr, teacher) => {
        if (teacherErr || !teacher) {
          return reject(new Error('Teacher not found'));
        }

        // Verify student belongs to teacher's class
        sqliteDb.get(
          `SELECT id, name, class, school_id 
           FROM users 
           WHERE id = ? AND role = 'student'`,
          [studentId],
          (studentErr, student) => {
            if (studentErr || !student) {
              return reject(new Error('Student not found'));
            }

            // Check if student belongs to teacher's school and class
            const classesHandled = teacher.classes_handled 
              ? teacher.classes_handled.split(',').map(c => c.trim()).filter(Boolean)
              : [];

            if (teacher.school_id && student.school_id !== teacher.school_id) {
              return reject(new Error('Student does not belong to teacher\'s school'));
            }

            if (classesHandled.length > 0 && !classesHandled.includes(student.class)) {
              return reject(new Error('Student does not belong to teacher\'s class'));
            }

            // Get mastery by concept (heatmap data)
            sqliteDb.all(
              `SELECT 
                concept_name,
                mastery_level,
                confidence_score,
                attempts_count,
                correct_count,
                last_practiced
               FROM concept_mastery
               WHERE student_id = ?
               ORDER BY mastery_level DESC`,
              [studentId],
              (masteryErr, masteryRows) => {
                const masteryByConcept = (masteryRows || []).map(row => ({
                  concept: row.concept_name,
                  mastery: Math.round(row.mastery_level * 100) / 100,
                  confidence: Math.round(row.confidence_score * 100) / 100,
                  attempts: row.attempts_count || 0,
                  correct: row.correct_count || 0,
                  lastPracticed: row.last_practiced
                }));

                // Get learning velocity trends (last 30 days)
                sqliteDb.all(
                  `SELECT 
                    DATE(completed_at) as date,
                    COUNT(*) as questions_answered,
                    SUM(CASE WHEN score >= 80 THEN 1 ELSE 0 END) as correct_count,
                    AVG(time_spent) as avg_time_spent
                   FROM student_progress
                   WHERE student_id = ?
                     AND completed_at >= datetime('now', '-30 days')
                   GROUP BY DATE(completed_at)
                   ORDER BY date ASC`,
                  [studentId],
                  (velocityErr, velocityRows) => {
                    const learningVelocityTrends = (velocityRows || []).map(row => ({
                      date: row.date,
                      questionsAnswered: row.questions_answered || 0,
                      correctCount: row.correct_count || 0,
                      averageTimeSpent: Math.round(row.avg_time_spent || 0)
                    }));

                    // Get engagement trends (daily activity)
                    sqliteDb.all(
                      `SELECT 
                        DATE(completed_at) as date,
                        COUNT(*) as activities,
                        SUM(time_spent) as total_time_spent
                       FROM student_progress
                       WHERE student_id = ?
                         AND completed_at >= datetime('now', '-30 days')
                       GROUP BY DATE(completed_at)
                       ORDER BY date ASC`,
                      [studentId],
                      (engagementErr, engagementRows) => {
                        const engagementTrends = (engagementRows || []).map(row => ({
                          date: row.date,
                          activities: row.activities || 0,
                          totalTimeSpent: row.total_time_spent || 0
                        }));

                        // Get learning profile
                        sqliteDb.get(
                          `SELECT 
                            preferred_learning_style,
                            average_learning_velocity,
                            optimal_difficulty_level,
                            engagement_score,
                            last_updated
                           FROM student_learning_profile
                           WHERE student_id = ?`,
                          [studentId],
                          (profileErr, profile) => {
                            // Get weak concepts for recommendations
                            const weakConcepts = masteryByConcept
                              .filter(c => c.mastery < 0.5)
                              .map(c => c.concept);

                            // Generate recommended interventions
                            const recommendedInterventions = weakConcepts.map(concept => ({
                              concept,
                              type: 'practice',
                              priority: 'high',
                              reason: `Mastery level is ${Math.round(masteryByConcept.find(c => c.concept === concept)?.mastery * 100 || 0)}%`
                            }));

                            resolve({
                              student: {
                                id: student.id,
                                name: student.name,
                                class: student.class
                              },
                              masteryByConcept,
                              learningVelocityTrends,
                              engagementTrends,
                              learningProfile: profile || null,
                              recommendedInterventions,
                              summary: {
                                totalConcepts: masteryByConcept.length,
                                masteredConcepts: masteryByConcept.filter(c => c.mastery >= 0.8).length,
                                learningConcepts: masteryByConcept.filter(c => c.mastery >= 0.3 && c.mastery < 0.8).length,
                                weakConcepts: masteryByConcept.filter(c => c.mastery < 0.3).length,
                                averageMastery: masteryByConcept.length > 0
                                  ? masteryByConcept.reduce((sum, c) => sum + c.mastery, 0) / masteryByConcept.length
                                  : 0
                              }
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
 * Get performance distribution for teacher's class
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Array>} Performance distribution array
 */
async function getPerformanceDistribution(teacherId) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Get teacher info
    sqliteDb.get(
      `SELECT school_id, classes_handled 
       FROM users 
       WHERE id = ? AND role = 'teacher'`,
      [teacherId],
      (teacherErr, teacher) => {
        if (teacherErr || !teacher) {
          return reject(new Error('Teacher not found'));
        }

        const schoolId = teacher.school_id;
        const classesHandled = teacher.classes_handled 
          ? teacher.classes_handled.split(',').map(c => c.trim()).filter(Boolean)
          : [];

        // Build student query
        let studentQuery = `
          SELECT DISTINCT u.id
          FROM users u
          WHERE u.role = 'student' AND u.status = 'active'
        `;
        const studentParams = [];

        if (schoolId) {
          studentQuery += ` AND u.school_id = ?`;
          studentParams.push(schoolId);
        }

        if (classesHandled.length > 0) {
          const placeholders = classesHandled.map(() => '?').join(',');
          studentQuery += ` AND u.class IN (${placeholders})`;
          studentParams.push(...classesHandled);
        }

        sqliteDb.all(studentQuery, studentParams, (studentErr, students) => {
          if (studentErr) {
            return reject(studentErr);
          }

          const studentIds = students.map(s => s.id);
          if (studentIds.length === 0) {
            return resolve([
              { range: '90-100%', count: 0 },
              { range: '80-89%', count: 0 },
              { range: '70-79%', count: 0 },
              { range: '60-69%', count: 0 },
              { range: '<60%', count: 0 }
            ]);
          }

          const placeholders = studentIds.map(() => '?').join(',');

          // Get average mastery per student
          sqliteDb.all(
            `SELECT 
              student_id,
              AVG(mastery_level) as avg_mastery
             FROM concept_mastery
             WHERE student_id IN (${placeholders})
             GROUP BY student_id`,
            studentIds,
            (masteryErr, masteryRows) => {
              // Categorize students by performance
              const distribution = {
                '90-100%': 0,
                '80-89%': 0,
                '70-79%': 0,
                '60-69%': 0,
                '<60%': 0
              };

              masteryRows.forEach(row => {
                const masteryPercent = (row.avg_mastery || 0) * 100;
                if (masteryPercent >= 90) {
                  distribution['90-100%']++;
                } else if (masteryPercent >= 80) {
                  distribution['80-89%']++;
                } else if (masteryPercent >= 70) {
                  distribution['70-79%']++;
                } else if (masteryPercent >= 60) {
                  distribution['60-69%']++;
                } else {
                  distribution['<60%']++;
                }
              });

              // Students with no mastery data go to <60%
              const studentsWithData = masteryRows.length;
              const studentsWithoutData = studentIds.length - studentsWithData;
              distribution['<60%'] += studentsWithoutData;

              resolve([
                { range: '90-100%', count: distribution['90-100%'] },
                { range: '80-89%', count: distribution['80-89%'] },
                { range: '70-79%', count: distribution['70-79%'] },
                { range: '60-69%', count: distribution['60-69%'] },
                { range: '<60%', count: distribution['<60%'] }
              ]);
            }
          );
        });
      }
    );
  });
}

/**
 * Get recent activity for teacher's students
 * @param {string} teacherId - Teacher ID
 * @param {number} limit - Number of recent activities to return (default: 10)
 * @returns {Promise<Array>} Array of recent activities
 */
async function getRecentActivity(teacherId, limit = 10) {
  return new Promise((resolve, reject) => {
    const sqliteDb = getSQLiteDb();
    if (!sqliteDb) {
      return reject(new Error('Database connection not available'));
    }

    // Get teacher info
    sqliteDb.get(
      `SELECT school_id, classes_handled 
       FROM users 
       WHERE id = ? AND role = 'teacher'`,
      [teacherId],
      (teacherErr, teacher) => {
        if (teacherErr || !teacher) {
          return reject(new Error('Teacher not found'));
        }

        const schoolId = teacher.school_id;
        const classesHandled = teacher.classes_handled 
          ? teacher.classes_handled.split(',').map(c => c.trim()).filter(Boolean)
          : [];

        // Build student query
        let studentQuery = `
          SELECT DISTINCT u.id
          FROM users u
          WHERE u.role = 'student' AND u.status = 'active'
        `;
        const studentParams = [];

        if (schoolId) {
          studentQuery += ` AND u.school_id = ?`;
          studentParams.push(schoolId);
        }

        if (classesHandled.length > 0) {
          const placeholders = classesHandled.map(() => '?').join(',');
          studentQuery += ` AND u.class IN (${placeholders})`;
          studentParams.push(...classesHandled);
        }

        sqliteDb.all(studentQuery, studentParams, (studentErr, students) => {
          if (studentErr) {
            return reject(studentErr);
          }

          const studentIds = students.map(s => s.id);
          if (studentIds.length === 0) {
            return resolve([]);
          }

          const placeholders = studentIds.map(() => '?').join(',');

          // Get recent activity
          sqliteDb.all(
            `SELECT 
              sp.id,
              sp.student_id,
              u.name as student_name,
              u.class,
              sp.lesson_id,
              l.title as lesson_title,
              l.subject,
              sp.score,
              sp.time_spent,
              sp.completed_at,
              sp.quiz_id
             FROM student_progress sp
             JOIN users u ON sp.student_id = u.id
             LEFT JOIN lessons l ON sp.lesson_id = l.id
             WHERE sp.student_id IN (${placeholders})
             ORDER BY sp.completed_at DESC
             LIMIT ?`,
            [...studentIds, limit],
            (activityErr, activities) => {
              if (activityErr) {
                return reject(activityErr);
              }

              const formattedActivities = (activities || []).map(activity => ({
                id: activity.id,
                studentId: activity.student_id,
                studentName: activity.student_name,
                class: activity.class,
                lessonId: activity.lesson_id,
                lessonTitle: activity.lesson_title || 'Quiz',
                subject: activity.subject || 'Unknown',
                score: activity.score || null,
                timeSpent: activity.time_spent || 0,
                completedAt: activity.completed_at,
                activityType: activity.quiz_id ? 'quiz' : 'lesson'
              }));

              resolve(formattedActivities);
            }
          );
        });
      }
    );
  });
}

module.exports = {
  getClassAnalytics,
  getStudentDetailedAnalytics,
  getPerformanceDistribution,
  getRecentActivity
};
