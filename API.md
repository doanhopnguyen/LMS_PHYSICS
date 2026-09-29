# API Reference – Vật lý 1

> Cập nhật theo các controller và cấu hình bảo mật trong mã nguồn, ngày 29/09/2026. Hiện có **140 thao tác REST** với tiền tố chung `/api/v1`.

## Xác thực và phân quyền

- API có xác thực dùng `Authorization: Bearer <accessToken>`.
- Upload, nhập Excel và nộp bài dùng `multipart/form-data`; các request còn lại thường dùng `application/json`.
- Các role: `STUDENT`, `TA`, `INSTRUCTOR`, `ADMIN`.
- Kế thừa quyền: `ADMIN` có quyền của `INSTRUCTOR`, `TA`, `STUDENT`; `INSTRUCTOR` có quyền của `TA`.
- Do cấu hình `.anyRequest().authenticated()`, endpoint không ghi role cụ thể vẫn **yêu cầu đăng nhập**, ngoại trừ endpoint Public.
- Service tiếp tục kiểm tra quan hệ dữ liệu: chủ lớp, trợ giảng được phân công, sinh viên thuộc lớp hoặc chủ sở hữu bản ghi.

## Ma trận API theo đối tượng, chức năng và rule

> Đây là góc nhìn theo nghiệp vụ. Danh sách route đơn lẻ, method và quyền chính xác của toàn bộ **140 endpoint** nằm ở các bảng theo role phía dưới. `ALL_AUTH` nghĩa là mọi người dùng đã đăng nhập (ADMIN, INSTRUCTOR, TA, STUDENT).

