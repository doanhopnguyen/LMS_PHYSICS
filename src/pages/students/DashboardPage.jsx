import { DashboardOverview } from '../../components/DashboardOverview.jsx';
import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Card } from '../../components/Card.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { CountDotsChart, DonutChart } from '../../components/DataCharts.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useCurrentUser } from '../../hooks/useCurrentUser.js';
import { api } from '../../lib/apiClient.js';

const tasks = [
  {
    title: 'Bài kiểm tra trắc nghiệm Chương 2',
    description: '45 phút · 30 câu hỏi tính toán',
    due: 'Hạn: 23:59 ngày mai',
    tone: 'primary',
    status: 'Khẩn cấp',
  },
  {
    title: 'Báo cáo thí nghiệm số 01: Khảo sát rơi tự do',
    description: 'Nộp file báo cáo số liệu thực hành phòng Lab 3D',
    due: 'Hạn: 3 ngày nữa',
    tone: 'warning',
    status: 'Đang mở',
  },
  {
    title: 'Luyện tập trắc nghiệm Định luật bảo toàn',
    description: 'Bộ câu hỏi tự luyện nâng cao · Chương 3',
    due: 'Hạn: 5 ngày nữa',
    tone: 'neutral',
    status: 'Đang mở',
  },
];

function getSkyPeriod(hour) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'sunset';
  return 'night';
}

function getSkyMessage(period) {
  return {
    dawn: 'Chào buổi sáng, một ngày học tập mới đang bắt đầu!',
    morning: 'Buổi sáng đầy năng lượng cho hành trình khám phá Vật lý.',
    afternoon: 'Chúc bạn có một buổi chiều học tập thật hiệu quả.',
    sunset: 'Hoàn thành thêm một bài học trước khi ngày khép lại nhé!',
    night: 'Một buổi tối yên tĩnh, lý tưởng để ôn tập và tập trung.',
  }[period];
}

