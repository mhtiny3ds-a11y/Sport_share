/* Sport Share — giao diện (mỗi hàm v* trả về HTML của một màn hình). */
'use strict';

const UI = { view: 'welcome', tab: 'home', atab: 'home', sid: null, sheet: null, toast: null, pin: '', pinFor: null, pinBad: false, err: '', reg: { step: 1 }, confirm: null, moneyTab: 'debt', sessFilter: 'up', rankPeriod: 'month', donateIdx: 1, shared: null, sharedMid: null, fresh: false, q: '' };
let toastTimer;
function toast(msg) { UI.toast = msg; render(); clearTimeout(toastTimer); toastTimer = setTimeout(() => { UI.toast = null; render(); }, 2600); }
function go(view, extra = {}) {
  Object.assign(UI, { view, err: '', pin: '', pinBad: false, sheet: null, confirm: null }, extra);
  try { history.pushState({ v: view }, ''); } catch (e) {}
  render(); window.scrollTo(0, 0);
}

function render() {
  const app = $('#app'); const v = UI.view; let html = '';
  const c = club();
  app.style.setProperty('--sport', (['member', 'admin', 'session', 'profiles', 'pin'].includes(v) && c) ? sportOf(c).c : (v === 'shared' && UI.shared ? sportOf(UI.shared).c : '#FF5A1F'));
  try {
    if (v === 'welcome') html = vWelcome();
    else if (v === 'adminLogin') html = vAdminLogin();
    else if (v === 'forgot') html = vForgot();
    else if (v === 'register') html = vRegister();
    else if (v === 'clubs') html = vClubs();
    else if (v === 'profiles') html = vProfiles();
    else if (v === 'pin') html = vPin();
    else if (v === 'member') html = vMember();
    else if (v === 'admin') html = vAdmin();
    else if (v === 'session') html = vSession();
    else if (v === 'shared') html = vShared();
    else if (v === 'legal') html = vLegal();
    else html = vWelcome();
  } catch (e) { console.error(e); html = `<div class="card stack"><b>Có lỗi khi hiển thị.</b><p class="tiny muted">${esc(e.message)}</p><button class="btn" data-act="go" data-v="welcome">Về màn hình đầu</button></div>`; }
  app.className = (v === 'member' || v === 'admin') ? '' : 'bare';
  app.innerHTML = html
    + (UI.sheet ? `<div class="scrim" data-act="closeSheet"><div class="sheet" data-stop="1" role="dialog" aria-modal="true"><div class="grip"></div>${UI.sheet()}</div></div>` : '')
    + (UI.toast ? `<div class="toast" role="status">${esc(UI.toast)}</div>` : '');
  const af = app.querySelector('[autofocus]'); if (af && !('ontouchstart' in window)) af.focus();
}

/* ---------- khối dùng chung ---------- */
const backBtn = (v = 'welcome', act = 'go') => `<div class="row"><button class="x" data-act="${act}" data-v="${v}" aria-label="Quay lại">←</button></div>`;
const secH = (t, right = '') => `<div class="sec-h"><h2>${t}</h2>${right}</div>`;
const empty = (em, t) => `<div class="empty"><span class="em">${em}</span><span>${t}</span></div>`;
const sportChip = s => `<span class="pill sport">${s.ic} ${esc(s.name)}</span>`;

function sessCard(c, s, act = 'openSession') {
  const d = parseDay(s.date), sp = sportOf(c);
  const vt = voteOf(c, s);
  const st = s.status === 'settled' ? '<span class="pill ok">Đã chốt</span>' : s.status === 'cancelled' ? '<span class="pill bad">Đã hủy</span>' : (s.date < dayKey() ? '<span class="pill warn">Chờ chốt</span>' : '<span class="pill sky">Sắp diễn ra</span>');
  const who = s.status === 'settled' ? `${sessHeads(s)} người · ${vnd(sessCost(s))}` : `✅ ${vt.going.length}${vt.max ? '/' + vt.max : ''} đi${vt.wait.length ? ` · ⏳ ${vt.wait.length} dự bị` : ''} · ❌ ${vt.no.length} không${s.attendees.length ? ` · ${s.attendees.length} điểm danh` : ''}`;
  return `<button class="sess ${s.status === 'settled' ? 'done' : ''} ${s.status === 'cancelled' ? 'cancel' : ''}" data-act="${act}" data-sid="${s.id}">
    <span class="date"><span class="w">${WD[d.getDay()]}</span><span class="d">${pad2(d.getDate())}</span><span class="m">Th${d.getMonth() + 1}</span></span>
    <span class="tx"><span class="row between"><b class="ellip">${sp.ic} ${cap1(sp.unit)} ${s.time || ''}</b>${st}</span>
      <span class="tiny muted b ellip">📍 ${esc(s.venue || 'Chưa có địa điểm')}</span>
      <span class="tiny faint b">${who}${relDay(s.date) && s.status === 'open' ? ' · ' + relDay(s.date) : ''}</span></span></button>`;
}
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;

