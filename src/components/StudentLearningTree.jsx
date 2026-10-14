import React from 'react';
import { ProgressBar } from './ProgressBar.jsx';
import { progressKey, readMaterialProgress, reconcileMaterialProgress } from '../lib/materialProgress.js';

const ordered = (rows) => [...rows].sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));
const percent = (done, total) => (total ? Math.floor((done * 100) / total) : 0);
const iconOf = (type) => ({ VIDEO: 'play_circle', PDF: 'picture_as_pdf', SLIDE: 'slideshow' })[type] || 'description';

export function StudentLearningTree({
  classId,
  subjectId,
  chapters = [],
  topics = [],
  materials = [],
  progress = [],
  scope = 'SHARED',
  activeTopicId,
  activeMaterialId,
  currentCompleted,
  onOpenMaterial,
}) {
  const topicNodes = ordered(topics)
    .map((topic) => {
      const all = materials.filter((material) => String(material.topicId) === String(topic.topicId));
      const server = progress.find((row) => String(row.topicId) === String(topic.topicId));
      const completed =
        String(topic.topicId) === String(activeTopicId) && currentCompleted
          ? currentCompleted
          : reconcileMaterialProgress(all, readMaterialProgress(progressKey(classId, topic.topicId)), server || {})
              .completed;
      const completedIds = new Set(completed.map(String));
      const rows = ordered(all).filter((material) => !scope || (material.scope || 'SHARED') === scope);
      return {
        ...topic,
        materials: rows,
        completedIds,
        done: rows.filter((row) => completedIds.has(String(row.materialId))).length,
      };
    })
    .filter((topic) => scope !== 'CLASS' || topic.materials.length);
  const groups = ordered(chapters)
    .map((chapter) => ({
      ...chapter,
      topics: topicNodes.filter((topic) => String(topic.chapterId) === String(chapter.chapterId)),
    }))
    .filter((chapter) => chapter.topics.length);
  const chapterIds = new Set(chapters.map((chapter) => String(chapter.chapterId)));
  const ungrouped = topicNodes.filter((topic) => !chapterIds.has(String(topic.chapterId)));
  if (ungrouped.length)
    groups.push({
      chapterId: 'ungrouped',
      chapterName: chapters.length ? 'Chủ đề chưa phân chương' : 'Chương trình học',
      topics: ungrouped,
    });
  const total = topicNodes.reduce((sum, topic) => sum + topic.materials.length, 0);
  const done = topicNodes.reduce((sum, topic) => sum + topic.done, 0);
  return (
    <div className="student-learning-tree">
      <div className="student-learning-tree__progress">
        <div className="flex items-center justify-between gap-3 text-body-sm">
          <span className="font-semibold">
            {scope === 'CLASS' ? 'Học liệu giao riêng' : scope === 'SHARED' ? 'Chương trình chính' : 'Tiến độ học tập'}
          </span>
          <strong className="text-primary">{percent(done, total)}%</strong>
        </div>
        <ProgressBar value={percent(done, total)} className="mt-3" />
        <p className="mt-2 text-body-sm text-[#64748B]">
          {done}/{total} học liệu đã hoàn thành
        </p>
      </div>
      <nav aria-label="Cây chương trình học" className="student-learning-tree__nodes">
        {groups.map((chapter, chapterIndex) => {
          const chapterTotal = chapter.topics.reduce((sum, topic) => sum + topic.materials.length, 0);
          const chapterDone = chapter.topics.reduce((sum, topic) => sum + topic.done, 0);
          return (
            <details
              key={chapter.chapterId}
              open={
                chapterIndex === 0 || chapter.topics.some((topic) => String(topic.topicId) === String(activeTopicId))
              }
              className="student-learning-tree__chapter"
            >
              <summary>
                <span className="material-symbols-outlined student-learning-tree__chevron" aria-hidden="true">
                  chevron_right
                </span>
                <span className="material-symbols-outlined text-primary" aria-hidden="true">
                  folder_open
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold break-words">{chapter.chapterName}</span>
                  <span className="block mt-1 text-xs text-[#64748B]">
                    {chapter.topics.length} chủ đề · {percent(chapterDone, chapterTotal)}%
                  </span>
                </span>
              </summary>
              <div className="student-learning-tree__branch">
                {chapter.topics.map((topic, topicIndex) => (
                  <details
                    key={topic.topicId}
                    open={
                      String(topic.topicId) === String(activeTopicId) ||
                      (!activeTopicId && chapterIndex === 0 && topicIndex === 0)
                    }
                    className="student-learning-tree__topic"
                  >
                    <summary>
                      <span className="material-symbols-outlined student-learning-tree__chevron" aria-hidden="true">
                        chevron_right
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium break-words">{topic.topicName || 'Chủ đề'}</span>
                        <span className="block mt-1 text-xs text-[#64748B]">
                          {topic.done}/{topic.materials.length} học liệu · {percent(topic.done, topic.materials.length)}
                          %
                        </span>
                        <ProgressBar value={percent(topic.done, topic.materials.length)} compact className="mt-2" />
                      </span>
                    </summary>
                    <ul className="student-learning-tree__lessons">
                      {topic.materials.map((material) => {
                        const complete = topic.completedIds.has(String(material.materialId));
                        const active = String(material.materialId) === String(activeMaterialId);
                        const href = `learning_module.html?classId=${encodeURIComponent(classId || '')}&subjectId=${encodeURIComponent(subjectId || '')}&topicId=${encodeURIComponent(topic.topicId)}&materialId=${encodeURIComponent(material.materialId)}${scope ? `&scope=${scope}` : ''}`;
                        return (
                          <li key={material.materialId}>
                            <a
                              href={href}
                              className={`student-learning-tree__lesson ${active ? 'is-selected' : ''}`}
                              aria-current={active ? 'page' : undefined}
                              onClick={(event) => {
                                if (
                                  onOpenMaterial &&
                                  !event.ctrlKey &&
                                  !event.metaKey &&
                                  !event.shiftKey &&
                                  !event.altKey
                                ) {
                                  event.preventDefault();
                                  onOpenMaterial(material);
                                }
                              }}
                            >
                              <span
                                className={`material-symbols-outlined ${complete ? 'text-green-700' : 'text-primary'}`}
                                aria-hidden="true"
                              >
                                {complete ? 'check_circle' : iconOf(material.type)}
                              </span>
                              <span className="min-w-0 flex-1 break-words">
                                {material.title || 'Học liệu'}
                                <small className="block mt-1 text-xs text-[#64748B]">
                                  {complete ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                                </small>
                              </span>
                            </a>
                          </li>
                        );
                      })}
                      {!topic.materials.length && (
                        <li className="px-3 py-3 text-body-sm text-[#64748B]">Chưa có học liệu được công bố.</li>
                      )}
                    </ul>
                  </details>
                ))}
              </div>
            </details>
          );
        })}
        {!groups.length && (
          <p className="px-3 py-6 text-center text-body-sm text-[#64748B]">
            {scope === 'CLASS'
              ? 'Chưa có học liệu giảng viên giao riêng cho lớp.'
              : 'Chưa có chương trình học được công bố.'}
          </p>
        )}
      </nav>
    </div>
  );
}
