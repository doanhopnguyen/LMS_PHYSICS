import { PaginatedList } from "../../components/Pagination.jsx";
import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { api } from '../../lib/apiClient.js';

export function MyCoursesPage() {
  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.students.myClasses()
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
        setClasses(list);
      })
      .catch((err) => setError(err.message || 'Không thể tải danh sách lớp học.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.students.mySchedule()
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : data?.data || [];
        setSchedules([...list].sort((left, right) => (left.dayOfWeek || 9) - (right.dayOfWeek || 9) || String(left.startTime || '').localeCompare(String(right.startTime || ''))));
      })
      .catch((err) => setScheduleError(err.message || 'Không thể tải thời khóa biểu.'))
      .finally(() => setScheduleLoading(false));
  }, []);

  const CLASS_ICONS = ['auto_stories', 'science', 'calculate', 'psychology'];
  const CLASS_COLORS = [
    { bg: 'bg-[#FEE2E2]', text: 'text-primary' },
    { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]' },
    { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
    { bg: 'bg-[#EDE9FE]', text: 'text-[#7C3AED]' },
  ];

  return (
    <AppShell
      currentPage="my_courses.html"
      title="Học phần của tôi · PTIT Physics 1"
      breadcrumbs={['Học phần của tôi']}
      current="Danh sách học phần"
    >
      <PageContainer>
        <PageTitle
          eyebrow="NĂM HỌC 2026–2027"
          title="Học phần của tôi"
          description="Tổng quan tiến độ các học phần bạn đang theo học."
          actions={<Button icon="add">Tham gia học phần</Button>}
        />
        {loading && <p className="text-body-md text-[#64748B] py-10 text-center">Đang tải danh sách lớp học...</p>}
        {error && <p className="text-body-md text-primary py-10 text-center">{error}</p>}
        {!loading && !error && classes.length === 0 && (
          <p className="text-body-md text-[#64748B] py-10 text-center">Bạn chưa đăng ký lớp học nào.</p>
        )}
        {!loading && !error && classes.length > 0 && (
          <PaginatedList className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {classes.map((cls, idx) => {
              const color = CLASS_COLORS[idx % CLASS_COLORS.length];
              const icon = CLASS_ICONS[idx % CLASS_ICONS.length];
              return (
                <Card
                  key={cls.classId}
                  status={cls.status}
                  className="hover:-translate-y-1 hover:shadow-md transition-all"
                >
                  <div className="relative z-10 p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between">
                      <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.bg} ${color.text}`}>
                        <span className="material-symbols-outlined text-2xl">{icon}</span>
                      </span>
                      <StatusBadge tone={cls.status === 'ACTIVE' ? 'success' : cls.status === 'COMPLETED' ? 'neutral' : 'warning'}>
                        {cls.status === 'ACTIVE' ? 'Đang học' : cls.status === 'COMPLETED' ? 'Hoàn thành' : cls.status === 'DRAFT' ? 'Chưa bắt đầu' : cls.status}
                      </StatusBadge>
                    </div>
                    <div className="mt-5">
                      <span className="text-label-md text-[#64748B]">{cls.classCode}</span>
                      <h2 className="text-headline-sm font-bold mt-1">{cls.subjectName || cls.subjectCode || cls.className || cls.classCode}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-5 text-body-sm">
                      <div className="p-3 rounded-lg bg-white/70 backdrop-blur-[1px]">
                        <span className="text-[#64748B]">Số sinh viên</span>
                        <strong className="block text-body-md mt-1">{cls.maxStudents ?? '–'}</strong>
                      </div>
                      <div className="p-3 rounded-lg bg-white/70 backdrop-blur-[1px]">
                        <span className="text-[#64748B]">Trạng thái</span>
                        <strong className="block text-body-md mt-1">{cls.status}</strong>
                      </div>
                    </div>
                    <a href={`course_detail.html?classId=${encodeURIComponent(cls.classId)}`} className="mt-5">
                      <Button className="w-full" variant={cls.status === 'ACTIVE' ? 'primary' : 'secondary'}>
                        {cls.status === 'ACTIVE' ? 'Tiếp tục học' : 'Xem học phần'}
                      </Button>
                    </a>
                  </div>
                </Card>
              );
            })}
          </PaginatedList>
        )}
        <Card className="p-6">
          <h2 className="text-headline-md font-bold">Thời khóa biểu</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {scheduleLoading && <p className="text-body-sm text-[#64748B]">Đang tải thời khóa biểu…</p>}
            {!scheduleLoading && scheduleError && <p role="alert" className="text-body-sm text-primary">{scheduleError}</p>}
            {!scheduleLoading && !scheduleError && schedules.map((schedule) => (
              <Card as="div" key={schedule.scheduleId} className="p-4 flex gap-3">
                <span className="w-10 h-10 rounded-lg bg-[#FEE2E2] text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">event</span>
                </span>
                <div>
                  <strong className="text-body-md">
                    {schedule.subjectName || schedule.subjectCode || schedule.classCode || 'Lớp học phần'}
                  </strong>
                  <p className="text-body-sm text-[#64748B] mt-1">
                    {schedule.dayOfWeekText || `Thứ ${schedule.dayOfWeek || '—'}`} · {schedule.startTime || '—'} – {schedule.endTime || '—'}
                  </p>
                  {(schedule.building || schedule.room) && <p className="text-body-sm text-[#64748B] mt-1">{[schedule.building, schedule.room].filter(Boolean).join(' · ')}</p>}
                </div>
              </Card>
            ))}
            {!scheduleLoading && !scheduleError && !schedules.length && <p className="text-body-sm text-[#64748B]">Chưa có thời khóa biểu được công bố.</p>}
          </div>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