function qrBlock({ bin, acct, holder, amount, note, alt }) {
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

/* ---------- welcome ---------- */
function vWelcome() {
  const c = club(); const n = Object.keys(STORE.clubs).length;
  const hasReal = Object.values(STORE.clubs).some(x => !x.demo);
  return `<section class="hero">
    <span class="speed"><span>Miễn phí · không quảng cáo</span></span>
    <div class="brand" style="margin-top:14px">Sport<br><b>Share</b></div>
    <p class="tag">Quản lý đội nhóm thể thao: lịch tập, điểm danh, chia tiền sân, công nợ và quỹ hội. Chuyển khoản nhanh bằng VietQR.</p>
    <div class="sportstrip" aria-hidden="true">${Object.values(SPORTS).slice(0, 8).map(s => `<span>${s.ic}</span>`).join('')}</div>
  </section>
  <div class="stack">
    <a class="guide" href="../huong-dan-su-dung.pdf?v=2" target="_blank" rel="noopener"><span class="gi" aria-hidden="true">📘</span><span class="grow"><span class="gt">Hướng dẫn sử dụng</span><span class="gs">Đọc trước khi dùng · PDF có hình minh họa</span></span><span class="go"><span class="gol">Mở PDF </span>↗</span></a>
    <button class="choice" data-act="toMembers"><span class="ic" style="background:var(--sky-soft)">🏃</span><span><b>Hội viên vào xem</b><span class="tiny muted b">${c ? 'Hội: ' + esc(c.name) : 'Chọn tên mình và nhập mã PIN 4 số'}</span></span></button>
    <button class="choice" data-act="go" data-v="adminLogin"><span class="ic" style="background:var(--ok-soft)">🛡️</span><span><b>Quản trị viên đăng nhập</b><span class="tiny muted b">Tạo buổi, điểm danh, chia tiền, thu công nợ</span></span></button>
    <button class="choice" data-act="startReg"><span class="ic" style="background:color-mix(in srgb,var(--brand) 16%,var(--surface))">⚡</span><span><b>Lập hội mới</b><span class="tiny muted b">Chọn môn thể thao · thêm hội viên · mỗi người một mã PIN</span></span></button>
  </div>
  ${hasReal ? '' : `<div class="demo">Muốn xem thử? <button class="link" data-act="demo">Mở hội mẫu</button><br>Quản trị: <b>demo</b> / <b>123456</b> · PIN quản trị <b>0000</b> · Minh Quân: PIN <b>1111</b> · Thu Lan: PIN <b>2222</b></div>`}
  <div class="stack" style="gap:8px"><p class="tiny muted center b">Dùng máy mới? Khôi phục dữ liệu hội từ file sao lưu:</p>${restoreBlock(false)}</div>
  <p class="foot">${n ? `Máy này đang lưu ${n} hội. ` : ''}Dữ liệu chỉ nằm trong trình duyệt của máy này. <button class="link" data-act="openLegal">Chính sách &amp; Điều khoản</button> · <a class="link" href="../">Giới thiệu Sport Share</a></p>`;
}
function restoreBlock(withExport) {
  return `<div class="row wrap" style="justify-content:${withExport ? 'flex-start' : 'center'}">${withExport ? '<button class="btn sm ok" data-act="exportData">⬇️ Tải file sao lưu</button>' : ''}<label class="btn sm ghost" for="importFile" style="cursor:pointer">⬆️ Khôi phục từ file</label><input type="file" id="importFile" accept="application/json,.json" hidden></div>
  ${UI.confirm === 'import' && UI.importData ? `<div class="note warn stack" style="gap:8px">File có hội <b>${esc(UI.importData.names)}</b>. Hội trùng trên máy này sẽ bị thay bằng bản trong file.<div class="row"><button class="btn sm ok" data-act="doImport">Khôi phục</button><button class="btn sm ghost" data-act="cancelConfirm">Hủy</button></div></div>` : ''}`;
}

/* ---------- quản trị đăng nhập ---------- */
function vAdminLogin() {
  return `${backBtn()}
  <div class="stack" style="gap:4px"><div class="eyebrow">Khu vực quản trị</div><h1 class="h1 disp">Đăng nhập</h1><p class="muted b">Quản trị viên quản lý buổi tập, hội viên và tiền quỹ.</p></div>
  <form class="card stack" data-form="adminLogin" autocomplete="on">
    <div class="field"><label for="al-login">Số điện thoại hoặc email</label><input class="input" id="al-login" name="login" autocomplete="username" autofocus></div>
    <div class="field"><label for="al-pass">Mật khẩu</label><input class="input" id="al-pass" name="pass" type="password" autocomplete="current-password"></div>
    ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}
    <button class="btn block" type="submit">Đăng nhập</button>
    <div class="row between wrap"><button type="button" class="link tiny" data-act="go" data-v="forgot">Quên mật khẩu?</button><button type="button" class="link tiny" data-act="startReg">Lập hội mới</button></div>
  </form>
  <section class="card stack flat"><p class="tiny muted b">Hội lập trên máy khác? Dữ liệu nằm riêng trên từng máy. Trên máy cũ vào <b>Cài đặt → Tải file sao lưu</b>, rồi khôi phục ở đây.</p>${restoreBlock(false)}</section>
  ${donateBlock()}`;
}
function vForgot() {
  const locked = UI.forgotLock && Date.now() < UI.forgotLock;
  return `${backBtn('adminLogin')}
  <div class="stack" style="gap:4px"><div class="eyebrow">Quản trị viên</div><h1 class="h1 disp">Đặt lại mật khẩu</h1><p class="muted b">Dùng mã PIN quản trị (4 số) để đặt mật khẩu mới.</p></div>
  <form class="card stack" data-form="forgot">
    <div class="field"><label for="fg-login">Số điện thoại hoặc email</label><input class="input" id="fg-login" name="login" autocomplete="username" autofocus></div>
    <div class="field"><label for="fg-pin">Mã PIN quản trị</label><input class="input" id="fg-pin" name="apin" inputmode="numeric" maxlength="4"></div>
    <div class="field"><label for="fg-pass">Mật khẩu mới (ít nhất 6 ký tự)</label><input class="input" id="fg-pass" name="pass" type="password" autocomplete="new-password"></div>
    ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}
    <button class="btn block" type="submit" ${locked ? 'disabled' : ''}>${locked ? 'Thử lại sau 1 phút' : 'Đặt mật khẩu mới'}</button>
    <p class="tiny muted b">Quên cả mã PIN quản trị? Ứng dụng không có máy chủ nên không lấy lại được. Hãy khôi phục từ file sao lưu.</p>
  </form>`;
}

/* ---------- lập hội: B1 môn thể thao → B2 thông tin hội → B3 quản trị viên ---------- */
function vRegister() {
  const r = UI.reg; const steps = `<div class="row" style="gap:6px">${[1, 2, 3].map(i => `<span style="flex:1;height:6px;border-radius:6px;background:${i <= r.step ? 'var(--brand)' : 'var(--line)'};transform:skewX(-20deg)"></span>`).join('')}</div>`;
  if (r.step === 1) return `${backBtn()}
  ${steps}
  <div class="stack" style="gap:4px"><div class="eyebrow">Bước 1/3 · Môn thể thao</div><h1 class="h1 disp">Hội chơi môn gì?</h1><p class="muted b">Môn thể thao quyết định các khoản chi gợi ý, cách chia đội và biểu tượng của hội.</p></div>
  <div class="sports" role="radiogroup" aria-label="Chọn môn thể thao">${Object.entries(SPORTS).map(([k, s]) => `<button type="button" class="sport ${r.sport === k ? 'on' : ''}" style="--c:${s.c}" role="radio" aria-checked="${r.sport === k}" data-act="regSport" data-k="${k}"><span class="em">${s.ic}</span>${esc(s.name)}</button>`).join('')}</div>
  ${r.sport === 'other' ? `<div class="field"><label for="r-sname">Tên môn thể thao</label><input class="input" id="r-sname" data-chg="regSportName" value="${esc(r.sportName || '')}" placeholder="VD: Cầu mây, Bi-a, Leo núi…"></div>` : ''}
  ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}
  <button class="btn block" data-act="regNext" ${r.sport ? '' : 'disabled'}>Tiếp tục →</button>`;
  const sp = SPORTS[r.sport] || SPORTS.other;
  if (r.step === 2) return `<div class="row"><button class="x" data-act="regBack" aria-label="Quay lại">←</button></div>
  ${steps}
  <div class="stack" style="gap:4px"><div class="eyebrow">Bước 2/3 · Thông tin hội</div><h1 class="h1 disp">${sp.ic} Đặt tên hội</h1></div>
  <form class="card stack" data-form="reg2">
    <div class="field"><label for="r-cname">Tên hội / đội / nhóm</label><input class="input" id="r-cname" name="name" placeholder="VD: CLB ${esc(r.sport === 'other' ? (r.sportName || 'Thể thao') : sp.name)} Sấm Sét" value="${esc(r.name || '')}" autofocus></div>
    <div class="field"><label for="r-venue">${sp.place} quen thuộc</label><input class="input" id="r-venue" name="venue" placeholder="VD: Nhà thi đấu Quận 7 · Sân 3" value="${esc(r.venue || '')}"></div>
    <div class="field"><span class="lbl">Lịch chơi cố định (không bắt buộc)</span><div class="chips">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label class="chip ${(r.days || []).includes(d) ? 'on' : ''}" style="cursor:pointer"><input type="checkbox" name="days" value="${d}" ${(r.days || []).includes(d) ? 'checked' : ''} hidden data-chg="checkChip">${WD[d]}</label>`).join('')}</div></div>
    <div class="field"><label for="r-time">Giờ bắt đầu</label><input class="input" id="r-time" name="time" type="time" value="${esc(r.time || '19:00')}"></div>
    ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}
    <button class="btn block" type="submit">Tiếp tục →</button>
  </form>`;
  return `<div class="row"><button class="x" data-act="regBack" aria-label="Quay lại">←</button></div>
  ${steps}
  <div class="stack" style="gap:4px"><div class="eyebrow">Bước 3/3 · Quản trị viên</div><h1 class="h1 disp">Tài khoản quản trị</h1><p class="muted b">Quản trị viên tạo buổi, điểm danh, chia tiền và quản lý hội viên.</p></div>
  <form class="card stack" data-form="reg3">
    <div class="field"><label for="r-aname">Tên hiển thị</label><input class="input" id="r-aname" name="name" placeholder="VD: Anh Sơn (Trưởng nhóm)" value="${esc(r.aname || '')}" autofocus></div>
    <div class="field"><label for="r-login">Số điện thoại hoặc email</label><input class="input" id="r-login" name="login" autocomplete="username" value="${esc(r.login || '')}"></div>
    <div class="field"><label for="r-pass">Mật khẩu (ít nhất 6 ký tự)</label><input class="input" id="r-pass" name="pass" type="password" autocomplete="new-password"></div>
    <div class="field"><label for="r-apin">Mã PIN quản trị (4 số)</label><input class="input" id="r-apin" name="apin" inputmode="numeric" maxlength="4" placeholder="Dùng để vào nhanh khu quản trị"></div>
    ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}
    <button class="btn block" type="submit">⚡ Lập hội</button>
    <p class="tiny muted b">Mật khẩu được băm (SHA-256) trước khi lưu trong trình duyệt của máy này.</p>
  </form>`;
}

/* ---------- chọn hội / hồ sơ / PIN ---------- */
function vClubs() {
  const list = Object.values(STORE.clubs).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return `${backBtn()}
  <div class="stack" style="gap:4px"><div class="eyebrow">Hội viên</div><h1 class="h1 disp">Chọn hội</h1></div>
  ${list.length ? `<div class="stack">${list.map(c => { const s = sportOf(c); return `<button class="choice" data-act="pickClub" data-id="${c.id}"><span class="ic" style="background:color-mix(in srgb,${s.c} 18%,var(--surface))">${s.ic}</span><span class="grow"><b class="ellip">${esc(c.name)}</b><span class="tiny muted b">${esc(s.name)} · ${activeMembers(c).length} hội viên${c.demo ? ' · Hội mẫu' : ''}</span></span></button>`; }).join('')}</div>`
    : `<section class="card stack">${empty('📭', 'Máy này chưa có hội nào.')}<p class="tiny muted b center">Nhờ quản trị viên gửi <b>link xem nhanh</b> của hội, hoặc khôi phục từ file sao lưu.</p><button class="btn block" data-act="startReg">⚡ Lập hội mới</button></section>`}`;
}
function vProfiles() {
  const c = club(); if (!c) return vClubs();
  const s = sportOf(c);
  return `${backBtn()}
  <div class="row"><span class="ava lg" style="--ac:color-mix(in srgb,${s.c} 18%,var(--surface))">${s.ic}</span><div class="grow"><div class="eyebrow">${esc(s.name)}${c.demo ? ' · Hội mẫu' : ''}</div><h1 class="h2 ellip">${esc(c.name)}</h1></div></div>
  <p class="muted b">Bạn là ai? Chạm vào tên của mình rồi nhập mã PIN.</p>
  <div class="profiles">
    ${activeMembers(c).map(m => `<button class="prof" data-act="pinFor" data-mid="${m.id}">${ava(m, 'lg')}<span class="n">${esc(m.name)}</span>${debtOf(c, m.id) ? `<span class="pill bad">Nợ ${vndShort(debtOf(c, m.id))}</span>` : '<span class="pill ok">Sạch nợ</span>'}</button>`).join('')}
    <button class="prof" data-act="pinFor" data-mid="__admin"><span class="ava lg" style="--ac:var(--navy);color:#fff">🛡️</span><span class="n">Quản trị viên</span><span class="pill">Mã PIN</span></button>
  </div>
  ${activeMembers(c).length ? '' : `<p class="note">Hội chưa có hội viên. Quản trị viên vào <b>Hội viên → Thêm hội viên</b> nhé.</p>`}
  ${c.demo ? '<div class="demo">PIN mẫu: Minh Quân <b>1111</b> · Thu Lan <b>2222</b> · Quản trị <b>0000</b></div>' : ''}
  <p class="tiny muted center">Không phải hội này? <button class="link" data-act="go" data-v="clubs">Đổi hội</button></p>`;
}
function vPin() {
  const c = club(); if (!c) return vClubs();
  const isA = UI.pinFor === '__admin'; const m = !isA && memberOf(c, UI.pinFor);
  if (!isA && !m) return vProfiles();
  const dots = [0, 1, 2, 3].map(i => `<i class="${i < UI.pin.length ? 'on' : ''}"></i>`).join('');
  return `${backBtn(UI.pinBack || 'profiles')}
  <div class="pinhead">${isA ? `<span class="ava lg" style="--ac:var(--navy);color:#fff">🛡️</span>` : ava(m, 'lg')}
    <h1 class="h2">${isA ? (UI.locked ? '🔒 Khu quản trị đã tự khóa' : 'Mã PIN quản trị') : 'Chào ' + esc(m.name) + '!'}</h1>
    <p class="muted b">${UI.pinBad ? '<span class="err">Mã chưa đúng, thử lại nhé!</span>' : 'Nhập mã PIN 4 số'}</p>
    <div class="dots ${UI.pinBad ? 'bad' : ''}" aria-label="Đã nhập ${UI.pin.length} trên 4 số">${dots}</div>
  </div>
  <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-act="pinKey" data-k="${n}">${n}</button>`).join('')}<span></span><button data-act="pinKey" data-k="0">0</button><button data-act="pinKey" data-k="del" aria-label="Xóa">⌫</button></div>
  <p class="tiny muted center">${isA ? 'Quên mã PIN? Đăng nhập bằng mật khẩu ở màn hình đầu.' : 'Quên mã PIN? Nhờ quản trị viên xem lại trong mục Hội viên.'}</p>`;
}

