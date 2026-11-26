# ⚡ Sport Share

Web app **miễn phí, không quảng cáo, không cần máy chủ** để quản lý đội nhóm thể thao: lịch tập, điểm danh, chia tiền sân, công nợ, quỹ hội và chuyển khoản nhanh bằng **VietQR**. Dùng được cho nhiều môn: cầu lông, bóng đá, pickleball, tennis, bóng bàn, bóng chuyền, bóng rổ, chạy bộ, đạp xe, bơi lội, gym, golf, cờ… hoặc tự đặt tên môn.

## Vai trò

| Vai trò | Vào bằng | Làm được gì |
|---|---|---|
| 🛡️ **Quản trị viên** | Số điện thoại/email + mật khẩu, hoặc PIN quản trị 4 số | Tạo buổi, điểm danh, nhập chi phí, chia tiền, chia đội, chốt công nợ, thu quỹ, quản lý hội viên, cài đặt |
| 🏃 **Hội viên** | Chọn tên + mã PIN 4 số | Xem lịch, đăng ký tham gia / báo vắng, xem số tiền phải trả, quét VietQR, bảng xếp hạng chuyên cần |

## Địa chỉ

| Địa chỉ | Nội dung |
|---|---|
| `sportshare.pro.vn/` (hoặc `…github.io/Sport_share/`) | Trang giới thiệu (landing page) |
| `…/app/` | Web app Sport Share |
| `…/huong-dan-su-dung.pdf` | Hướng dẫn sử dụng |

Các nút trên landing dẫn vào app và mở đúng màn hình:

| Đường dẫn | Mở màn hình |
|---|---|
| `…/app/` | Màn hình đầu |
| `…/app/#register` | Lập hội mới (bước chọn môn thể thao) |
| `…/app/#demo` | Tạo và mở hội mẫu |
| `…/app/#admin` | Quản trị viên đăng nhập |
| `…/app/#members` | Hội viên chọn tên |
| `…/app/#legal` | Chính sách & Điều khoản |

Link cũ tạo trước khi app chuyển vào `/app/` (link xem nhanh `…/#s=…` và các đường dẫn trên khi không có `app/`) được landing tự chuyển sang app.

## Hướng dẫn sử dụng

File [`huong-dan-su-dung.pdf`](huong-dan-su-dung.pdf) (12 trang, có ảnh minh họa) mở được từ nút **📘 Hướng dẫn sử dụng** ở màn hình đầu của app và nút **Hướng dẫn** trên landing. Nguồn để chỉnh sửa nằm trong `docs/guide/`.

## Tính năng

- **Lập hội: chọn môn thể thao trước**, rồi đặt tên hội, sân quen thuộc, lịch chơi cố định, cuối cùng tạo tài khoản quản trị. Môn thể thao quyết định khoản chi gợi ý (tiền sân, tiền cầu, trọng tài…), cách chia đội (ghép cặp / chia đội / chia nhóm), màu và biểu tượng của hội.
- **Buổi chơi**: tạo theo lịch cố định, hội viên đăng ký, quản trị điểm danh (hoặc *Lấy theo đăng ký*), thêm khách vãng lai, nhập chi phí (gõ tắt `240k`, `1.2tr`), chọn người ứng tiền trước.
- **Chia tiền**: chia đều (làm tròn lên 1.000/5.000/10.000đ) hoặc tự nhập từng người. Chốt buổi sẽ tạo công nợ, người ứng tiền được tự gạch phần của mình.
- **Chia đội ngẫu nhiên cân bằng theo trình độ** (1–5 sao), hoặc ghép cặp đôi với các môn đánh đôi.
- **Thu chi**: công nợ từng người, gạch nợ, chép tin nhắc nợ, thu quỹ tháng, khoản thu khác, sổ quỹ hội (thu/chi), lịch sử thu.
- **VietQR**: nhập tài khoản ngân hàng của hội, mỗi hội viên có mã QR đúng số tiền và nội dung. Mã được tạo ngay trên máy theo chuẩn Napas, không gọi dịch vụ ngoài. Có nút tải ảnh QR.
- **Link xem nhanh** cho hội viên: quản trị bấm *Tạo & chép link*, gửi vào nhóm Zalo/Messenger. Hội viên mở trên điện thoại của mình để xem lịch, bảng xếp hạng, số tiền cần trả và quét QR. Dữ liệu được nén ngay trong link (không chứa PIN, mật khẩu).
- **Chép thông báo buổi** để dán vào nhóm chat.
- **Mời cafe ☕** ủng hộ Team Sport Share (Sữa đá, Latte, Cà phê Muối, Tùy tâm) ở màn đăng nhập quản trị, Tổng quan và Cài đặt.
- PWA: thêm vào màn hình chính, mở được khi mất mạng. Giao diện sáng/tối.

