# Monthly Event Calendar

Đã đọc yêu cầu đính kèm, rà soát DashboardCalendar, các dashboard sử dụng nó, component dùng chung và hợp đồng API trong `API.md`.

## Component và file

| File | Thay đổi |
| --- | --- |
| `src/components/MonthlyCalendar.jsx` | Lịch tháng dùng chung; header chuyển tháng/Hôm nay, 7 cột T2–CN, 5 hoặc 6 tuần, ngày ngoài tháng, nhận biết hôm nay, loading/error/empty. Cùng file có CalendarEvent và EventDetailModal, tránh tách quá nhiều file. |
| `src/components/DashboardCalendar.jsx` | Reuse điểm tích hợp cũ trên bốn dashboard; đổi phần lịch tuần thành MonthlyCalendar, giữ API/phạm vi vai trò và thêm retry khi một số lớp tải lỗi. |
| `src/lib/monthlyCalendar.js` | Chuẩn hóa event từ model hiện có, grid tháng, phân nhóm sự kiện theo ngày, xử lý sự kiện qua nhiều ngày và kết thúc đúng nửa đêm, trạng thái theo thời gian. |
| `src/styles/monthly-calendar.css`, `src/styles.css` | Style theo token/font/primary hiện tại; cell cùng chiều cao, tiêu đề truncate, màu giới hạn, focus-visible, bản compact đủ 7 cột trên điện thoại. |
| `src/pages/lecturers/LecturerApiWorkspace.jsx` | Nhóm card lớp trên dashboard co giãn theo chiều rộng vùng chứa, tránh chữ bị ép khi nằm cạnh lịch tháng. |
| `scripts/monthly-calendar.test.mjs`, `scripts/check-monthly-calendar.mjs` | Kiểm tra logic ngày/model và hành vi trong Chrome với dữ liệu giả lập. |

Component cũ được reuse: **Card, Button, StatusBadge, FormDialog**, Material Symbols, dateKey/parseDate và token màu/khoảng cách. Không thêm thư viện. Các dashboard cập nhật tự động: sinh viên, giảng viên, trợ giảng, quản trị.

## Event model

Model `start/end` là Date và `href` của DashboardCalendar cũ được giữ, bổ sung các field từ dữ liệu hiện có: `type`, `className`, `subjectName`, `examType`, `durationMinutes`, `totalQuestions`, trạng thái nháp khi `isPublished === false`.

MonthlyCalendar cũng nhận event dùng lại ở nơi khác:

```jsx
<MonthlyCalendar
  events={events}
  initialMonth={new Date(2026, 9, 1)}
  loading={loading}
  error={error}
  onRetry={reload}
  maxVisibleEvents={2}
/>
```

Event có `id`, `title`, `start/end` hoặc `date` và `startTime/endTime`; có thể thêm `allDay`, `type`, `status`, `location`, `subjectName`, `className`, `description`, `lecturer`, `createdBy`, `participants`, `href`. Các field thông tin tùy chọn được hiển thị khi có giá trị, không dựng địa điểm/giảng viên giả cho dữ liệu API không cung cấp.

`onMonthChange(firstDay, gridDays)` cho phép nơi sử dụng nối với API lọc theo thời gian khi backend có hỗ trợ. Dashboard hiện tại đổi tháng tại component, không reload trang hoặc gọi lại toàn bộ API.

## API

- Sinh viên: `GET /api/v1/students/me/classes?page=0&size=100`.
- Các vai trò còn lại: `GET /api/v1/classes?page=0&size=100` theo phạm vi backend.
- Kỳ thi từng lớp: `GET /api/v1/exams/class/{classId}`.

`API.md` hiện không mô tả tham số lọc theo tháng cho endpoint kỳ thi này. Vì vậy giữ cách lấy dữ liệu cũ và lọc theo grid tại frontend; không tự thêm tham số hay sửa backend. Giới hạn danh sách lớp 100 cũng giữ như hiện tại.

