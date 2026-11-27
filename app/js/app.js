/* Sport Share — hành động, biểu mẫu, điều hướng, đăng nhập, khởi động. */
'use strict';

/* ---------- tiện ích ---------- */
const curSession = () => { const c = club(); return c && c.sessions.find(s => s.id === UI.sid); };
const later = fn => setTimeout(fn, 0);
const appBase = () => location.href.split('#')[0].split('?')[0];
const shareBase = appBase;
async function copyText(t, msg = 'Đã chép!') {
  try { await navigator.clipboard.writeText(t); toast(msg); return; } catch (e) {}
  const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast(msg); } catch (e) { toast('Không chép được, hãy chép thủ công.'); }
  ta.remove();
}
function applyTheme() { const t = DEV.theme || 'auto'; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
function sheet(fn) { UI.err = ''; UI.sheet = fn; render(); }
function closeSheet() { UI.sheet = null; UI.editAvatar = null; UI.err = ''; if (UI.confirm === 'delMember') UI.confirm = null; render(); }
function openClub(id, tab) {
  const c = clubById(id); if (!c) return go('home');
  DEV.clubId = id; persistLocal();
  const extra = canAdmin(c) ? { atab: tab || 'home' } : { tab: tab && ['home', 'debt', 'rank', 'info'].includes(tab) ? tab : 'home' };
  go('club', extra);
}
const goHomeOrWelcome = () => go(ME ? 'home' : 'welcome');
function waitClub(id, then, ms = 15000) { // chờ hội mới xuất hiện từ Firestore rồi mở
  const t0 = Date.now();
  const tick = () => { if (CL[id]) return then(); if (Date.now() - t0 > ms) { toast('Đã lưu. Hội sẽ hiện khi có mạng ổn định.'); return go('home'); } setTimeout(tick, 300); };
  tick();
}
function authMsg(e) {
  const c = (e && e.code) || '';
  return ({
    'auth/invalid-email': 'Email không hợp lệ.',
    'auth/missing-password': 'Nhập mật khẩu.',
    'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
    'auth/email-already-in-use': 'Email này đã có tài khoản. Hãy đăng nhập (hoặc dùng Quên mật khẩu).',
    'auth/invalid-credential': 'Email hoặc mật khẩu chưa đúng.',
    'auth/wrong-password': 'Email hoặc mật khẩu chưa đúng.',
    'auth/user-not-found': 'Chưa có tài khoản với email này.',
    'auth/too-many-requests': 'Thử sai nhiều lần. Đợi một lúc rồi thử lại.',
    'auth/network-request-failed': 'Không có mạng. Kiểm tra kết nối rồi thử lại.',
    'auth/popup-blocked': 'Trình duyệt chặn cửa sổ đăng nhập Google. Cho phép cửa sổ bật lên rồi thử lại, hoặc đăng nhập bằng email.',
    'auth/unauthorized-domain': 'Tên miền này chưa được phép đăng nhập (Firebase → Authentication → Settings → Authorized domains).',
    'auth/operation-not-allowed': 'Cách đăng nhập này chưa được bật trong Firebase.',
    'auth/web-storage-unsupported': 'Trình duyệt đang chặn lưu dữ liệu. Tắt chế độ ẩn danh hoặc mở bằng Safari/Chrome.',
  })[c] || ('Không đăng nhập được' + (c ? ` (${c})` : '') + '. Thử lại hoặc dùng cách đăng nhập khác.');
}

/* ---------- văn bản thông báo / nhắc nợ ---------- */
function bankLine(c) { return bankReady(c.bank) ? `🏦 ${bankName(c.bank.bin)} · ${c.bank.acct}${c.bank.holder ? ' · ' + c.bank.holder : ''}` : ''; }
function voteText(c, s) {
  const vt = voteOf(c, s), n = id => (memberOf(c, id) || {}).name || '?';
  const L = [`✅ Đi (${vt.going.length}${vt.max ? '/' + vt.max : ''}): ${vt.going.map(n).join(', ') || 'chưa có ai'}`];
  if (vt.wait.length) L.push(`⏳ Dự bị (${vt.wait.length}): ${vt.wait.map(n).join(', ')}`);
  L.push(`❌ Không đi (${vt.no.length}): ${vt.no.map(n).join(', ') || '—'}`);
  if (vt.none.length) L.push(`❔ Chưa vote (${vt.none.length}): ${vt.none.map(n).join(', ')}`);
  return L;
}
function announceText(c, s) {
  const sp = sportOf(c); const { per, total, shares } = sessShares(c, s); const L = [];
  L.push(`${sp.ic} ${c.name.toUpperCase()}`);
  L.push(`📅 ${cap1(sp.unit)} ${fmtDateLong(s.date)}${s.time ? ' · ' + s.time : ''}`);
  if (s.venue) L.push(`📍 ${s.venue}`);
  if (s.note) L.push(`📝 ${s.note}`);
  if (s.status === 'settled') {
    L.push('', `👥 Có mặt ${sessHeads(s)} người`);
    (s.costs || []).forEach(x => L.push(`• ${x.label}: ${vnd(x.amount)}`));
    L.push(`💰 Tổng: ${vnd(total)}${per ? ` → mỗi người ${vnd(per)}` : ''}`, '');
    Object.entries(shares).forEach(([mid, a]) => { const m = memberOf(c, mid); if (m) L.push(`${mid === s.payer ? '✅' : '⬜'} ${m.name}: ${vnd(a)}${mid === s.payer ? ' (đã ứng tiền)' : ''}`); });
    if (bankLine(c)) L.push('', bankLine(c), `✍️ Nội dung: ${initials(c.name)} <Tên của bạn>`);
    if (isCloud(c)) L.push('', '📱 Xem phần của bạn và quét VietQR trong app Sport Share.');
  } else if (s.status === 'cancelled') {
    L.push('', `❌ ${cap1(sp.unit)} này đã HỦY.`);
  } else {
    L.push('', ...voteText(c, s));
    L.push(isCloud(c) ? '👉 Vote ĐI / KHÔNG ĐI ngay trong app Sport Share nha!' : '👉 Ai chưa vote trả lời ĐI hoặc KHÔNG ĐI nha!');
  }
  return L.join('\n');
}
function reminderText(c, m) {
  const un = unpaidOf(c, m.id).sort((a, b) => a.date.localeCompare(b.date)); const d = debtOf(c, m.id);
  const L = [`Chào ${m.name} 👋`, `${c.name} nhắc nhẹ: bạn còn ${vnd(d)} chưa thanh toán:`];
  un.forEach(x => L.push(`• ${x.label}: ${vnd(x.amount)}`));
  if (bankLine(c)) L.push('', bankLine(c), `✍️ Nội dung: ${transferNote(c, m.name)}`);
  if (isCloud(c) && m.uid) L.push('📱 Mở app Sport Share để quét VietQR và bấm "Tôi đã chuyển khoản".');
  L.push('Cảm ơn bạn nhiều! 💪');
  return L.join('\n');
}

/* ---------- link xem nhanh: nén dữ liệu vào phần # của đường link ---------- */
const b64u = bytes => { let s = ''; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); const bin = atob(s); return Uint8Array.from(bin, ch => ch.charCodeAt(0)); };
async function streamBytes(bytes, T) { const st = new Blob([bytes]).stream().pipeThrough(T); return new Uint8Array(await new Response(st).arrayBuffer()); }
async function encodeShare(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined') { try { return 'z' + b64u(await streamBytes(raw, new CompressionStream('deflate-raw'))); } catch (e) {} }
  return 'j' + b64u(raw);
}
async function decodeShare(s) {
  const kind = s[0], bytes = unb64u(s.slice(1));
  const raw = kind === 'z' ? await streamBytes(bytes, new DecompressionStream('deflate-raw')) : bytes;
  return JSON.parse(new TextDecoder().decode(raw));
}
function shareSnapshot(c) {
  const ms = activeMembers(c);
  const d = {}; c.members.forEach(m => { const un = unpaidOf(c, m.id); if (un.length) d[m.id] = un.map(x => [x.label, x.amount]); });
  return {
    v: 1, t: Date.now(), n: c.name, sport: c.sport, sportName: c.sportName || '',
    b: bankReady(c.bank) ? { bin: c.bank.bin, acct: c.bank.acct, holder: c.bank.holder || '' } : null,
    m: ms.map(m => [m.id, m.name, m.avatar]), d,
    up: upcoming(c).slice(0, 5).map(s => { const v = voteOf(c, s); return { d: s.date, t: s.time || '', v: s.venue || '', y: v.yes, n: v.no, mx: v.max }; }),
    r: rankList(c, 'month').list.filter(x => x.n).slice(0, 10).map(x => [x.m.id, x.n]),
  };
}

