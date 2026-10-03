import React, { useRef, useState } from 'react';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { Form, SubmitButton } from './Form.jsx';
import { FormField } from './FormField.jsx';
import { SelectField } from './SelectField.jsx';
import { DataTable } from './DataTable.jsx';
import { ConfirmDialog } from './ConfirmDialog.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { AuthAlert } from './AuthLayout.jsx';
import { useApiData, listItems } from '../hooks/useApiData.js';
import { api } from '../lib/apiClient.js';
import { SubmissionEvidence } from './SubmissionEvidence.jsx';

const dateText = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');
const statusLabels = { PENDING: 'Chờ chấm', GRADED: 'Đã chấm', CONFIRMED: 'Đã chốt' };

export function ExperimentSubmissionList({ classes, classId: selectedClass, onSelect, requireClass = false }) {
  const [localClassId, setClassId] = useState(() => new URLSearchParams(window.location.search).get('classId') || '');
  const classId = selectedClass ?? localClassId;
  const [status, setStatus] = useState('');
  const [experimentId, setExperimentId] = useState('');
  const experiments = useApiData('/api/v1/experiments');
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (experimentId) query.set('experimentId', experimentId);
  if (!classId) query.set('myClassesOnly', 'true');
  const path = classId
    ? `/api/v1/classes/${encodeURIComponent(classId)}/experiment-submissions`
    : '/api/v1/experiments/submissions';
  const submissions = useApiData(requireClass && !classId ? null : `${path}?${query}`);
  const rows = listItems(submissions.data);
  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-end gap-3">
        {selectedClass === undefined && (
          <SelectField
            label="Lớp"
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            disabled={classes?.loading}
          >
            <option value="">Tất cả lớp phụ trách</option>
            {listItems(classes?.data).map((row) => (
              <option key={row.classId} value={row.classId}>
                {row.classCode || row.className || row.subjectName}
              </option>
            ))}
          </SelectField>
        )}
        <SelectField
          label="Thí nghiệm"
          value={experimentId}
          onChange={(event) => setExperimentId(event.target.value)}
          disabled={experiments.loading}
        >
          <option value="">Tất cả thí nghiệm</option>
          {listItems(experiments.data).map((row) => (
            <option key={row.experimentId} value={row.experimentId}>
              {row.title || row.experimentTitle}
            </option>
          ))}
        </SelectField>
        <SelectField label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <Button
          variant="secondary"
          icon="refresh"
          onClick={() => {
            submissions.reload();
            experiments.reload();
            classes?.reload?.();
          }}
        >
          Tải lại
        </Button>
      </div>
      <AuthAlert error>{classes?.error || experiments.error || submissions.error}</AuthAlert>
      {requireClass && !classId ? (
        <p className="text-slate-500">Chọn lớp để xem bài nộp.</p>
      ) : submissions.loading ? (
        <p role="status">Đang tải bài nộp…</p>
      ) : submissions.error ? null : !rows.length ? (
        <p className="text-slate-500">Chưa có bài nộp phù hợp.</p>
      ) : (
        <DataTable
          columns={['Sinh viên', 'Thí nghiệm', 'Lớp', 'Ngày nộp', 'Trạng thái', 'Điểm', '']}
          rows={rows}
          renderRow={(row) => (
            <tr key={row.submissionId}>
              <td className="p-3">
                <span className="block font-medium">{row.studentFullName || row.studentUsername || 'Sinh viên'}</span>
                <span className="text-body-sm text-slate-500">{row.studentCode || '—'}</span>
              </td>
              <td className="p-3">{row.experimentTitle || 'Thí nghiệm'}</td>
              <td className="p-3">{row.classCode || '—'}</td>
              <td className="p-3 whitespace-nowrap">{dateText(row.submittedAt)}</td>
              <td className="p-3">
                <StatusBadge
                  tone={row.status === 'CONFIRMED' ? 'success' : row.status === 'GRADED' ? 'primary' : 'warning'}
                >
                  {statusLabels[row.status] || row.status || '—'}
                </StatusBadge>
              </td>
              <td className="p-3">
                {row.totalScore ?? '—'} / {row.totalMaxScore ?? '—'}
              </td>
              <td className="p-3">
                <Button
                  variant="secondary"
                  icon={row.status === 'CONFIRMED' ? 'visibility' : 'grading'}
                  onClick={() => onSelect(row)}
                >
                  {row.status === 'CONFIRMED' ? 'Xem kết quả' : 'Chấm bài'}
                </Button>
              </td>
            </tr>
          )}
        />
      )}
    </Card>
  );
}
export function ExperimentSubmissionGrader({ submissionId, canConfirm = false, onBack }) {
  const detail = useApiData(
    submissionId ? `/api/v1/experiments/submissions/${encodeURIComponent(submissionId)}` : null
  );
  const summary = useApiData(
    submissionId ? `/api/v1/experiments/submissions/${encodeURIComponent(submissionId)}/rubric-summary` : null
  );
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState('');
  const [dirty, setDirty] = useState(new Set());
  const lock = useRef(false);
  const data = summary.data;
  const rubrics = data?.rubrics || [];
  const confirmed = data?.status === 'CONFIRMED' || detail.data?.isConfirmed || detail.data?.status === 'CONFIRMED';
  const complete = dirty.size === 0 && rubrics.length > 0 && rubrics.every((row) => row.isGraded && row.score != null);
  const grade = async (event, rubric) => {
    event.preventDefault();
    if (lock.current || confirmed) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const score = Number(values.score);
    if (values.score.trim() === '' || !Number.isFinite(score) || score < 0 || score > Number(rubric.maxScore)) {
      setError(`Điểm phải từ 0 đến ${rubric.maxScore}.`);
      return;
    }
    lock.current = true;
    setSaving(rubric.rubricId);
    setError('');
    setNotice('');
    try {
      await api.experiments.gradeSubmission(submissionId, {
        rubricId: rubric.rubricId,
        score,
        comment: values.comment.trim(),
      });
      // Update only the saved criterion; other forms retain their unsaved edits.
      summary.updateData((current) => {
        const updated = current.rubrics.map((row) =>
          row.rubricId === rubric.rubricId ? { ...row, score, comment: values.comment.trim(), isGraded: true } : row
        );
        return {
          ...current,
          status: 'GRADED',
          rubrics: updated,
          totalScore: updated.reduce((sum, row) => sum + Number(row.score || 0), 0),
        };
      });
      setDirty((current) => {
        const next = new Set(current);
        next.delete(rubric.rubricId);
        return next;
      });
      setNotice(`Đã lưu điểm: ${rubric.criteriaName}.`);
    } catch (err) {
      setError(err.message || 'Không thể lưu điểm.');
    } finally {
      lock.current = false;
      setSaving('');
    }
  };
  const confirm = async () => {
    if (!canConfirm || lock.current || !complete || confirmed) return;
    lock.current = true;
    setSaving('confirm');
    setError('');
    try {
      await api.experiments.confirmSubmission(submissionId, { note: note.trim() });
      summary.updateData((current) => ({ ...current, status: 'CONFIRMED' }));
      setConfirming(false);
      setNotice('Đã xác nhận kết quả thí nghiệm.');
    } catch (err) {
      setError(err.message || 'Không thể xác nhận kết quả.');
    } finally {
      lock.current = false;
      setSaving('');
    }
  };
  return (
    <div className="space-y-5">
      <Button variant="secondary" icon="arrow_back" onClick={onBack} disabled={Boolean(saving)}>
        Danh sách bài nộp
      </Button>
      <AuthAlert error>{error}</AuthAlert>
      <AuthAlert>{notice}</AuthAlert>
      {summary.loading || detail.loading ? (
        <Card className="p-6" role="status">
          Đang tải bài nộp và rubric…
        </Card>
      ) : summary.error || detail.error ? (
        <Card className="p-6">
          <p role="alert" className="text-primary">
            {summary.error || detail.error}
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              summary.reload();
              detail.reload();
            }}
          >
            Thử lại
          </Button>
        </Card>
      ) : (
        data && (
          <div className="space-y-5">
            <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h2 className="text-title-md font-medium">{data.experimentTitle}</h2>
                <p className="mt-2 text-body-sm">
                  {detail.data?.studentFullName || detail.data?.studentUsername || 'Sinh viên'} ·{' '}
                  {detail.data?.studentCode || '—'} · {detail.data?.classCode || '—'}
                </p>
                <p className="mt-1 text-body-sm text-slate-500">Nộp lúc {dateText(detail.data?.submittedAt)}</p>
                <p className="mt-2 text-body-sm text-slate-500">
                  Điểm đã lưu: {data.totalScore ?? 0} / {data.totalMaxScore ?? '—'} ·{' '}
                  {rubrics.filter((row) => row.isGraded).length}/{rubrics.length} tiêu chí
                </p>
              </div>
              <StatusBadge tone={confirmed ? 'success' : 'warning'}>
                {confirmed ? 'Đã xác nhận' : 'Chưa chốt điểm'}
              </StatusBadge>
            </Card>
            {detail.data && <SubmissionEvidence key={submissionId} submission={detail.data} />}
            {!rubrics.length ? (
              <Card className="p-6 text-slate-500">
                Bài thí nghiệm chưa có tiêu chí rubric. Chưa thể chấm hoặc xác nhận.
              </Card>
            ) : (
              rubrics.map((row) => (
                <Card key={row.rubricId} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-title-md font-medium">{row.criteriaName}</h2>
                    <span className="text-body-sm text-slate-500">Tối đa {row.maxScore} điểm</span>
                  </div>
                  {row.description && <p className="mt-2 text-body-sm text-slate-500">{row.description}</p>}
                  <Form
                    onSubmit={(event) => grade(event, row)}
                    onChange={() => setDirty((current) => new Set(current).add(row.rubricId))}
                    className="mt-4 grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-end"
                  >
                    <FormField
                      label="Điểm"
                      name="score"
                      type="number"
                      min="0"
                      max={row.maxScore}
                      step="any"
                      required
                      defaultValue={row.score ?? ''}
                      disabled={confirmed || Boolean(saving)}
                    />
                    <FormField
                      label="Nhận xét"
                      name="comment"
                      defaultValue={row.comment || row.feedback || ''}
                      disabled={confirmed || Boolean(saving)}
                    />
                    {!confirmed && (
                      <SubmitButton disabled={Boolean(saving)}>
                        {saving === row.rubricId ? 'Đang lưu…' : 'Lưu tiêu chí'}
                      </SubmitButton>
                    )}
                  </Form>
                </Card>
              ))
            )}
            {canConfirm && !confirmed && (
              <Card className="p-5">
                <FormField
                  label="Nhận xét chung khi chốt điểm"
                  multiline
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={Boolean(saving)}
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-body-sm text-slate-500">
                    Lưu đủ các tiêu chí trước khi chốt điểm. Kết quả đã xác nhận không thể sửa.
                  </p>
                  <Button disabled={!complete || Boolean(saving)} onClick={() => setConfirming(true)} icon="verified">
                    Xác nhận kết quả
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )
      )}
      {canConfirm && confirming && (
        <ConfirmDialog
          title="Chốt điểm thí nghiệm"
          description="Xác nhận điểm đã lưu? Sau khi chốt, bạn không thể sửa điểm của bài nộp này."
          confirmLabel="Chốt điểm"
          busy={Boolean(saving)}
          onCancel={() => setConfirming(false)}
          onConfirm={confirm}
        />
      )}
    </div>
  );
}
