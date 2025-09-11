const VERSION = 'v2';
const PRECACHE = `stem-learn-precache-${VERSION}`;
const RUNTIME = `stem-learn-runtime-${VERSION}`;
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// Install SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Fetch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Ignore non-http(s) schemes (e.g., chrome-extension://) to avoid cache.put failures
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return; // let the request pass through
  }
  // Network-first for API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const resClone = response.clone();
        caches.open(RUNTIME).then((cache) => cache.put(event.request, resClone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  // Navigation requests: App Shell fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          return res;
        })
        .catch(async () => {
          const cached = await caches.match('/');
          return cached || caches.match('/offline.html');
        })
    );
    return;
  }
  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        return caches.open(RUNTIME).then((cache) => {
          cache.put(event.request, res.clone());
          return res;
        });
      });
    })
  );
});

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
          body: JSON.stringify(data)
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

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('stem-learn-') && key !== PRECACHE && key !== RUNTIME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

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