/* ---------- lịch điện thoại ---------- */
function sessTimes(s) {
  const [y, mo, d] = s.date.split('-').map(Number); const [hh, mm] = (s.time || '19:00').split(':').map(Number);
  const st = new Date(y, mo - 1, d, hh || 0, mm || 0); return [st, new Date(st.getTime() + 2 * 3600e3)];
}
const calDt = d => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
const calTitle = (c, s) => `${sportOf(c).ic} ${cap1(sportOf(c).unit)} ${c.name}`;
function gcalUrl(c, s) {
  const [st, en] = sessTimes(s), e = encodeURIComponent;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${e(calTitle(c, s))}&dates=${calDt(st)}/${calDt(en)}&ctz=Asia/Ho_Chi_Minh&location=${e(s.venue || '')}&details=${e((s.note ? s.note + '\n' : '') + 'Sport Share: ' + appBase())}`;
}
function icsText(c, s) {
  const [st, en] = sessTimes(s), x = t => String(t || '').replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sport Share//VI', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${s.id}@sportshare`, `DTSTAMP:${calDt(new Date())}`, `DTSTART:${calDt(st)}`, `DTEND:${calDt(en)}`, `SUMMARY:${x(calTitle(c, s))}`, `LOCATION:${x(s.venue)}`, `DESCRIPTION:${x(s.note || '')}`, 'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${x(calTitle(c, s))}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
function downloadBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }

/* ---------- ảnh mã QR để tải về ---------- */
async function saveQRImage({ title, sub, payload, lines, file }) {
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const W = 900, H = 1240, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const F = "'Be Vietnam Pro', system-ui, sans-serif";
    g.fillStyle = '#0B1D33'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.04)'; for (let x = -H; x < W; x += 70) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + 35, H); g.lineTo(x + 35 + H * .55, 0); g.lineTo(x + H * .55, 0); g.fill(); }
    g.fillStyle = '#FFFFFF'; const rr = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); g.fill(); };
    rr(50, 170, W - 100, H - 230, 36);
    g.textAlign = 'center'; g.fillStyle = '#FFFFFF'; g.font = `italic 800 46px ${F}`; g.fillText(title, W / 2, 85);
    g.fillStyle = '#C6F432'; g.font = `700 26px ${F}`; g.fillText(sub, W / 2, 130);
    const { n, dark } = qrMatrix(payload); const q = 560, cell = q / (n + 4), ox = (W - q) / 2, oy = 205;
    g.fillStyle = '#0B1D33'; for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (dark(r, col)) g.fillRect(ox + (col + 2) * cell, oy + (r + 2) * cell, Math.ceil(cell), Math.ceil(cell));
    g.fillStyle = '#FF5A1F'; g.font = `800 24px ${F}`; g.fillText('VietQR · Napas 247', W / 2, oy + q + 34);
    let y = oy + q + 100;
    lines.forEach(([label, val, big]) => { g.textAlign = 'left'; g.fillStyle = '#4A5B70'; g.font = `700 26px ${F}`; g.fillText(label, 100, y); g.textAlign = 'right'; g.fillStyle = big ? '#FF5A1F' : '#0B1D33'; g.font = `800 ${big ? 40 : 28}px ${F}`; g.fillText(val, W - 100, y); y += big ? 64 : 54; });
    g.textAlign = 'center'; g.fillStyle = '#8494A7'; g.font = `600 21px ${F}`; g.fillText('Mở app ngân hàng → Quét mã → chọn ảnh này', W / 2, H - 90);
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    const f = new File([blob], file, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [f] }) && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try { await navigator.share({ files: [f], title }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    downloadBlob(blob, file);
    toast('Đã tải ảnh mã QR. Mở app ngân hàng, chọn quét mã từ ảnh nhé!');
  } catch (e) { console.error(e); toast('Chưa tải được ảnh. Hãy chụp màn hình mã QR thay nhé!'); }
}

/* ---------- sao lưu ---------- */
const plainClub = c => { const o = JSON.parse(JSON.stringify(c, (k, v) => (k && k[0] === '_') ? undefined : v)); return o; };
function exportData() {
  const c = club() && UI.view === 'club' ? club() : null; const clubs = c ? [c] : localClubs();
  if (!clubs.length) return toast('Chưa có hội nào để sao lưu.');
  const blob = new Blob([JSON.stringify({ app: 'sportshare', v: 2, at: Date.now(), clubs: clubs.map(plainClub) }, null, 1)], { type: 'application/json' });
  downloadBlob(blob, `SportShare-${noTone(c ? c.name : 'tren-may').replace(/[^A-Za-z0-9]+/g, '-')}-${dayKey()}.json`);
  clubs.forEach(x => { if (canAdmin(x) && !x.demo) { x.backupAt = Date.now(); delete DEV.snooze[x.id]; } }); save();
  toast('Đã tải file sao lưu. Cất vào Google Drive / Zalo Cloud cho an toàn nhé!');
}
async function readImport(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || data.app !== 'sportshare' || !Array.isArray(data.clubs) || !data.clubs.length) throw new Error('bad');
    if (!data.clubs.every(c => c && c.id && c.name && Array.isArray(c.members))) throw new Error('bad');
    UI.importData = { clubs: data.clubs, names: data.clubs.map(c => c.name).join(', ') }; UI.confirm = 'import'; render();
  } catch (e) { toast('File không đúng định dạng sao lưu Sport Share.'); }
}

/* ---------- link mời ---------- */
async function openJoin(code) {
  DEV.pendingJoin = code; persistLocal();
  if (!ME) return go('join', { join: { code } });
  go('join', { join: { code, state: 'loading' } });
  let inv = null;
  try { inv = await CLOUD.get('invites/' + code); } catch (e) { UI.join = { code, state: 'bad', msg: e.code === 'unavailable' ? 'Không có mạng để mở lời mời. Thử lại sau.' : 'Link mời không còn hiệu lực.' }; return render(); }
  DEV.pendingJoin = null; persistLocal();
  if (!inv) { UI.join = { code, state: 'bad' }; return render(); }
  if (CL[inv.clubId]) { toast('Bạn đã ở trong hội này.'); return openClub(inv.clubId); }
  UI.join = { code, state: 'ok', inv }; render();
}

