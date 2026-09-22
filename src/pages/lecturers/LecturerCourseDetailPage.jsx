import React from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { CountDotsChart, DonutChart } from '../../components/DataCharts.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { LecturerNotFoundState } from '../../components/LecturerNotFoundState.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { lecturerCourses } from '../../data/lecturerData.js';

const tabs = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'students', label: 'Sinh viên' },
  { id: 'content', label: 'Nội dung' },
  { id: 'assignments', label: 'Bài tập' },
  { id: 'exams', label: 'Kiểm tra' },
  { id: 'labs', label: 'Thí nghiệm' },
  { id: 'results', label: 'Kết quả' },
];

const upcomingTasks = [
  ['assignment', 'Đóng bài tập Công và năng lượng', '23:59 · 23/09/2026', '34/42 bài đã nộp'],
  ['quiz', 'Kiểm tra Chương 3', '08:00 · 24/09/2026', 'Đã lên lịch'],
  ['science', 'Thực hành Lab 02', '14:00 · 26/09/2026', 'Phòng Lab 3D'],
];

const recentActivity = [
  ['10:30', '12 sinh viên vừa nộp báo cáo Lab 01'],
  ['09:45', '18 lượt hoàn thành mới ở Kiểm tra Chương 2'],
  ['Hôm qua', 'Bài giảng Chương 3 đã được xuất bản'],
];

function OverviewTab({ course }) {
  return (
    <div className="space-y-5 pt-5">
      <MetricGrid items={[
        { label: 'Số sinh viên', value: String(course.students), detail: 'sinh viên', icon: 'groups', sideChart: <CountDotsChart value={course.students} unit="sinh viên" groupSize={7} /> },
        { label: 'Tiến độ trung bình', value: `${course.progress}%`, detail: 'toàn lớp', icon: 'trending_up', sideChart: <DonutChart value={course.progress} label="Tiến độ trung bình" compact /> },
        { label: 'Điểm trung bình', value: String(course.averageScore), detail: '/10', icon: 'leaderboard', sideChart: <DonutChart value={course.averageScore * 10} label="Điểm trung bình" compact /> },
        { label: 'Tỷ lệ hoàn thành', value: `${course.labCompletion}%`, detail: 'thí nghiệm', icon: 'task_alt', sideChart: <DonutChart value={course.labCompletion} label="Tỷ lệ hoàn thành thí nghiệm" compact /> },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-7 p-6">
          <SectionHeader icon="event_upcoming" title="Nhiệm vụ sắp tới" />
          <div className="space-y-3 pt-5">
            {upcomingTasks.map(([icon, title, time, detail]) => (
              <div key={title} className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2] text-primary"><span className="material-symbols-outlined">{icon}</span></span>
                <div className="min-w-0 flex-1"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-body-sm text-[#64748B]">{time} · {detail}</p></div>
                <span className="material-symbols-outlined text-[#94A3B8]">chevron_right</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-5 p-6">
          <SectionHeader icon="history" title="Hoạt động gần đây" />
          <div className="divide-y divide-[#E2E8F0] pt-2">
            {recentActivity.map(([time, text]) => <div key={`${time}-${text}`} className="py-4"><strong className="text-label-md text-primary">{time}</strong><p className="mt-1 text-body-sm">{text}</p></div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}

function LinkedTab({ active }) {
  const config = {
    students: ['groups', 'Quản lý sinh viên trong lớp', 'Theo dõi tiến độ và kết quả của 42 sinh viên.', 'lecturer_students.html', 'Mở danh sách sinh viên'],
    content: ['menu_book', 'Nội dung học phần', '4 chương · 24 bài học · 16 tài liệu đã xuất bản.', 'lecturer_materials.html', 'Quản lý nội dung'],
    assignments: ['assignment', 'Bài tập', '5 bài tập đang mở, 2 bài cần chấm.', 'lecturer_assessments.html', 'Quản lý bài tập'],
    exams: ['quiz', 'Kiểm tra', '2 bài đang mở, 1 bài đã lên lịch.', 'lecturer_assessments.html', 'Quản lý kiểm tra'],
    labs: ['science', 'Thí nghiệm', '4 thí nghiệm đã được phân công cho lớp.', 'lecturer_labs.html', 'Quản lý thí nghiệm'],
    results: ['insights', 'Kết quả lớp học', 'Xem tiến độ, điểm số và mức độ tham gia.', 'lecturer_analytics.html', 'Xem phân tích'],
  }[active];
  if (!config) return null;
  return <Card className="mt-5 p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEE2E2] text-primary"><span className="material-symbols-outlined">{config[0]}</span></span><h2 className="mt-4 text-headline-md font-bold">{config[1]}</h2><p className="mt-2 text-body-md text-[#64748B]">{config[2]}</p><a href={config[3]} className="mt-5 inline-block"><Button>{config[4]}</Button></a></Card>;
}

export function LecturerCourseDetailPage() {
  const className = new URLSearchParams(window.location.search).get('class') ?? 'D23CQCN01-B';
  const course = lecturerCourses.find((item) => item.className === className);

  if (!course) {
    return (
      <LecturerPageShell
        currentPage="lecturer_courses.html"
        title="Không tìm thấy lớp học"
        eyebrow="HỌC PHẦN & LỚP HỌC"
        description="Mã lớp trong liên kết không tồn tại trong dữ liệu hiện tại."
      >
        <LecturerNotFoundState
          message={`Không có lớp ${className} trong danh sách lớp giảng viên đang phụ trách.`}
          backHref="lecturer_courses.html"
          backLabel="Quay lại danh sách lớp"
        />
      </LecturerPageShell>
    );
  }

  return (
    <LecturerPageShell currentPage="lecturer_courses.html" title={course.name} eyebrow={`${course.code} · ${course.className}`} description={`${course.students} sinh viên · Học kỳ 1 · 2026–2027`} actions={<><StatusBadge tone="success">Đang giảng dạy</StatusBadge><Button variant="secondary" icon="settings" disabled title="Chức năng cài đặt lớp chưa có trong phạm vi frontend demo">Cài đặt lớp</Button></>}>
      <Breadcrumbs items={['Học phần & lớp học', course.name]} current={course.className} />
      <Card className="p-4 md:p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div><p className="text-label-md font-bold text-primary">{course.code}</p><h2 className="text-headline-md font-bold">{course.className}</h2><p className="mt-1 text-body-sm text-[#64748B]">{course.students} sinh viên</p></div>
          <ProgressBar value={course.progress} label="Tiến độ trung bình" className="w-full sm:max-w-xs text-[#64748B]" />
        </div>
        <Tabs items={tabs}>{(active) => active === 'overview' ? <OverviewTab course={course} /> : <LinkedTab active={active} />}</Tabs>
      </Card>
    </LecturerPageShell>
  );
}
