/* Sport Share — giao diện (mỗi hàm v* trả về HTML của một màn hình). */
'use strict';

const UI = { view: 'loading', tab: 'home', atab: 'home', sid: null, sheet: null, toast: null, err: '', reg: { step: 1 }, confirm: null, moneyTab: 'debt', sessFilter: 'up', rankPeriod: 'month', donateIdx: 1, shared: null, sharedMid: null, q: '', authMode: 'login', join: null, busy: false };
let toastTimer;
function toast(msg) { UI.toast = msg; render(); clearTimeout(toastTimer); toastTimer = setTimeout(() => { UI.toast = null; render(); }, 2800); }
function go(view, extra = {}) {
  Object.assign(UI, { view, err: '', sheet: null, confirm: null, busy: false }, extra);
  try { history.pushState({ v: view }, ''); } catch (e) {}
  render(); window.scrollTo(0, 0);
}

function render() {
  const app = $('#app'); const v = UI.view; let html = '';
  const c = club();
  app.style.setProperty('--sport', (['club', 'session'].includes(v) && c) ? sportOf(c).c : (v === 'shared' && UI.shared ? sportOf(UI.shared).c : '#FF5A1F'));
  try {
    if (v === 'loading') html = vLoading();
    else if (v === 'welcome') html = vWelcome();
    else if (v === 'auth') html = vAuth();
    else if (v === 'home') html = vHome();
    else if (v === 'account') html = vAccount();
    else if (v === 'register') html = vRegister();
    else if (v === 'join') html = vJoin();
    else if (v === 'club') html = vClub();
    else if (v === 'session') html = vSession();
    else if (v === 'shared') html = vShared();
    else if (v === 'legal') html = vLegal();
    else html = vWelcome();
  } catch (e) { console.error(e); html = `<div class="card stack"><b>Có lỗi khi hiển thị.</b><p class="tiny muted">${esc(e.message)}</p><button class="btn" data-act="goHome">Về trang chính</button></div>`; }
  app.className = v === 'club' ? '' : 'bare';
  app.innerHTML = html
    + (UI.sheet ? `<div class="scrim" data-act="closeSheet"><div class="sheet" data-stop="1" role="dialog" aria-modal="true"><div class="grip"></div>${UI.sheet()}</div></div>` : '')
    + (UI.toast ? `<div class="toast" role="status">${esc(UI.toast)}</div>` : '');
  const af = app.querySelector('[autofocus]'); if (af && !('ontouchstart' in window)) af.focus();
}

/* ---------- khối dùng chung ---------- */
const backBtn = (act = 'goHome', label = 'Quay lại') => `<div class="row"><button class="x" data-act="${act}" aria-label="${label}">←</button></div>`;
const secH = (t, right = '') => `<div class="sec-h"><h2>${t}</h2>${right}</div>`;
const empty = (em, t) => `<div class="empty"><span class="em">${em}</span><span>${t}</span></div>`;
const sportChip = s => `<span class="pill sport">${s.ic} ${esc(s.name)}</span>`;
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const err = () => UI.err ? `<p class="err" role="alert">${esc(UI.err)}</p>` : '';
const meAva = (cls = '') => ME && ME.photo ? `<span class="ava ${cls}" style="background:url('${esc(ME.photo)}') center/cover"></span>` : `<span class="ava ${cls}" style="--ac:var(--volt);color:var(--navy);font-weight:800">${esc(initials((ME && ME.name) || 'Bạn').slice(0, 2) || '🙂')}</span>`;
const roleP = r => r ? `<span class="pill ${r === 'member' ? 'sky' : 'volt'}">${r === 'member' ? '🏃' : '🛡️'} ${roleLabel(r)}</span>` : '';
const guideLink = () => `<a class="guide" href="../huong-dan-su-dung.pdf?v=4" target="_blank" rel="noopener"><span class="gi" aria-hidden="true">📘</span><span class="grow"><span class="gt">Hướng dẫn sử dụng</span><span class="gs">Đọc trước khi dùng · PDF có hình minh họa</span></span><span class="go"><span class="gol">Mở PDF </span>↗</span></a>`;
const googleBtn = (label = 'Tiếp tục với Google') => `<button class="btn block gbtn" data-act="googleSignIn" ${UI.busy ? 'disabled' : ''}><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>${label}</button>`;

/* Trình duyệt trong app (Zalo, Facebook, Messenger…): hay xóa đăng nhập khi thoát và bị Google chặn đăng nhập */
function inAppName() {
  const ua = navigator.userAgent || '';
  if (/Zalo/i.test(ua)) return 'Zalo';
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return /Messenger|MESSENGER/.test(ua) ? 'Messenger' : 'Facebook';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/\bLine\//i.test(ua)) return 'Line';
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return 'TikTok';
  if (/Telegram/i.test(ua)) return 'Telegram';
  return '';
}
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function inAppNote() {
  const n = inAppName(); if (!n) return '';
  const android = /Android/i.test(navigator.userAgent || '');
  return `<div class="note warn stack" style="gap:8px;border-left:5px solid var(--warn)"><span>⚠️ <b>Bạn đang mở Sport Share trong ${n}.</b> Trình duyệt này hay <b>xóa đăng nhập mỗi lần thoát</b> và chặn đăng nhập Google. Hãy mở bằng <b>${isIOS() ? 'Safari' : 'Chrome'}</b> để giữ đăng nhập.</span>
    <span class="tiny b">${isIOS() ? `Cách mở: bấm nút <b>•••</b> (hoặc ⋮) ở góc màn hình → <b>Mở bằng trình duyệt / Open in Safari</b>.` : `Cách mở: bấm nút <b>⋮</b> ở góc màn hình → <b>Mở bằng trình duyệt</b>, hoặc bấm nút dưới.`}</span>
    <div class="row wrap">${android ? `<a class="btn sm" style="text-decoration:none" href="intent://${location.host}${location.pathname}#Intent;scheme=https;package=com.android.chrome;end">Mở bằng Chrome</a>` : ''}<button class="btn sm ghost" data-act="copy" data-t="${esc(location.origin + location.pathname)}">📋 Chép link</button></div></div>`;
}

/* Fanpage: thẻ tự vẽ, không nhúng khung Facebook (không cookie Facebook) */
const FANPAGE = 'https://www.facebook.com/sportsharepro/';
function fanpageBox() {
  const feed = `<div class="feed"><a href="${FANPAGE}" target="_blank" rel="noopener">Xem bài viết mới trên Facebook →</a></div>`;
  return `<section class="fbbox">
    <a class="cv" href="${FANPAGE}" target="_blank" rel="noopener" aria-label="Ảnh bìa Fanpage Sport Share" style="background-image:url(../img/fb-cover.jpg)"></a>
    <a class="pg" href="${FANPAGE}" target="_blank" rel="noopener"><img src="icon.svg" alt=""><span><b>Sport Share - App chia tiền miễn phí</b><small>Fanpage chính thức · mẹo dùng, tính năng mới, góp ý</small></span></a>
    <div class="bt"><a class="fb" href="${FANPAGE}" target="_blank" rel="noopener">👍 Theo dõi</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://sportshare.pro.vn/')}" target="_blank" rel="noopener">↗ Chia sẻ</a></div>
    ${feed}</section>`;
}

function sessCard(c, s, act = 'openSession') {
  const d = parseDay(s.date), sp = sportOf(c);
  const vt = voteOf(c, s);
  const st = s.status === 'settled' ? '<span class="pill ok">Đã chốt</span>' : s.status === 'cancelled' ? '<span class="pill bad">Đã hủy</span>' : (s.date < dayKey() ? '<span class="pill warn">Chờ chốt</span>' : '<span class="pill sky">Sắp diễn ra</span>');
  const who = s.status === 'settled' ? `${sessHeads(s)} người · ${vnd(sessCost(s))}` : `✅ ${vt.going.length}${vt.max ? '/' + vt.max : ''} đi${vt.wait.length ? ` · ⏳ ${vt.wait.length} dự bị` : ''} · ❌ ${vt.no.length} không${s.attendees.length ? ` · ${s.attendees.length} điểm danh` : ''}`;
  return `<button class="sess ${s.status === 'settled' ? 'done' : ''} ${s.status === 'cancelled' ? 'cancel' : ''}" data-act="${act}" data-cid="${c.id}" data-sid="${s.id}">
    <span class="date"><span class="w">${WD[d.getDay()]}</span><span class="d">${pad2(d.getDate())}</span><span class="m">Th${d.getMonth() + 1}</span></span>
    <span class="tx"><span class="row between"><b class="ellip">${sp.ic} ${cap1(sp.unit)} ${s.time || ''}</b>${st}</span>
      <span class="tiny muted b ellip">📍 ${esc(s.venue || 'Chưa có địa điểm')}</span>
      <span class="tiny faint b">${who}${relDay(s.date) && s.status === 'open' ? ' · ' + relDay(s.date) : ''}</span></span></button>`;
}
function qrBlock({ bin, acct, holder, amount, note }) {
  return `<div class="qrbox">${qrSVG(vietQR({ bin, acct, amount, note }))}<div class="cap"><i></i>VietQR · Napas 247</div></div>
  <div class="kv">
    <div><span>Ngân hàng</span><b>${esc(bankName(bin) || bin)}</b></div>
    <div><span>Số tài khoản</span><span class="row" style="gap:6px"><b class="num" style="user-select:all">${esc(acct)}</b><button type="button" class="copy" data-act="copy" data-t="${esc(acct)}" aria-label="Chép số tài khoản">📋</button></span></div>
    ${holder ? `<div><span>Chủ tài khoản</span><b>${esc(holder)}</b></div>` : ''}
    ${amount ? `<div><span>Số tiền</span><b class="num" style="color:var(--brand);font-size:18px">${vnd(amount)}</b></div>` : ''}
    ${note ? `<div><span>Nội dung</span><span class="row" style="gap:6px"><b style="user-select:all">${esc(noTone(note))}</b><button type="button" class="copy" data-act="copy" data-t="${esc(noTone(note))}" aria-label="Chép nội dung">📋</button></span></div>` : ''}
  </div>`;
}

/* ---------- donate cafe ---------- */
function donateBlock() {
  const k = Math.min(UI.donateIdx ?? 1, DONATE_OPTS.length - 1), o = DONATE_OPTS[k];
  return `<section class="card stack" aria-labelledby="donate-h" style="border-top:4px solid var(--brand)">
    <div class="row"><span class="ava lg" style="--ac:var(--warn-soft)">☕</span><div class="grow"><div class="eyebrow">Ủng hộ Sport Share</div><h2 class="h3" id="donate-h">Mời ly Coffee để Team Sport Share có thêm sức mạnh đồng hành cùng các đội nhóm thể thao ☕</h2></div></div>
    <div class="chips" role="radiogroup" aria-label="Chọn ly cafe">${DONATE_OPTS.map((x, i) => `<button type="button" class="chip ${i === k ? 'on' : ''}" role="radio" aria-checked="${i === k}" data-act="donatePick" data-i="${i}">${x.amount ? '☕ ' : '💛 '}${x.label}</button>`).join('')}</div>
    <div class="qrbox">${qrSVG(vietQR({ bin: DONATE.bin, acct: DONATE.acct, amount: o.amount, note: DONATE.note }))}<div class="cap"><i></i>VietQR · Napas 247</div></div>
    <div class="kv">
      <div><span>Người nhận</span><b>${DONATE.name} · ${DONATE.bank}</b></div>
      <div><span>Số tài khoản</span><span class="row" style="gap:6px"><b class="num" style="user-select:all">${DONATE.acct}</b><button type="button" class="copy" data-act="copy" data-t="${DONATE.acct}" aria-label="Chép số tài khoản">📋</button></span></div>
      <div><span>Ly cafe</span><b>${o.amount ? '☕ ' + o.label : 'Tùy tâm'}</b></div>
      <div><span>Nội dung</span><span class="row" style="gap:6px"><b style="user-select:all">${DONATE.note}</b><button type="button" class="copy" data-act="copy" data-t="${DONATE.note}" aria-label="Chép nội dung">📋</button></span></div>
    </div>
    <button type="button" class="btn block navy" data-act="downloadDonate">⬇️ Tải mã QR ${o.amount ? 'ly ' + o.label : 'Tùy tâm'} về máy</button>
    <p class="tiny muted b">${o.amount ? 'Mở app ngân hàng, quét mã (hoặc chọn ảnh mã QR vừa tải). Thông tin đã điền sẵn, bạn kiểm tra rồi xác nhận.' : 'Mở app ngân hàng, quét mã rồi tự nhập số tiền.'}</p>
    <p class="demo tiny">Mọi sự ủng hộ là hoàn toàn tự nguyện để duy trì và phát triển ứng dụng miễn phí, không đi kèm nghĩa vụ hay dịch vụ thương mại.</p>
  </section>`;
}

/* ---------- chờ tải ---------- */
function vLoading() {
  return `<div style="min-height:70vh;display:grid;place-items:center;text-align:center"><div class="stack" style="align-items:center"><div class="brand" style="font-size:34px">Sport <b>Share</b></div><p class="muted b">Đang tải…</p></div></div>`;
}

/* ---------- màn hình đầu (chưa đăng nhập) ---------- */
function vWelcome() {
  const pj = DEV.pendingJoin ? `<div class="note ok">📨 Bạn đang mở <b>link mời vào hội</b>. Đăng nhập để tham gia nhé.</div>` : '';
  return `<section class="hero">
    <span class="speed"><span>Miễn phí · không quảng cáo</span></span>
    <div class="brand" style="margin-top:14px">Sport<br><b>Share</b></div>
    <p class="tag">Quản lý đội nhóm thể thao: lịch tập, vote đi / không đi, chia tiền sân, công nợ và quỹ hội. Chuyển khoản nhanh bằng VietQR.</p>
    <div class="sportstrip" aria-hidden="true">${Object.values(SPORTS).slice(0, 8).map(s => `<span>${s.ic}</span>`).join('')}</div>
  </section>
  ${inAppNote()}
  ${guideLink()}
  ${pj}
  ${localClubs().length ? `<div class="note warn">📱 Máy này có <b>${localClubs().length} hội</b> từ bản cũ (${localClubs().map(c => esc(c.name)).join(', ')}). <b>Đăng nhập</b> để đưa lên đám mây, giữ nguyên lịch sử và công nợ.</div>` : ''}
  ${CLOUD ? `<section class="card stack">
    <div class="stack" style="gap:2px"><h1 class="h2 disp">Đăng nhập</h1><p class="tiny muted b">Mỗi người một tài khoản. Bạn có thể là hội viên hội này, quản trị hội khác. Dữ liệu lưu an toàn trên đám mây, đổi điện thoại không mất.</p></div>
    ${googleBtn()}
    <button class="btn block ghost" data-act="authMode" data-m="login">✉️ Đăng nhập bằng email</button>
    <p class="tiny center b">Chưa có tài khoản? <button class="link" data-act="authMode" data-m="register">Đăng ký bằng email</button></p>
    ${err()}
  </section>` : `<div class="note warn">Chưa kết nối được máy chủ đăng nhập. Kiểm tra mạng rồi tải lại trang.</div>`}
  <button class="choice" data-act="demo"><span class="ic" style="background:var(--warn-soft)">🧪</span><span><b>Chơi thử hội mẫu</b><span class="tiny muted b">Chỉ để xem thử, <b>thoát ra là mất</b>. Muốn dùng thật: đăng nhập rồi bấm Lập hội mới</span></span></button>
  <p class="foot"><button class="link" data-act="openLegal">Chính sách &amp; Điều khoản</button> · <a class="link" href="../">Giới thiệu Sport Share</a> · <a class="link" href="${FANPAGE}" target="_blank" rel="noopener">Fanpage</a></p>`;
}

