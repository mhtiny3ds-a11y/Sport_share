# Cài đặt Firebase cho Sport Share

Làm một lần, khoảng 15 phút. Gói **Spark (miễn phí)** là đủ, **không cần thẻ thanh toán**, nên không thể phát sinh phí.

Chưa làm các bước này thì app chỉ có **"Chơi thử hội mẫu"**: không đăng nhập được, không lập được hội thật.

---

## Bước 1. Tạo dự án
1. Mở <https://console.firebase.google.com>, đăng nhập bằng tài khoản Google sẽ dùng lâu dài cho Sport Share.
2. Bấm **Create a project** (Tạo dự án), đặt tên `sportshare` (hoặc tên bạn thích).
3. Màn **Google Analytics**: **tắt** (không cần), rồi bấm **Create project**.

## Bước 2. Đăng ký web app và lấy cấu hình
1. Ở trang **Project Overview**, bấm biểu tượng **`</>` (Web)**.
2. App nickname: `Sport Share`. **Không** tích *Firebase Hosting*. Bấm **Register app**.
3. Firebase hiện một đoạn `const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "...", ... }`. **Chép đoạn đó** để dùng ở Bước 6.
   - Các giá trị này **không phải mật khẩu**. Chúng vốn nằm công khai trong mã nguồn mọi web app dùng Firebase. Dữ liệu được bảo vệ bằng quy tắc bảo mật ở Bước 4.

## Bước 3. Bật đăng nhập
1. Menu trái: **Build → Authentication → Get started**.
2. Tab **Sign-in method**:
   - **Google** → bật **Enable** → chọn *Project support email* (email của bạn) → **Save**.
   - **Email/Password** → bật **dòng đầu tiên** (Email/Password). *Không* cần bật Email link → **Save**.
3. Tab **Settings → Authorized domains → Add domain**, thêm lần lượt:
   - `sportshare.pro.vn`
   - `mhtiny3ds-a11y.github.io`

   (`localhost` có sẵn, giữ nguyên.)
4. (Nên làm) **Templates** → biểu tượng ✏️ → **Template language: Vietnamese**. Email đặt lại mật khẩu sẽ là tiếng Việt.
5. (Nên làm) **⚙️ Project settings → General → Public-facing name**: `Sport Share`. Tên này hiện trong cửa sổ đăng nhập Google.

## Bước 4. Tạo cơ sở dữ liệu Firestore
1. Menu trái: **Build → Firestore Database → Create database**.
2. Nếu được hỏi phiên bản, chọn **Standard edition**.
3. **Location**: chọn **`asia-southeast1 (Singapore)`**, gần Việt Nam nhất. *Không đổi được về sau.*
4. Chọn **Start in production mode** → **Create**.
5. Mở tab **Rules**, xóa hết nội dung có sẵn, dán **toàn bộ** file [`firestore.rules`](firestore.rules) trong thư mục này → **Publish**.

## Bước 5. (Không bắt buộc) Giới hạn khóa API theo tên miền
Google Cloud Console → **APIs & Services → Credentials** → mở khóa *Browser key (auto created by Firebase)* → **Application restrictions: Websites** → thêm:
- `https://sportshare.pro.vn/*`
- `https://mhtiny3ds-a11y.github.io/*`
- `http://localhost/*`

Bấm **Save**.

## Bước 6. Gắn cấu hình vào app
Chọn **một** trong hai cách:
- **Gửi đoạn `firebaseConfig` ở Bước 2 cho Claude** để Claude cập nhật và đẩy lên GitHub. Hoặc:
- Tự sửa trên GitHub: mở file `app/js/firebase-config.js` → bấm ✏️ → thay dòng `window.FIREBASE_CONFIG = null;` bằng:

  ```js
  window.FIREBASE_CONFIG = {
    apiKey: "…",
    authDomain: "….firebaseapp.com",
    projectId: "…",
    storageBucket: "…",
    messagingSenderId: "…",
    appId: "…"
  };
  ```

  → **Commit changes**. Khoảng 1–2 phút sau, `sportshare.pro.vn/app` sẽ có nút **Tiếp tục với Google**.

## Kiểm tra
1. Mở `https://sportshare.pro.vn/app`, bấm **Tiếp tục với Google**, đăng nhập.
2. **Lập hội mới**. Vào tab **Hội viên**, bấm **Chép link mời chung**, gửi cho một người khác thử.
3. Firebase Console → **Firestore Database → Data**: thấy collection `clubs`, `invites` là đã chạy.

## Giới hạn gói miễn phí
Khoảng 50.000 lượt đọc, 20.000 lượt ghi mỗi ngày và 1 GB dữ liệu. Mức này dư cho vài chục đến vài trăm hội nhỏ. Xem mức dùng ở **Firestore → Usage**. Nếu sau này thường xuyên chạm giới hạn, mới cần cân nhắc gói trả theo mức dùng (Blaze). Khi đó nhớ đặt **ngân sách và cảnh báo chi phí**.

## Kiểm thử quy tắc bảo mật (cho người phát triển)
```bash
npm i -D firebase firebase-tools @firebase/rules-unit-testing
npx firebase emulators:exec --only firestore --project demo-sportshare "node firebase/rules.test.mjs"
```
Chạy app với bộ giả lập trên máy: `npx firebase emulators:start --only firestore,auth --project demo-sportshare`, rồi mở `http://localhost:8000/app/?emu=1`.
