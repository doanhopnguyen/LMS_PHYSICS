# Sửa frontend thí nghiệm — 03/10/2026

Đã sửa ba lỗi giao diện và chuẩn hóa cách gửi dữ liệu JSON. Chưa sửa backend nguồn.

| Yêu cầu | Thay đổi | Kiểm chứng |
|---|---|---|
| Giữ ID bài giao | Dùng chung `experimentHref` để giữ experimentId, classId, assignmentId ở danh sách → workspace → báo cáo và báo cáo → workspace; key card dùng assignmentId khi có | Qua kiểm tra UI với API thật |
| Giao lớp khi lọc tất cả | Dropdown lọc theo `modal.subjectId`, tức học phần của thí nghiệm đang giao, thay vì bộ lọc toàn trang | Qua kiểm tra UI; ID các lớp khớp kết quả API |
| Hướng dẫn assignment | Workspace/report tải danh sách assignment của sinh viên, chọn đúng assignmentId và experimentId, ưu tiên instructionsOverride không rỗng, giữ hướng dẫn mặc định nếu override rỗng | Qua UI/API thật và test trường hợp assignment khác/không tồn tại/lỗi API |
| Multipart JSON | Gửi rawDataJson bằng chuỗi JSON trong FormData thay vì Blob/file part | FE gửi đúng chuỗi; backend gốc vẫn trả 400 |

Frontend: **43/43 test đạt**, build thành công. Sáu kiểm tra UI với backend thật đạt; không có runtime exception. Các kết quả ở [frontend-fixes-results.json](frontend-fixes-results.json). Build vẫn có cảnh báo chunk >500 kB như trước. Các artifact build được trả về trạng thái trước lượt build để diff tập trung vào source.

## JSON còn cần một bổ sung ở BE

Đã thử backend gốc với cả `rawDataJson` dạng Blob và dạng chuỗi: đều trả 400. `@ModelAttribute SubmitExperimentDTO` không tự chuyển String thành JsonNode. Vì vậy FE không thể hoàn thành việc nộp vào trường rawDataJson chỉ bằng đổi encoding.

Chuẩn bị một [bản vá BE để xem trước](backend-json-binder-proposal.patch): thêm ObjectMapper và property editor cho trường rawDataJson trong ExperimentController. Bản vá chỉ được thử trong bản sao backend cô lập `.tmp-comprehensive-test/backend`, chưa áp dụng vào `D:\DEV\vat_li_be\hethongvatli1`.

Kiểm tra bản vá trong môi trường cô lập: **21/21 test thí nghiệm đạt**; gửi JSON dạng chuỗi nhận **200** và đọc lại rawDataJson khớp `{ "measurements": [1.2] }`. Kết quả: [backend-binder-proposal-results.json](backend-binder-proposal-results.json).

Để nộp JSON hoạt động với backend nguồn, cần áp dụng bổ sung BE này hoặc cung cấp một converter tương đương. Phần FE gửi chuỗi đã sẵn sàng. Môi trường test được dừng sau khi kiểm tra; dữ liệu H2 mất khi dừng. Bản sao test hiện chứa binder thử nghiệm; khi muốn kiểm chứng lại backend gốc, dùng bản sao mới của nguồn BE.
