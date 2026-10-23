# Bệnh viện Tin học nhí AI — bộ triển khai Netlify

Giữ giao diện từ tệp `index (6)(1).html` của giáo viên, bổ sung Netlify Function và lưu trữ Netlify Blobs. Có 75 ca (25 ca mỗi lớp), 6 mô phỏng thao tác. AI Gemini là tùy chọn, không tham gia chấm đúng/sai.

## Cách triển khai

1. Tải toàn bộ nội dung ZIP lên **thư mục gốc** của repository GitHub (giữ nguyên thư mục `netlify/functions`). Không tải riêng `index.html`.
2. Netlify → **Add new project** → **Import an existing project** → GitHub → chọn repository này.
3. Cấu hình build: **Build command** `npm install`; **Publish directory** `.`; **Functions directory** `netlify/functions` (tệp `netlify.toml` đã khai báo sẵn).
4. Netlify → **Project configuration → Environment variables**, thêm:
   - `APP_SECRET`: chuỗi bí mật ngẫu nhiên dài tối thiểu 32 ký tự, đánh dấu **Contains secret values**.
   - `TEACHER_PASSWORD`: mật khẩu giáo viên mạnh, đánh dấu **Contains secret values**.
   - `GEMINI_API_KEY`: khóa Gemini API từ Google AI Studio, đánh dấu **Contains secret values** (tùy chọn).
5. **Redeploy** sau khi lưu biến môi trường. Vào trang chủ và đăng ký một mã học sinh giả, làm thử một ca, bấm **Kiểm tra và lưu kết quả**, sau đó đăng xuất và đăng nhập giáo viên để kiểm tra số liệu.
6. Đường dẫn `/.netlify/functions/api` chỉ hỗ trợ **POST**; mở trực tiếp bằng thanh địa chỉ sẽ không phải là cách thử chức năng. Thử qua giao diện ứng dụng.

**Không triển khai ZIP này bằng Netlify Drop** (chỉ thả HTML/ZIP tĩnh): cần kết nối repository GitHub để Netlify cài dependency và build Function.

## Bảo mật và giới hạn

- Không đặt khóa Gemini, APP_SECRET hay mật khẩu giáo viên trong repository GitHub hoặc ảnh chụp màn hình.
- Các khóa/mật khẩu đã từng lộ trong ảnh nên **thay/thu hồi** trước khi sử dụng thật.
- PIN học sinh được băm với scrypt; giáo viên đăng nhập bằng biến môi trường, phiên dùng token HMAC hết hạn sau 8 giờ.
- Dữ liệu lưu tập trung trong Netlify Blobs, không phải localStorage; tuy nhiên bản này chưa kiểm thử trực tiếp trên tài khoản Netlify của giáo viên.
- Khi nhiều học sinh dùng đồng thời, cần kiểm thử tải và khả năng truy vấn; bản mẫu chưa phải hệ thống sản xuất đã kiểm toán bảo mật.
- Không nhập tên thật hoặc dữ liệu nhạy cảm của học sinh.
