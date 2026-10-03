# Hoàn thiện select và chọn ngày/giờ

Đã đọc tệp yêu cầu “Single Date Picker” được đính kèm. Component chọn một ngày, không có state hay props chọn khoảng ngày. Giữ màu primary đỏ, font, token, Material Symbols và các form hiện tại; không thêm dependency.

## File và component

| File | Vai trò |
| --- | --- |
| `src/components/DatePicker.jsx` | Component chọn một ngày. Có lịch tháng, tuần bắt đầu T2, ngày chọn hình tròn 32px, trạng thái hôm nay, min/max, ngày khóa; định dạng ngày dễ đọc. Dùng cùng phần hiển thị cho giờ, ngày giờ và tháng trong các form hiện tại. |
| `src/components/Popover.jsx` | Popup dùng chung cho lịch và dropdown. Portal tránh bị card/form cắt; căn theo input và viewport, tự đặt phía trên khi thiếu chỗ, không đẩy layout; đóng khi click ngoài/Escape. |
| `src/components/SelectControl.jsx` | Phần dropdown của SelectField: màu mục chọn, check icon, nhãn nhóm, mục disabled, cuộn nội dung dài, bàn phím và tìm theo ký tự. |
| `src/components/useNativePicker.js` | Giữ input/select thật để bảo toàn tên trường, ref, native validation, controlled/default value, reset và FormData. |
| `src/components/FormField.jsx` | Tích hợp tự động DatePicker cho `date`, `datetime-local`, `time`, `month`. Các field còn lại giữ component cũ. |
| `src/components/SelectField.jsx` | Reuse wrapper, nhãn, hint/error và API cũ; tích hợp SelectControl. Select nhiều lựa chọn hoặc có size lớn vẫn giữ hành vi native. |
| `src/components/Pagination.jsx`, `LessonVideo.jsx` | Bộ chọn số dòng và tốc độ video dùng chung SelectField. |
| `src/components/FormDialog.jsx` | Focus trap bỏ qua native control có tabindex -1; phím Escape của picker đóng picker trước. |
| `src/lib/datePicker.js` | Hàm ngày theo giờ địa phương, grid thứ Hai, giới hạn và định dạng; không chuyển ngày sang UTC. |
| `src/styles/pickers.css`, `src/styles.css` | Style dùng chung: calendar card nhỏ, shadow nhẹ, dropdown dễ đọc, padding/icon rõ; chiều rộng thích ứng cho toolbar và mobile. Không thêm `!important`. |

Component cũ được reuse: **FormField, SelectField, Button, FormDialog**, token màu/khoảng cách và Material Symbols. DashboardCalendar vẫn dùng cho lịch sự kiện tuần của dashboard.

## API DatePicker

```jsx
<DatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  minDate="2026-10-01"
  maxDate="2026-12-31"
  disabledDates={['2026-10-04']}
  locale="vi-VN"
/>
```

- `value` / `defaultValue`: chuỗi `YYYY-MM-DD` hoặc Date địa phương đối với chọn ngày.
- `onChange(value)`: chuỗi `YYYY-MM-DD`; chuỗi rỗng khi xóa lựa chọn.
- `minDate`, `maxDate`: chuỗi ngày hoặc Date; cũng hỗ trợ các thuộc tính native `min`, `max`.
- `disabledDates`: mảng ngày hoặc hàm `(date) => boolean`.
- `locale`: mặc định `vi-VN`.
- `name`, `id`, `required`, `disabled`, `readOnly`, `step`, `placeholder`, các thuộc tính ARIA và ref giữ ngữ nghĩa của control.
- `type`: mặc định `date`; các FormField cũ tự truyền `datetime-local`, `time`, `month` khi cần. Dữ liệu lần lượt giữ `YYYY-MM-DDTHH:mm`, `HH:mm`, `YYYY-MM` theo input native. `nativeOnChange` là cầu nối nội bộ để FormField giữ callback event cũ.

Trong các page nên tiếp tục dùng component đã có:

```jsx
<FormField label="Ngày thi" name="examDate" type="date" required />
<FormField label="Hạn nộp" name="dueDate" type="datetime-local" required />
<FormField label="Giờ bắt đầu" name="startTime" type="time" />
```

## Các page được cập nhật qua component dùng chung

| Page/file hiện tại | Control ngày/giờ |
| --- | --- |
| `admin/AdminAcademicsApiPage.jsx` | Ngày bắt đầu và kết thúc học kỳ là hai picker ngày độc lập, giữ form/API hiện có. |
| `admin/OperationsPage.jsx` | Hai ô ngày lọc nhật ký là các picker độc lập. |
| `lecturers/LecturerApiWorkspace.jsx` | Ngày giờ bắt đầu/kết thúc đề thi, hạn nộp thí nghiệm, tháng thống kê. Áp dụng trên các route đề thi, thí nghiệm và phân tích dùng file này. |
| `lecturers/LecturerClasses.jsx` | Giờ bắt đầu/kết thúc lịch học trên danh sách/chi tiết lớp. |
| File page cũ: `LecturerAiInsightsPage.jsx`, `LecturerLearningAnalyticsPage.jsx`, `LecturerAssessmentsPage.jsx`, `LecturerLabsPage.jsx` | Các FormField chọn ngày/giờ cũng nhận cập nhật; file cũ không được mở qua routing hiện tại. |

Các trang đang dùng SelectField nhận dropdown mới qua shared component, gồm quản trị, giảng viên, sinh viên, trợ giảng và phân trang. Giữ nguyên các callback lọc, danh sách option, giá trị và thao tác lưu của page.

## Kiểm tra

- `node --test scripts/*.test.mjs`: **59/59 đạt**, gồm ngày nhuận, vị trí thứ Hai, giới hạn ngày, disabled dates và giữ định dạng địa phương.
- `node scripts/check-pickers.mjs`: **đạt**. Kiểm tra một ngày, min/max/disabled, arrow/Enter/Escape, click ngoài, Tab giữa giờ/phút, FormData, controlled/default value/reset, datetime/time/month, select disabled, popup trong form và viewport **1280/390/320px**.
- `scripts/check-ui-polish.mjs` với dữ liệu bổ sung và form tạo: **52 route × 4 chiều rộng, 208 lượt trang, 354 trạng thái**, không phát hiện lỗi runtime, thiếu padding hoặc tràn bố cục. Loại khỏi phép đo các sự kiện nằm trong vùng lịch dashboard cuộn ngang có chủ đích.
- `npm run build -- --outDir .tmp-picker-build`: **đạt**.
- Repo chưa có script lint/typecheck riêng. Prettier được dùng cho các component/helper/style/script mới; `git diff --check` kiểm tra whitespace.
- Kiểm tra trình duyệt dùng dữ liệu giả lập, không ghi dữ liệu vào backend. Build vẫn có cảnh báo bundle trên 500kB; bộ test vẫn có cảnh báo khóa `files` lặp có sẵn trong apiClient.

## Bằng chứng

- [Lịch ngày trên mobile](pickers-screenshots/date-390.png).
- [Dropdown trên mobile](pickers-screenshots/role-390.png).
- [Lịch ngày trên desktop](pickers-screenshots/date-1280.png).
- [Kết quả đo 52 route](ui-polish-pickers.json).

Chạy lại kiểm tra picker cần Vite cổng 5188 (hoặc `UI_ORIGIN`) và Chrome CDP riêng tại cổng 9339, rồi chạy `node scripts/check-pickers.mjs`.
