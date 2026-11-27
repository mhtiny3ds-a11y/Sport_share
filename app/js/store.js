/* Sport Share — lưu trữ & đồng bộ.
   - Hội "trên máy này": lưu trong localStorage (dùng thử, không cần tài khoản).
   - Hội "đám mây": Firestore. Giao diện sửa trực tiếp đối tượng hội rồi gọi save();
     store so sánh với bản đã đồng bộ (shadow) và chỉ ghi các trường thay đổi. */
'use strict';

/* ===== lưu trên máy ===== */
const LS = { store: 'sportshare.store.v1', dev: 'sportshare.device.v1' };
const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
let STORE = lsGet(LS.store, null) || { clubs: {} };
let DEV = lsGet(LS.dev, null) || {};
if (!STORE.clubs) STORE.clubs = {};
DEV.theme ||= 'auto'; DEV.joins ||= [];
delete DEV.session; // phiên PIN cũ không còn dùng
delete DEV.local;   // chế độ "trên máy này" đã bỏ: hội mới luôn lưu trên đám mây
DEV.snooze ||= {};
// hội mẫu cũ từng lưu trong máy: bỏ (hội mẫu giờ chỉ nằm trong bộ nhớ, không lưu)
Object.keys(STORE.clubs).forEach(id => { if (STORE.clubs[id].demo) delete STORE.clubs[id]; });
Object.values(STORE.clubs).forEach(c => { normalizeClub(c); c.owner ||= 'local'; });
function persistLocal() {
  const ok = lsSet(LS.store, STORE) && lsSet(LS.dev, DEV);
  if (!ok && typeof toast === 'function') toast('Không lưu được dữ liệu trên máy (bộ nhớ trình duyệt đầy hoặc bị chặn).');
}

/* ===== trạng thái đăng nhập ===== */
let CLOUD = null;          // API Firebase (null = chưa cấu hình / không tải được)
let ME = null;             // { uid, name, email, photo } khi đã đăng nhập
let AUTH_READY = false;    // đã biết trạng thái đăng nhập lần đầu
const CL = {};             // hội đám mây: id → hội
const SH = {};             // shadow: đường dẫn tài liệu → JSON đã đồng bộ
const SUBS = {};           // id hội → { key, offs[] }
let clubsOff = null;
let CLUBS_LOADED = false;

const cloudReady = new Promise(res => {
  window.__cloudResolve = api => { CLOUD = api; res(api); };
  if ('__cloudEarly' in window) window.__cloudResolve(window.__cloudEarly);
  setTimeout(() => res(CLOUD), 10000); // mạng quá chậm: chạy tiếp ở chế độ trên máy
});

/* ===== truy cập hội & vai trò ===== */
const isCloud = c => !!(c && c._cloud);
let DEMO = null;            // hội mẫu để chơi thử: chỉ trong bộ nhớ, tải lại trang là mất
const clubById = id => CL[id] || (DEMO && DEMO.id === id ? DEMO : null) || STORE.clubs[id] || null;
const club = () => clubById(DEV.clubId);
const cloudClubs = () => Object.values(CL).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
const localClubs = () => Object.values(STORE.clubs).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
const myClubs = () => ME ? [...cloudClubs(), ...localClubs()] : []; // hội trên máy = hội cũ chờ đưa lên mây
const memberOf = (c, id) => c && c.members.find(m => m.id === id);
const activeMembers = c => c.members.filter(m => m.active !== false);
function role(c) {
  if (!c) return null;
  if (!isCloud(c)) return 'owner';
  if (!ME) return null;
  if (c.owner === ME.uid) return 'owner';
  if ((c.admins || []).includes(ME.uid)) return 'admin';
  if ((c.memberUids || []).includes(ME.uid)) return 'member';
  return null;
}
const canAdmin = c => ['owner', 'admin'].includes(role(c));
const myMid = c => !c ? null : isCloud(c) ? ((c.uidMid || {})[ME && ME.uid] || null) : (c.meMid || null);
const myMember = c => memberOf(c, myMid(c));
/* nhắc quản trị tải file sao lưu mỗi 30 ngày (phòng xóa nhầm) */
const BACKUP_DAYS = 30;
function lastBackup(c) { return c.backupAt || c.uploadedAt || c.createdAt || 0; }
function needBackup(c) {
  if (!c || c.demo || !isCloud(c) || !canAdmin(c)) return false;
  if (!c.sessions.length && !c.charges.length) return false;
  if ((DEV.snooze[c.id] || 0) > Date.now()) return false;
  return Date.now() - lastBackup(c) > BACKUP_DAYS * 864e5;
}
const roleLabel = r => ({ owner: 'Người lập hội', admin: 'Quản trị', member: 'Hội viên' }[r] || '');

