const CACHE = 'hadis-nav-v11';
const CORE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/css/iconfont-3.03029.1.css',
  '/assets/css/fonts/iconfont-hadis.woff2',
  '/assets/css/bootstrap-subset.css?v=20260801-1',
  '/assets/css/theme-subset.css?v=20260801-1',
  '/assets/css/custom-style.css?v=20260801-1',
  '/assets/css/static-icons.css?v=20260801-1',
  '/assets/fontawesome-5.15.4/webfonts/fa-regular-400.woff2',
  '/assets/fontawesome-5.15.4/webfonts/fa-solid-900.woff2',
  '/assets/fontawesome-5.15.4/webfonts/fa-brands-400.woff2',
  '/assets/js/site-enhancements.js?v=20260731-1',
  '/assets/js/index-page.js?v=20260801-1',
  '/assets/images/hadis-logo.svg',
  '/assets/images/hadis-logo-dark.svg',
  '/assets/images/hadis-mark.svg',
  '/assets/images/logos/default.webp'
];
const CORE_URLS = new Set(CORE.map((path) => new URL(path, self.location.origin).href));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((response) => {
          if (!response.ok) return response;
          return caches.open(CACHE)
            .then((cache) => cache.put(request, response.clone()))
            .then(() => response);
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline.html')))
    );
    return;
  }

  if (CORE_URLS.has(url.href)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
    return;
  }

  const networkUpdate = fetch(request).then((response) => {
    if (!response.ok || response.type !== 'basic') return response;
    return caches.open(CACHE)
      .then((cache) => cache.put(request, response.clone()))
      .then(() => response);
  });
  event.waitUntil(networkUpdate.then(() => undefined).catch(() => undefined));
  event.respondWith(
    caches.match(request).then((cached) => cached || networkUpdate)
  );
});
