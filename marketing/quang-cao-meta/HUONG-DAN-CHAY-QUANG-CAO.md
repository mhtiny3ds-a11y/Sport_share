# Bộ quảng cáo Meta (Facebook + Instagram): kéo khách vào sportshare.pro.vn

## Trong gói có gì
3 mẫu quảng cáo, mỗi mẫu đánh vào một lý do khác nhau để khách bấm. Mỗi thư mục `quangcaoN/` gồm:
- `qcN-doc-1080x1350.jpg`: ảnh dọc 4:5 cho Bảng tin. Chiếm nhiều diện tích nhất, **khuyên dùng**.
- `qcN-vuong-1080x1080.jpg`: ảnh vuông 1:1, dự phòng cho Bảng tin, cột phải, Marketplace.
- `qcN-story-1080x1920.jpg`: ảnh 9:16 cho Story và Reels. Phía trên và phía dưới đã chừa trống cho thanh giao diện của Meta.
- `quangcaoN.txt`: văn bản chính, 3 tiêu đề, mô tả, nút kêu gọi và **link có gắn mã theo dõi (UTM)**. Chỉ cần sao chép và dán.

| Mẫu | Góc tiếp cận | Câu mở đầu |
|---|---|---|
| **QC1** | Nỗi khổ của trưởng nhóm | Hết cảnh cầm sổ đi đòi tiền sân |
| **QC2** | Tính năng chia tiền + VietQR | 450K ÷ 8 = 57K, app tự chia |
| **QC3** | Tính năng vote | Ai đi? Ai không? 1 chạm là biết |

Văn bản chính dài hơn 125 ký tự sẽ bị rút gọn kèm nút "Xem thêm". Dòng đầu đã viết để tự đứng được một mình.

---

## Cài đặt chiến dịch (Meta Ads Manager, khoảng 15 phút)
1. Vào **business.facebook.com/adsmanager** → **Tạo** → mục tiêu **Lưu lượng truy cập (Traffic)**.
2. **Chiến dịch:** đặt tên `SportShare_Traffic_T12`. Bật **Ngân sách Advantage của chiến dịch**, ví dụ **100.000–150.000đ/ngày**.
3. **Nhóm quảng cáo:**
   - **Vị trí chuyển đổi:** Trang web.
   - **Tối ưu hóa:** **Lượt click vào liên kết**. Chọn "Lượt xem trang đích" chỉ khi đã gắn Meta Pixel, xem mục cuối.
   - **Đối tượng** (gợi ý, nên thử 2 nhóm quảng cáo):
     - Vị trí: Việt Nam (hoặc chỉ Hà Nội, TP.HCM, Đà Nẵng để bắt đầu). Tuổi 20–45. Giới tính: tất cả.
     - Nhóm A, sở thích: *Cầu lông, Pickleball, Bóng đá, Tennis, Bóng bàn, Bóng chuyền, Câu lạc bộ thể thao, Sân thể thao*.
     - Nhóm B: **Advantage+ audience** (để Meta tự tìm), chỉ gợi ý các sở thích trên.
   - **Vị trí quảng cáo:** Advantage+ placements (tự động).
4. **Quảng cáo:** tạo **3 quảng cáo** trong cùng một nhóm, mỗi quảng cáo là một mẫu QC1, QC2, QC3:
   - Định dạng: **Ảnh đơn**. Tải ảnh **dọc 4:5**, rồi bấm **Chỉnh sửa vị trí** để thay ảnh **story 9:16** cho Story và Reels.
   - Dán văn bản chính, tiêu đề, mô tả, nút và link từ `quangcaoN.txt`.
   - **Tắt** các tùy chọn tự chỉnh ảnh hoặc tự thêm nhạc của Advantage+ creative nếu thấy ảnh bị cắt sai.
5. **Đăng**. Meta duyệt trong vài giờ.

## Đọc kết quả và tối ưu
- Để chạy **3–4 ngày** chưa sửa gì. Sau đó so sánh 3 mẫu theo:
  - **CTR (tỷ lệ bấm vào liên kết)**: trên 1% là ổn, trên 2% là tốt.
  - **CPC (giá mỗi lượt bấm)**: đồ thể thao hay app tại Việt Nam thường khoảng **1.000–4.000đ / lượt bấm**. Đây là mức tham khảo, thực tế tùy đối tượng và thời điểm.
- **Tắt mẫu kém nhất**, dồn tiền cho mẫu tốt nhất. Sau 1–2 tuần, nhắn tôi làm thêm mẫu mới theo hướng đang thắng.
- Giờ dân chơi thể thao lướt điện thoại nhiều: trưa 11–13h, tối 20–23h.

## Lưu ý quan trọng
- **Chính sách Meta:** văn bản không nói "Bạn đang nợ…" hay đoán thông tin cá nhân của người xem (đã viết tránh). Không hứa hẹn kiếm tiền. Ảnh là màn hình thật của app.
- **Khách bấm quảng cáo sẽ mở trong trình duyệt của Facebook.** Trình duyệt này chặn đăng nhập Google, nên app đã tự hiện hướng dẫn "Mở bằng Chrome/Safari", và đăng nhập bằng email vẫn dùng được. Vì vậy link quảng cáo dẫn tới **landing page** (trang giới thiệu) trước, không dẫn thẳng vào app.
- **Link có mã UTM** (`utm_source=facebook…utm_content=qc1`) để sau này biết khách đến từ quảng cáo nào khi gắn công cụ thống kê.

## Nên làm thêm để đo hiệu quả (tôi làm được)
1. **Gắn Meta Pixel** vào landing page và app. Bạn tạo Pixel trong **Trình quản lý sự kiện (Events Manager)** rồi gửi tôi **mã Pixel ID** (một dãy số).
   - Khi đó tối ưu được theo **Lượt xem trang đích**, và về sau theo **Đăng ký tài khoản**. Khách chất lượng hơn, giá rẻ hơn.
   - Nhớ cập nhật Chính sách quyền riêng tư (tôi sửa giúp).
2. **Thống kê truy cập** (Cloudflare Web Analytics, GoatCounter hoặc Google Analytics) để thấy lượt vào web theo từng quảng cáo nhờ mã UTM.
3. **Đếm số tài khoản mới mỗi ngày** trong Firebase Console → Authentication → Users, so với ngày chạy quảng cáo.
