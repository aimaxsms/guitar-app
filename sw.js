const CACHE_NAME = 'guitar-app-v26';
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
  './js/mysongs.js',
  './js/sheets.js',
  './js/library.js',
  './js/theory.js',
  './js/scale-diagram.js',
  './js/scales.js',
  './js/techniques.js',
  './js/livechords.js',
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

  // Only handle this app's own files; let external links (chord sites etc.) go straight through.
  if (new URL(event.request.url).origin !== self.location.origin) return;

  // Network-first: always try to get the latest version so updates show up right away,
  // and fall back to the cached copy only when offline.
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