/* ---------- đăng nhập / đăng ký / quên mật khẩu bằng email ---------- */
function vAuth() {
  const m = UI.authMode;
  const title = { login: 'Đăng nhập', register: 'Tạo tài khoản', reset: 'Quên mật khẩu' }[m];
  return `${backBtn('goWelcome')}
  <div class="stack" style="gap:4px"><div class="eyebrow">Tài khoản Sport Share</div><h1 class="h1 disp">${title}</h1></div>
  ${inAppNote()}
  ${m !== 'reset' ? `<section class="card stack">${googleBtn(m === 'register' ? 'Đăng ký nhanh với Google' : 'Tiếp tục với Google')}</section><div class="eyebrow center">hoặc dùng email</div>` : ''}
  <form class="card stack" data-form="auth" data-m="${m}" autocomplete="on">
    ${m === 'register' ? `<div class="field"><label for="a-name">Tên hiển thị</label><input class="input" id="a-name" name="name" autocomplete="name" placeholder="VD: Minh Quân" value="${esc(UI.authName || '')}" required></div>` : ''}
    <div class="field"><label for="a-email">Email</label><input class="input" id="a-email" name="email" type="email" autocomplete="email" inputmode="email" value="${esc(UI.authEmail || '')}" required ${m === 'register' ? '' : 'autofocus'}></div>
    ${m !== 'reset' ? `<div class="field"><label for="a-pass">Mật khẩu${m === 'register' ? ' (ít nhất 6 ký tự)' : ''}</label><input class="input" id="a-pass" name="pass" type="password" autocomplete="${m === 'register' ? 'new-password' : 'current-password'}" required minlength="6"></div>` : '<p class="tiny muted b">Nhập email đã đăng ký, Sport Share gửi link đặt lại mật khẩu vào hộp thư của bạn (xem cả mục Spam).</p>'}
    ${err()}
    <button class="btn block" type="submit" ${UI.busy ? 'disabled' : ''}>${UI.busy ? 'Đang xử lý…' : { login: 'Đăng nhập', register: 'Tạo tài khoản', reset: 'Gửi link đặt lại' }[m]}</button>
    <div class="row between wrap tiny b">
      ${m === 'login' ? `<button type="button" class="link" data-act="authMode" data-m="reset">Quên mật khẩu?</button><button type="button" class="link" data-act="authMode" data-m="register">Tạo tài khoản mới</button>` : `<button type="button" class="link" data-act="authMode" data-m="login">← Đã có tài khoản? Đăng nhập</button>`}
    </div>
  </form>
  <p class="foot">Đăng nhập là bạn đồng ý với <button class="link" data-act="openLegal">Chính sách &amp; Điều khoản</button>.</p>`;
}

/* ---------- trang "Của tôi" ---------- */
function vHome() {
  const clubs = myClubs();
  const name = ME ? ME.name : 'Bạn';
  const soon = []; clubs.forEach(c => upcoming(c).filter(s => s.date <= addDays(dayKey(), 14)).forEach(s => soon.push([c, s])));
  soon.sort((a, b) => (a[1].date + (a[1].time || '')).localeCompare(b[1].date + (b[1].time || '')));
  const debts = clubs.map(c => [c, myMid(c) ? debtOf(c, myMid(c)) : 0]).filter(x => x[1] > 0);
  const myDebt = debts.reduce((a, x) => a + x[1], 0);
  const alerts = [];
  clubs.filter(canAdmin).forEach(c => {
    const sp = sportOf(c);
    if ((c.requests || []).length) alerts.push([c, `📨 ${c.requests.length} người xin vào hội`, 'members']);
    const rep = c.charges.filter(x => !x.paid && x.reportedAt).map(x => x.mid); const nRep = new Set(rep).size;
    if (nRep) alerts.push([c, `💸 ${nRep} người báo đã chuyển khoản, chờ xác nhận`, 'money']);
    const wait = c.sessions.filter(s => s.status === 'open' && s.date < dayKey()).length;
    if (wait) alerts.push([c, `⏳ ${wait} ${sp.unit} đã qua chưa chốt tiền`, 'sessions']);
    if (needBackup(c)) alerts.push([c, `💾 ${Math.floor((Date.now() - lastBackup(c)) / 864e5)} ngày chưa tải file sao lưu`, 'settings']);
  });
  const loading = ME && !CLUBS_LOADED;
  return `<header class="apphead" style="margin-bottom:0"><div class="top">${meAva('lg')}<div class="grow"><div class="s">Xin chào 👋</div><div class="t ellip">${esc(name)}</div></div><button class="hbtn" data-act="go" data-v="account">⚙️ Tài khoản</button></div>
    <div class="stats"><div class="stat"><b>${clubs.length}</b><span>Hội</span></div><div class="stat hot"><b>${soon.length}</b><span>Buổi 14 ngày</span></div><div class="stat"><b>${myDebt ? vndShort(myDebt) : '0đ'}</b><span>Cần trả</span></div></div></header>
  ${inAppNote()}
  ${localClubs().length ? `<section class="card stack" style="border-left:5px solid var(--warn)"><b>📱 ${localClubs().length} hội cũ còn trên máy này</b><p class="tiny muted b">Hội tạo ở bản cũ chỉ lưu trong trình duyệt, dễ mất và hội viên chưa dùng chung được. Đưa lên đám mây (giữ nguyên lịch sử, công nợ):</p><div class="row wrap">${localClubs().map(c => `<button class="btn sm" data-act="uploadSheet" data-cid="${c.id}">☁️ ${esc(c.name)}</button>`).join('')}</div></section>` : ''}
  ${DEV.joins.length ? DEV.joins.map(j => `<div class="note">⏳ Đã xin vào <b>${esc(j.clubName)}</b>, chờ quản trị duyệt. <button class="link tiny" data-act="cancelJoin" data-cid="${esc(j.clubId)}">Hủy</button></div>`).join('') : ''}
  ${alerts.length ? `<section class="card stack" style="border-left:5px solid var(--brand)">${secH('Việc cần làm')}<div class="list">${alerts.map(([c, t, tab]) => `<button class="item" data-act="openClub" data-cid="${c.id}" data-t="${tab}"><span class="ava sm" style="--ac:color-mix(in srgb,${sportOf(c).c} 18%,var(--surface))">${sportOf(c).ic}</span><span class="tx"><b>${t}</b><span class="tiny muted b">${esc(c.name)}</span></span><span class="faint" style="font-size:22px">›</span></button>`).join('')}</div></section>` : ''}
  ${debts.length ? `<section class="card stack" style="border-left:5px solid var(--bad)">${secH('Cần thanh toán', `<b class="num bad-t">${vnd(myDebt)}</b>`)}<div class="list">${debts.map(([c, d]) => `<button class="item" data-act="openClub" data-cid="${c.id}" data-t="debt"><span class="ava sm" style="--ac:color-mix(in srgb,${sportOf(c).c} 18%,var(--surface))">${sportOf(c).ic}</span><span class="tx"><b>${esc(c.name)}</b><span class="tiny muted b">${unpaidOf(c, myMid(c)).length} khoản · quét VietQR để trả</span></span><span class="amt bad-t">${vnd(d)}</span></button>`).join('')}</div></section>` : ''}
  ${secH('Lịch sắp tới')}
  ${loading ? `<section class="card">${empty('⏳', 'Đang tải lịch của bạn…')}</section>` : soon.length ? soon.slice(0, 10).map(([c, s]) => `<div class="stack" style="gap:6px"><span class="tiny b muted">${sportOf(c).ic} ${esc(c.name)}</span>${sessCard(c, s, canAdmin(c) ? 'openSessionOf' : 'viewSession')}${myMid(c) && s.status === 'open' ? rsvpBtns(s, myMid(c), c) : ''}</div>`).join('') : `<section class="card">${empty('🗓️', clubs.length ? 'Chưa có buổi nào trong 14 ngày tới.' : 'Chưa có lịch. Lập hội hoặc nhờ quản trị gửi link mời nhé!')}</section>`}
  ${secH('Hội của tôi', `<span class="pill">${clubs.length}</span>`)}
  ${clubs.length ? `<div class="stack">${clubs.map(c => { const s = sportOf(c), r = role(c); return `<button class="choice" data-act="openClub" data-cid="${c.id}"><span class="ic" style="background:color-mix(in srgb,${s.c} 18%,var(--surface))">${s.ic}</span><span class="grow"><b class="ellip">${esc(c.name)}</b><span class="tiny muted b">${esc(s.name)} · ${activeMembers(c).length} hội viên${isCloud(c) ? '' : ' · 📱 trên máy này'}${c.demo ? ' · hội mẫu' : ''}</span><span class="row wrap" style="gap:6px;margin-top:4px">${roleP(r)}</span></span></button>`; }).join('')}</div>` : (loading ? '' : `<section class="card">${empty('🏟️', 'Bạn chưa ở trong hội nào.')}</section>`)}
  <div class="grid2"><button class="btn" data-act="startReg">⚡ Lập hội mới</button><button class="btn ghost" data-act="joinSheet">🔗 Có link mời?</button></div>
  ${guideLink()}
  <p class="foot"><button class="link" data-act="openLegal">Chính sách &amp; Điều khoản</button> · <a class="link" href="../">Giới thiệu Sport Share</a></p>`;
}
function joinSheet() {
  return `<form class="stack" data-form="joinLink"><h2 class="h2 disp">🔗 Vào hội bằng link mời</h2>
    <div class="field"><label for="jl">Dán link mời quản trị viên gửi</label><input class="input" id="jl" name="link" placeholder="https://sportshare.pro.vn/app/#join=…" autofocus></div>
    ${err()}<button class="btn block" type="submit">Mở link</button>
    <p class="tiny muted b">Chưa có link? Nhắn quản trị viên của hội: vào <b>Hội viên → Link mời</b> để gửi cho bạn.</p></form>`;
}

