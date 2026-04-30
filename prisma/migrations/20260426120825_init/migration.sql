-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MASTER');

-- CreateEnum
CREATE TYPE "LearningStyle" AS ENUM ('VISUAL', 'KINESTHETIC', 'READING', 'MIXED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'LATE', 'GRADED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'FILL_BLANK', 'DRAG_DROP', 'IMAGE_MCQ', 'FREE_TEXT', 'EQUATION', 'SEQUENCING');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('CAR', 'PLANTS', 'FIGHTING', 'QUIZ_BATTLE', 'MATH_DUNGEON', 'WORD_FORGE', 'SCIENCE_LAB', 'HISTORY_CONQUEST');

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('SOLO', 'MULTIPLAYER', 'COOP');

-- CreateEnum
CREATE TYPE "LobbyStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('EARN', 'SPEND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('DAILY', 'WEEKLY', 'SPECIAL', 'TEACHER_ASSIGNED');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('OUTFIT', 'ACCESSORY', 'BACKGROUND', 'HERO_SKIN', 'AVATAR', 'LAB_COAT', 'HISTORICAL_AVATAR', 'EMOJI_PACK');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('SUBJECT', 'GAME', 'STREAK', 'COLLAB', 'MILESTONE', 'SEASONAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'IMPORT', 'EXPORT', 'GRANT', 'REVOKE');

-- CreateEnum
CREATE TYPE "ExperimentStrategy" AS ENUM ('MASTERY_BASED', 'SEQUENCE_BASED', 'ENGAGEMENT_BASED');

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionTier" TEXT,
    "subscriptionExpiresAt" TIMESTAMP(3),
    "featureFlags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "studentId" TEXT,
    "pinHash" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL,
    "class" TEXT,
    "schoolId" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone" TEXT,
    "address" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "profilePhoto" TEXT,
    "rollNumber" TEXT,
    "department" TEXT,
    "subjectsTaught" TEXT[],
    "classesHandled" TEXT[],
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "totalCoins" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "section" TEXT,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_enrollments" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconKey" TEXT,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT,
    "schoolId" TEXT,
    "subjectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "topicId" TEXT,
    "gradeLevel" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "text" TEXT NOT NULL,
    "imageUrl" TEXT,
    "choices" JSONB,
    "answerIndex" INTEGER,
    "correctAnswer" TEXT,
    "acceptableAnswers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sequenceItems" JSONB,
    "dragItems" JSONB,
    "difficulty" "Difficulty" NOT NULL,
    "difficultyLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "conceptTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ncert" BOOLEAN NOT NULL DEFAULT false,
    "explanation" TEXT,
    "hintText" TEXT,
    "status" "QuestionStatus" NOT NULL DEFAULT 'APPROVED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "subjectId" TEXT,
    "chapterId" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT,
    "questions" JSONB NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "gradeLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homeworks" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homeworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_homework" (
    "id" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,

    CONSTRAINT "student_homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_assignments" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,

    CONSTRAINT "student_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_assignments" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "subjectId" TEXT,
    "chapterId" TEXT,
    "topicId" TEXT,
    "difficulty" "Difficulty",
    "dueDate" TIMESTAMP(3),
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "consistencyScore" DOUBLE PRECISION,
    "engagementLevel" DOUBLE PRECISION,
    "conceptTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "errorType" TEXT,
    "synced" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_mastery" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "conceptName" TEXT NOT NULL,
    "masteryLevel" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION,
    "lastPracticed" TIMESTAMP(3),
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "averageTimeSpent" DOUBLE PRECISION,

    CONSTRAINT "concept_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_learning_profiles" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "preferredLearningStyle" "LearningStyle",
    "averageLearningVelocity" DOUBLE PRECISION,
    "optimalDifficultyLevel" DOUBLE PRECISION,
    "engagementScore" DOUBLE PRECISION,
    "timeSpentVisual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpentReading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpentPractice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_learning_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_patterns" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "conceptName" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "firstOccurred" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOccurred" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_patterns" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionDate" DATE NOT NULL,
    "sessionDuration" INTEGER NOT NULL DEFAULT 0,
    "questionsAnswered" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "strategy" "ExperimentStrategy" NOT NULL,
    "learningGains" DOUBLE PRECISION,
    "engagementScore" DOUBLE PRECISION,
    "completionRate" DOUBLE PRECISION,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_definitions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "BadgeType" NOT NULL,
    "iconUrl" TEXT,
    "threshold" INTEGER,
    "meta" JSONB,

    CONSTRAINT "badge_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_snapshots" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "studentId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "rankPosition" INTEGER NOT NULL,
    "weekKey" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "mode" "GameMode" NOT NULL,
    "matchId" TEXT,
    "subjectId" TEXT,
    "chapterId" TEXT,
    "topicId" TEXT,
    "gradeLevel" INTEGER,
    "difficulty" "Difficulty",
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "questionsAttempted" INTEGER NOT NULL DEFAULT 0,
    "questionsCorrect" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "coinsEarned" INTEGER NOT NULL DEFAULT 0,
    "starsEarned" INTEGER,
    "perQuestionData" JSONB,
    "outcome" TEXT,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_lobbies" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "classCode" TEXT,
    "gameType" "GameType" NOT NULL,
    "mode" "GameMode" NOT NULL,
    "subjectId" TEXT,
    "chapterId" TEXT,
    "topicId" TEXT,
    "difficulty" "Difficulty",
    "maxPlayers" INTEGER NOT NULL DEFAULT 2,
    "status" "LobbyStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "game_lobbies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_matches" (
    "id" TEXT NOT NULL,
    "lobbyId" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "mode" "GameMode" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "winnerId" TEXT,
    "matchData" JSONB,

    CONSTRAINT "game_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_participants" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "team" TEXT,
    "finalScore" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "match_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CoinTransactionType" NOT NULL,
    "source" TEXT NOT NULL,
    "refId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_items" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ItemCategory" NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "priceCoins" INTEGER NOT NULL,
    "priceXp" INTEGER,
    "unlockLevel" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_inventory_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "QuestType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goal" JSONB NOT NULL,
    "rewardXp" INTEGER NOT NULL DEFAULT 0,
    "rewardCoins" INTEGER NOT NULL DEFAULT 0,
    "rewardItemId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quest_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "goalCount" INTEGER NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "user_quest_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_definitions" (
    "level" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "xpRequired" INTEGER NOT NULL,

    CONSTRAINT "level_definitions_pkey" PRIMARY KEY ("level")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_schoolCode_key" ON "schools"("schoolCode");

