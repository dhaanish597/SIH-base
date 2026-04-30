# Graph Report - .  (2026-04-26)

## Corpus Check
- 182 files · ~195,006 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 586 nodes · 744 edges · 37 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Car Race Adaptive Quiz Game|Car Race Adaptive Quiz Game]]
- [[_COMMUNITY_Auth Tokens and WordForge|Auth Tokens and WordForge]]
- [[_COMMUNITY_Database Connection Layer|Database Connection Layer]]
- [[_COMMUNITY_SQLite to Postgres Migration|SQLite to Postgres Migration]]
- [[_COMMUNITY_IndexedDB Offline Storage|IndexedDB Offline Storage]]
- [[_COMMUNITY_Math Dungeon and Experimentation|Math Dungeon and Experimentation]]
- [[_COMMUNITY_AI Tutor and Learning Intelligence|AI Tutor and Learning Intelligence]]
- [[_COMMUNITY_Claude AI Client Services|Claude AI Client Services]]
- [[_COMMUNITY_Analytics Platform Services|Analytics Platform Services]]
- [[_COMMUNITY_Question Mapper and Data Utils|Question Mapper and Data Utils]]
- [[_COMMUNITY_Next.js App Router Pages|Next.js App Router Pages]]
- [[_COMMUNITY_Shared Quiz Loader|Shared Quiz Loader]]
- [[_COMMUNITY_Student and Teacher Profiles|Student and Teacher Profiles]]
- [[_COMMUNITY_FightingGame Player Animations|FightingGame Player Animations]]
- [[_COMMUNITY_Quest and XP System|Quest and XP System]]
- [[_COMMUNITY_Architecture Migration Roadmap|Architecture Migration Roadmap]]
- [[_COMMUNITY_Multiplayer Quiz Battle Sockets|Multiplayer Quiz Battle Sockets]]
- [[_COMMUNITY_Teacher Dashboard and Recommendations|Teacher Dashboard and Recommendations]]
- [[_COMMUNITY_FightingGame Oak Woods Environment|FightingGame Oak Woods Environment]]
- [[_COMMUNITY_Chatbot Widget UI|Chatbot Widget UI]]
- [[_COMMUNITY_Feedback and Game Player UI|Feedback and Game Player UI]]
- [[_COMMUNITY_FightingGame Player 1 Sprites|FightingGame Player 1 Sprites]]
- [[_COMMUNITY_App Layout and Routing|App Layout and Routing]]
- [[_COMMUNITY_School Events and Tasks|School Events and Tasks]]
- [[_COMMUNITY_Science Lesson Content|Science Lesson Content]]
- [[_COMMUNITY_Badge Progression System|Badge Progression System]]
- [[_COMMUNITY_History Conquest Game|History Conquest Game]]
- [[_COMMUNITY_Science Lab Game|Science Lab Game]]
- [[_COMMUNITY_Admin Analytics UI|Admin Analytics UI]]
- [[_COMMUNITY_Module 30|Module 30]]
- [[_COMMUNITY_Module 31|Module 31]]
- [[_COMMUNITY_Module 32|Module 32]]
- [[_COMMUNITY_Module 33|Module 33]]
- [[_COMMUNITY_Module 38|Module 38]]
- [[_COMMUNITY_Module 40|Module 40]]
- [[_COMMUNITY_Module 67|Module 67]]
- [[_COMMUNITY_Module 116|Module 116]]

## God Nodes (most connected - your core abstractions)
1. `all()` - 23 edges
2. `tableExists()` - 19 edges
3. `parseDate()` - 17 edges
4. `IndexedDBService` - 17 edges
5. `GameScene` - 9 edges
6. `load()` - 8 edges
7. `callClaudeJson()` - 8 edges
8. `askChatbot()` - 8 edges
9. `loadQuestions()` - 7 edges
10. `Car Race Quiz Game` - 7 edges

## Surprising Connections (you probably didn't know these)
- `generateRealTimeHint()` --calls--> `set()`  [INFERRED]
  C:\Users\clash\Documents\SIH-base\server\services\feedbackEngine.js → C:\Users\clash\Documents\SIH-base\app\(authed)\teacher\questions\page.tsx
- `getStudentDetailedAnalytics()` --calls--> `all()`  [INFERRED]
  C:\Users\clash\Documents\SIH-base\server\services\analyticsService.js → C:\Users\clash\Documents\SIH-base\scripts\migrate-sqlite-to-postgres.js
