import React from 'react';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { ExperimentSubmissionList, ExperimentSubmissionGrader } from '../../components/ExperimentGrading.jsx';
import { useResource } from './LecturerShared.jsx';
import { navigate } from '../../lib/navigation.js';

export function ExperimentGradingPanel({ classes }) {
  return (
    <ExperimentSubmissionList
      classes={classes}
      onSelect={(row) =>
        navigate(
          `lecturer_lab_grading.html?submissionId=${encodeURIComponent(row.submissionId)}&classId=${encodeURIComponent(row.classId || '')}`
        )
      }
    />
  );
}

export function LecturerExperimentGradingPage() {
  const params = new URLSearchParams(window.location.search);
  const submissionId = params.get('submissionId') || params.get('submission');
  const classes = useResource(!submissionId ? '/api/v1/classes' : null, true);
  return (
    <LecturerPageShell currentPage="lecturer_labs.html" title="Chấm bài thí nghiệm" eyebrow="CHẤM BÁO CÁO">
      {submissionId ? (
        <ExperimentSubmissionGrader
          key={submissionId}
          submissionId={submissionId}
          canConfirm
          onBack={() =>
            navigate(
              `lecturer_lab_grading.html${params.get('classId') ? '?classId=' + encodeURIComponent(params.get('classId')) : ''}`
            )
          }
        />
      ) : (
        <ExperimentGradingPanel classes={classes} />
      )}
    </LecturerPageShell>
  );
}