-- CreateIndex
CREATE UNIQUE INDEX "schools_email_key" ON "schools"("email");

-- CreateIndex
CREATE INDEX "schools_schoolCode_idx" ON "schools"("schoolCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_studentId_key" ON "users"("studentId");

-- CreateIndex
CREATE INDEX "users_schoolId_role_idx" ON "users"("schoolId", "role");

-- CreateIndex
CREATE INDEX "users_studentId_idx" ON "users"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "classes_schoolId_gradeLevel_idx" ON "classes"("schoolId", "gradeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "classes_schoolId_name_key" ON "classes"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "class_enrollments_classId_studentId_key" ON "class_enrollments"("classId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE INDEX "chapters_subjectId_gradeLevel_idx" ON "chapters"("subjectId", "gradeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_subjectId_gradeLevel_name_key" ON "chapters"("subjectId", "gradeLevel", "name");

-- CreateIndex
CREATE UNIQUE INDEX "topics_chapterId_name_key" ON "topics"("chapterId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "questions_legacyId_key" ON "questions"("legacyId");

-- CreateIndex
CREATE INDEX "questions_subjectId_gradeLevel_difficulty_idx" ON "questions"("subjectId", "gradeLevel", "difficulty");

-- CreateIndex
CREATE INDEX "questions_schoolId_status_idx" ON "questions"("schoolId", "status");

-- CreateIndex
CREATE INDEX "questions_conceptTags_idx" ON "questions"("conceptTags");

-- CreateIndex
CREATE UNIQUE INDEX "student_homework_homeworkId_studentId_key" ON "student_homework"("homeworkId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_assignments_assignmentId_studentId_key" ON "student_assignments"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "student_progress_studentId_lessonId_idx" ON "student_progress"("studentId", "lessonId");

-- CreateIndex
CREATE INDEX "student_progress_completedAt_idx" ON "student_progress"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "concept_mastery_studentId_conceptName_key" ON "concept_mastery"("studentId", "conceptName");

-- CreateIndex
CREATE UNIQUE INDEX "student_learning_profiles_studentId_key" ON "student_learning_profiles"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "error_patterns_studentId_conceptName_errorType_key" ON "error_patterns"("studentId", "conceptName", "errorType");

-- CreateIndex
CREATE UNIQUE INDEX "engagement_patterns_studentId_sessionDate_key" ON "engagement_patterns"("studentId", "sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "experiments_studentId_key" ON "experiments"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "badge_definitions_key_key" ON "badge_definitions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "leaderboard_snapshots_schoolId_weekKey_rankPosition_idx" ON "leaderboard_snapshots"("schoolId", "weekKey", "rankPosition");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_snapshots_schoolId_scope_scopeId_studentId_week_key" ON "leaderboard_snapshots"("schoolId", "scope", "scopeId", "studentId", "weekKey");

-- CreateIndex
CREATE INDEX "game_sessions_studentId_gameType_idx" ON "game_sessions"("studentId", "gameType");

-- CreateIndex
CREATE INDEX "game_sessions_startedAt_idx" ON "game_sessions"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "game_lobbies_classCode_key" ON "game_lobbies"("classCode");

-- CreateIndex
CREATE INDEX "game_lobbies_schoolId_status_idx" ON "game_lobbies"("schoolId", "status");

-- CreateIndex
CREATE INDEX "game_lobbies_classCode_idx" ON "game_lobbies"("classCode");

-- CreateIndex
CREATE UNIQUE INDEX "game_matches_lobbyId_key" ON "game_matches"("lobbyId");

-- CreateIndex
CREATE UNIQUE INDEX "match_participants_matchId_studentId_key" ON "match_participants"("matchId", "studentId");

-- CreateIndex
CREATE INDEX "coin_transactions_userId_idx" ON "coin_transactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shop_items_key_key" ON "shop_items"("key");

-- CreateIndex
CREATE UNIQUE INDEX "user_inventory_items_userId_itemId_key" ON "user_inventory_items"("userId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "quests_key_key" ON "quests"("key");

-- CreateIndex
CREATE INDEX "user_quest_progress_userId_status_idx" ON "user_quest_progress"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_quest_progress_userId_questId_key" ON "user_quest_progress"("userId", "questId");

-- CreateIndex
CREATE INDEX "audit_logs_schoolId_createdAt_idx" ON "audit_logs"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_homework" ADD CONSTRAINT "student_homework_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "homeworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_homework" ADD CONSTRAINT "student_homework_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assignments" ADD CONSTRAINT "student_assignments_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assignments" ADD CONSTRAINT "student_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_assignments" ADD CONSTRAINT "game_assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_mastery" ADD CONSTRAINT "concept_mastery_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_learning_profiles" ADD CONSTRAINT "student_learning_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_patterns" ADD CONSTRAINT "error_patterns_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_patterns" ADD CONSTRAINT "engagement_patterns_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badge_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "game_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_lobbies" ADD CONSTRAINT "game_lobbies_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_lobbies" ADD CONSTRAINT "game_lobbies_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_matches" ADD CONSTRAINT "game_matches_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "game_lobbies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "game_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventory_items" ADD CONSTRAINT "user_inventory_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventory_items" ADD CONSTRAINT "user_inventory_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "shop_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quest_progress" ADD CONSTRAINT "user_quest_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quest_progress" ADD CONSTRAINT "user_quest_progress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