| Đối tượng | Chức năng / nhóm route | Quyền chính | Rule nghiệp vụ cụ thể |
|---|---|---|---|
| Xác thực & tài khoản | `/users/signin`, `signup`, `refresh`, `forgot-password`, `reset-password` | Public | Signup luôn tạo `STUDENT`; refresh token được xoay vòng; reset token chỉ dùng một lần và có hạn. |
| Hồ sơ cá nhân | `/users/me`, `/users/me/profile`, `/users/me/password`, `/users/logout` | ALL_AUTH | Chỉ được đọc/sửa hồ sơ, đổi mật khẩu và hủy refresh token của chính mình. |
| Quản trị người dùng | `/users/admin/**`, `/users/{username}` | ADMIN | Tạo tài khoản theo role, sửa email/role/trạng thái, tra cứu hoặc xóa tài khoản. |
| Nhập sinh viên | `/users/import-excel/**` | ADMIN, INSTRUCTOR | Chỉ nhận Excel; có thể chỉ định lớp để ghi danh sau khi tạo. |
| Học kỳ | `/semesters/**` | Đọc: ALL_AUTH; ghi: ADMIN | Chỉ ADMIN tạo/sửa/chọn học kỳ hiện tại; chỉ một học kỳ được đặt current theo từng lần cập nhật. |
| Môn học | `/subjects/**` | Đọc: ALL_AUTH; ghi: ADMIN | Không sửa mã môn; bật/tắt là xóa mềm thay vì xóa vật lý. |
| Chủ đề | `/subjects/{subjectId}/topics/**` | Đọc: ALL_AUTH; tạo/sửa: ADMIN, INSTRUCTOR; xóa: ADMIN | Chủ đề phải thuộc môn học; thứ tự/chủ đề được kiểm tra trong service. |
| Học liệu | `/topics/{topicId}/materials/**` | Đọc: ALL_AUTH; ghi: ADMIN, INSTRUCTOR | Tải lên bằng multipart; tạo phiên bản/phê duyệt; chỉ người có quyền nội dung được xuất bản/xóa. |
| Tệp lưu trữ | `POST /files/upload`, `GET /files/**` | Upload: ALL_AUTH; tải: Public | Upload multipart; endpoint tải tệp được công khai để trình duyệt/MinIO sử dụng URL tệp. |
| Lớp học & nhân sự | `/classes`, `/classes/{id}`, `/staff`, `/students` | Xem: ADMIN, INSTRUCTOR, TA; ghi: ADMIN, INSTRUCTOR | INSTRUCTOR chỉ thao tác lớp do mình phụ trách hoặc được phân công; TA chỉ xem dữ liệu lớp được giao. |
| Ghi danh | `/classes/{id}/enroll-single`, `enroll-bulk`, `students/{studentId}` | ADMIN, INSTRUCTOR | Không được ghi danh trùng; trạng thái ghi danh quyết định sinh viên có thể truy cập dữ liệu lớp. |
| Lịch & tiến độ lớp | `/classes/{classId}/schedules`, `/classes/{classId}/progress` | Xem lịch: thành viên lớp; quản lý lịch/tiến độ lớp: ADMIN, INSTRUCTOR | STUDENT chỉ xem lịch lớp mình ghi danh; TA chỉ xem lớp được phân công. |
| Không gian sinh viên | `/students/me/classes`, `schedule`, `progress`, `activity-logs`, `evidence` | STUDENT, ADMIN | Dữ liệu cá nhân luôn bị giới hạn theo user đăng nhập; ADMIN có thể hỗ trợ tra cứu. |
| Thông báo | `/notifications/**` | Cá nhân: ALL_AUTH; gửi lớp: ADMIN, INSTRUCTOR | Đọc/xóa/đánh dấu chỉ tác động thông báo của chính người dùng; gửi lớp kiểm tra quyền chủ lớp. |
| Bài thí nghiệm | `/experiments/**`, `/experiments/assignments/**`, `/submissions/**` | Xem: ALL_AUTH; tạo/giao: ADMIN, INSTRUCTOR; nộp: STUDENT; chấm: TA/INSTRUCTOR/ADMIN | Sinh viên chỉ nộp bài được giao cho lớp của mình; một bài nộp ứng với một assignment và sinh viên; chấm điểm theo rubric. |
| AI Tutor | `/ai-tutor/**` | STUDENT, ADMIN | Sinh viên chỉ tạo/xem/kết thúc hội thoại và đánh giá phản hồi của chính mình; phiên AI gắn với chủ đề/học liệu. |
| Ngân hàng câu hỏi | `/questions/**` | ADMIN, INSTRUCTOR; phê duyệt: ADMIN | Câu hỏi gắn chủ đề, có đáp án và độ khó; import dùng multipart Excel; chỉ ADMIN phê duyệt câu hỏi. |
| Ma trận đề | `/exam-matrices/**` | Xem: ADMIN, INSTRUCTOR, TA; ghi: ADMIN, INSTRUCTOR | Ma trận phân bổ câu hỏi theo chủ đề/độ khó; phải validate trước khi dùng sinh đề. |
| Kỳ thi & lượt thi | `/exams/**`, `/exams/attempts/**` | Tạo/quản lý: ADMIN, INSTRUCTOR; xem/chấm: theo role; làm bài: STUDENT | Chỉ sinh viên đủ điều kiện lớp hoặc thi ghép mới bắt đầu/nộp bài; giới hạn `maxAttempts`, thời gian mở/đóng và quyền sở hữu attempt được kiểm tra. |
| Dashboard & analytics | `/dashboard/**`, `/analytics/**` | Dashboard cá nhân: STUDENT; lớp/analytics: INSTRUCTOR, ADMIN; trigger: ADMIN | Báo cáo lớp chỉ trong phạm vi lớp phụ trách; regenerate dashboard và chạy tổng hợp analytics là tác vụ ADMIN. |
| Minh chứng | `/students/**/evidence`, `/classes/{id}/evidence` | Cá nhân: STUDENT; lớp: INSTRUCTOR, ADMIN | Sinh viên chỉ xem minh chứng bản thân; giảng viên xem theo lớp phụ trách. |
| Nhật ký & cấu hình | `/admin/activity-logs`, `/admin/audit-logs`, `/admin/settings/**` | ADMIN | Chỉ ADMIN tra cứu log hệ thống hoặc thay đổi cấu hình; cập nhật settings được audit. |
| Vận hành hệ thống | `/actuator/health`, `/actuator/**`, Swagger | Health/Swagger: Public; actuator khác: ADMIN | Health dùng giám sát; các actuator khác không công khai để tránh lộ trạng thái vận hành. |

### Endpoint Public

| Method | API | Chức năng |
|---|---|---|
| POST | `/users/signin` | Đăng nhập, trả access/refresh token. |
| POST | `/users/signup` | Đăng ký tài khoản mới; role luôn là `STUDENT`. |
| POST | `/users/refresh` | Làm mới access/refresh token. |
| POST | `/users/forgot-password` | Yêu cầu gửi token đặt lại mật khẩu qua email. |
| POST | `/users/reset-password` | Đặt lại mật khẩu bằng token hợp lệ. |
| GET | `/files/**` | Stream/tải tệp công khai từ kho lưu trữ. |
| GET | `/actuator/health` | Kiểm tra tình trạng dịch vụ. |
| GET | `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html` | OpenAPI và Swagger UI. |

