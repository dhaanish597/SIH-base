const CACHE_NAME = 'stem-learn-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// Install SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
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