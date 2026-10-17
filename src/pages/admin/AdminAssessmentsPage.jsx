import React, { useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { LecturerAssessmentApiPage, MatrixManager } from '../lecturers/LecturerApiWorkspace.jsx';

export function AdminAssessmentsPage() {
  const [tab, setTab] = useState('exams');
  const [tabActionTarget, setTabActionTarget] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const parameters = new URLSearchParams(window.location.search);
  const managementPage = parameters.get('view') === 'page' && Boolean(parameters.get('examId'));
  return (
    <AdminPageShell
      currentPage="admin_assessments.html"
      title={managementPage ? examTitle || 'Đề thi' : 'Đề thi & ma trận'}
      description={managementPage ? undefined : 'Tạo đề thi cuối kỳ và thiết lập ma trận đề thi.'}
    >
      {managementPage ? (
        <LecturerAssessmentApiPage embedded adminFinal onExamTitleChange={setExamTitle} />
      ) : (
        <Tabs
          items={[
            { id: 'exams', label: 'Đề thi cuối kỳ' },
            { id: 'matrices', label: 'Ma trận đề' },
          ]}
          activeId={tab}
          onChange={setTab}
          actions={<div ref={setTabActionTarget} className="flex flex-wrap items-center justify-end gap-2" />}
        >
          {() =>
            tab === 'exams' ? (
              <LecturerAssessmentApiPage embedded adminFinal tabActionTarget={tabActionTarget} />
            ) : (
              <MatrixManager plainToolbar tabActionTarget={tabActionTarget} />
            )
          }
        </Tabs>
      )}
    </AdminPageShell>
  );
}
