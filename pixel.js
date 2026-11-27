/* Sport Share — Meta Pixel (đo hiệu quả quảng cáo Facebook/Instagram).
   - Dán mã Pixel ID (một dãy số) vào META_PIXEL_ID bên dưới. Để trống = tắt hoàn toàn.
   - Chỉ tải Pixel khi người xem bấm "Đồng ý" (Nghị định 13/2023 về bảo vệ dữ liệu cá nhân).
   - Không gửi email, tên, số điện thoại hay dữ liệu hội lên Meta.
   Dùng chung cho landing (/) và app (/app/). */
(function () {
  var META_PIXEL_ID = '1908438420570807';

  var KEY = 'sportshare.consent.v1';
  var queue = [], loaded = false;
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function load() {
    if (loaded || !META_PIXEL_ID) return; loaded = true;
    /* mã chuẩn của Meta */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; t.onload = function () { status('ok'); }; t.onerror = function () { status('blocked'); }; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
    queue.forEach(function (a) { window.fbq.apply(null, a); }); queue = [];
  }

  /* ?pixeltest trên địa chỉ trang: hiện trạng thái Pixel để kiểm tra (không cần F12) */
  var TEST = /[?&]pixeltest/.test(location.search);
  function status(st) {
    if (!TEST) return;
    var d = document.getElementById('ss-pxtest') || document.createElement('div'); d.id = 'ss-pxtest';
    d.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;z-index:10000;max-width:560px;margin:0 auto;border-radius:14px;padding:12px 16px;font:700 15px/1.45 system-ui,sans-serif;color:#fff;box-shadow:0 12px 30px -10px rgba(0,0,0,.6);background:' + (st === 'ok' ? '#12A150' : st === 'blocked' ? '#E5383B' : '#0B1D33');
    d.textContent = st === 'ok' ? '✅ Meta Pixel ' + META_PIXEL_ID + ' đã chạy, đã gửi PageView. Xem tab "Thử nghiệm sự kiện".'
      : st === 'blocked' ? '⛔ Trình duyệt hoặc tiện ích chặn quảng cáo đã chặn Meta Pixel. Thử tắt tiện ích chặn quảng cáo hoặc dùng điện thoại.'
      : st === 'no' ? 'ℹ️ Bạn đã chọn "Không, cảm ơn" nên Pixel không chạy. Tải lại trang để chọn lại.'
      : 'ℹ️ Pixel ' + (META_PIXEL_ID || '(chưa có ID)') + ': bấm "Đồng ý" ở khung 🍪 phía dưới để kiểm tra.';
    document.body.appendChild(d);
  }

  /* SSPixel.track('CompleteRegistration', {...}) — sự kiện chuẩn; SSPixel.custom('CreateClub', {...}) — sự kiện tự đặt */
  function send(kind, name, params) {
    if (!META_PIXEL_ID || get() === 'no') return;
    var a = [kind, name, params || {}];
    if (loaded && window.fbq) window.fbq.apply(null, a); else queue.push(a);
  }

  function banner() {
    if (!META_PIXEL_ID || document.getElementById('ss-consent')) return;
    var app = /\/app\//.test(location.pathname);
    var d = document.createElement('div'); d.id = 'ss-consent'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Đồng ý cookie đo lường');
    d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:' + (app ? 'calc(84px + env(safe-area-inset-bottom))' : 'calc(12px + env(safe-area-inset-bottom))') + ';z-index:9999;max-width:560px;margin:0 auto;background:#0B1D33;color:#EEF3FA;border:1px solid #22395A;border-radius:16px;padding:14px 16px;box-shadow:0 18px 40px -16px rgba(0,0,0,.6);font:600 14px/1.45 "Be Vietnam Pro",system-ui,sans-serif';
    d.innerHTML = '<div>🍪 Sport Share dùng <b>Meta Pixel</b> để đo hiệu quả quảng cáo trên Facebook. Không gửi tên, email hay dữ liệu hội. Bạn đồng ý chứ?</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" data-c="yes" style="flex:1;min-width:110px;background:#FF5A1F;color:#fff;border:0;border-radius:10px;padding:10px 14px;font:inherit;font-weight:800;cursor:pointer">Đồng ý</button>' +
      '<button type="button" data-c="no" style="flex:1;min-width:110px;background:transparent;color:#EEF3FA;border:1px solid #22395A;border-radius:10px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer">Không, cảm ơn</button></div>';
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]'); if (!b) return;
      set(b.getAttribute('data-c')); d.remove();
      if (b.getAttribute('data-c') === 'yes') load(); else { queue = []; status('no'); }
    });
    document.body.appendChild(d);
  }

  window.SSPixel = {
    enabled: function () { return !!META_PIXEL_ID; },
    choice: function () { return get(); },
    track: function (n, p) { send('track', n, p); },
    custom: function (n, p) { send('trackCustom', n, p); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} if (!loaded) banner(); else { set('no'); location.reload(); } }
  };

  function start() {
    if (TEST) { try { localStorage.removeItem(KEY); } catch (e) {} status('wait'); }
    var c = get(); if (c === 'yes') load(); else if (c !== 'no') banner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