### Mọi người dùng đã đăng nhập

| Method | API | Chức năng |
|---|---|---|
| GET | `/users/me` | Lấy tài khoản hiện tại. |
| PUT | `/users/me` | Cập nhật username/email của bản thân. |
| GET | `/users/me/profile` | Lấy hồ sơ cá nhân. |
| PUT | `/users/me/profile` | Cập nhật hồ sơ cá nhân. |
| PUT | `/users/me/password` | Đổi mật khẩu hiện tại. |
| POST | `/users/logout` | Thu hồi refresh token/đăng xuất. |
| POST | `/files/upload` | Tải tệp hoặc hình ảnh lên MinIO. |
| GET | `/notifications` | Danh sách thông báo cá nhân. |
| GET | `/notifications/summary` | Số thông báo chưa đọc và các thông báo mới. |
| PUT | `/notifications/{id}/read` | Đánh dấu một thông báo đã đọc. |
| PUT | `/notifications/read-all` | Đánh dấu toàn bộ thông báo đã đọc. |
| DELETE | `/notifications/{id}` | Xóa thông báo của bản thân. |
| POST | `/notifications/reminders/generate` | Sinh thông báo nhắc lịch học sắp tới. |
| GET | `/semesters` | Danh sách học kỳ. |
| GET | `/semesters/{id}` | Chi tiết học kỳ. |
| GET | `/subjects` | Danh sách môn học. |
| GET | `/subjects/{id}` | Chi tiết môn học. |
| GET | `/subjects/{subjectId}/topics` | Danh sách chương mục của môn học. |
| GET | `/subjects/{subjectId}/topics/{topicId}` | Chi tiết chương mục. |
| GET | `/topics/{topicId}/materials` | Danh sách học liệu của chương mục. |
| GET | `/topics/{topicId}/materials/{materialId}` | Chi tiết học liệu. |
| GET | `/experiments` | Danh sách bài thí nghiệm theo môn học. |
| GET | `/experiments/{experimentId}` | Chi tiết bài thí nghiệm. |

## STUDENT

> `ADMIN` cũng được dùng các API trong mục này.

| Method | API | Chức năng |
|---|---|---|
| GET | `/students/me/classes` | Danh sách lớp sinh viên đang ghi danh. |
| GET | `/students/me/schedule` | Lịch học của các lớp đang tham gia. |
| GET | `/students/me/progress` | Tiến độ học tập cá nhân theo lớp. |
| PUT | `/students/me/progress` | Cập nhật trạng thái/thời lượng học liệu cá nhân. |
| GET | `/students/me/activity-logs` | Nhật ký hoạt động học tập cá nhân. |
| GET | `/students/me/evidence` | Kho minh chứng thí nghiệm của bản thân. |
| GET | `/students/{id}/evidence` | Xem minh chứng; sinh viên chỉ được xem bản thân. |
| GET | `/dashboard/me` | Dashboard học tập cá nhân. |
| GET | `/classes/{classId}/schedules` | Lịch của lớp mà sinh viên được phép xem. |
| GET | `/exams/class/{classId}` | Danh sách kỳ thi của lớp. |
| GET | `/exams/{examId}` | Chi tiết kỳ thi được phép truy cập. |
| POST | `/exams/{examId}/attempts` | Bắt đầu một lượt thi. |
| POST | `/exams/attempts/{attemptId}/answers` | Lưu đáp án tạm thời. |
| PUT | `/exams/attempts/{attemptId}/submit` | Nộp bài và chấm điểm tự động. |
| GET | `/exams/{examId}/my-attempt` | Lấy lượt thi gần nhất. |
| GET | `/exams/{examId}/my-attempts` | Lịch sử các lượt thi. |
| GET | `/exams/attempts/{attemptId}` | Chi tiết kết quả lượt thi của bản thân. |
| GET | `/exams/my-transferred-exams` | Các ca thi ghép được cấp quyền. |
| POST | `/experiments/assignments/{assignmentId}/submit` | Nộp bài thí nghiệm (multipart). |
| POST | `/ai-tutor/conversations` | Khởi tạo phiên hội thoại AI Socratic. |
| GET | `/ai-tutor/conversations/my` | Danh sách hội thoại AI của bản thân. |
| GET | `/ai-tutor/conversations/{conversationId}/messages` | Lịch sử tin nhắn của một hội thoại. |
| POST | `/ai-tutor/conversations/{conversationId}/messages` | Gửi câu hỏi/tin nhắn cho AI Tutor. |
| PUT | `/ai-tutor/conversations/{conversationId}/end` | Kết thúc hội thoại AI. |
| POST | `/ai-tutor/messages/{messageId}/feedback` | Gửi đánh giá phản hồi của AI. |

