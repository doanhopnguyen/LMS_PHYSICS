import React, { useEffect, useState } from 'react';
import { Button } from './Button.jsx';
import { Card } from './Card.jsx';
import { DataTable } from './DataTable.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import { SelectField } from './SelectField.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { SubmissionEvidence } from './SubmissionEvidence.jsx';
import { FormDialog } from './FormDialog.jsx';
import { api } from '../lib/apiClient.js';
import { loadStudentExperimentHistory, submissionGrade } from '../lib/studentExperimentHistory.js';

const dateText = (value) =>
  value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('vi-VN') : '—';

export function StudentExperimentHistory({ assignmentId, refreshKey = 0, recentSubmission }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadStudentExperimentHistory(api, { assignmentId, recentSubmission })
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không thể tải lịch sử bài nộp.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey, version, recentSubmission, assignmentId]);
  useEffect(() => {
    setSelectedId('');
    setFilter('');
  }, [assignmentId]);
  const scoped = rows.filter((row) => !assignmentId || String(row.assignmentId) === String(assignmentId));
  const visible = scoped.filter((row) => !filter || String(row.assignmentId || row.experimentId) === filter);
  const options = [...new Map(scoped.map((row) => [String(row.assignmentId || row.experimentId), row])).entries()];
  const selected = visible.find((row) => row.submissionId === selectedId);
  const grade = selected && submissionGrade(selected, selected.summary);
  return (
    <section className="mt-6 min-w-0 space-y-4" aria-label="Lịch sử báo cáo và điểm">
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionHeader icon="history" title="Lịch sử báo cáo & điểm" />
            <p className="mt-2 text-body-sm text-slate-500">
              Xem bài đã nộp, điểm từng tiêu chí và nhận xét của giảng viên.
            </p>
          </div>
          <Button
            variant="secondary"
            icon="refresh"
            disabled={loading}
            onClick={() => setVersion((value) => value + 1)}
          >
            Tải lại lịch sử
          </Button>
        </div>
        {!assignmentId && options.length > 1 && (
          <SelectField
            label="Bài thí nghiệm"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setSelectedId('');
            }}
          >
            <option value="">Tất cả bài thí nghiệm</option>
            {options.map(([id, row]) => (
              <option key={id} value={id}>
                {row.experimentTitle || row.summary?.experimentTitle || 'Bài thí nghiệm'}
                {row.classCode ? ` · ${row.classCode}` : ''}
              </option>
            ))}
          </SelectField>
        )}
        {loading ? (
          <p role="status" className="py-4 text-slate-500">
            Đang tải lịch sử bài nộp…
          </p>
        ) : error ? (
          <p role="alert" className="py-4 text-primary">
            {error}
          </p>
        ) : !visible.length ? (
          <p className="py-6 text-center text-slate-500">Chưa có báo cáo nào được ghi nhận.</p>
        ) : (
          <DataTable
            columns={['Báo cáo', 'Thời gian nộp', 'Điểm', 'Trạng thái', 'Chi tiết']}
            rows={visible}
            renderRow={(row) => {
              const result = submissionGrade(row, row.summary);
              return (
                <tr key={row.submissionId} className="border-t border-slate-200">
                  <td className="p-3">
                    <strong>{row.experimentTitle || row.summary?.experimentTitle || 'Báo cáo thí nghiệm'}</strong>
                    <span className="mt-1 block text-slate-500">{row.classCode || '—'}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap">{dateText(row.submittedAt)}</td>
                  <td className="p-3 whitespace-nowrap">
                    {row.scoreError
                      ? 'Chưa tải được điểm'
                      : result.score === null
                        ? '—'
                        : `${result.score} / ${result.maxScore ?? '—'}`}
                  </td>
                  <td className="p-3">
                    <StatusBadge tone={row.scoreError ? 'neutral' : result.tone}>
                      {row.scoreError ? 'Điểm chưa khả dụng' : result.label}
                    </StatusBadge>
                  </td>
                  <td className="p-3">
                    <Button
                      variant="secondary"
                      icon="visibility"
                      aria-haspopup="dialog"
                      aria-expanded={selectedId === row.submissionId}
                      onClick={() => setSelectedId(row.submissionId)}
                    >
                      Xem báo cáo & điểm
                    </Button>
                  </td>
                </tr>
              );
            }}
          />
        )}
      </Card>
      {!loading && !error && selected && (
        <FormDialog title="Chi tiết báo cáo thí nghiệm" wide onClose={() => setSelectedId('')}>
          <div className="min-w-0 space-y-4">
            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="min-w-0 break-words text-title-md font-semibold">
                  {selected.experimentTitle || selected.summary?.experimentTitle || 'Báo cáo thí nghiệm'}
                </h3>
                <Button variant="secondary" onClick={() => setSelectedId('')}>
                  Đóng chi tiết
                </Button>
              </div>
              <p className="text-body-sm text-slate-500">
                {selected.classCode || 'Bài thí nghiệm'} · Nộp lúc {dateText(selected.submittedAt)}
              </p>
              {selected.detailError && (
                <p role="alert" className="text-primary">
                  {selected.detailError}
                </p>
              )}
              {selected.scoreError ? (
                <p role="alert" className="text-primary">
                  {selected.scoreError}
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge tone={grade.tone}>{grade.label}</StatusBadge>
                    <strong>
                      {grade.score === null ? 'Chưa có điểm' : `${grade.score} / ${grade.maxScore ?? '—'} điểm`}
                    </strong>
                  </div>
                  {grade.total > 0 && (
                    <p className="text-body-sm text-slate-500">
                      Đã chấm {grade.graded}/{grade.total} tiêu chí.
                    </p>
                  )}
                  <div className="space-y-3">
                    {(selected.summary?.rubrics || []).map((rubric) => (
                      <div key={rubric.rubricId} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-wrap justify-between gap-2">
                          <h4 className="font-semibold">{rubric.criteriaName}</h4>
                          <span className="text-body-sm">
                            {rubric.isGraded && rubric.score != null
                              ? `${rubric.score} / ${rubric.maxScore ?? '—'} điểm`
                              : 'Chưa chấm'}
                          </span>
                        </div>
                        {rubric.description && <p className="mt-2 text-body-sm text-slate-500">{rubric.description}</p>}
                        {(rubric.comment || rubric.feedback) && (
                          <p className="mt-3 whitespace-pre-wrap break-words text-body-sm">
                            <span className="font-medium">Nhận xét: </span>
                            {rubric.comment || rubric.feedback}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {(selected.confirmNote || selected.confirmationNote || selected.summary?.confirmationNote) && (
                    <p className="whitespace-pre-wrap break-words text-body-sm">
                      <strong>Nhận xét chung: </strong>
                      {selected.confirmNote || selected.confirmationNote || selected.summary.confirmationNote}
                    </p>
                  )}
                </>
              )}
              {(selected.detailError || selected.scoreError) && (
                <Button variant="secondary" icon="refresh" onClick={() => setVersion((value) => value + 1)}>
                  Thử lại
                </Button>
              )}
            </Card>
            {!selected.detailError && <SubmissionEvidence key={selected.submissionId} submission={selected} />}
          </div>
        </FormDialog>
      )}
    </section>
  );
}
