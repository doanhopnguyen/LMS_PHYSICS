import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { LessonContent } from '../../components/LessonContent.jsx';
import { Button } from '../../components/Button.jsx';
import { modules } from '../../data/lmsData.js';
import { learningLessons } from '../../data/learningLessons.js';

export function LearningModulePage({ openInitialLesson = false }) {
  const params = new URLSearchParams(window.location.search);
  const chapter = modules.find((item) => item.number === (params.get('module') || '02'));
  const lessons = chapter ? learningLessons[chapter.number] : [];
  const initial = lessons.findIndex((lesson) => lesson.id === params.get('lesson'));
  const [selected, setSelected] = useState(initial >= 0 ? initial : openInitialLesson && lessons.length ? 0 : null);
  const [completed, setCompleted] = useState([]);
  const panelTitle = useRef(null);
  const lesson = selected === null ? null : lessons[selected];

  useEffect(() => {
    if (lesson) panelTitle.current?.focus({ preventScroll: true });
  }, [lesson?.id]);

  const openLesson = (index) => {
    setSelected(index);
    const url = new URL(window.location.href);
    if (index === null) url.searchParams.delete('lesson');
    else url.searchParams.set('lesson', lessons[index].id);
    window.history.replaceState(window.history.state, '', url);
  };
  const previous = selected > 0 ? () => openLesson(selected - 1) : undefined;
  const next = selected !== null && selected < lessons.length - 1 ? () => openLesson(selected + 1) : undefined;

  return (
    <AppShell
      currentPage="learning_module.html"
      title={chapter ? `${chapter.title} · PTIT Physics 1` : 'Không tìm thấy chương'}
      footer={false}
      toolbar={
        <DetailToolbar
          title={chapter ? `Chương ${chapter.number}: ${chapter.title}` : 'Không tìm thấy chương'}
          subtitle={
            lesson ? `Bài ${selected + 1}/${lessons.length} · ${lesson.title}` : 'Chọn bài học trong mục lục để bắt đầu'
          }
          backHref="course_detail.html"
          backLabel="Về học phần"
          actions={
            chapter && (
              <>
                <span className="detail-toolbar-status">
                  {completed.length}/{lessons.length} đã học
                </span>
                <Button variant="secondary" disabled={!previous} onClick={previous} icon="chevron_left">
                  Bài trước
                </Button>
                <Button variant="secondary" disabled={!next} onClick={next} icon="chevron_right">
                  Bài tiếp
                </Button>
              </>
            )
          }
        />
      }
    >
      {!chapter ? (
        <div className="chapter-empty">
          <h1>Chương không tồn tại</h1>
          <a href="course_detail.html">Quay lại chọn chương</a>
        </div>
      ) : (
        <main className="chapter-learning">
          <aside className="chapter-outline">
            <h2>Mục lục bài học</h2>
            <p>
              {lessons.length} bài · Chương {chapter.number}
            </p>
            <nav aria-label={`Bài học chương ${chapter.number}`}>
              {lessons.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openLesson(index)}
                  className={selected === index ? 'is-selected' : ''}
                  aria-current={selected === index ? 'true' : undefined}
                  aria-expanded={selected === index}
                  aria-controls="chapter-lesson-panel"
                >
                  <span className="chapter-lesson-number">{completed.includes(item.id) ? '✓' : index + 1}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </nav>
          </aside>
          <section id="chapter-lesson-panel" className="chapter-panel" aria-label="Nội dung bài học">
            {lesson ? (
              <>
                <div className="chapter-panel-heading">
                  <div>
                    <span>
                      BÀI {selected + 1} / {lessons.length}
                    </span>
                    <h1 ref={panelTitle} tabIndex={-1}>
                      {lesson.title}
                    </h1>
                  </div>
                  <button
                    className="chapter-close"
                    type="button"
                    onClick={() => openLesson(null)}
                    aria-label="Đóng bài học"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <LessonContent
                  key={lesson.id}
                  lesson={lesson}
                  completed={completed.includes(lesson.id)}
                  onPrevious={previous}
                  onNext={next}
                  onComplete={() =>
                    setCompleted((items) => (items.includes(lesson.id) ? items : [...items, lesson.id]))
                  }
                />
              </>
            ) : (
              <div className="chapter-empty">
                <span className="material-symbols-outlined" aria-hidden="true">
                  menu_book
                </span>
                <h1>{chapter.title}</h1>
                <p>Chọn một bài trong mục lục bên trái để mở nội dung tại đây.</p>
                <Button icon="play_arrow" onClick={() => openLesson(0)}>
                  Bắt đầu bài đầu tiên
                </Button>
              </div>
            )}
          </section>
        </main>
      )}
    </AppShell>
  );
}