- `generateQuestion()` --calls--> `add()`  [INFERRED]
  C:\Users\clash\Documents\SIH-base\app\components\games\MathDungeonGame.tsx → C:\Users\clash\Documents\SIH-base\server\index.legacy.js
- `authenticateToken()` --calls--> `next()`  [INFERRED]
  C:\Users\clash\Documents\SIH-base\server\index.legacy.js → C:\Users\clash\Documents\SIH-base\app\components\games\WordForgeGame.tsx
- `makePlayer()` --calls--> `add()`  [INFERRED]
  C:\Users\clash\Documents\SIH-base\public\games\FightingGame\main.js → C:\Users\clash\Documents\SIH-base\server\index.legacy.js

## Hyperedges (group relationships)
- **All Player 1 sprites depict the same samurai character with consistent design** —  [EXTRACTED 1.00]
- **Player 2 Complete Animation Set** —  [EXTRACTED 1.00]
- **Player 2 Visual Color Differentiation from Player 1** —  [INFERRED 0.80]
- **Oak Woods Parallax Background Stack** —  [INFERRED 0.95]
- **Oak Woods Foreground Prop Set** —  [INFERRED 0.85]
- **Complete Oak Woods Stage Asset Collection** —  [INFERRED 0.90]

## Communities

### Community 0 - "Car Race Adaptive Quiz Game"
Cohesion: 0.07
Nodes (33): In-Game Adaptive Difficulty (3 correct = harder, 2 wrong = easier), Answer History Tracking (conceptTags, errorType, timeSpent), Car Race Quiz Game, Offline/Demo LocalStorage Progress Fallback, postMessage Quiz Results to Parent Window, POST /api/quiz-complete Score Reporting, GameQuizLoader (shared-questions.js), Learner API Endpoints (+25 more)

### Community 1 - "Auth Tokens and WordForge"
Cohesion: 0.1
Nodes (13): authenticate(), issueTokens(), optionalAuthenticate(), readAccessToken(), authenticateToken(), accessTtlFor(), hashToken(), refreshExpiryDate() (+5 more)

### Community 2 - "Database Connection Layer"
Cohesion: 0.09
Nodes (7): setMySQLConnection(), createMySQLTables(), ensureSQLiteColumn(), initMySQL(), initSQLite(), runSQLiteMigrations(), startServer()

### Community 3 - "SQLite to Postgres Migration"
Cohesion: 0.28
Nodes (23): all(), main(), migrateAdmins(), migrateAssignments(), migrateBadges(), migrateConceptMastery(), migrateEngagementPatterns(), migrateErrorPatterns() (+15 more)

### Community 4 - "IndexedDB Offline Storage"
Cohesion: 0.15
Nodes (2): IndexedDBService, load()

### Community 5 - "Math Dungeon and Experimentation"
Cohesion: 0.14
Nodes (10): getStudentStrategy(), simpleHash(), trackOutcomes(), GameScene, generateQuestion(), rand(), ensureChapter(), ensureSubject() (+2 more)

### Community 6 - "AI Tutor and Learning Intelligence"
Cohesion: 0.12
Nodes (14): generatePostQuizFeedback(), generateRealTimeHint(), detectLearningStyle(), getStudentKnowledgeState(), normStyleIn(), normStyleOut(), updateConceptMastery(), updateLearningProfile() (+6 more)

### Community 7 - "Claude AI Client Services"
Cohesion: 0.19
Nodes (17): buildTutorMessages(), callClaudeJson(), getClient(), gradeBandStyle(), explainWrongAnswer(), generateHint(), generateStudyNudge(), gradeFreeTextResponse() (+9 more)

### Community 8 - "Analytics Platform Services"
Cohesion: 0.15
Nodes (16): getPlatformAnalytics(), getClassAnalytics(), getPerformanceDistribution(), getRecentActivity(), getStudentDetailedAnalytics(), getStudentsInScope(), startOfDay(), startOfWeekUtc() (+8 more)

### Community 9 - "Question Mapper and Data Utils"
Cohesion: 0.16
Nodes (15): convertDifficultyToLevel(), enrichQuestion(), fetchQuestionsData(), getAvailableGrades(), getChapterCompletion(), getChaptersForSubject(), getQuestionCountForChapter(), getQuestionsForChapter() (+7 more)