/* ---------- hành động (data-act) ---------- */
const ACT = {
  go: el => go(el.dataset.v),
  goHome: () => { if (UI.view === 'join') { DEV.pendingJoin = null; persistLocal(); } goHomeOrWelcome(); },
  goWelcome: () => go('welcome'),
  closeSheet,
  cancelConfirm: () => { UI.confirm = null; UI.importData = null; render(); },
  copy: el => copyText(el.dataset.t),
  theme: el => { DEV.theme = el.dataset.k; persistLocal(); applyTheme(); render(); },
  openLegal: () => { UI.legalBack = UI.view; go('legal'); },
  closeLegal: () => go(UI.legalBack && !['legal', 'loading'].includes(UI.legalBack) ? UI.legalBack : (ME ? 'home' : 'welcome')),
  donatePick: el => { UI.donateIdx = Number(el.dataset.i); render(); },
  downloadDonate: () => { const o = DONATE_OPTS[UI.donateIdx ?? 1]; saveQRImage({ title: 'SPORT SHARE ☕', sub: 'Cảm ơn bạn đã mời Team Sport Share ly cafe', payload: vietQR({ bin: DONATE.bin, acct: DONATE.acct, amount: o.amount, note: DONATE.note }), lines: [['Người nhận', DONATE.name + ' · ' + DONATE.bank], ['Số tài khoản', DONATE.acct], ['Ly cafe', o.amount ? o.label : 'Tùy tâm', true], ['Nội dung', DONATE.note]], file: `SportShare-cafe-${o.slug}.png` }); },

  /* đăng nhập */
  fbLoad: () => { UI.fbOn = true; render(); },
  authMode: el => go('auth', { authMode: el.dataset.m }),
  googleSignIn: async () => {
    if (!CLOUD) return;
    if (inAppName()) { UI.err = `${inAppName()} không cho đăng nhập Google. Mở Sport Share bằng ${isIOS() ? 'Safari' : 'Chrome'} (xem hướng dẫn phía trên), hoặc đăng nhập bằng email.`; return render(); }
    UI.busy = true; UI.err = ''; render();
    try { await CLOUD.google(); }
    catch (e) { if (!/popup-closed|cancelled-popup/.test(e.code || '')) UI.err = authMsg(e); }
    UI.busy = false; render();
  },
  signOut: async () => { DEV.clubId = null; DEV.joins = []; persistLocal(); if (CLOUD) await CLOUD.signOut(); toast('Đã đăng xuất.'); },
  demo: async () => { const c = await seedDemo(); toast('Đang chơi thử hội mẫu: bạn là quản trị, đóng vai Minh Quân. Dữ liệu không được lưu.'); openClub(c.id); },
  exitDemo: () => { DEMO = null; DEV.clubId = null; persistLocal(); goHomeOrWelcome(); },
  snoozeBackup: el => { DEV.snooze[el.dataset.cid || DEV.clubId] = Date.now() + 3 * 864e5; persistLocal(); toast('Sẽ nhắc lại sau 3 ngày.'); },

  /* trang của tôi */
  openClub: el => openClub(el.dataset.cid, el.dataset.t),
  openSessionOf: el => { DEV.clubId = el.dataset.cid; persistLocal(); go('session', { sid: el.dataset.sid }); },
  joinSheet: () => sheet(() => joinSheet()),
  cancelJoin: async el => {
    const id = el.dataset.cid;
    if (CLOUD && ME) await commitOps([{ t: 'delete', p: `clubs/${id}/requests/${ME.uid}` }]);
    DEV.joins = DEV.joins.filter(j => j.clubId !== id); persistLocal(); toast('Đã hủy yêu cầu.');
  },
  joinClaim: async () => {
    const j = UI.join; if (!j || !j.inv) return;
    UI.busy = true; render();
    const ok = await claimInvite(j.code, j.inv);
    UI.busy = false;
    if (!ok) { UI.err = 'Không vào được hội. Có thể link đã được người khác dùng, hãy nhờ quản trị gửi link mới.'; return render(); }
    toast(`Chào mừng bạn đến ${j.inv.clubName}! 🎉`); waitClub(j.inv.clubId, () => openClub(j.inv.clubId));
  },
  uploadSheet: el => { const c = STORE.clubs[el.dataset.cid]; if (c) sheet(() => uploadSheet(c)); },

  /* lập hội */
  startReg: () => { if (!ME) { UI.after = 'register'; toast('Đăng nhập (Google một chạm) để lập hội nhé.'); return go('welcome'); } go('register', { reg: { step: 1, days: [], time: '19:00' } }); },
  regSport: el => { UI.reg.sport = el.dataset.k; UI.err = ''; render(); },
  regNext: () => {
    const r = UI.reg; if (!r.sport) return;
    if (r.sport === 'other' && !(r.sportName || '').trim()) { UI.err = 'Nhập tên môn thể thao nhé.'; return render(); }
    UI.err = ''; r.step = 2; render(); window.scrollTo(0, 0);
  },
  regBack: () => { if (UI.reg.step <= 1) return goHomeOrWelcome(); UI.reg.step -= 1; UI.err = ''; render(); },

  /* trong hội */
  tab: el => { UI.tab = el.dataset.t; UI.err = ''; UI.confirm = null; render(); window.scrollTo(0, 0); },
  atab: el => { UI.atab = el.dataset.t; UI.sheet = null; UI.err = ''; UI.confirm = null; if (UI.view !== 'club') go('club'); else { render(); window.scrollTo(0, 0); } },
  backToClub: () => go('club', { atab: UI.atab === 'home' ? 'home' : 'sessions' }),
  rsvp: el => {
    const c = clubById(el.dataset.cid) || club(); const mid = myMid(c); if (!c || !mid) return;
    const s = c.sessions.find(x => x.id === el.dataset.sid); if (!s || s.status !== 'open') return;
    const r = setVote(s, mid, el.dataset.r); const vt = voteOf(c, s);
    save(); toast(r === 'yes' ? (vt.wait.includes(mid) ? `Đã đủ chỗ, bạn ở dự bị số ${vt.wait.indexOf(mid) + 1}.` : 'Đã vote ĐI 💪') : r === 'no' ? 'Đã vote KHÔNG ĐI.' : 'Đã bỏ vote.');
  },
  viewSession: el => { const id = el.dataset.cid || DEV.clubId, sid = el.dataset.sid; sheet(() => { const c = clubById(id), s = c && c.sessions.find(x => x.id === sid); return s ? sessionSheet(c, s, myMid(c)) : empty('🗓️', 'Buổi này không còn.'); }); },
  calSheet: el => { const id = el.dataset.cid || DEV.clubId, sid = el.dataset.sid; sheet(() => { const c = clubById(id), s = c && c.sessions.find(x => x.id === sid); return s ? calSheet(c, s) : ''; }); },
  icsDownload: el => { const c = clubById(el.dataset.cid), s = c && c.sessions.find(x => x.id === el.dataset.sid); if (!s) return; downloadBlob(new Blob([icsText(c, s)], { type: 'text/calendar' }), `SportShare-${s.date}.ics`); toast('Đã tải file lịch. Mở file để thêm vào lịch điện thoại.'); },
  rankPeriod: el => { UI.rankPeriod = el.dataset.p; render(); },
  myAvatar: el => { const m = myMember(club()); if (!m) return; m.avatar = el.dataset.a; save(); render(); },
  reportPaid: () => {
    const c = club(), mid = myMid(c); if (!c || !mid) return;
    const un = unpaidOf(c, mid).filter(x => !x.reportedAt); if (!un.length) return;
    const now = Date.now(); un.forEach(x => x.reportedAt = now); save(); toast('Đã báo quản trị viên. Cảm ơn bạn! 💪');
  },
  askLeave: () => { UI.confirm = 'leave'; render(); },
  doLeave: async () => { const c = club(); UI.confirm = null; if (!c) return; const ok = await leaveClub(c); if (ok) { DEV.clubId = null; persistLocal(); toast(`Đã rời ${c.name}.`); go('home'); } },
  downloadPayQR: el => {
    const c = club(), m = memberOf(c, el.dataset.mid); if (!c || !m || !bankReady(c.bank)) return;
    const d = debtOf(c, m.id), note = transferNote(c, m.name);
    saveQRImage({ title: c.name.toUpperCase().slice(0, 28), sub: `Thanh toán của ${m.name}`, payload: vietQR({ bin: c.bank.bin, acct: c.bank.acct, amount: d, note }), lines: [['Ngân hàng', bankName(c.bank.bin)], ['Số tài khoản', c.bank.acct], ['Chủ tài khoản', c.bank.holder || ''], ['Số tiền', vnd(d), true], ['Nội dung', note]], file: `SportShare-${noTone(m.name).replace(/\W+/g, '-')}-${dayKey()}.png` });
  },

  /* quản trị: điều hướng */
  dismissFresh: () => { const c = club(); if (c) { c.setupDone = true; save(); } render(); },
  bulkSheet: () => sheet(() => bulkSheet()),
  sessFilter: el => { UI.sessFilter = el.dataset.k; render(); },
  moneyTab: el => { UI.moneyTab = el.dataset.k; render(); },

  /* buổi chơi */
  newSession: () => { UI.editSid = null; sheet(() => sessionFormSheet(club(), null)); },
  editSession: () => { UI.editSid = UI.sid; sheet(() => sessionFormSheet(club(), curSession())); },
  openSession: el => go('session', { sid: el.dataset.sid }),
  toggleAtt: el => { const s = curSession(); if (!s || s.status !== 'open') return; const id = el.dataset.mid; s.attendees = s.attendees.includes(id) ? s.attendees.filter(x => x !== id) : [...s.attendees, id]; s.teams = null; save(); render(); },
  attFromRsvp: () => { const s = curSession(); if (!s) return; const c = club(); const vt = voteOf(c, s); s.attendees = vt.going.slice(); s.teams = null; save(); toast(`Đã điểm danh ${s.attendees.length} người vote đi${vt.wait.length ? ` (chưa gồm ${vt.wait.length} dự bị)` : ''}.`); },
  adminVote: el => { const c = club(), s = curSession(); if (!s || s.status !== 'open') return; const m = memberOf(c, el.dataset.mid); const r = setVote(s, el.dataset.mid, el.dataset.r); save(); toast(`${m ? m.name : ''}: ${r === 'yes' ? '✅ đi' : r === 'no' ? '❌ không đi' : 'bỏ vote'}`); },
  copyVoteResult: () => { const c = club(), s = curSession(), sp = sportOf(c); copyText([`🗳️ KẾT QUẢ VOTE · ${cap1(sp.unit)} ${fmtDate(s.date)}${s.time ? ' ' + s.time : ''}`, s.venue ? `📍 ${s.venue}` : '', ...voteText(c, s)].filter(Boolean).join('\n'), 'Đã chép kết quả vote.'); },
  copyVoteInvite: async () => {
    const c = club(), s = curSession(), sp = sportOf(c);
    const head = [`🗳️ VOTE ${cap1(sp.unit).toUpperCase()} · ${c.name}`, `📅 ${fmtDateLong(s.date)}${s.time ? ' · ' + s.time : ''}`, s.venue ? `📍 ${s.venue}` : '', s.note ? `📝 ${s.note}` : '', s.max ? `👥 Tối đa ${s.max} người, ai vote ĐI trước giữ chỗ trước.` : ''].filter(Boolean);
    let tail;
    if (isCloud(c)) tail = ['', '📱 Vote ĐI / KHÔNG ĐI ngay trong app Sport Share:', appBase(), 'Ai chưa vào app thì trả lời trong nhóm, mình ghi hộ.'];
    else { const code = await encodeShare(shareSnapshot(c)); tail = ['', 'Trả lời ĐI hoặc KHÔNG ĐI trong nhóm, hoặc bấm link, chọn tên mình rồi vote:', `${shareBase()}#s=${code}`]; }
    copyText(head.concat(tail).join('\n'), 'Đã chép lời mời vote, dán vào nhóm Zalo nhé!');
  },
  guestSheet: () => sheet(() => guestSheet(club())),
  delGuest: el => { const s = curSession(); s.guests.splice(Number(el.dataset.i), 1); s.teams = null; save(); render(); },
  addCost: el => { const s = curSession(); s.costs ||= []; s.costs.push({ label: el.dataset.l || 'Chi phí khác', amount: 0 }); save(); render(); later(() => { const ins = document.querySelectorAll('[data-chg="cost"][data-f="amount"]'); const last = ins[ins.length - 1]; if (last) last.focus(); }); },
  delCost: el => { const s = curSession(); s.costs.splice(Number(el.dataset.i), 1); save(); render(); },
  splitMode: el => { const s = curSession(); s.split = el.dataset.k; if (s.split === 'custom') { const { shares } = sessShares(club(), { ...s, split: 'equal' }); s.custom ||= {}; s.attendees.forEach(id => { if (s.custom[id] == null) s.custom[id] = shares[id] || 0; }); } save(); render(); },
  teamsK: el => { const s = curSession(); s.teamsK = Number(el.dataset.k); s.teams = null; save(); render(); },
  teamsMode: el => { const s = curSession(); s.teamsMode = el.dataset.k; s.teams = null; save(); render(); },
  makeTeams: () => {
    const c = club(), s = curSession(), sp = sportOf(c);
    const players = [...s.attendees, ...(s.guests || []).map(g => 'g:' + g.name)];
    const lv = id => { const m = memberOf(c, id); return m ? Number(m.level) || 3 : 3; };
    // Firestore không lưu được mảng lồng mảng → mỗi đội là { m: [...] }
    if (sp.split === 'pairs' && s.teamsMode !== 'teams') { s.teams = makePairs(players, lv).map(m => ({ m })); s.teamsMode = 'pairs'; }
    else { s.teams = makeTeams(players, sp.split === 'pairs' ? 2 : (s.teamsK || sp.teams || 2), lv).map(m => ({ m })); s.teamsMode = 'teams'; }
    save(); render();
  },
  settle: () => {
    const c = club(), s = curSession(), sp = sportOf(c); if (!s || s.status !== 'open') return;
    const { shares, surplus } = sessShares(c, s);
    if (s.split === 'custom' && surplus < 0) return toast('Số tiền chia còn thiếu so với tổng chi phí.');
    s.costs = (s.costs || []).filter(x => Number(x.amount) > 0);
    c.charges = c.charges.filter(x => x.ref !== s.id);
    Object.entries(shares).forEach(([mid, amount]) => { if (amount > 0) c.charges.push({ id: uid('c_'), mid, amount, label: `${cap1(sp.unit)} ${fmtDate(s.date)}`, kind: 'session', ref: s.id, date: s.date, paid: mid === s.payer, paidAt: mid === s.payer ? Date.now() : null }); });
    s.status = 'settled'; s.settledAt = Date.now(); save();
    toast(`Đã chốt ${sp.unit}, tạo ${Object.keys(shares).length} khoản công nợ.`);
  },
  cancelSession: () => { UI.confirm = 'cancelSession'; render(); },
  reopenSession: () => { const s = curSession(); if (s.status === 'cancelled') { s.status = 'open'; save(); return render(); } UI.confirm = 'reopenSession'; render(); },
  delSession: () => { UI.confirm = 'delSession'; render(); },
  doConfirm: () => {
    const c = club(), s = curSession(); const k = UI.confirm; UI.confirm = null; if (!s) return render();
    if (k === 'delSession') { c.sessions = c.sessions.filter(x => x.id !== s.id); c.charges = c.charges.filter(x => x.ref !== s.id); save(); toast('Đã xóa.'); return go('club', { atab: 'sessions' }); }
    if (k === 'reopenSession') { c.charges = c.charges.filter(x => x.ref !== s.id); s.status = 'open'; s.settledAt = null; save(); toast('Đã mở lại, công nợ của buổi đã được gỡ.'); return render(); }
    if (k === 'cancelSession') { s.status = 'cancelled'; save(); toast('Đã hủy.'); return render(); }
    render();
  },
  copyAnnounce: () => copyText(announceText(club(), curSession()), 'Đã chép thông báo, dán vào nhóm Zalo/Messenger nhé!'),

  /* tiền */
  debtSheet: el => { const id = el.dataset.mid; sheet(() => debtSheet(club(), memberOf(club(), id))); },
  togglePaid: el => { const c = club(); const x = c.charges.find(y => y.id === el.dataset.cid); if (!x) return; x.paid = !x.paid; x.paidAt = x.paid ? Date.now() : null; save(); toast(x.paid ? `Đã gạch ${vnd(x.amount)}.` : 'Đã hoàn tác.'); },
  payAll: el => { const c = club(); const un = unpaidOf(c, el.dataset.mid); const sum = un.reduce((a, x) => a + x.amount, 0); un.forEach(x => { x.paid = true; x.paidAt = Date.now(); }); save(); toast(`Đã thu đủ ${vnd(sum)}.`); },
  delCharge: el => { const c = club(), x = c.charges.find(y => y.id === el.dataset.cid); if (!x || !confirm(`Xóa khoản “${x.label}” ${vnd(x.amount)}? Không hoàn tác được.`)) return; c.charges = c.charges.filter(y => y.id !== x.id); save(); toast('Đã xóa khoản.'); },
  copyReminder: el => { const c = club(); copyText(reminderText(c, memberOf(c, el.dataset.mid)), 'Đã chép tin nhắc nợ.'); },
  copyAllReminders: () => {
    const c = club(); const rows = c.members.map(m => [m, debtOf(c, m.id)]).filter(([, d]) => d > 0).sort((a, b) => b[1] - a[1]);
    const t = [`💸 ${c.name.toUpperCase()} · CÔNG NỢ ${fmtDate(dayKey())}`, ...rows.map(([m, d], i) => `${i + 1}. ${m.name}: ${vnd(d)}`), `Tổng: ${vnd(totalDebt(c))}`, bankLine(c) ? '\n' + bankLine(c) + `\n✍️ Nội dung: ${initials(c.name)} <Tên của bạn>` : ''].join('\n');
    copyText(t, 'Đã chép danh sách công nợ.');
  },
  chargeSheet: el => { const k = el.dataset.k; sheet(() => chargeSheet(club(), k)); },
  chkAll: el => { const f = el.closest('form'); f.querySelectorAll('input[name="m"]').forEach(i => { i.checked = el.dataset.v === '1'; i.closest('.check').classList.toggle('on', i.checked); }); },
  fundSheet: el => { const k = el.dataset.k; sheet(() => fundSheet(k)); },
  delFund: el => { const c = club(), x = c.fund.find(y => y.id === el.dataset.id); if (!x || !confirm(`Xóa dòng sổ quỹ “${x.label}” ${vnd(x.amount)}? Không hoàn tác được.`)) return; c.fund = c.fund.filter(y => y.id !== x.id); save(); toast('Đã xóa.'); },

  /* hội viên (quản trị) */
  memberSheet: el => { const id = el.dataset.mid; UI.editAvatar = null; UI.confirm = null; sheet(() => memberSheet(club(), id ? memberOf(club(), id) : null)); },
  pickAvatar: el => { const f = el.closest('form'); f.querySelector('input[name="avatar"]').value = el.dataset.a; UI.editAvatar = el.dataset.a; f.querySelectorAll('[data-act="pickAvatar"]').forEach(b => b.classList.toggle('on', b === el)); },
  toggleActive: el => { const m = memberOf(club(), el.dataset.mid); m.active = m.active === false; save(); toast(m.active ? 'Đã cho quay lại hội.' : 'Đã chuyển sang nghỉ. Lịch sử vẫn được giữ.'); },
  delMember: () => { UI.confirm = 'delMember'; render(); },
  doDelMember: async el => {
    const c = club(), id = el.dataset.mid, m = memberOf(c, id);
    if (isCloud(c) && m && m.uid) await unlinkMember(c, m);
    c.members = c.members.filter(x => x.id !== id); c.charges = c.charges.filter(x => x.mid !== id);
    c.sessions.forEach(s => { s.attendees = s.attendees.filter(x => x !== id); if (s.rsvp) delete s.rsvp[id]; if (s.rsvpAt) delete s.rsvpAt[id]; });
    if (c.meMid === id) c.meMid = null;
    UI.confirm = null; UI.sheet = null; save(); toast('Đã xóa hội viên.');
  },
  setMe: el => { const c = club(); c.meMid = c.meMid === el.dataset.mid ? null : el.dataset.mid; save(); toast(c.meMid ? 'Đã đánh dấu đây là bạn.' : 'Đã bỏ đánh dấu.'); },
  groupInvite: async () => {
    const c = club(); if (!isCloud(c)) return;
    if (!c.groupInvite) { const code = await makeInvite(c, null); if (!code) return; c.groupInvite = code; save(); }
    copyText(`${sportOf(c).ic} Mời bạn vào hội ${c.name} trên Sport Share!\nBấm link, đăng nhập bằng Google hoặc email rồi gửi yêu cầu, mình sẽ duyệt:\n${appBase()}#join=${c.groupInvite}`, 'Đã chép link mời chung. Dán vào nhóm Zalo nhé!');
  },
  personalInvite: async el => {
    const c = club(), m = memberOf(c, el.dataset.mid); if (!c || !m || m.uid) return;
    if (!m.invite) { const code = await makeInvite(c, m.id); if (!code) return; m.invite = code; save(); }
    copyText(`Chào ${m.name} 👋 Mời bạn vào hội ${c.name} trên Sport Share.\nBấm link, đăng nhập (Google hoặc email) là vào hội ngay, xem lịch, vote và công nợ của bạn:\n${appBase()}#join=${m.invite}\n(Link dành riêng cho ${m.name}, đừng gửi cho người khác nhé.)`, `Đã chép link mời riêng cho ${m.name}. Gửi tin nhắn riêng nhé!`);
  },
  approveReq: async el => {
    const c = club(), r = (c.requests || []).find(x => x.uid === el.dataset.uid); if (!r) return;
    const sel = document.getElementById('ap-' + r.uid); await approveRequest(c, r, sel && sel.value ? sel.value : null);
  },
  rejectReq: async el => { const c = club(), r = (c.requests || []).find(x => x.uid === el.dataset.uid); if (r) await rejectRequest(c, r); },
  unlinkMember: async el => { const c = club(), m = memberOf(c, el.dataset.mid); if (m && await unlinkMember(c, m)) { UI.sheet = null; toast(`Đã gỡ tài khoản khỏi ${m.name}.`); } },
  toggleAdminRole: async el => { const c = club(), m = memberOf(c, el.dataset.mid); if (m && m.uid) { await setAdmin(c, m, !(c.admins || []).includes(m.uid)); UI.sheet = null; render(); } },

  /* cài đặt */
  shareLink: async () => { const c = club(); const code = await encodeShare(shareSnapshot(c)); copyText(`${sportOf(c).ic} ${c.name} · lịch & công nợ (cập nhật ${fmtDate(dayKey())}):\n${shareBase()}#s=${code}`, 'Đã chép link xem nhanh. Gửi vào nhóm của hội nhé!'); },
  previewShared: () => { UI.shared = shareSnapshot(club()); UI.sharedMid = null; UI.sharedPreview = true; go('shared'); },
  closePreview: () => { UI.sharedPreview = false; UI.shared = null; go('club', { atab: 'settings' }); },
  sharedVote: el => {
    const d = UI.shared, u = sharedUps(d)[Number(el.dataset.i)], me = d.m.find(x => x[0] === UI.sharedMid); if (!u || !me) return;
    const sp = sportOf(d); const yes = el.dataset.r === 'yes';
    copyText(`🗳️ ${me[1]}: ${yes ? '✅ ĐI' : '❌ KHÔNG ĐI'} · ${cap1(sp.unit)} ${fmtDate(u.date)}${u.time ? ' ' + u.time : ''}${u.venue ? ' · ' + u.venue : ''}`, `Đã chép “${yes ? 'ĐI' : 'KHÔNG ĐI'}”. Dán vào nhóm Zalo để quản trị viên ghi nhận.`);
  },
  sharedPick: el => { UI.sharedMid = el.dataset.mid || null; render(); window.scrollTo(0, 0); },
  leaveShared: () => { UI.shared = null; try { history.replaceState(null, '', appBase()); } catch (e) {} route(true); },
  exportData,
  doImport: async () => { // khôi phục file sao lưu → đưa thẳng lên đám mây thành hội mới của bạn
    const d = UI.importData; if (!d || !ME) return;
    UI.confirm = null; UI.importData = null; UI.busy = true; toast('Đang khôi phục lên đám mây…');
    let n = 0, last = null;
    for (const c of d.clubs) {
      const x = normalizeClub(JSON.parse(JSON.stringify(c)));
      ['owner', 'admins', 'memberUids', 'uidMid', 'joinVia', 'groupInvite', 'backupAt'].forEach(k => delete x[k]);
      x.members.forEach(m => { delete m.uid; delete m.invite; delete m.pin; delete m.email; delete m.joinVia; });
      const id = await uploadLocalClub(x, null); if (id) { n++; last = id; }
    }
    UI.busy = false;
    if (!n) return toast('Chưa khôi phục được. Kiểm tra mạng rồi thử lại.');
    toast(`Đã khôi phục ${n} hội lên đám mây. Gửi link mời cho hội viên nhé!`); waitClub(last, () => openClub(last, 'members'));
  },
  askDelClub: () => { UI.confirm = 'delClub'; render(); },
  doDelClub: async () => {
    const c = club(); if (!c) return;
    const typed = (document.getElementById('del-name') || {}).value || '';
    if (noTone(typed).trim().toLowerCase() !== noTone(c.name).trim().toLowerCase()) { toast('Gõ đúng tên hội để xác nhận xóa.'); return; }
    UI.confirm = null;
    if (isCloud(c)) { if (!(await deleteCloudClub(c))) return render(); }
    else { delete STORE.clubs[c.id]; }
    DEV.clubId = null; persistLocal(); toast('Đã xóa hội.'); go('home');
  },
};