export function DashboardPage() {
  const [skyPeriod, setSkyPeriod] = useState(() => getSkyPeriod(new Date().getHours()));
  const [snapshot, setSnapshot] = useState(null);
  const [myClasses, setMyClasses] = useState([]);
  const user = useCurrentUser();

  useEffect(() => {
    const timer = window.setInterval(() => setSkyPeriod(getSkyPeriod(new Date().getHours())), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    api.dashboard.me().then(setSnapshot).catch(() => {});
    api.students.myClasses().then((data) => {
      const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
      setMyClasses(list);
    }).catch(() => {});
  }, []);

  const stats = snapshot?.data || {};
  const displayName = user?.name || user?.username || 'Sinh viên';

  return (
    <AppShell
      currentPage="dashboard.html"
      title="PTIT Physics 1 - Tổng quan sinh viên"
      bodyClass="bg-[#F8FAFC] text-on-surface font-body-md antialiased min-h-screen"
      breadcrumbs={['Tổng quan']}
      current="Bảng điều khiển sinh viên"
      contentClass="dashboard-content"
    >
      <main className="p-4 md:p-8 max-w-[1360px] mx-auto space-y-8">
        <Card as="section"
          className="dashboard-sky relative overflow-hidden p-6 md:p-8 text-white"
          data-sky-period={skyPeriod}
        >
          <div className="dashboard-sky__aurora pointer-events-none" />
          <div className="dashboard-sky__sun-or-moon pointer-events-none" aria-hidden="true" />
          <div className="dashboard-sky__cloud dashboard-sky__cloud--one pointer-events-none" aria-hidden="true" />
          <div className="dashboard-sky__cloud dashboard-sky__cloud--two pointer-events-none" aria-hidden="true" />
          <div className="dashboard-sky__cloud dashboard-sky__cloud--three pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <StatusBadge tone="primary" className="bg-white/10 text-white border-white/20">
                {myClasses.length > 0 ? myClasses[0]?.classCode || 'Học kỳ hiện tại' : 'Học kỳ hiện tại'}
              </StatusBadge>
              <h1 className="text-headline-lg font-headline-lg font-bold tracking-tight">Xin chào, {displayName}!</h1>
              {/* <p className="text-body-lg text-white/90 leading-relaxed">
                {getSkyMessage(skyPeriod)} Tiếp tục hành trình khám phá môn Vật lý 1 cùng hệ thống học tập thông minh
                PTIT. Bạn đã duy trì chuỗi học 5 ngày liên tiếp!
              </p> */}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Card as="a"
                href="ai_tutor.html"
                className="flex items-center gap-2 px-5 py-3 text-primary-container font-body-md-medium hover:bg-[#FEE2E2] transition-all"
              >
                <span className="material-symbols-outlined text-xl">smart_toy</span>Hỏi trợ giảng AI
              </Card>
              <a
                href="exam_practice_center.html"
                className="flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 text-white font-body-md-medium rounded-xl border border-white/20 transition-all"
              >
                <span className="material-symbols-outlined text-xl">assignment</span>Vào làm bài tập
              </a>
            </div>
          </div>
        </Card>

        <DashboardOverview role="STUDENT">
          <StatCard
            label="Tiến độ học tập chung"
            value={stats.completedTopics != null && stats.totalTopics ? `${Math.round((stats.completedTopics / stats.totalTopics) * 100)}%` : '–'}
            icon="trending_up"
            fillProgress={stats.totalTopics ? (stats.completedTopics / stats.totalTopics) * 100 : 0}
          />
          <StatCard
            label="Chủ đề đã hoàn thành"
            value={stats.completedTopics ?? '–'}
            detail={stats.totalTopics ? `/ ${stats.totalTopics} chủ đề` : ''}
            icon="menu_book"
            tone="success"
            sideChart={<DonutChart value={stats.totalTopics ? (stats.completedTopics / stats.totalTopics) * 100 : 0} label="Hoàn thành" compact />}
          />
          <StatCard
            label="Bài thi đã tham gia"
            value={stats.totalExamsTaken ?? '–'}
            detail="lượt thi"
            icon="quiz"
            tone="warning"
            chart={<CountDotsChart value={stats.totalExamsTaken || 0} unit="bài thi" groupSize={5} />}
          />
          <StatCard
            label="Phiên AI Tutor"
            value={stats.aiSessionsCount ?? '–'}
            detail="phiên thảo luận"
            icon="smart_toy"
            chart={<CountDotsChart value={stats.aiSessionsCount || 0} unit="phiên" color="#b45309" />}
          />
        </DashboardOverview>

        <Card as="aside" className="dashboard-resume" aria-label="Bài học đang học dở">
          <span className="material-symbols-outlined dashboard-resume__icon" aria-hidden="true">play_circle</span>
          <div className="dashboard-resume__text"><span>Đang học dở</span><strong>Bài 4: Các định luật Newton</strong></div>
          <span className="dashboard-resume__progress">75% hoàn thành</span>
          <a href="interactive_lesson.html">Tiếp tục học <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <Card className="lg:col-span-7 p-6">
            <SectionHeader
              icon="assignment_late"
              title="Nhiệm vụ sắp tới"
              action={
                <a href="notifications_help.html" className="text-body-sm text-primary hover:underline font-semibold">
                  Xem tất cả (3)
                </a>
              }
            />
            <div className="space-y-3.5 pt-5">
              {tasks.map((task) => (
                <Card as="div"
                  key={task.title}
                  className="p-4 hover:border-[#CBD5E1] transition-colors flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded border-2 border-[#CBD5E1] bg-white mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-body-md font-semibold text-on-surface">{task.title}</h3>
                      <p className="text-body-sm text-[#64748B] mt-0.5">{task.description}</p>
                      <span className="flex items-center gap-1 mt-2 text-body-sm text-[#64748B]">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {task.due}
                      </span>
                    </div>
                  </div>
                  <StatusBadge tone={task.tone}>{task.status}</StatusBadge>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-5 p-6">
            <SectionHeader icon="bolt" title="Truy cập nhanh" />
            <div className="grid grid-cols-2 gap-3 pt-5">
              {[
                ['library.html', 'menu_book', 'Kho học liệu'],
                ['virtual_lab.html', 'science', 'Phòng Lab 3D'],
                ['exam_practice_center.html', 'quiz', 'Ôn luyện'],
                ['learning_results.html', 'insights', 'Kết quả học tập'],
              ].map(([href, icon, label]) => (
                <Card as="a"
                  key={href}
                  href={href}
                  className="p-4 hover:bg-[#FEF2F2] hover:border-[#FECACA] transition-all group"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined">{icon}</span>
                  </span>
                  <span className="text-body-md font-semibold text-on-surface">{label}</span>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
