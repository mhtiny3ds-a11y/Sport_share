/* Sport Share — kết nối Firebase (đăng nhập + Firestore).
   Chỉ chạy khi js/firebase-config.js có cấu hình. Không có cấu hình thì app chạy chế độ "trên máy này". */
const done = api => (window.__cloudResolve ? window.__cloudResolve(api) : (window.__cloudEarly = api));

const params = new URLSearchParams(location.search);
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
const useEmu = local && params.has('emu'); // chỉ dùng khi thử nghiệm trên máy lập trình
const config = useEmu ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-sportshare', appId: 'demo-app' } : window.FIREBASE_CONFIG;

if (!config || !config.apiKey || !config.projectId) done(null);
else {
  try {
    const F = await import('../vendor/firebase.js');
    const app = F.initializeApp(config);
    const auth = F.getAuth(app);
    auth.languageCode = 'vi';
    let db;
    try { db = F.initializeFirestore(app, { ignoreUndefinedProperties: true, localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); }
    catch (e) { db = F.initializeFirestore(app, { ignoreUndefinedProperties: true }); }
    if (useEmu) {
      F.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      F.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
    const ref = p => F.doc(db, p);
    const val = v => v === '__del' ? F.deleteField()
      : (v && typeof v === 'object' && !Array.isArray(v) && v.__union) ? F.arrayUnion(...v.__union)
      : (v && typeof v === 'object' && !Array.isArray(v) && v.__remove) ? F.arrayRemove(...v.__remove)
      : v;
    const userOf = u => u && { uid: u.uid, name: u.displayName || (u.email || '').split('@')[0] || 'Bạn', email: u.email || '', photo: u.photoURL || '', provider: (u.providerData[0] || {}).providerId || '' };

    const api = {
      emulator: useEmu,
      projectId: config.projectId,
      onAuth(cb) { return F.onAuthStateChanged(auth, u => cb(userOf(u))); },
      user: () => userOf(auth.currentUser),
      async google() { const p = new F.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); await F.signInWithPopup(auth, p); },
      async emailSignIn(email, pw) { await F.signInWithEmailAndPassword(auth, email, pw); },
      async emailSignUp(name, email, pw) { const r = await F.createUserWithEmailAndPassword(auth, email, pw); if (name) await F.updateProfile(r.user, { displayName: name }); return userOf(r.user); },
      async resetPassword(email) { await F.sendPasswordResetEmail(auth, email); },
      async setName(name) { if (auth.currentUser) await F.updateProfile(auth.currentUser, { displayName: name }); return userOf(auth.currentUser); },
      async signOut() { await F.signOut(auth); },
      newId: () => F.doc(F.collection(db, '_')).id,
      async get(path) { const s = await F.getDoc(ref(path)); return s.exists() ? s.data() : null; },
      watchClubs(uid, cb, err) {
        return F.onSnapshot(F.query(F.collection(db, 'clubs'), F.where('memberUids', 'array-contains', uid)),
          s => cb(s.docs.map(d => ({ id: d.id, data: d.data() })), s.metadata.fromCache), err);
      },
      watch(path, filter, cb, err) {
        const col = F.collection(db, path);
        const q = filter ? F.query(col, F.where(filter[0], filter[1], filter[2])) : col;
        return F.onSnapshot(q, s => cb(s.docs.map(d => ({ id: d.id, data: d.data() }))), err);
      },
      /* ops: [{ t: 'set' | 'update' | 'delete', p: 'đường/dẫn', d: dữ liệu }] — chia lượt 450 thao tác */
      async commit(ops) {
        for (let i = 0; i < ops.length; i += 450) {
          const b = F.writeBatch(db);
          ops.slice(i, i + 450).forEach(o => {
            if (o.t === 'delete') b.delete(ref(o.p));
            else if (o.t === 'set') b.set(ref(o.p), o.d);
            else { const d = {}; Object.entries(o.d).forEach(([k, v]) => d[k] = val(v)); b.update(ref(o.p), d); }
          });
          await b.commit();
        }
      },
    };
    done(api);
  } catch (e) { console.error('Không khởi động được Firebase', e); done(null); }
}