/* ---------- biểu mẫu (data-form) ---------- */
const FORMS = {
  async auth(v, f) {
    const m = f.dataset.m; UI.authEmail = (v.email || '').trim(); UI.authName = (v.name || '').trim();
    if (!UI.authEmail) { UI.err = 'Nhập email.'; return render(); }
    UI.busy = true; UI.err = ''; render();
    try {
      if (m === 'reset') { await CLOUD.resetPassword(UI.authEmail); UI.busy = false; toast('Đã gửi link đặt lại mật khẩu. Kiểm tra hộp thư (cả mục Spam).'); return go('auth', { authMode: 'login' }); }
      if (m === 'register') {
        if (!UI.authName) { UI.busy = false; UI.err = 'Nhập tên hiển thị.'; return render(); }
        const u = await CLOUD.emailSignUp(UI.authName, UI.authEmail, v.pass || '');
        if (ME && u && ME.uid === u.uid) { ME.name = u.name; }
      } else await CLOUD.emailSignIn(UI.authEmail, v.pass || '');
    } catch (e) { UI.err = authMsg(e); }
    UI.busy = false; render();
  },
  joinLink(v) {
    const t = String(v.link || '').trim(); const m = t.match(/join=([A-Za-z0-9]+)/) || t.match(/^([A-Za-z0-9]{8,})$/);
    if (!m) { UI.err = 'Link chưa đúng. Link mời có dạng …/app/#join=…'; return render(); }
    UI.sheet = null; if (!ME && CLOUD) { DEV.pendingJoin = m[1]; persistLocal(); return go('welcome'); }
    if (!CLOUD) { UI.err = 'Đăng nhập chưa được bật trên trang này.'; return render(); }
    openJoin(m[1]);
  },
  async joinReq(v) {
    const j = UI.join; if (!j || !j.inv) return;
    UI.busy = true; render();
    const ok = await requestJoin(j.code, j.inv, (v.name || '').trim());
    UI.busy = false; if (ok) UI.join = { ...j, state: 'sent' }; else UI.err = 'Chưa gửi được yêu cầu. Link có thể đã hết hiệu lực.';
  },
  async myName(v) {
    const name = (v.name || '').trim().slice(0, 40); if (!name || !ME) return;
    const u = await CLOUD.setName(name); if (u) ME.name = u.name; toast('Đã lưu tên.');
  },
  myClubName(v) { const m = myMember(club()); const name = (v.name || '').trim().slice(0, 40); if (!m || !name) return; m.name = name; save(); toast('Đã lưu.'); },
  async upload(v, f) {
    const lc = STORE.clubs[f.dataset.cid]; if (!lc || !ME) return;
    UI.busy = true; render();
    const id = await uploadLocalClub(lc, v.me || null);
    UI.busy = false;
    if (!id) { UI.err = 'Chưa tải lên được. Kiểm tra mạng rồi thử lại.'; return render(); }
    delete STORE.clubs[lc.id]; UI.sheet = null; persistLocal();
    toast(`Đã đưa “${lc.name}” lên đám mây! Giờ gửi link mời cho hội viên.`);
    waitClub(id, () => openClub(id, 'members'));
  },
  async reg2(v, f) {
    const r = UI.reg; r.name = (v.name || '').trim().slice(0, 60); r.venue = (v.venue || '').trim(); r.time = v.time || '';
    r.days = [...f.querySelectorAll('input[name="days"]:checked')].map(i => Number(i.value));
    if (!r.name) { UI.err = 'Đặt tên cho hội nhé.'; return render(); }
    const fields = { sport: r.sport, sportName: r.sport === 'other' ? (r.sportName || '').trim() : '', name: r.name, schedule: { days: r.days, time: r.time || '19:00', venue: r.venue || '' }, settings: { round: 1000 }, bank: { bin: '', acct: '', holder: '' } };
    if (!ME || !CLOUD) { UI.after = 'register'; return go('welcome'); }
    UI.busy = true; render();
    const id = await createCloudClub(fields, !!v.withMe);
    UI.busy = false; if (!id) { UI.err = 'Chưa lập được hội. Kiểm tra mạng rồi thử lại.'; return render(); }
    toast(`Đã lập hội ${r.name}! 🎉`);
    waitClub(id, () => openClub(id));
  },
  session(v) {
    const c = club(); if (!v.date) { UI.err = 'Chọn ngày.'; return render(); }
    const max = Math.max(0, parseInt(v.max, 10) || 0);
    if (UI.editSid) {
      const s = c.sessions.find(x => x.id === UI.editSid); Object.assign(s, { date: v.date, time: v.time, venue: (v.venue || '').trim(), note: (v.note || '').trim(), max });
      UI.sheet = null; save(); toast('Đã lưu.'); return;
    }
    const prev = c.sessions.filter(s => (s.costs || []).length).sort((a, b) => b.date.localeCompare(a.date))[0];
    const costs = prev ? prev.costs.map(x => ({ label: x.label, amount: x.amount })) : sportOf(c).costs.map(l => ({ label: l, amount: 0 }));
    const s = { id: uid('s_'), date: v.date, time: v.time, venue: (v.venue || '').trim(), note: (v.note || '').trim(), max, status: 'open', rsvp: {}, rsvpAt: {}, attendees: [], guests: [], costs, split: 'equal', payer: prev ? prev.payer || '' : '', teams: null, createdAt: Date.now() };
    c.sessions.push(s); if (v.venue && !c.schedule.venue) c.schedule.venue = v.venue.trim();
    save(); toast(`Đã tạo ${sportOf(c).unit}. ${prev ? 'Chi phí lấy theo buổi trước, sửa nếu cần.' : 'Nhập chi phí khi có nhé.'}`);
    go('session', { sid: s.id });
  },
  guest(v) {
    const s = curSession(); const name = (v.name || '').trim(); if (!name) return;
    s.guests ||= []; s.guests.push({ name, host: v.host || '' }); s.teams = null; UI.sheet = null; save();
  },
  charge(v, f) {
    const c = club(); const kind = f.dataset.k; const amount = parseMoney(v.amount); const label = (v.label || '').trim();
    const ids = [...f.querySelectorAll('input[name="m"]:checked')].map(i => i.value);
    if (!label) { UI.err = 'Nhập tên khoản thu.'; return render(); }
    if (!amount) { UI.err = 'Nhập số tiền mỗi người.'; return render(); }
    if (!ids.length) { UI.err = 'Chọn ít nhất 1 hội viên.'; return render(); }
    const k = kind === 'monthly' ? 'monthly' : (v.tofund ? 'fund' : 'other'); const ref = uid('k_');
    ids.forEach(mid => c.charges.push({ id: uid('c_'), mid, amount, label, kind: k, ref, date: dayKey(), paid: false, paidAt: null }));
    UI.sheet = null; save(); toast(`Đã tạo ${ids.length} khoản ${vnd(amount)}.`);
  },
  fund(v, f) {
    const c = club(); const amount = parseMoney(v.amount); const label = (v.label || '').trim();
    if (!label || !amount) { UI.err = 'Nhập nội dung và số tiền.'; return render(); }
    c.fund.push({ id: uid('f_'), type: f.dataset.k, amount, label, date: v.date || dayKey() }); UI.sheet = null; save(); toast('Đã ghi sổ quỹ.');
  },
  bulk(v) {
    const c = club(); const have = new Set(c.members.map(m => noTone(m.name).toLowerCase()));
    const names = [...new Set(String(v.names || '').split(/[\n,;]+/).map(x => x.replace(/^\s*[\d.)\-•*]+\s*/, '').trim()).filter(Boolean))].slice(0, 200);
    if (!names.length) { UI.err = 'Dán ít nhất một tên, mỗi dòng một người.'; return render(); }
    const fresh = names.filter(n => !have.has(noTone(n).toLowerCase()));
    fresh.forEach((name, i) => c.members.push({ id: uid('m_'), name: name.slice(0, 40), phone: '', level: 3, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)], active: true, joinedAt: Date.now() + i }));
    UI.sheet = null; UI.err = ''; save();
    toast(`Đã thêm ${fresh.length} hội viên${names.length > fresh.length ? `, bỏ qua ${names.length - fresh.length} tên đã có` : ''}.`);
  },
  member(v, f, sub) {
    const c = club(); const id = f.dataset.mid; const name = (v.name || '').trim().slice(0, 40);
    if (!name) { UI.err = 'Nhập tên hội viên.'; return render(); }
    const data = { name, phone: (v.phone || '').trim(), level: Number(v.level) || 3, avatar: v.avatar || '🙂' };
    if (id) { Object.assign(memberOf(c, id), data); toast('Đã lưu.'); }
    else {
      c.members.push({ id: uid('m_'), ...data, active: true, joinedAt: Date.now() });
      if (sub && sub.value === '1') { // thêm & nhập tiếp: mở lại form trống
        UI.editAvatar = null; UI.err = ''; save(); UI.sheet = () => memberSheet(club(), null); toast(`Đã thêm ${name}. Nhập người tiếp theo.`);
        later(() => { const i = $('#m-name'); if (i) i.focus(); }); return;
      }
      toast(`Đã thêm ${name}.`);
    }
    UI.sheet = null; UI.editAvatar = null; save();
  },
  clubInfo(v, f) {
    const c = club(); const name = (v.name || '').trim().slice(0, 60); if (!name) return toast('Tên hội không được trống.');
    c.name = name; c.sport = v.sport || c.sport; if (c.sport === 'other') c.sportName = (v.sportName || c.sportName || '').trim();
    c.schedule.venue = (v.venue || '').trim(); c.schedule.time = v.time || ''; c.schedule.days = [...f.querySelectorAll('input[name="days"]:checked')].map(i => Number(i.value));
    c.settings.round = Number(v.round) || 1; save(); toast('Đã lưu thông tin hội.');
  },
  bank(v) {
    const c = club(); const acct = String(v.acct || '').replace(/\s/g, '');
    if (v.bin && !/^[0-9A-Za-z]{4,20}$/.test(acct)) return toast('Số tài khoản chưa hợp lệ.');
    c.bank = { bin: v.bin || '', acct, holder: noTone(v.holder || '').toUpperCase().trim() }; save(); toast(bankReady(c.bank) ? 'Đã lưu, VietQR sẵn sàng!' : 'Đã lưu.');
  },
};

