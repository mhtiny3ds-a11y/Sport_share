// Kiểm tra quy tắc bảo mật trên Firestore Emulator.
// Chạy: npx firebase emulators:exec --only firestore --project demo-sportshare "node rules.test.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-sportshare',
  firestore: { rules: readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});
let pass = 0, fail = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('  ✓', name); } catch (e) { fail++; console.log('  ✗', name, '\n    ', e.message); } };

const db = uid => env.authenticatedContext(uid, { email: uid + '@x.vn' }).firestore();
const anon = env.unauthenticatedContext().firestore();
const C = 'club1';

await env.clearFirestore();
const owner = db('owner'), admin2 = db('admin2'), alice = db('alice'), bob = db('bob'), eve = db('eve');

console.log('Hội');
await t('không đăng nhập thì không tạo được hội', () => assertFails(setDoc(doc(anon, 'clubs', 'x'), { owner: 'x', admins: ['x'], memberUids: ['x'] })));
await t('không tạo hội đứng tên người khác', () => assertFails(setDoc(doc(eve, 'clubs', 'x'), { owner: 'owner', admins: ['owner'], memberUids: ['owner'] })));
await t('lập hội + hội viên + buổi trong cùng một lượt ghi', async () => {
  const b = writeBatch(owner);
  b.set(doc(owner, 'clubs', 'cb'), { name: 'B', owner: 'owner', admins: ['owner'], memberUids: ['owner'], uidMid: {} });
  b.set(doc(owner, 'clubs', 'cb', 'members', 'm1'), { name: 'x' });
  b.set(doc(owner, 'clubs', 'cb', 'sessions', 's1'), { status: 'open' });
  await assertSucceeds(b.commit());
});
await t('không chèn hội viên vào hội người khác bằng cách ghi kèm', async () => {
  const b = writeBatch(eve);
  b.update(doc(eve, 'clubs', 'cb'), { admins: arrayUnion('eve') });
  b.set(doc(eve, 'clubs', 'cb', 'members', 'm9'), { name: 'eve' });
  await assertFails(b.commit());
});
await t('tạo hội hợp lệ', () => assertSucceeds(setDoc(doc(owner, 'clubs', C), { name: 'CLB', owner: 'owner', admins: ['owner'], memberUids: ['owner'], uidMid: { owner: 'm_owner' } })));
await t('chủ hội tạo hội viên (chính mình + 2 người chưa liên kết)', async () => {
  const b = writeBatch(owner);
  b.set(doc(owner, 'clubs', C, 'members', 'm_owner'), { name: 'Chủ', uid: 'owner' });
  b.set(doc(owner, 'clubs', C, 'members', 'm_alice'), { name: 'Alice', uid: null });
  b.set(doc(owner, 'clubs', C, 'members', 'm_bob'), { name: 'Bob', uid: null });
  await assertSucceeds(b.commit());
});
await t('người ngoài không đọc được hội', () => assertFails(getDoc(doc(eve, 'clubs', C))));
await t('người ngoài không đọc được danh sách hội viên', () => assertFails(getDocs(collection(eve, 'clubs', C, 'members'))));
await t('người ngoài không tự thêm mình vào hội', () => assertFails(updateDoc(doc(eve, 'clubs', C), { memberUids: arrayUnion('eve') })));

