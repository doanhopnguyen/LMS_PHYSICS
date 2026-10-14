# Kiểm thử giao diện quản trị

Ngày kiểm tra: 14/10/2026. Nhánh: `admin-academic-management`.

## Thay đổi

- Sidebar gồm tám mục, bổ sung “Duyệt ngân hàng & học liệu” theo yêu cầu mới. Nội dung trang tổng quan và người dùng/phân quyền được giữ nguyên.
- Học kỳ và học phần có trang riêng, tìm kiếm, bộ lọc và phân trang. Chọn học kỳ mở các card lớp của học kỳ đó.
- Card học kỳ, học phần và lớp tái sử dụng `StatCard` của trang sinh viên `MyCoursesPage`: dải nhãn, viền màu, biểu tượng, bo góc và phần trạng thái. Card học kỳ hiển thị năm học, card học phần hiển thị mã môn, card lớp hiển thị sĩ số tối đa. Có thể nhấn phần nội dung để mở chi tiết; menu quản trị độc lập, không lồng nút trong nút. Kiểm tra nhấn chuột thực tế vào card/menu, lọc, phân trang và màn hình 1440px/390px. Ảnh: `semesters-desktop.png`, `subjects-desktop.png`, `classes-desktop.png` và các ảnh mobile tương ứng.
- Chi tiết học phần có các tab lớp học, chương trình đào tạo, chuẩn đầu ra (CLO), ngân hàng câu hỏi và ma trận. Các công cụ câu hỏi/ma trận hiện có được tái sử dụng trong phạm vi học phần.
- CLO có tạo/sửa/xóa, thay đổi trạng thái, tìm kiếm, lọc và phân trang. Câu hỏi hỗ trợ nhiều CLO, hiển thị mã CLO, lọc CLO trên toàn bộ kết quả và gán nhanh qua menu. Tiêu chí ma trận chọn một CLO hoặc không giới hạn. Kiểm tra học phần/trạng thái trước khi lưu; CLO ngừng hoạt động đang liên kết được giữ để người dùng bỏ chọn rõ ràng.
- Chương trình đào tạo hiển thị cây chương–chủ đề–học liệu ở bên trái, nội dung và card học liệu ở bên phải. Có thu gọn/mở rộng, tìm kiếm xuyên cây, lọc học liệu, tạo/sửa/xóa và xem học liệu bằng các trình xem hiện có. Chủ đề chưa phân chương vẫn có thể truy cập. Màu sắc và bo góc dùng token và thành phần hệ thống hiện tại.
- Tạo lớp có bốn bước; học kỳ/học phần từ trang trước được giữ lại. Khi tạo lớp thành công nhưng ghi danh lỗi, thử lại chỉ thực hiện ghi danh.
- Chi tiết lớp hỗ trợ sửa thông tin, phân công giảng viên, đổi trạng thái lớp, ghi danh, đổi trạng thái sinh viên và xóa sinh viên có xác nhận.
- Danh sách chọn giảng viên lọc vai trò/trạng thái tại frontend vì API người dùng chỉ hỗ trợ phân trang.

## Kết quả

| Kiểm tra | Kết quả |
| --- | --- |
| `node --test scripts/*.test.mjs` | 105/105 qua |
| `node scripts/check-admin-management.mjs` | 32/32 kịch bản trình duyệt qua |
| `node scripts/admin-management-api.mjs` | 17/17 kịch bản API cô lập qua |
| `npm run scan:html` | 58 route và 58 manifest entry đồng bộ |
| `npm run build` | Qua |
| `git diff --check` | Qua |

Kiểm tra trình duyệt sử dụng Chrome headless, dữ liệu API giả lập, màn hình 1440px và 390px. Các trang mới và năm tab học phần không tràn ngang; không có lỗi JavaScript trong các kịch bản đã chạy. Ảnh chụp đã được kiểm tra trực quan, nằm trong `.tmp-admin-management/`.