/* ===== lưu ===== */
function save() {
  persistLocal();
  if (CLOUD && ME) Object.values(CL).forEach(syncClub);
}

/* ---- so sánh & ghi lên Firestore ---- */
const SKIP_CLUB = new Set(['id', 'members', 'sessions', 'charges', 'fund', 'requests', 'owner', 'admins', 'memberUids', 'uidMid', 'joinVia']);
const SUBCOLS = ['members', 'sessions', 'charges', 'fund'];
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const clean = v => JSON.parse(JSON.stringify(v ?? null));
const safeKey = k => /^[A-Za-z_][A-Za-z0-9_]*$/.test(k);
function clubFields(c) { const o = {}; Object.keys(c).forEach(k => { if (!SKIP_CLUB.has(k) && k[0] !== '_') o[k] = c[k]; }); return clean(o); }
// Firestore không nhận mảng lồng mảng: chuyển [[a,b],[c]] → [{m:[a,b]},{m:[c]}] (dữ liệu chia đội cũ)
const fsSafe = v => Array.isArray(v) ? v.map(e => Array.isArray(e) ? { m: e.map(fsSafe) } : fsSafe(e)) : isObj(v) ? Object.fromEntries(Object.entries(v).map(([k, e]) => [k, fsSafe(e)])) : v;
function itemData(x) { const o = { ...x }; delete o.id; Object.keys(o).forEach(k => { if (k[0] === '_') delete o[k]; }); return fsSafe(clean(o)); }
function diffOp(path, data, ops) {
  const now = JSON.stringify(data), prev = SH[path];
  if (prev === now) return;
  if (prev === undefined) { ops.push({ t: 'set', p: path, d: data }); SH[path] = now; return; }
  const old = JSON.parse(prev), upd = {};
  new Set([...Object.keys(old), ...Object.keys(data)]).forEach(k => {
    const a = old[k], b = data[k];
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    if (b === undefined) { upd[k] = '__del'; return; }
    if (isObj(a) && isObj(b) && Object.keys({ ...a, ...b }).every(safeKey)) {
      new Set([...Object.keys(a), ...Object.keys(b)]).forEach(sk => {
        if (JSON.stringify(a[sk]) !== JSON.stringify(b[sk])) upd[`${k}.${sk}`] = b[sk] === undefined ? '__del' : b[sk];
      });
    } else upd[k] = b;
  });
  if (Object.keys(upd).length) ops.push({ t: 'update', p: path, d: upd });
  SH[path] = now;
}
function syncClub(c) {
  if (!c || !c._ready) return;
  const ops = [], base = 'clubs/' + c.id;
  if (canAdmin(c)) diffOp(base, clubFields(c), ops);
  SUBCOLS.forEach(name => {
    if (!c._loaded[name]) return;
    const pre = `${base}/${name}/`, ids = new Set();
    c[name].forEach(x => { if (!x.id) x.id = uid(name[0] + '_'); ids.add(x.id); diffOp(pre + x.id, itemData(x), ops); });
    Object.keys(SH).forEach(p => { if (p.startsWith(pre) && !ids.has(p.slice(pre.length))) { ops.push({ t: 'delete', p }); delete SH[p]; } });
  });
  if (ops.length) commitOps(ops);
}
function commitOps(ops, okMsg) {
  return CLOUD.commit(ops).then(() => { if (okMsg) toast(okMsg); return true; }).catch(e => {
    console.error('Ghi Firestore lỗi', e, ops);
    toast(/permission/i.test(e.code || e.message) ? 'Bạn không có quyền thay đổi mục này.' : 'Chưa lưu được lên mạng: ' + (e.code || e.message));
    return false;
  });
}

