// Офлайн-кэш: сначала сеть (чтобы обновления приходили сразу), без сети — из кэша.
const CACHE = 'p6m-v2';
const SHELL = ['./', './index.html', './app.js', './style.css', './manifest.webmanifest', './icon-192.png', './fonts/inter-cyrillic-wght-normal.woff2', './fonts/inter-latin-wght-normal.woff2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