/* ---------- đầu trang trong app ---------- */
function appHead(c, { eyebrow, title, right, stats, crest }) {
  return `<header class="apphead"><div class="top"><span class="crest" aria-hidden="true">${crest || sportOf(c).ic}</span><div class="grow"><div class="s ellip">${eyebrow}</div><div class="t ellip">${title}</div></div>${right || ''}</div>
  ${stats ? `<div class="stats">${stats.map(([v, l, hot]) => `<div class="stat ${hot ? 'hot' : ''}"><b>${v}</b><span>${l}</span></div>`).join('')}</div>` : ''}</header>`;
}
function tabbar(tabs, cur, act) {
  return `<nav class="tabbar" aria-label="Điều hướng"><div class="in">${tabs.map(([k, i, t, badge]) => `<button class="tab ${cur === k ? 'on' : ''}" data-act="${act}" data-t="${k}" ${cur === k ? 'aria-current="page"' : ''}><span class="i">${i}</span>${t}${badge ? `<span class="badge">${badge}</span>` : ''}</button>`).join('')}</div></nav>`;
}

/* ================= HỘI VIÊN ================= */
const curMember = () => { const c = club(); return c && DEV.session && DEV.session.role === 'member' && memberOf(c, DEV.session.mid); };
function vMember() {
  const c = club(), m = curMember(); if (!c || !m) return vWelcome();
  const debt = debtOf(c, m.id);
  const head = appHead(c, { eyebrow: esc(c.name), title: esc(m.name), crest: esc(m.avatar), right: `<button class="hbtn" data-act="switchUser">⇄ Đổi</button>`, stats: [[attended(c, m.id), 'Buổi đã đi'], [streakOf(c, m.id) + '🔥', 'Chuỗi liên tiếp', true], [debt ? vndShort(debt) : '0đ', 'Còn nợ']] });
  let body = '';
  if (UI.tab === 'debt') body = vMDebt(c, m);
  else if (UI.tab === 'rank') body = vRank(c, m.id);
  else if (UI.tab === 'me') body = vMMe(c, m);
  else body = vMHome(c, m);
  const pend = upcoming(c).filter(s => !(s.rsvp || {})[m.id]).length;
  return head + body + tabbar([['home', '📅', 'Lịch', pend], ['debt', '💸', 'Công nợ', unpaidOf(c, m.id).length], ['rank', '🏆', 'Xếp hạng'], ['me', esc(m.avatar), 'Của tôi']], UI.tab, 'tab');
}
function rsvpBtns(s, mid, c = club()) {
  const r = (s.rsvp || {})[mid]; const vt = voteOf(c, s);
  const wait = vt.wait.includes(mid);
  return `<div class="stack" style="gap:6px"><div class="row" style="gap:8px"><button class="btn sm ${r === 'yes' ? 'ok' : 'ghost'}" style="flex:1" data-act="rsvp" data-sid="${s.id}" data-r="yes">${r === 'yes' ? '✅ Tôi đi' : 'Đi'}</button><button class="btn sm ${r === 'no' ? 'danger' : 'ghost'}" style="flex:1" data-act="rsvp" data-sid="${s.id}" data-r="no">${r === 'no' ? '❌ Tôi không đi' : 'Không đi'}</button></div>
    ${wait ? `<p class="tiny b warn-t">⏳ Đã đủ ${vt.max} chỗ, bạn đang ở danh sách dự bị số ${vt.wait.indexOf(mid) + 1}.</p>` : ''}</div>`;
}
/* danh sách vote dạng chip: Đi / Dự bị / Không đi / Chưa vote */
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
  ${up.length ? up.slice(0, 6).map(s => `<div class="stack" style="gap:8px">${sessCard(c, s, 'viewSession')}${rsvpBtns(s, m.id)}</div>`).join('') : `<section class="card">${empty('🗓️', 'Chưa có lịch mới. Quản trị viên sẽ tạo buổi sớm thôi!')}</section>`}
  ${last ? `${secH(`${cap1(sp.unit)} gần nhất`)}${sessCard(c, last, 'viewSession')}` : ''}`;
}
function vMDebt(c, m) {
  const un = unpaidOf(c, m.id).sort((a, b) => b.date.localeCompare(a.date)); const debt = debtOf(c, m.id);
  const paid = c.charges.filter(x => x.mid === m.id && x.paid).sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0)).slice(0, 15);
  return `<section class="card stack">
    ${secH('Cần thanh toán', `<b class="num" style="font-size:20px;color:${debt ? 'var(--bad)' : 'var(--ok)'}">${vnd(debt)}</b>`)}
    ${un.length ? `<div class="list">${un.map(x => `<div class="item"><span class="tx"><b>${esc(x.label)}</b><span class="tiny muted b">${kindLabel(x.kind)}</span></span><span class="amt">${vnd(x.amount)}</span></div>`).join('')}</div>` : empty('🎉', 'Không còn khoản nào cần trả.')}
  </section>
  ${debt ? (bankReady(c.bank) ? `<section class="card stack">${secH('Chuyển khoản VietQR')}
      ${qrBlock({ bin: c.bank.bin, acct: c.bank.acct, holder: c.bank.holder, amount: debt, note: transferNote(c, m.name) })}
      <button class="btn block navy" data-act="downloadPayQR" data-mid="${m.id}">⬇️ Tải mã QR về máy</button>
      <p class="tiny muted b">Sau khi chuyển khoản, quản trị viên sẽ xác nhận và gạch nợ cho bạn.</p></section>`
    : `<div class="note warn">Quản trị viên chưa nhập tài khoản nhận tiền nên chưa tạo được mã VietQR.</div>`) : ''}
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
function vMMe(c, m) {
  return `<section class="card stack" style="align-items:center;text-align:center">${ava(m, 'lg')}<h2 class="h2">${esc(m.name)}</h2><div class="row wrap" style="justify-content:center">${sportChip(sportOf(c))}<span class="pill"><span class="lv">${lvStars(m.level)}</span></span></div></section>
  <section class="card stack">${secH('Ảnh đại diện')}<div class="chips">${AVATARS.map(a => `<button class="chip ${m.avatar === a ? 'on' : ''}" style="font-size:22px;padding:0 10px" data-act="myAvatar" data-a="${a}">${a}</button>`).join('')}</div></section>
  <form class="card stack" data-form="myPin">${secH('Đổi mã PIN')}
    <div class="grid2"><div class="field"><label for="mp-old">PIN hiện tại</label><input class="input" id="mp-old" name="old" inputmode="numeric" maxlength="4"></div><div class="field"><label for="mp-new">PIN mới</label><input class="input" id="mp-new" name="pin" inputmode="numeric" maxlength="4"></div></div>
    ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}<button class="btn sm navy" type="submit">Lưu PIN mới</button></form>
  ${themeBlock()}
  <div class="stack"><button class="btn block ghost" data-act="switchUser">⇄ Đổi người dùng</button><button class="btn block ghost" data-act="logout">↩ Thoát về màn hình đầu</button></div>`;
}
function themeBlock() {
  return `<section class="card stack">${secH('Giao diện')}<div class="chips">${[['auto', '🌓 Theo máy'], ['light', '☀️ Sáng'], ['dark', '🌙 Tối']].map(([k, t]) => `<button class="chip ${(DEV.theme || 'auto') === k ? 'on' : ''}" data-act="theme" data-k="${k}">${t}</button>`).join('')}</div></section>`;
}