## TA

> `INSTRUCTOR` và `ADMIN` kế thừa quyền TA. Dữ liệu được giới hạn ở lớp được phân công.

| Method | API | Chức năng |
|---|---|---|
| GET | `/classes` | Danh sách lớp được phép xem. |
| GET | `/classes/{id}` | Chi tiết lớp. |
| GET | `/classes/{id}/staff` | Danh sách giảng viên/trợ giảng lớp. |
| GET | `/classes/{id}/students` | Danh sách sinh viên lớp. |
| GET | `/classes/{classId}/schedules` | Lịch học của lớp. |
| GET | `/exams/class/{classId}` | Danh sách kỳ thi của lớp. |
| GET | `/exams/{examId}` | Chi tiết kỳ thi. |
| GET | `/exams/attempts/{attemptId}` | Xem lượt thi/bài làm theo phạm vi được cấp. |
| GET | `/exams/{examId}/roster` | Danh sách thí sinh của ca thi. |
| GET | `/exams/{examId}/questions` | Xem danh sách câu hỏi của đề thi. |
| POST | `/experiments/submissions/{submissionId}/scores` | Chấm điểm bài nộp thí nghiệm theo rubric. |

## INSTRUCTOR

> `ADMIN` kế thừa toàn bộ quyền dưới đây. Với thao tác theo lớp, giảng viên phải là chủ lớp hoặc được phân công phù hợp.

### Lớp học và lịch học

| Method | API | Chức năng |
|---|---|---|
| POST | `/classes` | Tạo lớp học; giảng viên tạo sẽ là chủ lớp. |
| PUT | `/classes/{id}` | Cập nhật thông tin lớp. |
| PUT | `/classes/{id}/status` | Đổi trạng thái lớp: DRAFT/ACTIVE/COMPLETED/ARCHIVED. |
| POST | `/classes/{id}/staff` | Phân công giảng viên hoặc trợ giảng. |
| DELETE | `/classes/{id}/staff/{userId}` | Gỡ nhân sự khỏi lớp. |
| POST | `/classes/{id}/enroll-single` | Ghi danh một sinh viên. |
| POST | `/classes/{id}/enroll-bulk` | Ghi danh hàng loạt sinh viên. |
| PUT | `/classes/{id}/students/{studentId}/status` | Đổi trạng thái ghi danh. |
| DELETE | `/classes/{id}/students/{studentId}` | Xóa sinh viên khỏi lớp. |
| GET | `/classes/{id}/activity-logs` | Nhật ký hoạt động của lớp. |
| POST | `/classes/{classId}/schedules` | Thêm lịch học lớp. |
| PUT | `/classes/schedules/{scheduleId}` | Cập nhật lịch học. |
| DELETE | `/classes/schedules/{scheduleId}` | Xóa lịch học. |
| GET | `/classes/{classId}/progress` | Tiến độ hoàn thành học liệu của cả lớp. |
| GET | `/classes/{id}/evidence` | Tổng hợp minh chứng thí nghiệm của lớp. |
| GET | `/dashboard/class/{id}` | Dashboard tổng hợp lớp. |
| GET | `/dashboard/class/{id}/student/{studentId}` | Dashboard của một sinh viên trong lớp. |
| POST | `/notifications/classes/{classId}` | Gửi thông báo đến sinh viên trong lớp. |

### Nội dung, học liệu và ngân hàng câu hỏi

