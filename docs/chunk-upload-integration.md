# Tải tệp theo chunk (FE)

FE dùng đúng API trong `ChunkUploadController` hiện có. Không sửa BE.

- `POST /api/v1/files/chunks`: multipart gồm `uploadId` (UUID), `chunkIndex` (bắt đầu từ 0), `totalChunks`, `fileName`, `chunk`.
- Mỗi chunk tối đa 102.400 byte (100 KB theo cấu hình BE); chunk cuối giữ đúng số byte còn lại.
- Chặn trước khi gửi nếu `Math.ceil(file.size / 102400) * 102400 > 52428800` (50 MB), khớp cách kiểm tra của BE.
- Gửi chunk 0 trước để khởi tạo phiên, sau đó tối đa 10 request đồng thời.
- Chỉ sau khi BE xác nhận tất cả chunk, gửi `POST /api/v1/files/chunks/merge` với JSON `{ "uploadId": "..." }`.
- Kiểm tra phản hồi `COMPLETED`, `fileId`, `fileUrl`, kích thước và số chunk trước khi báo hoàn tất.
- Nếu merge trả HTTP 409 và `missingChunks`, gửi lại đúng các index thiếu, tối đa 2 lần phục hồi.
- Thử lại lỗi mạng/429/5xx tối đa 2 lần với cùng uploadId/index. Không thử lại lỗi quyền truy cập.
- Bấm thử lại với cùng File trong phiên trang hiện tại sẽ giữ UUID, gọi status rồi gửi đúng `missingChunks`; nếu BE báo phiên hết hạn/thất bại thì tạo phiên mới. Các lần gọi đồng thời với cùng File dùng chung một tác vụ để tránh upload trùng.
- BE hiện xóa thư mục chunk sau khi transaction merge commit thành công. FE không gọi thao tác xóa thư mục.

API FE mặc định ưu tiên chunk: `api.files.upload(fileOrFormData, { onProgress, signal })`. Kết quả có metadata BE và alias `url`, `size`, `contentType` để tương thích kiểu upload cũ. `api.files.uploadStatus(uploadId)` đọc trạng thái phiên. `api.files.resolveUrl(fileUrl)` chuyển URL tương đối BE thành URL tuyệt đối theo API base. Chỉ số tiến độ giữ dưới 100% cho tới khi merge hoàn tất. Upload nguyên khối chỉ chạy khi gọi rõ `api.files.uploadDirect(formData, query)`; không tự fallback sau lỗi chunk.

## Phạm vi đã nối và giới hạn từ BE hiện tại

Đã chuyển API tải tệp dùng chung `api.files.upload` sang chunk/merge và bỏ cấu hình `files` trùng trong API client. Form tạo/sửa câu hỏi ADMIN và giảng viên dùng `QuestionMediaField`: chọn ảnh → upload chunk → merge → gán URL vào `mediaUrl` → lưu câu hỏi bằng API nghiệp vụ hiện có. Nút lưu bị khóa trong lúc tải/ghép, hoặc khi ảnh chưa tải xong sau lỗi; có nút thử lại/bỏ tệp. Khi đóng form, request đang chạy được hủy. Người dùng vẫn có thể nhập URL ảnh thủ công.

Các luồng sau **chưa thể chuyển hoàn toàn bằng FE** với hợp đồng BE đang có:

| Luồng | API hiện tại | Hợp đồng cần BE hỗ trợ để nối kết quả merge |
| --- | --- | --- |
| Tạo/sửa học liệu dùng chung | `/api/v1/topics/{topicId}/materials[/{materialId}]` | Nhận `fileId` thay cho `MultipartFile file`, xác thực chủ sở hữu và gắn tệp vào học liệu |
| Tạo học liệu riêng của lớp | `/api/v1/classes/{classId}/topics/{topicId}/materials` | Nhận và gắn `fileId` như học liệu dùng chung |
| Nộp báo cáo thí nghiệm | `/api/v1/experiments/assignments/{assignmentId}/submit` | Nhận `fileId`, gắn vào bài nộp và cấp quyền đọc cho người chấm |
| Nhập câu hỏi Excel | `/api/v1/questions/import-excel` | Đọc tệp Excel đã merge theo `fileId`, giữ nguyên subjectId/topicId |
| Nhập sinh viên Excel | `/api/v1/users/import-excel` | Đọc tệp Excel đã merge theo `fileId`, giữ nguyên classId/defaultPassword |

