import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface StemLearnDB extends DBSchema {
  lessons: {
    key: string;
    value: {
      id: string;
      title: string;
      content: string;
      subject: string;
      difficulty: number;
      downloadedAt: Date;
    };
  };
  quizzes: {
    key: string;
    value: {
      id: string;
      lessonId: string;
      questions: Array<{
        id: string;
        question: string;
        options: string[];
        correctAnswer: number;
        points: number;
      }>;
      totalPoints: number;
    };
  };
  userProgress: {
    key: string;
    value: {
      userId: string;
      lessonId: string;
      completed: boolean;
      score: number;
      timeSpent: number;
      completedAt: Date;
      synced: boolean;
    };
  };
  badges: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string;
      icon: string;
      earnedAt: Date;
      synced: boolean;
    };
  };
  userStats: {
    key: 'current';
    value: {
      totalPoints: number;
      streak: number;
      level: number;
      lastActivity: Date;
      badges: string[];
    };
  };
  pendingSync: {
    key: string;
    value: {
      id: string;
      type: 'progress' | 'badge' | 'stats';
      data: any;
      timestamp: Date;
    };
  };
}

class IndexedDBService {
  private db: IDBPDatabase<StemLearnDB> | null = null;

  async initDB(): Promise<IDBPDatabase<StemLearnDB>> {
    if (!this.db) {
      this.db = await openDB<StemLearnDB>('StemLearnDB', 1, {
        upgrade(db) {
          // Lessons store
          if (!db.objectStoreNames.contains('lessons')) {
            db.createObjectStore('lessons', { keyPath: 'id' });
          }

          // Quizzes store
          if (!db.objectStoreNames.contains('quizzes')) {
            db.createObjectStore('quizzes', { keyPath: 'id' });
          }

          // User progress store
          if (!db.objectStoreNames.contains('userProgress')) {
            const progressStore = db.createObjectStore('userProgress', { keyPath: 'id' });
            progressStore.createIndex('userId', 'userId');
            progressStore.createIndex('lessonId', 'lessonId');
          }

          // Badges store
          if (!db.objectStoreNames.contains('badges')) {
            db.createObjectStore('badges', { keyPath: 'id' });
          }

          // User stats store
          if (!db.objectStoreNames.contains('userStats')) {
            db.createObjectStore('userStats', { keyPath: 'id' });
          }

          // Pending sync store
          if (!db.objectStoreNames.contains('pendingSync')) {
            db.createObjectStore('pendingSync', { keyPath: 'id' });
          }
        },
      });
    }
    return this.db;
  }

  // Lessons
  async saveLesson(lesson: StemLearnDB['lessons']['value']) {
    const db = await this.initDB();
    await db.put('lessons', lesson);
  }

  async getLesson(id: string) {
    const db = await this.initDB();
    return await db.get('lessons', id);
  }

  async getAllLessons() {
    const db = await this.initDB();
    return await db.getAll('lessons');
  }

  // Quizzes
  async saveQuiz(quiz: StemLearnDB['quizzes']['value']) {
    const db = await this.initDB();
    await db.put('quizzes', quiz);
  }

  async getQuiz(id: string) {
    const db = await this.initDB();
    return await db.get('quizzes', id);
  }

  // User Progress
  async saveProgress(progress: Omit<StemLearnDB['userProgress']['value'], 'id'>) {
    const db = await this.initDB();
    const id = `${progress.userId}-${progress.lessonId}`;
    await db.put('userProgress', { ...progress, id });
    
    // Add to pending sync if not already synced
    if (!progress.synced) {
      await this.addToPendingSync('progress', { ...progress, id });
    }
  }

  async getUserProgress(userId: string) {
    const db = await this.initDB();
    const tx = db.transaction('userProgress');
    const index = tx.store.index('userId');
    return await index.getAll(userId);
  }

  // User Stats
  async getUserStats() {
    const db = await this.initDB();
    return await db.get('userStats', 'current');
  }

  async updateUserStats(stats: StemLearnDB['userStats']['value']) {
    const db = await this.initDB();
    await db.put('userStats', { ...stats, id: 'current' });
    await this.addToPendingSync('stats', stats);
  }

  // Badges
  async saveBadge(badge: StemLearnDB['badges']['value']) {
    const db = await this.initDB();
    await db.put('badges', badge);
    
    if (!badge.synced) {
      await this.addToPendingSync('badge', badge);
    }
  }

  async getUserBadges() {
    const db = await this.initDB();
    return await db.getAll('badges');
  }

  // Pending Sync
  async addToPendingSync(type: 'progress' | 'badge' | 'stats', data: any) {
    const db = await this.initDB();
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.put('pendingSync', {
      id,
      type,
      data,
      timestamp: new Date()
    });
  }

  async getPendingSync() {
    const db = await this.initDB();
    return await db.getAll('pendingSync');
  }

  async removePendingSync(id: string) {
    const db = await this.initDB();
    await db.delete('pendingSync', id);
  }

  // Background Sync Registration
  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }
}

export const indexedDBService = new IndexedDBService();