/* ---- nhận dữ liệu từ Firestore ---- */
function normalizeSession(s) { s.rsvp ||= {}; s.rsvpAt ||= {}; s.attendees ||= []; s.guests ||= []; s.costs ||= []; s.split ||= 'equal'; return s; }
let renderTimer = null, renderPending = false;
function scheduleRender() {
  if (typeof render !== 'function') return;
  const a = document.activeElement;
  if (a && a.matches && a.matches('input,textarea,select') && document.getElementById('app').contains(a)) { renderPending = true; return; }
  cancelAnimationFrame(renderTimer); renderTimer = requestAnimationFrame(() => render());
}
document.addEventListener('focusout', () => { if (renderPending) { renderPending = false; setTimeout(scheduleRender, 50); } });

function onClubs(list) {
  const seen = new Set();
  list.forEach(({ id, data }) => {
    seen.add(id);
    const c = CL[id] || (CL[id] = { id, _cloud: true, _loaded: {}, members: [], sessions: [], charges: [], fund: [], requests: [] });
    Object.keys(c).forEach(k => { if (!SKIP_CLUB.has(k) && k[0] !== '_') delete c[k]; });
    Object.assign(c, data);
    normalizeClub(c);
    SH['clubs/' + id] = JSON.stringify(clubFields(c));
    c._ready = true;
    watchSubs(c);
  });
  Object.keys(CL).forEach(id => { if (!seen.has(id)) dropClub(id); });
  // yêu cầu vào hội đã được duyệt
  const before = DEV.joins.length;
  DEV.joins = DEV.joins.filter(j => { if (CL[j.clubId]) { toast(`Bạn đã vào hội ${j.clubName}! 🎉`); return false; } return true; });
  if (DEV.joins.length !== before) persistLocal();
  CLUBS_LOADED = true;
  scheduleRender();
}
function watchSubs(c) {
  const r = role(c), mid = myMid(c), key = r + '|' + mid;
  if (SUBS[c.id] && SUBS[c.id].key === key) return;
  unwatch(c.id);
  const offs = [], base = 'clubs/' + c.id, admin = canAdmin(c);
  SUBS[c.id] = { key, offs };
  const sub = (name, filter, attempt = 0) => {
    c._loaded[name] = false;
    offs.push(CLOUD.watch(`${base}/${name}`, filter, docs => {
      const pre = `${base}/${name}/`;
      Object.keys(SH).forEach(p => { if (p.startsWith(pre)) delete SH[p]; });
      c[name] = docs.map(({ id, data }) => {
        const x = { id, ...data };
        if (name === 'sessions') normalizeSession(x);
        SH[pre + id] = JSON.stringify(itemData(x));
        return x;
      });
      if (name === 'members') c.members.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0) || (a.name || '').localeCompare(b.name || '', 'vi'));
      c._loaded[name] = true;
      scheduleRender();
    }, e => {
      // Hội vừa tạo/vừa vào: máy chủ có thể chưa kịp ghi nhận quyền → thử lại vài lần
      if (/permission/i.test(e.code || '') && attempt < 6 && SUBS[c.id] && SUBS[c.id].key === key) setTimeout(() => { if (SUBS[c.id] && SUBS[c.id].key === key) sub(name, filter, attempt + 1); }, 800 * (attempt + 1));
      else console.warn('watch', name, e.code || e.message);
    }));
  };
  sub('members'); sub('sessions');
  if (admin) { sub('charges'); sub('fund'); sub('requests'); }
  else {
    c.fund = []; c.requests = []; c._loaded.fund = false;
    if (mid) sub('charges', ['mid', '==', mid]); else { c.charges = []; c._loaded.charges = false; }
  }
}
function unwatch(id) { if (SUBS[id]) { SUBS[id].offs.forEach(f => { try { f(); } catch (e) {} }); delete SUBS[id]; } }
function dropClub(id) {
  unwatch(id); delete CL[id];
  Object.keys(SH).forEach(p => { if (p === 'clubs/' + id || p.startsWith('clubs/' + id + '/')) delete SH[p]; });
  if (DEV.clubId === id && typeof UI !== 'undefined' && ['club', 'session'].includes(UI.view)) { DEV.clubId = null; go('home'); toast('Bạn không còn ở trong hội này.'); }
}
function startCloud(user) {
  stopCloud();
  ME = user; CLUBS_LOADED = false;
  clubsOff = CLOUD.watchClubs(user.uid, onClubs, e => { console.warn(e); toast('Không tải được dữ liệu: ' + (e.code || e.message)); });
}
function stopCloud() {
  if (clubsOff) { clubsOff(); clubsOff = null; }
  Object.keys(CL).forEach(unwatch);
  Object.keys(CL).forEach(k => delete CL[k]);
  Object.keys(SH).forEach(k => delete SH[k]);
  ME = null; CLUBS_LOADED = false;
}

