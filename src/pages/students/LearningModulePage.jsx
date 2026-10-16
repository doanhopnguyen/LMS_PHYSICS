import { LoadingIndicator } from '../../components/LoadingIndicator.jsx';
import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { StudentLearningWorkspace } from '../../components/StudentLearningWorkspace.jsx';
import { api, apiRequest } from '../../lib/apiClient.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);

export function LearningModulePage({ openInitialLesson = false }) {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const classId = params.get('classId') || '';
  const subjectId = params.get('subjectId') || '';
  const topicId = params.get('topicId') || '';
  const requestedMaterialId = params.get('materialId') || params.get('lesson') || '';
  const scope = ['SHARED', 'CLASS'].includes(params.get('scope')) ? params.get('scope') : '';
  const [topic, setTopic] = useState(null);
  const [curriculum, setCurriculum] = useState({ chapters: [], topics: [], materials: [], progress: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      if (!topicId) {
        if (alive) {
          setTopic(null);
          setError('Thiếu mã chủ đề. Hãy mở chủ đề từ trang chi tiết học phần.');
          setLoading(false);
        }
        return;
      }
      try {
        const [materialData, topicData, progressData, topicList, chapterList] = await Promise.all([
          classId ? api.students.myMaterials({ classId }) : api.materials.list(topicId),
          subjectId ? api.subjects.getTopic(subjectId, topicId).catch(() => null) : Promise.resolve(null),
          classId ? api.students.myProgress(classId).catch(() => []) : Promise.resolve([]),
          subjectId ? api.subjects.topics(subjectId).catch(() => []) : Promise.resolve([]),
          subjectId ? apiRequest(`/api/v1/subjects/${subjectId}/chapters`).catch(() => []) : Promise.resolve([]),
        ]);
        if (!alive) return;
        const classMaterials = rowsOf(materialData)
          .filter((item) => !item.approvalStatus || item.approvalStatus === 'APPROVED')
          .filter((item) => item.scope !== 'CLASS' || !classId || String(item.classId) === String(classId))
          .sort(
            (left, right) =>
              Number(left.orderIndex ?? 0) - Number(right.orderIndex ?? 0) ||
              String(left.createdAt || '').localeCompare(String(right.createdAt || ''))
          );
        setCurriculum({
          chapters: rowsOf(chapterList),
          topics: rowsOf(topicList).length
            ? rowsOf(topicList)
            : [topicData || { topicId, topicName: 'Học liệu theo chủ đề' }],
          materials: classMaterials,
          progress: rowsOf(progressData),
        });
        setTopic(topicData || rowsOf(topicList).find((row) => String(row.topicId) === String(topicId)) || null);
      } catch (loadError) {
        if (alive) {
          setTopic(null);
          setError(loadError?.message || 'Không thể tải học liệu của chủ đề.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [classId, openInitialLesson, requestedMaterialId, subjectId, topicId, scope]);

  const title = topic?.topicName || topic?.name || 'Học tập';
  const backHref = classId
    ? `course_detail.html?classId=${encodeURIComponent(classId)}${scope === 'CLASS' ? '&tab=private-materials' : ''}`
    : 'my_courses.html';
  return (
    <AppShell
      currentPage="learning_module.html"
      title={`${title} - PTIT Physics LMS`}
      footer={false}
      toolbar={<DetailToolbar title={title} backHref={backHref} backLabel="Về học phần" />}
    >
      {loading ? (
        <LoadingIndicator className="chapter-empty">Đang tải học liệu…</LoadingIndicator>
      ) : error ? (
        <div className="chapter-empty" role="alert">
          <h1>Không thể mở học liệu</h1>
          <p>{error}</p>
          <a href={backHref}>Về học phần</a>
        </div>
      ) : (
        <StudentLearningWorkspace
          {...curriculum}
          classId={classId}
          subjectId={subjectId}
          scope={scope}
          initialMaterialId={requestedMaterialId}
          initialTopicId={topicId}
          autoStart={openInitialLesson}
        />
      )}
    </AppShell>
  );
}
