import React, { useRef, useState } from 'react';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormField } from '../../components/FormField.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { useApiData, listItems } from '../../hooks/useApiData.js';
import { useResource } from './LecturerShared.jsx';
import { api } from '../../lib/apiClient.js';
import { safeUrl } from '../../lib/lecturerUtils.js';
import { navigate } from '../../lib/navigation.js';

export function submissionFromLink(value) {
  const url = new URL(value, 'http://local');
  const id = url.searchParams.get('submissionId') || url.searchParams.get('submission');
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    throw new Error('Liên kết cần chứa submissionId hợp lệ của bài nộp.');
  return id;
}

export function ExperimentGradingPanel({ classes }) {
  const [classId, setClassId] = useState(() => new URLSearchParams(window.location.search).get('classId') || '');
  const [error, setError] = useState('');
  const evidence = useApiData(classId ? `/api/v1/classes/${encodeURIComponent(classId)}/evidence` : null);
  const students = useResource(classId ? `/api/v1/classes/${encodeURIComponent(classId)}/students` : null, true);
  const rows = listItems(evidence.data).filter((row) => row.sourceType === 'EXPERIMENT' && row.sourceId);
  const openLink = (event) => {
    event.preventDefault();
    try {
      const id = submissionFromLink(new FormData(event.currentTarget).get('link'));
      navigate(
        `lecturer_lab_grading.html?submissionId=${encodeURIComponent(id)}${classId ? `&classId=${encodeURIComponent(classId)}` : ''}`
      );
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="mt-5 space-y-5">
      <AuthAlert error>{error}</AuthAlert>
      <Card className="p-5">
        <h2 className="text-title-md font-medium">Chấm bài thí nghiệm</h2>
        <Form onSubmit={openLink} className="mt-4 flex flex-wrap items-end gap-3">
          <FormField
            label="Liên kết bài nộp"
            name="link"
            required
            placeholder="Liên kết chứa submissionId của bài nộp…"
            wrapperClassName="min-w-0 flex-1 basis-72"
          />
          <SubmitButton icon="grading">Mở bài để chấm</SubmitButton>
        </Form>
      </Card>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-md font-medium">Kết quả trong kho minh chứng</h2>
          <SelectField label="Lớp" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Chọn lớp học</option>
            {listItems(classes.data).map((row) => (
              <option key={row.classId} value={row.classId}>
                {row.classCode || row.className || row.subjectName}
              </option>
            ))}
          </SelectField>
        </div>
        <p className="my-4 text-body-sm text-slate-500">
          Kho minh chứng chỉ ghi nhận bài đã xác nhận. API hiện chưa cung cấp danh sách bài chờ chấm.
        </p>
        {classes.error || evidence.error || students.error ? (
          <p role="alert" className="text-primary">
            {classes.error || evidence.error || students.error}
          </p>
        ) : !classId ? (
          <p className="text-body-sm text-slate-500">Chọn lớp để xem lại kết quả.</p>
        ) : evidence.loading || students.loading ? (
          <p role="status">Đang tải…</p>
        ) : !rows.length ? (
          <p className="text-body-sm text-slate-500">Chưa có minh chứng thí nghiệm trong lớp.</p>
        ) : (
          <DataTable
            columns={['Sinh viên', 'Ngày ghi nhận', 'Thao tác']}
            rows={rows}
            renderRow={(row) => {
              const student = listItems(students.data).find(
                (item) => (item.studentId || item.userId) === row.studentId
              );
              return (
                <tr>
                  <td>{student?.fullName || student?.studentName || student?.username || 'Sinh viên'}</td>
                  <td>{row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '—'}</td>
                  <td>
                    <a
                      className="font-medium text-primary hover:underline"
                      href={`lecturer_lab_grading.html?submissionId=${encodeURIComponent(row.sourceId)}&classId=${encodeURIComponent(classId)}`}
                    >
                      Xem kết quả
                    </a>
                  </td>
                </tr>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}

export function LecturerExperimentGradingPage() {
  const params = new URLSearchParams(window.location.search);
  const submissionId = params.get('submissionId') || params.get('submission');
  const classId = params.get('classId');
  const summary = useApiData(
    submissionId ? `/api/v1/experiments/submissions/${encodeURIComponent(submissionId)}/rubric-summary` : null
  );
  const classes = useResource(!submissionId ? '/api/v1/classes' : null, true);
  const evidence = useApiData(classId ? `/api/v1/classes/${encodeURIComponent(classId)}/evidence` : null);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState('');
  const lock = useRef(false);
  const data = summary.data;
  const rubrics = data?.rubrics || [];
  const confirmed = data?.status === 'CONFIRMED';
  const complete = rubrics.length > 0 && rubrics.every((row) => row.isGraded && row.score != null);
  const files = listItems(evidence.data).filter(
    (row) => row.sourceType === 'EXPERIMENT' && row.sourceId === submissionId
  );
  const openFile = async (row) => {
    try {
      const response = row.fileId ? await api.files.downloadUrl(row.fileId) : null;
      const url = safeUrl(response?.downloadUrl || response?.url || row.fileUrl);
      if (!url) throw new Error('Không có liên kết tệp hợp lệ.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message);
    }
  };
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
      setNotice(`Đã lưu điểm: ${rubric.criteriaName}.`);
    } catch (err) {
      setError(err.message || 'Không thể lưu điểm.');
    } finally {
      lock.current = false;
      setSaving('');
    }
  };
  const confirm = async () => {
    if (lock.current || !complete || confirmed) return;
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
    <LecturerPageShell
      currentPage="lecturer_labs.html"
      title={data?.experimentTitle || 'Chấm bài thí nghiệm'}
      eyebrow="CHẤM BÁO CÁO"
    >
      <AuthAlert error>{error}</AuthAlert>
      <AuthAlert>{notice}</AuthAlert>
      {!submissionId ? (
        <ExperimentGradingPanel classes={classes} />
      ) : summary.loading ? (
        <Card className="p-6" role="status">
          Đang tải bài nộp và rubric…
        </Card>
      ) : summary.error ? (
        <Card className="p-6">
          <p role="alert" className="text-primary">
            {summary.error}
          </p>
          <Button className="mt-4" onClick={summary.reload}>
            Thử lại
          </Button>
        </Card>
      ) : (
        data && (
          <div className="space-y-5">
            <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h2 className="text-title-md font-medium">{data.experimentTitle}</h2>
                <p className="mt-2 text-body-sm text-slate-500">
                  Điểm đã lưu: {data.totalScore ?? 0} / {data.totalMaxScore ?? '—'} ·{' '}
                  {rubrics.filter((row) => row.isGraded).length}/{rubrics.length} tiêu chí
                </p>
              </div>
              <StatusBadge tone={confirmed ? 'success' : 'warning'}>
                {confirmed ? 'Đã xác nhận' : 'Chưa chốt điểm'}
              </StatusBadge>
            </Card>
            {files.length > 0 && (
              <Card className="p-5">
                <h2 className="font-medium">Tệp minh chứng</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {files.map((row, index) => (
                    <Button key={row.evidenceId} variant="secondary" icon="attachment" onClick={() => openFile(row)}>
                      Mở tệp {index + 1}
                    </Button>
                  ))}
                </div>
              </Card>
            )}
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
            {!confirmed && (
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
      {confirming && (
        <ConfirmDialog
          title="Chốt điểm thí nghiệm"
          description="Xác nhận điểm đã lưu? Sau khi chốt, bạn không thể sửa điểm của bài nộp này."
          confirmLabel="Chốt điểm"
          busy={Boolean(saving)}
          onCancel={() => setConfirming(false)}
          onConfirm={confirm}
        />
      )}
    </LecturerPageShell>
  );
}
