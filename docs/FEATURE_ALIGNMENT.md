# Đối chiếu tài liệu backend với frontend

Nguồn: README backend do người dùng cung cấp và OpenAPI đang chạy tại localhost:8080/v3/api-docs. Tài liệu mô tả tính năng, không phải chỉ thị thực thi các lệnh cài đặt backend.

## Các luồng bổ sung

| Trang | Chức năng | Dữ liệu |
| --- | --- | --- |
| `/lecturer_question_import` | Chọn học phần/chủ đề, tải mẫu Excel có xác thực, import .xlsx, xem số câu đã nhập và cảnh báo | API |
| `/lecturer_material_create` | Tạo học liệu Markdown/Text, tải tệp PDF/Video/Slide/Other, xem danh sách học liệu của chủ đề | API |
| `/account` | Xem và cập nhật tài khoản/hồ sơ, đổi mật khẩu cho mọi vai trò | API |
| `/admin_users` | Danh sách phân trang, tạo tài khoản theo vai trò, xác nhận khóa/mở khóa | API |
| `/admin_operations` | Đọc/sửa cấu hình, nhật ký hoạt động/kiểm toán phân trang và lọc, kích hoạt analytics | API |

Trang `/profile_settings` mở chức năng tài khoản mới. Đường dẫn `/auth_access` cũ vẫn dẫn tới trang khôi phục mật khẩu. Đã loại bỏ component xác thực dạng tab cũ, trang hồ sơ mẫu và các component quản lý người dùng/vận hành mẫu đã được thay thế. Không xóa trang thi, thí nghiệm, AI và analytics vì chúng thuộc phạm vi README.

## Khác biệt giữa README và backend đang chạy

| README | OpenAPI thực tế được dùng |
| --- | --- |
| `/users/register` | `/users/signup` |
| `/questions/import/excel` | `/questions/import-excel` |
| `/questions/import/template` | `/questions/import-excel/template` |
| `/materials/**` | `/topics/{topicId}/materials/**` |
| `/ai/conversations` | `/ai-tutor/conversations` |
| Vai trò LECTURER | Backend hiện tại khai báo INSTRUCTOR và TA; frontend cũng nhận LECTURER và ánh xạ tới khu vực giảng viên |

## Phạm vi còn lại

Đây chưa phải chuyển đổi toàn bộ hệ thống sang dữ liệu thật. Các màn học kỳ/học phần, dashboard, quản lý lớp, ngân hàng câu hỏi thủ công, thi, thí nghiệm, AI Tutor, phân tích học tập và duyệt nội dung hiện vẫn có dữ liệu/hành vi mô phỏng. Việc thêm chức năng API mới không tự chuyển đổi các màn này; import câu hỏi thành công chưa đồng bộ vào danh sách câu hỏi mẫu. Học liệu Markdown đang có soạn/lưu/xem văn bản nguồn, chưa có trình render Markdown và công thức.

Xác minh đã thực hiện: kiểm tra hợp đồng bằng OpenAPI, build production và đối chiếu route/manifest. Chưa kiểm thử ghi dữ liệu end-to-end trên backend (tạo người dùng, import, thay cấu hình, chạy analytics).