`CreateLearningMaterialDTO` hiện chỉ có `MultipartFile file`, không có `fileId`/`fileUrl`. Hai API import Excel bắt buộc có multipart `file`. `SubmitExperimentDTO` có `evidenceUrl` nhưng tệp merge vẫn mang purpose `CHUNKED_UPLOAD`, chỉ người upload và ADMIN được đọc; thay bằng URL sẽ làm mất liên kết fileId và quyền đọc của người chấm. Vì vậy FE giữ nguyên các luồng nghiệp vụ này để tránh lưu học liệu thiếu tệp, nhập Excel thất bại hoặc bài nộp không xem được.

Sau khi BE hỗ trợ các tham số trên, các API nghiệp vụ có thể dùng chung `uploadFileInChunks`, bỏ binary `file` khỏi multipart, thêm `fileId` và giữ nguyên phần metadata còn lại. Không tải file đã ghép ngược về FE để gửi nguyên khối lần nữa.

Kiểm thử logic: `node --test scripts/chunk-upload.test.mjs`.

Kiểm thử UI ADMIN/giảng viên với API giả lập: `node scripts/check-question-chunk-upload.mjs` (mặc định UI tại cổng 5199).

## Đọc và tải xuống tệp trên toàn hệ thống

`api.files.read`, `api.files.location`, `api.files.download` dùng chung `src/lib/fileAccess.js`:

- Có `fileId`: POST `/api/v1/files/{fileId}/download-url` bằng JWT, sau đó đọc bytes qua URL có chữ ký. Mỗi lần tải mới xin lại URL, giữ tên tệp gốc từ BE.
- Chỉ có đường dẫn tệp cũ: `/api/v1/files/...` được chuyển sang BE và đọc qua API client có JWT. Link cũ trỏ `localhost:5173/api/v1/files/...` cũng được chuẩn hóa. Không bỏ qua lỗi 403 bằng đường dẫn thô.
- Link tải có chữ ký cũ được nhận diện theo file ID và xin lại chữ ký, tránh dùng token hết hạn.
- Cấu hình tách FE/BE bằng `VITE_API_BASE_URL` (origin BE). Khi biến này trống, `/api` đi qua Vite proxy trong development hoặc reverse proxy cùng origin khi triển khai.
- URL lưu vào `mediaUrl` dùng đường dẫn BE ổn định, không gắn cổng/domain FE và không lưu blob URL/chữ ký tạm thời.
- Tệp ngoài hệ thống không nhận JWT. Phản hồi HTML từ cấu hình nhầm sang trang FE không được nhận nhầm thành PDF/tài liệu.
- Preview tạo blob URL tạm từ bytes đã tải về và thu hồi khi đóng/chuyển học liệu. Đây là URL xem trong phiên trình duyệt; file gốc vẫn ở BE.

Đã áp dụng cho học liệu (PDF, ảnh, tệp, video lưu trên BE), ảnh/liên kết đính kèm trong Markdown, minh chứng thí nghiệm, danh sách minh chứng sinh viên, liên kết tệp của giảng viên và ảnh câu hỏi. YouTube/Vimeo giữ luồng embed riêng.

Việc tải lên học liệu và nhập Excel vẫn theo multipart của API nghiệp vụ hiện có; không gửi `fileId` thay cho `file` khi BE chưa có trường nhận. Quyền tải tệp `CHUNKED_UPLOAD` hiện do BE giới hạn cho chủ upload/ADMIN; FE giữ nguyên kiểm tra quyền này.

Kiểm thử: `node --test scripts/file-access.test.mjs`; `node scripts/check-system-file-access.mjs` (UI mặc định cổng 5199, toàn bộ API/tệp giả lập).