## Đưa lên GitHub Pages

1. Vào **Settings → Pages** của repository.
2. Ở **Source** chọn **Deploy from a branch**, chọn nhánh chứa code (ví dụ `main`), thư mục `/ (root)`, bấm **Save**.
3. Sau khoảng 1 phút, landing chạy tại `https://<tên-tài-khoản>.github.io/<tên-repo>/`, app tại `…/app/`.

**Tên miền riêng (`sportshare.pro.vn`)**: ở nhà cung cấp tên miền thêm 4 bản ghi A cho `@` trỏ tới `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` và bản ghi CNAME `www` → `<tên-tài-khoản>.github.io`; rồi nhập tên miền ở **Settings → Pages → Custom domain** và bật **Enforce HTTPS**.

Chạy thử trên máy: `python3 -m http.server 8000` rồi mở `http://localhost:8000` (landing) và `http://localhost:8000/app/` (app).

## Hội mẫu

Bấm **Mở hội mẫu** ở màn hình đầu (tự ẩn khi máy đã có hội thật):

- Quản trị: `demo` / `123456`, PIN quản trị `0000`
- Minh Quân: PIN `1111` · Thu Lan: PIN `2222`

## Dữ liệu được lưu ở đâu

- Toàn bộ dữ liệu nằm trong **trình duyệt của từng máy** (localStorage). Không có máy chủ nào nhận dữ liệu.
- Muốn chuyển máy: **Cài đặt → Tải file sao lưu**, rồi trên máy mới bấm **Khôi phục từ file**.
- Xóa dữ liệu trang web trong trình duyệt sẽ mất dữ liệu, nên tải file sao lưu định kỳ.
- Mật khẩu được băm SHA-256. Khu quản trị tự khóa sau 10 phút không thao tác.

## Cấu trúc

```
index.html                 trang giới thiệu (landing page)
img/, fonts/, icon.svg…    ảnh chụp app, font và icon của landing
sw.js                      dọn service worker cũ (khi app còn nằm ở gốc)
huong-dan-su-dung.pdf      hướng dẫn sử dụng; nguồn trong docs/guide/
app/index.html             web app
app/css/app.css            giao diện app (phong cách thể thao, sáng/tối)
app/js/core.js             dữ liệu, môn thể thao, tính tiền, VietQR, hội mẫu
app/js/views.js            các màn hình
app/js/app.js              hành động, biểu mẫu, link chia sẻ, sao lưu, khởi động
app/js/qrcode.js           thư viện tạo mã QR (MIT, Kazuhiko Arase)
app/fonts/                 Be Vietnam Pro (SIL OFL 1.1, xem OFL-fonts.txt)
app/sw.js, app/manifest.webmanifest, app/icon*.png   PWA
```

Thông tin nhận ủng hộ nằm ở hằng `DONATE` trong `app/js/core.js`.

## Giấy phép bên thứ ba

- Font Be Vietnam Pro: SIL Open Font License 1.1 (`OFL-fonts.txt`).
- qrcode-generator © Kazuhiko Arase, MIT. “QR Code” là nhãn hiệu của DENSO WAVE. VietQR là nhãn hiệu của Napas.