/* ---------- tài khoản ---------- */
function vAccount() {
  const locals = localClubs();
  return `${backBtn()}
  <section class="card stack" style="align-items:center;text-align:center">${meAva('lg')}<h1 class="h2">${esc(ME ? ME.name : '')}</h1><p class="tiny muted b">${esc((ME && ME.email) || '')}${ME && ME.provider === 'google.com' ? ' · Google' : ME && ME.provider === 'password' ? ' · Email' : ''}</p></section>
  <form class="card stack" data-form="myName">${secH('Tên hiển thị')}<div class="row"><input class="input grow" id="my-name" name="name" value="${esc(ME ? ME.name : '')}" aria-label="Tên hiển thị" maxlength="40"><button class="btn sm navy" type="submit">Lưu</button></div><p class="tiny muted b">Tên này hiện khi bạn xin vào hội mới. Tên trong từng hội do bạn hoặc quản trị hội đó đặt.</p></form>
  ${locals.length ? `<section class="card stack">${secH('📱 Hội cũ trên máy này', `<span class="pill">${locals.length}</span>`)}
    <div class="list">${locals.map(c => `<div class="item"><span class="ava sm">${sportOf(c).ic}</span><span class="tx"><b>${esc(c.name)}</b><span class="tiny muted b">${activeMembers(c).length} hội viên · ${c.sessions.length} buổi</span></span><button class="btn xs" data-act="uploadSheet" data-cid="${c.id}">☁️ Lên mây</button></div>`).join('')}</div>
    <p class="tiny muted b">Đưa lên đám mây để không mất dữ liệu và hội viên dùng chung được. Lịch sử buổi, công nợ, quỹ được giữ nguyên.</p></section>` : ''}
  <section class="card stack">${secH('💾 Khôi phục từ file sao lưu')}<p class="tiny muted b">Có file sao lưu Sport Share (.json)? Hội trong file sẽ được khôi phục lên đám mây thành hội của bạn.</p>${restoreBlock(locals.length > 0)}</section>
  <section class="card stack">${secH('Giao diện')}<div class="chips">${[['auto', '🌓 Theo máy'], ['light', '☀️ Sáng'], ['dark', '🌙 Tối']].map(([k, t]) => `<button class="chip ${(DEV.theme || 'auto') === k ? 'on' : ''}" data-act="theme" data-k="${k}">${t}</button>`).join('')}</div></section>
  ${guideLink()}
  ${fanpageBox()}
  ${donateBlock()}
  <div class="stack"><button class="btn block ghost" data-act="signOut">↩ Đăng xuất</button></div>
  <p class="foot">Sport Share v${APP.ver}${CLOUD && CLOUD.emulator ? ' · môi trường thử nghiệm' : ''} · <button class="link" data-act="openLegal">Chính sách &amp; Điều khoản</button></p>`;
}
function restoreBlock(withExport) {
  return `<div class="row wrap">${withExport ? '<button class="btn sm ok" data-act="exportData">⬇️ Tải file sao lưu</button>' : ''}<label class="btn sm ghost" for="importFile" style="cursor:pointer">⬆️ Khôi phục từ file</label><input type="file" id="importFile" accept="application/json,.json" hidden></div>
  ${UI.confirm === 'import' && UI.importData ? `<div class="note warn stack" style="gap:8px">File có hội <b>${esc(UI.importData.names)}</b>. Hội sẽ được khôi phục lên đám mây thành hội mới của bạn.<div class="row"><button class="btn sm ok" data-act="doImport">Khôi phục</button><button class="btn sm ghost" data-act="cancelConfirm">Hủy</button></div></div>` : ''}`;
}
function uploadSheet(c) {
  return `<form class="stack" data-form="upload" data-cid="${c.id}"><h2 class="h2 disp">☁️ Đưa “${esc(c.name)}” lên đám mây</h2>
    <p class="muted b">Toàn bộ hội viên, buổi chơi, công nợ, quỹ được chép lên tài khoản của bạn. Bạn là người lập hội.</p>
    <div class="field"><label for="up-me">Bạn là ai trong danh sách hội viên?</label><select class="input" id="up-me" name="me"><option value="">Tôi không có trong danh sách (tạo mới)</option>${activeMembers(c).map(m => `<option value="${m.id}" ${c.meMid === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
    <p class="tiny muted b">Sau khi lên mây, gửi link mời cho từng hội viên ở tab Hội viên. Bản trên máy này sẽ được xóa để tránh trùng.</p>
    ${err()}<button class="btn block" type="submit" ${UI.busy ? 'disabled' : ''}>${UI.busy ? 'Đang tải lên…' : 'Đưa lên đám mây'}</button></form>`;
}

/* ---------- lập hội: B1 môn thể thao → B2 thông tin hội ---------- */
function vRegister() {
  const r = UI.reg; const steps = `<div class="row" style="gap:6px">${[1, 2].map(i => `<span style="flex:1;height:6px;border-radius:6px;background:${i <= r.step ? 'var(--brand)' : 'var(--line)'};transform:skewX(-20deg)"></span>`).join('')}</div>`;
  if (r.step === 1) return `${backBtn()}
  ${steps}
  <div class="stack" style="gap:4px"><div class="eyebrow">Bước 1/2 · Môn thể thao</div><h1 class="h1 disp">Hội chơi môn gì?</h1><p class="muted b">Môn thể thao quyết định các khoản chi gợi ý, cách chia đội và biểu tượng của hội.</p></div>
  <div class="sports" role="radiogroup" aria-label="Chọn môn thể thao">${Object.entries(SPORTS).map(([k, s]) => `<button type="button" class="sport ${r.sport === k ? 'on' : ''}" style="--c:${s.c}" role="radio" aria-checked="${r.sport === k}" data-act="regSport" data-k="${k}"><span class="em">${s.ic}</span>${esc(s.name)}</button>`).join('')}</div>
  ${r.sport === 'other' ? `<div class="field"><label for="r-sname">Tên môn thể thao</label><input class="input" id="r-sname" data-chg="regSportName" value="${esc(r.sportName || '')}" placeholder="VD: Cầu mây, Bi-a, Leo núi…"></div>` : ''}
  ${err()}
  <button class="btn block" data-act="regNext" ${r.sport ? '' : 'disabled'}>Tiếp tục →</button>`;
  const sp = SPORTS[r.sport] || SPORTS.other;
  return `<div class="row"><button class="x" data-act="regBack" aria-label="Quay lại">←</button></div>
  ${steps}
  <div class="stack" style="gap:4px"><div class="eyebrow">Bước 2/2 · Thông tin hội</div><h1 class="h1 disp">${sp.ic} Đặt tên hội</h1></div>
  <form class="card stack" data-form="reg2">
    <div class="field"><label for="r-cname">Tên hội / đội / nhóm</label><input class="input" id="r-cname" name="name" placeholder="VD: CLB ${esc(r.sport === 'other' ? (r.sportName || 'Thể thao') : sp.name)} Sấm Sét" value="${esc(r.name || '')}" autofocus maxlength="60"></div>
    <div class="field"><label for="r-venue">${sp.place} quen thuộc</label><input class="input" id="r-venue" name="venue" placeholder="VD: Nhà thi đấu Quận 7 · Sân 3" value="${esc(r.venue || '')}"></div>
    <div class="field"><span class="lbl">Lịch chơi cố định (không bắt buộc)</span><div class="chips">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label class="chip ${(r.days || []).includes(d) ? 'on' : ''}" style="cursor:pointer"><input type="checkbox" name="days" value="${d}" ${(r.days || []).includes(d) ? 'checked' : ''} hidden data-chg="checkChip">${WD[d]}</label>`).join('')}</div></div>
    <div class="field"><label for="r-time">Giờ bắt đầu</label><input class="input" id="r-time" name="time" type="time" value="${esc(r.time || '19:00')}"></div>
    <label class="check on" style="cursor:pointer"><input type="checkbox" name="withMe" value="1" checked style="width:22px;height:22px;accent-color:var(--sport)"><span class="grow b">Tôi cũng chơi trong hội này<span class="tiny muted b" style="display:block">Bạn có tên trong danh sách, được vote và chia tiền như mọi người</span></span></label>
    <p class="note">☁️ Hội lưu trên đám mây. Sau khi lập, gửi link mời để hội viên đăng nhập và dùng chung.</p>
    ${err()}
    <button class="btn block" type="submit" ${UI.busy ? 'disabled' : ''}>⚡ Lập hội</button>
  </form>`;
}

/* ---------- mở link mời ---------- */
function vJoin() {
  const j = UI.join || {};
  const head = `${backBtn()}<div class="stack" style="gap:4px"><div class="eyebrow">Lời mời</div><h1 class="h1 disp">Vào hội</h1></div>`;
  if (!ME) return `${head}<section class="card stack"><p class="b">Đăng nhập để tham gia hội.</p>${CLOUD ? `${googleBtn()}<button class="btn block ghost" data-act="authMode" data-m="login">✉️ Đăng nhập bằng email</button><p class="tiny center b">Chưa có tài khoản? <button class="link" data-act="authMode" data-m="register">Đăng ký bằng email</button></p>` : '<p class="note warn">Đăng nhập chưa được bật trên trang này.</p>'}${err()}</section>`;
  if (j.state === 'loading') return `${head}<section class="card">${empty('⏳', 'Đang mở lời mời…')}</section>`;
  if (j.state === 'bad') return `${head}<section class="card stack">${empty('🚫', j.msg || 'Link mời không còn hiệu lực.')}<p class="tiny muted b center">Nhờ quản trị viên gửi link mới nhé.</p><button class="btn block ghost" data-act="goHome">Về trang của tôi</button></section>`;
  const inv = j.inv || {}; const sp = sportOf({ sport: inv.sport, sportName: inv.sportName });
  const card = `<div class="row"><span class="ava lg" style="--ac:color-mix(in srgb,${sp.c} 18%,var(--surface))">${sp.ic}</span><div class="grow"><div class="eyebrow">${esc(sp.name)}</div><h2 class="h2">${esc(inv.clubName || 'Hội')}</h2></div></div>`;
  if (CL[inv.clubId]) return `${head}<section class="card stack">${card}<div class="note ok">✅ Bạn đã ở trong hội này.</div><button class="btn block" data-act="openClub" data-cid="${esc(inv.clubId)}">Mở hội</button></section>`;
  if (j.state === 'sent') return `${head}<section class="card stack">${card}<div class="note ok">📨 Đã gửi yêu cầu. Khi quản trị duyệt, hội sẽ hiện trong trang của bạn.</div><button class="btn block ghost" data-act="goHome">Về trang của tôi</button></section>`;
  if (inv.mid) return `${head}<section class="card stack">${card}<p class="b">Bạn được mời vào hội với tên <span style="color:var(--brand)">${esc(inv.memberName || '')}</span>.</p><p class="tiny muted b">Tài khoản <b>${esc(ME.email || ME.name)}</b> sẽ được gắn với tên này: lịch sử buổi chơi và công nợ của bạn hiện ra ngay.</p>${err()}<button class="btn block" data-act="joinClaim" ${UI.busy ? 'disabled' : ''}>✅ Tham gia hội</button><p class="tiny muted b center">Không phải bạn? <button class="link" data-act="signOut">Đăng xuất</button> rồi đăng nhập tài khoản khác.</p></section>`;
  return `${head}<form class="card stack" data-form="joinReq">${card}<p class="b">Gửi yêu cầu vào hội. Quản trị viên sẽ duyệt.</p><div class="field"><label for="jr-name">Tên của bạn trong hội</label><input class="input" id="jr-name" name="name" value="${esc(ME.name)}" maxlength="40" required></div>${err()}<button class="btn block" type="submit" ${UI.busy ? 'disabled' : ''}>📨 Gửi yêu cầu</button></form>`;
}

/* ---------- đầu trang & thanh tab ---------- */
function appHead(c, { eyebrow, title, right, stats, crest }) {
  return `<header class="apphead"><div class="top"><button class="hbtn" data-act="goHome" aria-label="Về trang của tôi" style="padding:0 10px">←</button><span class="crest" aria-hidden="true">${crest || sportOf(c).ic}</span><div class="grow"><div class="s ellip">${eyebrow}</div><div class="t">${title}</div></div>${right || ''}</div>
  ${stats ? `<div class="stats">${stats.map(([v, l, hot]) => `<div class="stat ${hot ? 'hot' : ''}"><b>${v}</b><span>${l}</span></div>`).join('')}</div>` : ''}</header>`;
}
function tabbar(tabs, cur, act) {
  return `<nav class="tabbar" aria-label="Điều hướng"><div class="in">${tabs.map(([k, i, t, badge]) => `<button class="tab ${cur === k ? 'on' : ''}" data-act="${act}" data-t="${k}" ${cur === k ? 'aria-current="page"' : ''}><span class="i">${i}</span>${t}${badge ? `<span class="badge">${badge}</span>` : ''}</button>`).join('')}</div></nav>`;
}

/* ================= MỘT HỘI ================= */
function vClub() {
  const c = club(); if (!c) return ME ? vHome() : vWelcome();
  if (!role(c)) return vHome();
  const html = canAdmin(c) ? vAdmin(c) : vMember(c);
  const i = html.indexOf('</header>') + 9;
  const banner = c.demo ? `<div class="note warn stack" style="gap:8px"><span>🧪 <b>Đang chơi thử hội mẫu.</b> Dữ liệu mẫu, <b>thoát ra là mất</b>, đừng nhập hội thật ở đây. Bạn là quản trị và đóng vai Minh Quân.</span><div class="row wrap">${ME ? '<button class="btn sm ghost" data-act="exitDemo">← Về trang của tôi</button>' : '<button class="btn sm" data-act="exitDemo">Đăng nhập để lập hội thật</button>'}</div></div>`
    : !isCloud(c) ? `<div class="note warn stack" style="gap:8px"><span>📱 <b>Hội cũ trên máy này</b>: dễ mất khi xóa dữ liệu trình duyệt, hội viên chưa dùng chung được.</span><button class="btn sm" data-act="uploadSheet" data-cid="${c.id}">☁️ Đưa lên đám mây</button></div>` : '';
  return html.slice(0, i) + banner + html.slice(i);
}

/* ---------- giao diện hội viên ---------- */
function vMember(c) {
  const m = myMember(c);
  if (!m) return `${appHead(c, { eyebrow: esc(sportOf(c).name), title: esc(c.name) })}<section class="card">${empty('⏳', 'Đang tải thông tin của bạn trong hội…')}</section>`;
  const debt = debtOf(c, m.id);
  const head = appHead(c, { eyebrow: `${esc(c.name)} · Hội viên`, title: esc(m.name), crest: esc(m.avatar), stats: [[attended(c, m.id), 'Buổi đã đi'], [streakOf(c, m.id) + '🔥', 'Chuỗi liên tiếp', true], [debt ? vndShort(debt) : '0đ', 'Còn nợ']] });
  let body = '';
  if (UI.tab === 'debt') body = vMDebt(c, m);
  else if (UI.tab === 'rank') body = vRank(c, m.id);
  else if (UI.tab === 'info') body = vMInfo(c, m);
  else body = vMHome(c, m);
  const pend = upcoming(c).filter(s => !(s.rsvp || {})[m.id]).length;
  return head + body + tabbar([['home', '📅', 'Lịch', pend], ['debt', '💸', 'Công nợ', unpaidOf(c, m.id).length], ['rank', '🏆', 'Xếp hạng'], ['info', sportOf(c).ic, 'Hội']], UI.tab, 'tab');
}
function rsvpBtns(s, mid, c = club()) {
  const r = (s.rsvp || {})[mid]; const vt = voteOf(c, s);
  const wait = vt.wait.includes(mid);
  return `<div class="stack" style="gap:6px"><div class="row" style="gap:8px"><button class="btn sm ${r === 'yes' ? 'ok' : 'ghost'}" style="flex:1" data-act="rsvp" data-cid="${c.id}" data-sid="${s.id}" data-r="yes">${r === 'yes' ? '✅ Tôi đi' : 'Đi'}</button><button class="btn sm ${r === 'no' ? 'danger' : 'ghost'}" style="flex:1" data-act="rsvp" data-cid="${c.id}" data-sid="${s.id}" data-r="no">${r === 'no' ? '❌ Tôi không đi' : 'Không đi'}</button></div>
    ${wait ? `<p class="tiny b warn-t">⏳ Đã đủ ${vt.max} chỗ, bạn đang ở danh sách dự bị số ${vt.wait.indexOf(mid) + 1}.</p>` : ''}</div>`;
}
function voteLists(c, s) {
  const vt = voteOf(c, s); const chip = id => { const m = memberOf(c, id); return m ? `<span class="pill">${esc(m.avatar)} ${esc(m.name)}</span>` : ''; };
  const row = (t, ids, cls) => ids.length ? `<div class="stack" style="gap:6px"><span class="tiny b ${cls}">${t} (${ids.length})</span><div class="chips">${ids.map(chip).join('')}</div></div>` : '';
  return `${row('✅ Đi' + (vt.max ? ` · tối đa ${vt.max}` : ''), vt.going, 'ok-t')}${row('⏳ Dự bị', vt.wait, 'warn-t')}${row('❌ Không đi', vt.no, 'bad-t')}${row('❔ Chưa vote', vt.none, 'faint')}` || '<span class="muted tiny b">Chưa có ai vote.</span>';
}
function vMHome(c, m) {
  const up = upcoming(c); const sp = sportOf(c);
  const last = settledSessions(c).sort((a, b) => b.date.localeCompare(a.date))[0];
  const debt = debtOf(c, m.id);
  return `${debt ? `<button class="card row" style="border-left:5px solid var(--bad);text-align:left" data-act="tab" data-t="debt"><span class="ava" style="--ac:var(--bad-soft)">💸</span><span class="grow"><b>Bạn còn ${vnd(debt)} chưa thanh toán</b><span class="tiny muted b" style="display:block">${unpaidOf(c, m.id).length} khoản · chạm để chuyển khoản bằng VietQR</span></span></button>` : `<div class="note ok">✅ Bạn đã thanh toán đủ. Cảm ơn bạn!</div>`}
  ${secH(`Lịch ${sp.unit} sắp tới`)}
  ${up.length ? up.slice(0, 8).map(s => `<div class="stack" style="gap:8px">${sessCard(c, s, 'viewSession')}${rsvpBtns(s, m.id, c)}</div>`).join('') : `<section class="card">${empty('🗓️', 'Chưa có lịch mới. Quản trị viên sẽ tạo buổi sớm thôi!')}</section>`}
  ${last ? `${secH(`${cap1(sp.unit)} gần nhất`)}${sessCard(c, last, 'viewSession')}` : ''}`;
}
function vMDebt(c, m) {
  const un = unpaidOf(c, m.id).sort((a, b) => b.date.localeCompare(a.date)); const debt = debtOf(c, m.id);
  const paid = c.charges.filter(x => x.mid === m.id && x.paid).sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0)).slice(0, 15);
  const rep = un.filter(x => x.reportedAt), allRep = un.length && rep.length === un.length;
  return `<section class="card stack">
    ${secH('Cần thanh toán', `<b class="num" style="font-size:20px;color:${debt ? 'var(--bad)' : 'var(--ok)'}">${vnd(debt)}</b>`)}
    ${un.length ? `<div class="list">${un.map(x => `<div class="item"><span class="tx"><b>${esc(x.label)}</b><span class="tiny muted b">${kindLabel(x.kind)}${x.reportedAt ? ' · 📩 đã báo chuyển khoản' : ''}</span></span><span class="amt">${vnd(x.amount)}</span></div>`).join('')}</div>` : empty('🎉', 'Không còn khoản nào cần trả.')}
  </section>
  ${debt ? (bankReady(c.bank) ? `<section class="card stack">${secH('Chuyển khoản VietQR')}
      ${qrBlock({ bin: c.bank.bin, acct: c.bank.acct, holder: c.bank.holder, amount: debt, note: transferNote(c, m.name) })}
      <button class="btn block navy" data-act="downloadPayQR" data-mid="${m.id}">⬇️ Tải mã QR về máy</button></section>`
    : `<div class="note warn">Quản trị viên chưa nhập tài khoản nhận tiền nên chưa tạo được mã VietQR.</div>`) : ''}
  ${debt && isCloud(c) ? (allRep ? `<div class="note ok">📩 Bạn đã báo chuyển khoản lúc ${fmtTs(Math.max(...rep.map(x => x.reportedAt)))}. Chờ quản trị xác nhận.</div>` : `<button class="btn block ok" data-act="reportPaid">✅ Tôi đã chuyển khoản</button><p class="tiny muted b center">Bấm sau khi chuyển khoản xong. Quản trị viên nhận thông báo và gạch nợ cho bạn.</p>`) : ''}
  ${paid.length ? `<section class="card stack">${secH('Đã thanh toán')}<div class="list">${paid.map(x => `<div class="item"><span class="tx"><b>${esc(x.label)}</b><span class="tiny muted b">${x.paidAt ? 'Trả lúc ' + fmtTs(x.paidAt) : ''}</span></span><span class="amt ok-t">${vnd(x.amount)}</span></div>`).join('')}</div></section>` : ''}`;
}
const kindLabel = k => ({ session: 'Tiền buổi chơi', monthly: 'Quỹ tháng', fund: 'Đóng quỹ', other: 'Khoản thu khác' }[k] || 'Khoản thu');
function vRank(c, me) {
  const { total, list } = rankList(c, UI.rankPeriod);
  return `<div class="chips"><button class="chip ${UI.rankPeriod === 'month' ? 'on' : ''}" data-act="rankPeriod" data-p="month">Tháng ${fmtMonth(monthKey())}</button><button class="chip ${UI.rankPeriod === 'all' ? 'on' : ''}" data-act="rankPeriod" data-p="all">Từ trước tới nay</button></div>
  <section class="card stack">${secH('Chăm chỉ nhất', `<span class="pill">${total} ${sportOf(c).unit}</span>`)}
    ${list.length ? `<div>${list.map(({ m, n }, i) => `<div class="rank" style="${m.id === me ? 'background:color-mix(in srgb,var(--sport) 8%,transparent);border-radius:12px;padding-inline:8px' : ''}"><span class="no">${i + 1}</span>${ava(m, 'sm')}<span class="grow"><b class="ellip" style="display:block">${esc(m.name)}${m.id === me ? ' (bạn)' : ''}</b><span class="meter" style="display:block;margin-top:5px"><i style="width:${total ? Math.round(n / total * 100) : 0}%"></i></span></span><b class="num">${n}/${total}</b></div>`).join('')}</div>` : empty('🏆', 'Chưa có dữ liệu.')}
  </section>`;
}
function vMInfo(c, m) {
  const sp = sportOf(c), admins = c.admins || [];
  return `<section class="card stack"><div class="row"><span class="ava lg" style="--ac:color-mix(in srgb,${sp.c} 18%,var(--surface))">${sp.ic}</span><div class="grow"><div class="eyebrow">${esc(sp.name)}</div><h2 class="h2">${esc(c.name)}</h2></div></div>
    <div class="kv">${c.schedule.venue ? `<div><span>${sp.place}</span><b>${esc(c.schedule.venue)}</b></div>` : ''}${c.schedule.days.length ? `<div><span>Lịch cố định</span><b>${c.schedule.days.map(d => WD[d]).join(', ')}${c.schedule.time ? ' · ' + esc(c.schedule.time) : ''}</b></div>` : ''}<div><span>Vai trò của bạn</span>${roleP(role(c))}</div></div></section>
  <section class="card stack">${secH('Hồ sơ của bạn trong hội')}
    <form class="row" data-form="myClubName"><input class="input grow" name="name" value="${esc(m.name)}" maxlength="40" aria-label="Tên của bạn trong hội"><button class="btn sm navy" type="submit">Lưu</button></form>
    <div class="chips">${AVATARS.map(a => `<button class="chip ${m.avatar === a ? 'on' : ''}" style="font-size:22px;padding:0 10px" data-act="myAvatar" data-a="${a}">${a}</button>`).join('')}</div></section>
  <section class="card stack">${secH(`Hội viên (${activeMembers(c).length})`)}<div class="list">${activeMembers(c).map(x => `<div class="item">${ava(x, 'sm')}<span class="tx"><b>${esc(x.name)}${x.id === m.id ? ' (bạn)' : ''}</b><span class="tiny muted b">${x.uid && admins.includes(x.uid) ? '🛡️ Quản trị · ' : ''}<span class="lv">${lvStars(x.level)}</span></span></span></div>`).join('')}</div></section>
  ${isCloud(c) ? `<button class="btn block danger" data-act="askLeave">Rời hội</button>${UI.confirm === 'leave' ? `<div class="note warn stack" style="gap:8px"><b>Rời “${esc(c.name)}”?</b> Lịch sử của bạn vẫn được hội giữ. Muốn quay lại cần link mời mới.<div class="row"><button class="btn sm danger" data-act="doLeave">Rời hội</button><button class="btn sm ghost" data-act="cancelConfirm">Thôi</button></div></div>` : ''}` : ''}`;
}

