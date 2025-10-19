const CACHE_NAME = 'airsense-v1';
const urlsToCache = [
  '/',
  '/static/core/css/home.css',
  '/static/core/js/home.js',
  '/static/core/js/translations.js',
  '/static/core/icons/cloud.png',
  '/static/core/icons/favicon_airsense.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});