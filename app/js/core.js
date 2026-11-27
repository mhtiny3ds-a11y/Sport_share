/* Sport Share — lõi: dữ liệu, môn thể thao, tiền, VietQR.
   Toàn bộ dữ liệu nằm trong localStorage của trình duyệt, không có máy chủ. */
'use strict';

const APP = { name: 'Sport Share', ver: '1.0.0' };

/* ===== Ủng hộ Sport Share (mời cafe) =====
   Mã VietQR được tạo ngay trong trình duyệt theo chuẩn EMVCo/Napas, không gọi dịch vụ ngoài. */
const DONATE = { bin: '970422', bank: 'MB Bank', acct: '141431319191', name: 'TAO MINH HIEN', note: 'Thank you Sport Share' };
const DONATE_OPTS = [
  { amount: 40000, label: 'Sữa đá', slug: 'sua-da' },
  { amount: 56000, label: 'Latte', slug: 'latte' },
  { amount: 66000, label: 'Cà phê Muối', slug: 'ca-phe-muoi' },
  { amount: 0, label: 'Tùy tâm', slug: 'tuy-tam' },
];

/* ===== Môn thể thao ===== */
/* split: 'pairs' = ghép cặp đôi; 'teams' = chia đội; 'groups' = chia nhóm tập */
const SPORTS = {
  badminton:  { name: 'Cầu lông',    ic: '🏸', c: '#0FA37F', unit: 'buổi', place: 'Sân',        costs: ['Tiền sân', 'Tiền cầu', 'Nước uống'],      split: 'pairs', teams: 0 },
  football:   { name: 'Bóng đá',     ic: '⚽', c: '#16A34A', unit: 'trận', place: 'Sân bóng',   costs: ['Tiền sân', 'Nước uống', 'Trọng tài'],     split: 'teams', teams: 2 },
  pickleball: { name: 'Pickleball',  ic: '🥎', c: '#D97706', unit: 'buổi', place: 'Sân',        costs: ['Tiền sân', 'Tiền bóng', 'Nước uống'],     split: 'pairs', teams: 0 },
  tennis:     { name: 'Tennis',      ic: '🎾', c: '#65A30D', unit: 'buổi', place: 'Sân',        costs: ['Tiền sân', 'Tiền bóng', 'Nhặt bóng'],     split: 'pairs', teams: 0 },
  tabletennis:{ name: 'Bóng bàn',    ic: '🏓', c: '#DC2626', unit: 'buổi', place: 'CLB',        costs: ['Tiền bàn', 'Tiền bóng', 'Nước uống'],     split: 'pairs', teams: 0 },
  volleyball: { name: 'Bóng chuyền', ic: '🏐', c: '#2563EB', unit: 'buổi', place: 'Sân',        costs: ['Tiền sân', 'Nước uống'],                  split: 'teams', teams: 2 },
  basketball: { name: 'Bóng rổ',     ic: '🏀', c: '#EA580C', unit: 'buổi', place: 'Sân',        costs: ['Tiền sân', 'Nước uống'],                  split: 'teams', teams: 2 },
  running:    { name: 'Chạy bộ',     ic: '🏃', c: '#E11D48', unit: 'buổi chạy', place: 'Điểm hẹn', costs: ['Nước & điện giải', 'Phí giải'],      split: 'groups', teams: 2 },
  cycling:    { name: 'Đạp xe',      ic: '🚴', c: '#0891B2', unit: 'chuyến', place: 'Điểm hẹn', costs: ['Ăn uống', 'Xe hỗ trợ'],                   split: 'groups', teams: 2 },
  swimming:   { name: 'Bơi lội',     ic: '🏊', c: '#0284C7', unit: 'buổi', place: 'Hồ bơi',     costs: ['Vé hồ bơi', 'Huấn luyện viên'],           split: 'groups', teams: 2 },
  gym:        { name: 'Gym · Fitness', ic: '🏋️', c: '#7C3AED', unit: 'buổi', place: 'Phòng tập', costs: ['Phí phòng tập', 'Huấn luyện viên'],     split: 'groups', teams: 2 },
  golf:       { name: 'Golf',        ic: '⛳', c: '#15803D', unit: 'vòng', place: 'Sân golf',   costs: ['Green fee', 'Caddie', 'Xe điện'],         split: 'groups', teams: 4 },
  chess:      { name: 'Cờ vua · Cờ tướng', ic: '♟️', c: '#475569', unit: 'buổi', place: 'Địa điểm', costs: ['Tiền chỗ', 'Nước uống'],         split: 'pairs', teams: 0 },
  other:      { name: 'Môn khác',    ic: '🏅', c: '#FF5A1F', unit: 'buổi', place: 'Địa điểm',   costs: ['Chi phí chung', 'Nước uống'],             split: 'teams', teams: 2 },
};
const sportOf = c => {
  const s = SPORTS[c && c.sport] || SPORTS.other;
  return c && c.sport === 'other' && c.sportName ? { ...s, name: c.sportName } : s;
};

