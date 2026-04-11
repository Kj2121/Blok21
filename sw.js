// BLOK Service Worker v3 — Offline support
const CACHE = 'blok-v3';
const ASSETS = [
  '/Blok21/',
  '/Blok21/index.html',
  '/Blok21/manifest.json',
  '/Blok21/icon-192.png',
  '/Blok21/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // Don't fail install if some assets miss
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  // Firebase and Google APIs — network only
  const url = e.request.url;
  if (url.includes('firestore.googleapis.com') ||
      url.includes('identitytoolkit.googleapis.com') ||
      url.includes('securetoken.googleapis.com') ||
      url.includes('firebaseio.com')) {
    return;
  }

  // Cache first for app assets, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Update cache in background
        fetch(e.request).then(r => {
          if (r && r.status === 200) {
            const clone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
        }).catch(() => {});
        return cached;
      }
      // Not in cache — try network
      return fetch(e.request).then(r => {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