/* chi tiết buổi (hội viên xem) */
function sessionSheet(c, s, mid) {
  const sp = sportOf(c); const { shares, per, total } = sessShares(c, s);
  const att = s.attendees.map(id => memberOf(c, id)).filter(Boolean);
  return `<div class="row"><span class="ava lg" style="--ac:color-mix(in srgb,${sp.c} 18%,var(--surface))">${sp.ic}</span><div class="grow"><div class="eyebrow">${esc(cap1(sp.unit))} ${s.status === 'settled' ? '· đã chốt' : s.status === 'cancelled' ? '· đã hủy' : ''}</div><h2 class="h2">${fmtDateLong(s.date)}</h2><p class="muted b">⏰ ${esc(s.time || '')} · 📍 ${esc(s.venue || '')}</p></div></div>
  ${s.note ? `<div class="note">📝 ${esc(s.note)}</div>` : ''}
  ${mid && s.status === 'open' ? rsvpBtns(s, mid) : ''}
  ${s.status === 'settled' ? `<section class="card stack">${secH('Chi phí')}<div class="list">${s.costs.map(x => `<div class="item"><span class="tx"><b>${esc(x.label)}</b></span><span class="amt">${vnd(x.amount)}</span></div>`).join('')}<div class="item"><span class="tx"><b>Tổng · ${sessHeads(s)} người</b></span><span class="amt">${vnd(total)}</span></div></div>${per ? `<p class="b">Mỗi người: <span style="color:var(--brand)">${vnd(per)}</span></p>` : ''}${mid && shares[mid] ? `<div class="note">Phần của bạn: <b>${vnd(shares[mid])}</b></div>` : ''}</section>` : ''}
  <section class="card stack">${s.status === 'settled' ? `${secH(`Có mặt (${att.length})`)}<div class="chips">${att.map(m => `<span class="pill">${esc(m.avatar)} ${esc(m.name)}</span>`).join('') || '<span class="muted tiny b">Chưa có ai.</span>'}</div>` : `${secH('🗳️ Vote đi / không đi')}${voteLists(c, s)}`}${(s.guests || []).length ? `<p class="tiny muted b">+ ${s.guests.length} khách: ${s.guests.map(g => esc(g.name)).join(', ')}</p>` : ''}</section>
  ${s.teams ? teamsBlock(c, s) : ''}
  <button class="btn block ghost" data-act="closeSheet">Đóng</button>`;
}
function teamsBlock(c, s) {
  const sp = sportOf(c);
  return `<section class="card stack">${secH(s.teamsMode === 'pairs' ? 'Ghép cặp' : sp.split === 'groups' ? 'Chia nhóm' : 'Chia đội')}<div class="teams">${s.teams.map((t, i) => `<div class="team" style="--tc:${TEAM_COLORS[i % TEAM_COLORS.length]}"><h3>${s.teamsMode === 'pairs' ? 'Cặp ' + (i + 1) : (sp.split === 'groups' ? 'Nhóm ' + (i + 1) : TEAM_NAMES[i % TEAM_NAMES.length])}</h3>${t.map(id => { const m = memberOf(c, id); return m ? `<p><span class="nm">${esc(m.avatar)} ${esc(m.name)}</span><span class="lv">★${m.level || 0}</span></p>` : `<p><span class="nm">${esc(String(id).replace(/^g:/, '👤 '))}</span></p>`; }).join('')}</div>`).join('')}</div></section>`;
}

/* ================= QUẢN TRỊ VIÊN ================= */
function vAdmin() {
  const c = club(); if (!c || !isAdmin()) return vWelcome();
  const sp = sportOf(c);
  const head = appHead(c, { eyebrow: `Quản trị · ${esc(sp.name)}${c.demo ? ' · Hội mẫu' : ''}`, title: esc(c.name), right: `<button class="hbtn" data-act="toMemberView">🏃 Hội viên</button>`, stats: [[activeMembers(c).length, 'Hội viên'], [vndShort(totalDebt(c)), 'Chưa thu', true], [vndShort(fundBalance(c)), 'Quỹ hội']] });
  let body = '';
  if (UI.atab === 'sessions') body = vASessions(c);
  else if (UI.atab === 'money') body = vAMoney(c);
  else if (UI.atab === 'members') body = vAMembers(c);
  else if (UI.atab === 'settings') body = vASettings(c);
  else body = vAHome(c);
  const waiting = c.sessions.filter(s => s.status === 'open' && s.date < dayKey()).length;
  return head + body + tabbar([['home', '📊', 'Tổng quan'], ['sessions', '📅', cap1(sp.unit), waiting], ['money', '💰', 'Thu chi'], ['members', '👥', 'Hội viên'], ['settings', '⚙️', 'Cài đặt']], UI.atab, 'atab');
}
const isAdmin = () => DEV.session && DEV.session.role === 'admin' && DEV.session.cid === DEV.clubId;

