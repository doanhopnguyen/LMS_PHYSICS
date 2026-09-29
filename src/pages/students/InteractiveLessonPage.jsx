import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { api } from '../../lib/apiClient.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const materialTypeLabel = { MARKDOWN: 'Bài đọc', TEXT: 'Văn bản', VIDEO: 'Video', PDF: 'Tài liệu PDF', SLIDE: 'Bài trình chiếu', OTHER: 'Tệp đính kèm' };
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
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panelTitle = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const classes = rowsOf(await api.students.myClasses());
        const selectedCourse = classes.find((item) => String(item.classId) === String(requestedClassId))
          || classes.find((item) => String(item.subjectId) === String(requestedSubjectId)) || classes[0];
        if (!selectedCourse) throw new Error('Bạn chưa được ghi danh vào học phần nào.');
        const topics = rowsOf(await api.subjects.topics(selectedCourse.subjectId));
        const selectedTopic = topics.find((item) => String(item.topicId) === String(requestedTopicId)) || topics[0];
        if (!selectedTopic) throw new Error('Học phần này chưa có chủ đề học tập.');
        const [materialData, progressData] = await Promise.all([
          api.materials.list(selectedTopic.topicId),
          api.students.myProgress(selectedCourse.classId).catch(() => []),
        ]);
        const materialRows = rowsOf(materialData);
        const saved = rowsOf(progressData).find((item) => String(item.topicId) === String(selectedTopic.topicId));
        if (!alive) return;
        setCourse(selectedCourse); setTopic(selectedTopic); setMaterials(materialRows);
        setProgress(Number(saved?.progressPercent || 0));
        const initialIndex = materialRows.findIndex((item) => String(item.materialId) === String(requestedMaterialId));
        setSelected(initialIndex >= 0 ? initialIndex : 0);
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải bài học.');
      } finally { if (alive) setLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, [requestedClassId, requestedSubjectId, requestedTopicId, requestedMaterialId]);

  const material = materials[selected] || null;
  const previous = selected > 0 ? () => setSelected((value) => value - 1) : undefined;
  const next = selected < materials.length - 1 ? () => setSelected((value) => value + 1) : undefined;
  const completed = progress >= 100;
  const chapterTitle = useMemo(() => topicLabel(topic), [topic]);

  useEffect(() => { if (material) panelTitle.current?.focus({ preventScroll: true }); }, [material?.materialId]);

  const selectMaterial = (index) => {
    setSelected(index);
    const url = new URL(window.location.href);
    url.searchParams.set('materialId', materials[index].materialId);
    window.history.replaceState(window.history.state, '', url);
  };

  const markComplete = async () => {
    if (!course || !topic || saving) return;
    setSaving(true); setError('');
    try {
      const updated = await api.students.updateProgress({ classId: course.classId, topicId: topic.topicId, progressPercent: 100 });
      setProgress(Number(updated?.progressPercent ?? 100));
    } catch (saveError) {
      setError(saveError?.message || 'Không thể cập nhật tiến độ học tập.');
    } finally { setSaving(false); }
  };

  const backHref = course ? `course_detail.html?classId=${encodeURIComponent(course.classId)}` : 'course_detail.html';
  return (
    <AppShell currentPage="interactive_lesson.html" title={`${chapterTitle} · PTIT Physics LMS`} footer={false}
      toolbar={<DetailToolbar title={chapterTitle} subtitle={material ? `Học liệu ${selected + 1}/${materials.length} · ${material.title || 'Không có tiêu đề'}` : 'Chọn học liệu để bắt đầu'} backHref={backHref} backLabel="Về học phần"
        actions={<><span className="detail-toolbar-status">Tiến độ: {Math.round(progress)}%</span><Button variant="secondary" disabled={!previous} onClick={previous} icon="chevron_left">Trước</Button><Button variant="secondary" disabled={!next} onClick={next} icon="chevron_right">Tiếp</Button></>} />}>
      {loading ? <div className="chapter-empty"><p>Đang tải bài học…</p></div> : error && !topic ? <div className="chapter-empty"><h1>Không thể mở bài học</h1><p>{error}</p><a href="my_courses.html">Về học phần của tôi</a></div> : (
        <main className="chapter-learning">
          <aside className="chapter-outline">
            <h2>Mục lục học liệu</h2>
            <p>{materials.length} học liệu · {chapterTitle}</p>
            <div className="mb-4"><ProgressBar value={progress} compact /></div>
            <nav aria-label={`Học liệu của ${chapterTitle}`}>
              {materials.map((item, index) => <button key={item.materialId} type="button" onClick={() => selectMaterial(index)} className={selected === index ? 'is-selected' : ''} aria-current={selected === index ? 'true' : undefined}>
                <span className="chapter-lesson-number">{index + 1}</span><span>{item.title || `Học liệu ${index + 1}`}<small className="chapter-lesson-type">{materialTypeLabel[item.type] || item.type || 'Học liệu'}</small></span>
              </button>)}
            </nav>
            {!materials.length && <p className="text-body-sm text-[#64748B]">Chủ đề này chưa có học liệu được xuất bản.</p>}
          </aside>
          <section id="chapter-lesson-panel" className="chapter-panel" aria-label="Nội dung bài học">
            {error && <p role="alert" className="mb-4 text-primary">{error}</p>}
            {material ? <>
              <div className="chapter-panel-heading"><div><span>{materialTypeLabel[material.type] || material.type || 'HỌC LIỆU'}</span><h1 ref={panelTitle} tabIndex={-1}>{material.title || 'Học liệu không có tiêu đề'}</h1></div></div>
              {material.type === 'VIDEO' && material.fileUrl ? <div className="lesson-video"><div className="lesson-video__player"><video src={material.fileUrl} controls playsInline preload="metadata" aria-label={material.title || 'Video bài giảng'}>Trình duyệt không hỗ trợ phát video.</video></div></div> : null}
              {(material.type === 'MARKDOWN' || material.type === 'TEXT') && <article className="lesson-content"><section><h3>Nội dung bài học</h3><div className="whitespace-pre-wrap leading-7 text-[#334155]">{material.contentText || 'Giảng viên chưa cập nhật nội dung văn bản cho học liệu này.'}</div></section></article>}
              {material.type !== 'MARKDOWN' && material.type !== 'TEXT' && material.type !== 'VIDEO' && <Card className="p-6"><span className="material-symbols-outlined text-primary" aria-hidden="true">description</span><h2 className="mt-3 text-headline-sm font-bold">{materialTypeLabel[material.type] || 'Tệp học liệu'}</h2><p className="mt-2 text-body-md text-[#64748B]">Mở tệp học liệu do giảng viên cung cấp trong cửa sổ mới.</p>{material.fileUrl ? <a className="mt-4 inline-block" href={material.fileUrl} target="_blank" rel="noreferrer"><Button icon="open_in_new">Mở học liệu</Button></a> : <p className="mt-4 text-body-sm text-[#64748B]">Học liệu này chưa có tệp đính kèm.</p>}</Card>}
              {material.type === 'VIDEO' && !material.fileUrl && <Card className="p-6 text-[#64748B]">Video bài giảng chưa có tệp phát trực tuyến.</Card>}
              <div className="lesson-controls"><Button variant="secondary" icon="arrow_back" disabled={!previous} onClick={previous}>Học liệu trước</Button><Button icon="check" disabled={completed || saving} onClick={markComplete}>{saving ? 'Đang lưu…' : completed ? 'Đã hoàn thành chủ đề' : 'Đánh dấu hoàn thành'}</Button><Button variant="secondary" icon="arrow_forward" disabled={!next} onClick={next}>Học liệu tiếp</Button></div>
            </> : <div className="chapter-empty"><span className="material-symbols-outlined" aria-hidden="true">menu_book</span><h1>{chapterTitle}</h1><p>Chủ đề này chưa có học liệu để mở.</p></div>}
          </section>
        </main>
      )}
    </AppShell>
  );
}
