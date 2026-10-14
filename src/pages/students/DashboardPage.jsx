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
import { UnifiedDashboardBanner } from '../../components/UnifiedDashboardBanner.jsx';

export function DashboardPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [dashboardError, setDashboardError] = useState('');
  const user = useCurrentUser();

  useEffect(() => {
    let active = true;
    setDashboardError('');
    api.dashboard
      .me()
      .then((data) => active && setSnapshot(data))
      .catch((error) => active && setDashboardError(error.message || 'Không thể tải dữ liệu bảng điều khiển.'));
    Promise.all([api.students.myUpcomingTasks().catch(() => []), api.students.myAgenda().catch(() => [])]).then(
      ([taskData, agendaData]) => {
        if (!active) return;
        const rows = (data) => (Array.isArray(data) ? data : data?.content || []);
        setUpcomingTasks([...rows(taskData), ...rows(agendaData)]);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const stats = snapshot?.data || {};
  const visibleTasks = upcomingTasks.map((item) => ({
    title: item.title || item.taskName || item.name || 'Nhiệm vụ học tập',
    description:
      item.description || item.content || [item.courseName, item.classCode, item.taskType].filter(Boolean).join(' · '),
    due:
      item.dueDate || item.deadline || item.endTime
        ? `Hạn: ${new Date(item.dueDate || item.deadline || item.endTime).toLocaleString('vi-VN')}`
        : 'Đang mở',
    tone: ['HIGH', 'URGENT'].includes(String(item.priority).toUpperCase()) ? 'primary' : 'warning',
    status: item.status || 'Đang mở',
  }));
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
        <UnifiedDashboardBanner displayName={displayName} role="STUDENT" />

        <DashboardOverview role="STUDENT">
          <StatCard
            label="Tiến độ học tập chung"
            value={
              stats.completedTopics != null && stats.totalTopics
                ? `${Math.round((stats.completedTopics / stats.totalTopics) * 100)}%`
                : '–'
            }
            icon="trending_up"
            fillProgress={stats.totalTopics ? (stats.completedTopics / stats.totalTopics) * 100 : 0}
          />
          <StatCard
            label="Chủ đề đã hoàn thành"
            value={stats.completedTopics ?? '–'}
            detail={stats.totalTopics ? `/ ${stats.totalTopics} chủ đề` : ''}
            icon="menu_book"
            tone="success"
            sideChart={
              <DonutChart
                value={stats.totalTopics ? (stats.completedTopics / stats.totalTopics) * 100 : 0}
                label="Hoàn thành"
                compact
              />
            }
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

        {dashboardError && (
          <p role="alert" className="text-body-sm text-primary">
            {dashboardError}
          </p>
        )}

        <Card as="aside" className="dashboard-resume" aria-label="Bài học đang học dở">
          <span className="material-symbols-outlined dashboard-resume__icon" aria-hidden="true">
            play_circle
          </span>
          <div className="dashboard-resume__text">
            <span>Tiến độ học tập hiện tại</span>
            <strong>
              {stats.completedTopics ?? 0} / {stats.totalTopics ?? 0} chủ đề đã hoàn thành
            </strong>
          </div>
          <span className="dashboard-resume__progress">
            {stats.totalTopics
              ? `${Math.round((stats.completedTopics / stats.totalTopics) * 100)}% hoàn thành`
              : 'Chưa có dữ liệu'}
          </span>
          <a href="learning_results.html">
            Xem kết quả{' '}
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </a>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <Card className="lg:col-span-7 p-6">
            <SectionHeader icon="assignment_late" title="Nhiệm vụ sắp tới" />
            <div className="space-y-3.5 pt-5">
              {!visibleTasks.length && <p className="py-5 text-body-sm text-[#64748B]">Không có nhiệm vụ sắp tới.</p>}
              {visibleTasks.map((task) => (
                <Card
                  as="div"
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
                ['my_courses.html', 'menu_book', 'Học phần của tôi'],
                ['virtual_lab.html', 'science', 'Phòng Lab 3D'],
                ['exam_practice_center.html', 'quiz', 'Ôn luyện'],
                ['learning_results.html', 'insights', 'Kết quả học tập'],
              ].map(([href, icon, label]) => (
                <Card
                  as="a"
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