function vAHome(c) {
  const sp = sportOf(c); const up = upcoming(c); const nx = up[0];
  const waiting = c.sessions.filter(s => s.status === 'open' && s.date < dayKey()).sort((a, b) => a.date.localeCompare(b.date));
  const debtors = activeMembers(c).map(m => ({ m, d: debtOf(c, m.id) })).filter(x => x.d > 0).sort((a, b) => b.d - a.d);
  const mk = monthKey(); const monthS = settledSessions(c).filter(s => s.date.startsWith(mk));
  const monthCost = monthS.reduce((a, s) => a + sessCost(s), 0);
  const { list } = rankList(c, 'month');
  const nM = activeMembers(c).length;
  const steps = [[nM >= 2, `👥 Thêm hội viên${nM ? ` (đã có ${nM})` : ''}`, 'memberSheet', '', '＋ Thêm'], [bankReady(c.bank), '🏦 Tài khoản nhận tiền VietQR', 'atab', 'settings', 'Nhập'], [c.sessions.length > 0, `📅 Tạo ${sp.unit} đầu tiên`, 'newSession', '', 'Tạo']];
  const showSetup = UI.fresh !== 'off' && !c.setupDone && (UI.fresh || steps.some(x => !x[0]));
  const fresh = showSetup ? `<section class="card hl stack"><div class="row"><span class="ava lg" style="--ac:var(--volt)">🎉</span><div class="grow"><b class="h3">Bắt đầu với hội của bạn</b><p class="tiny muted b">${steps.filter(x => x[0]).length}/3 bước · mỗi hội viên có một mã PIN 4 số để vào xem.</p></div></div>
    <div class="list">${steps.map(([done, t, act, tab, btn]) => `<div class="item"><span class="ava sm" style="--ac:${done ? 'var(--ok-soft)' : 'var(--surface-2)'}">${done ? '✅' : '⬜'}</span><b class="tx" style="${done ? 'opacity:.6' : ''}">${t}</b><button class="btn xs ${done ? 'ghost' : ''}" data-act="${act}" ${tab ? `data-t="${tab}"` : ''}>${done && act === 'memberSheet' ? '＋ Thêm nữa' : btn}</button></div>`).join('')}</div>
    <button class="btn sm ghost" data-act="dismissFresh">${steps.every(x => x[0]) ? 'Xong, ẩn khung này' : 'Ẩn khung này'}</button></section>` : '';
  return `${fresh}
  <div class="grid2">
    <button class="btn" data-act="newSession">＋ Tạo ${sp.unit}</button>
    <button class="btn volt" data-act="chargeSheet" data-k="monthly">💰 Thu quỹ tháng</button>
    <button class="btn navy sm" data-act="memberSheet">👥 Thêm hội viên</button>
    <button class="btn ghost sm" data-act="shareLink">🔗 Gửi link cho hội</button>
  </div>
  ${waiting.length ? `<div class="note warn">⏳ Có <b>${waiting.length}</b> ${sp.unit} đã qua nhưng chưa chốt tiền. <button class="link" data-act="openSession" data-sid="${waiting[0].id}">Chốt ngay</button></div>` : ''}
  ${secH(`${cap1(sp.unit)} tiếp theo`, `<button class="link tiny" data-act="atab" data-t="sessions">Xem tất cả</button>`)}
  ${nx ? sessCard(c, nx) : `<section class="card">${empty('🗓️', `Chưa có ${sp.unit} nào sắp tới.`)}<button class="btn block sm" data-act="newSession">＋ Tạo ${sp.unit}${c.schedule.days.length ? ' theo lịch cố định' : ''}</button></section>`}
  <div class="kpis">
    <div class="kpi"><div class="k">${cap1(sp.unit)} tháng ${fmtMonth(mk).slice(0, 2)}</div><div class="v">${monthS.length}</div><div class="d">Chi phí ${vnd(monthCost)}</div></div>
    <div class="kpi"><div class="k">Chưa thu</div><div class="v bad-t">${vndShort(totalDebt(c))}</div><div class="d">${debtors.length} người còn nợ</div></div>
    <div class="kpi"><div class="k">Quỹ hội</div><div class="v ok-t">${vndShort(fundBalance(c))}</div><div class="d">Thu chi trong tab Thu chi</div></div>
    <div class="kpi"><div class="k">Hội viên</div><div class="v">${activeMembers(c).length}</div><div class="d">TB ${monthS.length ? Math.round(monthS.reduce((a, s) => a + sessHeads(s), 0) / monthS.length) : 0} người/${sp.unit}</div></div>
  </div>
  <section class="card stack">${secH('Còn nợ nhiều nhất', `<button class="link tiny" data-act="atab" data-t="money">Thu chi</button>`)}
    ${debtors.length ? `<div class="list">${debtors.slice(0, 5).map(({ m, d }) => `<div class="item">${ava(m, 'sm')}<span class="tx"><b>${esc(m.name)}</b><span class="tiny muted b">${unpaidOf(c, m.id).length} khoản</span></span><span class="amt bad-t">${vnd(d)}</span><button class="btn xs ghost" data-act="debtSheet" data-mid="${m.id}">Thu</button></div>`).join('')}</div>` : empty('✅', 'Không ai nợ. Tuyệt vời!')}
  </section>
  <section class="card stack">${secH('Chăm chỉ tháng này')}
    ${list.filter(x => x.n).length ? `<div>${list.filter(x => x.n).slice(0, 5).map(({ m, n }, i) => `<div class="rank"><span class="no">${i + 1}</span>${ava(m, 'sm')}<b class="grow ellip">${esc(m.name)}</b><span class="pill sport">${n} ${sp.unit}</span></div>`).join('')}</div>` : empty('🏁', `Chưa có ${sp.unit} nào được chốt trong tháng.`)}
  </section>
  <section class="card stack" style="background:var(--navy);color:#fff;border:0">
    <div class="row"><span style="font-size:30px">🔗</span><div class="grow"><b>Gửi link xem nhanh cho hội viên</b><p class="tiny b" style="opacity:.75">Hội viên mở trên điện thoại của họ để xem lịch, số tiền phải trả và quét VietQR.</p></div></div>
    <button class="btn volt sm" data-act="shareLink">Tạo & chép link</button>
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
  ${list.length ? `<div class="stack">${list.slice(0, 60).map(s => sessCard(c, s)).join('')}</div>` : `<section class="card">${empty(sp.ic, `Chưa có ${sp.unit} nào ở đây.`)}</section>`}`;
}

