import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormDialog as Modal } from '../../components/FormDialog.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { DashboardOverview } from '../../components/DashboardOverview.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Table, useResource } from './LecturerShared.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { ActionMenu } from '../../components/ActionMenu.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { listItems, useApiData } from '../../hooks/useApiData.js';
import { api, apiRequest } from '../../lib/apiClient.js';

const nameOf = (row) =>
  row?.className || row?.classCode || row?.title || row?.name || row?.subjectName || row?.username || '—';
const state = (value) => (
  <StatusBadge
    tone={['ACTIVE', 'APPROVED', 'OPEN'].includes(value) ? 'success' : value === 'DRAFT' ? 'warning' : 'neutral'}
  >
    {value || '—'}
  </StatusBadge>
);
function Resource({ resource, children }) {
  if (resource.loading)
    return (
      <Card className="mt-5 p-6" role="status">
        Đang tải dữ liệu…
      </Card>
    );
  if (resource.error)
    return (
      <Card className="mt-5 p-6" role="alert">
        {resource.error}{' '}
        <Button variant="secondary" onClick={resource.reload}>
          Thử lại
        </Button>
      </Card>
    );
  return children(listItems(resource.data));
}
function ClassSelect({ classes, value, onChange, label = 'Lớp học' }) {
  return (
    <SelectField
      label={label}
      name="classId"
      className="min-w-64"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Chọn lớp</option>
      <option value="ALL">Tất cả lớp</option>
      {classes.map((item) => (
        <option key={item.classId} value={item.classId}>
          {nameOf(item)}
        </option>
      ))}
    </SelectField>
  );
}
function useAction() {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const run = async (path, options, success) => {
    if (pending.current) return null;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const data = await apiRequest(path, options);
      setNotice(success);
      return data ?? true;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return {
    notice,
    error,
    busy,
    run,
    setError,
    clear: () => {
      setNotice('');
      setError('');
    },
  };
}

function ExamManagementModal({ exam, subjectId, initialTab = 'questions', onClose, onChanged }) {
  const [tab, setTab] = useState(initialTab);
  const [gradingAttempt, setGradingAttempt] = useState(null);
  const [viewAttempt, setViewAttempt] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferUsername, setTransferUsername] = useState('');
  const [searchedUsername, setSearchedUsername] = useState('');
  const [transferStudentId, setTransferStudentId] = useState('');
  const [transferStudents, setTransferStudents] = useState([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const detail = useApiData(`/api/v1/exams/${encodeURIComponent(exam.examId)}`);
  const examQuestions = useApiData(`/api/v1/exams/${encodeURIComponent(exam.examId)}/questions`);
  const attempts = useApiData(`/api/v1/exams/${encodeURIComponent(exam.examId)}/attempts`);
  const attemptDetail = useApiData(
    viewAttempt ? `/api/v1/exams/attempts/${encodeURIComponent(viewAttempt.attemptId)}` : null
  );
  const roster = useApiData(`/api/v1/exams/${encodeURIComponent(exam.examId)}/roster`);
  const classOptions = useResource('/api/v1/classes', true);
  const candidates = useApiData(
    subjectId ? `/api/v1/questions?subjectId=${encodeURIComponent(subjectId)}&page=0&size=100` : null
  );
  const action = useAction();
  const questions = listItems(examQuestions.data);
  useEffect(() => {
    if (!transferOpen || classOptions.loading) return;
    const sourceClasses = listItems(classOptions.data).filter(
      (item) => item.classId !== exam.classId && (!subjectId || item.subjectId === subjectId)
    );
    let cancelled = false;
    setTransferLoading(true);
    setTransferError('');
    setTransferStudents([]);
    setTransferStudentId('');
    Promise.all(
      sourceClasses.map(async (item) => ({
        classItem: item,
        data: await apiRequest(`/api/v1/classes/${encodeURIComponent(item.classId)}/students`, {
          query: { status: 'ACTIVE', page: 0, size: 100 },
        }),
      }))
    )
      .then((groups) => {
        if (!cancelled)
          setTransferStudents(
            groups.flatMap(({ classItem, data }) =>
              listItems(data).map((student) => ({
                ...student,
                originalClassId: classItem.classId,
                originalClassCode: classItem.classCode || classItem.className,
              }))
            )
          );
      })
      .catch((error) => {
        if (!cancelled) setTransferError(error.message || 'Không thể tải danh sách sinh viên.');
      })
      .finally(() => {
        if (!cancelled) setTransferLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [transferOpen, classOptions.data, classOptions.loading, subjectId, exam.classId]);
  const addQuestion = async (question) => {
    const result = await action.run(
      `/api/v1/exams/${encodeURIComponent(exam.examId)}/questions`,
      { method: 'POST', body: { questionId: question.questionId } },
      'Đã thêm câu hỏi vào đề.'
    );
    if (result) examQuestions.reload();
  };
  const generate = async () => {
    const result = await action.run(
      `/api/v1/exams/${encodeURIComponent(exam.examId)}/generate-questions`,
      { method: 'POST' },
      'Đã sinh câu hỏi theo ma trận.'
    );
    if (result) examQuestions.reload();
  };
  const removeQuestion = async () => {
    if (!removeTarget) return;
    const result = await action.run(
      `/api/v1/exams/${encodeURIComponent(exam.examId)}/questions/${encodeURIComponent(removeTarget.questionId)}`,
      { method: 'DELETE' },
      'Đã gỡ câu hỏi khỏi đề.'
    );
    if (result) {
      setRemoveTarget(null);
      examQuestions.reload();
    }
  };
  const grade = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const result = await action.run(
      `/api/v1/exams/attempts/${encodeURIComponent(gradingAttempt.attemptId)}/grade`,
      { method: 'PUT', body: { totalScore: Number(values.totalScore), feedback: values.feedback } },
      'Đã cập nhật điểm bài làm.'
    );
    if (result) {
      setGradingAttempt(null);
      attempts.reload();
    }
  };
  const addTransfer = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const student = transferStudents.find((item) => (item.studentId || item.userId) === transferStudentId);
    if (!student) {
      action.setError('Chọn một sinh viên từ kết quả tìm kiếm.');
      return;
    }
    const result = await action.run(
      `/api/v1/exams/${encodeURIComponent(exam.examId)}/transfers`,
      {
        method: 'POST',
        body: {
          studentId: transferStudentId,
          originalClassId: student.originalClassId,
          reason: values.reason.trim() || null,
        },
      },
      'Đã thêm sinh viên vào danh sách thi ghép.'
    );
    if (result) {
      setTransferOpen(false);
      setTransferUsername('');
      setSearchedUsername('');
      setTransferStudentId('');
      roster.reload();
    }
  };
  return (
    <>
      {removeTarget && (
        <ConfirmDialog
          title="Gỡ câu hỏi khỏi đề"
          description="Câu hỏi chỉ được gỡ khi backend cho phép theo trạng thái làm bài hiện tại."
          confirmLabel="Gỡ câu hỏi"
          busy={action.busy}
          onCancel={() => !action.busy && setRemoveTarget(null)}
          onConfirm={removeQuestion}
        />
      )}
      <Modal
        wide
        title={`Quản lý đề thi · ${exam.title || 'Đề thi'}`}
        busy={action.busy}
        onClose={() => !action.busy && onClose()}
      >
        <AuthAlert>{action.notice}</AuthAlert>
        <AuthAlert error>{action.error}</AuthAlert>
        <Tabs
          items={[
            { id: 'questions', label: 'Câu hỏi' },
            { id: 'attempts', label: 'Bài làm' },
            { id: 'roster', label: 'Danh sách sinh viên' },
          ]}
          activeId={tab}
          onChange={setTab}
          actions={
            tab === 'questions' && detail.data?.matrixId ? (
              <Button disabled={action.busy} onClick={generate}>
                Sinh theo ma trận
              </Button>
            ) : null
          }
        >
          {() =>
            tab === 'questions' ? (
              <>
                <Resource resource={examQuestions}>
                  {(rows) => (
                    <Table
                      rows={rows}
                      columns={['Câu hỏi', 'Chủ đề', 'Độ khó', '']}
                      cells={(item) => [
                        item.content || item.questionText || '—',
                        item.topicName || '—',
                        item.difficultyLevel || '—',
                        <Button variant="secondary" disabled={action.busy} onClick={() => setRemoveTarget(item)}>
                          Gỡ
                        </Button>,
                      ]}
                    />
                  )}
                </Resource>
                {subjectId ? (
                  <Resource resource={candidates}>
                    {(rows) => (
                      <Table
                        rows={rows.filter(
                          (item) => !questions.some((question) => question.questionId === item.questionId)
                        )}
                        columns={['Ngân hàng câu hỏi', 'Chủ đề', 'Độ khó', '']}
                        cells={(item) => [
                          item.content || '—',
                          item.topicName || '—',
                          item.difficultyLevel || '—',
                          <Button disabled={action.busy} onClick={() => addQuestion(item)}>
                            Thêm vào đề
                          </Button>,
                        ]}
                      />
                    )}
                  </Resource>
                ) : (
                  <Card className="mt-4 p-4">Chưa có dữ liệu học phần của lớp để tải Ngân hàng câu hỏi.</Card>
                )}
              </>
            ) : tab === 'attempts' ? (
              <Resource resource={attempts}>
                {(rows) => (
                  <>
                    <Card className="mb-4 grid grid-cols-3 gap-3 p-4">
                      <div>
                        <strong>{rows.length}</strong>
                        <p className="text-body-sm text-[#64748B]">lượt làm</p>
                      </div>
                      <div>
                        <strong>{rows.filter((item) => item.status === 'SUBMITTED').length}</strong>
                        <p className="text-body-sm text-[#64748B]">đã nộp</p>
                      </div>
                      <div>
                        <strong>{rows.filter((item) => item.totalScore != null).length}</strong>
                        <p className="text-body-sm text-[#64748B]">đã có điểm</p>
                      </div>
                    </Card>
                    <Table
                      rows={rows}
                      columns={['Sinh viên', 'Lần làm', 'Trạng thái', 'Nộp bài', 'Điểm', '']}
                      cells={(item) => [
                        item.studentName || item.studentCode || item.studentUsername || '—',
                        item.attemptNumber ?? '—',
                        item.status || '—',
                        item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : 'Chưa nộp',
                        item.totalScore ?? 'Chưa chấm',
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => setViewAttempt(item)}>
                            Xem chi tiết
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={action.busy || item.status !== 'SUBMITTED'}
                            onClick={() => setGradingAttempt(item)}
                          >
                            {item.totalScore == null ? 'Chấm bài' : 'Sửa điểm'}
                          </Button>
                        </div>,
                      ]}
                    />
                  </>
                )}
              </Resource>
            ) : (
              <Resource resource={roster}>
                {() => {
                  const data = roster.data || {};
                  const official = data.officialStudents || [];
                  const transferred = data.transferredStudents || [];
                  return (
                    <>
                      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
                        <div>
                          <strong>{data.totalParticipants ?? official.length + transferred.length}</strong>
                          <span className="ml-2 text-body-sm text-[#64748B]">
                            sinh viên ({data.officialStudentCount ?? official.length} chính thức ·{' '}
                            {data.transferredStudentCount ?? transferred.length} thi ghép)
                          </span>
                        </div>
                        <Button
                          disabled={action.busy}
                          onClick={() => {
                            setTransferUsername('');
                            setSearchedUsername('');
                            setTransferStudentId('');
                            setTransferOpen(true);
                          }}
                        >
                          Thêm sinh viên thi ghép
                        </Button>
                      </Card>
                      <Table
                        rows={official}
                        columns={['MSSV', 'Họ tên', 'Lớp', 'Loại tham gia']}
                        cells={(item) => [
                          item.studentCode || '—',
                          item.studentName || item.fullName || '—',
                          data.classCode || '—',
                          'Chính thức',
                        ]}
                      />
                      <Table
                        rows={transferred}
                        columns={['MSSV', 'Họ tên', 'Lớp gốc', 'Lý do', '']}
                        cells={(item) => [
                          item.studentCode || '—',
                          item.studentName || item.studentUsername || '—',
                          item.originalClassCode || '—',
                          item.reason || '—',
                          <Button
                            variant="secondary"
                            disabled={action.busy}
                            onClick={() =>
                              action
                                .run(
                                  `/api/v1/exams/${encodeURIComponent(exam.examId)}/transfers/${encodeURIComponent(item.studentId)}`,
                                  { method: 'DELETE' },
                                  'Đã xóa sinh viên khỏi danh sách thi ghép.'
                                )
                                .then((result) => result && roster.reload())
                            }
                          >
                            Xóa khỏi đề
                          </Button>,
                        ]}
                      />
                    </>
                  );
                }}
              </Resource>
            )
          }
        </Tabs>
      </Modal>
      {transferOpen && (
        <Modal
          title="Thêm sinh viên thi ghép"
          busy={action.busy}
          onClose={() => !action.busy && setTransferOpen(false)}
        >
          <Form className="grid gap-4" onSubmit={addTransfer}>
            <p className="text-body-sm text-[#64748B]">
              Tìm trong toàn bộ sinh viên đang học các lớp cùng học phần mà bạn được cấp quyền.
            </p>
            <div>
              <label className="text-body-sm font-semibold">
                Tìm theo tên đăng nhập
                <input
                  value={transferUsername}
                  onChange={(event) => setTransferUsername(event.target.value)}
                  placeholder="Nhập username sinh viên"
                  className="mt-2 block w-full rounded-xl border p-3"
                />
              </label>
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                disabled={transferLoading}
                onClick={() => {
                  setSearchedUsername(transferUsername.trim());
                  setTransferStudentId('');
                }}
              >
                Tìm kiếm
              </Button>
            </div>
            {transferError && (
              <p role="alert" className="text-red-700">
                {transferError}
              </p>
            )}
            <SelectField
              label="Kết quả tìm kiếm"
              value={transferStudentId}
              onChange={(event) => setTransferStudentId(event.target.value)}
              disabled={transferLoading || !searchedUsername}
              required
            >
              <option value="">
                {transferLoading
                  ? 'Đang tải danh sách sinh viên…'
                  : searchedUsername
                    ? 'Chọn sinh viên'
                    : 'Nhập username và bấm Tìm kiếm'}
              </option>
              {transferStudents
                .filter(
                  (item) =>
                    searchedUsername &&
                    String(item.username || '')
                      .toLowerCase()
                      .includes(searchedUsername.toLowerCase())
                )
                .map((item) => (
                  <option
                    key={`${item.originalClassId}:${item.studentId || item.userId}`}
                    value={item.studentId || item.userId}
                  >
                    {item.username ? `${item.username} · ` : ''}
                    {item.fullName || item.studentName || item.studentCode || 'Sinh viên'}
                    {item.originalClassCode ? ` · ${item.originalClassCode}` : ''}
                  </option>
                ))}
            </SelectField>
            {searchedUsername &&
              !transferLoading &&
              !transferStudents.some((item) =>
                String(item.username || '')
                  .toLowerCase()
                  .includes(searchedUsername.toLowerCase())
              ) && <p className="text-body-sm text-[#64748B]">Không tìm thấy sinh viên phù hợp.</p>}
            <label className="text-body-sm font-semibold">
              Lý do
              <textarea name="reason" rows={3} className="mt-2 block w-full rounded-xl border p-3" />
            </label>
            <SubmitButton busy={action.busy || transferLoading || !transferStudentId}>Thêm vào đề thi</SubmitButton>
          </Form>
        </Modal>
      )}
      {viewAttempt && (
        <Modal
          title={`Chi tiết bài làm · ${viewAttempt.studentName || viewAttempt.studentCode || viewAttempt.studentUsername || 'Sinh viên'}`}
          onClose={() => setViewAttempt(null)}
        >
          <Resource resource={attemptDetail}>
            {() => {
              const item = attemptDetail.data || viewAttempt;
              return (
                <div className="grid gap-3">
                  <Card className="p-4">
                    <p>
                      <strong>Trạng thái:</strong> {item.status || '—'}
                    </p>
                    <p className="mt-2">
                      <strong>Lần làm:</strong> {item.attemptNumber ?? '—'}
                    </p>
                    <p className="mt-2">
                      <strong>Bắt đầu:</strong>{' '}
                      {item.startedAt ? new Date(item.startedAt).toLocaleString('vi-VN') : '—'}
                    </p>
                    <p className="mt-2">
                      <strong>Nộp bài:</strong>{' '}
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : 'Chưa nộp'}
                    </p>
                    <p className="mt-2">
                      <strong>Điểm:</strong> {item.totalScore ?? 'Chưa chấm'}
                    </p>
                  </Card>
                  {item.status === 'SUBMITTED' && (
                    <Button
                      disabled={action.busy}
                      onClick={() => {
                        setViewAttempt(null);
                        setGradingAttempt(item);
                      }}
                    >
                      Chấm bài này
                    </Button>
                  )}
                </div>
              );
            }}
          </Resource>
        </Modal>
      )}
      {gradingAttempt && (
        <Modal
          title={`Chấm bài · ${gradingAttempt.studentName || gradingAttempt.studentCode || 'Sinh viên'}`}
          busy={action.busy}
          onClose={() => !action.busy && setGradingAttempt(null)}
        >
          <Form className="grid gap-4" onSubmit={grade}>
            <label>
              Điểm tổng
              <input
                name="totalScore"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={gradingAttempt.totalScore ?? ''}
                className="mt-2 block w-full rounded-xl border p-3"
              />
            </label>
            <label>
              Nhận xét
              <textarea
                name="feedback"
                defaultValue={gradingAttempt.feedback || ''}
                rows={4}
                className="mt-2 block w-full rounded-xl border p-3"
              />
            </label>
            <SubmitButton busy={action.busy}>Lưu điểm</SubmitButton>
          </Form>
        </Modal>
      )}
    </>
  );
}

function MatrixManager({ classes }) {
  const [subjectId, setSubjectId] = useState('');
  const [modal, setModal] = useState(null);
  const [details, setDetails] = useState([
    { topicId: '', difficultyLevel: 'MEDIUM', numQuestions: 1, weightPercent: 100 },
  ]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [validation, setValidation] = useState(null);
  const subjects = useApiData('/api/v1/subjects?isActive=true&page=0&size=100');
  const topics = useApiData(subjectId ? `/api/v1/subjects/${encodeURIComponent(subjectId)}/topics` : null);
  const matrices = useApiData(`/api/v1/exam-matrices${subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''}`);
  const action = useAction();
  const openCreate = () => {
    setDetails([{ topicId: '', difficultyLevel: 'MEDIUM', numQuestions: 1, weightPercent: 100 }]);
    setModal({ mode: 'create' });
  };
  const openEdit = async (row) => {
    const data = await action.run(`/api/v1/exam-matrices/${encodeURIComponent(row.matrixId)}`, {}, '');
    if (data) {
      setDetails(data.details?.length ? data.details : []);
      setModal({ mode: 'edit', row: data });
    }
  };
  const save = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (
      !details.length ||
      details.some((item) => !item.topicId || Number(item.numQuestions) < 1 || Number(item.weightPercent) <= 0)
    ) {
      action.setError('Hoàn thiện các dòng chủ đề, số câu và trọng số trước khi lưu.');
      return;
    }
    const body = {
      subjectId,
      matrixName: values.matrixName.trim(),
      examType: values.examType,
      description: values.description.trim(),
      totalPoints: Number(values.totalPoints),
      details: details.map((item) => ({
        ...item,
        numQuestions: Number(item.numQuestions),
        weightPercent: Number(item.weightPercent),
      })),
    };
    const result = await action.run(
      modal.mode === 'edit'
        ? `/api/v1/exam-matrices/${encodeURIComponent(modal.row.matrixId)}`
        : '/api/v1/exam-matrices',
      { method: modal.mode === 'edit' ? 'PUT' : 'POST', body },
      modal.mode === 'edit' ? 'Đã cập nhật ma trận.' : 'Đã tạo ma trận.'
    );
    if (result) {
      setModal(null);
      matrices.reload();
    }
  };
  const validate = async (row) => {
    const result = await action.run(
      `/api/v1/exam-matrices/${encodeURIComponent(row.matrixId)}/validate`,
      { method: 'POST' },
      'Đã kiểm tra ma trận.'
    );
    if (result) setValidation(result);
  };
  const remove = async () => {
    if (!deleteTarget) return;
    const result = await action.run(
      `/api/v1/exam-matrices/${encodeURIComponent(deleteTarget.matrixId)}`,
      { method: 'DELETE' },
      'Đã xóa ma trận.'
    );
    if (result) {
      setDeleteTarget(null);
      matrices.reload();
    }
  };
  return (
    <>
      {action.feedback}
      {deleteTarget && (
        <ConfirmDialog
          title="Xóa ma trận đề"
          description={`Bạn có chắc muốn xóa ${deleteTarget.matrixName || 'ma trận đề'}? Backend có thể từ chối nếu ma trận đã được sử dụng.`}
          confirmLabel="Xóa ma trận"
          busy={action.busy}
          onCancel={() => !action.busy && setDeleteTarget(null)}
          onConfirm={remove}
        />
      )}
      {validation && (
        <Modal title={`Kiểm tra ma trận · ${validation.matrixName || ''}`} onClose={() => setValidation(null)}>
          <Card className="p-4">
            <p className={`font-semibold ${validation.valid ? 'text-emerald-700' : 'text-amber-700'}`}>
              {validation.valid ? 'Ma trận đủ câu hỏi để sử dụng.' : 'Ma trận chưa đủ câu hỏi để sử dụng.'}
            </p>
            <p className="mt-2">
              Yêu cầu {validation.totalRequired ?? 0} câu · Có sẵn {validation.totalAvailable ?? 0} câu.
            </p>
          </Card>
          <Table
            rows={validation.items || []}
            columns={['Chủ đề', 'Độ khó', 'Yêu cầu', 'Có sẵn', 'Trạng thái']}
            cells={(item) => [
              item.topicName || '—',
              item.difficultyLevel || '—',
              item.requiredQuestions ?? 0,
              item.availableQuestions ?? 0,
              item.sufficient ? 'Đủ' : 'Thiếu',
            ]}
          />
          {validation.warnings?.length > 0 && (
            <ul className="mt-4 list-disc pl-5 text-amber-700">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          )}
        </Modal>
      )}
      <Card className="mt-5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SelectField
            label="Học phần"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="min-w-64"
          >
            <option value="">Tất cả học phần</option>
            {listItems(subjects.data).map((item) => (
              <option key={item.subjectId} value={item.subjectId}>
                {item.subjectCode ? `${item.subjectCode} · ` : ''}
                {item.subjectName}
              </option>
            ))}
          </SelectField>
          <Button disabled={!subjectId || action.busy} onClick={openCreate}>
            Tạo ma trận
          </Button>
        </div>
      </Card>
      <Resource resource={matrices}>
        {(rows) => (
          <Table
            asCards
            rows={rows}
            columns={['Ma trận', 'Loại đề', 'Tổng điểm', 'Thao tác']}
            cells={(item) => [
              item.matrixName || item.name || '—',
              item.examType || '—',
              item.totalPoints ?? '—',
              <ActionMenu
                label={`Thao tác với ${item.matrixName || 'ma trận'}`}
                disabled={action.busy}
                items={[
                  { label: 'Chỉnh sửa', onSelect: () => openEdit(item) },
                  { label: 'Kiểm tra ma trận', onSelect: () => validate(item) },
                  { label: 'Xóa', danger: true, onSelect: () => setDeleteTarget(item) },
                ]}
              />,
            ]}
          />
        )}
      </Resource>
      {modal && (
        <Modal
          title={modal.mode === 'edit' ? 'Chỉnh sửa ma trận đề' : 'Tạo ma trận đề'}
          busy={action.busy}
          onClose={() => !action.busy && setModal(null)}
        >
          <Form className="grid gap-4" onSubmit={save}>
            <label>
              Tên ma trận
              <input
                name="matrixName"
                required
                defaultValue={modal.row?.matrixName || ''}
                className="mt-2 block w-full rounded-xl border p-3"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                Loại đề
                <select
                  name="examType"
                  defaultValue={modal.row?.examType || 'QUIZ'}
                  className="mt-2 block w-full rounded-xl border p-3"
                >
                  <option value="PRACTICE">Luyện tập</option>
                  <option value="QUIZ">Kiểm tra ngắn</option>
                  <option value="MIDTERM">Giữa kỳ</option>
                  <option value="FINAL">Cuối kỳ</option>
                </select>
              </label>
              <label>
                Tổng điểm
                <input
                  name="totalPoints"
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  defaultValue={modal.row?.totalPoints ?? 10}
                  className="mt-2 block w-full rounded-xl border p-3"
                />
              </label>
            </div>
            <label>
              Mô tả
              <textarea
                name="description"
                rows={3}
                defaultValue={modal.row?.description || ''}
                className="mt-2 block w-full rounded-xl border p-3"
              />
            </label>
            <Card className="p-4">
              <h3 className="font-bold">Cấu trúc đề</h3>
              {details.map((item, index) => (
                <div className="mt-3 grid gap-2 md:grid-cols-4" key={index}>
                  <select
                    value={item.topicId}
                    onChange={(event) =>
                      setDetails((rows) =>
                        rows.map((row, i) => (i === index ? { ...row, topicId: event.target.value } : row))
                      )
                    }
                    className="rounded-xl border p-2"
                  >
                    <option value="">Chọn chủ đề</option>
                    {listItems(topics.data).map((topic) => (
                      <option key={topic.topicId} value={topic.topicId}>
                        {topic.topicName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={item.difficultyLevel}
                    onChange={(event) =>
                      setDetails((rows) =>
                        rows.map((row, i) => (i === index ? { ...row, difficultyLevel: event.target.value } : row))
                      )
                    }
                    className="rounded-xl border p-2"
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                  <input
                    aria-label="Số câu"
                    type="number"
                    min="1"
                    value={item.numQuestions}
                    onChange={(event) =>
                      setDetails((rows) =>
                        rows.map((row, i) => (i === index ? { ...row, numQuestions: event.target.value } : row))
                      )
                    }
                    className="rounded-xl border p-2"
                  />
                  <input
                    aria-label="Trọng số"
                    type="number"
                    min="1"
                    value={item.weightPercent}
                    onChange={(event) =>
                      setDetails((rows) =>
                        rows.map((row, i) => (i === index ? { ...row, weightPercent: event.target.value } : row))
                      )
                    }
                    className="rounded-xl border p-2"
                  />
                </div>
              ))}
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setDetails((rows) => [
                      ...rows,
                      { topicId: '', difficultyLevel: 'MEDIUM', numQuestions: 1, weightPercent: 0 },
                    ])
                  }
                >
                  Thêm dòng
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={details.length <= 1}
                  onClick={() => setDetails((rows) => rows.slice(0, -1))}
                >
                  Bỏ dòng cuối
                </Button>
              </div>
            </Card>
            <SubmitButton busy={action.busy}>Lưu ma trận</SubmitButton>
          </Form>
        </Modal>
      )}
    </>
  );
}

export function LecturerDashboardApiPage() {
  const classes = useResource('/api/v1/classes', true);
  const rows = listItems(classes.data);
  const active = rows.filter((item) => item.status === 'ACTIVE');
  return (
    <LecturerPageShell
      currentPage="lecturer_dashboard.html"
      title="Tổng quan giảng viên"
      eyebrow="KHU VỰC GIẢNG VIÊN"
      description="Theo dõi lớp học, kỳ thi và hoạt động được cấp quyền."
    >
      <DashboardOverview role="INSTRUCTOR">
        <MetricGrid
          items={[
            {
              label: 'Lớp phụ trách',
              value: classes.data?.totalElements ?? rows.length,
              detail: 'dữ liệu thực',
              icon: 'groups',
            },
            {
              label: 'Lớp đang hoạt động',
              value: active.length,
              detail: 'trong danh sách hiện tại',
              icon: 'school',
              tone: 'success',
            },
            {
              label: 'Sức chứa lớp',
              value: rows.reduce((sum, item) => sum + (item.maxStudents || 0), 0),
              detail: 'tổng chỉ tiêu',
              icon: 'group_add',
            },
            {
              label: 'Lớp nháp',
              value: rows.filter((item) => item.status === 'DRAFT').length,
              detail: 'cần thiết lập',
              icon: 'edit_note',
              tone: 'warning',
            },
          ]}
        />
        <Card className="col-span-full p-6">
          <h2 className="font-bold">Lớp được cấp quyền</h2>
          <Resource resource={classes}>
            {(items) => (
              <div className="mt-4 flex flex-wrap gap-2">
                {items.slice(0, 8).map((item) => (
                  <a
                    key={item.classId}
                    href={`lecturer_courses.html?classId=${item.classId}`}
                    className="rounded-xl border border-[#E2E8F0] px-3 py-2 font-semibold hover:border-primary"
                  >
                    {nameOf(item)}
                  </a>
                ))}
              </div>
            )}
          </Resource>
        </Card>
      </DashboardOverview>
    </LecturerPageShell>
  );
}

export function LecturerAssessmentApiPage({ grading = false }) {
  const classes = useResource('/api/v1/classes', true);
  const rows = listItems(classes.data);
  const [tab, setTab] = useState('exams');
  const [classId, setClassId] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [managing, setManaging] = useState(null);
  const [deleteExam, setDeleteExam] = useState(null);
  const [allExams, setAllExams] = useState([]);
  const [allExamsLoading, setAllExamsLoading] = useState(false);
  const [allExamsError, setAllExamsError] = useState('');
  const selected = classId || 'ALL';
  const exams = useApiData(selected !== 'ALL' ? `/api/v1/exams/class/${encodeURIComponent(selected)}` : null);
  const matrices = useApiData(
    selected !== 'ALL' ? `/api/v1/exam-matrices?classId=${encodeURIComponent(selected)}` : null
  );
  const reloadAllExams = async () => {
    if (selected !== 'ALL') return;
    setAllExamsLoading(true);
    setAllExamsError('');
    try {
      const results = await Promise.all(rows.map((item) => api.exams.listForClass(item.classId)));
      setAllExams(results.flatMap((result) => listItems(result)));
    } catch (requestError) {
      setAllExamsError(requestError.message || 'Không thể tải danh sách đề thi.');
    } finally {
      setAllExamsLoading(false);
    }
  };
  useEffect(() => {
    reloadAllExams();
  }, [selected, rows.map((item) => item.classId).join('|')]);
  const examResource =
    selected === 'ALL'
      ? { data: allExams, loading: allExamsLoading, error: allExamsError, reload: reloadAllExams }
      : exams;
  const action = useAction();
  const createExam = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = {
      classId: selected,
      ...(values.matrixId ? { matrixId: values.matrixId } : {}),
      title: values.title.trim(),
      examType: values.examType,
      durationMinutes: Number(values.durationMinutes),
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
    };
    const result = await action.run(
      editing ? `/api/v1/exams/${encodeURIComponent(editing.examId)}` : '/api/v1/exams',
      { method: editing ? 'PUT' : 'POST', body },
      editing ? 'Đã cập nhật đề thi.' : 'Đã tạo đề thi.'
    );
    if (result) {
      setCreating(false);
      setEditing(null);
      exams.reload();
    }
  };
  const editExam = async (exam) => {
    const result = await action.run(`/api/v1/exams/${encodeURIComponent(exam.examId)}`, {}, '');
    if (result) setEditing(result);
  };
  return (
    <LecturerPageShell
      currentPage={grading ? 'lecturer_grading.html' : 'lecturer_assessments.html'}
      title={grading ? 'Chấm bài kiểm tra' : 'Bài tập & kiểm tra'}
      eyebrow="ĐÁNH GIÁ"
      description={grading ? 'Theo dõi kỳ thi và thông tin đánh giá của lớp.' : 'Theo dõi các kỳ thi theo lớp.'}
    >
      <AuthAlert>{action.notice}</AuthAlert>
      <AuthAlert error>{action.error}</AuthAlert>
      {deleteExam && (
        <ConfirmDialog
          title="Xóa đề thi"
          description={`Bạn có chắc muốn xóa đề “${nameOf(deleteExam)}”? Thao tác này không thể hoàn tác.`}
          confirmLabel="Xóa đề thi"
          busy={action.busy}
          onCancel={() => !action.busy && setDeleteExam(null)}
          onConfirm={async () => {
            const result = await action.run(
              `/api/v1/exams/${encodeURIComponent(deleteExam.examId)}`,
              { method: 'DELETE' },
              'Đã xóa đề thi.'
            );
            if (result) {
              setDeleteExam(null);
              exams.reload();
            }
          }}
        />
      )}
      <div className="mt-6">
        <Tabs
          items={
            grading
              ? [{ id: 'exams', label: 'Kỳ thi của lớp' }]
              : [
                  { id: 'exams', label: 'Kỳ thi của lớp' },
                  { id: 'matrices', label: 'Ma trận đề' },
                ]
          }
          activeId={tab}
          onChange={setTab}
          actions={
            <>
              {tab === 'exams' && <ClassSelect classes={rows} value={selected} onChange={setClassId} />}
              {!grading && tab === 'exams' && (
                <Button icon="add" disabled={!selected || selected === 'ALL'} onClick={() => setCreating(true)}>
                  Tạo đề thi
                </Button>
              )}
            </>
          }
        >
          {() =>
            tab === 'matrices' ? (
              <MatrixManager classes={rows} />
            ) : (
              <Resource resource={examResource}>
                {(items) => (
                  <Table
                    asCards
                    rows={items}
                    columns={['Kỳ thi', 'Loại', 'Thời gian', 'Số câu', 'Thao tác']}
                    cells={(item) => [
                      nameOf(item),
                      item.examType || '—',
                      item.startTime ? new Date(item.startTime).toLocaleString('vi-VN') : '—',
                      item.totalQuestions ?? '—',
                      <ActionMenu
                        label={`Thao tác với ${nameOf(item)}`}
                        disabled={action.busy}
                        items={
                          grading
                            ? [{ label: 'Xem danh sách bài làm', onSelect: () => setManaging(item) }]
                            : [
                                { label: 'Chỉnh sửa đề thi', onSelect: () => setManaging(item) },
                                { label: 'Sửa thông tin đề thi', onSelect: () => editExam(item) },
                                { label: 'Xóa đề thi', danger: true, onSelect: () => setDeleteExam(item) },
                              ]
                        }
                      />,
                    ]}
                  />
                )}
              </Resource>
            )
          }
        </Tabs>
      </div>
      {(creating || editing) && (
        <Modal
          title={editing ? 'Chỉnh sửa đề thi' : 'Tạo đề thi'}
          busy={action.busy}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        >
          <Form className="grid gap-4" busy={action.busy} onSubmit={createExam}>
            <label className="text-body-sm font-semibold">
              Tên đề thi
              <input
                name="title"
                defaultValue={editing?.title || ''}
                required
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
            <SelectField label="Ma trận đề" name="matrixId" defaultValue={editing?.matrixId || ''}>
              <option value="">Không sử dụng ma trận</option>
              {listItems(matrices.data).map((matrix) => (
                <option key={matrix.matrixId} value={matrix.matrixId}>
                  {matrix.matrixName || matrix.name || 'Ma trận đề'}
                </option>
              ))}
            </SelectField>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-body-sm font-semibold">
                Loại đề
                <select
                  name="examType"
                  defaultValue={editing?.examType || 'PRACTICE'}
                  className="mt-2 w-full rounded-xl border bg-white p-3"
                >
                  <option value="PRACTICE">Luyện tập</option>
                  <option value="QUIZ">Kiểm tra ngắn</option>
                  <option value="MIDTERM">Giữa kỳ</option>
                  <option value="FINAL">Cuối kỳ</option>
                </select>
              </label>
              <label className="text-body-sm font-semibold">
                Thời lượng (phút)
                <input
                  name="durationMinutes"
                  type="number"
                  min="1"
                  defaultValue={editing?.durationMinutes || ''}
                  required
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>
              <label className="text-body-sm font-semibold">
                Bắt đầu
                <input
                  name="startTime"
                  type="datetime-local"
                  defaultValue={editing?.startTime?.slice(0, 16) || ''}
                  required
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>
              <label className="text-body-sm font-semibold">
                Kết thúc
                <input
                  name="endTime"
                  type="datetime-local"
                  defaultValue={editing?.endTime?.slice(0, 16) || ''}
                  required
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={action.busy}
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                Hủy
              </Button>
              <SubmitButton busy={action.busy}>{editing ? 'Lưu thay đổi' : 'Tạo đề thi'}</SubmitButton>
            </div>
          </Form>
        </Modal>
      )}
      {managing && (
        <ExamManagementModal
          exam={managing}
          subjectId={rows.find((item) => item.classId === (managing.classId || selected))?.subjectId}
          initialTab={grading ? 'attempts' : 'questions'}
          onClose={() => setManaging(null)}
          onChanged={examResource.reload}
        />
      )}
    </LecturerPageShell>
  );
}

export function LecturerGradingApiPage() {
  return <LecturerAssessmentApiPage grading />;
}

function LecturerAnalyticsTable({ tab, rows }) {
  const percent = (value) => (typeof value === 'number' ? `${Math.round(value * 100)}%` : '—');
  if (tab === 'difficulty')
    return (
      <Table
        asCards
        rows={rows}
        columns={['Chủ đề', 'Điểm trung bình', 'Tỷ lệ lỗi', 'Kỳ dữ liệu']}
        cells={(item) => [item.topicName || '—', item.avgScore ?? '—', percent(item.errorRate), item.period || '—']}
      />
    );
  if (tab === 'questions')
    return (
      <Table
        asCards
        rows={rows}
        columns={['Câu hỏi', 'Chủ đề', 'Lần dùng', 'Tỷ lệ đúng', 'Chất lượng']}
        cells={(item) => [
          item.questionText || '—',
          item.topicName || '—',
          item.timesUsed ?? 0,
          percent(item.correctRate),
          item.qualityLabel || '—',
        ]}
      />
    );
  if (tab === 'materials')
    return (
      <Table
        asCards
        rows={rows}
        columns={['Học liệu', 'Chủ đề', 'Lượt xem', 'Thời gian đọc TB', 'Cải thiện điểm']}
        cells={(item) => [
          item.title || item.materialTitle || '—',
          item.topicName || '—',
          item.viewCount ?? 0,
          item.avgTimeSpentSeconds ? `${item.avgTimeSpentSeconds}s` : '—',
          percent(item.correlatedScoreImprovement),
        ]}
      />
    );
  return (
    <Table
      asCards
      rows={rows}
      columns={['Chủ đề', 'Lần AI từ chối', 'Câu hỏi thường gặp', 'Kỳ dữ liệu']}
      cells={(item) => [
        item.topicName || '—',
        item.refusalCount ?? 0,
        item.frequentQuerySample || '—',
        item.period || '—',
      ]}
    />
  );
}

export function LecturerAnalyticsApiPage() {
  const [tab, setTab] = useState('difficulty');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [period, setPeriod] = useState('');
  const [minUsed, setMinUsed] = useState('');
  const classes = useResource('/api/v1/classes', true);
  const subjects = useApiData('/api/v1/subjects?isActive=true&page=0&size=100');
  const topics = useApiData(subjectId ? `/api/v1/subjects/${encodeURIComponent(subjectId)}/topics` : null);
  const paths = {
    difficulty: '/api/v1/analytics/topic-difficulty',
    questions: '/api/v1/analytics/question-quality',
    materials: '/api/v1/analytics/material-effectiveness',
    ai: '/api/v1/analytics/ai-gaps',
  };
  const query = new URLSearchParams();
  if (tab === 'difficulty') {
    if (classId) query.set('classId', classId);
    if (subjectId) query.set('subjectId', subjectId);
    if (period) query.set('period', period);
  }
  if (tab === 'questions') {
    if (subjectId) query.set('subjectId', subjectId);
    if (topicId) query.set('topicId', topicId);
    if (minUsed) query.set('minUsed', minUsed);
  }
  if (tab === 'materials') {
    if (subjectId) query.set('subjectId', subjectId);
    if (topicId) query.set('topicId', topicId);
    if (period) query.set('period', period);
  }
  if (tab === 'ai') {
    if (subjectId) query.set('subjectId', subjectId);
    if (period) query.set('period', period);
  }
  const resource = useApiData(`${paths[tab]}${query.size ? `?${query}` : ''}`);
  return (
    <LecturerPageShell
      currentPage="lecturer_analytics.html"
      title="Phân tích học tập"
      eyebrow="DỮ LIỆU LỚP HỌC"
      description="Báo cáo chất lượng nội dung và hoạt động học tập."
    >
      <div className="mt-6">
        <Tabs
          items={[
            { id: 'difficulty', label: 'Độ khó chủ đề' },
            { id: 'questions', label: 'Chất lượng câu hỏi' },
            { id: 'materials', label: 'Hiệu quả học liệu' },
            { id: 'ai', label: 'Khoảng trống AI' },
          ]}
          activeId={tab}
          onChange={setTab}
          actions={
            <>
              {tab === 'difficulty' && (
                <SelectField label="Lớp học" value={classId} onChange={(event) => setClassId(event.target.value)}>
                  <option value="">Tất cả lớp học</option>
                  {listItems(classes.data).map((item) => (
                    <option key={item.classId} value={item.classId}>
                      {nameOf(item)}
                    </option>
                  ))}
                </SelectField>
              )}
              <SelectField
                label="Học phần"
                value={subjectId}
                onChange={(event) => {
                  setSubjectId(event.target.value);
                  setTopicId('');
                }}
              >
                <option value="">Tất cả học phần</option>
                {listItems(subjects.data).map((item) => (
                  <option key={item.subjectId} value={item.subjectId}>
                    {item.subjectCode ? `${item.subjectCode} · ` : ''}
                    {item.subjectName}
                  </option>
                ))}
              </SelectField>
              {['questions', 'materials'].includes(tab) && (
                <SelectField
                  label="Chủ đề"
                  value={topicId}
                  disabled={!subjectId}
                  onChange={(event) => setTopicId(event.target.value)}
                >
                  <option value="">Tất cả chủ đề</option>
                  {listItems(topics.data).map((item) => (
                    <option key={item.topicId} value={item.topicId}>
                      {item.topicName}
                    </option>
                  ))}
                </SelectField>
              )}
              {tab === 'questions' ? (
                <label className="text-body-sm font-semibold">
                  Số lần dùng tối thiểu
                  <input
                    type="number"
                    min="0"
                    value={minUsed}
                    onChange={(event) => setMinUsed(event.target.value)}
                    className="mt-2 block w-32 rounded-xl border p-3"
                  />
                </label>
              ) : (
                <label className="text-body-sm font-semibold">
                  Kỳ dữ liệu
                  <input
                    value={period}
                    onChange={(event) => setPeriod(event.target.value)}
                    placeholder="VD: 2026-09"
                    className="mt-2 block w-36 rounded-xl border p-3"
                  />
                </label>
              )}
              <Button variant="secondary" onClick={resource.reload}>
                Làm mới
              </Button>
            </>
          }
        >
          {() => (
            <Resource resource={resource}>{(items) => <LecturerAnalyticsTable tab={tab} rows={items} />}</Resource>
          )}
        </Tabs>
      </div>
    </LecturerPageShell>
  );
}

export function LecturerExperimentsApiPage() {
  const subjects = useResource('/api/v1/subjects?isActive=true', true);
  const classes = useResource('/api/v1/classes', true);
  const subjectRows = listItems(subjects.data);
  const classRows = listItems(classes.data);
  const [subjectId, setSubjectId] = useState('');
  const selectedSubject = subjectId || subjectRows[0]?.subjectId || '';
  const experiments = useApiData(
    selectedSubject ? `/api/v1/experiments?subjectId=${encodeURIComponent(selectedSubject)}` : null
  );
  const [modal, setModal] = useState(null);
  const [lastAssignment, setLastAssignment] = useState(null);
  const action = useAction();
  const submit = async (event) => {
    event.preventDefault();
    if (action.busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (modal === 'create' && values.sceneAssetsJson?.trim()) {
      try {
        JSON.parse(values.sceneAssetsJson);
      } catch {
        action.setError('Cấu hình tài nguyên phải là JSON hợp lệ.');
        return;
      }
    }
    if (modal !== 'create' && !Number.isFinite(new Date(values.dueDate).getTime())) {
      action.setError('Vui lòng chọn hạn nộp hợp lệ.');
      return;
    }
    let result;
    if (modal === 'create')
      result = await action.run(
        '/api/v1/experiments',
        {
          method: 'POST',
          body: {
            subjectId: selectedSubject,
            title: values.title,
            description: values.description,
            sceneAssetUrl: values.sceneAssetUrl,
            sceneAssetsJson: values.sceneAssetsJson || '',
            instructions: values.instructions || '',
            orderIndex: Number(values.orderIndex),
          },
        },
        'Đã tạo thí nghiệm.'
      );
    else
      result = await action.run(
        `/api/v1/experiments/${encodeURIComponent(modal.experimentId)}/assign`,
        {
          method: 'POST',
          body: {
            classId: values.classId,
            dueDate: new Date(values.dueDate).toISOString(),
            instructionsOverride: values.instructionsOverride || '',
          },
        },
        'Đã giao thí nghiệm cho lớp.'
      );
    if (result) {
      if (modal !== 'create') setLastAssignment(result);
      setModal(null);
      experiments.reload();
    }
  };
  const subjectSelect = (
    <SelectField
      label="Học phần"
      name="experiment-subject"
      className="min-w-64"
      value={selectedSubject}
      onChange={(event) => setSubjectId(event.target.value)}
    >
      <option value="">Chọn học phần</option>
      {subjectRows.map((item) => (
        <option key={item.subjectId} value={item.subjectId}>
          {item.subjectCode ? `${item.subjectCode} · ` : ''}
          {item.subjectName || item.subjectId}
        </option>
      ))}
    </SelectField>
  );
  return (
    <LecturerPageShell
      currentPage="lecturer_labs.html"
      title="Thí nghiệm 3D"
      eyebrow="THỰC HÀNH"
      description="Tạo và giao thí nghiệm theo học phần, lớp học."
    >
      <AuthAlert>{action.notice}</AuthAlert>
      <AuthAlert error>{action.error}</AuthAlert>
      {lastAssignment && (
        <Card className="mt-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Đợt giao thí nghiệm gần nhất</h2>
              <p className="mt-1 text-body-sm text-[#64748B]">
                Đã giao cho lớp{' '}
                {classRows.find((item) => item.classId === lastAssignment.classId)?.classCode ||
                  classRows.find((item) => item.classId === lastAssignment.classId)?.className ||
                  'đã chọn'}
                {lastAssignment.dueDate
                  ? ` · Hạn nộp: ${new Date(lastAssignment.dueDate).toLocaleString('vi-VN')}`
                  : ''}
                .
              </p>
            </div>
            <Button variant="secondary" onClick={() => setLastAssignment(null)}>
              Ẩn
            </Button>
          </div>
          {lastAssignment.instructionsOverride && (
            <p className="mt-3 rounded-xl bg-[#F8FAFC] p-3 text-body-sm">{lastAssignment.instructionsOverride}</p>
          )}
        </Card>
      )}
      {modal && (
        <Modal
          busy={action.busy}
          title={modal === 'create' ? 'Tạo thí nghiệm' : `Giao: ${modal.title}`}
          onClose={() => !action.busy && setModal(null)}
        >
          <AuthAlert error>{action.error}</AuthAlert>
          <Form className="grid gap-4" onSubmit={submit}>
            {modal === 'create' ? (
              <>
                <input name="title" required placeholder="Tên thí nghiệm" className="rounded-xl border p-3" />
                <textarea name="description" required placeholder="Mô tả" className="rounded-xl border p-3" />
                <input
                  name="sceneAssetUrl"
                  required
                  placeholder="URL tài nguyên 3D"
                  className="rounded-xl border p-3"
                />
                <textarea
                  name="sceneAssetsJson"
                  placeholder="Cấu hình tài nguyên (nếu có)"
                  className="rounded-xl border p-3"
                />
                <textarea name="instructions" placeholder="Hướng dẫn" className="rounded-xl border p-3" />
                <input
                  name="orderIndex"
                  type="number"
                  min="0"
                  required
                  placeholder="Thứ tự"
                  className="rounded-xl border p-3"
                />
              </>
            ) : (
              <>
                <SelectField label="Lớp học" name="classId" required>
                  <option value="">Chọn lớp</option>
                  {classRows
                    .filter((item) => !item.subjectId || item.subjectId === selectedSubject)
                    .map((item) => (
                      <option key={item.classId} value={item.classId}>
                        {item.classCode || item.className || item.classId}
                      </option>
                    ))}
                </SelectField>
                <input name="dueDate" required type="datetime-local" className="rounded-xl border p-3" />
                <textarea
                  name="instructionsOverride"
                  placeholder="Hướng dẫn bổ sung"
                  className="rounded-xl border p-3"
                />
              </>
            )}
            <SubmitButton type="submit" disabled={action.busy}>
              {action.busy ? 'Đang lưu…' : modal === 'create' ? 'Tạo thí nghiệm' : 'Giao bài'}
            </SubmitButton>
          </Form>
        </Modal>
      )}
      <div className="mt-6">
        <Tabs
          items={[{ id: 'experiments', label: 'Danh sách thí nghiệm' }]}
          actions={
            <>
              {subjectSelect}
              <Button disabled={!selectedSubject} onClick={() => setModal('create')}>
                Tạo thí nghiệm
              </Button>
            </>
          }
        >
          {() => (
            <Resource resource={experiments}>
              {(items) => (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {items.length ? (
                    items.map((item) => (
                      <Card key={item.experimentId} className="p-5">
                        <h2 className="font-bold">{item.title}</h2>
                        <p className="mt-2 text-body-sm text-[#64748B]">{item.description || 'Chưa có mô tả.'}</p>
                        <Button className="mt-4" variant="secondary" onClick={() => setModal(item)}>
                          Giao cho lớp
                        </Button>
                      </Card>
                    ))
                  ) : (
                    <Card className="p-5 text-[#64748B]">Chưa có thí nghiệm cho học phần đã chọn.</Card>
                  )}
                </div>
              )}
            </Resource>
          )}
        </Tabs>
      </div>
    </LecturerPageShell>
  );
}
