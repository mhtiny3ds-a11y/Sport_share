/* Sport Share service worker: lưu sẵn vỏ ứng dụng để mở được khi mất mạng. */
const CACHE = 'sportshare-v3';
const SHELL = ['./', 'index.html', 'css/app.css?v=3', 'js/qrcode.js?v=3', 'js/core.js?v=3', 'js/views.js?v=3', 'js/app.js?v=3', 'manifest.webmanifest', 'icon.svg', 'favicon.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'huong-dan-su-dung.pdf?v=1',
  'fonts/be-vietnam-pro-vietnamese-400-normal.woff2', 'fonts/be-vietnam-pro-vietnamese-600-normal.woff2', 'fonts/be-vietnam-pro-vietnamese-700-normal.woff2', 'fonts/be-vietnam-pro-vietnamese-800-normal.woff2',
  'fonts/be-vietnam-pro-latin-400-normal.woff2', 'fonts/be-vietnam-pro-latin-600-normal.woff2', 'fonts/be-vietnam-pro-latin-700-normal.woff2', 'fonts/be-vietnam-pro-latin-800-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  // mạng trước, lỗi mạng thì dùng bản đã lưu
  e.respondWith(fetch(r).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); return res; }).catch(() => caches.match(r, { ignoreSearch: false }).then(m => m || caches.match('index.html'))));
});