Kiểm thử CLO bao gồm CRUD và lỗi xóa CLO đang liên kết; tạo câu hỏi nhiều CLO; lọc bắt được câu hỏi ở trang API sau; gán nhanh gửi mảng UUID trực tiếp; giữ chủ đề/CLO ngừng hoạt động khi sửa; thử lại khi tải CLO lỗi; ma trận có CLO và không giới hạn CLO; học phần ngừng hoạt động không tạo mới CLO. Backend cô lập xác minh từ chối CLO sai học phần/ngừng hoạt động, không mất liên kết cũ sau lỗi, xóa liên kết bằng mảng rỗng và lưu `cloId` của ma trận. Ảnh: `clo-manager-desktop.png`, `clo-manager-mobile.png`, `question-clo-editor.png`.

Các kịch bản bổ sung cho tree kiểm tra tìm học liệu ở các nhánh con, thu gọn khi đang tìm kiếm, chọn chủ đề, lọc loại học liệu, sửa chương/chủ đề/học liệu qua đúng endpoint, hủy thao tác xóa và thử tải lại khi API học liệu lỗi. Ảnh: `curriculum-tree-desktop.png`, `curriculum-tree-expanded-desktop.png`, `curriculum-tree-mobile.png`.

Khung chương trình có thanh kéo điều chỉnh độ rộng hai cột trên desktop; hỗ trợ phím mũi tên, Home/End và nhấn đúp để đặt lại. Chiều cao cố định 640px trên desktop, nội dung cuộn độc lập. Mobile xếp hai phần theo chiều dọc, cây cao 480px. Ô tìm kiếm nổi ở chân khung cây, không có nhãn hiển thị. Kịch bản bổ sung kiểm tra kéo 140px, giới hạn kích thước, bàn phím, danh sách dài và vị trí ô tìm kiếm khi cuộn. Ảnh: `curriculum-resized-desktop.png`.

Form tạo/chỉnh sửa học liệu có nút mở rộng toàn màn hình và thu nhỏ ở cạnh nút đóng. Dữ liệu nhập được giữ nguyên khi chuyển kích thước; nội dung cuộn trong cửa sổ, tiêu đề và nút điều khiển luôn hiển thị. Kiểm tra trên desktop/mobile, lưu học liệu khi đang mở rộng và mở lại form về kích thước ban đầu. Ảnh: `material-create-fullscreen-desktop.png`, `material-create-fullscreen-mobile.png`.

Kiểm tra API dùng bản backend được cập nhật từ source hiện tại, chạy profile `test` với H2 trong RAM, cổng 18080 và MinIO tắt. Đã xác minh tạo/sửa học kỳ–học phần, trạng thái học phần, tạo chương–chủ đề–học liệu văn bản, tạo/sửa lớp, phân công giảng viên, trạng thái lớp và ghi danh/đổi trạng thái/xóa sinh viên. Không ghi dữ liệu vào backend cổng 8080.

Swagger UI và OpenAPI tại cổng 8080 đã được đọc để đối chiếu endpoint và payload. Các kiểm thử này chưa xác minh upload tệp với MinIO thật hoặc chạy kiểm thử tải trên dữ liệu lớn. Build còn cảnh báo bundle JavaScript vượt 500 kB; bộ kiểm thử hiện có còn cảnh báo khóa `files` trùng trong `apiClient.js`.

## Chạy lại

Trang `admin_materials` được tái sử dụng làm trang duyệt chung, gồm ngân hàng câu hỏi và học liệu. Hàng chờ mặc định PENDING, có lọc học phần/chủ đề/trạng thái, tìm kiếm và phân trang. Câu hỏi được xem đầy đủ đáp án, CLO và lý do từ chối; duyệt có nhận xét tùy chọn, từ chối yêu cầu lý do. Chỉ câu hỏi PENDING có thao tác duyệt/từ chối. Học liệu dùng màn hình chi tiết/trình xem hiện có và xác nhận trước khi duyệt. Lỗi xử lý giữ cửa sổ và dữ liệu nhập để thử lại. API chưa có bộ lọc trạng thái cho câu hỏi: lọc sau khi tải hết các trang, không gửi tham số không được hỗ trợ. Không bổ sung thao tác từ chối học liệu vì API hiện tại chưa có endpoint này.