| Method | API | Chức năng |
|---|---|---|
| POST | `/subjects/{subjectId}/topics` | Tạo chương mục kiến thức. |
| PUT | `/subjects/{subjectId}/topics/{topicId}` | Cập nhật chương mục. |
| POST | `/topics/{topicId}/materials` | Tạo/tải lên học liệu. |
| PUT | `/topics/{topicId}/materials/{materialId}` | Cập nhật học liệu. |
| PUT | `/topics/{topicId}/materials/{materialId}/approve` | Phê duyệt/xuất bản học liệu. |
| DELETE | `/topics/{topicId}/materials/{materialId}` | Xóa học liệu. |
| GET | `/questions` | Tìm kiếm/lọc ngân hàng câu hỏi. |
| GET | `/questions/{questionId}` | Chi tiết câu hỏi và đáp án. |
| POST | `/questions` | Tạo câu hỏi trắc nghiệm. |
| PUT | `/questions/{questionId}` | Cập nhật câu hỏi. |
| DELETE | `/questions/{questionId}` | Xóa câu hỏi. |
| GET | `/questions/import-excel/template` | Tải mẫu Excel câu hỏi. |
| POST | `/questions/import-excel` | Nhập hàng loạt câu hỏi từ Excel. |
| GET | `/users/import-excel/template` | Tải mẫu Excel tài khoản sinh viên. |
| POST | `/users/import-excel` | Tạo hàng loạt tài khoản sinh viên từ Excel. |

### Thí nghiệm, thi và analytics

| Method | API | Chức năng |
|---|---|---|
| POST | `/experiments` | Tạo bài thí nghiệm ảo. |
| POST | `/experiments/{experimentId}/assign` | Giao bài thí nghiệm cho lớp. |
| POST | `/experiments/submissions/{submissionId}/confirmation` | Xác nhận/chốt kết quả thí nghiệm. |
| POST | `/exams` | Tạo kỳ thi. |
| POST | `/exams/{examId}/questions` | Thêm câu hỏi thủ công vào đề. |
| POST | `/exams/{examId}/generate-questions` | Sinh câu hỏi ngẫu nhiên theo ma trận đề. |
| PUT | `/exams/{examId}` | Cập nhật thông tin và thời gian mở kỳ thi. |
| DELETE | `/exams/{examId}` | Xóa kỳ thi. |
| DELETE | `/exams/{examId}/questions/{questionId}` | Gỡ câu hỏi khỏi đề thi. |
| GET | `/exams/{examId}/attempts` | Danh sách lượt làm bài của kỳ thi. |
| PUT | `/exams/attempts/{attemptId}/grade` | Chấm hoặc điều chỉnh điểm một lượt thi. |
| POST | `/exams/{examId}/transfers` | Thêm sinh viên thi ghép. |
| DELETE | `/exams/{examId}/transfers/{studentId}` | Hủy quyền thi ghép của sinh viên. |
| GET | `/analytics/topic-difficulty` | Phân tích độ khó chương mục. |
| GET | `/analytics/question-quality` | Phân tích chất lượng câu hỏi/chỉ số DI. |
| GET | `/analytics/ai-gaps` | Thống kê lỗ hổng kiến thức và tương tác AI. |
| GET | `/analytics/material-effectiveness` | Đánh giá hiệu quả học liệu. |

### Ma trận đề thi

| Method | API | Quyền | Chức năng |
|---|---|---|---|
| GET | `/exam-matrices` | ADMIN, INSTRUCTOR, TA | Danh sách ma trận đề. |
| POST | `/exam-matrices` | ADMIN, INSTRUCTOR | Tạo ma trận đề và chi tiết phân bố câu hỏi. |
| GET | `/exam-matrices/{matrixId}` | ADMIN, INSTRUCTOR, TA | Xem chi tiết ma trận đề. |
| PUT | `/exam-matrices/{matrixId}` | ADMIN, INSTRUCTOR | Cập nhật ma trận đề. |
| DELETE | `/exam-matrices/{matrixId}` | ADMIN, INSTRUCTOR | Xóa ma trận đề. |
| POST | `/exam-matrices/{matrixId}/validate` | ADMIN, INSTRUCTOR | Kiểm tra tính hợp lệ của ma trận trước khi dùng tạo đề. |

## ADMIN

> `ADMIN` có mọi quyền phía trên, cộng thêm các API quản trị riêng.

