import React, { useEffect, useRef, useState } from 'react';
import { StudentLearningTree } from './StudentLearningTree.jsx';
import { LessonContent } from './LessonContent.jsx';
import { GuardedVideoPlayer } from './GuardedVideoPlayer.jsx';
import { Button } from './Button.jsx';
import { Card } from './Card.jsx';
import { useMaterialProgress } from '../hooks/useMaterialProgress.js';
import { progressPercent } from '../lib/materialProgress.js';

export function StudentLearningWorkspace({
  classId,
  subjectId,
  chapters = [],
  topics = [],
  materials = [],
  progress = [],
  scope = 'SHARED',
  initialMaterialId = '',
  initialTopicId = '',
  autoStart = false,
  embedded = false,
  onProgressChange,
}) {
  const [lesson, setLesson] = useState(null);
  const learning = useMaterialProgress();
  const initializedTopic = useRef(null);
  const panelTitle = useRef(null);
  const orderedTopics = [...topics].sort((a, b) => {
    const chapterOrder = (id) => chapters.find((chapter) => String(chapter.chapterId) === String(id))?.orderIndex || 0;
    return (
      chapterOrder(a.chapterId) - chapterOrder(b.chapterId) || Number(a.orderIndex || 0) - Number(b.orderIndex || 0)
    );
  });
  const visibleMaterials = [...materials]
    .filter((material) => !scope || (material.scope || 'SHARED') === scope)
    .sort(
      (a, b) =>
        orderedTopics.findIndex((topic) => String(topic.topicId) === String(a.topicId)) -
          orderedTopics.findIndex((topic) => String(topic.topicId) === String(b.topicId)) ||
        Number(a.orderIndex || 0) - Number(b.orderIndex || 0)
    );
  const selectMaterial = (material) => {
    if (!material) {
      setLesson(null);
    } else {
      if (initializedTopic.current !== String(material.topicId)) {
        const topicMaterials = materials.filter((row) => String(row.topicId) === String(material.topicId));
        learning.initialize(
          topicMaterials,
          progress.find((row) => String(row.topicId) === String(material.topicId)) || {},
          classId,
          material.topicId
        );
        initializedTopic.current = String(material.topicId);
      }
      setLesson(material);
    }
    const url = new URL(window.location.href);
    if (material) {
      url.searchParams.set('topicId', material.topicId);
      url.searchParams.set('materialId', material.materialId);
      if (scope) url.searchParams.set('scope', scope);
    } else {
      url.searchParams.delete('materialId');
    }
    url.searchParams.delete('lesson');
    window.history.replaceState(window.history.state, '', url);
  };
  useEffect(() => {
    const initial = visibleMaterials.find((material) => String(material.materialId) === String(initialMaterialId));
    const first = visibleMaterials.find(
      (material) => !initialTopicId || String(material.topicId) === String(initialTopicId)
    );
    selectMaterial(initial || (autoStart ? first : null));
  }, [classId, materials, scope, initialMaterialId, initialTopicId, autoStart]);
  useEffect(() => {
    if (lesson) {
      panelTitle.current?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 900px)').matches)
        panelTitle.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [lesson?.materialId]);
  useEffect(() => {
    if (initializedTopic.current && onProgressChange) {
      const topicMaterials = materials.filter((material) => String(material.topicId) === initializedTopic.current);
      onProgressChange(initializedTopic.current, progressPercent(learning.completed, topicMaterials.length));
    }
  }, [learning.completed, materials, onProgressChange]);
  const index = visibleMaterials.findIndex((material) => material.materialId === lesson?.materialId);
  const previous = index > 0 ? () => selectMaterial(visibleMaterials[index - 1]) : undefined;
  const next =
    index >= 0 && index < visibleMaterials.length - 1 ? () => selectMaterial(visibleMaterials[index + 1]) : undefined;
  const completed = lesson && learning.completed.includes(String(lesson.materialId));
  const topic = topics.find((row) => String(row.topicId) === String(lesson?.topicId));
  return (
    <div
      className={`chapter-learning chapter-learning--tree ${embedded ? 'student-learning-workspace--embedded' : ''}`}
      role="region"
      aria-label="Không gian học tập"
    >
      <aside className="chapter-outline">
        <StudentLearningTree
          classId={classId}
          subjectId={subjectId}
          chapters={chapters}
          topics={topics}
          materials={materials}
          progress={progress}
          scope={scope}
          activeTopicId={lesson?.topicId || initialTopicId}
          activeMaterialId={lesson?.materialId}
          currentCompleted={
            initializedTopic.current === String(lesson?.topicId || initialTopicId) ? learning.completed : undefined
          }
          onOpenMaterial={selectMaterial}
        />
      </aside>
      <section id="chapter-lesson-panel" className="chapter-panel" aria-label="Nội dung học liệu">
        {learning.error && (
          <Card className="mb-5 p-4 text-primary" role="alert">
            {learning.error}
            <Button variant="secondary" onClick={learning.retry}>
              Đồng bộ lại
            </Button>
          </Card>
        )}
        {lesson ? (
          <div key={lesson.materialId} className="chapter-active-lesson space-y-5">
            <div className="chapter-panel-heading">
              <div>
                <span>
                  {topic?.topicName || 'Học liệu'} · {index + 1}/{visibleMaterials.length}
                </span>
                <h1 ref={panelTitle} tabIndex={-1}>
                  {lesson.title || 'Học liệu'}
                </h1>
              </div>
              <button
                className="chapter-close"
                type="button"
                onClick={() => selectMaterial(null)}
                aria-label="Đóng học liệu"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
            {lesson.type === 'VIDEO' && (
              <GuardedVideoPlayer
                key={lesson.materialId}
                material={lesson}
                completed={completed}
                watchedSeconds={learning.watched[String(lesson.materialId)]?.seconds || 0}
                onProgress={(record) => learning.watch(lesson.materialId, record)}
              />
            )}
            <LessonContent
              key={lesson.materialId}
              material={lesson}
              completed={completed}
              saving={learning.saving}
              completionBlocked={lesson.type === 'VIDEO' && !completed}
              onPrevious={previous}
              onNext={next}
              onComplete={() => learning.markComplete(lesson.materialId)}
            />
          </div>
        ) : (
          <div className="chapter-empty">
            <span className="material-symbols-outlined" aria-hidden="true">
              menu_book
            </span>
            <h1>{scope === 'CLASS' ? 'Học liệu giảng viên giao riêng' : 'Chương trình chính'}</h1>
            <p>
              {visibleMaterials.length
                ? 'Chọn học liệu trong cây chương trình để bắt đầu học.'
                : 'Chưa có học liệu được công bố.'}
            </p>
            {visibleMaterials.length > 0 && (
              <Button
                icon="play_arrow"
                onClick={() =>
                  selectMaterial(
                    visibleMaterials.find((material) => String(material.topicId) === String(initialTopicId)) ||
                      visibleMaterials[0]
                  )
                }
              >
                Bắt đầu học
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
