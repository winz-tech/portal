// ===== 穎利作業中心 Service Worker v3（網路優先·HTML永不快取·強制更新）=====
const CACHE = 'winz-portal-v4';   // ★大改版時改 v4、v5 強制更新

self.addEventListener('install', function(e){ self.skipWaiting(); });

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // ★ HTML 頁面（index.html 等）：永遠只用網路，絕不吃快取
  //   → 改 GitHub 一定即時生效，不會再「以為舊版」
  var isHTML = e.request.mode === 'navigate'
            || url.pathname.endsWith('.html')
            || url.pathname === '/' 
            || url.pathname.endsWith('/portal/')
            || url.pathname.endsWith('/portal');

  if (isHTML) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(function(){
        return caches.match(e.request);   // 只有真的斷網才給舊的
      })
    );
    return;
  }

  // 其他資源（圖、字型、manifest）：Network First + 快取備援
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      return res;
    }).catch(function(){ return caches.match(e.request); })
  );
});


/* ===================== Web Push ===================== */
self.addEventListener('push', function(event){
  event.waitUntil((async function(){            // 鐵律3：漏 waitUntil 訂閱會死
    var d = { title:'WINZ', body:'', url:'./index.html' };
    try { if (event.data) d = Object.assign(d, event.data.json()); } catch(e){}
    await self.registration.showNotification(d.title, {
      body: d.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      data: { url: d.url }
    });
  })());
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  event.waitUntil((async function(){
    var url = (event.notification.data && event.notification.data.url) || './index.html';
    var list = await clients.matchAll({ type:'window', includeUncontrolled:true });
    for (var i=0;i<list.length;i++){
      if ('focus' in list[i]) { await list[i].focus(); return; }
    }
    if (clients.openWindow) await clients.openWindow(url);
  })());
});