| Method | API | Chức năng |
|---|---|---|
| POST | `/users/admin/create-user` | Tạo người dùng với role chỉ định. |
| GET | `/users/{username}` | Tra cứu người dùng theo username. |
| DELETE | `/users/{username}` | Xóa người dùng theo username. |
| GET | `/users/admin/users` | Danh sách người dùng phân trang. |
| GET | `/users/admin/users/{id}/profile` | Xem hồ sơ người dùng theo ID. |
| PUT | `/users/admin/users/{id}` | Cập nhật role/email người dùng. |
| PUT | `/users/admin/users/{id}/status` | Khóa hoặc mở khóa tài khoản. |
| GET | `/admin/activity-logs` | Truy vấn nhật ký hoạt động hệ thống. |
| GET | `/admin/audit-logs` | Truy vấn audit log thay đổi dữ liệu. |
| GET | `/admin/settings` | Lấy tất cả cấu hình hệ thống. |
| GET | `/admin/settings/{key}` | Lấy cấu hình theo key. |
| PUT | `/admin/settings/{key}` | Cập nhật một cấu hình. |
| POST | `/admin/settings/bulk` | Cập nhật nhiều cấu hình. |
| POST | `/semesters` | Tạo học kỳ. |
| PUT | `/semesters/{id}` | Cập nhật học kỳ. |
| PUT | `/semesters/{id}/set-current` | Đặt học kỳ hiện tại. |
| POST | `/subjects` | Tạo môn học. |
| PUT | `/subjects/{id}` | Cập nhật môn học. |
| PUT | `/subjects/{id}/toggle-status` | Bật/tắt môn học. |
| DELETE | `/subjects/{subjectId}/topics/{topicId}` | Xóa chương mục. |
| PUT | `/questions/{questionId}/approve` | Phê duyệt câu hỏi vào ngân hàng chính thức. |
| POST | `/analytics/trigger` | Chạy thủ công tổng hợp analytics. |
| POST | `/dashboard/class/{id}/regenerate` | Tạo lại dashboard snapshot cho lớp. |
| GET | `/actuator/**` | Endpoint vận hành Spring Boot (trừ health là Public). |

## Quy ước response

Phần lớn endpoint trả về:

```json
{
  "status": 200,
  "message": "Success",
  "data": {}
}
```

Các API phân trang có `content`, `totalElements`, `totalPages`, `number`, `size`. Schema request/response chi tiết có thể xem tại Swagger UI khi ứng dụng chạy: `http://localhost:8080/swagger-ui/index.html`.

## Hợp đồng JSON cho frontend

### Quy ước request

- Base URL: `/api/v1`.
- API bảo vệ dùng `Authorization: Bearer <accessToken>` và `Content-Type: application/json`.
- API upload/import dùng `multipart/form-data`; không tự đặt `Content-Type` để client tự tạo boundary.
- UUID là định danh nội bộ trong URL/body. UI chọn theo tên/mã rồi gửi UUID của item đã chọn, không để người dùng nhập UUID.
- Thời gian `Instant`: ISO-8601 UTC (`2026-10-01T01:00:00Z`); ngày: `YYYY-MM-DD`; giờ: `HH:mm:ss`.

### Envelope response và lỗi

Mọi controller trả về `ApiResponse<T>`:

```json
{
  "status": 200,
  "message": "Success",
  "data": {}
}
```

`data` là `null` cho thao tác không trả thực thể. Frontend cần ưu tiên HTTP status: một số API HTTP `201 Created` vẫn có `data.status = 200` do helper response hiện tại.

```json
{
  "status": 400,
  "message": "classCode: Mã lớp không được để trống",
  "data": null
}
```

| HTTP | Ý nghĩa | Xử lý UI |
|---|---|---|
| 400 | Validation/trùng dữ liệu | Hiển thị `message` tại form hoặc toast. |
| 401 | Token thiếu, sai hoặc hết hạn | Dùng refresh token; thất bại thì đăng xuất. |
| 403 | Sai role hoặc ngoài phạm vi lớp | Hiển thị lỗi quyền, không retry. |
| 404 | Bản ghi không tồn tại | Chuyển về danh sách hoặc error state. |
| 422 | Sai thông tin đăng nhập | Hiển thị tại form signin. |
| 429 | Vượt rate limit | Khóa nút tạm thời và hiển thị thời gian chờ. |
| 500 | Lỗi server | Toast lỗi chung, không optimistic retry mutation. |

### Phân trang