/* ---------- thay đổi tại chỗ (data-chg) ---------- */
const CHG = {
  regSportName: el => { UI.reg.sportName = el.value; },
  checkChip: el => el.closest('label').classList.toggle('on', el.checked),
  radioChip: el => el.closest('form').querySelectorAll(`input[name="${el.name}"]`).forEach(i => i.closest('label').classList.toggle('on', i.checked)),
  cost: el => { const s = curSession(); const x = s && s.costs[Number(el.dataset.i)]; if (!x) return; if (el.dataset.f === 'amount') x.amount = parseMoney(el.value); else x.label = el.value.trim() || 'Chi phí'; save(); later(render); },
  payer: el => { const s = curSession(); s.payer = el.value; save(); later(render); },
  custom: el => { const s = curSession(); s.custom ||= {}; s.custom[el.dataset.mid] = parseMoney(el.value); save(); later(render); },
  guestAmt: el => { const s = curSession(); const g = s.guests[Number(el.dataset.i)]; if (g) g.amount = parseMoney(el.value); save(); later(render); },
  search: el => { UI.q = el.value; later(render); },
};

/* giữ con trỏ khi vẽ lại màn hình */
const _render = render;
render = function () {
  const a = document.activeElement; let key = null, sel = null;
  if (a && a.matches && a.matches('input,select,textarea') && $('#app').contains(a)) {
    key = a.id ? '#' + CSS.escape(a.id) : ['data-chg', 'data-i', 'data-f', 'data-mid'].filter(k => a.hasAttribute(k)).map(k => `[${k}="${CSS.escape(a.getAttribute(k))}"]`).join('');
    try { sel = [a.selectionStart, a.selectionEnd]; } catch (e) {}
  }
  // giữ chữ đang gõ dở khi màn hình vẽ lại (thông báo tắt, dữ liệu mới về…)
  const dirty = [];
  $('#app').querySelectorAll('input[id],textarea[id],select[id]').forEach(i => {
    if (i.type === 'file' || i.hasAttribute('data-chg')) return;
    if (i.type === 'checkbox' || i.type === 'radio') { if (i.checked !== i.defaultChecked) dirty.push([i.id, 'checked', i.checked]); }
    else if (i.tagName === 'SELECT') { const d = [...i.options].find(o => o.defaultSelected); if (i.value !== (d ? d.value : (i.options[0] || {}).value)) dirty.push([i.id, 'value', i.value]); }
    else if (i.value !== i.defaultValue) dirty.push([i.id, 'value', i.value]);
  });
  _render();
  dirty.forEach(([id, prop, val]) => { const n = document.getElementById(id); if (n && $('#app').contains(n)) n[prop] = val; });
  if (key) { const b = $('#app').querySelector(key); if (b) { b.focus({ preventScroll: true }); try { if (sel && sel[0] != null) b.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
};

/* ---------- sự kiện ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act],[data-stop]'); if (!el) return;
  if (el.hasAttribute('data-stop') && !el.hasAttribute('data-act')) return;
  if (el.tagName === 'LABEL') return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  e.preventDefault();
  Promise.resolve(fn(el, e)).then(() => render()).catch(err => { console.error(err); toast('Có lỗi: ' + err.message); });
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
  const fd = new FormData(f); const v = {}; for (const [k, val] of fd.entries()) if (!(k in v)) v[k] = typeof val === 'string' ? val : '';
  const fn = FORMS[f.dataset.form]; if (!fn) return;
  Promise.resolve(fn(v, f, e.submitter)).then(() => render()).catch(err => { console.error(err); UI.busy = false; toast('Có lỗi: ' + err.message); });
});
document.addEventListener('change', e => {
  if (e.target.id === 'importFile' && e.target.files && e.target.files[0]) { readImport(e.target.files[0]); e.target.value = ''; return; }
  const el = e.target.closest('[data-chg]');
  if (el && CHG[el.dataset.chg] && el.dataset.chg !== 'search') CHG[el.dataset.chg](el);
  if (e.target.matches('label.check input[type="checkbox"]')) e.target.closest('.check').classList.toggle('on', e.target.checked);
});
document.addEventListener('toggle', e => { if (e.target.matches && e.target.matches('details[data-k="votes"]')) UI.voteOpen = e.target.open; }, true);
document.addEventListener('input', e => {
  const el = e.target.closest('[data-chg="search"],[data-chg="regSportName"]'); if (el) CHG[el.dataset.chg](el);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && UI.sheet) closeSheet(); });

/* nút Back của điện thoại */
window.addEventListener('popstate', () => {
  const v = UI.view;
  if (UI.sheet) closeSheet();
  else if (v === 'register' && UI.reg.step > 1) ACT.regBack();
  else if (v === 'legal') ACT.closeLegal();
  else if (v === 'club' && canAdmin(club()) && UI.atab !== 'home') { UI.atab = 'home'; render(); }
  else if (v === 'club' && !canAdmin(club()) && UI.tab !== 'home') { UI.tab = 'home'; render(); }
  else if (v === 'session') { UI.view = 'club'; render(); }
  else if (v === 'shared' && UI.sharedMid) { UI.sharedMid = null; render(); }
  else if (v === 'club' && club() && club().demo) { ACT.exitDemo(); return; }
  else if (['club', 'account', 'register', 'join'].includes(v) && ME) { UI.view = 'home'; render(); }
  else if (['auth', 'register', 'join'].includes(v)) { UI.view = 'welcome'; render(); }
  else return; // màn gốc: cho trình duyệt quay lại bình thường
  try { history.pushState({ v: UI.view }, ''); } catch (e) {}
});

/* ---------- điều hướng sau khi biết trạng thái đăng nhập ---------- */
function route(first) {
  if (UI.view === 'shared' && UI.shared) return render();
  if (ME) {
    if (DEV.pendingJoin) return openJoin(DEV.pendingJoin);
    if (UI.after === 'register') { UI.after = null; return go('register', { reg: { step: 1, days: [], time: '19:00' } }); }
    if (UI.after === 'demo') { UI.after = null; return ACT.demo(); }
    if (UI.after === 'legal') { UI.after = null; UI.legalBack = 'home'; return go('legal'); }
    if (first || ['loading', 'welcome', 'auth'].includes(UI.view)) return go('home');
    return render();
  }
  if (DEV.pendingJoin && CLOUD) return go('join', { join: { code: DEV.pendingJoin } });
  if (UI.after === 'demo') { UI.after = null; return ACT.demo(); }
  if (UI.after === 'legal') { UI.after = null; UI.legalBack = 'welcome'; return go('legal'); }
  if (club() && club().demo && ['club', 'session'].includes(UI.view)) return render(); // đang chơi thử
  return go('welcome');
}

/* ---------- khởi động ---------- */
async function boot() {
  applyTheme();
  render();
  const hash = location.hash;
  const sm = hash.match(/[#&]s=([A-Za-z0-9_-]+)/);
  if (sm) { try { UI.shared = await decodeShare(sm[1]); UI.view = 'shared'; render(); } catch (e) { setTimeout(() => toast('Link xem nhanh bị lỗi hoặc không đầy đủ.'), 50); } }
  const jm = hash.match(/[#&]join=([A-Za-z0-9]+)/);
  if (jm) { DEV.pendingJoin = jm[1]; persistLocal(); }
  const dl = (hash.match(/^#(register|demo|admin|members|legal)$/) || [])[1];
  if (dl === 'register' || dl === 'demo' || dl === 'legal') UI.after = dl;
  if (jm || dl) try { history.replaceState(null, '', appBase() + location.search); } catch (e) {}
  try { history.replaceState({ v: 'root' }, ''); history.pushState({ v: 'app' }, ''); } catch (e) {}

  await cloudReady;
  if (CLOUD) {
    let first = true;
    CLOUD.onAuth(user => {
      const prev = ME && ME.uid;
      if (user) { if (prev !== user.uid) startCloud(user); else ME = user; }
      else if (prev) stopCloud();
      AUTH_READY = true;
      if (first || !!user !== !!prev) { const f = first; first = false; route(f); }
      else render();
    });
  } else { AUTH_READY = true; route(true); }
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
