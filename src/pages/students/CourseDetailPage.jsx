import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { api } from '../../lib/apiClient.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);

const courseLabel = (course) =>
  course?.subjectName || course?.subjectCode || course?.className || course?.classCode || 'Học phần';

const formatPercent = (value) => `${Math.round(Number(value || 0))}%`;

export function CourseDetailPage() {
  const [course, setCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [progress, setProgress] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const classId = new URLSearchParams(window.location.search).get('classId');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const enrolled = rowsOf(await api.students.myClasses());
        const selected = enrolled.find((item) => String(item.classId) === String(classId)) || enrolled[0];
        if (!selected) throw new Error('Bạn chưa được ghi danh vào lớp học phần nào.');

        const [topicData, progressData, scheduleData] = await Promise.all([
          selected.subjectId ? api.subjects.topics(selected.subjectId).catch(() => []) : Promise.resolve([]),
          api.students.myProgress(selected.classId).catch(() => []),
          api.classes.schedules(selected.classId).catch(() => []),
        ]);
        if (!alive) return;
        setCourse(selected);
        setTopics(rowsOf(topicData));
        setProgress(rowsOf(progressData));
        setSchedules(rowsOf(scheduleData));
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải chi tiết học phần.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [classId]);

  const progressByTopic = useMemo(() => new Map(progress.map((item) => [String(item.topicId), item])), [progress]);
  const overallProgress = useMemo(() => {
    if (!progress.length) return 0;
    const total = progress.reduce((sum, item) => sum + Number(item.progressPercent ?? item.completionPercent ?? 0), 0);
    return total / progress.length;
  }, [progress]);

  const topicProgress = (topic) => {
    const item = progressByTopic.get(String(topic.topicId));
    return Number(item?.progressPercent ?? item?.completionPercent ?? 0);
  };

  return (
    <AppShell currentPage="course_detail.html" title="Chi tiết học phần · PTIT Physics LMS">
      <PageContainer>
        <PageTitle
          eyebrow="Học phần"
          title={loading ? 'Đang tải học phần…' : courseLabel(course)}
          description={course ? `${course.classCode || 'Lớp học phần'}${course.semesterName ? ` · ${course.semesterName}` : ''}` : 'Nội dung, tiến độ và lịch học của bạn.'}
          actions={<a href="my_courses.html"><Button variant="secondary" icon="arrow_back">Quay lại</Button></a>}
        />

        {error && <Card className="mb-6 border-rose-200 bg-rose-50 text-rose-700">{error}</Card>}
        {loading && <Card className="py-10 text-center text-slate-500">Đang tải nội dung học phần…</Card>}

        {!loading && course && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <main className="space-y-6">
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-7 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-indigo-100">{course.subjectCode || course.classCode}</p>
                      <h2 className="mt-1 text-2xl font-bold">{courseLabel(course)}</h2>
                      <p className="mt-2 text-sm text-indigo-100">{course.instructorName ? `Giảng viên: ${course.instructorName}` : 'Theo dõi tiến độ học tập của bạn.'}</p>
                    </div>
                    <span className="material-symbols-outlined text-4xl text-indigo-100" aria-hidden="true">menu_book</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Tiến độ tổng thể</span>
                    <span className="font-semibold text-indigo-600">{formatPercent(overallProgress)}</span>
                  </div>
                  <ProgressBar value={overallProgress} />
                </div>
              </Card>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Nội dung học tập</h2>
                    <p className="text-sm text-slate-500">Chọn một chủ đề để xem học liệu và tiếp tục học.</p>
                  </div>
                  <span className="text-sm font-medium text-slate-500">{topics.length} chủ đề</span>
                </div>
                <div className="space-y-3">
                  {topics.map((topic, index) => {
                    const value = topicProgress(topic);
                    const href = `learning_module.html?classId=${encodeURIComponent(course.classId)}&subjectId=${encodeURIComponent(course.subjectId || '')}&topicId=${encodeURIComponent(topic.topicId)}`;
                    return (
                      <a key={topic.topicId} href={href} className="block">
                        <Card className="group transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">{index + 1}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="truncate font-semibold text-slate-900">{topic.topicName || topic.name || `Chủ đề ${index + 1}`}</h3>
                                {value >= 100 && <StatusBadge tone="success">Hoàn thành</StatusBadge>}
                              </div>
                              {topic.description && <p className="mt-1 line-clamp-1 text-sm text-slate-500">{topic.description}</p>}
                              <div className="mt-3 flex items-center gap-3">
                                <ProgressBar value={value} className="max-w-48 flex-1" />
                                <span className="text-xs font-medium text-slate-500">{formatPercent(value)}</span>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-400 transition group-hover:text-indigo-600" aria-hidden="true">chevron_right</span>
                          </div>
                        </Card>
                      </a>
                    );
                  })}
                  {!topics.length && <Card className="py-8 text-center text-slate-500">Giảng viên chưa thêm chủ đề cho học phần này.</Card>}
                </div>
              </section>
            </main>

            <aside className="space-y-6">
              <Card>
                <div className="mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-indigo-600" aria-hidden="true">calendar_month</span><h2 className="font-bold text-slate-900">Lịch học</h2></div>
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div key={schedule.scheduleId} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <p className="font-medium text-slate-800">{schedule.dayOfWeekText || schedule.dayOfWeek || 'Buổi học'}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><span className="material-symbols-outlined text-base" aria-hidden="true">schedule</span>{schedule.startTime || '—'} – {schedule.endTime || '—'}</p>
                      {(schedule.room || schedule.building) && <p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><span className="material-symbols-outlined text-base" aria-hidden="true">location_on</span>{[schedule.room, schedule.building].filter(Boolean).join(' · ')}</p>}
                    </div>
                  ))}
                  {!schedules.length && <p className="text-sm text-slate-500">Chưa có lịch học được công bố.</p>}
                </div>
              </Card>
              <Card className="bg-indigo-50/70">
                <span className="material-symbols-outlined text-2xl text-indigo-600" aria-hidden="true">play_circle</span>
                <h2 className="mt-3 font-bold text-slate-900">Tiếp tục học</h2>
                <p className="mt-1 text-sm text-slate-600">Mở chủ đề đầu tiên chưa hoàn thành để tiếp tục tiến độ.</p>
                {topics.length > 0 && <a className="mt-4 inline-block" href={`learning_module.html?classId=${encodeURIComponent(course.classId)}&subjectId=${encodeURIComponent(course.subjectId || '')}&topicId=${encodeURIComponent(topics.find((topic) => topicProgress(topic) < 100)?.topicId || topics[0].topicId)}`}><Button>Tiếp tục</Button></a>}
              </Card>
            </aside>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
