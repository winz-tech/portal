self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', function (event) {
  // 鐵律3：一定要 waitUntil，且一定要真的顯示通知
  event.waitUntil((async function () {
    let d = { title: 'WINZ', body: '測試通知' };
    try { if (event.data) d = Object.assign(d, event.data.json()); } catch (err) {}
    await self.registration.showNotification(d.title, {
      body: d.body,
      icon: '../icon-192.png',
      badge: '../icon-192.png',
      data: { url: d.url || './index.html' }
    });
  })());
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