### Community 10 - "Next.js App Router Pages"
Cohesion: 0.16
Nodes (10): onCompleted(), refresh(), buy(), equip(), handleSubmit(), load(), set(), setChoice() (+2 more)

### Community 11 - "Shared Quiz Loader"
Cohesion: 0.24
Nodes (10): fetchAllQuestions(), fetchRecommendedDifficulty(), filterByDifficulty(), filterQuestions(), loadQuestions(), normalizeSubject(), parseGrade(), parseParams() (+2 more)

### Community 12 - "Student and Teacher Profiles"
Cohesion: 0.21
Nodes (6): fetchProfileData(), handleSave(), onCompleted(), t(), fetchProfileData(), handleSave()

### Community 13 - "FightingGame Player Animations"
Cohesion: 0.42
Nodes (13): Attack Animation State, Death Animation State, Idle Animation State, Jump Animation State, Run Animation State, Player 2 Attack Animation Sprite Sheet, Player 2 Death Animation Sprite Sheet, FightingGame Assets Directory (+5 more)

### Community 14 - "Quest and XP System"
Cohesion: 0.24
Nodes (7): ensureUserQuestProgress(), fireEvent(), matchesGoal(), awardSession(), isSameDay(), isYesterday(), nextStreak()

### Community 15 - "Architecture Migration Roadmap"
Cohesion: 0.18
Nodes (11): Chatbot: OpenAI to Claude (Anthropic SDK) Swap, Next.js 14 App Router Scaffold (23 pages), Prisma ORM Schema (33 tables), Socket.io Quiz Battle Multiplayer, SQLite to Postgres Migration Script, Supabase Postgres Migration Setup, Vite to Next.js Migration, Express Backend (:3001) with Socket.io (+3 more)

### Community 16 - "Multiplayer Quiz Battle Sockets"
Cohesion: 0.29
Nodes (6): advanceOrEnd(), broadcastQuestion(), endMatch(), leaderboard(), loadQuestionsForLobby(), pickQuestions()

### Community 17 - "Teacher Dashboard and Recommendations"
Cohesion: 0.27
Nodes (6): fetchAnalytics(), fetchRecommendations(), formatTimeAgo(), getTeacherId(), handleManualRefresh(), handleRefresh()

### Community 18 - "FightingGame Oak Woods Environment"
Cohesion: 0.36
Nodes (10): Background Layer 1 — Misty Far Forest, Background Layer 2 — Purple Oak Forest Mid, Wooden Fence Prop (Variant 1), Wooden Fence Prop (Variant 2), Fighting Game — Oak Woods Level Environment, FightingGame (SIH Project Mini-Game), Oak Woods Ground Tileset, Small Rock Ground Prop (+2 more)

### Community 19 - "Chatbot Widget UI"
Cohesion: 0.33
Nodes (5): addAssistantTypingMessage(), ask(), handleRetry(), handleSend(), replaceMessageById()

### Community 21 - "Feedback and Game Player UI"
Cohesion: 0.32
Nodes (3): fetchFeedback(), handleMessage(), handleQuizCompleted()

### Community 22 - "FightingGame Player 1 Sprites"
Cohesion: 0.75
Nodes (8): Player 1 Animation State Set, FightingGame Player 1 Character, Player 1 Attack Animation Sprite Sheet, Player 1 Death Animation Sprite Sheet, Player 1 Idle Animation Sprite Sheet, Player 1 Jump Animation Sprite Sheet, Player 1 Run Animation Sprite Sheet, Pixel Art Sprite Style

### Community 23 - "App Layout and Routing"
Cohesion: 0.33
Nodes (4): AuthedLayout(), navFor(), Home(), useAuth()

### Community 24 - "School Events and Tasks"
Cohesion: 0.57
Nodes (6): addEvent(), addTask(), listEvents(), listTasks(), read(), write()

### Community 25 - "Science Lesson Content"
Cohesion: 0.29
Nodes (7): Interactive Lesson Slide Format (sidebar topics + slide navigation), Scientific Method Concept, Science Chapter 1: Welcome to Science (Lesson Slides), Science Chapter 2: Diversity in the Living World, Science Chapter 3: Mindful Eating / Food Nutrients, Science Chapter 4: Exploring Magnets, Science Chapter 5: Measurement of Length and Motion

### Community 26 - "Badge Progression System"
Cohesion: 0.67
Nodes (7): Achiever Badge, Beginner Badge, Champion Badge, Achievement Tier, Badge Progression System, Learner Badge, Five-Pointed Star Symbol