console.log('Link mời cá nhân');
await t('người ngoài không tạo được link mời', () => assertFails(setDoc(doc(eve, 'invites', 'BAD'), { clubId: C, mid: 'm_alice', by: 'eve' })));
await t('chủ hội tạo link mời cho Alice', () => assertSucceeds(setDoc(doc(owner, 'invites', 'INVA'), { clubId: C, mid: 'm_alice', by: 'owner', clubName: 'CLB' })));
await t('đã đăng nhập thì đọc được link mời', () => assertSucceeds(getDoc(doc(alice, 'invites', 'INVA'))));
await t('không liệt kê được các link mời', () => assertFails(getDocs(collection(alice, 'invites'))));
const claim = (fs, uid, code, mid) => { const b = writeBatch(fs); b.update(doc(fs, 'clubs', C), { memberUids: arrayUnion(uid), [`uidMid.${uid}`]: mid, joinVia: code }); b.update(doc(fs, 'clubs', C, 'members', mid), { uid, email: uid + '@x.vn', joinVia: code }); return b.commit(); };
await t('Eve dùng link của Alice để gắn vào Bob thì bị chặn', () => assertFails(claim(eve, 'eve', 'INVA', 'm_bob')));
await t('chỉ sửa hồ sơ (không gắn vào hội) để chiếm chỗ thì bị chặn', () => assertFails(updateDoc(doc(eve, 'clubs', C, 'members', 'm_alice'), { uid: 'eve', joinVia: 'INVA' })));
await t('Alice nhận lời mời thành công', () => assertSucceeds(claim(alice, 'alice', 'INVA', 'm_alice')));
await t('hội viên đã ở trong hội không dùng link mời của người khác', async () => {
  await setDoc(doc(owner, 'invites', 'INVB'), { clubId: C, mid: 'm_bob', by: 'owner' });
  await assertFails(claim(alice, 'alice', 'INVB', 'm_bob'));
  await assertFails(updateDoc(doc(alice, 'clubs', C, 'members', 'm_bob'), { uid: 'alice', joinVia: 'INVB' }));
});
await t('Eve dùng lại link đã dùng thì bị chặn', () => assertFails(claim(eve, 'eve', 'INVA', 'm_alice')));
await t('Alice đọc được hội và danh sách hội viên', async () => { await assertSucceeds(getDoc(doc(alice, 'clubs', C))); await assertSucceeds(getDocs(collection(alice, 'clubs', C, 'members'))); });
await t('Alice không tự phong mình làm quản trị', () => assertFails(updateDoc(doc(alice, 'clubs', C), { admins: arrayUnion('alice') })));
await t('Alice đổi ảnh đại diện của mình', () => assertSucceeds(updateDoc(doc(alice, 'clubs', C, 'members', 'm_alice'), { avatar: '🦊' })));
await t('Alice không sửa hồ sơ người khác', () => assertFails(updateDoc(doc(alice, 'clubs', C, 'members', 'm_bob'), { avatar: '🦊' })));
await t('Alice không tự đổi trình độ', () => assertFails(updateDoc(doc(alice, 'clubs', C, 'members', 'm_alice'), { level: 5 })));

console.log('Buổi chơi & vote');
await t('chủ hội tạo buổi', () => assertSucceeds(setDoc(doc(owner, 'clubs', C, 'sessions', 's1'), { status: 'open', rsvp: {}, rsvpAt: {}, attendees: [], costs: [] })));
await t('hội viên không tạo được buổi', () => assertFails(setDoc(doc(alice, 'clubs', C, 'sessions', 's2'), { status: 'open' })));
await t('Alice vote ĐI cho mình', () => assertSucceeds(updateDoc(doc(alice, 'clubs', C, 'sessions', 's1'), { 'rsvp.m_alice': 'yes', 'rsvpAt.m_alice': 1 })));
await t('Alice bỏ vote của mình', () => assertSucceeds(updateDoc(doc(alice, 'clubs', C, 'sessions', 's1'), { 'rsvp.m_alice': deleteField(), 'rsvpAt.m_alice': deleteField() })));
await t('Alice không vote hộ Bob', () => assertFails(updateDoc(doc(alice, 'clubs', C, 'sessions', 's1'), { 'rsvp.m_bob': 'yes' })));
await t('Alice không tự điểm danh / sửa chi phí', () => assertFails(updateDoc(doc(alice, 'clubs', C, 'sessions', 's1'), { attendees: ['m_alice'] })));
await t('chủ hội ghi vote hộ Bob', () => assertSucceeds(updateDoc(doc(owner, 'clubs', C, 'sessions', 's1'), { 'rsvp.m_bob': 'no' })));
await t('buổi đã chốt thì hội viên không vote nữa', async () => { await updateDoc(doc(owner, 'clubs', C, 'sessions', 's1'), { status: 'settled' }); await assertFails(updateDoc(doc(alice, 'clubs', C, 'sessions', 's1'), { 'rsvp.m_alice': 'yes' })); });

console.log('Công nợ & quỹ');
await t('chủ hội tạo công nợ', async () => { const b = writeBatch(owner); b.set(doc(owner, 'clubs', C, 'charges', 'c1'), { mid: 'm_alice', amount: 50000, paid: false }); b.set(doc(owner, 'clubs', C, 'charges', 'c2'), { mid: 'm_bob', amount: 50000, paid: false }); await assertSucceeds(b.commit()); });
await t('Alice xem khoản của mình (truy vấn theo mid)', () => assertSucceeds(getDocs(query(collection(alice, 'clubs', C, 'charges'), where('mid', '==', 'm_alice')))));
await t('Alice không xem toàn bộ công nợ', () => assertFails(getDocs(collection(alice, 'clubs', C, 'charges'))));
await t('Alice không xem khoản của Bob', () => assertFails(getDoc(doc(alice, 'clubs', C, 'charges', 'c2'))));
await t('Alice báo đã chuyển khoản', () => assertSucceeds(updateDoc(doc(alice, 'clubs', C, 'charges', 'c1'), { reportedAt: 123 })));
await t('Alice không tự gạch nợ', () => assertFails(updateDoc(doc(alice, 'clubs', C, 'charges', 'c1'), { paid: true })));
await t('chủ hội gạch nợ', () => assertSucceeds(updateDoc(doc(owner, 'clubs', C, 'charges', 'c1'), { paid: true, paidAt: 1 })));
await t('hội viên không xem sổ quỹ', () => assertFails(getDocs(collection(alice, 'clubs', C, 'fund'))));
await t('chủ hội ghi sổ quỹ', () => assertSucceeds(setDoc(doc(owner, 'clubs', C, 'fund', 'f1'), { type: 'in', amount: 1 })));