Kiểm thử hàng chờ bao gồm câu hỏi ở trang API sau (q105), xem đáp án trước khi duyệt, gửi nhận xét qua query, lý do từ chối bắt buộc, lỗi duyệt/từ chối và thử lại, lịch sử trạng thái đã duyệt/từ chối, xem trước/duyệt học liệu và kiểm tra desktop/mobile. Backend H2 xác minh trạng thái/người duyệt/thời điểm duyệt, HTTP 409 khi duyệt lại, HTTP 400 với lý do trống hoặc duyệt trực tiếp câu hỏi REJECTED. Ảnh: `admin-review-questions-desktop.png`, `admin-review-question-preview.png`, `admin-review-materials-desktop.png`, `admin_materials-mobile.png`, `admin-review-materials-mobile.png`.

Admin tạo câu hỏi sẽ tự động phê duyệt: tạo ở PENDING rồi gọi approve. Admin import Excel sẽ tự động gửi duyệt các câu DRAFT và duyệt toàn bộ câu vừa nhập, dùng đúng `questions[].questionId` từ kết quả API. Backend không cho POST trực tiếp APPROVED. Luồng import giảng viên vẫn giữ hành vi cũ. Khi duyệt lỗi, câu đã tạo/nhập được giữ và có nút thử duyệt lại, không POST tạo lại hoặc upload lại; đóng/mở lại modal import trong cùng trang vẫn giữ kết quả chưa xử lý xong. Kết quả import hiển thị riêng số câu đã nhập/đã duyệt, lỗi từng câu và cảnh báo parser. Kiểm tra thêm retry một phần, không duyệt lặp câu thành công, phản hồi không xác nhận APPROVED và thiếu mã câu hỏi. Backend thật cô lập kiểm tra tạo mới và nhập bốn câu từ tệp Excel mẫu đều hoàn tất APPROVED. Ảnh: `admin-import-approval-partial.png`, `admin-import-approval-complete.png`.

Ngân hàng và màn hình duyệt của Admin bổ sung “Gửi duyệt câu hỏi” cho DRAFT và “Gửi duyệt lại” cho REJECTED, ở menu và cửa sổ xem câu hỏi. Có xác nhận và nhận xét tùy chọn, giữ dữ liệu khi API lỗi, cập nhật trạng thái/bộ lọc sau khi thành công. PENDING chỉ có duyệt/từ chối; APPROVED không có gửi duyệt. Có thể mở chỉnh sửa từ cửa sổ xem trong ngân hàng quản trị. Kiểm thử đầy đủ DRAFT → PENDING → APPROVED và REJECTED → PENDING, bao gồm thử lại sau lỗi gửi duyệt và không gửi body sai hợp đồng API. Backend cô lập kiểm tra gửi duyệt, từ chối, gửi lại (xóa lý do từ chối cũ) và duyệt. Ảnh: `admin-question-submit-review.png`.

```powershell
npm run dev -- --port 5198 --host 127.0.0.1 --strictPort
# Trong terminal khác:
node scripts/check-admin-management.mjs
node --test scripts/*.test.mjs
npm run scan:html
npm run build
```

Để chạy kiểm thử API, khởi động backend H2 cô lập theo `docs/test-feedback/harness/README.md`, rồi chạy `node scripts/admin-management-api.mjs`. Harness này cố định địa chỉ `127.0.0.1:18080`; chỉ dùng với môi trường test.

Chưa commit, merge hoặc push vào main.
