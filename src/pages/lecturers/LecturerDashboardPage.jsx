import { formatPercent } from '../../lib/formatPercent.js';
import { DashboardOverview } from '../../components/DashboardOverview.jsx';
import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { CountDotsChart, DonutChart, HorizontalBarChart, SparklineChart } from '../../components/DataCharts.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  difficultTopics,
  assessments,
  labSubmissions,
  lecturerCourses,
  lecturerDashboardTasks,
  lecturerNavigation,
  lecturerRecentActivity,
  lecturerUser,
  lecturerUtilityNavigation,
} from '../../data/lecturerData.js';
import { loadLabGradings } from '../../lib/labGradingState.js';

function getSkyPeriod(hour) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'sunset';
  return 'night';
}

export function LecturerDashboardPage() {
  const [skyPeriod, setSkyPeriod] = useState(() => getSkyPeriod(new Date().getHours()));
  const managedStudents = lecturerCourses.reduce((sum, course) => sum + course.students, 0);
  const openAssessments = assessments.filter((assessment) => assessment.status === 'OPEN').length;
  const gradings = loadLabGradings();
  const pendingLabReports = labSubmissions.filter(
    (submission) =>
      ['SUBMITTED', 'LATE'].includes(submission.status) &&
      !['CONFIRMED', 'PUBLISHED'].includes(gradings.find((grading) => grading.submissionId === submission.id)?.status)
  ).length;
  const dashboardTasks = lecturerDashboardTasks.map((task) =>
    task.id === 1 ? { ...task, title: `${pendingLabReports} báo cáo thí nghiệm chờ chấm` } : task
  );

  useEffect(() => {
    const timer = window.setInterval(() => setSkyPeriod(getSkyPeriod(new Date().getHours())), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <AppShell
      currentPage="lecturer_dashboard.html"
      title="Tổng quan giảng viên · PTIT Physics LMS"
      bodyClass="bg-[#F8FAFC] text-on-surface font-body-md antialiased min-h-screen"
      contentClass="dashboard-content"
      user={lecturerUser}
      homeHref="lecturer_dashboard.html"
      navigationItems={lecturerNavigation}
      utilityItems={lecturerUtilityNavigation}
      showChatLauncher={false}
    >
      <main className="p-4 md:p-8 max-w-[1360px] mx-auto space-y-8">
        <Card
          as="section"
          className="dashboard-sky relative overflow-hidden p-6 md:p-8 text-white"
          data-sky-period={skyPeriod}
        >
          <div className="dashboard-sky__aurora pointer-events-none" />
          <div className="dashboard-sky__sun-or-moon pointer-events-none" aria-hidden="true" />
          <div className="dashboard-sky__cloud dashboard-sky__cloud--one pointer-events-none" aria-hidden="true" />
          <div className="dashboard-sky__cloud dashboard-sky__cloud--two pointer-events-none" aria-hidden="true" />
          <div className="dashboard-sky__cloud dashboard-sky__cloud--three pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <StatusBadge tone="primary" className="bg-white/10 text-white border-white/20">
                Học kỳ 1 · Năm học 2026-2027
              </StatusBadge>
              <h1 className="text-headline-lg font-headline-lg font-bold tracking-tight">
                Xin chào, TS. Nguyễn Văn B!
              </h1>
              <p className="text-body-lg leading-relaxed text-white/90">
                Đây là tổng quan hoạt động giảng dạy Vật lý đại cương 1 hôm nay.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="lecturer_assessments.html"
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-body-md-medium text-primary shadow-sm transition-all hover:bg-[#FEE2E2]"
              >
                <span className="material-symbols-outlined text-xl">add_task</span>Tạo bài kiểm tra
              </a>
              <a
                href="lecturer_labs.html"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/15 px-5 py-3 font-body-md-medium text-white transition-all hover:bg-white/25"
              >
                <span className="material-symbols-outlined text-xl">science</span>Giao thí nghiệm
              </a>
            </div>
          </div>
        </Card>

        <DashboardOverview role="INSTRUCTOR">
          <StatCard
            label="Sinh viên đang quản lý"
            value={String(managedStudents)}
            detail={`${lecturerCourses.length} lớp`}
            icon="groups"
            sideChart={<CountDotsChart value={lecturerCourses.length} unit="lớp" color="#0284c7" />}
          />
          <StatCard
            label="Bài kiểm tra đang mở"
            value={String(openAssessments)}
            detail="2 bài sắp hết hạn"
            icon="quiz"
            tone="warning"
            sideChart={<DonutChart value={openAssessments ? 50 : 0} label="Hai bài sắp hết hạn" compact />}
          />
          <StatCard
            label="Báo cáo chờ chấm"
            value={String(pendingLabReports)}
            detail="báo cáo thí nghiệm"
            icon="grading"
            tone="primary"
            sideChart={<CountDotsChart value={pendingLabReports} unit="báo cáo" groupSize={4} color="#e52220" />}
          />
          <StatCard
            label="Tiến độ trung bình"
            value="72%"
            detail="+4% so với tuần trước"
            icon="trending_up"
            tone="success"
            chart={
              <SparklineChart data={[61, 63, 65, 64, 68, 70, 72]} tone="success" label="Tiến độ trung bình 7 ngày" />
            }
          />
        </DashboardOverview>

        <Card className="p-6">
          <SectionHeader icon="assignment_late" title="Công việc cần xử lý" />
          <div className="space-y-3 pt-5">
            {dashboardTasks.map((task) => (
              <Card
                as="div"
                key={task.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2] text-primary">
                    <span className="material-symbols-outlined">{task.icon}</span>
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-on-surface">{task.title}</h3>
                      <StatusBadge tone={task.tone}>{task.status}</StatusBadge>
                    </div>
                    <p className="mt-1 text-body-sm text-[#475569]">{task.description}</p>
                    <p className="mt-1 text-body-sm text-[#64748B]">{task.meta}</p>
                  </div>
                </div>
                <a href={task.href} className="shrink-0 sm:self-center">
                  <Button variant={task.tone === 'primary' ? 'primary' : 'secondary'} className="w-full sm:w-auto">
                    {task.action}
                  </Button>
                </a>
              </Card>
            ))}
          </div>
        </Card>

        <section aria-labelledby="class-overview-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="class-overview-title" className="text-headline-md font-bold text-on-surface">
              Tổng quan lớp
            </h2>
            <a href="lecturer_courses.html" className="text-body-sm font-semibold text-primary hover:underline">
              Xem tất cả lớp
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {lecturerCourses.map((course) => (
              <Card key={course.id} variant="accent" className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-label-md font-bold text-primary">{course.code}</p>
                    <h3 className="mt-1 text-headline-sm font-bold">{course.className}</h3>
                    <p className="mt-1 text-body-sm text-[#64748B]">{course.students} sinh viên</p>
                  </div>
                  <StatusBadge tone="success">Đang học</StatusBadge>
                </div>
                <ProgressBar value={course.progress} label="Tiến độ" className="mt-5 text-[#64748B]" />
                <div className="mt-4 grid grid-cols-2 gap-3 text-body-sm">
                  <Card as="div" className="bg-[#F8FAFC] p-3">
                    <span className="text-[#64748B]">Điểm trung bình</span>
                    <strong className="mt-1 block">{course.averageScore}/10</strong>
                  </Card>
                  <Card as="div" className="bg-[#F8FAFC] p-3">
                    <span className="text-[#64748B]">Hoàn thành Lab</span>
                    <strong className="mt-1 block">{formatPercent(course.labCompletion)}</strong>
                  </Card>
                </div>
                <a href={`lecturer_course_detail.html?class=${course.className}`} className="mt-5 block">
                  <Button variant="secondary" className="w-full">
                    Xem lớp
                  </Button>
                </a>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <Card className="lg:col-span-7 p-6">
            <SectionHeader
              icon="priority_high"
              title="Nội dung cần chú ý"
              action={
                <a href="lecturer_analytics.html" className="text-body-sm font-semibold text-primary hover:underline">
                  Xem phân tích chi tiết
                </a>
              }
            />
            <p className="pt-5 text-body-sm text-[#64748B]">Tỷ lệ sinh viên trả lời sai theo nội dung</p>
            <div className="mt-4">
              <HorizontalBarChart items={difficultTopics} label="Các nội dung sinh viên gặp khó khăn" />
            </div>
          </Card>

          <Card className="lg:col-span-5 p-6">
            <SectionHeader icon="history" title="Hoạt động gần đây" />
            <ol className="pt-2">
              {lecturerRecentActivity.map((activity, index) => (
                <li key={activity.id} className="relative flex gap-3 py-3.5">
                  {index < lecturerRecentActivity.length - 1 && (
                    <span className="absolute left-5 top-11 h-[calc(100%-20px)] w-px bg-[#E2E8F0]" aria-hidden="true" />
                  )}
                  <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-primary">
                    <span className="material-symbols-outlined text-lg">{activity.icon}</span>
                  </span>
                  <div className="min-w-0">
                    <time className="text-label-md font-bold text-primary">{activity.time}</time>
                    <p className="mt-1 text-body-md text-on-surface">{activity.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