/* chi tiết buổi (xem) */
function sessionSheet(c, s, mid) {
  const sp = sportOf(c); const { shares, per, total } = sessShares(c, s);
  const att = s.attendees.map(id => memberOf(c, id)).filter(Boolean);
  return `<div class="row"><span class="ava lg" style="--ac:color-mix(in srgb,${sp.c} 18%,var(--surface))">${sp.ic}</span><div class="grow"><div class="eyebrow">${esc(c.name)} ${s.status === 'settled' ? '· đã chốt' : s.status === 'cancelled' ? '· đã hủy' : ''}</div><h2 class="h2">${fmtDateLong(s.date)}</h2><p class="muted b">⏰ ${esc(s.time || '')} · 📍 ${esc(s.venue || '')}</p></div></div>
  ${s.note ? `<div class="note">📝 ${esc(s.note)}</div>` : ''}
  ${mid && s.status === 'open' ? rsvpBtns(s, mid, c) : ''}
  ${s.status === 'open' && s.date >= dayKey() ? `<button class="btn sm ghost" data-act="calSheet" data-cid="${c.id}" data-sid="${s.id}">📅 Thêm vào lịch điện thoại</button>` : ''}
  ${s.status === 'settled' ? `<section class="card stack">${secH('Chi phí')}<div class="list">${s.costs.map(x => `<div class="item"><span class="tx"><b>${esc(x.label)}</b></span><span class="amt">${vnd(x.amount)}</span></div>`).join('')}<div class="item"><span class="tx"><b>Tổng · ${sessHeads(s)} người</b></span><span class="amt">${vnd(total)}</span></div></div>${per ? `<p class="b">Mỗi người: <span style="color:var(--brand)">${vnd(per)}</span></p>` : ''}${mid && shares[mid] ? `<div class="note">Phần của bạn: <b>${vnd(shares[mid])}</b></div>` : ''}</section>` : ''}
  <section class="card stack">${s.status === 'settled' ? `${secH(`Có mặt (${att.length})`)}<div class="chips">${att.map(m => `<span class="pill">${esc(m.avatar)} ${esc(m.name)}</span>`).join('') || '<span class="muted tiny b">Chưa có ai.</span>'}</div>` : `${secH('🗳️ Vote đi / không đi')}${voteLists(c, s)}`}${(s.guests || []).length ? `<p class="tiny muted b">+ ${s.guests.length} khách: ${s.guests.map(g => esc(g.name)).join(', ')}</p>` : ''}</section>
  ${s.teams ? teamsBlock(c, s) : ''}
  <button class="btn block ghost" data-act="closeSheet">Đóng</button>`;
}
function calSheet(c, s) {
  const sp = sportOf(c);
  return `<h2 class="h2 disp">📅 Thêm vào lịch</h2><p class="muted b">${sp.ic} ${esc(c.name)} · ${fmtDateLong(s.date)} ${esc(s.time || '')}</p>
  <a class="btn block navy" href="${esc(gcalUrl(c, s))}" target="_blank" rel="noopener">Google Calendar</a>
  <button class="btn block ghost" data-act="icsDownload" data-cid="${c.id}" data-sid="${s.id}">Tải file lịch (.ics) cho iPhone, Outlook</button>
  <p class="tiny muted b">Lịch điện thoại sẽ nhắc trước giờ chơi. Nếu buổi đổi giờ, hãy thêm lại.</p>
  <button class="btn block ghost" data-act="closeSheet">Đóng</button>`;
}
function teamsBlock(c, s) {
  const sp = sportOf(c);
  return `<section class="card stack">${secH(s.teamsMode === 'pairs' ? 'Ghép cặp' : sp.split === 'groups' ? 'Chia nhóm' : 'Chia đội')}<div class="teams">${s.teams.map((t, i) => `<div class="team" style="--tc:${TEAM_COLORS[i % TEAM_COLORS.length]}"><h3>${s.teamsMode === 'pairs' ? 'Cặp ' + (i + 1) : (sp.split === 'groups' ? 'Nhóm ' + (i + 1) : TEAM_NAMES[i % TEAM_NAMES.length])}</h3>${(Array.isArray(t) ? t : (t.m || [])).map(id => { const m = memberOf(c, id); return m ? `<p><span class="nm">${esc(m.avatar)} ${esc(m.name)}</span><span class="lv">★${m.level || 0}</span></p>` : `<p><span class="nm">${esc(String(id).replace(/^g:/, '👤 '))}</span></p>`; }).join('')}</div>`).join('')}</div></section>`;
}

/* ================= QUẢN TRỊ ================= */
function vAdmin(c) {
  const sp = sportOf(c), r = role(c);
  const head = appHead(c, { eyebrow: `${roleLabel(r)} · ${esc(sp.name)}${c.demo ? ' · Hội mẫu' : ''}${isCloud(c) ? '' : ' · 📱 trên máy'}`, title: esc(c.name), stats: [[activeMembers(c).length, 'Hội viên'], [vndShort(totalDebt(c)), 'Chưa thu', true], [vndShort(fundBalance(c)), 'Quỹ hội']] });
  let body = '';
  if (UI.atab === 'sessions') body = vASessions(c);
  else if (UI.atab === 'money') body = vAMoney(c);
  else if (UI.atab === 'members') body = vAMembers(c);
  else if (UI.atab === 'settings') body = vASettings(c);
  else body = vAHome(c);
  const waiting = c.sessions.filter(s => s.status === 'open' && s.date < dayKey()).length;
  const reported = new Set(c.charges.filter(x => !x.paid && x.reportedAt).map(x => x.mid)).size;
  return head + body + tabbar([['home', '📊', 'Tổng quan'], ['sessions', '📅', cap1(sp.unit), waiting], ['money', '💰', 'Thu chi', reported], ['members', '👥', 'Hội viên', (c.requests || []).length], ['settings', '⚙️', 'Cài đặt']], UI.atab, 'atab');
}
function vAHome(c) {
  const sp = sportOf(c); const up = upcoming(c); const nx = up[0];
  const waiting = c.sessions.filter(s => s.status === 'open' && s.date < dayKey()).sort((a, b) => a.date.localeCompare(b.date));
  const debtors = activeMembers(c).map(m => ({ m, d: debtOf(c, m.id) })).filter(x => x.d > 0).sort((a, b) => b.d - a.d);
  const mk = monthKey(); const monthS = settledSessions(c).filter(s => s.date.startsWith(mk));
  const monthCost = monthS.reduce((a, s) => a + sessCost(s), 0);
  const { list } = rankList(c, 'month');
  const nM = activeMembers(c).length, linked = c.members.filter(m => m.uid).length;
  const steps = [[nM >= 2, `👥 Thêm hội viên${nM ? ` (đã có ${nM})` : ''}`, 'memberSheet', '', '＋ Thêm']];
  if (isCloud(c)) steps.push([linked >= 2, `📨 Mời hội viên vào app${linked ? ` (${linked} đã vào)` : ''}`, 'atab', 'members', 'Mời']);
  steps.push([bankReady(c.bank), '🏦 Tài khoản nhận tiền VietQR', 'atab', 'settings', 'Nhập'], [c.sessions.length > 0, `📅 Tạo ${sp.unit} đầu tiên`, 'newSession', '', 'Tạo']);
  const showSetup = !c.setupDone && steps.some(x => !x[0]);
  const fresh = showSetup ? `<section class="card hl stack"><div class="row"><span class="ava lg" style="--ac:var(--volt)">🎉</span><div class="grow"><b class="h3">Bắt đầu với hội của bạn</b><p class="tiny muted b">${steps.filter(x => x[0]).length}/${steps.length} bước</p></div></div>
    <div class="list">${steps.map(([done, t, act, tab, btn]) => `<div class="item"><span class="ava sm" style="--ac:${done ? 'var(--ok-soft)' : 'var(--surface-2)'}">${done ? '✅' : '⬜'}</span><b class="tx" style="${done ? 'opacity:.6' : ''}">${t}</b><button class="btn xs ${done ? 'ghost' : ''}" data-act="${act}" ${tab ? `data-t="${tab}"` : ''}>${done && act === 'memberSheet' ? '＋ Thêm nữa' : btn}</button></div>`).join('')}</div>
    <button class="btn sm ghost" data-act="dismissFresh">Ẩn khung này</button></section>` : '';
  const reported = new Set(c.charges.filter(x => !x.paid && x.reportedAt).map(x => x.mid)).size;
  const bk = needBackup(c) ? `<div class="note warn stack" style="gap:8px"><span>💾 <b>${Math.floor((Date.now() - lastBackup(c)) / 864e5)} ngày</b> chưa tải file sao lưu. Dữ liệu trên đám mây vẫn an toàn, nhưng nếu ai đó xóa nhầm buổi hay công nợ thì file sao lưu là cách duy nhất để xem lại.</span><div class="row wrap"><button class="btn sm ok" data-act="exportData">⬇️ Tải file sao lưu</button><button class="btn sm ghost" data-act="snoozeBackup" data-cid="${c.id}">Để sau</button></div></div>` : '';
  return `${fresh}${bk}
  ${(c.requests || []).length ? `<button class="note ok" style="text-align:left" data-act="atab" data-t="members">📨 <b>${c.requests.length}</b> người xin vào hội. Chạm để duyệt.</button>` : ''}
  ${reported ? `<button class="note ok" style="text-align:left" data-act="atab" data-t="money">💸 <b>${reported}</b> người báo đã chuyển khoản. Chạm để xác nhận.</button>` : ''}
  <div class="grid2">
    <button class="btn" data-act="newSession">＋ Tạo ${sp.unit}</button>
    <button class="btn volt" data-act="chargeSheet" data-k="monthly">💰 Thu quỹ tháng</button>
    <button class="btn navy sm" data-act="memberSheet">👥 Thêm hội viên</button>
    ${isCloud(c) ? '<button class="btn ghost sm" data-act="groupInvite">📨 Link mời vào hội</button>' : '<button class="btn ghost sm" data-act="shareLink">🔗 Link xem nhanh</button>'}
  </div>
  ${waiting.length ? `<div class="note warn">⏳ Có <b>${waiting.length}</b> ${sp.unit} đã qua nhưng chưa chốt tiền. <button class="link" data-act="openSession" data-sid="${waiting[0].id}">Chốt ngay</button></div>` : ''}
  ${secH(`${cap1(sp.unit)} tiếp theo`, `<button class="link tiny" data-act="atab" data-t="sessions">Xem tất cả</button>`)}
  ${nx ? sessCard(c, nx) : `<section class="card">${empty('🗓️', `Chưa có ${sp.unit} nào sắp tới.`)}<button class="btn block sm" data-act="newSession">＋ Tạo ${sp.unit}${c.schedule.days.length ? ' theo lịch cố định' : ''}</button></section>`}
  <div class="kpis">
    <div class="kpi"><div class="k">${cap1(sp.unit)} tháng ${fmtMonth(mk).slice(0, 2)}</div><div class="v">${monthS.length}</div><div class="d">Chi phí ${vnd(monthCost)}</div></div>
    <div class="kpi"><div class="k">Chưa thu</div><div class="v bad-t">${vndShort(totalDebt(c))}</div><div class="d">${debtors.length} người còn nợ</div></div>
    <div class="kpi"><div class="k">Quỹ hội</div><div class="v ok-t">${vndShort(fundBalance(c))}</div><div class="d">Thu chi trong tab Thu chi</div></div>
    <div class="kpi"><div class="k">Hội viên</div><div class="v">${nM}</div><div class="d">${isCloud(c) ? `${linked} đã vào app` : `TB ${monthS.length ? Math.round(monthS.reduce((a, s) => a + sessHeads(s), 0) / monthS.length) : 0} người/${sp.unit}`}</div></div>
  </div>
  <section class="card stack">${secH('Còn nợ nhiều nhất', `<button class="link tiny" data-act="atab" data-t="money">Thu chi</button>`)}
    ${debtors.length ? `<div class="list">${debtors.slice(0, 5).map(({ m, d }) => `<div class="item">${ava(m, 'sm')}<span class="tx"><b>${esc(m.name)}</b><span class="tiny muted b">${unpaidOf(c, m.id).length} khoản${unpaidOf(c, m.id).some(x => x.reportedAt) ? ' · 📩 đã báo CK' : ''}</span></span><span class="amt bad-t">${vnd(d)}</span><button class="btn xs ghost" data-act="debtSheet" data-mid="${m.id}">Thu</button></div>`).join('')}</div>` : empty('✅', 'Không ai nợ. Tuyệt vời!')}
  </section>
  <section class="card stack">${secH('Chăm chỉ tháng này')}
    ${list.filter(x => x.n).length ? `<div>${list.filter(x => x.n).slice(0, 5).map(({ m, n }, i) => `<div class="rank"><span class="no">${i + 1}</span>${ava(m, 'sm')}<b class="grow ellip">${esc(m.name)}</b><span class="pill sport">${n} ${sp.unit}</span></div>`).join('')}</div>` : empty('🏁', `Chưa có ${sp.unit} nào được chốt trong tháng.`)}
  </section>
  ${donateBlock()}`;
}

