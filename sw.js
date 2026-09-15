// 推送配置中心 · Service Worker（已停用，仅保留自我清理用途）
//
// 历史：本 SW 原用于让 push-center.html 离线可打开，采用「缓存优先」策略；
// 但 Service Worker 的默认作用域是整个站点目录，且原先对所有同源 GET 请求
// 都做缓存优先，于是 data/*.json、app.js 等站点资源也被缓存下来并优先返回，
// 导致站点长期读到旧快照 —— 表现为默认省与资费数据在江西/湖南之间反复横跳、
// 刷新结果不一致。
//
// 现状：站点不再注册 Service Worker（见 push-center.html）。本文件保留为
// 「清理脚本」：曾经注册过 SW 的浏览器下次加载本文件时，会自动删除全部
// 缓存并注销自身，用户无需手动清除浏览器数据。
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.registration.unregister(); })
  );
});

// 不再拦截任何请求：所有资源交给浏览器按正常网络规则处理。
