// يخزّن ملفات التطبيق ليفتح بدون إنترنت. طلبات الخادم (Apps Script) لا تمر من هنا أبداً.
var CACHE = 'masarif-v4';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); })); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// نسخة المخزن أولاً (سريع وبدون إنترنت) مع تحديثها بالخلفية للمرة القادمة
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.searchParams.has('_')) return; // فحص الإصدار: دائماً من الخادم مباشرة
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (cached) {
        var net = fetch(req, { cache: 'no-cache' }).then(function (res) {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(function () { return cached || (req.mode === 'navigate' ? cache.match('index.html') : undefined); });
        return cached || net;
      });
    })
  );
});