function vASessions(c) {
  const sp = sportOf(c); const f = UI.sessFilter;
  let list = c.sessions.slice();
  if (f === 'up') list = list.filter(s => s.status === 'open').sort((a, b) => a.date.localeCompare(b.date));
  else if (f === 'done') list = list.filter(s => s.status === 'settled').sort((a, b) => b.date.localeCompare(a.date));
  else list = list.sort((a, b) => b.date.localeCompare(a.date));
  return `<button class="btn block" data-act="newSession">＋ Tạo ${sp.unit} mới</button>
  <div class="chips">${[['up', 'Chưa chốt'], ['done', 'Đã chốt'], ['all', 'Tất cả']].map(([k, t]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="sessFilter" data-k="${k}">${t}</button>`).join('')}</div>
  ${list.length ? `<div class="stack">${list.slice(0, 80).map(s => sessCard(c, s)).join('')}</div>` : `<section class="card">${empty(sp.ic, `Chưa có ${sp.unit} nào ở đây.`)}</section>`}`;
}

function vSession() {
  const c = club(); if (!c || !canAdmin(c)) return vHome();
  const s = c.sessions.find(x => x.id === UI.sid); if (!s) return vAdmin(c);
  const sp = sportOf(c); const open = s.status === 'open';
  const { shares, per, total, surplus } = sessShares(c, s);
  const members = activeMembers(c).concat(c.members.filter(m => m.active === false && s.attendees.includes(m.id)));
  const rs = s.rsvp || {};
  const vt = voteOf(c, s);
  const order = m => (s.attendees.includes(m.id) ? 0 : rs[m.id] === 'yes' ? 1 : rs[m.id] === 'no' ? 3 : 2);
  const sorted = members.slice().sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name, 'vi'));
  const charges = c.charges.filter(x => x.ref === s.id);
  const st = s.status === 'settled' ? '<span class="pill ok">Đã chốt</span>' : s.status === 'cancelled' ? '<span class="pill bad">Đã hủy</span>' : '<span class="pill sky">Đang mở</span>';
  return `<div class="row between"><button class="x" data-act="backToClub" aria-label="Quay lại">←</button>${st}</div>
  <section class="card stack hl">
    <div class="row"><span class="ava lg" style="--ac:color-mix(in srgb,${sp.c} 18%,var(--surface))">${sp.ic}</span><div class="grow"><div class="eyebrow">${esc(c.name)}${relDay(s.date) ? ' · ' + relDay(s.date) : ''}</div><h1 class="h2">${fmtDateLong(s.date)}</h1><p class="muted b">⏰ ${esc(s.time || '--:--')} · 📍 ${esc(s.venue || 'Chưa có địa điểm')}${s.max ? ` · 👥 tối đa ${s.max}` : ''}</p></div></div>
    ${s.note ? `<div class="note">📝 ${esc(s.note)}</div>` : ''}
    <div class="row wrap">${open ? `<button class="btn xs ghost" data-act="editSession">✏️ Sửa thông tin</button>` : ''}<button class="btn xs ghost" data-act="copyAnnounce">📋 Chép thông báo</button>${open && s.date >= dayKey() ? `<button class="btn xs ghost" data-act="calSheet" data-cid="${c.id}" data-sid="${s.id}">📅 Thêm vào lịch</button>` : ''}</div>
  </section>

  ${open ? voteSection(c, s) : ''}

  <section class="card stack">
    ${secH(`Điểm danh · ${s.attendees.length}${(s.guests || []).length ? ' + ' + s.guests.length + ' khách' : ''}`, open ? `<button class="link tiny" data-act="attFromRsvp">Điểm danh theo vote</button>` : '')}
    <div class="stack" style="gap:8px">${sorted.map(m => { const on = s.attendees.includes(m.id); const r = rs[m.id];
      return `<button class="check ${on ? 'on' : ''}" ${open ? `data-act="toggleAtt" data-mid="${m.id}"` : 'disabled'}><span class="box">${on ? '✓' : ''}</span>${ava(m, 'sm')}<span class="grow"><b class="ellip" style="display:block">${esc(m.name)}</b><span class="lv">${lvStars(m.level)}</span></span>${r === 'yes' ? (vt.wait.includes(m.id) ? '<span class="pill warn">Dự bị</span>' : '<span class="pill ok">Vote đi</span>') : r === 'no' ? '<span class="pill bad">Không đi</span>' : ''}${!open && shares[m.id] ? `<b class="num tiny">${vnd(shares[m.id])}</b>` : ''}</button>`; }).join('')}</div>
    ${(s.guests || []).length ? `<div class="list">${s.guests.map((g, i) => `<div class="item"><span class="ava sm">👤</span><span class="tx"><b>${esc(g.name)}</b><span class="tiny muted b">Khách · ${g.host ? 'tính vào ' + esc((memberOf(c, g.host) || {}).name || '') : 'trả tại chỗ'}</span></span>${open ? `<button class="btn xs danger" data-act="delGuest" data-i="${i}">Xóa</button>` : ''}</div>`).join('')}</div>` : ''}
    ${open ? `<button class="btn sm ghost" data-act="guestSheet">＋ Thêm khách vãng lai</button>` : ''}
  </section>

  <section class="card stack">
    ${secH('Chi phí', `<b class="num">${vnd(total)}</b>`)}
    ${open ? `<div class="stack" style="gap:8px">${(s.costs || []).map((x, i) => `<div class="costrow"><input class="input" value="${esc(x.label)}" aria-label="Khoản chi ${i + 1}" data-chg="cost" data-i="${i}" data-f="label"><input class="input num" inputmode="numeric" value="${x.amount ? Number(x.amount).toLocaleString('vi-VN') : ''}" placeholder="0" aria-label="Số tiền ${esc(x.label)}" data-chg="cost" data-i="${i}" data-f="amount"><button type="button" class="x" style="width:36px;height:36px;font-size:16px" data-act="delCost" data-i="${i}" aria-label="Xóa khoản">✕</button></div>`).join('')}</div>
      <div class="chips">${sp.costs.filter(l => !(s.costs || []).some(x => x.label === l)).map(l => `<button class="chip" data-act="addCost" data-l="${esc(l)}">＋ ${esc(l)}</button>`).join('')}<button class="chip" data-act="addCost" data-l="">＋ Khoản khác</button></div>
      <p class="tiny faint b">Gõ số tiền rồi bấm ra ngoài để lưu. Có thể gõ tắt: 240k, 1.2tr.</p>`
    : `<div class="list">${(s.costs || []).map(x => `<div class="item"><span class="tx"><b>${esc(x.label)}</b></span><span class="amt">${vnd(x.amount)}</span></div>`).join('')}</div>`}
    <div class="field"><label for="payer">Người ứng tiền trước</label><select class="input" id="payer" data-chg="payer" ${open ? '' : 'disabled'}><option value="">Quỹ hội / quản trị viên</option>${members.map(m => `<option value="${m.id}" ${s.payer === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
  </section>

  <section class="card stack">
    ${secH('Chia tiền')}
    ${open ? `<div class="chips"><button class="chip ${s.split !== 'custom' ? 'on' : ''}" data-act="splitMode" data-k="equal">⚖️ Chia đều</button><button class="chip ${s.split === 'custom' ? 'on' : ''}" data-act="splitMode" data-k="custom">✍️ Tự nhập từng người</button></div>` : ''}
    ${s.split === 'custom' && open ? `<div class="stack" style="gap:8px">${s.attendees.map(id => { const m = memberOf(c, id); return m ? `<div class="row">${ava(m, 'xs')}<b class="grow ellip">${esc(m.name)}</b><input class="input num" style="width:130px;min-height:40px" inputmode="numeric" value="${(s.custom || {})[id] ? Number(s.custom[id]).toLocaleString('vi-VN') : ''}" placeholder="0" data-chg="custom" data-mid="${id}" aria-label="Số tiền của ${esc(m.name)}"></div>` : ''; }).join('')}
      ${(s.guests || []).filter(g => g.host).map(g => `<div class="row"><span class="ava xs">👤</span><b class="grow ellip">${esc(g.name)}</b><input class="input num" style="width:130px;min-height:40px" inputmode="numeric" value="${g.amount ? Number(g.amount).toLocaleString('vi-VN') : ''}" placeholder="0" data-chg="guestAmt" data-i="${s.guests.indexOf(g)}" aria-label="Số tiền của khách"></div>`).join('')}</div>` : ''}
    <div class="kpis">
      <div class="kpi"><div class="k">Số người</div><div class="v">${sessHeads(s)}</div></div>
      <div class="kpi"><div class="k">${s.split === 'custom' ? 'Đã phân bổ' : 'Mỗi người'}</div><div class="v" style="color:var(--brand)">${s.split === 'custom' ? vndShort(total + surplus) : vnd(per)}</div></div>
    </div>
    ${sessHeads(s) && surplus > 0 ? `<p class="tiny muted b">Làm tròn lên ${vnd(Number(c.settings.round) || 1)} nên dư <b>${vnd(surplus)}</b>${s.payer ? ', người ứng tiền giữ phần dư' : ', phần dư vào quỹ'}.</p>` : ''}
    ${s.split === 'custom' && surplus < 0 ? `<p class="err">Còn thiếu ${vnd(-surplus)} so với tổng chi phí.</p>` : ''}
  </section>

  ${s.attendees.length + (s.guests || []).length >= 2 ? `<section class="card stack">
    ${secH(sp.split === 'pairs' ? 'Ghép cặp ngẫu nhiên' : sp.split === 'groups' ? 'Chia nhóm' : 'Chia đội ngẫu nhiên')}
    ${sp.split !== 'pairs' ? `<div class="chips">${[2, 3, 4].map(k => `<button class="chip ${(s.teamsK || sp.teams || 2) === k ? 'on' : ''}" data-act="teamsK" data-k="${k}">${k} ${sp.split === 'groups' ? 'nhóm' : 'đội'}</button>`).join('')}</div>` : `<div class="chips"><button class="chip ${s.teamsMode !== 'teams' ? 'on' : ''}" data-act="teamsMode" data-k="pairs">Cặp đôi</button><button class="chip ${s.teamsMode === 'teams' ? 'on' : ''}" data-act="teamsMode" data-k="teams">2 đội</button></div>`}
    <button class="btn sm navy" data-act="makeTeams">🎲 ${s.teams ? 'Chia lại' : 'Chia ngay'} (cân bằng theo trình độ)</button>
    ${s.teams ? teamsBlock(c, s).replace(/^<section class="card stack">|<\/section>$/g, '') : ''}
  </section>` : ''}

  ${open ? `<div class="stack">
    <button class="btn block ok" data-act="settle" ${sessHeads(s) && total ? '' : 'disabled'}>✅ Chốt ${sp.unit} & tạo công nợ</button>
    <p class="tiny muted b center">${sessHeads(s) && total ? `Tạo ${Object.keys(shares).length} khoản phải trả. Người ứng tiền được tự động gạch nợ phần của mình.` : 'Cần có người điểm danh và chi phí để chốt.'}</p>
    <div class="grid2"><button class="btn sm danger" data-act="cancelSession">Hủy ${sp.unit}</button><button class="btn sm danger" data-act="delSession">🗑 Xóa</button></div>
  </div>` : ''}
  ${s.status === 'settled' ? `<section class="card stack">${secH('Công nợ từ ' + sp.unit + ' này', `<span class="pill">${charges.filter(x => x.paid).length}/${charges.length} đã trả</span>`)}
    <div class="list">${charges.map(x => { const m = memberOf(c, x.mid); return `<div class="item">${ava(m, 'sm')}<span class="tx"><b>${esc(m ? m.name : '?')}</b><span class="tiny muted b">${x.paid ? 'Đã trả' + (x.paidAt ? ' · ' + fmtTs(x.paidAt) : '') : x.reportedAt ? '📩 Báo đã chuyển khoản' : 'Chưa trả'}</span></span><span class="amt ${x.paid ? 'ok-t' : 'bad-t'}">${vnd(x.amount)}</span><button class="btn xs ${x.paid ? 'ghost' : 'ok'}" data-act="togglePaid" data-cid="${x.id}">${x.paid ? 'Hoàn tác' : 'Đã thu'}</button></div>`; }).join('')}</div>
    <div class="grid2"><button class="btn sm ghost" data-act="reopenSession">↺ Mở lại để sửa</button><button class="btn sm danger" data-act="delSession">🗑 Xóa ${sp.unit}</button></div></section>` : ''}
  ${s.status === 'cancelled' ? `<div class="grid2"><button class="btn sm ghost" data-act="reopenSession">↺ Mở lại</button><button class="btn sm danger" data-act="delSession">🗑 Xóa</button></div>` : ''}
  ${UI.confirm ? confirmBox() : ''}`;
}
function voteSection(c, s) {
  const vt = voteOf(c, s); const rs = s.rsvp || {};
  const rank = id => vt.going.includes(id) ? 0 : vt.wait.includes(id) ? 1 : rs[id] === 'no' ? 3 : 2;
  const ids = [...vt.yes, ...vt.none, ...vt.no].sort((a, b) => rank(a) - rank(b));
  return `<section class="card stack">
    ${secH('🗳️ Vote đi / không đi')}
    <div class="grid3">
      <div class="kpi"><div class="k">Đi</div><div class="v ok-t">${vt.going.length}${vt.max ? `<small class="tiny faint">/${vt.max}</small>` : ''}</div>${vt.wait.length ? `<div class="d">+${vt.wait.length} dự bị</div>` : ''}</div>
      <div class="kpi"><div class="k">Không đi</div><div class="v bad-t">${vt.no.length}</div></div>
      <div class="kpi"><div class="k">Chưa vote</div><div class="v">${vt.none.length}</div></div>
    </div>
    <div class="grid2"><button class="btn sm volt" data-act="copyVoteInvite">📣 Chép lời mời vote</button><button class="btn sm ghost" data-act="copyVoteResult">📋 Chép kết quả</button></div>
    <details data-k="votes" ${UI.voteOpen === false ? '' : 'open'}><summary class="b tiny" style="cursor:pointer;padding:4px 0">${isCloud(c) ? 'Danh sách vote · ghi hộ người chưa vào app' : 'Ghi vote hộ hội viên (khi họ trả lời qua Zalo)'}</summary>
      <div class="list" style="margin-top:6px">${ids.map(id => { const m = memberOf(c, id); if (!m) return ''; const r = rs[id];
        return `<div class="item">${ava(m, 'sm')}<span class="tx"><b>${esc(m.name)}${isCloud(c) && m.uid ? ' <span class="tiny" title="Đã vào app">🟢</span>' : ''}</b><span class="tiny b ${vt.wait.includes(id) ? 'warn-t' : r === 'yes' ? 'ok-t' : r === 'no' ? 'bad-t' : 'faint'}">${vt.wait.includes(id) ? '⏳ Dự bị ' + (vt.wait.indexOf(id) + 1) : r === 'yes' ? '✅ Đi' : r === 'no' ? '❌ Không đi' : 'Chưa vote'}</span></span>
          <button class="btn xs ${r === 'yes' ? 'ok' : 'ghost'}" data-act="adminVote" data-mid="${id}" data-r="yes" aria-label="${esc(m.name)} đi">✅</button><button class="btn xs ${r === 'no' ? 'danger' : 'ghost'}" data-act="adminVote" data-mid="${id}" data-r="no" aria-label="${esc(m.name)} không đi">❌</button></div>`; }).join('')}</div></details>
    <p class="tiny muted b">${isCloud(c) ? 'Hội viên đã vào app tự vote trên điện thoại (🟢). ' : 'Hội viên vote trong link xem nhanh: app soạn sẵn tin để họ gửi vào nhóm, bạn ghi lại ở đây. '}${vt.max ? 'Ai vote “Đi” trước được giữ chỗ trước.' : ''}</p>
  </section>`;
}
function bulkSheet() {
  return `<form class="stack" data-form="bulk"><h2 class="h2 disp">＋ Thêm nhiều người</h2>
    <div class="field"><label for="bk-names">Mỗi dòng một tên</label><textarea class="input" id="bk-names" name="names" rows="8" placeholder="Minh Quân\nThu Lan\nHoàng Nam" autofocus style="min-height:180px"></textarea></div>
    <p class="tiny muted b">Mỗi người được tạo với trình độ 3★. Sửa từng người sau trong tab Hội viên. Dán được danh sách chép từ Zalo hay Excel.</p>
    ${err()}
    <button class="btn block" type="submit">Thêm vào hội</button></form>`;
}
function confirmBox() {
  const cs = (curSession() && club()) ? club().charges.filter(x => x.ref === curSession().id) : [];
  const t = { delSession: cs.length ? `Xóa buổi này cùng ${cs.length} khoản công nợ (${cs.filter(x => x.paid).length} khoản đã thu)? Không hoàn tác được.` : 'Xóa buổi này? Không hoàn tác được.', reopenSession: 'Mở lại sẽ xóa các khoản công nợ của buổi này (kể cả khoản đã thu) để chốt lại. Tiếp tục?', cancelSession: 'Hủy buổi này? Hội viên sẽ thấy trạng thái Đã hủy.' }[UI.confirm] || 'Bạn chắc chứ?';
  return `<div class="note warn stack" style="gap:8px;position:sticky;bottom:12px;box-shadow:var(--shadow)"><b>${t}</b><div class="row"><button class="btn sm danger" data-act="doConfirm">Đồng ý</button><button class="btn sm ghost" data-act="cancelConfirm">Thôi</button></div></div>`;
}
function sessionFormSheet(c, s) {
  const sp = sportOf(c); const isNew = !s;
  s = s || { date: nextScheduledDay(c), time: c.schedule.time || '19:00', venue: c.schedule.venue || '', note: '' };
  return `<form class="stack" data-form="session">
    <h2 class="h2 disp">${isNew ? '＋ Tạo ' + sp.unit : 'Sửa thông tin'}</h2>
    <div class="grid2"><div class="field"><label for="s-date">Ngày</label><input class="input" id="s-date" name="date" type="date" value="${esc(s.date)}" required></div><div class="field"><label for="s-time">Giờ</label><input class="input" id="s-time" name="time" type="time" value="${esc(s.time)}"></div></div>
    <div class="field"><label for="s-venue">${sp.place}</label><input class="input" id="s-venue" name="venue" value="${esc(s.venue)}" placeholder="VD: Sân 3-4, nhà thi đấu…"></div>
    <div class="field"><label for="s-max">Số chỗ tối đa (không bắt buộc)</label><input class="input num" id="s-max" name="max" inputmode="numeric" value="${s.max ? esc(s.max) : ''}" placeholder="Để trống = không giới hạn"></div>
    <div class="field"><label for="s-note">Ghi chú cho hội viên</label><textarea class="input" id="s-note" name="note" placeholder="VD: Mang áo trắng, có giao lưu…">${esc(s.note || '')}</textarea></div>
    ${isNew ? `<p class="tiny muted b">Chi phí gợi ý cho ${esc(sp.name)}: ${sp.costs.map(esc).join(', ')}. Bạn nhập số tiền sau trong màn hình buổi.</p>` : ''}
    ${err()}
    <button class="btn block" type="submit">${isNew ? 'Tạo ' + sp.unit : 'Lưu'}</button>
  </form>`;
}
function guestSheet(c) {
  return `<form class="stack" data-form="guest"><h2 class="h2 disp">＋ Khách vãng lai</h2>
    <div class="field"><label for="g-name">Tên khách</label><input class="input" id="g-name" name="name" placeholder="VD: Bạn của Nam" autofocus></div>
    <div class="field"><label for="g-host">Ai trả tiền cho khách?</label><select class="input" id="g-host" name="host"><option value="">Khách trả tại chỗ (không tạo công nợ)</option>${activeMembers(c).map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></div>
    <p class="tiny muted b">Khách được tính vào số người chia tiền. Phần tiền của khách cộng vào công nợ của người dẫn khách.</p>
    <button class="btn block" type="submit">Thêm khách</button></form>`;
}

/* ---------- Thu chi ---------- */
function vAMoney(c) {
  const t = UI.moneyTab;
  const chips = `<div class="chips">${[['debt', '📒 Công nợ'], ['fund', '🏦 Quỹ hội'], ['history', '🧾 Lịch sử thu']].map(([k, l]) => `<button class="chip ${t === k ? 'on' : ''}" data-act="moneyTab" data-k="${k}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (t === 'fund') {
    const es = fundEntries(c); const tin = es.filter(e => e.type === 'in').reduce((a, e) => a + e.amount, 0), tout = es.filter(e => e.type === 'out').reduce((a, e) => a + e.amount, 0);
    body = `<div class="kpis"><div class="kpi"><div class="k">Tổng thu</div><div class="v ok-t">${vndShort(tin)}</div></div><div class="kpi"><div class="k">Tổng chi</div><div class="v bad-t">${vndShort(tout)}</div></div></div>
    <section class="card stack">${secH('Số dư quỹ', `<b class="num" style="font-size:20px">${vnd(tin - tout)}</b>`)}
      <div class="grid2"><button class="btn sm ok" data-act="fundSheet" data-k="in">＋ Ghi thu</button><button class="btn sm danger" data-act="fundSheet" data-k="out">− Ghi chi</button></div>
      <button class="btn sm volt" data-act="chargeSheet" data-k="monthly">💰 Thu quỹ tháng từ hội viên</button>
      ${es.length ? `<div class="list">${es.slice(0, 80).map(e => `<div class="item"><span class="ava sm" style="--ac:${e.type === 'in' ? 'var(--ok-soft)' : 'var(--bad-soft)'}">${e.type === 'in' ? '↘' : '↗'}</span><span class="tx"><b>${esc(e.label)}</b><span class="tiny muted b">${fmtDate(e.date)}${e.auto ? ' · tự động từ khoản thu' : ''}</span></span><span class="amt ${e.type === 'in' ? 'ok-t' : 'bad-t'}">${e.type === 'in' ? '+' : '−'}${vnd(e.amount)}</span>${e.auto ? '' : `<button class="copy" data-act="delFund" data-id="${e.id}" aria-label="Xóa">✕</button>`}</div>`).join('')}</div>` : empty('🏦', 'Chưa có thu chi nào.')}
    </section>
    <p class="tiny muted b">Quỹ hội gồm các khoản ghi tay và các khoản <b>quỹ tháng / đóng quỹ</b> hội viên đã trả. Tiền buổi chơi trả lại cho người ứng tiền nên không tính vào quỹ.</p>`;
  } else if (t === 'history') {
    const paid = c.charges.filter(x => x.paid).sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0)).slice(0, 100);
    body = `<section class="card stack">${secH('Đã thu gần đây')}${paid.length ? `<div class="list">${paid.map(x => { const m = memberOf(c, x.mid); return `<div class="item">${ava(m, 'sm')}<span class="tx"><b>${esc(m ? m.name : '?')} · ${esc(x.label)}</b><span class="tiny muted b">${x.paidAt ? fmtTs(x.paidAt) : ''}</span></span><span class="amt ok-t">${vnd(x.amount)}</span><button class="copy" data-act="togglePaid" data-cid="${x.id}" aria-label="Hoàn tác">↺</button></div>`; }).join('')}</div>` : empty('🧾', 'Chưa có khoản nào được thu.')}</section>`;
  } else {
    const rows = c.members.map(m => ({ m, d: debtOf(c, m.id), n: unpaidOf(c, m.id).length, rep: unpaidOf(c, m.id).some(x => x.reportedAt) })).filter(x => x.d > 0).sort((a, b) => b.rep - a.rep || b.d - a.d);
    body = `<section class="card stack">${secH('Tổng chưa thu', `<b class="num bad-t" style="font-size:20px">${vnd(totalDebt(c))}</b>`)}
      <div class="grid2"><button class="btn sm volt" data-act="chargeSheet" data-k="monthly">💰 Quỹ tháng</button><button class="btn sm navy" data-act="chargeSheet" data-k="other">＋ Khoản thu khác</button></div>
      ${rows.length ? `<div class="list">${rows.map(({ m, d, n, rep }) => `<button class="item" data-act="debtSheet" data-mid="${m.id}">${ava(m, 'sm')}<span class="tx"><b>${esc(m.name)}</b><span class="tiny muted b">${n} khoản chưa trả</span></span>${rep ? '<span class="pill ok">📩 Báo đã CK</span>' : ''}<span class="amt bad-t">${vnd(d)}</span><span class="faint" style="font-size:22px">›</span></button>`).join('')}</div>` : empty('✅', 'Không ai nợ. Tuyệt vời!')}
      ${rows.length ? `<button class="btn sm ghost" data-act="copyAllReminders">📋 Chép danh sách nhắc nợ cả hội</button>` : ''}
    </section>`;
  }
  return chips + body;
}
function debtSheet(c, m) {
  if (!m) return '';
  const un = unpaidOf(c, m.id).sort((a, b) => a.date.localeCompare(b.date)); const d = debtOf(c, m.id);
  const rep = un.filter(x => x.reportedAt);
  return `<div class="row">${ava(m, 'lg')}<div class="grow"><div class="eyebrow">Công nợ</div><h2 class="h2">${esc(m.name)}</h2><p class="b ${d ? 'bad-t' : 'ok-t'}">${d ? 'Còn nợ ' + vnd(d) : 'Đã trả đủ'}</p></div></div>
  ${rep.length ? `<div class="note ok">📩 ${esc(m.name)} báo đã chuyển khoản lúc ${fmtTs(Math.max(...rep.map(x => x.reportedAt)))}. Kiểm tra tài khoản rồi bấm xác nhận.</div>` : ''}
  ${un.length ? `<section class="card stack"><div class="list">${un.map(x => `<div class="item"><span class="tx"><b>${esc(x.label)}</b><span class="tiny muted b">${kindLabel(x.kind)}${x.reportedAt ? ' · 📩 đã báo CK' : ''}</span></span><span class="amt">${vnd(x.amount)}</span><button class="btn xs ok" data-act="togglePaid" data-cid="${x.id}">Đã thu</button><button class="copy" data-act="delCharge" data-cid="${x.id}" aria-label="Xóa khoản">✕</button></div>`).join('')}</div>
    <button class="btn block ok" data-act="payAll" data-mid="${m.id}">✅ ${rep.length ? 'Xác nhận đã nhận' : 'Đã thu đủ'} ${vnd(d)}</button></section>
    <div class="grid2"><button class="btn sm ghost" data-act="copyReminder" data-mid="${m.id}">📋 Chép tin nhắc nợ</button>${bankReady(c.bank) ? `<button class="btn sm navy" data-act="downloadPayQR" data-mid="${m.id}">⬇️ Ảnh QR</button>` : `<button class="btn sm ghost" data-act="atab" data-t="settings">🏦 Nhập TK</button>`}</div>
    ${bankReady(c.bank) ? `<details class="card"><summary class="b" style="cursor:pointer">Hiện mã VietQR để ${esc(m.name)} quét</summary><div class="stack" style="margin-top:12px">${qrBlock({ bin: c.bank.bin, acct: c.bank.acct, holder: c.bank.holder, amount: d, note: transferNote(c, m.name) })}</div></details>` : ''}` : empty('🎉', 'Không còn khoản nào.')}
  <button class="btn block ghost" data-act="closeSheet">Đóng</button>`;
}
function chargeSheet(c, kind) {
  const isM = kind === 'monthly';
  return `<form class="stack" data-form="charge" data-k="${kind}">
    <h2 class="h2 disp">${isM ? '💰 Thu quỹ tháng' : '＋ Khoản thu khác'}</h2>
    <div class="field"><label for="ch-label">Tên khoản thu</label><input class="input" id="ch-label" name="label" value="${isM ? 'Quỹ tháng ' + fmtMonth(monthKey()) : ''}" placeholder="VD: Áo đấu, giải giao hữu…" required></div>
    <div class="field"><label for="ch-amt">Số tiền mỗi người</label><input class="input num" id="ch-amt" name="amount" inputmode="numeric" placeholder="VD: 100k" required></div>
    <div class="field"><span class="lbl">Thu của ai?</span><div class="row wrap" style="gap:6px"><button type="button" class="link tiny" data-act="chkAll" data-v="1">Chọn tất cả</button> · <button type="button" class="link tiny" data-act="chkAll" data-v="0">Bỏ chọn</button></div>
      <div class="stack" style="gap:6px">${activeMembers(c).map(m => `<label class="check on" style="cursor:pointer"><input type="checkbox" name="m" value="${m.id}" checked style="width:22px;height:22px;accent-color:var(--sport)">${ava(m, 'xs')}<b class="grow ellip">${esc(m.name)}</b></label>`).join('')}</div></div>
    ${isM ? '<p class="tiny muted b">Khoản quỹ tháng khi được thu sẽ tự cộng vào Quỹ hội.</p>' : '<label class="row b tiny"><input type="checkbox" name="tofund" style="width:20px;height:20px"> Tính vào quỹ hội khi thu</label>'}
    ${err()}
    <button class="btn block" type="submit">Tạo khoản thu</button></form>`;
}
function fundSheet(type) {
  return `<form class="stack" data-form="fund" data-k="${type}"><h2 class="h2 disp">${type === 'in' ? '＋ Ghi thu quỹ' : '− Ghi chi quỹ'}</h2>
    <div class="field"><label for="f-label">Nội dung</label><input class="input" id="f-label" name="label" placeholder="${type === 'in' ? 'VD: Tài trợ, tiền thưởng giải…' : 'VD: Mua cầu, liên hoan, áo đấu…'}" required autofocus></div>
    <div class="grid2"><div class="field"><label for="f-amt">Số tiền</label><input class="input num" id="f-amt" name="amount" inputmode="numeric" placeholder="VD: 350k" required></div><div class="field"><label for="f-date">Ngày</label><input class="input" id="f-date" name="date" type="date" value="${dayKey()}"></div></div>
    ${err()}
    <button class="btn block ${type === 'in' ? 'ok' : ''}" type="submit">Lưu</button></form>`;
}

