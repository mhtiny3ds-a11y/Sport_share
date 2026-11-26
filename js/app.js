/* Sport Share — hành động, biểu mẫu, điều hướng, khởi động. */
'use strict';

const ADMIN_IDLE = 10 * 60 * 1000; // khu quản trị tự khóa sau 10 phút không thao tác

/* ---------- tiện ích ---------- */
const curSession = () => { const c = club(); return c && c.sessions.find(s => s.id === UI.sid); };
const save = () => persist();
const later = fn => setTimeout(fn, 0);
async function copyText(t, msg = 'Đã chép!') {
  try { await navigator.clipboard.writeText(t); toast(msg); return; } catch (e) {}
  const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast(msg); } catch (e) { toast('Không chép được, hãy chép thủ công.'); }
  ta.remove();
}
function applyTheme() { const t = DEV.theme || 'auto'; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
function sheet(fn) { UI.err = ''; UI.sheet = fn; render(); }
function closeSheet() { UI.sheet = null; UI.editAvatar = null; UI.err = ''; if (UI.confirm === 'delMember') UI.confirm = null; render(); }
function enterAdmin(c, extra = {}) { DEV.clubId = c.id; DEV.session = { role: 'admin', cid: c.id, at: Date.now() }; save(); go('admin', { atab: 'home', ...extra }); }
function enterMember(c, m) { DEV.clubId = c.id; DEV.session = { role: 'member', cid: c.id, mid: m.id }; save(); go('member', { tab: 'home' }); }
function lockIfIdle() {
  if (DEV.session && DEV.session.role === 'admin' && Date.now() - (DEV.session.at || 0) > ADMIN_IDLE) {
    DEV.session = null; save(); go('pin', { pinFor: '__admin', pinBack: 'profiles', locked: true }); return true;
  }
  if (DEV.session && DEV.session.role === 'admin') DEV.session.at = Date.now();
  return false;
}

/* ---------- văn bản thông báo / nhắc nợ ---------- */
function bankLine(c) { return bankReady(c.bank) ? `🏦 ${bankName(c.bank.bin)} · ${c.bank.acct}${c.bank.holder ? ' · ' + c.bank.holder : ''}` : ''; }
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
  } else if (s.status === 'cancelled') {
    L.push('', `❌ ${cap1(sp.unit)} này đã HỦY.`);
  } else {
    const yes = Object.entries(s.rsvp || {}).filter(([, r]) => r === 'yes').map(([id]) => memberOf(c, id)).filter(Boolean);
    L.push('', `🙋 Đã đăng ký (${yes.length}): ${yes.map(m => m.name).join(', ') || 'chưa có ai'}`);
    L.push('👉 Ai tham gia thả tim hoặc báo trong nhóm nha!');
  }
  return L.join('\n');
}
function reminderText(c, m) {
  const un = unpaidOf(c, m.id).sort((a, b) => a.date.localeCompare(b.date)); const d = debtOf(c, m.id);
  const L = [`Chào ${m.name} 👋`, `${c.name} nhắc nhẹ: bạn còn ${vnd(d)} chưa thanh toán:`];
  un.forEach(x => L.push(`• ${x.label}: ${vnd(x.amount)}`));
  if (bankLine(c)) L.push('', bankLine(c), `✍️ Nội dung: ${transferNote(c, m.name)}`);
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
    up: upcoming(c).slice(0, 5).map(s => [s.date, s.time || '', s.venue || '', Object.values(s.rsvp || {}).filter(r => r === 'yes').length]),
    r: rankList(c, 'month').list.filter(x => x.n).slice(0, 10).map(x => [x.m.id, x.n]),
  };
}
const shareBase = () => location.href.split('#')[0];

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
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Đã tải ảnh mã QR. Mở app ngân hàng, chọn quét mã từ ảnh nhé!');
  } catch (e) { console.error(e); toast('Chưa tải được ảnh. Hãy chụp màn hình mã QR thay nhé!'); }
}