console.log('Link mời chung (cần duyệt)');
await t('chủ hội tạo link mời chung', () => assertSucceeds(setDoc(doc(owner, 'invites', 'GROUP'), { clubId: C, mid: null, by: 'owner', clubName: 'CLB' })));
await t('link mời chung không dùng để tự vào hội', () => assertFails(updateDoc(doc(bob, 'clubs', C), { memberUids: arrayUnion('bob'), 'uidMid.bob': 'm_bob', joinVia: 'GROUP' })));
await t('Bob gửi yêu cầu vào hội', () => assertSucceeds(setDoc(doc(bob, 'clubs', C, 'requests', 'bob'), { uid: 'bob', name: 'Bob', invite: 'GROUP' })));
await t('không gửi yêu cầu đứng tên người khác', () => assertFails(setDoc(doc(eve, 'clubs', C, 'requests', 'bob'), { uid: 'bob', name: 'x', invite: 'GROUP' })));
await t('không gửi yêu cầu khi không có link hợp lệ', () => assertFails(setDoc(doc(eve, 'clubs', C, 'requests', 'eve'), { uid: 'eve', invite: 'NOPE' })));
await t('hội viên thường không xem yêu cầu', () => assertFails(getDocs(collection(alice, 'clubs', C, 'requests'))));
await t('Bob xem được yêu cầu của mình', () => assertSucceeds(getDoc(doc(bob, 'clubs', C, 'requests', 'bob'))));
await t('hội viên thường không duyệt được', () => assertFails(updateDoc(doc(alice, 'clubs', C), { memberUids: arrayUnion('bob') })));
await t('chủ hội duyệt Bob, gắn vào hội viên có sẵn', async () => {
  const b = writeBatch(owner);
  b.update(doc(owner, 'clubs', C), { memberUids: arrayUnion('bob'), 'uidMid.bob': 'm_bob' });
  b.update(doc(owner, 'clubs', C, 'members', 'm_bob'), { uid: 'bob' });
  b.delete(doc(owner, 'clubs', C, 'requests', 'bob'));
  await assertSucceeds(b.commit());
});

console.log('Quản trị & rời hội');
await t('chủ hội phong Bob làm đồng quản trị', () => assertSucceeds(updateDoc(doc(owner, 'clubs', C), { admins: arrayUnion('bob') })));
await t('đồng quản trị tạo buổi', () => assertSucceeds(setDoc(doc(bob, 'clubs', C, 'sessions', 's3'), { status: 'open', rsvp: {} })));
await t('đồng quản trị không gỡ được người lập hội', () => assertFails(updateDoc(doc(bob, 'clubs', C), { admins: arrayRemove('owner') })));
await t('đồng quản trị không đổi chủ hội', () => assertFails(updateDoc(doc(bob, 'clubs', C), { owner: 'bob' })));
await t('đồng quản trị không xóa được hội', () => assertFails(deleteDoc(doc(bob, 'clubs', C))));
await t('Alice tự rời hội', async () => {
  const b = writeBatch(alice);
  b.update(doc(alice, 'clubs', C), { memberUids: arrayRemove('alice'), 'uidMid.alice': deleteField() });
  b.update(doc(alice, 'clubs', C, 'members', 'm_alice'), { uid: null, email: null });
  await assertSucceeds(b.commit());
});
await t('Alice rời rồi thì không đọc được hội', () => assertFails(getDoc(doc(alice, 'clubs', C))));
await t('Alice không rời hộ người khác', async () => { await assertFails(updateDoc(doc(alice, 'clubs', C), { memberUids: arrayRemove('bob') })); });
await t('chủ hội không tự rời (chỉ xóa hội)', () => assertFails(updateDoc(doc(owner, 'clubs', C), { memberUids: arrayRemove('owner'), 'uidMid.owner': deleteField(), admins: arrayRemove('owner') })));
await t('người lập hội xóa được hội', () => assertSucceeds(deleteDoc(doc(owner, 'clubs', C))));

console.log(`\n${pass} đạt, ${fail} lỗi`);
await env.cleanup();
process.exit(fail ? 1 : 0);