### Community 27 - "History Conquest Game"
Cohesion: 0.4
Nodes (2): finishGame(), nextPhase()

### Community 28 - "Science Lab Game"
Cohesion: 0.4
Nodes (2): finishGame(), next()

### Community 29 - "Admin Analytics UI"
Cohesion: 0.4
Nodes (2): fetchAnalytics(), handleManualRefresh()

### Community 30 - "Module 30"
Cohesion: 0.47
Nodes (3): onSignal(), onStorage(), refresh()

### Community 31 - "Module 31"
Cohesion: 0.7
Nodes (4): getPendingSync(), openDB(), removePendingSync(), syncData()

### Community 32 - "Module 32"
Cohesion: 0.6
Nodes (3): adjustContentPace(), calculateOptimalPacing(), daysSpan()

### Community 33 - "Module 33"
Cohesion: 0.6
Nodes (3): enrichQuestion(), extractConceptsFromQuestion(), getQuestionDifficulty()

### Community 38 - "Module 38"
Cohesion: 0.67
Nodes (2): fetchLeaderboard(), onCompleted()

### Community 40 - "Module 40"
Cohesion: 1.0
Nodes (2): onKey(), send()

### Community 67 - "Module 67"
Cohesion: 1.0
Nodes (2): School-Scoped Leaderboard (rationale: was class-scoped, now school_id), School-Exclusive Platform (grades 6-12)

### Community 116 - "Module 116"
Cohesion: 1.0
Nodes (1): Phaser 3 Games (Math Dungeon, Word Forge, Science Lab Escape, History Conquest)

## Knowledge Gaps
- **22 isolated node(s):** `EducationalOrganization JSON-LD Schema`, `Next.js 14 App Router Scaffold (23 pages)`, `Phaser 3 Games (Math Dungeon, Word Forge, Science Lab Escape, History Conquest)`, `Socket.io Quiz Battle Multiplayer`, `School-Scoped Leaderboard (rationale: was class-scoped, now school_id)` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `IndexedDB Offline Storage`** (24 nodes): `IndexedDBService`, `.addToPendingSync()`, `.getAllLessons()`, `.getLesson()`, `.getPendingSync()`, `.getQuiz()`, `.getUserBadges()`, `.getUserProgress()`, `.getUserStats()`, `.initDB()`, `.registerBackgroundSync()`, `.removePendingSync()`, `.saveBadge()`, `.saveLesson()`, `.saveProgress()`, `.saveQuiz()`, `.updateUserStats()`, `getLearningStyleLabel()`, `handleContinueLesson()`, `handleOpenSubject()`, `load()`, `ProgressBar()`, `Lessons.tsx`, `indexedDB.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `History Conquest Game`** (6 nodes): `HistoryConquestGame.tsx`, `attackTerritory()`, `claimReward()`, `finishGame()`, `nextPhase()`, `submitAnswer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Science Lab Game`** (6 nodes): `ScienceLabGame.tsx`, `claimReward()`, `finishGame()`, `handleMatchClick()`, `next()`, `submitBalance()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Analytics UI`** (6 nodes): `fetchAnalytics()`, `formatTimeAgo()`, `getScoreBgColor()`, `getScoreColor()`, `handleManualRefresh()`, `AdminAnalytics.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 38`** (4 nodes): `fetchLeaderboard()`, `getRankColor()`, `onCompleted()`, `Leaderboard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 40`** (3 nodes): `page.tsx`, `onKey()`, `send()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 67`** (2 nodes): `School-Scoped Leaderboard (rationale: was class-scoped, now school_id)`, `School-Exclusive Platform (grades 6-12)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 116`** (1 nodes): `Phaser 3 Games (Math Dungeon, Word Forge, Science Lab Escape, History Conquest)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `add()` connect `Analytics Platform Services` to `Database Connection Layer`, `Math Dungeon and Experimentation`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `generateQuestion()` connect `Math Dungeon and Experimentation` to `Analytics Platform Services`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `all()` (e.g. with `runSQLiteMigrations()` and `ensureSQLiteColumn()`) actually correct?**
  _`all()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `EducationalOrganization JSON-LD Schema`, `Next.js 14 App Router Scaffold (23 pages)`, `Phaser 3 Games (Math Dungeon, Word Forge, Science Lab Escape, History Conquest)` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Car Race Adaptive Quiz Game` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Auth Tokens and WordForge` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Database Connection Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._