/* ---------- sao lưu ---------- */
function exportData() {
  const c = club(); const clubs = c ? [c] : Object.values(STORE.clubs);
  const blob = new Blob([JSON.stringify({ app: 'sportshare', v: 1, at: Date.now(), clubs }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `SportShare-${noTone(c ? c.name : 'tat-ca').replace(/[^A-Za-z0-9]+/g, '-')}-${dayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Đã tải file sao lưu. Hãy cất giữ cẩn thận!');
}
async function readImport(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || data.app !== 'sportshare' || !Array.isArray(data.clubs) || !data.clubs.length) throw new Error('bad');
    if (!data.clubs.every(c => c && c.id && c.name && Array.isArray(c.members))) throw new Error('bad');
    UI.importData = { clubs: data.clubs, names: data.clubs.map(c => c.name).join(', ') }; UI.confirm = 'import'; render();
  } catch (e) { toast('File không đúng định dạng sao lưu Sport Share.'); }
}

/* ---------- hành động (data-act) ---------- */
const ACT = {
  go: el => go(el.dataset.v),
  closeSheet,
  cancelConfirm: () => { UI.confirm = null; UI.importData = null; render(); },
  copy: el => copyText(el.dataset.t),
  theme: el => { DEV.theme = el.dataset.k; save(); applyTheme(); render(); },
  openLegal: () => { UI.legalBack = UI.view; go('legal'); },
  closeLegal: () => go(UI.legalBack && UI.legalBack !== 'legal' ? UI.legalBack : 'welcome'),
  donatePick: el => { UI.donateIdx = Number(el.dataset.i); render(); },
  downloadDonate: () => { const o = DONATE_OPTS[UI.donateIdx ?? 1]; saveQRImage({ title: 'SPORT SHARE ☕', sub: 'Cảm ơn bạn đã mời Team Sport Share ly cafe', payload: vietQR({ bin: DONATE.bin, acct: DONATE.acct, amount: o.amount, note: DONATE.note }), lines: [['Người nhận', DONATE.name + ' · ' + DONATE.bank], ['Số tài khoản', DONATE.acct], ['Ly cafe', o.amount ? o.label : 'Tùy tâm', true], ['Nội dung', DONATE.note]], file: `SportShare-cafe-${o.slug}.png` }); },
  demo: async () => { const c = await seedDemo(); DEV.clubId = c.id; save(); toast('Đã mở hội mẫu. Chọn tên hoặc đăng nhập quản trị.'); go('profiles'); },
  toMembers: () => { const c = club(); if (DEV.session && DEV.session.role === 'member' && curMember()) return go('member'); go(c ? 'profiles' : 'clubs'); },
  pickClub: el => { DEV.clubId = el.dataset.id; save(); go('profiles'); },
  pinFor: el => go('pin', { pinFor: el.dataset.mid, pinBack: 'profiles', locked: false }),
  pinKey: el => {
    const k = el.dataset.k;
    if (k === 'del') { UI.pin = UI.pin.slice(0, -1); UI.pinBad = false; return render(); }
    if (UI.pin.length >= 4) return;
    UI.pin += k; UI.pinBad = false; render();
    if (UI.pin.length === 4) setTimeout(() => {
      const c = club(); if (!c) return go('welcome');
      if (UI.pinFor === '__admin') { if (UI.pin === c.admin.pin) return enterAdmin(c); }
      else { const m = memberOf(c, UI.pinFor); if (m && UI.pin === m.pin) return enterMember(c, m); }
      UI.pin = ''; UI.pinBad = true; render();
    }, 160);
  },
  switchUser: () => { DEV.session = null; save(); go('profiles'); },
  logout: () => { DEV.session = null; save(); go('welcome'); },
  lockAdmin: () => { DEV.session = null; save(); toast('Đã khóa khu quản trị.'); go('profiles'); },
  toMemberView: () => { DEV.session = null; save(); go('profiles'); },

  /* lập hội */
  startReg: () => go('register', { reg: { step: 1, days: [], time: '19:00' } }),
  regSport: el => { UI.reg.sport = el.dataset.k; UI.err = ''; render(); },
  regNext: () => {
    const r = UI.reg; if (!r.sport) return;
    if (r.sport === 'other' && !(r.sportName || '').trim()) { UI.err = 'Nhập tên môn thể thao nhé.'; return render(); }
    UI.err = ''; r.step = 2; render(); window.scrollTo(0, 0);
  },
  regBack: () => { UI.reg.step = Math.max(1, UI.reg.step - 1); UI.err = ''; render(); },

  /* hội viên */
  tab: el => { UI.tab = el.dataset.t; UI.err = ''; render(); window.scrollTo(0, 0); },
  rsvp: el => {
    const c = club(), m = curMember(); if (!c || !m) return;
    const s = c.sessions.find(x => x.id === el.dataset.sid); if (!s || s.status !== 'open') return;
    s.rsvp ||= {}; s.rsvp[m.id] = s.rsvp[m.id] === el.dataset.r ? undefined : el.dataset.r; if (!s.rsvp[m.id]) delete s.rsvp[m.id];
    save(); toast(s.rsvp[m.id] === 'yes' ? 'Đã đăng ký tham gia 💪' : s.rsvp[m.id] === 'no' ? 'Đã báo vắng.' : 'Đã bỏ đăng ký.');
  },
  viewSession: el => { const c = club(); const s = c && c.sessions.find(x => x.id === el.dataset.sid); if (s) sheet(() => sessionSheet(club(), club().sessions.find(x => x.id === s.id), curMember() && curMember().id)); },
  rankPeriod: el => { UI.rankPeriod = el.dataset.p; render(); },
  myAvatar: el => { const m = curMember(); if (!m) return; m.avatar = el.dataset.a; save(); render(); },
  downloadPayQR: el => {
    const c = club(), m = memberOf(c, el.dataset.mid); if (!c || !m || !bankReady(c.bank)) return;
    const d = debtOf(c, m.id), note = transferNote(c, m.name);
    saveQRImage({ title: c.name.toUpperCase().slice(0, 28), sub: `Thanh toán của ${m.name}`, payload: vietQR({ bin: c.bank.bin, acct: c.bank.acct, amount: d, note }), lines: [['Ngân hàng', bankName(c.bank.bin)], ['Số tài khoản', c.bank.acct], ['Chủ tài khoản', c.bank.holder || ''], ['Số tiền', vnd(d), true], ['Nội dung', note]], file: `SportShare-${noTone(m.name).replace(/\W+/g, '-')}-${dayKey()}.png` });
  },

  /* quản trị: điều hướng */
  atab: el => { UI.atab = el.dataset.t; UI.sheet = null; UI.err = ''; UI.confirm = null; if (UI.view !== 'admin') go('admin'); else { render(); window.scrollTo(0, 0); } },
  backToAdmin: () => go('admin', { atab: UI.atab === 'home' ? 'home' : 'sessions' }),
  dismissFresh: () => { UI.fresh = false; render(); },
  sessFilter: el => { UI.sessFilter = el.dataset.k; render(); },
  moneyTab: el => { UI.moneyTab = el.dataset.k; render(); },

  /* buổi chơi */
  newSession: () => { UI.editSid = null; sheet(() => sessionFormSheet(club(), null)); },
  editSession: () => { UI.editSid = UI.sid; sheet(() => sessionFormSheet(club(), curSession())); },
  openSession: el => go('session', { sid: el.dataset.sid }),
  toggleAtt: el => { const s = curSession(); if (!s || s.status !== 'open') return; const id = el.dataset.mid; s.attendees = s.attendees.includes(id) ? s.attendees.filter(x => x !== id) : [...s.attendees, id]; s.teams = null; save(); render(); },
  attFromRsvp: () => { const s = curSession(); if (!s) return; const c = club(); s.attendees = Object.entries(s.rsvp || {}).filter(([id, r]) => r === 'yes' && memberOf(c, id)).map(([id]) => id); s.teams = null; save(); toast(`Đã điểm danh ${s.attendees.length} người theo đăng ký.`); },
  guestSheet: () => sheet(() => guestSheet(club(), curSession())),
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
    if (sp.split === 'pairs' && s.teamsMode !== 'teams') { s.teams = makePairs(players, lv); s.teamsMode = 'pairs'; }
    else { s.teams = makeTeams(players, sp.split === 'pairs' ? 2 : (s.teamsK || sp.teams || 2), lv); s.teamsMode = 'teams'; }
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
    if (k === 'delSession') { c.sessions = c.sessions.filter(x => x.id !== s.id); c.charges = c.charges.filter(x => x.ref !== s.id); save(); toast('Đã xóa.'); return go('admin', { atab: 'sessions' }); }
    if (k === 'reopenSession') { c.charges = c.charges.filter(x => x.ref !== s.id); s.status = 'open'; s.settledAt = null; save(); toast('Đã mở lại, công nợ của buổi đã được gỡ.'); return render(); }
    if (k === 'cancelSession') { s.status = 'cancelled'; save(); toast('Đã hủy.'); return render(); }
    render();
  },
  copyAnnounce: () => copyText(announceText(club(), curSession()), 'Đã chép thông báo, dán vào nhóm Zalo/Messenger nhé!'),

  /* tiền */
  debtSheet: el => { const id = el.dataset.mid; sheet(() => debtSheet(club(), memberOf(club(), id))); },
  togglePaid: el => { const c = club(); const x = c.charges.find(y => y.id === el.dataset.cid); if (!x) return; x.paid = !x.paid; x.paidAt = x.paid ? Date.now() : null; save(); toast(x.paid ? `Đã gạch ${vnd(x.amount)}.` : 'Đã hoàn tác.'); },
  payAll: el => { const c = club(); const un = unpaidOf(c, el.dataset.mid); const sum = un.reduce((a, x) => a + x.amount, 0); un.forEach(x => { x.paid = true; x.paidAt = Date.now(); }); save(); toast(`Đã thu đủ ${vnd(sum)}.`); },
  delCharge: el => { const c = club(); c.charges = c.charges.filter(x => x.id !== el.dataset.cid); save(); render(); },
  copyReminder: el => { const c = club(); copyText(reminderText(c, memberOf(c, el.dataset.mid)), 'Đã chép tin nhắc nợ.'); },
  copyAllReminders: () => {
    const c = club(); const rows = c.members.map(m => [m, debtOf(c, m.id)]).filter(([, d]) => d > 0).sort((a, b) => b[1] - a[1]);
    const t = [`💸 ${c.name.toUpperCase()} · CÔNG NỢ ${fmtDate(dayKey())}`, ...rows.map(([m, d], i) => `${i + 1}. ${m.name}: ${vnd(d)}`), `Tổng: ${vnd(totalDebt(c))}`, bankLine(c) ? '\n' + bankLine(c) + `\n✍️ Nội dung: ${initials(c.name)} <Tên của bạn>` : ''].join('\n');
    copyText(t, 'Đã chép danh sách công nợ.');
  },
  chargeSheet: el => { const k = el.dataset.k; sheet(() => chargeSheet(club(), k)); },
  chkAll: el => { const f = el.closest('form'); f.querySelectorAll('input[name="m"]').forEach(i => { i.checked = el.dataset.v === '1'; i.closest('.check').classList.toggle('on', i.checked); }); },
  fundSheet: el => { const k = el.dataset.k; sheet(() => fundSheet(k)); },
  delFund: el => { const c = club(); c.fund = c.fund.filter(x => x.id !== el.dataset.id); save(); render(); },

  /* hội viên (quản trị) */
  memberSheet: el => { const id = el.dataset.mid; UI.editAvatar = null; UI.confirm = null; sheet(() => memberSheet(club(), id ? memberOf(club(), id) : null)); },
  pickAvatar: el => { const f = el.closest('form'); f.querySelector('input[name="avatar"]').value = el.dataset.a; UI.editAvatar = el.dataset.a; f.querySelectorAll('[data-act="pickAvatar"]').forEach(b => b.classList.toggle('on', b === el)); },
  toggleActive: el => { const m = memberOf(club(), el.dataset.mid); m.active = m.active === false; save(); toast(m.active ? 'Đã cho quay lại hội.' : 'Đã chuyển sang nghỉ. Lịch sử vẫn được giữ.'); },
  delMember: () => { UI.confirm = 'delMember'; render(); },
  doDelMember: el => { const c = club(), id = el.dataset.mid; c.members = c.members.filter(m => m.id !== id); c.charges = c.charges.filter(x => x.mid !== id); c.sessions.forEach(s => { s.attendees = s.attendees.filter(x => x !== id); if (s.rsvp) delete s.rsvp[id]; }); UI.confirm = null; UI.sheet = null; save(); toast('Đã xóa hội viên.'); },
  copyPins: () => { const c = club(); copyText([`🔑 MÃ PIN ${c.name.toUpperCase()}`, ...activeMembers(c).map(m => `${m.name}: ${m.pin}`)].join('\n'), 'Đã chép danh sách PIN. Chỉ gửi riêng cho từng người nhé!'); },

  /* cài đặt */
  shareLink: async () => { const c = club(); const code = await encodeShare(shareSnapshot(c)); copyText(`${sportOf(c).ic} ${c.name} · lịch & công nợ (cập nhật ${fmtDate(dayKey())}):\n${shareBase()}#s=${code}`, 'Đã chép link xem nhanh. Gửi vào nhóm của hội nhé!'); },
  previewShared: () => { UI.shared = shareSnapshot(club()); UI.sharedMid = null; UI.sharedPreview = true; go('shared'); },
  closePreview: () => { UI.sharedPreview = false; UI.shared = null; go('admin', { atab: 'settings' }); },
  sharedPick: el => { UI.sharedMid = el.dataset.mid || null; render(); window.scrollTo(0, 0); },
  leaveShared: () => { UI.shared = null; try { history.replaceState(null, '', shareBase()); } catch (e) {} go('welcome'); },
  exportData,
  doImport: () => {
    const d = UI.importData; if (!d) return;
    d.clubs.forEach(c => { STORE.clubs[c.id] = normalizeClub(c); });
    DEV.clubId = d.clubs[0].id; UI.confirm = null; UI.importData = null; save();
    toast(`Đã khôi phục ${d.clubs.length} hội.`); go(isAdmin() ? 'admin' : 'profiles');
  },
  askDelClub: () => { UI.confirm = 'delClub'; render(); },
  doDelClub: () => { delete STORE.clubs[DEV.clubId]; DEV.clubId = null; DEV.session = null; save(); toast('Đã xóa hội khỏi máy.'); go('welcome'); },
};

/* ---------- biểu mẫu (data-form) ---------- */
const FORMS = {
  async adminLogin(v) {
    const login = normLogin(v.login), h = await hashPw(v.pass || '');
    const found = Object.values(STORE.clubs).filter(c => normLogin(c.admin.login) === login && c.admin.pw === h);
    if (!found.length) { UI.err = 'Sai thông tin đăng nhập, hoặc hội chưa có trên máy này.'; return render(); }
    if (found.length === 1) return enterAdmin(found[0]);
    sheet(() => `<h2 class="h2 disp">Chọn hội</h2><p class="muted b">Tài khoản này quản lý ${found.length} hội.</p><div class="stack">${found.map(c => `<button class="choice" data-act="adminPick" data-id="${c.id}"><span class="ic">${sportOf(c).ic}</span><span><b>${esc(c.name)}</b><span class="tiny muted b">${esc(sportOf(c).name)}</span></span></button>`).join('')}</div>`);
  },
  async forgot(v) {
    const login = normLogin(v.login);
    if ((v.pass || '').length < 6) { UI.err = 'Mật khẩu mới cần ít nhất 6 ký tự.'; return render(); }
    const found = Object.values(STORE.clubs).filter(c => normLogin(c.admin.login) === login && c.admin.pin === v.apin);
    if (!found.length) {
      UI.forgotTries = (UI.forgotTries || 0) + 1;
      if (UI.forgotTries >= 5) { UI.forgotLock = Date.now() + 60000; UI.forgotTries = 0; setTimeout(render, 60500); }
      UI.err = 'Thông tin chưa đúng.'; return render();
    }
    const h = await hashPw(v.pass); found.forEach(c => c.admin.pw = h); save(); toast('Đã đặt mật khẩu mới.'); go('adminLogin');
  },
  reg2(v, f) {
    const r = UI.reg; r.name = (v.name || '').trim(); r.venue = (v.venue || '').trim(); r.time = v.time || '';
    r.days = [...f.querySelectorAll('input[name="days"]:checked')].map(i => Number(i.value));
    if (!r.name) { UI.err = 'Đặt tên cho hội nhé.'; return render(); }
    UI.err = ''; r.step = 3; render(); window.scrollTo(0, 0);
  },
  async reg3(v) {
    const r = UI.reg; r.aname = (v.name || '').trim(); r.login = (v.login || '').trim();
    if (!r.aname) { UI.err = 'Nhập tên hiển thị.'; return render(); }
    if (!normLogin(r.login)) { UI.err = 'Nhập số điện thoại hoặc email để đăng nhập.'; return render(); }
    if ((v.pass || '').length < 6) { UI.err = 'Mật khẩu cần ít nhất 6 ký tự.'; return render(); }
    if (!validPin(v.apin)) { UI.err = 'Mã PIN quản trị gồm đúng 4 chữ số.'; return render(); }
    const c = normalizeClub({ id: uid('club_'), sport: r.sport, sportName: r.sport === 'other' ? (r.sportName || '').trim() : '', name: r.name, createdAt: Date.now(),
      admin: { name: r.aname, login: r.login, pw: await hashPw(v.pass), pin: v.apin },
      schedule: { days: r.days || [], time: r.time || '19:00', venue: r.venue || '' }, settings: { round: 1000 } });
    STORE.clubs[c.id] = c; enterAdmin(c, { fresh: true, reg: { step: 1 } });
    toast(`Đã lập hội ${c.name}! 🎉`);
  },
  myPin(v) {
    const m = curMember(); if (!m) return;
    if (v.old !== m.pin) { UI.err = 'PIN hiện tại chưa đúng.'; return render(); }
    if (!validPin(v.pin)) { UI.err = 'PIN mới gồm đúng 4 chữ số.'; return render(); }
    m.pin = v.pin; UI.err = ''; save(); toast('Đã đổi mã PIN.');
  },
  session(v) {
    const c = club(); if (!v.date) { UI.err = 'Chọn ngày.'; return render(); }
    if (UI.editSid) {
      const s = c.sessions.find(x => x.id === UI.editSid); Object.assign(s, { date: v.date, time: v.time, venue: (v.venue || '').trim(), note: (v.note || '').trim() });
      UI.sheet = null; save(); toast('Đã lưu.'); return;
    }
    const prev = c.sessions.filter(s => (s.costs || []).length).sort((a, b) => b.date.localeCompare(a.date))[0];
    const costs = prev ? prev.costs.map(x => ({ label: x.label, amount: x.amount })) : sportOf(c).costs.map(l => ({ label: l, amount: 0 }));
    const s = { id: uid('s_'), date: v.date, time: v.time, venue: (v.venue || '').trim(), note: (v.note || '').trim(), status: 'open', rsvp: {}, attendees: [], guests: [], costs, split: 'equal', payer: prev ? prev.payer || '' : '', teams: null, createdAt: Date.now() };
    c.sessions.push(s); if (v.venue) c.schedule.venue = c.schedule.venue || v.venue.trim();
    save(); toast(`Đã tạo ${sportOf(c).unit}. ${prev ? 'Chi phí lấy theo buổi trước, sửa nếu cần.' : 'Nhập chi phí khi có nhé.'}`);
    go('session', { sid: s.id });
  },
  guest(v) {
    const s = curSession(); const name = (v.name || '').trim(); if (!name) return;
    s.guests ||= []; s.guests.push({ name, host: v.host || '' }); s.teams = null; UI.sheet = null; save(); render();
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
  member(v, f) {
    const c = club(); const id = f.dataset.mid; const name = (v.name || '').trim();
    if (!name) { UI.err = 'Nhập tên hội viên.'; return render(); }
    if (!validPin(v.pin)) { UI.err = 'Mã PIN gồm đúng 4 chữ số.'; return render(); }
    const data = { name, phone: (v.phone || '').trim(), pin: v.pin, level: Number(v.level) || 3, avatar: v.avatar || '🙂' };
    if (id) { Object.assign(memberOf(c, id), data); toast('Đã lưu.'); }
    else { c.members.push({ id: uid('m_'), ...data, active: true, joinedAt: Date.now() }); toast(`Đã thêm ${name} · PIN ${v.pin}`); }
    UI.sheet = null; UI.editAvatar = null; UI.fresh = false; save(); render();
  },
  clubInfo(v, f) {
    const c = club(); const name = (v.name || '').trim(); if (!name) return toast('Tên hội không được trống.');
    c.name = name; c.sport = v.sport || c.sport; if (c.sport === 'other') c.sportName = (v.sportName || c.sportName || '').trim();
    c.schedule.venue = (v.venue || '').trim(); c.schedule.time = v.time || ''; c.schedule.days = [...f.querySelectorAll('input[name="days"]:checked')].map(i => Number(i.value));
    c.settings.round = Number(v.round) || 1; save(); toast('Đã lưu thông tin hội.');
  },
  bank(v) {
    const c = club(); const acct = String(v.acct || '').replace(/\s/g, '');
    if (v.bin && !/^[0-9A-Za-z]{4,20}$/.test(acct)) return toast('Số tài khoản chưa hợp lệ.');
    c.bank = { bin: v.bin || '', acct, holder: noTone(v.holder || '').toUpperCase().trim() }; save(); toast(bankReady(c.bank) ? 'Đã lưu, VietQR sẵn sàng!' : 'Đã lưu.');
  },
  async adminAcct(v) {
    const c = club(); if (!normLogin(v.login)) { UI.err = 'Cần số điện thoại hoặc email đăng nhập.'; return render(); }
    if (!validPin(v.apin)) { UI.err = 'PIN quản trị gồm đúng 4 chữ số.'; return render(); }
    if (v.pass && v.pass.length < 6) { UI.err = 'Mật khẩu mới cần ít nhất 6 ký tự.'; return render(); }
    c.admin.name = (v.name || '').trim(); c.admin.login = v.login.trim(); c.admin.pin = v.apin; if (v.pass) c.admin.pw = await hashPw(v.pass);
    UI.err = ''; save(); toast('Đã lưu tài khoản quản trị.');
  },
};
ACT.adminPick = el => { const c = STORE.clubs[el.dataset.id]; if (c) enterAdmin(c); };

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
  _render();
  if (key) { const b = $('#app').querySelector(key); if (b) { b.focus({ preventScroll: true }); try { if (sel && sel[0] != null) b.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
};

/* ---------- sự kiện ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act],[data-stop]'); if (!el) return;
  if (el.hasAttribute('data-stop') && !el.hasAttribute('data-act')) return;
  if (el.tagName === 'LABEL') return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  e.preventDefault();
  if (['admin', 'session'].includes(UI.view) && lockIfIdle()) return;
  Promise.resolve(fn(el, e)).catch(err => { console.error(err); toast('Có lỗi: ' + err.message); });
  if (!['pinKey'].includes(el.dataset.act) && ACT_RERENDER.has(el.dataset.act)) render();
});
const ACT_RERENDER = new Set(['rsvp', 'togglePaid', 'payAll', 'toggleActive', 'doDelMember', 'attFromRsvp', 'settle']);
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
  if (['admin', 'session'].includes(UI.view) && lockIfIdle()) return;
  const fd = new FormData(f); const v = {}; for (const [k, val] of fd.entries()) if (!(k in v)) v[k] = typeof val === 'string' ? val : '';
  const fn = FORMS[f.dataset.form]; if (!fn) return;
  Promise.resolve(fn(v, f)).then(() => { if (UI.view === 'admin' || UI.view === 'session' || UI.view === 'member') render(); }).catch(err => { console.error(err); toast('Có lỗi: ' + err.message); });
});
document.addEventListener('change', e => {
  if (e.target.id === 'importFile' && e.target.files && e.target.files[0]) { readImport(e.target.files[0]); e.target.value = ''; return; }
  const el = e.target.closest('[data-chg]');
  if (el && CHG[el.dataset.chg] && el.dataset.chg !== 'search') CHG[el.dataset.chg](el);
  if (e.target.matches('label.check input[type="checkbox"]')) e.target.closest('.check').classList.toggle('on', e.target.checked);
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-chg="search"],[data-chg="regSportName"]'); if (el) CHG[el.dataset.chg](el);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && UI.sheet) closeSheet();
  if (UI.view === 'pin' && !UI.sheet) { if (/^\d$/.test(e.key)) ACT.pinKey({ dataset: { k: e.key } }); else if (e.key === 'Backspace') ACT.pinKey({ dataset: { k: 'del' } }); }
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && ['admin', 'session'].includes(UI.view)) lockIfIdle(); else if (DEV.session && DEV.session.role === 'admin') save(); });

/* nút Back của điện thoại */
const BACK = { adminLogin: 'welcome', forgot: 'adminLogin', register: 'welcome', clubs: 'welcome', profiles: 'welcome', pin: 'profiles', session: 'admin', legal: null };
window.addEventListener('popstate', () => {
  const v = UI.view;
  if (UI.sheet) { closeSheet(); }
  else if (v === 'register' && UI.reg.step > 1) { ACT.regBack(); }
  else if (v === 'legal') { const b = UI.legalBack && UI.legalBack !== 'legal' ? UI.legalBack : 'welcome'; UI.view = b; render(); }
  else if (v === 'admin' && UI.atab !== 'home') { UI.atab = 'home'; render(); }
  else if (v === 'member' && UI.tab !== 'home') { UI.tab = 'home'; render(); }
  else if (v === 'shared' && UI.sharedMid) { UI.sharedMid = null; render(); }
  else if (BACK[v]) { UI.view = v === 'session' ? 'admin' : BACK[v]; UI.err = ''; UI.pin = ''; render(); }
  else return; // màn gốc: cho trình duyệt quay lại bình thường
  try { history.pushState({ v: UI.view }, ''); } catch (e) {}
});

/* ---------- khởi động ---------- */
async function boot() {
  applyTheme();
  const m = location.hash.match(/[#&]s=([A-Za-z0-9_-]+)/);
  if (m) {
    try { UI.shared = await decodeShare(m[1]); UI.view = 'shared'; }
    catch (e) { UI.view = 'welcome'; setTimeout(() => toast('Link xem nhanh bị lỗi hoặc không đầy đủ.'), 50); }
  } else {
    const c = club(), s = DEV.session;
    if (c && s && s.cid === c.id && s.role === 'member' && memberOf(c, s.mid)) UI.view = 'member';
    else if (c && s && s.cid === c.id && s.role === 'admin') {
      if (Date.now() - (s.at || 0) > ADMIN_IDLE) { DEV.session = null; save(); Object.assign(UI, { view: 'pin', pinFor: '__admin', pinBack: 'profiles', locked: true }); }
      else { UI.view = 'admin'; s.at = Date.now(); save(); }
    } else if (s) { DEV.session = null; save(); }
  }
  // đường dẫn nhanh từ trang giới thiệu (landing): #register, #demo, #admin, #members, #legal
  const dl = !m && (location.hash.match(/^#(register|demo|admin|members|legal)$/) || [])[1];
  if (dl) {
    const c = club(), live = UI.view === 'member' || UI.view === 'admin';
    if (dl === 'register') Object.assign(UI, { view: 'register', reg: { step: 1, days: [], time: '19:00' } });
    else if (dl === 'demo') { const d = await seedDemo(); DEV.clubId = d.id; DEV.session = null; save(); UI.view = 'profiles'; setTimeout(() => toast('Đã mở hội mẫu. Chọn tên hoặc đăng nhập quản trị.'), 50); }
    else if (dl === 'admin' && UI.view !== 'admin') UI.view = 'adminLogin';
    else if (dl === 'members' && !live) UI.view = c ? 'profiles' : 'clubs';
    else if (dl === 'legal') Object.assign(UI, { view: 'legal', legalBack: live ? UI.view : 'welcome' });
  }
  try { history.replaceState({ v: 'root' }, '', dl ? location.pathname + location.search : undefined); history.pushState({ v: UI.view }, ''); } catch (e) {}
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