function vSession() {
  const c = club(); if (!c || !isAdmin()) return vWelcome();
  const s = c.sessions.find(x => x.id === UI.sid); if (!s) return vAdmin();
  const sp = sportOf(c); const open = s.status === 'open';
  const { shares, per, total, surplus } = sessShares(c, s);
  const members = activeMembers(c).concat(c.members.filter(m => m.active === false && s.attendees.includes(m.id)));
  const rs = s.rsvp || {};
  const vt = voteOf(c, s);
  const order = m => (s.attendees.includes(m.id) ? 0 : rs[m.id] === 'yes' ? 1 : rs[m.id] === 'no' ? 3 : 2);
  const sorted = members.slice().sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name, 'vi'));
  const charges = c.charges.filter(x => x.ref === s.id);
  const st = s.status === 'settled' ? '<span class="pill ok">Đã chốt</span>' : s.status === 'cancelled' ? '<span class="pill bad">Đã hủy</span>' : '<span class="pill sky">Đang mở</span>';
  return `<div class="row between"><button class="x" data-act="backToAdmin" aria-label="Quay lại">←</button>${st}</div>
  <section class="card stack hl">
    <div class="row"><span class="ava lg" style="--ac:color-mix(in srgb,${sp.c} 18%,var(--surface))">${sp.ic}</span><div class="grow"><div class="eyebrow">${esc(cap1(sp.unit))}${relDay(s.date) ? ' · ' + relDay(s.date) : ''}</div><h1 class="h2">${fmtDateLong(s.date)}</h1><p class="muted b">⏰ ${esc(s.time || '--:--')} · 📍 ${esc(s.venue || 'Chưa có địa điểm')}</p></div></div>
    ${s.note ? `<div class="note">📝 ${esc(s.note)}</div>` : ''}
    <div class="row wrap">${open ? `<button class="btn xs ghost" data-act="editSession">✏️ Sửa thông tin</button>` : ''}<button class="btn xs ghost" data-act="copyAnnounce">📋 Chép thông báo</button></div>
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
    ${open ? `<form class="stack" data-form="costs" style="gap:8px">${(s.costs || []).map((x, i) => `<div class="costrow"><input class="input" name="l${i}" value="${esc(x.label)}" aria-label="Khoản chi ${i + 1}" data-chg="cost" data-i="${i}" data-f="label"><input class="input num" name="a${i}" inputmode="numeric" value="${x.amount ? Number(x.amount).toLocaleString('vi-VN') : ''}" placeholder="0" aria-label="Số tiền" data-chg="cost" data-i="${i}" data-f="amount"><button type="button" class="x" style="width:36px;height:36px;font-size:16px" data-act="delCost" data-i="${i}" aria-label="Xóa khoản">✕</button></div>`).join('')}</form>
      <div class="chips">${sp.costs.filter(l => !(s.costs || []).some(x => x.label === l)).map(l => `<button class="chip" data-act="addCost" data-l="${esc(l)}">＋ ${esc(l)}</button>`).join('')}<button class="chip" data-act="addCost" data-l="">＋ Khoản khác</button></div>
      <p class="tiny faint b">Gõ số tiền rồi bấm ra ngoài để lưu. Có thể gõ tắt: 240k, 1.2tr.</p>`
    : `<div class="list">${(s.costs || []).map(x => `<div class="item"><span class="tx"><b>${esc(x.label)}</b></span><span class="amt">${vnd(x.amount)}</span></div>`).join('')}</div>`}
    <div class="field"><label for="payer">Người ứng tiền trước</label><select class="input" id="payer" data-chg="payer" ${open ? '' : 'disabled'}><option value="">Quỹ hội / quản trị viên</option>${members.map(m => `<option value="${m.id}" ${s.payer === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
  </section>

  <section class="card stack">
    ${secH('Chia tiền')}
    ${open ? `<div class="chips"><button class="chip ${s.split !== 'custom' ? 'on' : ''}" data-act="splitMode" data-k="equal">⚖️ Chia đều</button><button class="chip ${s.split === 'custom' ? 'on' : ''}" data-act="splitMode" data-k="custom">✍️ Tự nhập từng người</button></div>` : ''}
    ${s.split === 'custom' && open ? `<div class="stack" style="gap:8px">${s.attendees.map(id => { const m = memberOf(c, id); return m ? `<div class="row">${ava(m, 'xs')}<b class="grow ellip">${esc(m.name)}</b><input class="input num" style="width:130px;min-height:40px" inputmode="numeric" value="${(s.custom || {})[id] ? Number(s.custom[id]).toLocaleString('vi-VN') : ''}" placeholder="0" data-chg="custom" data-mid="${id}" aria-label="Số tiền của ${esc(m.name)}"></div>` : ''; }).join('')}
      ${(s.guests || []).filter(g => g.host).map((g, i) => `<div class="row"><span class="ava xs">👤</span><b class="grow ellip">${esc(g.name)}</b><input class="input num" style="width:130px;min-height:40px" inputmode="numeric" value="${g.amount ? Number(g.amount).toLocaleString('vi-VN') : ''}" placeholder="0" data-chg="guestAmt" data-i="${s.guests.indexOf(g)}" aria-label="Số tiền của khách"></div>`).join('')}</div>` : ''}
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
    <div class="list">${charges.map(x => { const m = memberOf(c, x.mid); return `<div class="item">${ava(m, 'sm')}<span class="tx"><b>${esc(m ? m.name : '?')}</b><span class="tiny muted b">${x.paid ? 'Đã trả' + (x.paidAt ? ' · ' + fmtTs(x.paidAt) : '') : 'Chưa trả'}</span></span><span class="amt ${x.paid ? 'ok-t' : 'bad-t'}">${vnd(x.amount)}</span><button class="btn xs ${x.paid ? 'ghost' : 'ok'}" data-act="togglePaid" data-cid="${x.id}">${x.paid ? 'Hoàn tác' : 'Đã thu'}</button></div>`; }).join('')}</div>
    <div class="grid2"><button class="btn sm ghost" data-act="reopenSession">↺ Mở lại để sửa</button><button class="btn sm danger" data-act="delSession">🗑 Xóa ${sp.unit}</button></div></section>` : ''}
  ${s.status === 'cancelled' ? `<div class="grid2"><button class="btn sm ghost" data-act="reopenSession">↺ Mở lại</button><button class="btn sm danger" data-act="delSession">🗑 Xóa</button></div>` : ''}
  ${UI.confirm ? confirmBox() : ''}`;
}
/* khung vote cho quản trị: ghi nhận vote (kể cả vote nhận qua Zalo), chép lời mời và kết quả */
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
    <details data-k="votes" ${UI.voteOpen === false ? '' : 'open'}><summary class="b tiny" style="cursor:pointer;padding:4px 0">Ghi vote hộ hội viên (khi họ trả lời qua Zalo)</summary>
      <div class="list" style="margin-top:6px">${ids.map(id => { const m = memberOf(c, id); if (!m) return ''; const r = rs[id];
        return `<div class="item">${ava(m, 'sm')}<span class="tx"><b>${esc(m.name)}</b><span class="tiny b ${vt.wait.includes(id) ? 'warn-t' : r === 'yes' ? 'ok-t' : r === 'no' ? 'bad-t' : 'faint'}">${vt.wait.includes(id) ? '⏳ Dự bị ' + (vt.wait.indexOf(id) + 1) : r === 'yes' ? '✅ Đi' : r === 'no' ? '❌ Không đi' : 'Chưa vote'}</span></span>
          <button class="btn xs ${r === 'yes' ? 'ok' : 'ghost'}" data-act="adminVote" data-mid="${id}" data-r="yes" aria-label="${esc(m.name)} đi">✅</button><button class="btn xs ${r === 'no' ? 'danger' : 'ghost'}" data-act="adminVote" data-mid="${id}" data-r="no" aria-label="${esc(m.name)} không đi">❌</button></div>`; }).join('')}</div></details>
    <p class="tiny muted b">Hội viên vote trong link xem nhanh: app soạn sẵn tin để họ gửi vào nhóm, bạn ghi lại ở đây. ${vt.max ? 'Ai vote “Đi” trước được giữ chỗ trước.' : ''}</p>
  </section>`;
}
function bulkSheet() {
  return `<form class="stack" data-form="bulk"><h2 class="h2 disp">＋ Thêm nhiều người</h2>
    <div class="field"><label for="bk-names">Mỗi dòng một tên</label><textarea class="input" id="bk-names" name="names" rows="8" placeholder="Minh Quân\nThu Lan\nHoàng Nam" autofocus style="min-height:180px"></textarea></div>
    <p class="tiny muted b">Mỗi người được tạo mã PIN 4 số ngẫu nhiên, trình độ 3★. Sửa từng người sau trong tab Hội viên. Dán được danh sách chép từ Zalo hay Excel.</p>
    ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}
    <button class="btn block" type="submit">Thêm vào hội</button></form>`;
}
function confirmBox() {
  const t = { delSession: 'Xóa buổi này cùng toàn bộ công nợ đã tạo từ buổi?', reopenSession: 'Mở lại sẽ xóa các khoản công nợ của buổi này (kể cả khoản đã thu) để chốt lại. Tiếp tục?', cancelSession: 'Hủy buổi này? Hội viên sẽ thấy trạng thái Đã hủy.' }[UI.confirm] || 'Bạn chắc chứ?';
  return `<div class="note warn stack" style="gap:8px;position:sticky;bottom:12px;box-shadow:var(--shadow)"><b>${t}</b><div class="row"><button class="btn sm danger" data-act="doConfirm">Đồng ý</button><button class="btn sm ghost" data-act="cancelConfirm">Thôi</button></div></div>`;
}
function sessionFormSheet(c, s) {
  const sp = sportOf(c); const isNew = !s;
  s = s || { date: nextScheduledDay(c), time: c.schedule.time || '19:00', venue: c.schedule.venue || '', note: '' };
  return `<form class="stack" data-form="session">
    <h2 class="h2 disp">${isNew ? '＋ Tạo ' + sp.unit : 'Sửa thông tin'}</h2>
    <div class="grid2"><div class="field"><label for="s-date">Ngày</label><input class="input" id="s-date" name="date" type="date" value="${esc(s.date)}" required></div><div class="field"><label for="s-time">Giờ</label><input class="input" id="s-time" name="time" type="time" value="${esc(s.time)}"></div></div>
    <div class="field"><label for="s-venue">${sp.place}</label><input class="input" id="s-venue" name="venue" value="${esc(s.venue)}" placeholder="VD: Sân 3-4, nhà thi đấu…"></div>
    <div class="field"><label for="s-max">Số chỗ tối đa (không bắt buộc)</label><input class="input num" id="s-max" name="max" inputmode="numeric" value="${s.max ? esc(s.max) : ''}" placeholder="Để trống = không giới hạn. Vote quá số chỗ sẽ vào dự bị"></div>
    <div class="field"><label for="s-note">Ghi chú cho hội viên</label><textarea class="input" id="s-note" name="note" placeholder="VD: Mang áo trắng, có giao lưu…">${esc(s.note || '')}</textarea></div>
    ${isNew ? `<p class="tiny muted b">Chi phí gợi ý cho ${esc(sp.name)}: ${sp.costs.map(esc).join(', ')}. Bạn nhập số tiền sau trong màn hình buổi.</p>` : ''}
    ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}
    <button class="btn block" type="submit">${isNew ? 'Tạo ' + sp.unit : 'Lưu'}</button>
  </form>`;
}
function guestSheet(c, s) {
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
    const rows = c.members.map(m => ({ m, d: debtOf(c, m.id), n: unpaidOf(c, m.id).length })).filter(x => x.d > 0).sort((a, b) => b.d - a.d);
    body = `<section class="card stack">${secH('Tổng chưa thu', `<b class="num bad-t" style="font-size:20px">${vnd(totalDebt(c))}</b>`)}
      <div class="grid2"><button class="btn sm volt" data-act="chargeSheet" data-k="monthly">💰 Quỹ tháng</button><button class="btn sm navy" data-act="chargeSheet" data-k="other">＋ Khoản thu khác</button></div>
      ${rows.length ? `<div class="list">${rows.map(({ m, d, n }) => `<button class="item" data-act="debtSheet" data-mid="${m.id}">${ava(m, 'sm')}<span class="tx"><b>${esc(m.name)}</b><span class="tiny muted b">${n} khoản chưa trả</span></span><span class="amt bad-t">${vnd(d)}</span><span class="faint" style="font-size:22px">›</span></button>`).join('')}</div>` : empty('✅', 'Không ai nợ. Tuyệt vời!')}
      ${rows.length ? `<button class="btn sm ghost" data-act="copyAllReminders">📋 Chép danh sách nhắc nợ cả hội</button>` : ''}
    </section>`;
  }
  return chips + body;
}
function debtSheet(c, m) {
  const un = unpaidOf(c, m.id).sort((a, b) => a.date.localeCompare(b.date)); const d = debtOf(c, m.id);
  return `<div class="row">${ava(m, 'lg')}<div class="grow"><div class="eyebrow">Công nợ</div><h2 class="h2">${esc(m.name)}</h2><p class="b ${d ? 'bad-t' : 'ok-t'}">${d ? 'Còn nợ ' + vnd(d) : 'Đã trả đủ'}</p></div></div>
  ${un.length ? `<section class="card stack"><div class="list">${un.map(x => `<div class="item"><span class="tx"><b>${esc(x.label)}</b><span class="tiny muted b">${kindLabel(x.kind)}</span></span><span class="amt">${vnd(x.amount)}</span><button class="btn xs ok" data-act="togglePaid" data-cid="${x.id}">Đã thu</button><button class="copy" data-act="delCharge" data-cid="${x.id}" aria-label="Xóa khoản">✕</button></div>`).join('')}</div>
    <button class="btn block ok" data-act="payAll" data-mid="${m.id}">✅ Đã thu đủ ${vnd(d)}</button></section>
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
    ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}
    <button class="btn block" type="submit">Tạo khoản thu</button></form>`;
}
function fundSheet(type) {
  return `<form class="stack" data-form="fund" data-k="${type}"><h2 class="h2 disp">${type === 'in' ? '＋ Ghi thu quỹ' : '− Ghi chi quỹ'}</h2>
    <div class="field"><label for="f-label">Nội dung</label><input class="input" id="f-label" name="label" placeholder="${type === 'in' ? 'VD: Tài trợ, tiền thưởng giải…' : 'VD: Mua cầu, liên hoan, áo đấu…'}" required autofocus></div>
    <div class="grid2"><div class="field"><label for="f-amt">Số tiền</label><input class="input num" id="f-amt" name="amount" inputmode="numeric" placeholder="VD: 350k" required></div><div class="field"><label for="f-date">Ngày</label><input class="input" id="f-date" name="date" type="date" value="${dayKey()}"></div></div>
    ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}
    <button class="btn block ${type === 'in' ? 'ok' : ''}" type="submit">Lưu</button></form>`;
}

