// BLOK Service Worker v4
const CACHE = 'blok-v4';
const ASSETS = [
  '/Blok21/index.html',
  '/Blok21/manifest.json',
  '/Blok21/icon-192.png',
  '/Blok21/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
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

  const url = e.request.url;

  // Let ALL external APIs go straight to network — no caching
  if (url.includes('googleapis.com') ||
      url.includes('google.com') ||
      url.includes('gstatic.com') ||
      url.includes('firebaseio.com') ||
      url.includes('firebase.com') ||
      url.includes('firebaseapp.com') ||
      url.includes('accounts.google.com') ||
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com')) {
    return;
  }

  // Only cache local app files
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        fetch(e.request).then(r => {
          if (r && r.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, r.clone()));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request).then(r => {
        if (r && r.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        }
        return r;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
