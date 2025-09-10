const CACHE_NAME = 'stem-learn-v2';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  OFFLINE_URL
];

// Install SW
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
    self.skipWaiting();
  })());
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Network-first for API, cache-first for static
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && isCacheable(request)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const url = new URL(request.url);
    if (url.origin === location.origin && url.pathname === '/') {
      return cache.match(OFFLINE_URL);
    }
    throw err;
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

function isCacheable(request) {
  const url = new URL(request.url);
  return url.origin === location.origin;
}

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Get pending sync data from IndexedDB
    const db = await openDB();
    const pendingData = await getPendingSync(db);
    
    for (const data of pendingData) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: data.type, data: data.data })
        });
        
        // Remove from pending sync after successful upload
        await removePendingSync(db, data.id);
      } catch (error) {
        console.error('Sync failed for item:', data.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('StemLearnDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getPendingSync(db) {
  const transaction = db.transaction(['pendingSync'], 'readonly');
  const store = transaction.objectStore('pendingSync');
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingSync(db, id) {
  const transaction = db.transaction(['pendingSync'], 'readwrite');
  const store = transaction.objectStore('pendingSync');
  store.delete(id);
}