/* ---------- Hội viên (quản trị) ---------- */
function vAMembers(c) {
  const q = noTone(UI.q || '').toLowerCase();
  const list = c.members.filter(m => !q || noTone(m.name).toLowerCase().includes(q)).sort((a, b) => (a.active === false) - (b.active === false) || a.name.localeCompare(b.name, 'vi'));
  return `<div class="row"><input class="input grow" placeholder="🔎 Tìm hội viên…" value="${esc(UI.q || '')}" data-chg="search" aria-label="Tìm hội viên"><button class="btn" data-act="memberSheet">＋ Thêm</button></div>
  <button class="link tiny" style="align-self:flex-start" data-act="bulkSheet">＋ Thêm nhiều người cùng lúc (dán danh sách tên)</button>
  <section class="card stack">${secH(`${activeMembers(c).length} hội viên`, `<button class="link tiny" data-act="copyPins">📋 Chép danh sách PIN</button>`)}
    ${list.length ? `<div class="list">${list.map(m => `<button class="item" data-act="memberSheet" data-mid="${m.id}" style="${m.active === false ? 'opacity:.5' : ''}">${ava(m)}<span class="tx"><b>${esc(m.name)}${m.active === false ? ' · đã nghỉ' : ''}</b><span class="tiny muted b"><span class="lv">${lvStars(m.level)}</span> · ${attended(c, m.id)} ${sportOf(c).unit}${m.phone ? ' · ' + esc(m.phone) : ''}</span></span>${debtOf(c, m.id) ? `<span class="pill bad">${vndShort(debtOf(c, m.id))}</span>` : '<span class="pill ok">0đ</span>'}</button>`).join('')}</div>` : empty('👥', 'Chưa có hội viên. Bấm ＋ Thêm để bắt đầu.')}
  </section>`;
}
function memberSheet(c, m) {
  const isNew = !m; m = m || { name: '', phone: '', avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)], level: 3, pin: randPin(), active: true };
  const sel = UI.editAvatar || m.avatar;
  return `<form class="stack" data-form="member" data-mid="${isNew ? '' : m.id}">
    <h2 class="h2 disp">${isNew ? '＋ Thêm hội viên' : 'Hồ sơ hội viên'}</h2>
    <div class="field"><label for="m-name">Tên</label><input class="input" id="m-name" name="name" value="${esc(m.name)}" placeholder="VD: Minh Quân" required ${isNew ? 'autofocus' : ''}></div>
    <div class="grid2"><div class="field"><label for="m-phone">Điện thoại (không bắt buộc)</label><input class="input" id="m-phone" name="phone" inputmode="tel" value="${esc(m.phone || '')}"></div><div class="field"><label for="m-pin">Mã PIN 4 số</label><input class="input num" id="m-pin" name="pin" inputmode="numeric" maxlength="4" value="${esc(m.pin)}"></div></div>
    <div class="field"><span class="lbl">Trình độ (dùng khi chia đội cân bằng)</span><div class="chips">${[1, 2, 3, 4, 5].map(l => `<label class="chip ${Number(m.level) === l ? 'on' : ''}" style="cursor:pointer"><input type="radio" name="level" value="${l}" ${Number(m.level) === l ? 'checked' : ''} hidden data-chg="radioChip">${'★'.repeat(l)}</label>`).join('')}</div></div>
    <div class="field"><span class="lbl">Ảnh đại diện</span><input type="hidden" name="avatar" value="${esc(sel)}"><div class="chips">${AVATARS.map(a => `<button type="button" class="chip ${sel === a ? 'on' : ''}" style="font-size:20px;padding:0 9px" data-act="pickAvatar" data-a="${a}">${a}</button>`).join('')}</div></div>
    ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}
    ${isNew ? `<div class="grid2"><button class="btn" type="submit" name="next" value="1">＋ Thêm & nhập tiếp</button><button class="btn navy" type="submit">Thêm & đóng</button></div>
      <button type="button" class="link tiny" style="align-self:center" data-act="bulkSheet">Thêm nhiều người cùng lúc</button>` : `<button class="btn block" type="submit">Lưu thay đổi</button>`}
    ${isNew ? '' : `<div class="grid2"><button type="button" class="btn sm ghost" data-act="toggleActive" data-mid="${m.id}">${m.active === false ? '↺ Cho quay lại' : '⏸ Cho nghỉ'}</button><button type="button" class="btn sm danger" data-act="delMember" data-mid="${m.id}">🗑 Xóa hẳn</button></div>
      ${UI.confirm === 'delMember' ? `<div class="note warn stack" style="gap:8px">Xóa ${esc(m.name)} và toàn bộ công nợ của người này?<div class="row"><button type="button" class="btn sm danger" data-act="doDelMember" data-mid="${m.id}">Xóa</button><button type="button" class="btn sm ghost" data-act="cancelConfirm">Thôi</button></div></div>` : ''}
      <p class="tiny muted b">Tham gia ${attended(c, m.id)} ${sportOf(c).unit} · đã trả ${vnd(paidTotal(c, m.id))} · còn nợ ${vnd(debtOf(c, m.id))}</p>`}
  </form>`;
}

