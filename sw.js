// 推送配置中心 · Service Worker
// 作用：把页面缓存到本地，断网也能打开（纯前端页面，所有数据都在 localStorage）
const CACHE = 'tariff-push-v8';
const ASSETS = [
  './push-center.html',
  './manifest.json'
];
// 本 SW 只为「配置中心离线可用」而存在，因此只接管下面这两个自身资源。
// 此前它对全部同源 GET 请求做「缓存优先」：凡是访问过配置中心的浏览器，
// data/latest.json、app.js 等站点资源都会被旧缓存命中，表现为数据不刷新、
// 默认省在江西/湖南之间反复横跳（本次先给旧缓存、后台再更新，刷新结果不一致）。
const OWN_PATHS = ['/push-center.html', '/manifest.json'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // 单个失败不拖垮整体
      return Promise.allSettled(ASSETS.map(function (u) { return c.add(u); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// 离线优先：先给缓存，再后台更新
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 跨域（webhook 等）不拦截
  // 站点数据 / 脚本 / 样式等一律交回浏览器正常处理，避免读到过期缓存
  if (!OWN_PATHS.some(function (p) { return url.pathname.endsWith(p); })) return;

  e.respondWith(
    caches.match(req).then(function (hit) {
      const net = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