const AVATARS = ['🦁', '🐯', '🦅', '🐺', '🦈', '🐉', '🦊', '🐻', '🐼', '🐝', '🦄', '🐬', '⚡', '🔥', '🚀', '👑', '🥇', '💪', '🎯', '🌪️', '🌟', '🍀', '🐆', '🦬'];
const AVA_BG = ['#FFE3D3', '#DDF5E6', '#DDE9FE', '#FFF0D1', '#F3E1FF', '#D9F6F4', '#FDE2E2', '#E7F7C4'];
const TEAM_COLORS = ['#FF5A1F', '#2F7CF6', '#12A150', '#A855F7', '#E11D48', '#0891B2', '#D97706', '#475569'];
const TEAM_NAMES = ['Đội Cam', 'Đội Xanh', 'Đội Lá', 'Đội Tím', 'Đội Đỏ', 'Đội Ngọc', 'Đội Vàng', 'Đội Xám'];

/* ===== Ngân hàng (mã BIN Napas cho VietQR) ===== */
const BANKS = [
  ['970436', 'Vietcombank'], ['970415', 'VietinBank'], ['970418', 'BIDV'], ['970405', 'Agribank'],
  ['970422', 'MB Bank'], ['970407', 'Techcombank'], ['970416', 'ACB'], ['970432', 'VPBank'],
  ['970423', 'TPBank'], ['970403', 'Sacombank'], ['970437', 'HDBank'], ['970441', 'VIB'],
  ['970443', 'SHB'], ['970431', 'Eximbank'], ['970426', 'MSB'], ['970448', 'OCB'],
  ['970440', 'SeABank'], ['970449', 'LPBank'], ['970428', 'Nam A Bank'], ['970409', 'Bac A Bank'],
  ['970425', 'ABBANK'], ['970433', 'VietBank'], ['970412', 'PVcomBank'], ['970454', 'BVBank (Bản Việt)'],
  ['970452', 'KienlongBank'], ['970419', 'NCB'], ['970400', 'Saigonbank'], ['970429', 'SCB'],
  ['546034', 'CAKE by VPBank'], ['546035', 'Ubank by VPBank'], ['963388', 'Timo'], ['970424', 'Shinhan Bank'],
  ['970457', 'Woori Bank'], ['970458', 'UOB Việt Nam'], ['422589', 'CIMB'], ['458761', 'HSBC'],
];
const bankName = bin => (BANKS.find(b => b[0] === bin) || [, ''])[1];

