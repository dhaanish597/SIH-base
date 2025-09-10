import { useState, useEffect, useCallback } from 'react';
import { indexedDBService } from '../utils/indexedDB';

export function useUserStats() {
  const [stats, setStats] = useState({
    totalPoints: 0,
    streak: 0,
    level: 1,
    lastActivity: new Date(),
    badges: []
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const userStats = await indexedDBService.getUserStats();
      if (userStats) {
        setStats(userStats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStats = useCallback(async (newStats: Partial<typeof stats>) => {
    const updatedStats = { ...stats, ...newStats };
    setStats(updatedStats);
    await indexedDBService.updateUserStats(updatedStats);
  }, [stats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, updateStats, loading, refresh: loadStats };
}

export function useUserProgress(userId: string) {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    try {
      const userProgress = await indexedDBService.getUserProgress(userId);
      setProgress(userProgress);
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveProgress = useCallback(async (lessonId: string, score: number, timeSpent: number) => {
    try {
      await indexedDBService.saveProgress({
        userId,
        lessonId,
        completed: true,
        score,
        timeSpent,
        completedAt: new Date(),
        synced: false
      });
      await loadProgress();
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [userId, loadProgress]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return { progress, saveProgress, loading, refresh: loadProgress };
}

export function useLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLessons = useCallback(async () => {
    try {
      const allLessons = await indexedDBService.getAllLessons();
      setLessons(allLessons);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  return { lessons, loading, refresh: loadLessons };
}

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      await indexedDBService.registerBackgroundSync();
      return;
    }

    setSyncStatus('syncing');
    
    try {
      const pendingData = await indexedDBService.getPendingSync();
      
      for (const item of pendingData) {
        try {
          const response = await fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: item.type,
              data: item.data
            })
          });

          if (response.ok) {
            await indexedDBService.removePendingSync(item.id);
          }
        } catch (error) {
          console.error('Failed to sync item:', item.id, error);
        }
      }
      
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, []);

  useEffect(() => {
    if (navigator.onLine) {
      triggerSync();
    }

    const handleOnline = () => {
      triggerSync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [triggerSync]);

  return { syncStatus, triggerSync };
}