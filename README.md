# ⚡ Sport Share

Web app **miễn phí, không quảng cáo** để quản lý đội nhóm thể thao: vote đi / không đi, điểm danh, chia tiền sân, công nợ, quỹ hội và chuyển khoản nhanh bằng **VietQR**. Dùng cho cầu lông, bóng đá, pickleball, tennis, bóng bàn, bóng chuyền, bóng rổ, chạy bộ, đạp xe, bơi lội, gym, golf, cờ… hoặc môn tự đặt tên.

- Trang giới thiệu: <https://sportshare.pro.vn>
- Web app: <https://sportshare.pro.vn/app/>
- Hướng dẫn sử dụng: [`huong-dan-su-dung.pdf`](huong-dan-su-dung.pdf) (nguồn trong `docs/guide/`)

## Tài khoản & vai trò

**Mỗi người một tài khoản** (Google hoặc email/mật khẩu, qua Firebase Authentication). **Vai trò tính theo từng hội**: một người có thể là hội viên của hội này và quản trị của hội khác. Trang **Của tôi** gộp lịch, vote và công nợ của mọi hội.

| Vai trò | Làm được gì |
|---|---|
| 🛡️ **Người lập hội / đồng quản trị** | Mời hội viên (link chung cần duyệt, hoặc link riêng vào ngay), tạo buổi, ghi vote hộ, điểm danh, nhập chi phí, chia tiền, chia đội, chốt công nợ, xác nhận tiền, quỹ tháng, sổ quỹ, phong / bỏ quản trị |
| 🏃 **Hội viên** | Xem lịch, vote đi / không đi, thêm vào lịch điện thoại, xem công nợ của mình, quét VietQR, bấm "Tôi đã chuyển khoản", xếp hạng, đổi tên / ảnh trong hội, rời hội |

Chưa muốn đăng ký: **Xem hội mẫu** hoặc **Dùng trên máy này** (dữ liệu chỉ trong trình duyệt, sau này bấm **☁️ Lên mây** để đưa lên tài khoản, giữ nguyên lịch sử).

## Tính năng chính
- **Lập hội: chọn môn thể thao trước**, môn quyết định khoản chi gợi ý, cách chia đội (cặp / đội / nhóm), tên gọi buổi.
- **Vote đi / không đi** theo thời gian thực, giới hạn số chỗ và tự xếp **dự bị**, chép lời mời / kết quả vote cho nhóm Zalo.
- **Điểm danh theo vote**, khách vãng lai, chi phí gõ tắt (`240k`, `1.2tr`), người ứng tiền trước, chia đều có làm tròn hoặc tự nhập.
- **Chia đội cân bằng** theo trình độ 1–5 sao.
- **Công nợ**: hội viên quét VietQR rồi báo đã chuyển khoản, quản trị xác nhận một chạm; chép tin nhắc nợ.
- **Quỹ tháng, khoản thu khác, sổ quỹ hội**.
- **Thêm vào lịch điện thoại** (Google Calendar / file .ics).
- **Link xem nhanh** (không cần tài khoản), sao lưu ra file, PWA cài lên màn hình chính, giao diện sáng / tối.
- **Mời cafe ☕** ủng hộ Team Sport Share.

## Cài đặt Firebase (bắt buộc để bật đăng nhập)
Làm theo [`firebase/HUONG-DAN-FIREBASE.md`](firebase/HUONG-DAN-FIREBASE.md): tạo dự án (gói miễn phí), bật Google + Email/Password, thêm tên miền được phép, tạo Firestore (asia-southeast1), dán [`firebase/firestore.rules`](firebase/firestore.rules), rồi dán cấu hình vào `app/js/firebase-config.js`. Khi `FIREBASE_CONFIG = null`, app chạy chế độ "trên máy này".

## Bảo mật dữ liệu
Quy tắc Firestore ([`firebase/firestore.rules`](firebase/firestore.rules)) được kiểm thử bằng 59 bài trên Firestore Emulator ([`firebase/rules.test.mjs`](firebase/rules.test.mjs)):
- Chỉ thành viên đọc được hội; hội viên chỉ thấy **công nợ của chính mình**; sổ quỹ chỉ quản trị xem.
- Hội viên chỉ vote cho mình, chỉ sửa tên / ảnh / số điện thoại của mình, chỉ báo "đã chuyển khoản", không tự gạch nợ, không tự phong quản trị.
- Link mời riêng dùng một lần, gắn đúng một hội viên; link chung chỉ tạo yêu cầu chờ duyệt.
- Không ai gỡ được người lập hội; chỉ người lập hội xóa được hội.

## Cấu trúc
```
index.html, img/, fonts/      trang giới thiệu (landing)
robots.txt, sitemap.xml       SEO
huong-dan-su-dung.pdf         hướng dẫn sử dụng (nguồn: docs/guide/)
app/index.html                web app
app/js/firebase-config.js     cấu hình Firebase (null = chế độ trên máy)
app/js/cloud.js               đăng nhập + Firestore (ES module)
app/js/store.js               lưu trữ & đồng bộ: so sánh thay đổi, chỉ ghi trường đã sửa
app/js/core.js                môn thể thao, tính tiền, vote, VietQR, hội mẫu
app/js/views.js               giao diện
app/js/app.js                 hành động, đăng nhập, link mời, khởi động
app/vendor/firebase.js        Firebase JS SDK đóng gói sẵn (Apache-2.0)
app/js/qrcode.js              qrcode-generator (MIT)
firebase/                     quy tắc bảo mật, bài kiểm thử, hướng dẫn cài Firebase
```

## Phát triển & kiểm thử
```bash
npm i -D firebase firebase-tools @firebase/rules-unit-testing
npx firebase emulators:exec --only firestore --project demo-sportshare "node firebase/rules.test.mjs"
npx firebase emulators:start --only firestore,auth --project demo-sportshare
python3 -m http.server 8000
```
Mở `http://localhost:8000/app/?emu=1` để chạy app với bộ giả lập (chỉ hoạt động trên localhost).

Thông tin nhận ủng hộ nằm ở hằng `DONATE` trong `app/js/core.js`.

## Giấy phép bên thứ ba
- Font Be Vietnam Pro: SIL Open Font License 1.1 (`OFL-fonts.txt`).
- Firebase JS SDK © Google, Apache License 2.0. qrcode-generator © Kazuhiko Arase, MIT.
- "QR Code" là nhãn hiệu của DENSO WAVE. VietQR là nhãn hiệu của Napas.