/* ---------- Hội viên (quản trị) ---------- */
function vAMembers(c) {
  const q = noTone(UI.q || '').toLowerCase();
  const admins = c.admins || [];
  const list = c.members.filter(m => !q || noTone(m.name).toLowerCase().includes(q)).sort((a, b) => (a.active === false) - (b.active === false) || a.name.localeCompare(b.name, 'vi'));
  const reqs = c.requests || [];
  const unlinked = activeMembers(c).filter(m => !m.uid);
  const linkedN = c.members.filter(m => m.uid).length;
  return `${isCloud(c) ? `<section class="card stack" style="background:var(--navy);color:#fff;border:0">
      <div class="row"><span style="font-size:30px">📨</span><div class="grow"><b>Mời hội viên vào app</b><p class="tiny b" style="opacity:.75">${linkedN}/${activeMembers(c).length} người đã vào app. Gửi <b>link mời chung</b> vào nhóm Zalo (bạn duyệt từng người), hoặc bấm <b>Mời</b> cạnh tên để gửi link riêng (vào ngay, không cần duyệt).</p></div></div>
      <button class="btn volt sm" data-act="groupInvite">📋 Chép link mời chung</button></section>`
    : `<div class="note warn">📱 Hội này lưu trên máy bạn nên hội viên chưa đăng nhập được. ${ME && CLOUD ? '<button class="link" data-act="uploadSheet" data-cid="' + c.id + '">Đưa hội lên đám mây</button> để mời mọi người.' : CLOUD ? 'Đăng nhập rồi đưa hội lên đám mây để mời mọi người.' : ''}</div>`}
  ${reqs.length ? `<section class="card stack hl">${secH(`📨 Xin vào hội (${reqs.length})`)}${reqs.map(r => `<div class="stack" style="gap:8px;padding:10px 0;border-bottom:1px solid var(--line)"><div class="row">${r.photo ? `<span class="ava sm" style="background:url('${esc(r.photo)}') center/cover"></span>` : '<span class="ava sm">🙋</span>'}<div class="grow"><b>${esc(r.name || 'Không tên')}</b><span class="tiny muted b" style="display:block">${esc(r.email || '')} · ${r.at ? fmtTs(r.at) : ''}</span></div></div>
      <div class="field"><label for="ap-${esc(r.uid)}">Là ai trong hội?</label><select class="input" id="ap-${esc(r.uid)}"><option value="">Hội viên mới: ${esc(r.name || '')}</option>${unlinked.map(m => `<option value="${m.id}" ${noTone(m.name).toLowerCase() === noTone(r.name || '').toLowerCase() ? 'selected' : ''}>Là “${esc(m.name)}” trong danh sách</option>`).join('')}</select></div>
      <div class="grid2"><button class="btn sm ok" data-act="approveReq" data-uid="${esc(r.uid)}">✅ Duyệt</button><button class="btn sm danger" data-act="rejectReq" data-uid="${esc(r.uid)}">Từ chối</button></div></div>`).join('')}</section>` : ''}
  <div class="row"><input class="input grow" placeholder="🔎 Tìm hội viên…" value="${esc(UI.q || '')}" data-chg="search" aria-label="Tìm hội viên"><button class="btn" data-act="memberSheet">＋ Thêm</button></div>
  <button class="link tiny" style="align-self:flex-start" data-act="bulkSheet">＋ Thêm nhiều người cùng lúc (dán danh sách tên)</button>
  <section class="card stack">${secH(`${activeMembers(c).length} hội viên`)}
    ${list.length ? `<div class="list">${list.map(m => `<div class="item" style="${m.active === false ? 'opacity:.5' : ''}"><button class="row grow" style="text-align:left;min-width:0" data-act="memberSheet" data-mid="${m.id}">${ava(m)}<span class="tx"><b>${esc(m.name)}${m.active === false ? ' · đã nghỉ' : ''}</b><span class="tiny muted b">${isCloud(c) ? (m.uid ? (m.uid === c.owner ? '🟢 Người lập hội · ' : admins.includes(m.uid) ? '🟢 Quản trị · ' : '🟢 Đã vào app · ') : '⚪ Chưa vào app · ') : ''}${attended(c, m.id)} ${sportOf(c).unit}${debtOf(c, m.id) ? ' · nợ ' + vndShort(debtOf(c, m.id)) : ''}</span></span></button>${isCloud(c) && !m.uid && m.active !== false ? `<button class="btn xs volt" data-act="personalInvite" data-mid="${m.id}">Mời</button>` : ''}</div>`).join('')}</div>` : empty('👥', 'Chưa có hội viên. Bấm ＋ Thêm để bắt đầu.')}
  </section>`;
}
function memberSheet(c, m) {
  const isNew = !m; m = m || { name: '', phone: '', avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)], level: 3, active: true };
  const sel = UI.editAvatar || m.avatar;
  const admins = c.admins || [], isOwnerM = m.uid && m.uid === c.owner, isMe = isCloud(c) ? (ME && m.uid === ME.uid) : c.meMid === m.id;
  return `<form class="stack" data-form="member" data-mid="${isNew ? '' : m.id}">
    <h2 class="h2 disp">${isNew ? '＋ Thêm hội viên' : 'Hồ sơ hội viên'}</h2>
    <div class="field"><label for="m-name">Tên</label><input class="input" id="m-name" name="name" value="${esc(m.name)}" placeholder="VD: Minh Quân" required maxlength="40" ${isNew ? 'autofocus' : ''}></div>
    <div class="field"><label for="m-phone">Điện thoại (không bắt buộc)</label><input class="input" id="m-phone" name="phone" inputmode="tel" value="${esc(m.phone || '')}"></div>
    <div class="field"><span class="lbl">Trình độ (dùng khi chia đội cân bằng)</span><div class="chips">${[1, 2, 3, 4, 5].map(l => `<label class="chip ${Number(m.level) === l ? 'on' : ''}" style="cursor:pointer"><input type="radio" name="level" value="${l}" ${Number(m.level) === l ? 'checked' : ''} hidden data-chg="radioChip">${'★'.repeat(l)}</label>`).join('')}</div></div>
    <div class="field"><span class="lbl">Ảnh đại diện</span><input type="hidden" name="avatar" value="${esc(sel)}"><div class="chips">${AVATARS.map(a => `<button type="button" class="chip ${sel === a ? 'on' : ''}" style="font-size:20px;padding:0 9px" data-act="pickAvatar" data-a="${a}">${a}</button>`).join('')}</div></div>
    ${err()}
    ${isNew ? `<div class="grid2"><button class="btn" type="submit" name="next" value="1">＋ Thêm & nhập tiếp</button><button class="btn navy" type="submit">Thêm & đóng</button></div>
      <button type="button" class="link tiny" style="align-self:center" data-act="bulkSheet">Thêm nhiều người cùng lúc</button>` : `<button class="btn block" type="submit">Lưu thay đổi</button>`}
    ${isNew ? '' : `
      ${isCloud(c) ? `<section class="card stack flat">${secH('Tài khoản')}
        ${m.uid ? `<p class="b">🟢 Đã vào app${m.email ? ` · <span class="tiny muted">${esc(m.email)}</span>` : ''}${isOwnerM ? ' · Người lập hội' : admins.includes(m.uid) ? ' · Quản trị' : ''}</p>
          ${!isOwnerM && !isMe ? `<div class="grid2"><button type="button" class="btn sm ${admins.includes(m.uid) ? 'ghost' : 'navy'}" data-act="toggleAdminRole" data-mid="${m.id}">${admins.includes(m.uid) ? 'Bỏ quyền quản trị' : '🛡️ Phong quản trị'}</button><button type="button" class="btn sm danger" data-act="unlinkMember" data-mid="${m.id}">Gỡ tài khoản</button></div>` : ''}`
        : `<p class="b">⚪ Chưa vào app</p><button type="button" class="btn sm volt" data-act="personalInvite" data-mid="${m.id}">📨 Chép link mời riêng cho ${esc(m.name)}</button><p class="tiny muted b">Gửi link này riêng cho ${esc(m.name)}. Mở link, đăng nhập là vào hội ngay với đúng tên này, giữ nguyên lịch sử.</p>`}</section>`
      : `<label class="row b tiny" style="cursor:pointer"><input type="checkbox" data-act="setMe" data-mid="${m.id}" ${isMe ? 'checked' : ''} style="width:20px;height:20px"> Đây là tôi (để vote và xem công nợ của mình)</label>`}
      ${!isOwnerM && !isMe ? `<div class="grid2"><button type="button" class="btn sm ghost" data-act="toggleActive" data-mid="${m.id}">${m.active === false ? '↺ Cho quay lại' : '⏸ Cho nghỉ'}</button><button type="button" class="btn sm danger" data-act="delMember" data-mid="${m.id}">🗑 Xóa hẳn</button></div>` : ''}
      ${UI.confirm === 'delMember' ? `<div class="note warn stack" style="gap:8px">Xóa hẳn ${esc(m.name)}${debtOf(c, m.id) ? ` (đang nợ ${vnd(debtOf(c, m.id))})` : ''} cùng toàn bộ công nợ và lịch sử? Không hoàn tác được. Muốn giữ lịch sử thì chọn <b>Cho nghỉ</b>.<div class="row"><button type="button" class="btn sm danger" data-act="doDelMember" data-mid="${m.id}">Xóa</button><button type="button" class="btn sm ghost" data-act="cancelConfirm">Thôi</button></div></div>` : ''}
      <p class="tiny muted b">Tham gia ${attended(c, m.id)} ${sportOf(c).unit} · đã trả ${vnd(paidTotal(c, m.id))} · còn nợ ${vnd(debtOf(c, m.id))}</p>`}
  </form>`;
}

