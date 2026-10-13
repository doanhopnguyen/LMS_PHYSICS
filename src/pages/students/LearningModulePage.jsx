import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { LessonContent } from '../../components/LessonContent.jsx';
import { GuardedVideoPlayer } from '../../components/GuardedVideoPlayer.jsx';
import { useMaterialProgress } from '../../hooks/useMaterialProgress.js';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { api } from '../../lib/apiClient.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const materialTypeLabel = (type) =>
  ({
    VIDEO: 'Video bài giảng',
    PDF: 'Tài liệu PDF',
    SLIDE: 'Bài trình chiếu',
    MARKDOWN: 'Bài đọc',
    TEXT: 'Bài đọc',
    OTHER: 'Học liệu đính kèm',
  })[type] || 'Học liệu';

export function LearningModulePage({ openInitialLesson = false }) {
  const params = new URLSearchParams(window.location.search);
  const classId = params.get('classId') || '';
  const subjectId = params.get('subjectId') || '';
  const topicId = params.get('topicId') || '';
  const requestedMaterialId = params.get('materialId') || params.get('lesson') || '';
  const [topic, setTopic] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [selected, setSelected] = useState(null);
  const learning = useMaterialProgress();
  const completed = learning.completed;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const panelTitle = useRef(null);
  const lesson = selected === null ? null : materials[selected];

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      if (!topicId) {
        if (alive) {
          setTopic(null);
          setMaterials([]);
          setSelected(null);
          setError('Thiếu mã chủ đề. Hãy mở chủ đề từ trang chi tiết học phần.');
          setLoading(false);
        }
        return;
      }
      try {
        const [materialData, topicData, progressData] = await Promise.all([
          classId ? api.students.myMaterials({ classId, topicId }) : api.materials.list(topicId),
          subjectId ? api.subjects.getTopic(subjectId, topicId).catch(() => null) : Promise.resolve(null),
          classId ? api.students.myProgress(classId).catch(() => []) : Promise.resolve([]),
        ]);
        if (!alive) return;
        const orderedMaterials = rowsOf(materialData)
          .filter((item) => !item.topicId || String(item.topicId) === String(topicId))
          .sort(
            (left, right) =>
              Number(left.orderIndex ?? 0) - Number(right.orderIndex ?? 0) ||
              String(left.createdAt || '').localeCompare(String(right.createdAt || ''))
          );
        const progress = rowsOf(progressData).find((item) => String(item.topicId) === String(topicId));
        const initialIndex = orderedMaterials.findIndex(
          (item) => String(item.materialId) === String(requestedMaterialId)
        );
        setTopic(topicData || null);
        setMaterials(orderedMaterials);
        learning.initialize(orderedMaterials, progress || {}, classId, topicId);
        setSelected(initialIndex >= 0 ? initialIndex : openInitialLesson && orderedMaterials.length ? 0 : null);
      } catch (loadError) {
        if (alive) {
          setTopic(null);
          setMaterials([]);
          setSelected(null);
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
  }, [classId, openInitialLesson, requestedMaterialId, subjectId, topicId]);

  useEffect(() => {
    if (lesson) panelTitle.current?.focus({ preventScroll: true });
  }, [lesson?.materialId]);

  const completedSet = useMemo(() => new Set(completed.map(String)), [completed]);
  const title = topic?.topicName || topic?.name || 'Học liệu theo chủ đề';
  const openLesson = (index) => {
    setSelected(index);
    const url = new URL(window.location.href);
    if (index === null) url.searchParams.delete('materialId');
    else url.searchParams.set('materialId', materials[index].materialId);
    url.searchParams.delete('lesson');
    window.history.replaceState(window.history.state, '', url);
  };
  const previous = selected > 0 ? () => openLesson(selected - 1) : undefined;
  const next = selected !== null && selected < materials.length - 1 ? () => openLesson(selected + 1) : undefined;
  const markComplete = async () => {
    if (lesson) learning.markComplete(lesson.materialId);
  };
  const backHref = classId ? `course_detail.html?classId=${encodeURIComponent(classId)}` : 'course_detail.html';

  return (
    <AppShell
      currentPage="learning_module.html"
      title={`${title} · PTIT Physics 1`}
      footer={false}
      toolbar={
        <DetailToolbar
          title={title}
          subtitle={
            lesson
              ? `Học liệu ${selected + 1}/${materials.length} · ${lesson.title}`
              : 'Chọn học liệu trong mục lục để bắt đầu'
          }
          backHref={backHref}
          backLabel="Về học phần"
          actions={
            <>
              <span className="detail-toolbar-status">
                {completed.length}/{materials.length} đã học
              </span>
              <Button variant="secondary" disabled={!previous} onClick={previous} icon="chevron_left">
                Bài trước
              </Button>
              <Button variant="secondary" disabled={!next} onClick={next} icon="chevron_right">
                Bài tiếp
              </Button>
            </>
          }
        />
      }
    >
      {loading ? (
        <div className="chapter-empty">
          <p>Đang tải học liệu…</p>
        </div>
      ) : error && !materials.length ? (
        <div className="chapter-empty">
          <h1>Không thể mở chủ đề</h1>
          <p>{error}</p>
          <a href={backHref}>Quay lại học phần</a>
        </div>
      ) : (
        <main className="chapter-learning">
          <aside className="chapter-outline">
            <h2>Mục lục học liệu</h2>
            <p>
              {materials.length} học liệu · {title}
            </p>
            <nav aria-label={`Học liệu chủ đề ${title}`}>
              {materials.map((item, index) => (
                <button
                  key={item.materialId}
                  type="button"
                  onClick={() => openLesson(index)}
                  className={selected === index ? 'is-selected' : ''}
                  aria-current={selected === index ? 'true' : undefined}
                  aria-expanded={selected === index}
                  aria-controls="chapter-lesson-panel"
                >
                  <span className="chapter-lesson-number">
                    {completedSet.has(String(item.materialId)) ? '✓' : index + 1}
                  </span>
                  <span>
                    {item.title || `Học liệu ${index + 1}`}
                    <small className="chapter-lesson-type">{materialTypeLabel(item.type)}</small>
                  </span>
                </button>
              ))}
            </nav>
          </aside>
          <section id="chapter-lesson-panel" className="chapter-panel" aria-label="Nội dung học liệu">
            {(error || learning.error) && (
              <Card className="mb-5 p-4 text-primary" role="alert">
                {error || learning.error}
                {learning.error && (
                  <Button variant="secondary" onClick={learning.retry}>
                    Đồng bộ lại
                  </Button>
                )}
              </Card>
            )}
            {lesson ? (
              <>
                <div className="chapter-panel-heading">
                  <div>
                    <span>
                      HỌC LIỆU {selected + 1} / {materials.length}
                    </span>
                    <h1 ref={panelTitle} tabIndex={-1}>
                      {lesson.title || `Học liệu ${selected + 1}`}
                    </h1>
                  </div>
                  <button
                    className="chapter-close"
                    type="button"
                    onClick={() => openLesson(null)}
                    aria-label="Đóng học liệu"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                {lesson.type === 'VIDEO' && (
                  <GuardedVideoPlayer
                    key={lesson.materialId}
                    material={lesson}
                    completed={completedSet.has(String(lesson.materialId))}
                    watchedSeconds={learning.watched[String(lesson.materialId)]?.seconds || 0}
                    onProgress={(record) => learning.watch(lesson.materialId, record)}
                  />
                )}
                <LessonContent
                  key={lesson.materialId}
                  material={lesson}
                  completed={completedSet.has(String(lesson.materialId))}
                  saving={learning.saving}
                  completionBlocked={lesson.type === 'VIDEO' && !completedSet.has(String(lesson.materialId))}
                  onPrevious={previous}
                  onNext={next}
                  onComplete={markComplete}
                />
              </>
            ) : !materials.length ? (
              <div className="chapter-empty">
                <span className="material-symbols-outlined" aria-hidden="true">
                  menu_book
                </span>
                <h1>{title}</h1>
                <p>Giảng viên chưa công bố học liệu cho chủ đề này.</p>
              </div>
            ) : (
              <div className="chapter-empty">
                <span className="material-symbols-outlined" aria-hidden="true">
                  menu_book
                </span>
                <h1>{title}</h1>
                <p>Chọn một học liệu trong mục lục bên trái để mở nội dung tại đây.</p>
                <Button icon="play_arrow" onClick={() => openLesson(0)}>
                  Bắt đầu học
                </Button>
              </div>
            )}
          </section>
        </main>
      )}
    </AppShell>
  );
}
