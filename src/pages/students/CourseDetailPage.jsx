import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { Card } from '../../components/Card.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { StudentLearningWorkspace } from '../../components/StudentLearningWorkspace.jsx';
import { api, apiRequest } from '../../lib/apiClient.js';
import { loadClassMaterialProgress } from '../../lib/classMaterialProgress.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);

const courseLabel = (course) =>
  course?.subjectName || course?.subjectCode || course?.className || course?.classCode || 'Học phần';

export function CourseDetailPage() {
  const [course, setCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [materialError, setMaterialError] = useState('');
  const [contentTab, setContentTab] = useState(() =>
    new URLSearchParams(window.location.search).get('tab') === 'private-materials' ||
    new URLSearchParams(window.location.search).get('scope') === 'CLASS'
      ? 'private-materials'
      : 'curriculum'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialParams] = useState(() => new URLSearchParams(window.location.search));
  const classId = new URLSearchParams(window.location.search).get('classId');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      setMaterialError('');
      try {
        const enrolled = rowsOf(await api.students.myClasses());
        const selected = classId ? enrolled.find((item) => String(item.classId) === String(classId)) : enrolled[0];
        if (classId && !selected) throw new Error('Bạn chưa được ghi danh vào lớp học phần này.');
        if (!selected) throw new Error('Bạn chưa được ghi danh vào lớp học phần nào.');

        const [topicData, progressData, scheduleData, materialData, chapterData] = await Promise.all([
          selected.subjectId ? api.subjects.topics(selected.subjectId).catch(() => []) : Promise.resolve([]),
          loadClassMaterialProgress(selected.classId),
          api.classes.schedules(selected.classId).catch(() => []),
          api.students.myMaterials({ classId: selected.classId }).catch((loadError) => {
            if (alive) setMaterialError(loadError?.message || 'Không thể tải học liệu của lớp.');
            return [];
          }),
          selected.subjectId
            ? apiRequest(`/api/v1/subjects/${selected.subjectId}/chapters`).catch(() => [])
            : Promise.resolve([]),
        ]);
        if (!alive) return;
        setCourse(selected);
        setTopics(rowsOf(topicData));
        setProgress(rowsOf(progressData));
        setSchedules(rowsOf(scheduleData));
        setMaterials(rowsOf(materialData));
        setChapters(rowsOf(chapterData));
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải chi tiết học phần.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [classId]);

  const allowedMaterials = useMemo(
    () =>
      materials.filter(
        (material) =>
          (!material.approvalStatus || material.approvalStatus === 'APPROVED') &&
          (material.scope !== 'CLASS' || String(material.classId) === String(course?.classId))
      ),
    [materials, course?.classId]
  );
  const updateProgress = useCallback((topicId, progressPercent) => {
    setProgress((current) => {
      const previous = current.find((row) => String(row.topicId) === String(topicId));
      if (Number(previous?.progressPercent || 0) === progressPercent) return current;
      return [
        ...current.filter((row) => String(row.topicId) !== String(topicId)),
        { ...previous, topicId, progressPercent },
      ];
    });
  }, []);

  return (
    <AppShell currentPage="course_detail.html" title="Chi tiết học phần · PTIT Physics LMS" backHref="my_courses.html">
      <PageContainer>
        <PageTitle
          eyebrow="Học phần"
          title={loading ? 'Đang tải học phần…' : courseLabel(course)}
          description={
            course
              ? `${course.classCode || 'Lớp học phần'}${course.semesterName ? ` · ${course.semesterName}` : ''}`
              : 'Nội dung, tiến độ và lịch học của bạn.'
          }
        />

        {error && <Card className="mb-6 p-5 text-primary">{error}</Card>}
        {loading && <Card className="p-6 text-center text-[#64748B]">Đang tải nội dung học phần…</Card>}

        {!loading && course && (
          <div className="space-y-6">
            <div className="min-w-0 space-y-6">
              <Tabs
                items={[
                  { id: 'curriculum', label: 'Chương trình chính' },
                  { id: 'private-materials', label: 'Học liệu giảng viên giao riêng' },
                ]}
                activeId={contentTab}
                onChange={(tab) => {
                  setContentTab(tab);
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', tab);
                  url.searchParams.set('scope', tab === 'private-materials' ? 'CLASS' : 'SHARED');
                  url.searchParams.delete('materialId');
                  window.history.replaceState(window.history.state, '', url);
                }}
              >
                {(tab) => (
                  <div className="mt-4">
                    {materialError ? (
                      <p role="alert" className="p-5 text-primary">
                        {materialError}
                      </p>
                    ) : (
                      <StudentLearningWorkspace
                        classId={course.classId}
                        subjectId={course.subjectId}
                        chapters={chapters}
                        topics={topics}
                        materials={allowedMaterials}
                        progress={progress}
                        scope={tab === 'curriculum' ? 'SHARED' : 'CLASS'}
                        initialMaterialId={initialParams.get('materialId') || ''}
                        initialTopicId={initialParams.get('topicId') || ''}
                        onProgressChange={updateProgress}
                        embedded
                      />
                    )}
                  </div>
                )}
              </Tabs>
            </div>

            <aside className="space-y-6">
              <Card className="p-5">
                <SectionHeader icon="calendar_month" title="Lịch học" className="mb-4" />
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div key={schedule.scheduleId} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <p className="font-medium text-slate-800">
                        {schedule.dayOfWeekText || schedule.dayOfWeek || 'Buổi học'}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <span className="material-symbols-outlined text-base" aria-hidden="true">
                          schedule
                        </span>
                        {schedule.startTime || '—'} – {schedule.endTime || '—'}
                      </p>
                      {(schedule.room || schedule.building) && (
                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <span className="material-symbols-outlined text-base" aria-hidden="true">
                            location_on
                          </span>
                          {[schedule.room, schedule.building].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  ))}
                  {!schedules.length && <p className="text-sm text-slate-500">Chưa có lịch học được công bố.</p>}
                </div>
              </Card>
            </aside>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
