/* Sport Share: trước đây web app nằm ở thư mục gốc và đăng ký service worker tại đây.
   Nay app đã chuyển vào /app/ (có service worker riêng), file này chỉ dọn bộ nhớ đệm cũ rồi tự gỡ đăng ký. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => /^sportshare-v\d+$/.test(k)).map(k => caches.delete(k))))
    .then(() => self.registration.unregister()));
});
