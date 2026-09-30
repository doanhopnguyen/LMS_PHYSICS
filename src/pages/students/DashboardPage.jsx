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

function weatherMeta(code) {
  if (code === 0) return { label: 'Trời quang', icon: 'wb_sunny', theme: 'clear' };
  if ([1, 2, 3].includes(code)) return { label: 'Có mây', icon: 'partly_cloudy_day', theme: 'cloudy' };
  if ([45, 48].includes(code)) return { label: 'Sương mù', icon: 'foggy', theme: 'cloudy' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return { label: 'Có mưa', icon: 'rainy', theme: 'rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { label: 'Tuyết', icon: 'ac_unit', theme: 'cloudy' };
  if (code >= 95) return { label: 'Dông', icon: 'thunderstorm', theme: 'storm' };
  return { label: 'Đang cập nhật', icon: 'cloud', theme: 'clear' };
}

const defaultWeatherLocation = { latitude: 20.9808, longitude: 105.7852, label: 'Hà Nội' };

export function DashboardPage() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState({ loading: true, ...weatherMeta(-1), location: '' });
  const [snapshot, setSnapshot] = useState(null);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [dashboardError, setDashboardError] = useState('');
  const user = useCurrentUser();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadWeather = async (location = defaultWeatherLocation) => {
      try {
        const query = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          current: 'temperature_2m,weather_code',
          timezone: 'auto',
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Weather request failed');
        const payload = await response.json();
        if (!active) return;
        const meta = weatherMeta(payload?.current?.weather_code);
        setWeather({
          loading: false,
          ...meta,
          temperature: Math.round(Number(payload?.current?.temperature_2m)),
          location: location.label,
        });
      } catch {
        if (active && !controller.signal.aborted)
          setWeather({ loading: false, ...weatherMeta(-1), location: location.label });
      }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          loadWeather({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            label: 'Vị trí của bạn',
          }),
        () => loadWeather(),
        { timeout: 5000, maximumAge: 30 * 60 * 1000 }
      );
    } else loadWeather();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

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
    description: item.description || item.content || [item.courseName, item.classCode, item.taskType].filter(Boolean).join(' · '),
    due:
      item.dueDate || item.deadline || item.endTime
        ? `Hạn: ${new Date(item.dueDate || item.deadline || item.endTime).toLocaleString('vi-VN')}`
        : 'Đang mở',
    tone: ['HIGH', 'URGENT'].includes(String(item.priority).toUpperCase()) ? 'primary' : 'warning',
    status: item.status || 'Đang mở',
  }));
  const displayName = user?.name || user?.username || 'Sinh viên';
  const skyPeriod = getSkyPeriod(now.getHours());
  const timeText = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(
    now
  );
  const dateText = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(now);

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
        <Card
          as="section"
          className="dashboard-sky relative overflow-hidden p-6 md:p-8 text-white"
          data-sky-period={skyPeriod}
          data-weather={weather.theme}
        >
          <div className="dashboard-sky__aurora pointer-events-none" />
          <div className="dashboard-sky__sun-or-moon pointer-events-none" aria-hidden="true" />
          <div className="dashboard-sky__cloud dashboard-sky__cloud--one pointer-events-none" aria-hidden="true" />
          <div className="dashboard-sky__cloud dashboard-sky__cloud--two pointer-events-none" aria-hidden="true" />
          <div className="dashboard-sky__cloud dashboard-sky__cloud--three pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="dashboard-sky__weather" aria-label="Thời gian và thời tiết hiện tại">
                <span className="dashboard-sky__clock">
                  {timeText}
                  <small>{dateText}</small>
                </span>
                <span className="material-symbols-outlined dashboard-sky__weather-icon" aria-hidden="true">
                  {weather.icon}
                </span>
                <span>
                  <strong>
                    {weather.loading
                      ? 'Đang tải'
                      : Number.isFinite(weather.temperature)
                        ? `${weather.temperature}°C`
                        : '—'}
                  </strong>
                  <small>
                    {weather.loading
                      ? 'Thời tiết'
                      : `${weather.label}${weather.location ? ` · ${weather.location}` : ''}`}
                  </small>
                </span>
              </div>
              <h1 className="text-headline-lg font-headline-lg font-bold tracking-tight">Xin chào, {displayName}!</h1>
              <p className="text-body-lg leading-relaxed text-white/90">{getSkyMessage(skyPeriod)}</p>
              {/* <p className="text-body-lg text-white/90 leading-relaxed">
                {getSkyMessage(skyPeriod)} Tiếp tục hành trình khám phá môn Vật lý 1 cùng hệ thống học tập thông minh
                PTIT. Bạn đã duy trì chuỗi học 5 ngày liên tiếp!
              </p> */}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Card
                as="a"
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

        {dashboardError && <p role="alert" className="text-body-sm text-primary">{dashboardError}</p>}

        <Card as="aside" className="dashboard-resume" aria-label="Bài học đang học dở">
          <span className="material-symbols-outlined dashboard-resume__icon" aria-hidden="true">
            play_circle
          </span>
          <div className="dashboard-resume__text">
            <span>Tiến độ học tập hiện tại</span>
            <strong>{stats.completedTopics ?? 0} / {stats.totalTopics ?? 0} chủ đề đã hoàn thành</strong>
          </div>
          <span className="dashboard-resume__progress">
            {stats.totalTopics ? `${Math.round((stats.completedTopics / stats.totalTopics) * 100)}% hoàn thành` : 'Chưa có dữ liệu'}
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
            <SectionHeader
              icon="assignment_late"
              title="Nhiệm vụ sắp tới"
              action={
                <a href="notifications_help.html" className="text-body-sm text-primary hover:underline font-semibold">
                  Xem tất cả ({visibleTasks.length})
                </a>
              }
            />
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
                ['library.html', 'menu_book', 'Kho học liệu'],
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