/* ---------- Cài đặt ---------- */
function vASettings(c) {
  const sp = sportOf(c);
  return `<form class="card stack" data-form="clubInfo">${secH('Thông tin hội')}
    <div class="field"><label for="ci-name">Tên hội</label><input class="input" id="ci-name" name="name" value="${esc(c.name)}" required></div>
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

  <section class="card stack">${secH('🔗 Link xem nhanh cho hội viên')}
    <p class="tiny muted b">Link chứa bản chụp lịch sắp tới, bảng xếp hạng và công nợ hiện tại (không chứa mã PIN, mật khẩu). Khi số liệu thay đổi, hãy tạo link mới và gửi lại vào nhóm.</p>
    <div class="grid2"><button class="btn sm volt" data-act="shareLink">Tạo & chép link</button><button class="btn sm ghost" data-act="previewShared">👁 Xem thử</button></div></section>

  <form class="card stack" data-form="adminAcct">${secH('🛡️ Tài khoản quản trị')}
    <div class="field"><label for="aa-name">Tên hiển thị</label><input class="input" id="aa-name" name="name" value="${esc(c.admin.name || '')}"></div>
    <div class="field"><label for="aa-login">Số điện thoại hoặc email đăng nhập</label><input class="input" id="aa-login" name="login" value="${esc(c.admin.login || '')}" autocomplete="username"></div>
    <div class="grid2"><div class="field"><label for="aa-pin">PIN quản trị</label><input class="input num" id="aa-pin" name="apin" inputmode="numeric" maxlength="4" value="${esc(c.admin.pin || '')}"></div><div class="field"><label for="aa-pass">Mật khẩu mới</label><input class="input" id="aa-pass" name="pass" type="password" autocomplete="new-password" placeholder="Để trống nếu giữ nguyên"></div></div>
    ${UI.err ? `<p class="err">${esc(UI.err)}</p>` : ''}
    <button class="btn sm navy" type="submit">Lưu tài khoản quản trị</button></form>

  <section class="card stack">${secH('💾 Sao lưu dữ liệu')}<p class="tiny muted b">Dữ liệu chỉ nằm trên máy này. Tải file sao lưu định kỳ để chuyển sang máy khác hoặc phòng khi xóa lịch sử trình duyệt.</p>${restoreBlock(true)}</section>
  ${themeBlock()}
  ${donateBlock()}
  <div class="stack">
    <button class="btn block ghost" data-act="toMemberView">🏃 Chuyển sang màn hội viên</button>
    <button class="btn block ghost" data-act="lockAdmin">🔒 Khóa khu quản trị</button>
    <button class="btn block ghost" data-act="logout">↩ Đăng xuất</button>
    <button class="btn block danger" data-act="askDelClub">🗑 Xóa hội này khỏi máy</button>
    ${UI.confirm === 'delClub' ? `<div class="note warn stack" style="gap:8px"><b>Xóa vĩnh viễn hội “${esc(c.name)}” khỏi máy này?</b> Nên tải file sao lưu trước.<div class="row"><button class="btn sm danger" data-act="doDelClub">Xóa hội</button><button class="btn sm ghost" data-act="cancelConfirm">Thôi</button></div></div>` : ''}
  </div>
  <p class="foot">Sport Share v${APP.ver} · <button class="link" data-act="openLegal">Chính sách &amp; Điều khoản</button></p>`;
}

/* ---------- link xem nhanh (chỉ đọc) ---------- */
/* buổi sắp tới trong link: bản mới là object có danh sách vote, bản cũ là mảng [ngày, giờ, sân, số người] */
const sharedUps = d => (d.up || []).map(u => Array.isArray(u)
  ? { date: u[0], time: u[1], venue: u[2], yes: [], no: [], max: 0 }
  : { date: u.d, time: u.t, venue: u.v, yes: u.y || [], no: u.n || [], max: u.mx || 0 });
function vShared() {
  const d = UI.shared; if (!d) return vWelcome();
  const sp = sportOf(d); const m = d.m.find(x => x[0] === UI.sharedMid);
  const head = `<header class="apphead" style="margin-bottom:0"><div class="top"><span class="crest">${sp.ic}</span><div class="grow"><div class="s">${esc(sp.name)} · Bản xem nhanh</div><div class="t ellip">${esc(d.n)}</div></div>${UI.sharedPreview ? '<button class="hbtn" data-act="closePreview">✕ Đóng</button>' : ''}</div></header>`;
  const ups = sharedUps(d);
  const nm = id => (d.m.find(y => y[0] === id) || [id, '?'])[1];
  const sessBox = (u, i, mine) => { const dd = parseDay(u.date); const going = u.max ? u.yes.slice(0, u.max) : u.yes, wait = u.max ? u.yes.slice(u.max) : [];
    const myV = mine ? (u.yes.includes(mine) ? (wait.includes(mine) ? 'wait' : 'yes') : u.no.includes(mine) ? 'no' : '') : '';
    return `<div class="stack" style="gap:8px"><div class="sess"><span class="date"><span class="w">${WD[dd.getDay()]}</span><span class="d">${pad2(dd.getDate())}</span><span class="m">Th${dd.getMonth() + 1}</span></span><span class="tx"><b>${sp.ic} ${cap1(sp.unit)} ${esc(u.time)}</b>${u.venue ? `<span class="tiny muted b ellip">📍 ${esc(u.venue)}</span>` : ''}<span class="tiny faint b">✅ ${going.length}${u.max ? '/' + u.max : ''} đi${wait.length ? ` · ⏳ ${wait.length} dự bị` : ''} · ❌ ${u.no.length} không${relDay(u.date) ? ' · ' + relDay(u.date) : ''}</span></span></div>
      ${going.length ? `<p class="tiny muted b">Đi: ${going.map(id => esc(nm(id))).join(', ')}${wait.length ? ` · Dự bị: ${wait.map(id => esc(nm(id))).join(', ')}` : ''}</p>` : ''}
      ${mine ? `${myV ? `<p class="tiny b ${myV === 'no' ? 'bad-t' : myV === 'wait' ? 'warn-t' : 'ok-t'}">Quản trị đã ghi: ${myV === 'yes' ? '✅ bạn đi' : myV === 'wait' ? '⏳ bạn ở danh sách dự bị' : '❌ bạn không đi'}</p>` : ''}
        <div class="row" style="gap:8px"><button class="btn sm ok" style="flex:1" data-act="sharedVote" data-i="${i}" data-r="yes">✅ Tôi đi</button><button class="btn sm danger" style="flex:1" data-act="sharedVote" data-i="${i}" data-r="no">❌ Tôi không đi</button></div>` : ''}</div>`; };
  const upHtml = ups.map((u, i) => sessBox(u, i, null)).join('');
  if (!m) return `${head}
  <div class="note">Cập nhật lúc <b>${fmtTs(d.t)}</b>. Đây là bản chụp quản trị viên gửi, không tự cập nhật.</div>
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
    ${h('1. Sport Share lưu những gì?')}<p>Tên hội, môn thể thao, tài khoản quản trị (tên hiển thị, số điện thoại hoặc email, mật khẩu đã băm SHA-256, mã PIN quản trị), danh sách hội viên (tên, số điện thoại nếu có, ảnh đại diện biểu tượng, trình độ, mã PIN), lịch và điểm danh các buổi, chi phí, công nợ, quỹ hội và thông tin tài khoản ngân hàng nhận tiền.</p>
    ${h('2. Dữ liệu nằm ở đâu?')}<p>Toàn bộ dữ liệu chỉ nằm <b>trong trình duyệt của máy đang dùng</b>. Sport Share <b>không có máy chủ</b>, không gửi dữ liệu đi đâu, không bán hay chia sẻ dữ liệu.</p>
    ${h('3. Link xem nhanh')}<p>Khi quản trị viên tạo link xem nhanh, bản chụp gồm tên hội, tên và biểu tượng hội viên, lịch sắp tới, bảng xếp hạng, công nợ và tài khoản nhận tiền được mã hóa ngay trong đường link. Ai có link đều xem được nội dung này, vì vậy chỉ gửi link trong nhóm của hội.</p>
    ${h('4. Không quảng cáo, không theo dõi')}<p>Không quảng cáo, không cookie theo dõi, không công cụ phân tích. Font chữ nhúng sẵn, mã QR tạo ngay trên máy.</p>
    ${h('5. Thanh toán và ủng hộ')}<p>Chuyển khoản diễn ra trong ứng dụng ngân hàng của bạn. Sport Share không nhận, không giữ và không lưu thông tin thanh toán nào.</p>
  </article>
  <article class="card stack" style="font-weight:500">
    <h1 class="h2 disp">Điều khoản sử dụng</h1>
    ${h('1. Miễn phí, nguyên trạng')}<p>Sport Share được cung cấp miễn phí, “nguyên trạng”. Ứng dụng giúp ghi sổ lịch chơi, chia tiền và công nợ; các khoản tiền là thỏa thuận riêng giữa các thành viên trong hội.</p>
    ${h('2. Trách nhiệm của quản trị viên')}<p>Quản trị viên giữ mật khẩu, mã PIN, kiểm tra số liệu trước khi thông báo và tự sao lưu dữ liệu định kỳ.</p>
    ${h('3. Ủng hộ')}<p>Mọi sự ủng hộ là hoàn toàn tự nguyện để duy trì và phát triển ứng dụng miễn phí, không đi kèm nghĩa vụ hay dịch vụ thương mại. Ủng hộ hay không, mọi người dùng đều có đầy đủ tính năng như nhau.</p>
    ${h('4. Giấy phép')}<p>Font Be Vietnam Pro dùng theo SIL Open Font License 1.1. Thư viện tạo mã QR qrcode-generator (Kazuhiko Arase) theo giấy phép MIT. “QR Code” là nhãn hiệu của DENSO WAVE. VietQR là nhãn hiệu của Napas.</p>
  </article>
  <button class="btn block ghost" data-act="closeLegal">← Quay lại</button>`;
}
