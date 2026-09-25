import React, { useState } from 'react';
import { Card } from './Card.jsx';

function mondayOf(date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - (result.getDay() + 6) % 7);
  return result;
}
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
const dateLabel = (date) => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
const timeLabel = (hour) => `${String(Math.floor(hour)).padStart(2, '0')}:${hour % 1 ? '30' : '00'}`;

// Demo appointments for the current week; moving weeks does not repeat them.
const schedules = {
  STUDENT: [
    ['Cơ học · Chương 2', 'Lớp D23CQCN01-B', 0, 9, 10.5, 'blue', 'course_detail.html'],
    ['Ôn tập Newton', 'Bài luyện tập', 1, 10.5, 12, 'purple', 'exam_practice_center.html'],
    ['Thí nghiệm rơi tự do', 'Lab 01', 2, 8.5, 10, 'peach', 'virtual_lab.html'],
    ['Kiểm tra Chương 2', '45 phút', 3, 13, 14.5, 'pink', 'exam_practice_center.html'],
    ['Hoàn thiện báo cáo', 'Số liệu thực nghiệm', 4, 14, 15.5, 'green', 'lab_report.html'],
  ],
  INSTRUCTOR: [
    ['Giảng dạy Cơ học', 'D23CQCN01-B', 0, 9, 10.5, 'blue', 'lecturer_courses.html'],
    ['Duyệt học liệu', 'Chương 2', 1, 10.5, 12, 'purple', 'lecturer_materials.html'],
    ['Hướng dẫn thí nghiệm', 'Lab 01', 2, 8.5, 10, 'peach', 'lecturer_labs.html'],
    ['Theo dõi kiểm tra', 'Chương 2', 3, 13, 14.5, 'pink', 'lecturer_assessments.html'],
    ['Chấm báo cáo', 'Thí nghiệm rơi tự do', 4, 14, 15.5, 'green', 'lecturer_lab_grading.html'],
  ],
  TA: [
    ['Hỗ trợ lớp học', 'D23CQCN01-B', 0, 9, 10.5, 'blue', 'ta_class_support.html'],
    ['Chấm rubric Lab 01', '12 báo cáo', 1, 10.5, 12, 'purple', 'ta_work_queue.html'],
    ['Hỗ trợ thí nghiệm', 'Lab 01', 2, 8.5, 10, 'peach', 'ta_class_support.html'],
    ['Theo dõi kỳ kiểm tra', 'Chương 2', 3, 13, 14.5, 'pink', 'ta_class_support.html'],
    ['Hỗ trợ sinh viên', 'Tiến độ học tập', 4, 14, 15.5, 'green', 'ta_work_queue.html'],
  ],
  ADMIN: [
    ['Rà soát tài khoản', 'Yêu cầu mở khóa', 0, 9, 10.5, 'blue', 'admin_users.html'],
    ['Quản lý học kỳ', 'Lớp và môn học', 1, 10.5, 12, 'purple', 'admin_academics.html'],
    ['Phân tích học tập', 'Chất lượng nội dung', 2, 8.5, 10, 'peach', 'admin_analytics.html'],
    ['Kiểm tra vận hành', 'Nhật ký hệ thống', 3, 13, 14.5, 'pink', 'admin_operations.html'],
    ['Tổng hợp hoạt động', 'Báo cáo tuần', 4, 14, 15.5, 'green', 'admin_operations.html'],
  ],
};

export function DashboardCalendar({ role }) {
  const [today] = useState(() => new Date());
  const [week, setWeek] = useState(() => mondayOf(today));
  const currentWeek = mondayOf(today);
  const events = week.getTime() === currentWeek.getTime() ? schedules[role] ?? [] : [];
  const days = Array.from({ length: 7 }, (_, index) => addDays(week, index));
  const hours = Array.from({ length: 9 }, (_, index) => index + 8);

  return (
    <Card className="dashboard-calendar" aria-label="Lịch tuần">
      <header className="dashboard-calendar__toolbar">
        <div>
          <h2>Lịch tuần <span className="dashboard-calendar__demo">Minh họa</span></h2>
          <p aria-live="polite">{dateLabel(week)} – {dateLabel(days[6])}/{days[6].getFullYear()}</p>
        </div>
        <div className="dashboard-calendar__controls">
          <button type="button" aria-label="Tuần trước" onClick={() => setWeek(addDays(week, -7))}><span className="material-symbols-outlined" aria-hidden="true">chevron_left</span></button>
          <button type="button" onClick={() => setWeek(currentWeek)}>Hôm nay</button>
          <button type="button" aria-label="Tuần sau" onClick={() => setWeek(addDays(week, 7))}><span className="material-symbols-outlined" aria-hidden="true">chevron_right</span></button>
        </div>
      </header>
      <div className="dashboard-calendar__scroll" tabIndex={0} aria-label="Lịch theo giờ, có thể cuộn ngang">
        <div className="dashboard-calendar__grid">
          <div className="dashboard-calendar__days">
            <span className="dashboard-calendar__timezone">GMT+7</span>
            {days.map((day, index) => <div key={index} className="dashboard-calendar__day" data-today={day.toDateString() === today.toDateString()} aria-current={day.toDateString() === today.toDateString() ? 'date' : undefined}>
              <span>{index === 6 ? 'CN' : `Thứ ${index + 2}`}</span><strong>{day.getDate()}</strong>
            </div>)}
          </div>
          <div className="dashboard-calendar__timeline">
            <div className="dashboard-calendar__hours">{hours.map(hour => <span key={hour}>{timeLabel(hour)}</span>)}</div>
            {days.map((day, index) => <div key={index} className="dashboard-calendar__column" aria-label={day.toLocaleDateString('vi-VN')}>
              {events.filter(event => event[2] === index).map(([title, detail, , start, end, tone, href]) => <Card as="a" variant="default" key={title} href={href} className={`dashboard-calendar__event dashboard-calendar__event--${tone}`} style={{ top: `${(start - 8) * 44}px`, height: `${(end - start) * 44 - 4}px` }} aria-label={`${title}, ${dateLabel(day)}, ${timeLabel(start)} đến ${timeLabel(end)}, ${detail}`}>
                <strong>{title}</strong><span>{timeLabel(start)}–{timeLabel(end)}</span>
              </Card>)}
            </div>)}
          </div>
        </div>
      </div>
      {!events.length && <p className="dashboard-calendar__empty" role="status">Chưa có lịch trong tuần này.</p>}
    </Card>
  );
}
