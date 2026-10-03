import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from './Card.jsx';
import { listItems } from '../hooks/useApiData.js';
import { apiRequest } from '../lib/apiClient.js';

function mondayOf(date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
const dateLabel = (date) => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
const timeLabel = (hour) => `${String(Math.floor(hour)).padStart(2, '0')}:${hour % 1 ? '30' : '00'}`;
const classListPath = (role) =>
  role === 'STUDENT' ? '/api/v1/students/me/classes?page=0&size=100' : '/api/v1/classes?page=0&size=100';
const examHref = (role, classId) => {
  const query = `?classId=${encodeURIComponent(classId)}`;
  return role === 'STUDENT'
    ? `exam_practice_center.html${query}`
    : role === 'INSTRUCTOR'
      ? `lecturer_assessments.html${query}`
      : role === 'TA'
        ? `ta_class_support.html${query}`
        : `admin_academics.html${query}`;
};

function toCalendarEvent(exam, classItem, role) {
  const start = new Date(exam.startTime || exam.startAt);
  if (Number.isNaN(start.getTime())) return null;
  const suppliedEnd = new Date(exam.endTime || exam.endAt);
  const end = Number.isNaN(suppliedEnd.getTime())
    ? new Date(start.getTime() + (Number(exam.durationMinutes) || 60) * 60_000)
    : suppliedEnd;
  return {
    id: exam.examId || `${classItem.classId}-${exam.title}-${start.toISOString()}`,
    title: exam.title || exam.examName || 'Kỳ thi',
    detail: classItem.className || classItem.classCode || 'Lớp học',
    start,
    end: end > start ? end : new Date(start.getTime() + 60 * 60_000),
    href: examHref(role, classItem.classId),
  };
}

export function DashboardCalendar({ role }) {
  const [today] = useState(() => new Date());
  const [week, setWeek] = useState(() => mondayOf(today));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const timelineRef = useRef(null);
  const currentWeek = mondayOf(today);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(week, index)), [week]);
  const hours = Array.from({ length: 14 }, (_, index) => index + 7);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    apiRequest(classListPath(role))
      .then(async (classData) => {
        const classes = listItems(classData);
        const examLists = await Promise.all(
          classes.map(async (classItem) => {
            try {
              return {
                classItem,
                exams: listItems(await apiRequest(`/api/v1/exams/class/${encodeURIComponent(classItem.classId)}`)),
              };
            } catch {
              return { classItem, exams: [] };
            }
          })
        );
        if (live)
          setEvents(
            examLists.flatMap(({ classItem, exams }) =>
              exams.map((exam) => toCalendarEvent(exam, classItem, role)).filter(Boolean)
            )
          );
      })
      .catch((requestError) => {
        if (live) setError(requestError.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [role]);

  useEffect(() => {
    const scrollArea = scrollRef.current;
    const timeline = timelineRef.current;
    if (!scrollArea || !timeline) return undefined;
    const scrollToCurrentTime = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const visibleHour = Math.min(20.5, Math.max(7, currentHour));
      const currentTimeOffset = (visibleHour - 7) * 44;
      scrollArea.scrollTop = Math.max(0, timeline.offsetTop + currentTimeOffset - scrollArea.clientHeight * 0.35);
    };
    const frame = requestAnimationFrame(scrollToCurrentTime);
    return () => cancelAnimationFrame(frame);
  }, []);

  const weekEvents = events.filter((event) => event.start >= week && event.start < addDays(week, 7));
  return (
    <Card className="dashboard-calendar" aria-label="Lịch kỳ thi tuần">
      <header className="dashboard-calendar__toolbar">
        <div>
          <h2>Lịch kỳ thi</h2>
          <p aria-live="polite">
            {dateLabel(week)} – {dateLabel(days[6])}/{days[6].getFullYear()}
          </p>
        </div>
        <div className="dashboard-calendar__controls">
          <button type="button" aria-label="Tuần trước" onClick={() => setWeek(addDays(week, -7))}>
            <span className="material-symbols-outlined" aria-hidden="true">
              chevron_left
            </span>
          </button>
          <button type="button" onClick={() => setWeek(currentWeek)}>
            Hôm nay
          </button>
          <button type="button" aria-label="Tuần sau" onClick={() => setWeek(addDays(week, 7))}>
            <span className="material-symbols-outlined" aria-hidden="true">
              chevron_right
            </span>
          </button>
        </div>
      </header>
      <p className="mt-1 text-body-sm text-[#64748B]">Lịch kiểm tra và thi của các lớp đang theo dõi.</p>
      <div ref={scrollRef} className="dashboard-calendar__scroll" tabIndex={0} aria-label="Lịch kỳ thi theo giờ, có thể cuộn">
        <div className="dashboard-calendar__grid">
          <div className="dashboard-calendar__days">
            <span className="dashboard-calendar__timezone">GMT+7</span>
            {days.map((day, index) => (
              <div
                key={index}
                className="dashboard-calendar__day"
                data-today={day.toDateString() === today.toDateString()}
                aria-current={day.toDateString() === today.toDateString() ? 'date' : undefined}
              >
                <span>{index === 6 ? 'CN' : `Thứ ${index + 2}`}</span>
                <strong>{day.getDate()}</strong>
              </div>
            ))}
          </div>
          <div ref={timelineRef} className="dashboard-calendar__timeline">
            <div className="dashboard-calendar__hours">
              {hours.map((hour) => (
                <span key={hour}>{timeLabel(hour)}</span>
              ))}
            </div>
            {days.map((day, index) => (
              <div key={index} className="dashboard-calendar__column" aria-label={day.toLocaleDateString('vi-VN')}>
                {weekEvents
                  .filter((event) => event.start.toDateString() === day.toDateString())
                  .map((event) => {
                    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
                    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
                    const visibleStart = Math.max(7, startHour);
                    const visibleEnd = Math.min(21, Math.max(visibleStart + 0.5, endHour));
                    if (visibleStart >= 21 || visibleEnd <= 7) return null;
                    return (
                      <Card
                        as="a"
                        variant="default"
                        key={event.id}
                        href={event.href}
                        className="dashboard-calendar__event dashboard-calendar__event--primary"
                        style={{
                          top: `${(visibleStart - 7) * 44}px`,
                          height: `${Math.max(40, (visibleEnd - visibleStart) * 44 - 4)}px`,
                        }}
                        aria-label={`${event.title}, ${dateLabel(day)}, ${event.start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} đến ${event.end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}, ${event.detail}`}
                      >
                        <strong>{event.title}</strong>
                        <span>
                          {timeLabel(startHour)}–{timeLabel(endHour)}
                        </span>
                      </Card>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {loading && (
        <p className="dashboard-calendar__empty" role="status">
          Đang tải lịch kỳ thi…
        </p>
      )}
      {!loading && error && (
        <p className="dashboard-calendar__empty" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && !weekEvents.length && (
        <p className="dashboard-calendar__empty" role="status">
          Chưa có kỳ thi được lập lịch trong tuần này.
        </p>
      )}
    </Card>
  );
}
