import React from 'react';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { useResource, Resource, itemsOf } from '../pages/lecturers/LecturerShared.jsx';

export function CurriculumView({ subjectId, onTopic }) {
  const chapters = useResource(subjectId ? `/api/v1/subjects/${subjectId}/chapters` : null);
  const topics = useResource(subjectId ? `/api/v1/subjects/${subjectId}/topics` : null);
  return (
    <Resource value={chapters}>
      {() => (
        <Resource value={topics}>
          {() => {
            const chapterRows = itemsOf(chapters.data).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            const topicRows = itemsOf(topics.data);
            const known = new Set(chapterRows.map((row) => row.chapterId));
            const groups = [...chapterRows, { chapterId: '', chapterName: 'Chưa phân chương' }];
            return (
              <div className="mt-4 grid gap-4">
                {groups.map((chapter) => {
                  const rows = topicRows
                    .filter((row) =>
                      chapter.chapterId ? row.chapterId === chapter.chapterId : !known.has(row.chapterId)
                    )
                    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                  if (!chapter.chapterId && !rows.length) return null;
                  return (
                    <Card key={chapter.chapterId} className="p-5">
                      <h3 className="font-semibold">{chapter.chapterName}</h3>
                      <ul className="mt-3 divide-y">
                        {rows.map((topic) => (
                          <li key={topic.topicId} className="flex items-center justify-between gap-3 py-3">
                            <span>{topic.topicName}</span>
                            {onTopic && (
                              <Button variant="secondary" onClick={() => onTopic(topic)}>
                                Mở
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                      {!rows.length && <p className="mt-3 text-slate-500">Chưa có chủ đề.</p>}
                    </Card>
                  );
                })}
                {!topicRows.length && !chapterRows.length && <Card className="p-5">Chưa có chương trình.</Card>}
              </div>
            );
          }}
        </Resource>
      )}
    </Resource>
  );
}
