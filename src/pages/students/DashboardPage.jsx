import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Card } from '../../components/Card.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { CountDotsChart, DonutChart } from '../../components/DataCharts.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

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

  useEffect(() => {
    const timer = window.setInterval(() => setSkyPeriod(getSkyPeriod(new Date().getHours())), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

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
        <section
          className="dashboard-sky relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-sm"
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
                Học kỳ 1 · Năm học 2024-2025
              </StatusBadge>
              <h1 className="text-headline-lg font-headline-lg font-bold tracking-tight">Xin chào, Nguyễn Văn A!</h1>
              <p className="text-body-lg text-white/90 leading-relaxed">
                {getSkyMessage(skyPeriod)} Tiếp tục hành trình khám phá môn Vật lý 1 cùng hệ thống học tập thông minh
                PTIT. Bạn đã duy trì chuỗi học 5 ngày liên tiếp!
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="ai_tutor.html"
                className="flex items-center gap-2 px-5 py-3 bg-white text-primary-container font-body-md-medium rounded-xl hover:bg-[#FEE2E2] shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-xl">smart_toy</span>Hỏi trợ giảng AI
              </a>
              <a
                href="exam_practice_center.html"
                className="flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 text-white font-body-md-medium rounded-xl border border-white/20 transition-all"
              >
                <span className="material-symbols-outlined text-xl">assignment</span>Vào làm bài tập
              </a>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-label="Thống kê học tập">
          <StatCard label="Tiến độ học tập chung" value="68%" icon="trending_up" fillProgress={68} />
          <StatCard
            label="Bài học đã hoàn thành"
            value="18"
            detail="/ 24 bài"
            icon="menu_book"
            tone="success"
            sideChart={<DonutChart value={(18 / 24) * 100} label="Bài học đã hoàn thành" compact />}
          />
          <StatCard
            label="Bài luyện tập đã làm"
            value="45"
            detail="bộ đề"
            icon="quiz"
            tone="warning"
            chart={<CountDotsChart value={45} unit="bộ đề" groupSize={5} />}
          />
          <StatCard
            label="Nhiệm vụ cần làm"
            value="3"
            detail="nhiệm vụ mở"
            icon="notification_important"
            chart={<CountDotsChart value={tasks.length} unit="nhiệm vụ" color="#b45309" />}
          />
        </section>

        <Card className="p-6 lg:p-7 border-2 border-[#CBD5E1]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge tone="primary">ĐANG HỌC DỞ</StatusBadge>
                <span className="text-body-sm text-[#64748B] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>Truy cập gần nhất: Hôm nay, 09:30
                </span>
              </div>
              <div>
                <div className="text-label-md text-primary font-bold tracking-wide">
                  Vật lý đại cương 1 · BAS1201 · Lớp D23CQCN01-B
                </div>
                <h2 className="text-headline-md text-on-surface font-bold mt-1">Chương 2: Động lực học chất điểm</h2>
                <p className="text-body-md text-[#475569] mt-0.5">
                  Bài 4: Các định luật Newton và ứng dụng trong cơ học kỹ thuật
                </p>
              </div>
              <ProgressBar value={75} label="Tiến độ bài học hiện tại" className="pt-2 max-w-xl text-[#64748B]" />
            </div>
            <div className="flex lg:flex-col sm:flex-row flex-col gap-3 w-full lg:w-auto lg:min-w-[210px]">
              <a
                href="interactive_lesson.html"
                className="h-11 px-5 rounded-xl bg-primary-container text-white font-body-md-medium hover:bg-[#C41E1A] shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">play_arrow</span>Tiếp tục học ngay
              </a>
              <a
                href="course_detail.html"
                className="h-11 px-5 rounded-xl bg-white border border-[#CBD5E1] text-[#1F2937] font-body-md-medium hover:bg-[#F1F5F9] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl text-[#64748B]">menu_book</span>Xem đề cương chương
              </a>
            </div>
          </div>
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
                <div
                  key={task.title}
                  className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#CBD5E1] transition-colors flex items-start justify-between gap-4"
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
                </div>
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
                <a
                  key={href}
                  href={href}
                  className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#FEF2F2] hover:border-[#FECACA] transition-all group"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined">{icon}</span>
                  </span>
                  <span className="text-body-md font-semibold text-on-surface">{label}</span>
                </a>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