/* ---------- Cài đặt ---------- */
function vASettings(c) {
  const sp = sportOf(c), r = role(c);
  return `<form class="card stack" data-form="clubInfo">${secH('Thông tin hội')}
    <div class="field"><label for="ci-name">Tên hội</label><input class="input" id="ci-name" name="name" value="${esc(c.name)}" required maxlength="60"></div>
    <div class="field"><label for="ci-sport">Môn thể thao</label><select class="input" id="ci-sport" name="sport">${Object.entries(SPORTS).map(([k, s]) => `<option value="${k}" ${c.sport === k ? 'selected' : ''}>${s.ic} ${esc(s.name)}</option>`).join('')}</select></div>
    ${c.sport === 'other' ? `<div class="field"><label for="ci-sname">Tên môn</label><input class="input" id="ci-sname" name="sportName" value="${esc(c.sportName || '')}"></div>` : ''}
    <div class="field"><label for="ci-venue">${sp.place} quen thuộc</label><input class="input" id="ci-venue" name="venue" value="${esc(c.schedule.venue || '')}"></div>
    <div class="field"><span class="lbl">Lịch chơi cố định</span><div class="chips">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label class="chip ${c.schedule.days.includes(d) ? 'on' : ''}" style="cursor:pointer"><input type="checkbox" name="days" value="${d}" ${c.schedule.days.includes(d) ? 'checked' : ''} hidden data-chg="checkChip">${WD[d]}</label>`).join('')}</div></div>
    <div class="grid2"><div class="field"><label for="ci-time">Giờ bắt đầu</label><input class="input" id="ci-time" name="time" type="time" value="${esc(c.schedule.time || '')}"></div>
    <div class="field"><label for="ci-round">Làm tròn tiền chia</label><select class="input" id="ci-round" name="round">${[[1, 'Không làm tròn'], [1000, 'Lên 1.000đ'], [5000, 'Lên 5.000đ'], [10000, 'Lên 10.000đ']].map(([v, t]) => `<option value="${v}" ${Number(c.settings.round) === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
    <button class="btn sm navy" type="submit">Lưu thông tin hội</button></form>

  <form class="card stack" data-form="bank">${secH('🏦 Tài khoản nhận tiền (VietQR)')}
    <div class="field"><label for="bk-bin">Ngân hàng</label><select class="input" id="bk-bin" name="bin"><option value="">— Chọn ngân hàng —</option>${BANKS.map(([b, n]) => `<option value="${b}" ${c.bank.bin === b ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
    <div class="field"><label for="bk-acct">Số tài khoản</label><input class="input num" id="bk-acct" name="acct" inputmode="numeric" value="${esc(c.bank.acct || '')}"></div>
    <div class="field"><label for="bk-holder">Tên chủ tài khoản (không dấu)</label><input class="input" id="bk-holder" name="holder" value="${esc(c.bank.holder || '')}" placeholder="VD: NGUYEN VAN A" style="text-transform:uppercase"></div>
    <button class="btn sm navy" type="submit">Lưu tài khoản</button>
    <p class="tiny muted b">Mã VietQR được tạo ngay trên máy, hội viên quét là có sẵn số tiền và nội dung chuyển khoản.</p></form>

  ${!isCloud(c) && !c.demo ? `<section class="card stack">${secH('☁️ Đưa lên đám mây')}<p class="tiny muted b">Hội cũ đang lưu trên máy này. Đưa lên đám mây để không mất dữ liệu và mọi người tự vote, xem công nợ, báo chuyển khoản trên điện thoại của mình.</p><button class="btn sm" data-act="uploadSheet" data-cid="${c.id}">☁️ Đưa hội lên đám mây</button></section>` : ''}

  <section class="card stack">${secH('🔗 Link xem nhanh (không cần tài khoản)')}
    <p class="tiny muted b">Bản chụp lịch sắp tới, vote, bảng xếp hạng và công nợ hiện tại, gửi cho người chưa vào app. Khi số liệu thay đổi, tạo link mới.</p>
    <div class="grid2"><button class="btn sm volt" data-act="shareLink">Tạo & chép link</button><button class="btn sm ghost" data-act="previewShared">👁 Xem thử</button></div></section>

  <section class="card stack">${secH('💾 Sao lưu')}<p class="tiny muted b">Tải toàn bộ hội viên, buổi chơi, công nợ, quỹ ra file .json. Cất vào Google Drive hoặc Zalo Cloud. Khi cần, mở <b>Tài khoản → Khôi phục từ file</b>.</p>${isCloud(c) ? `<p class="tiny b ${needBackup(c) ? 'warn-t' : 'ok-t'}">Lần sao lưu gần nhất: ${c.backupAt ? fmtTs(c.backupAt) : 'chưa có'} · app nhắc mỗi ${BACKUP_DAYS} ngày</p>` : ''}<button class="btn sm ok" data-act="exportData">⬇️ Tải file sao lưu</button></section>
  <div class="stack">
    ${r === 'owner' ? `<button class="btn block danger" data-act="askDelClub">🗑 Xóa hội${isCloud(c) ? '' : ' khỏi máy'}</button>` : '<button class="btn block danger" data-act="askLeave">Rời hội</button>'}
    ${UI.confirm === 'delClub' ? `<div class="note warn stack" style="gap:8px"><b>Xóa vĩnh viễn hội “${esc(c.name)}”${isCloud(c) ? ' cho tất cả hội viên' : ' khỏi máy này'}?</b><span class="tiny">Toàn bộ buổi chơi, công nợ, quỹ sẽ mất, không khôi phục được. Nên <button class="link" data-act="exportData">tải file sao lưu</button> trước.</span><div class="field"><label for="del-name">Gõ tên hội để xác nhận</label><input class="input" id="del-name" placeholder="${esc(c.name)}" autocomplete="off"></div><div class="row"><button class="btn sm danger" data-act="doDelClub">Xóa vĩnh viễn</button><button class="btn sm ghost" data-act="cancelConfirm">Thôi</button></div></div>` : ''}
    ${UI.confirm === 'leave' ? `<div class="note warn stack" style="gap:8px"><b>Rời “${esc(c.name)}”?</b> Bạn sẽ mất quyền quản trị hội này.<div class="row"><button class="btn sm danger" data-act="doLeave">Rời hội</button><button class="btn sm ghost" data-act="cancelConfirm">Thôi</button></div></div>` : ''}
  </div>`;
}

/* ---------- link xem nhanh (chỉ đọc) ---------- */
const sharedUps = d => (d.up || []).map(u => Array.isArray(u)
  ? { date: u[0], time: u[1], venue: u[2], yes: [], no: [], max: 0 }
  : { date: u.d, time: u.t, venue: u.v, yes: u.y || [], no: u.n || [], max: u.mx || 0 });
function vShared() {
  const d = UI.shared; if (!d) return vWelcome();
  const sp = sportOf(d); const m = d.m.find(x => x[0] === UI.sharedMid);
  const head = `<header class="apphead" style="margin-bottom:0"><div class="top"><span class="crest">${sp.ic}</span><div class="grow"><div class="s">${esc(sp.name)} · Bản xem nhanh</div><div class="t">${esc(d.n)}</div></div>${UI.sharedPreview ? '<button class="hbtn" data-act="closePreview">✕ Đóng</button>' : ''}</div></header>`;
  const ups = sharedUps(d);
  const nm = id => (d.m.find(y => y[0] === id) || [id, '?'])[1];
  const sessBox = (u, i, mine) => { const dd = parseDay(u.date); const going = u.max ? u.yes.slice(0, u.max) : u.yes, wait = u.max ? u.yes.slice(u.max) : [];
    const myV = mine ? (u.yes.includes(mine) ? (wait.includes(mine) ? 'wait' : 'yes') : u.no.includes(mine) ? 'no' : '') : '';
    return `<div class="stack" style="gap:8px"><div class="sess"><span class="date"><span class="w">${WD[dd.getDay()]}</span><span class="d">${pad2(dd.getDate())}</span><span class="m">Th${dd.getMonth() + 1}</span></span><span class="tx"><b>${sp.ic} ${cap1(sp.unit)} ${esc(u.time)}</b>${u.venue ? `<span class="tiny muted b ellip">📍 ${esc(u.venue)}</span>` : ''}<span class="tiny faint b">✅ ${going.length}${u.max ? '/' + u.max : ''} đi${wait.length ? ` · ⏳ ${wait.length} dự bị` : ''} · ❌ ${u.no.length} không${relDay(u.date) ? ' · ' + relDay(u.date) : ''}</span></span></div>
      ${going.length ? `<p class="tiny muted b">Đi: ${going.map(id => esc(nm(id))).join(', ')}${wait.length ? ` · Dự bị: ${wait.map(id => esc(nm(id))).join(', ')}` : ''}</p>` : ''}
      ${mine ? `${myV ? `<p class="tiny b ${myV === 'no' ? 'bad-t' : myV === 'wait' ? 'warn-t' : 'ok-t'}">Đã ghi: ${myV === 'yes' ? '✅ bạn đi' : myV === 'wait' ? '⏳ bạn ở danh sách dự bị' : '❌ bạn không đi'}</p>` : ''}
        <div class="row" style="gap:8px"><button class="btn sm ok" style="flex:1" data-act="sharedVote" data-i="${i}" data-r="yes">✅ Tôi đi</button><button class="btn sm danger" style="flex:1" data-act="sharedVote" data-i="${i}" data-r="no">❌ Tôi không đi</button></div>` : ''}</div>`; };
  const upHtml = ups.map((u, i) => sessBox(u, i, null)).join('');
  if (!m) return `${head}
  <div class="note">Cập nhật lúc <b>${fmtTs(d.t)}</b>. Đây là bản chụp quản trị viên gửi, không tự cập nhật. <a class="link" href="./">Đăng nhập Sport Share</a> để xem trực tiếp.</div>
  <p class="b">Bạn là ai? Chạm tên để vote đi / không đi và xem số tiền cần trả.</p>
  <div class="profiles">${d.m.map(([id, name, avatar]) => { const debt = (d.d[id] || []).reduce((a, x) => a + x[1], 0); return `<button class="prof" data-act="sharedPick" data-mid="${id}">${ava({ id, avatar }, 'lg')}<span class="n">${esc(name)}</span>${debt ? `<span class="pill bad">Nợ ${vndShort(debt)}</span>` : '<span class="pill ok">Sạch nợ</span>'}</button>`; }).join('')}</div>
  ${upHtml ? secH('Lịch sắp tới') + upHtml : ''}
  ${(d.r || []).length ? `<section class="card stack">${secH('Chăm chỉ tháng này')}<div>${d.r.slice(0, 10).map(([id, n], i) => { const x = d.m.find(y => y[0] === id) || [id, '?', '🙂']; return `<div class="rank"><span class="no">${i + 1}</span>${ava({ id, avatar: x[2] }, 'sm')}<b class="grow ellip">${esc(x[1])}</b><span class="pill sport">${n} ${sp.unit}</span></div>`; }).join('')}</div></section>` : ''}
  <p class="foot">Tạo bằng Sport Share · <button class="link" data-act="leaveShared">Mở ứng dụng</button></p>`;
  const [id, name, avatar] = m; const items = d.d[id] || []; const debt = items.reduce((a, x) => a + x[1], 0);
  return `${head}
  <div class="row"><button class="x" data-act="sharedPick" data-mid="" aria-label="Quay lại">←</button><span class="muted tiny b">Cập nhật ${fmtTs(d.t)}</span></div>
  <section class="card stack" style="align-items:center;text-align:center">${ava({ id, avatar }, 'lg')}<h2 class="h2">${esc(name)}</h2><p class="b ${debt ? 'bad-t' : 'ok-t'}" style="font-size:20px">${debt ? 'Cần trả ' + vnd(debt) : 'Đã trả đủ 🎉'}</p></section>
  ${ups.length ? `<section class="card stack">${secH('🗳️ Vote buổi sắp tới')}${ups.map((u, i) => sessBox(u, i, id)).join('<div class="divider"></div>')}<p class="tiny muted b">Bấm vote, app chép sẵn tin nhắn. Dán vào nhóm Zalo để quản trị viên ghi nhận.</p></section>` : ''}
  ${items.length ? `<section class="card stack">${secH('Chi tiết')}<div class="list">${items.map(([l, a]) => `<div class="item"><span class="tx"><b>${esc(l)}</b></span><span class="amt">${vnd(a)}</span></div>`).join('')}</div></section>` : ''}
  ${debt && d.b && d.b.bin ? `<section class="card stack">${secH('Chuyển khoản VietQR')}${qrBlock({ bin: d.b.bin, acct: d.b.acct, holder: d.b.holder, amount: debt, note: transferNote({ name: d.n }, name) })}</section>` : ''}
  <p class="foot">Sau khi chuyển khoản, quản trị viên sẽ gạch nợ ở lần cập nhật sau.</p>`;
}

/* ---------- pháp lý ---------- */
function vLegal() {
  const h = t => `<h2 class="h3" style="margin-top:6px">${t}</h2>`;
  return `<div class="row"><button class="x" data-act="closeLegal" aria-label="Quay lại">←</button></div>
  <article class="card stack" style="font-weight:500">
    <h1 class="h2 disp">Chính sách quyền riêng tư</h1>
    <p class="tiny muted">Cập nhật ngày 27/11/2026.</p>
    ${h('1. Sport Share lưu những gì?')}<p>Tài khoản: tên hiển thị, email, ảnh đại diện Google (nếu đăng nhập bằng Google). Trong từng hội: tên hội, môn thể thao, lịch chơi, danh sách hội viên (tên, biểu tượng, trình độ, số điện thoại nếu quản trị nhập), vote đi / không đi, điểm danh, chi phí, công nợ, quỹ hội và tài khoản ngân hàng nhận tiền của hội.</p>
    ${h('2. Dữ liệu nằm ở đâu?')}<p>Dữ liệu hội lưu trên Google Firebase (Cloud Firestore, máy chủ tại Singapore) để các thành viên dùng chung; đăng nhập do Firebase Authentication xử lý, Sport Share không thấy mật khẩu của bạn. Hội mẫu để chơi thử chỉ nằm trong trình duyệt và mất khi tải lại trang.</p>
    ${h('3. Ai xem được gì?')}<p>Chỉ thành viên của hội mới xem được hội đó. Hội viên chỉ thấy công nợ của chính mình; quản trị viên thấy công nợ cả hội và sổ quỹ. Hội viên chỉ tự vote, tự sửa tên/biểu tượng và báo đã chuyển khoản cho chính mình. Link mời và link xem nhanh: ai có link đều mở được, vì vậy chỉ gửi trong nhóm của hội.</p>
    ${h('4. Không quảng cáo, không bán dữ liệu')}<p>Không quảng cáo, không cookie theo dõi, không công cụ phân tích. Sport Share không bán hay chia sẻ dữ liệu cho bên thứ ba.</p>
    ${h('5. Xóa dữ liệu')}<p>Hội viên có thể rời hội bất cứ lúc nào. Người lập hội xóa được toàn bộ hội. Quản trị viên nên tải file sao lưu định kỳ (app nhắc mỗi 30 ngày) để phòng xóa nhầm. Muốn xóa tài khoản, hãy liên hệ qua trang dự án bên dưới.</p>
    ${h('6. Thanh toán và ủng hộ')}<p>Chuyển khoản diễn ra trong ứng dụng ngân hàng của bạn. Sport Share không nhận, không giữ và không lưu thông tin thanh toán nào.</p>
  </article>
  <article class="card stack" style="font-weight:500">
    <h1 class="h2 disp">Điều khoản sử dụng</h1>
    ${h('1. Miễn phí, nguyên trạng')}<p>Sport Share được cung cấp miễn phí, "nguyên trạng". Ứng dụng giúp ghi sổ lịch chơi, chia tiền và công nợ; các khoản tiền là thỏa thuận riêng giữa các thành viên trong hội.</p>
    ${h('2. Trách nhiệm của quản trị viên')}<p>Quản trị viên kiểm tra số liệu trước khi thông báo, chỉ mời đúng người vào hội và giữ thông tin tài khoản nhận tiền chính xác.</p>
    ${h('3. Ủng hộ')}<p>Mọi sự ủng hộ là hoàn toàn tự nguyện để duy trì và phát triển ứng dụng miễn phí, không đi kèm nghĩa vụ hay dịch vụ thương mại. Ủng hộ hay không, mọi người dùng đều có đầy đủ tính năng như nhau.</p>
    ${h('4. Giấy phép')}<p>Font Be Vietnam Pro dùng theo SIL Open Font License 1.1. Thư viện qrcode-generator (Kazuhiko Arase) và Firebase JS SDK theo giấy phép MIT / Apache 2.0. "QR Code" là nhãn hiệu của DENSO WAVE. VietQR là nhãn hiệu của Napas.</p>
    ${h('5. Liên hệ')}<p>Góp ý, báo lỗi, yêu cầu xóa dữ liệu: nhắn <a class="link" href="${FANPAGE}" target="_blank" rel="noopener">Fanpage Sport Share</a> hoặc <span style="user-select:all">github.com/mhtiny3ds-a11y/Sport_share</span>.</p>
  </article>
  <button class="btn block ghost" data-act="closeLegal">← Quay lại</button>`;
}