/* ===== thao tác đặc biệt trên đám mây ===== */
const inviteCode = () => (uid('') + uid('')).replace(/[^a-z0-9]/gi, '').slice(0, 16);
const avatarPick = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

/* lập hội mới trên đám mây; withMe = người lập có chơi cùng hội */
async function createCloudClub(fields, withMe) {
  const id = CLOUD.newId(), mid = uid('m_');
  const c = { ...clean(fields), owner: ME.uid, admins: [ME.uid], memberUids: [ME.uid], uidMid: withMe ? { [ME.uid]: mid } : {}, createdAt: Date.now() };
  const ops = [{ t: 'set', p: 'clubs/' + id, d: c }];
  if (withMe) ops.push({ t: 'set', p: `clubs/${id}/members/${mid}`, d: { name: ME.name, avatar: avatarPick(), level: 3, active: true, joinedAt: Date.now(), uid: ME.uid, email: ME.email || '' } });
  const ok = await commitOps(ops);
  return ok ? id : null;
}
/* đưa hội trên máy lên đám mây (giữ nguyên lịch sử) */
async function uploadLocalClub(lc, meMid) {
  const id = CLOUD.newId(), base = 'clubs/' + id;
  const fields = clubFields(lc); delete fields.admin; delete fields.demo; delete fields.meMid;
  let ownerMid = meMid && memberOf(lc, meMid) ? meMid : null;
  const ops = [];
  const members = lc.members.map(m => { const d = itemData(m); delete d.pin; d.uid = null; return [m.id, d]; });
  if (!ownerMid) { ownerMid = uid('m_'); members.push([ownerMid, { name: ME.name, avatar: avatarPick(), level: 3, active: true, joinedAt: Date.now() }]); }
  members.forEach(([mid, d]) => { if (mid === ownerMid) { d.uid = ME.uid; d.email = ME.email || ''; } });
  ops.push({ t: 'set', p: base, d: { ...fields, owner: ME.uid, admins: [ME.uid], memberUids: [ME.uid], uidMid: { [ME.uid]: ownerMid }, createdAt: Date.now(), uploadedAt: Date.now() } });
  members.forEach(([mid, d]) => ops.push({ t: 'set', p: `${base}/members/${mid}`, d }));
  ['sessions', 'charges', 'fund'].forEach(n => (lc[n] || []).forEach(x => ops.push({ t: 'set', p: `${base}/${n}/${x.id || uid('x_')}`, d: itemData(x) })));
  const ok = await commitOps(ops);
  return ok ? id : null;
}
async function makeInvite(c, mid) {
  const code = inviteCode();
  const m = mid && memberOf(c, mid);
  const ops = [{ t: 'set', p: 'invites/' + code, d: { clubId: c.id, clubName: c.name, sport: c.sport, sportName: c.sportName || '', mid: mid || null, memberName: m ? m.name : '', by: ME.uid, at: Date.now() } }];
  const ok = await commitOps(ops);
  return ok ? code : null;
}
async function claimInvite(code, inv) { // link cá nhân: gắn tài khoản vào hội viên được mời
  return commitOps([
    { t: 'update', p: 'clubs/' + inv.clubId, d: { memberUids: { __union: [ME.uid] }, ['uidMid.' + ME.uid]: inv.mid, joinVia: code } },
    { t: 'update', p: `clubs/${inv.clubId}/members/${inv.mid}`, d: { uid: ME.uid, email: ME.email || '', joinVia: code } },
  ]);
}
async function requestJoin(code, inv, name) { // link chung: gửi yêu cầu, chờ duyệt
  const ok = await commitOps([{ t: 'set', p: `clubs/${inv.clubId}/requests/${ME.uid}`, d: { uid: ME.uid, name: name || ME.name, email: ME.email || '', photo: ME.photo || '', invite: code, at: Date.now() } }]);
  if (ok) { DEV.joins = DEV.joins.filter(j => j.clubId !== inv.clubId).concat([{ clubId: inv.clubId, clubName: inv.clubName, at: Date.now() }]); persistLocal(); }
  return ok;
}
async function approveRequest(c, r, mid) { // mid = gắn vào hội viên có sẵn; null = tạo hội viên mới
  const ops = [];
  let target = mid;
  if (target) ops.push({ t: 'update', p: `clubs/${c.id}/members/${target}`, d: { uid: r.uid, email: r.email || '' } });
  else { target = uid('m_'); ops.push({ t: 'set', p: `clubs/${c.id}/members/${target}`, d: { name: r.name || 'Hội viên mới', avatar: avatarPick(), level: 3, active: true, joinedAt: Date.now(), uid: r.uid, email: r.email || '' } }); }
  ops.push({ t: 'update', p: 'clubs/' + c.id, d: { memberUids: { __union: [r.uid] }, ['uidMid.' + r.uid]: target } });
  ops.push({ t: 'delete', p: `clubs/${c.id}/requests/${r.uid}` });
  return commitOps(ops, `Đã duyệt ${r.name || ''} vào hội.`);
}
const rejectRequest = (c, r) => commitOps([{ t: 'delete', p: `clubs/${c.id}/requests/${r.uid}` }], 'Đã từ chối.');
async function unlinkMember(c, m) { // gỡ tài khoản khỏi hội viên (quản trị)
  if (!m.uid) return true;
  const d = { memberUids: { __remove: [m.uid] }, ['uidMid.' + m.uid]: '__del' };
  if ((c.admins || []).includes(m.uid)) d.admins = { __remove: [m.uid] };
  return commitOps([{ t: 'update', p: 'clubs/' + c.id, d }, { t: 'update', p: `clubs/${c.id}/members/${m.id}`, d: { uid: null, email: null } }]);
}
const setAdmin = (c, m, on) => commitOps([{ t: 'update', p: 'clubs/' + c.id, d: { admins: on ? { __union: [m.uid] } : { __remove: [m.uid] } } }], on ? `${m.name} đã là quản trị.` : `Đã bỏ quyền quản trị của ${m.name}.`);
async function leaveClub(c) {
  const mid = myMid(c), ops = [];
  const d = { memberUids: { __remove: [ME.uid] }, ['uidMid.' + ME.uid]: '__del' };
  if ((c.admins || []).includes(ME.uid)) d.admins = { __remove: [ME.uid] };
  ops.push({ t: 'update', p: 'clubs/' + c.id, d });
  if (mid) ops.push({ t: 'update', p: `clubs/${c.id}/members/${mid}`, d: { uid: null, email: null } });
  return commitOps(ops);
}
async function deleteCloudClub(c) {
  const ops = [];
  ['members', 'sessions', 'charges', 'fund', 'requests'].forEach(n => (c[n] || []).forEach(x => ops.push({ t: 'delete', p: `clubs/${c.id}/${n}/${x.id || x.uid}` })));
  if (c.groupInvite) ops.push({ t: 'delete', p: 'invites/' + c.groupInvite });
  c.members.forEach(m => { if (m.invite) ops.push({ t: 'delete', p: 'invites/' + m.invite }); });
  // xóa dữ liệu con trước (lúc này vẫn còn quyền quản trị), rồi mới xóa hội
  if (ops.length && !(await commitOps(ops))) return false;
  return commitOps([{ t: 'delete', p: 'clubs/' + c.id }]);
}
