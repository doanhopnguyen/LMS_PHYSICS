import React, { useState } from 'react';
import { LecturerPageShell, Tabs, useQueryState, itemsOf } from './LecturerShared.jsx';
import { useTeachingScope, TeachingSubjectCards } from './LecturerTeachingScope.jsx';
import { LecturerAuthoringApiPage } from './LecturerContent.jsx';

export function LecturerQuestionWorkspace() {
  const scope = useTeachingScope();
  const [subjectId, setSubjectId] = useQueryState('subjectId');
  const [tabQuery, setTab] = useQueryState('tab');
  const tab = tabQuery === 'contributions' ? 'contributions' : 'bank';
  const [actionsTarget, setActionsTarget] = useState(null);
  const selected = itemsOf(scope.subjects.data).find((row) => row.subjectId === subjectId);
  return (
    <LecturerPageShell
      currentPage="lecturer_question_bank.html"
      title={selected ? `Ngân hàng câu hỏi · ${selected.subjectName}` : 'Ngân hàng câu hỏi'}
    >
      <Tabs
        items={[
          { id: 'bank', label: 'Ngân hàng môn học' },
          { id: 'contributions', label: 'Đóng góp' },
        ]}
        activeId={tab}
        onChange={setTab}
        actions={
          selected && tab === 'contributions' ? (
            <div ref={setActionsTarget} className="flex flex-wrap items-center gap-2" />
          ) : undefined
        }
      >
        {() =>
          selected ? (
            <LecturerAuthoringApiPage
              key={`${subjectId}:${tab}`}
              kind="questions"
              embedded
              scopedSubjectId={subjectId}
              questionMode={tab === 'bank' ? 'bank' : 'contributions'}
              actionsTarget={actionsTarget}
            />
          ) : (
            <TeachingSubjectCards resource={scope.subjects} classes={scope.classes.data} onSelect={setSubjectId} />
          )
        }
      </Tabs>
    </LecturerPageShell>
  );
}