## Sự kiện và popup

- Desktop hiển thị tối đa hai event mỗi ngày theo giờ bắt đầu; có thể đặt tối đa ba qua prop. Chiều cao cell cố định, không tăng theo số lượng/title.
- “+N sự kiện khác” mở FormDialog liệt kê tất cả sự kiện trong ngày. Mỗi item mở popup chi tiết.
- Click event mở popup trước, giữ nguyên URL; stopPropagation để tránh tác động cell.
- Popup có title nổi bật, badge loại/trạng thái, ngày/giờ và các thông tin thật đang có. Không hiện section trống. Trạng thái gồm Sắp diễn ra, Đang diễn ra, Đã kết thúc, Đã hủy, Bản nháp.
- Đóng bằng nút, click nền hoặc Escape; focus trở lại event/nút mở danh sách ngày.
- Link chỉ xuất hiện khi event có href. Adapter dashboard dùng “Mở trang kỳ thi”, dẫn đến trang kỳ thi/lớp phù hợp với vai trò; chi tiết thông tin đã nằm trong popup.
- Mobile dùng lịch compact 7 cột, ẩn phần giờ trong nhãn nhỏ, giữ title truncate và số lượng; giờ/title đầy đủ nằm trong popup. Tablet dùng đủ grid nếu vùng chứa đủ rộng, có cuộn nội bộ khi cần.

## Edit/Delete và quyền

MonthlyCalendar nhận `canEdit(event)`, `canDelete(event)` và `onEdit/onDelete`. Nút chỉ xuất hiện khi kiểm tra quyền trả về **true** và có callback tương ứng. Không suy ra quyền theo tên vai trò hoặc gọi API sửa/xóa từ lịch.

Dashboard hiện chỉ xem thông tin và mở trang chức năng cũ; không truyền quyền/callback sửa/xóa vì API danh sách chưa cung cấp permission ở cấp event. Thao tác quản lý tiếp tục qua trang hiện có và quyền backend.

## Kiểm tra

- Unit test: **62/62 đạt** (`node --test scripts/*.test.mjs`), gồm grid 12 tháng, ngày ngoài tháng, event qua nhiều ngày, kết thúc nửa đêm, phút lẻ và trạng thái/model theo vai trò.
- Chrome: `node scripts/check-monthly-calendar.mjs` đạt cho chuyển tháng/Hôm nay, outside/today, click event không điều hướng, popup/nút/nền/Escape/focus, overflow ngày, title dài, empty/loading, callback quyền, lỗi/retry và API scope của bốn vai trò.
- Responsive calendar/modal tại **1440, 768, 390, 320px**: cell cùng chiều cao, modal nằm trong viewport, trang không tràn ngang.
- Rà lại bốn dashboard trên **1440, 1280, 768, 390px**: 16 lượt trang, không phát hiện runtime/layout error trong dữ liệu giả lập.
- `npm run build -- --outDir .tmp-monthly-build`: đạt; thư mục build tạm được dọn.
- Prettier check và `git diff --check`: đạt. Repo chưa có script lint/typecheck riêng, không ghi nhận hai bước này là đã chạy.
- Kiểm tra trình duyệt dùng API giả lập, không ghi dữ liệu backend. Cảnh báo bundle trên 500kB và khóa `files` lặp trong apiClient đã có trước đợt thay đổi này.

## Bằng chứng

- [Lịch tháng desktop](monthly-calendar-screenshots/calendar-1440.png).
- [Lịch compact mobile](monthly-calendar-screenshots/calendar-390.png).
- [Popup sự kiện mobile](monthly-calendar-screenshots/modal-390.png).
- [Số đo bốn dashboard](ui-polish-monthly-calendar.json).

Tái kiểm tra trình duyệt cần Vite tại cổng 5188 (hoặc `UI_ORIGIN`) và Chrome CDP riêng tại cổng 9339.