```http
GET /api/v1/classes?page=0&size=20&subjectId=<uuid>&semesterId=<uuid>&status=ACTIVE
```

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "content": [],
    "totalElements": 50,
    "totalPages": 3,
    "size": 20,
    "number": 0,
    "first": true,
    "last": false
  }
}
```

### Xác thực và tài khoản

```json
// POST /users/signin
{ "username": "gv_nguyen", "password": "admin123456" }

// data khi signin hoặc refresh thành công
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "userId": "uuid",
    "username": "gv_nguyen",
    "email": "gv_nguyen@email.com",
    "role": "INSTRUCTOR"
  }
}

// POST /users/refresh hoặc /users/logout
{ "refreshToken": "jwt-refresh-token" }

// POST /users/forgot-password
{ "email": "gv_nguyen@email.com" }

// POST /users/reset-password
{ "token": "reset-token", "newPassword": "NewPassword123" }

// PUT /users/me
{ "username": "gv_nguyen", "email": "gv_nguyen@email.com" }

// PUT /users/me/password
{ "oldPassword": "admin123456", "newPassword": "NewPassword123" }
```

### Lớp học, nhân sự và ghi danh

```json
// POST /classes
{
  "subjectId": "uuid-tu-subject-select",
  "semesterId": "uuid-tu-semester-select",
  "classCode": "PHY101-01",
  "maxStudents": 50
}

// PUT /classes/{classId}
{ "classCode": "PHY101-01", "maxStudents": 55 }

// PUT /classes/{classId}/status
{ "status": "ACTIVE" }

// POST /classes/{classId}/staff
{ "userId": "uuid-tu-staff-select", "roleInClass": "TA" }

// POST /classes/{classId}/enroll-single
{ "studentId": "uuid-tu-student-select" }

// POST /classes/{classId}/enroll-bulk
{ "studentIds": ["uuid-1", "uuid-2"] }

// PUT /classes/{classId}/students/{studentId}/status
{ "status": "ACTIVE" }
```

Enum: `ClassStatus = DRAFT | ACTIVE | COMPLETED | ARCHIVED`; `EnrollmentStatus = ACTIVE | DROPPED | COMPLETED`; `roleInClass = INSTRUCTOR | TA`.

```json
// POST /classes/{classId}/schedules
{
  "dayOfWeek": 2,
  "startPeriod": 1,
  "endPeriod": 3,
  "startTime": "07:00:00",
  "endTime": "09:30:00",
  "room": "A1-203",
  "building": "Nhà A1",
  "lessonType": "THEORY",
  "notes": "Mang theo giáo trình"
}
```

`PUT /classes/schedules/{scheduleId}` dùng các field như trên (đều tùy chọn). `dayOfWeek` hợp lệ từ `2` (thứ Hai) đến `8` (chủ Nhật); `lessonType = THEORY | LAB | EXERCISE | EXAM`.

### Chủ đề, học liệu và câu hỏi

```json
// POST hoặc PUT /subjects/{subjectId}/topics[/{topicId}]
{
  "topicName": "Động học chất điểm",
  "orderIndex": 1,
  "description": "Khảo sát chuyển động của vật"
}

// POST hoặc PUT /questions[/{questionId}]
{
  "subjectId": "uuid-tu-subject-select",
  "topicId": "uuid-tu-topic-select",
  "questionType": "MCQ_SINGLE",
  "content": "Một vật 2 kg chịu lực 10 N. Gia tốc là?",
  "mediaUrl": null,
  "difficultyLevel": "EASY",
  "cognitiveLevel": "UNDERSTAND",
  "options": [
    { "content": "5 m/s²", "isCorrect": true, "orderIndex": 1, "explanation": "a = F/m" },
    { "content": "20 m/s²", "isCorrect": false, "orderIndex": 2 }
  ]
}
```

`subjectId` trong body tạo/sửa topic bị controller ghi đè bằng `{subjectId}` trên URL. `QuestionType = MCQ_SINGLE | MCQ_MULTI | TRUE_FALSE | SHORT_ANSWER`; `DifficultyLevel = EASY | MEDIUM | HARD`.

Học liệu dùng `multipart/form-data` cho `POST/PUT /topics/{topicId}/materials`:

```text
title=Slide chương 1
type=PDF
contentText=Nội dung văn bản (tùy chọn)
sourceCitation=Giáo trình Vật lý đại cương
file=<binary-file>
```

`topicId` lấy từ path. Không gửi UUID này trong form. Các API import Excel cũng multipart, trường file bắt buộc là `file`.

`MaterialType = PDF | VIDEO | SLIDE | TEXT | OTHER | MARKDOWN`.

### Ma trận đề và kỳ thi

```json
// POST /exam-matrices
{
  "subjectId": "uuid-tu-subject-select",
  "matrixName": "Giữa kỳ Vật lý 1",
  "examType": "MIDTERM",
  "description": "Ma trận giữa kỳ",
  "totalPoints": 10,
  "details": [
    { "topicId": "uuid-tu-topic-select", "difficultyLevel": "EASY", "numQuestions": 5, "weightPercent": 50 }
  ]
}

