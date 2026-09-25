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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                      <h2 className="text-headline-sm font-bold mt-1">{cls.classCode}</h2>
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
                    <a href="course_detail.html" className="mt-5">
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
          <h2 className="text-headline-md font-bold">Lịch học tuần này</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {['Thứ 2 · 09:30', 'Thứ 4 · 14:00', 'Thứ 6 · 08:00'].map((time, index) => (
              <Card as="div" key={time} className="p-4 flex gap-3">
                <span className="w-10 h-10 rounded-lg bg-[#FEE2E2] text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">event</span>
                </span>
                <div>
                  <strong className="text-body-md">
                    {['Động lực học chất điểm', 'Thực hành Lab 3D', 'Ôn tập Chương 2'][index]}
                  </strong>
                  <p className="text-body-sm text-[#64748B] mt-1">{time} · Phòng A2-304</p>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
