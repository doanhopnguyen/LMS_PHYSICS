# Sửa riêng FE để nộp bài theo BE hiện tại — 03/10/2026

BE nguồn tại `D:\DEV\vat_li_be\hethongvatli1` đã trở về bản nguyên trạng; kiểm tra `git status` và `git diff --check` không có thay đổi. Không áp dụng binder, ghi minh chứng sớm hoặc test BE mới từ lượt sửa trước.

API hiện tại nhận một `file` và `evidenceUrl` trong multipart. `rawDataJson` là `JsonNode` nhưng chưa có binder cho chuỗi form field, nên FE không gửi field đó.

## Cách gửi ở FE

- Có bảng số liệu/nhận xét: tự tạo `so-lieu-thi-nghiem.json`, gửi vào field `file`.
- Có thêm tệp minh chứng: tự tạo `bao-cao-thi-nghiem.zip`, chứa `so-lieu.json` và tệp gốc trong `minh-chung/`. Tệp ZIP dùng định dạng chuẩn, giữ nguyên byte của minh chứng và tên tiếng Việt.
- Có URL cùng báo cáo/tệp: lưu URL trong JSON để tránh bị mất khi BE thay `evidenceUrl` bằng URL của tệp upload. Vẫn gửi field `evidenceUrl` theo hợp đồng API.
- Thí nghiệm tùy chỉnh chỉ có file hoặc chỉ có URL vẫn gửi theo định dạng cũ.
- Giữ kiểm tra bảng số liệu; khóa ô nhập trong lúc gửi. Thông báo thành công nêu đúng quy tắc BE: Kho minh chứng được ghi sau khi giảng viên xác nhận.

BE lưu `fileId` và đường dẫn tệp. Số liệu nằm trong tệp JSON/ZIP; `rawDataJson` trong bản ghi bài nộp vẫn null. Giảng viên cần mở tệp để đọc số liệu; bản sửa này không làm BE tự parse tệp thành bảng số liệu trong response.

## Kiểm thử

- 53/53 test FE đạt, gồm đọc ZIP bằng Python `zipfile` độc lập, kiểm tra CRC, JSON, tên Unicode và byte minh chứng.
- Build FE đạt; còn cảnh báo kích thước chunk hiện có.
- 16/16 kiểm tra trình duyệt/API thật đạt trên bản sao BE nguyên trạng: 4 mẫu gửi tệp JSON và đọc lại đúng số liệu, đơn vị, nhận xét; input khóa khi gửi; không gửi `rawDataJson`; ZIP giữ số liệu, CSV và URL; giá trị không hợp lệ bị chặn; thông báo đúng thời điểm ghi kho; không lỗi JavaScript.
- 21/21 test thí nghiệm gốc đạt trên bản sao BE nguyên trạng.

Kiểm thử sử dụng H2 trong RAM và storage local, MinIO tắt; không ghi DB thật hoặc sửa BE nguồn. Các kết quả từ lượt thử binder/BE trước là lịch sử kiểm chứng, không đại diện cho bản sửa FE này.

Kết quả trình duyệt: [fe-only-submission-results.json](fe-only-submission-results.json).
