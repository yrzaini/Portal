
/* ── Service Worker — Cache-first for data assets ── */
const SW_VERSION = 'portail-amd-v1';
const PRECACHE = [
  './',
  'data/arrond.geojson.gz',
  'data/metro_lignes.geojson.gz',
  'data/metro_stations.geojson.gz',
];
const DATA_CACHE = 'portail-amd-data-v1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SW_VERSION)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== SW_VERSION && k !== DATA_CACHE)
        .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Cache-first for .geojson.gz data files
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.gz')) {
    e.respondWith(
      caches.open(DATA_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const resp = await fetch(e.request);
        if (resp.ok) cache.put(e.request, resp.clone());
        return resp;
      })
    );
    return;
  }
  // Network-first for everything else
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
