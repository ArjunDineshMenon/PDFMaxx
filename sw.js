// PDFMaxx — Offline Progressive Web App (PWA) Service Worker
const CACHE_NAME = 'pdfmaxx-cache-v2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// External CDN dependencies to cache for 100% offline functionality
const CDN_HOSTS = [
  'cdn.tailwindcss.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache error (non-fatal):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Check if request is to external CDN or local origin
  const isCdn = CDN_HOSTS.some(host => url.hostname.includes(host));
  const isLocal = url.origin === self.location.origin;

  if (isCdn || isLocal) {
    event.respondWith(
      caches.match(req).then((cachedResp) => {
        if (cachedResp) {
          // Stale-while-revalidate for local assets, cache-first for CDNs
          if (isLocal && req.mode === 'navigate') {
            fetch(req).then((netResp) => {
              if (netResp && netResp.status === 200) {
                caches.open(CACHE_NAME).then(c => c.put(req, netResp));
              }
            }).catch(() => {});
          }
          return cachedResp;
        }

        return fetch(req).then((netResp) => {
          if (!netResp || netResp.status !== 200) {
            return netResp;
          }
          const respClone = netResp.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, respClone);
          });
          return netResp;
        }).catch((fetchErr) => {
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
          throw fetchErr;
        });
      })
    );
  }
});
