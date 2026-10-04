import { MarkdownContent } from '../../components/MarkdownContent.jsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MaterialFilePreview } from '../../components/MaterialFilePreview.jsx';
import { MaterialSource } from '../../components/MaterialSource.jsx';
import { GuardedVideoPlayer } from '../../components/GuardedVideoPlayer.jsx';
import { useMaterialProgress } from '../../hooks/useMaterialProgress.js';
import { AppShell } from '../../components/AppShell.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { api } from '../../lib/apiClient.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const materialTypeLabel = {
  MARKDOWN: 'Bài đọc',
  TEXT: 'Văn bản',
  VIDEO: 'Video',
  PDF: 'Tài liệu PDF',
  SLIDE: 'Bài trình chiếu',
  OTHER: 'Tệp đính kèm',
};
const topicLabel = (topic) => topic?.topicName || topic?.name || 'Chủ đề học tập';

export function InteractiveLessonPage() {
  const params = new URLSearchParams(window.location.search);
  const requestedClassId = params.get('classId');
  const requestedSubjectId = params.get('subjectId');
  const requestedTopicId = params.get('topicId');
  const requestedMaterialId = params.get('materialId');
  const [course, setCourse] = useState(null);
  const [topic, setTopic] = useState(null);
  const [materials, setMaterials] = useState([]);
  const learning = useMaterialProgress();
  const progress = learning.percent;
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const saving = learning.saving;
  const [error, setError] = useState('');
  const panelTitle = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const classes = rowsOf(await api.students.myClasses());
        const selectedCourse =
          classes.find((item) => String(item.classId) === String(requestedClassId)) ||
          classes.find((item) => String(item.subjectId) === String(requestedSubjectId)) ||
          classes[0];
        if (!selectedCourse) throw new Error('Bạn chưa được ghi danh vào học phần nào.');
        const topics = rowsOf(await api.subjects.topics(selectedCourse.subjectId));
        const selectedTopic = topics.find((item) => String(item.topicId) === String(requestedTopicId)) || topics[0];
        if (!selectedTopic) throw new Error('Học phần này chưa có chủ đề học tập.');
        const [materialData, progressData] = await Promise.all([
          api.students.myMaterials({ classId: selectedCourse.classId, topicId: selectedTopic.topicId }),
          api.students.myProgress(selectedCourse.classId).catch(() => []),
        ]);
        const materialRows = rowsOf(materialData)
          .filter((item) => !item.topicId || String(item.topicId) === String(selectedTopic.topicId))
          .sort(
            (a, b) =>
              Number(a.orderIndex || 0) - Number(b.orderIndex || 0) ||
              String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
          );
        const saved = rowsOf(progressData).find((item) => String(item.topicId) === String(selectedTopic.topicId));
        if (!alive) return;
        setCourse(selectedCourse);
        setTopic(selectedTopic);
        setMaterials(materialRows);
        learning.initialize(materialRows, saved || {}, selectedCourse.classId, selectedTopic.topicId);
        const initialIndex = materialRows.findIndex((item) => String(item.materialId) === String(requestedMaterialId));
        setSelected(initialIndex >= 0 ? initialIndex : 0);
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải bài học.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [requestedClassId, requestedSubjectId, requestedTopicId, requestedMaterialId]);

  const material = materials[selected] || null;
  const previous = selected > 0 ? () => setSelected((value) => value - 1) : undefined;
  const next = selected < materials.length - 1 ? () => setSelected((value) => value + 1) : undefined;
  const completed = material && learning.completed.includes(String(material.materialId));
  const chapterTitle = useMemo(() => topicLabel(topic), [topic]);

  useEffect(() => {
    if (material) panelTitle.current?.focus({ preventScroll: true });
  }, [material?.materialId]);

  const selectMaterial = (index) => {
    setSelected(index);
    const url = new URL(window.location.href);
    url.searchParams.set('materialId', materials[index].materialId);
    window.history.replaceState(window.history.state, '', url);
  };

  const markComplete = async () => {
    if (material) learning.markComplete(material.materialId);
  };

  const backHref = course ? `course_detail.html?classId=${encodeURIComponent(course.classId)}` : 'course_detail.html';
  return (
    <AppShell
      currentPage="interactive_lesson.html"
      title={`${chapterTitle} · PTIT Physics LMS`}
      footer={false}
      toolbar={
        <DetailToolbar
          title={chapterTitle}
          subtitle={
            material
              ? `Học liệu ${selected + 1}/${materials.length} · ${material.title || 'Không có tiêu đề'}`
              : 'Chọn học liệu để bắt đầu'
          }
          backHref={backHref}
          backLabel="Về học phần"
          actions={
            <>
              <span className="detail-toolbar-status">Tiến độ: {Math.round(progress)}%</span>
              <Button variant="secondary" disabled={!previous} onClick={previous} icon="chevron_left">
                Trước
              </Button>
              <Button variant="secondary" disabled={!next} onClick={next} icon="chevron_right">
                Tiếp
              </Button>
            </>
          }
        />
      }
    >
      {loading ? (
        <div className="chapter-empty">
          <p>Đang tải bài học…</p>
        </div>
      ) : error && !topic ? (
        <div className="chapter-empty">
          <h1>Không thể mở bài học</h1>
          <p>{error}</p>
          <a href="my_courses.html">Về học phần của tôi</a>
        </div>
      ) : (
        <main className="chapter-learning">
          <aside className="chapter-outline">
            <h2>Mục lục học liệu</h2>
            <p>
              {materials.length} học liệu · {chapterTitle}
            </p>
            <div className="mb-4">
              <ProgressBar value={progress} compact />
            </div>
            <nav aria-label={`Học liệu của ${chapterTitle}`}>
              {materials.map((item, index) => (
                <button
                  key={item.materialId}
                  type="button"
                  onClick={() => selectMaterial(index)}
                  className={selected === index ? 'is-selected' : ''}
                  aria-current={selected === index ? 'true' : undefined}
                >
                  <span className="chapter-lesson-number">
                    {learning.completed.includes(String(item.materialId)) ? '✓' : index + 1}
                  </span>
                  <span>
                    {item.title || `Học liệu ${index + 1}`}
                    <small className="chapter-lesson-type">
                      {materialTypeLabel[item.type] || item.type || 'Học liệu'}
                    </small>
                  </span>
                </button>
              ))}
            </nav>
            {!materials.length && (
              <p className="text-body-sm text-[#64748B]">Chủ đề này chưa có học liệu được xuất bản.</p>
            )}
          </aside>
          <section id="chapter-lesson-panel" className="chapter-panel" aria-label="Nội dung bài học">
            {(error || learning.error) && (
              <p role="alert" className="mb-4 text-primary">
                {error || learning.error}
                {learning.error && (
                  <Button variant="secondary" onClick={learning.retry}>
                    Đồng bộ lại
                  </Button>
                )}
              </p>
            )}
            {material ? (
              <>
                <div className="chapter-panel-heading">
                  <div>
                    <span>{materialTypeLabel[material.type] || material.type || 'HỌC LIỆU'}</span>
                    <h1 ref={panelTitle} tabIndex={-1}>
                      {material.title || 'Học liệu không có tiêu đề'}
                    </h1>
                  </div>
                </div>
                {material.type === 'VIDEO' ? (
                  <div className="lesson-video">
                    <GuardedVideoPlayer
                      key={material.materialId}
                      material={material}
                      completed={completed}
                      watchedSeconds={learning.watched[String(material.materialId)]?.seconds || 0}
                      onProgress={(record) => learning.watch(material.materialId, record)}
                    />
                  </div>
                ) : null}
                {material.type === 'VIDEO' && material.contentText && (
                  <Card className="p-6">
                    <h3 className="mb-3 font-semibold">Nội dung video</h3>
                    <p className="whitespace-pre-wrap leading-7 text-[#334155]">{material.contentText}</p>
                  </Card>
                )}
                {(material.type === 'MARKDOWN' || material.type === 'TEXT') && (
                  <article className="lesson-content">
                    <section>
                      <h3>Nội dung bài học</h3>
                      {(material.contentText || !(material.fileUrl || material.downloadUrl || material.url)) &&
                        (material.type === 'MARKDOWN' ? (
                          <MarkdownContent
                            content={
                              material.contentText || 'Giảng viên chưa cập nhật nội dung văn bản cho học liệu này.'
                            }
                          />
                        ) : (
                          <div className="whitespace-pre-wrap leading-7 text-[#334155]">
                            {material.contentText || 'Giảng viên chưa cập nhật nội dung văn bản cho học liệu này.'}
                          </div>
                        ))}
                      {(material.fileUrl || material.downloadUrl || material.url) && (
                        <MaterialFilePreview key={material.materialId} material={material} />
                      )}
                    </section>
                  </article>
                )}
                {material.type !== 'MARKDOWN' && material.type !== 'TEXT' && material.type !== 'VIDEO' && (
                  <Card className="p-6">
                    <span className="material-symbols-outlined text-primary" aria-hidden="true">
                      description
                    </span>
                    <h2 className="mt-3 text-headline-sm font-bold">
                      {materialTypeLabel[material.type] || 'Tệp học liệu'}
                    </h2>
                    {material.fileUrl || material.downloadUrl || material.url ? (
                      <div className="mt-4">
                        <MaterialFilePreview key={material.materialId} material={material} />
                      </div>
                    ) : (
                      <p className="mt-4 text-body-sm text-[#64748B]">Học liệu này chưa có tệp đính kèm.</p>
                    )}
                  </Card>
                )}
                <div className="lesson-controls">
                  {material.sourceCitation && material.type !== 'VIDEO' && (
                    <section className="w-full">
                      <h3 className="font-semibold">Nguồn học liệu</h3>
                      <MaterialSource value={material.sourceCitation} title={material.title} />
                    </section>
                  )}
                  <Button variant="secondary" icon="arrow_back" disabled={!previous} onClick={previous}>
                    Học liệu trước
                  </Button>
                  <Button
                    icon="check"
                    disabled={completed || saving || material.type === 'VIDEO'}
                    onClick={markComplete}
                  >
                    {completed
                      ? 'Đã học'
                      : saving
                        ? 'Đang lưu…'
                        : material.type === 'VIDEO'
                          ? 'Xem hết video để hoàn thành'
                          : 'Đánh dấu đã học'}
                  </Button>
                  <Button variant="secondary" icon="arrow_forward" disabled={!next} onClick={next}>
                    Học liệu tiếp
                  </Button>
                </div>
              </>
            ) : (
              <div className="chapter-empty">
                <span className="material-symbols-outlined" aria-hidden="true">
                  menu_book
                </span>
                <h1>{chapterTitle}</h1>
                <p>Chủ đề này chưa có học liệu để mở.</p>
              </div>
            )}
          </section>
        </main>
      )}
    </AppShell>
  );
}
