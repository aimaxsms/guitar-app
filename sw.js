const CACHE_NAME = 'guitar-app-v9';
const CACHE_FILES = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './js/tunings.js',
  './js/audio-utils.js',
  './js/headstock-art.js',
  './js/app.js',
  './js/pitch-worklet.js',
  './js/metronome.js',
  './js/onset-worklet.js',
  './js/strum.js',
  './js/chords.js',
  './js/chord-shapes.js',
  './js/chord-diagram.js',
  './js/sheets.js',
  './js/library.js',
  './js/theory.js',
  './js/scale-diagram.js',
  './js/scales.js',
  './js/nav.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
