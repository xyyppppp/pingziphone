const CACHE = 'bottle-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});

// ===== 主动发消息支持 =====
var alarmTimers = {};

self.addEventListener('message', function(e) {
  var data = e.data;
  if (!data || !data.type) return;
  if (data.type === 'SET_AUTO_MSG') {
    var key = data.key;
    if (alarmTimers[key]) { clearInterval(alarmTimers[key]); delete alarmTimers[key]; }
    if (data.enabled && data.interval > 0) {
      alarmTimers[key] = setInterval(function() {
        self.clients.matchAll({type: 'window'}).then(function(clients) {
          clients.forEach(function(client) {
            client.postMessage({type: 'TRIGGER_AUTO_MSG', chatId: data.chatId});
          });
        });
      }, data.interval);
    }
  }
  if (data.type === 'CLEAR_AUTO_MSG') {
    var k = data.key;
    if (alarmTimers[k]) { clearInterval(alarmTimers[k]); delete alarmTimers[k]; }
  }
  if (data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(data.title || '你有一条新消息', {
      body: data.body || '',
      icon: 'https://i.postimg.cc/bNYXDWvv/retouch-2026072623182654.png',
      tag: 'autoMsg_' + Date.now()
    });
  }
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({type: 'window'}).then(function(clients) {
      if (clients.length > 0) { clients[0].focus(); return; }
      return self.clients.openWindow('/');
    })
  );
});
