# PTIT Physics 1 — React

Dự án đã được chuyển sang React + Vite. Các màn hình Student và Lecturer được tổ chức thành page component riêng trong `src/pages`; runtime không import hoặc phụ thuộc vào thư mục `Code`.

Tailwind được build trực tiếp qua PostCSS trong Vite, không còn dùng Tailwind CDN. Vì vậy các class màu, spacing và responsive được sinh đầy đủ khi chạy production.

Các thành phần dùng chung nằm trong `src/components` và `src/styles`: `AppShell`, `ImmersiveShell`, `Sidebar`, `Header`, `Footer`, `Breadcrumbs`, `Card`, `StatCard`, `ProgressBar`, `StatusBadge` và `SectionHeader`. Các trang nghiệp vụ dùng lại `AppShell`; các màn hình toàn màn hình dùng `ImmersiveShell`.

## Chạy dự án

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

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
