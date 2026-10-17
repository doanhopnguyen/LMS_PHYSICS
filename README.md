# PTIT Physics 1 — React

Dự án đã được chuyển sang React + Vite. Các màn hình Student và Lecturer được tổ chức thành page component riêng trong `src/pages`; runtime không import hoặc phụ thuộc vào thư mục `Code`.

Tailwind được build trực tiếp qua PostCSS trong Vite, không còn dùng Tailwind CDN. Vì vậy các class màu, spacing và responsive được sinh đầy đủ khi chạy production.

Các thành phần dùng chung nằm trong `src/components` và `src/styles`: `AppShell`, `ImmersiveShell`, `Sidebar`, `Header`, `Footer`, `Breadcrumbs`, `Card`, `StatCard`, `ProgressBar`, `StatusBadge` và `SectionHeader`. Các trang nghiệp vụ dùng lại `AppShell`; các màn hình toàn màn hình dùng `ImmersiveShell`.

## Chạy dự án

Yêu cầu Node.js 22 LTS và npm. Sau khi clone repository, chạy tại thư mục có `package.json`:

```bash
npm ci
npm run dev
```

Mặc định frontend chạy tại `http://localhost:5173`, gọi backend ở `http://localhost:8080`. Nếu cần đổi địa chỉ, sao chép `.env.example` thành `.env.local` rồi chỉnh các biến tương ứng. Không cần có sẵn `dist/`, `node_modules/` hoặc file tạm để cài đặt và build. Các chức năng đăng nhập, lấy dữ liệu và lưu thay đổi cần backend đang chạy.

Build production:

```bash
npm run build
npm run preview
```

Triển khai toàn bộ nội dung `dist/` được tạo sau khi build, gồm `index.html`, `assets/` và ảnh. Máy chủ cần trả `index.html` cho các đường dẫn giao diện như `/admin_classes` khi truy cập trực tiếp. Cấu hình chuyển tiếp `/api` tới backend hoặc đặt `VITE_API_BASE_URL` trước khi build; proxy phát triển của Vite không thay thế cấu hình máy chủ production.

## Tổ chức mã nguồn và file sinh tự động

- `src/`: mã nguồn giao diện và các thành phần dùng chung.
- `public/`, `Images/`: tài nguyên gốc của dự án, được lưu trong Git.
- `scripts/`: các công cụ kiểm tra có thể chạy lại; dữ liệu giả lập nằm trong `scripts/fixtures/`.
- `docs/`: tài liệu và bằng chứng kiểm tra được chủ động lưu lại.
- `artifacts/`: ảnh chụp và báo cáo mới do công cụ kiểm tra sinh ra, không đưa vào Git.
- `.tmp-tools/`: script dùng một lần; các thư mục `.tmp-*` khác chứa dữ liệu tạm và hồ sơ trình duyệt, không đưa vào Git.
- `dist/`: bản build tạo bởi `npm run build`, không lưu trong Git. Chạy build sau khi clone và khi cập nhật bản triển khai.

Các file `.env` và `.env.*` là cấu hình cục bộ; chỉ `.env.example` được lưu trong Git. `.gitignore` cũng loại trừ dependency, log, cache và kết quả kiểm tra. Không dùng `git add -f` cho các file sinh tự động.

Ảnh dùng trong giao diện lấy từ `public/`; Vite sao chép chúng vào `dist/` khi build. `Images/` chứa ảnh tham khảo thiết kế, không phải thư mục ảnh phục vụ ứng dụng. Không trỏ mã nguồn vào `dist/` hoặc dùng URL có tiền tố `/public/`.

Chạy `npm run check:assets` để kiểm tra ảnh gốc được Git theo dõi và liệt kê ảnh chưa có tham chiếu trực tiếp. Sau khi build, chạy `npm run check:assets -- --build` để đối chiếu từng file gốc với bản trong `dist/`. Ảnh chưa có tham chiếu cần được xem xét trước khi xóa.

## Kết nối backend API

Các trang mới: `/lecturer_question_import` (Excel), `/lecturer_material_create` (Markdown/tệp), `/account` (hồ sơ và mật khẩu). Quản trị người dùng và cấu hình/nhật ký đã gọi API thật. Chi tiết phạm vi và các màn còn dùng dữ liệu mẫu: [docs/FEATURE_ALIGNMENT.md](docs/FEATURE_ALIGNMENT.md).

Frontend gọi API theo đặc tả tại tiền tố `/api/v1`. Khi chạy phát triển, Vite proxy `/api` tới `http://localhost:8080`; có thể đổi bằng `VITE_API_PROXY_TARGET` trong `.env.local`. Với frontend triển khai riêng miền, đặt `VITE_API_BASE_URL` thành origin backend (không kèm dấu `/` cuối). Xem các biến mẫu trong `.env.example`.

Lớp gọi API nằm ở `src/lib/apiClient.js`: tự gắn JWT Bearer, tự làm mới access token một lần khi nhận 401, và chuẩn hóa lỗi trả về từ API. Luồng đăng nhập, đăng ký, quên/đặt lại mật khẩu và đăng xuất đã sử dụng lớp này.

Các màn hình được ánh xạ theo các đường dẫn `.html` cũ, ví dụ `/dashboard.html`, `/library.html`, `/virtual_lab.html`.

Khu vực giảng viên bắt đầu tại `/lecturer_dashboard.html`, với các trang quản lý học phần, sinh viên, học liệu, ngân hàng câu hỏi, đánh giá, chấm bài, thí nghiệm, AI Insights và phân tích học tập trong `src/pages/lecturers`.

Quét lại toàn bộ HTML:

```bash
npm run scan:html
```
