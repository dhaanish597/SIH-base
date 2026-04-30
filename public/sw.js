const VERSION = 'v3';
const PRECACHE = `quest-academy-precache-${VERSION}`;
const RUNTIME = `quest-academy-runtime-${VERSION}`;

// Minimal precache — only the offline fallback
const urlsToCache = [
  '/offline.html'
];

// Install SW — immediately activate, don't precache routes
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Fetch — NETWORK FIRST for everything, with offline fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-http(s) schemes
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // API calls: network only (no caching)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Next.js internal routes: network only
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation requests: network first, offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        return caches.match('/offline.html') || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // Static assets (images, fonts, etc.): network first, cache as fallback
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Only cache successful responses
        if (res.ok && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(RUNTIME).then((cache) => cache.put(event.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// Activate: clean up ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== PRECACHE && key !== RUNTIME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});