/* ===== tiện ích ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const uid = (p = '') => p + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 7);
const pad2 = n => String(n).padStart(2, '0');
const vnd = n => (Math.round(n || 0)).toLocaleString('vi-VN') + 'đ';
const vndShort = n => { n = Math.round(n || 0); if (Math.abs(n) >= 1e6) return (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'tr'; if (Math.abs(n) >= 1e3) return Math.round(n / 1e3) + 'k'; return n + 'đ'; };
const parseMoney = s => {
  const t = String(s ?? '').trim().toLowerCase().replace(/\s|đ|vnd/g, ''); if (!t) return 0;
  const m = t.match(/^([\d.,]+)(k|tr|m)?$/); if (!m) return Number(t.replace(/\D/g, '')) || 0;
  if (m[2]) return Math.round(parseFloat(m[1].replace(',', '.')) * (m[2] === 'k' ? 1e3 : 1e6)) || 0;
  return Number(m[1].replace(/\D/g, '')) || 0;
};
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const parseDay = k => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WD_FULL = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const fmtDate = k => { const d = parseDay(k); return `${WD[d.getDay()]}, ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`; };
const fmtDateLong = k => { const d = parseDay(k); return `${WD_FULL[d.getDay()]}, ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`; };
const fmtMonth = k => { const [y, m] = k.split('-'); return `${m}/${y}`; };
const fmtTs = ts => { const d = new Date(ts); return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`; };
const relDay = k => { const diff = Math.round((parseDay(k) - parseDay(dayKey())) / 864e5); if (diff === 0) return 'Hôm nay'; if (diff === 1) return 'Ngày mai'; if (diff === -1) return 'Hôm qua'; if (diff > 1 && diff < 7) return `${diff} ngày nữa`; if (diff < -1 && diff > -30) return `${-diff} ngày trước`; return ''; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const noTone = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
const initials = s => noTone(s).split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 4);
const avaBg = s => AVA_BG[[...String(s)].reduce((a, ch) => a + ch.codePointAt(0), 0) % AVA_BG.length];
const ava = (m, cls = '') => `<span class="ava ${cls}" style="--ac:${avaBg(m && (m.avatar + m.id))}" aria-hidden="true">${m ? esc(m.avatar || '🙂') : '🙂'}</span>`;
const lvStars = n => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));


function normalizeClub(c) {
  c.members ||= []; c.sessions ||= []; c.charges ||= []; c.fund ||= [];
  c.bank ||= { bin: '', acct: '', holder: '' };
  c.settings ||= {}; c.settings.round ??= 1000; c.schedule ||= { days: [], time: '19:00', venue: '' }; c.schedule.days ||= [];
  return c;
}

/* ===== tiền & thống kê ===== */
const unpaidOf = (c, mid) => c.charges.filter(x => x.mid === mid && !x.paid);
const debtOf = (c, mid) => unpaidOf(c, mid).reduce((a, x) => a + x.amount, 0);
const totalDebt = c => c.charges.filter(x => !x.paid).reduce((a, x) => a + x.amount, 0);
const paidTotal = (c, mid) => c.charges.filter(x => x.mid === mid && x.paid).reduce((a, x) => a + x.amount, 0);
const FUND_KINDS = ['monthly', 'fund'];
function fundEntries(c) {
  const auto = c.charges.filter(x => x.paid && FUND_KINDS.includes(x.kind)).map(x => ({ id: 'c' + x.id, type: 'in', amount: x.amount, label: `${x.label} · ${(memberOf(c, x.mid) || {}).name || 'Hội viên'}`, date: dayKey(new Date(x.paidAt || Date.now())), auto: true }));
  return [...c.fund, ...auto].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
const fundBalance = c => fundEntries(c).reduce((a, e) => a + (e.type === 'in' ? e.amount : -e.amount), 0);
const settledSessions = c => c.sessions.filter(s => s.status === 'settled');
const attended = (c, mid, filter = () => true) => settledSessions(c).filter(s => filter(s) && s.attendees.includes(mid)).length;
function rankList(c, period = 'month') {
  const mk = monthKey();
  const f = period === 'month' ? s => s.date.startsWith(mk) : () => true;
  const total = settledSessions(c).filter(f).length;
  return { total, list: activeMembers(c).map(m => ({ m, n: attended(c, m.id, f) })).sort((a, b) => b.n - a.n || a.m.name.localeCompare(b.m.name, 'vi')) };
}
function streakOf(c, mid) { // số buổi liên tiếp gần nhất có mặt
  const ss = settledSessions(c).sort((a, b) => b.date.localeCompare(a.date)); let n = 0;
  for (const s of ss) { if (s.attendees.includes(mid)) n++; else break; }
  return n;
}
/* ===== vote đi / không đi =====
   s.rsvp = { mid: 'yes' | 'no' }, s.rsvpAt = { mid: thời điểm vote } — ai vote "Đi" trước giữ chỗ trước khi buổi có giới hạn số người (s.max). */
function voteOf(c, s) {
  const rs = s.rsvp || {}, at = s.rsvpAt || {};
  const ids = c.members.filter(m => m.active !== false || rs[m.id]).map(m => m.id);
  const yes = ids.filter(id => rs[id] === 'yes').sort((a, b) => (at[a] || 0) - (at[b] || 0));
  const no = ids.filter(id => rs[id] === 'no');
  const none = ids.filter(id => !rs[id] && (memberOf(c, id) || {}).active !== false);
  const max = Number(s.max) || 0;
  return { yes, no, none, max, going: max ? yes.slice(0, max) : yes, wait: max ? yes.slice(max) : [] };
}
function setVote(s, mid, r) { // bấm lại đúng lựa chọn đang chọn = bỏ vote
  s.rsvp ||= {}; s.rsvpAt ||= {};
  if (!r || s.rsvp[mid] === r) { delete s.rsvp[mid]; delete s.rsvpAt[mid]; return null; }
  s.rsvp[mid] = r; s.rsvpAt[mid] = Date.now(); return r;
}
const upcoming = c => c.sessions.filter(s => s.status === 'open' && s.date >= dayKey()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
const sessCost = s => (s.costs || []).reduce((a, x) => a + (Number(x.amount) || 0), 0);
const sessHeads = s => s.attendees.length + (s.guests || []).length;
function sessShares(c, s) { // { mid: amount } — khách tính vào người dẫn
  const total = sessCost(s), heads = sessHeads(s), r = Number(c.settings.round) || 1;
  const out = {};
  if (!heads) return { shares: out, per: 0, total, surplus: 0 };
  if (s.split === 'custom') {
    s.attendees.forEach(mid => out[mid] = Number((s.custom || {})[mid]) || 0);
    (s.guests || []).forEach(g => { if (g.host) out[g.host] = (out[g.host] || 0) + (Number(g.amount) || 0); });
    const sum = Object.values(out).reduce((a, b) => a + b, 0);
    return { shares: out, per: 0, total, surplus: sum - total };
  }
  const per = Math.ceil(total / heads / r) * r;
  s.attendees.forEach(mid => out[mid] = per);
  (s.guests || []).forEach(g => { if (g.host) out[g.host] = (out[g.host] || 0) + per; });
  return { shares: out, per, total, surplus: per * heads - total };
}
function nextScheduledDay(c) {
  const days = (c.schedule && c.schedule.days) || [];
  if (!days.length) return dayKey();
  for (let i = 0; i < 14; i++) { const k = addDays(dayKey(), i); if (days.includes(parseDay(k).getDay())) return k; }
  return dayKey();
}
const transferNote = (c, who) => noTone(`${initials(c.name) || 'SS'} ${who}`).replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase().slice(0, 25);

/* ===== chia đội cân bằng theo trình độ (rắn bò: 1-2-2-1) ===== */
function makeTeams(players, k, levelOf) {
  k = Math.max(2, Math.min(k, players.length || 2));
  const sorted = shuffle(players).sort((a, b) => levelOf(b) - levelOf(a));
  const teams = Array.from({ length: k }, () => []);
  sorted.forEach((p, i) => { const r = Math.floor(i / k), j = i % k; teams[r % 2 ? k - 1 - j : j].push(p); });
  return teams;
}
function makePairs(players, levelOf) { // ghép người mạnh với người yếu hơn
  const sorted = shuffle(players).sort((a, b) => levelOf(b) - levelOf(a));
  const pairs = []; let i = 0, j = sorted.length - 1;
  while (i < j) { pairs.push([sorted[i], sorted[j]]); i++; j--; }
  if (i === j) pairs.push([sorted[i]]);
  return shuffle(pairs);
}

/* ===== VietQR (EMVCo merchant-presented QR, chuẩn Napas 247) ===== */
function crc16(s) {
  let crc = 0xFFFF;
  for (const b of new TextEncoder().encode(s)) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
function vietQR({ bin, acct, amount, note }) {
  const acc = tlv('00', 'A000000727') + tlv('01', tlv('00', bin) + tlv('01', String(acct).replace(/\s/g, ''))) + tlv('02', 'QRIBFTTA');
  let p = tlv('00', '01') + tlv('01', amount ? '12' : '11') + tlv('38', acc) + tlv('53', '704');
  if (amount) p += tlv('54', String(Math.round(amount)));
  p += tlv('58', 'VN');
  const n = noTone(note || '').replace(/[^A-Za-z0-9 .,-]/g, '').slice(0, 50).trim();
  if (n) p += tlv('62', tlv('08', n));
  p += '6304';
  return p + crc16(p);
}
function qrMatrix(text) { const q = qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(); return { n, dark: (r, c) => q.isDark(r, c) }; }
function qrSVG(text) {
  const { n, dark } = qrMatrix(text); const m = 2; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (dark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n + m * 2} ${n + m * 2}" shape-rendering="crispEdges" role="img" aria-label="Mã QR"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#0B1D33"/></svg>`;
}
const bankReady = b => !!(b && b.bin && b.acct);

/* ===== hội mẫu ===== */
async function seedDemo() {
  const old = Object.values(STORE.clubs).find(c => c.demo); if (old) return old;
  const id = uid('club_');
  const names = [['Minh Quân', '🦅', 4, '1111'], ['Thu Lan', '🦊', 3, '2222'], ['Hoàng Nam', '🐯', 5], ['Bảo Ngọc', '🦄', 2], ['Đức Anh', '⚡', 4], ['Thanh Hà', '🐬', 3], ['Quốc Bảo', '🦁', 3], ['Mai Anh', '🌟', 2], ['Tuấn Kiệt', '🔥', 5], ['Phương Linh', '🍀', 1]];
  const members = names.map(([name, avatar, level], i) => ({ id: 'm' + i + id.slice(-4), name, avatar, level, phone: '', active: true, joinedAt: Date.now() - 864e5 * 90 + i }));
  const c = normalizeClub({
    id, demo: true, sport: 'badminton', name: 'CLB Cầu Lông Sấm Sét', area: 'Nhà thi đấu Quận 7', createdAt: Date.now(),
    owner: 'local', meMid: null,
    bank: { bin: '970436', acct: '0123456789', holder: 'NGUYEN VAN SON' },
    schedule: { days: [2, 4, 6], time: '19:00', venue: 'Nhà thi đấu Quận 7 · Sân 3-4' },
    settings: { round: 1000 }, members, sessions: [], charges: [], fund: [],
  });
  // 8 buổi đã chốt trong ~3 tuần qua
  const today = dayKey(); let k = addDays(today, -24); let n = 0;
  while (k < today) {
    if ([2, 4, 6].includes(parseDay(k).getDay())) {
      const att = shuffle(members).slice(0, 6 + (n % 4)).map(m => m.id);
      const s = { id: uid('s_'), date: k, time: '19:00', venue: c.schedule.venue, note: '', status: 'settled', rsvp: {}, attendees: att, guests: n % 3 === 0 ? [{ name: 'Khách của Nam', host: members[2].id }] : [], costs: [{ label: 'Tiền sân', amount: 240000 }, { label: 'Tiền cầu', amount: 6 * 25000 + (n % 2) * 25000 }, { label: 'Nước uống', amount: 60000 }], split: 'equal', payer: members[0].id, teams: null, settledAt: parseDay(k).getTime() + 864e5 * .9 };
      c.sessions.push(s);
      const { shares } = sessShares(c, s);
      Object.entries(shares).forEach(([mid, amount]) => {
        const paid = mid === s.payer || (k < addDays(today, -6) ? Math.random() < .85 : Math.random() < .35);
        c.charges.push({ id: uid('c_'), mid, amount, label: `Buổi ${fmtDate(k)}`, kind: 'session', ref: s.id, date: k, paid, paidAt: paid ? s.settledAt + 864e5 : null });
      });
      n++;
    }
    k = addDays(k, 1);
  }
  // quỹ tháng
  members.forEach((m, i) => c.charges.push({ id: uid('c_'), mid: m.id, amount: 100000, label: `Quỹ tháng ${fmtMonth(monthKey())}`, kind: 'monthly', ref: 'mon' + monthKey(), date: dayKey(), paid: i % 3 !== 1, paidAt: Date.now() - 864e5 * (i + 1) }));
  c.fund.push({ id: uid('f_'), type: 'in', amount: 500000, label: 'Tồn quỹ tháng trước', date: addDays(today, -26) });
  c.fund.push({ id: uid('f_'), type: 'out', amount: 350000, label: 'Mua 1 ống cầu thi đấu + băng cuốn cán', date: addDays(today, -12) });
  c.fund.push({ id: uid('f_'), type: 'out', amount: 420000, label: 'Liên hoan giữa tháng', date: addDays(today, -5) });
  // 2 buổi sắp tới
  const nx = nextScheduledDay(c);
  const s1 = { id: uid('s_'), date: nx, time: '19:00', venue: c.schedule.venue, note: 'Mang vợt dự phòng, buổi này có giao lưu.', status: 'open', rsvp: {}, attendees: [], guests: [], costs: [{ label: 'Tiền sân', amount: 240000 }, { label: 'Tiền cầu', amount: 150000 }, { label: 'Nước uống', amount: 60000 }], split: 'equal', payer: members[0].id, teams: null };
  members.slice(0, 7).forEach((m, i) => s1.rsvp[m.id] = i === 5 ? 'no' : 'yes');
  s1.attendees = members.slice(0, 7).filter((m, i) => i !== 5).map(m => m.id);
  c.sessions.push(s1);
  let nx2 = addDays(nx, 1); while (![2, 4, 6].includes(parseDay(nx2).getDay())) nx2 = addDays(nx2, 1);
  c.sessions.push({ id: uid('s_'), date: nx2, time: '19:00', venue: c.schedule.venue, note: '', status: 'open', rsvp: { [members[1].id]: 'yes', [members[3].id]: 'yes' }, attendees: [], guests: [], costs: [{ label: 'Tiền sân', amount: 240000 }, { label: 'Tiền cầu', amount: 150000 }], split: 'equal', payer: members[0].id, teams: null });
  c.meMid = members[0].id; // bạn đóng vai Minh Quân để thử vote, công nợ
  STORE.clubs[id] = c; persistLocal();
  return c;
}