// POST /exams
{
  "classId": "uuid-tu-class-select",
  "matrixId": "uuid-tu-matrix-select",
  "title": "Kiểm tra giữa kỳ",
  "examType": "MIDTERM",
  "durationMinutes": 45,
  "startTime": "2026-10-01T01:00:00Z",
  "endTime": "2026-10-01T02:00:00Z"
}

// POST /exams/{examId}/questions
{ "questionId": "uuid-tu-question-picker", "scoreWeight": 1, "orderIndex": 1 }

// PUT /exams/attempts/{attemptId}/grade
{ "totalScore": 8.5, "feedback": "Cần kiểm tra lại câu 4." }
```

`examType = PRACTICE | QUIZ | MIDTERM | FINAL`. `PUT /exams/{examId}` có các field tùy chọn: `title`, `examType`, `durationMinutes`, `maxAttempts`, `startTime`, `endTime`, `matrixId`, `shuffleQuestions`, `shuffleOptions`, `isPublished`. `POST /exam-matrices/{matrixId}/validate` và `POST /exams/{examId}/generate-questions` không có body.

### Thí nghiệm và thông báo

```json
// POST /experiments
{
  "subjectId": "uuid-tu-subject-select",
  "title": "Khảo sát dao động con lắc lò xo",
  "description": "Mô phỏng dao động điều hòa",
  "sceneAssetUrl": "https://storage.example/scene.glb",
  "sceneAssetsJson": {},
  "instructions": "Thực hiện các bước trong mô phỏng",
  "orderIndex": 1
}

// POST /experiments/{experimentId}/assign
{
  "classId": "uuid-tu-class-select",
  "dueDate": "2026-10-10T16:59:59Z",
  "instructionsOverride": "Nộp đồ thị và nhận xét"
}

// POST /experiments/submissions/{submissionId}/scores
{ "rubricId": "uuid", "score": 8.5, "feedback": "Đạt yêu cầu", "comment": "Số liệu hợp lý" }

// POST /experiments/submissions/{submissionId}/confirmation
{ "note": "Xác nhận điểm cuối cùng" }

// POST /notifications/classes/{classId}
{
  "title": "Nhắc lịch kiểm tra",
  "content": "Kiểm tra giữa kỳ vào thứ Năm.",
  "type": "ANNOUNCEMENT",
  "referenceId": "uuid-tùy-chọn",
  "referenceType": "EXAM"
}
```

Nộp thí nghiệm (`POST /experiments/assignments/{assignmentId}/submit`) dùng multipart: `file` (binary, tùy chọn), `evidenceUrl`, `rawDataJson`.

### Dạng `data` của API đọc

| Nhóm | `data` |
|---|---|
| Danh mục | `SubjectDTO`, `SemesterDTO`, `TopicDTO`, `LearningMaterialDTO` hoặc mảng DTO. |
| Lớp học | `ClassDTO`; sinh viên là `Page<EnrollmentDTO>`; staff là `ClassStaffDTO[]`; lịch là `ClassScheduleDTO[]`. |
| Đề thi | `ExamDTO`, danh sách câu hỏi, `ExamAttemptDTO`, danh sách attempt/roster/transfer. |
| Thí nghiệm | `ExperimentDTO`, `ExperimentAssignmentDTO`, bài nộp và điểm theo endpoint. |
| Dashboard/analytics | `DashboardSnapshotDTO`, `DashboardDataDTO` hoặc mảng thống kê. |

> Bảng API theo role ở phía trên là danh sách route và quyền đầy đủ. Các mẫu trong phần này là cấu trúc request/response bám theo DTO/controller hiện tại; frontend hiển thị nhãn nghiệp vụ nhưng gửi UUID nội bộ của lựa chọn đó.
