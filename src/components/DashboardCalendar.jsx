import React, { useEffect, useState } from 'react';
import { MonthlyCalendar } from './MonthlyCalendar.jsx';
import { listItems } from '../hooks/useApiData.js';
import { apiRequest } from '../lib/apiClient.js';
import { examCalendarEvent } from '../lib/monthlyCalendar.js';

export function DashboardCalendar({ role }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    apiRequest(role === 'STUDENT' ? '/api/v1/students/me/classes?page=0&size=100' : '/api/v1/classes?page=0&size=100')
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
              if (live) setError('Một số lớp chưa tải được lịch kỳ thi. Vui lòng thử lại.');
              return { classItem, exams: [] };
            }
          })
        );
        if (live)
          setEvents(
            examLists.flatMap(({ classItem, exams }) =>
              exams.map((exam) => examCalendarEvent(exam, classItem, role)).filter(Boolean)
            )
          );
      })
      .catch(() => {
        if (live) {
          setEvents([]);
          setError('Không thể tải lịch kỳ thi. Vui lòng thử lại.');
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [role, refresh]);

  return (
    <MonthlyCalendar
      events={events}
      loading={loading}
      error={error}
      onRetry={() => setRefresh((value) => value + 1)}
      title="Lịch kỳ thi"
      description="Lịch kiểm tra và thi của các lớp đang theo dõi. Nhấn sự kiện để xem thông tin."
    />
  );
}
