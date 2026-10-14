import { AuthoringSection } from '../../components/AuthoringSection.jsx';
import { AuthoringPanel } from '../../components/AuthoringPanel.jsx';
import { navigate } from '../../lib/navigation.js';
import { queryPath, localDateTimeInput } from '../../lib/lecturerUtils.js';
import { FormField as SharedFormField } from '../../components/FormField.jsx';
import { ExperimentGradingPanel } from './LecturerExperimentGrading.jsx';
import { SelectField as SharedSelectField } from '../../components/SelectField.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormDialog as Modal } from '../../components/FormDialog.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { DashboardOverview } from '../../components/DashboardOverview.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { UnifiedDashboardBanner } from '../../components/UnifiedDashboardBanner.jsx';
import { Table, useResource } from './LecturerShared.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { ActionMenu } from '../../components/ActionMenu.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { StudentSearchField } from '../../components/StudentSearchField.jsx';
import { useCloCatalog } from '../../components/CloPicker.jsx';
import { validateCloIds } from '../../lib/cloSelection.js';
import { getDemoSession } from '../../lib/demoSession.js';
import { useTeachingScope } from './LecturerTeachingScope.jsx';
import { listItems, useApiData } from '../../hooks/useApiData.js';
import { api, apiRequest } from '../../lib/apiClient.js';
import { questionTopicName } from '../../lib/topicLabels.js';
import { labelOf } from '../../lib/lecturerUtils.js';
import {
  examMaxScore,
  tenPointScore,
  rawScoreFromTen,
  attemptScore,
  formatAttemptScore,
} from '../../lib/examScoring.js';

const nameOf = (row) =>
  row?.className || row?.classCode || row?.title || row?.name || row?.subjectName || row?.username || '—';
const state = (value) => <StatusBadge status={value} />;
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
    <SelectField label={label} name="classId" value={value} onChange={(event) => onChange(event.target.value)}>
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
    setNotice,
    feedback: (
      <>
        <AuthAlert>{notice}</AuthAlert>
        <AuthAlert error>{error}</AuthAlert>
      </>
    ),
    clear: () => {
      setNotice('');
      setError('');
    },
  };
}

function ExamManagementModal({ exam, subjectId, initialTab = 'questions', pageMode = false, onClose, onChanged }) {
  const Container = pageMode ? AuthoringPanel : Modal;
  const [tab, setTab] = useState(initialTab);
  const [questionTopicId, setQuestionTopicId] = useState('');
  const [questionDifficulty, setQuestionDifficulty] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [gradingAttempt, setGradingAttempt] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [viewAttempt, setViewAttempt] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferStudent, setTransferStudent] = useState(null);
  const detail = useApiData(`/api/v1/exams/${encodeURIComponent(exam.examId)}`);
  const examQuestions = useApiData(`/api/v1/exams/${encodeURIComponent(exam.examId)}/questions`);
  const attempts = useApiData(`/api/v1/exams/${encodeURIComponent(exam.examId)}/attempts`);
  const attemptDetail = useApiData(
    viewAttempt ? `/api/v1/exams/attempts/${encodeURIComponent(viewAttempt.attemptId)}` : null
  );
  const roster = useApiData(`/api/v1/exams/${encodeURIComponent(exam.examId)}/roster`);
  const classOptions = useResource('/api/v1/classes', true);
  const candidateTopics = useApiData(subjectId ? `/api/v1/subjects/${encodeURIComponent(subjectId)}/topics` : null);
  const candidateQuery = new URLSearchParams({ subjectId, page: '0', size: '100' });
  if (questionTopicId) candidateQuery.set('topicId', questionTopicId);
  if (questionDifficulty) candidateQuery.set('difficultyLevel', questionDifficulty);
  const candidates = useApiData(subjectId ? `/api/v1/questions?${candidateQuery}` : null);
  const action = useAction();
  const questions = listItems(examQuestions.data);
  const maxScore = examQuestions.loading || examQuestions.error ? null : examMaxScore(questions);
  const questionsLocked = attempts.loading || Boolean(attempts.error) || listItems(attempts.data).length > 0;
  const openGrading = (attempt) => {
    action.clear();
    setGradeValue(tenPointScore(attempt.totalScore, maxScore) ?? '');
    setGradingAttempt(attempt);
  };
  const topicNameOf = (question) => questionTopicName(question, listItems(candidateTopics.data));
  const addQuestion = async (question) => {
    if (questionsLocked) {
      action.setError('Đề đã có lượt làm, không thể thay đổi câu hỏi.');
      return;
    }
    const result = await action.run(
      `/api/v1/exams/${encodeURIComponent(exam.examId)}/questions`,
      { method: 'POST', body: { questionId: question.questionId } },
      'Đã thêm câu hỏi vào đề.'
    );
    if (result) {
      examQuestions.reload();
      detail.reload();
      onChanged?.();
    }
  };
  const generate = async () => {
    if (questionsLocked) {
      action.setError('Đề đã có lượt làm, không thể thay đổi câu hỏi.');
      return;
    }
    const result = await action.run(
      `/api/v1/exams/${encodeURIComponent(exam.examId)}/generate-questions`,
      { method: 'POST' },
      'Đã sinh câu hỏi theo ma trận.'
    );
    if (result) {
      examQuestions.reload();
      detail.reload();
      onChanged?.();
    }
  };
  const removeQuestion = async () => {
    if (!removeTarget) return;
    if (questionsLocked) {
      action.setError('Đề đã có lượt làm, không thể thay đổi câu hỏi.');
      return;
    }
    const result = await action.run(
      `/api/v1/exams/${encodeURIComponent(exam.examId)}/questions/${encodeURIComponent(removeTarget.questionId)}`,
      { method: 'DELETE' },
      'Đã gỡ câu hỏi khỏi đề.'
    );
    if (result) {
      setRemoveTarget(null);
      examQuestions.reload();
      detail.reload();
      onChanged?.();
    }
  };
  const grade = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    let rawScore;
    try {
      if (!['SUBMITTED', 'GRADED'].includes(gradingAttempt?.status)) throw new Error('Chỉ chấm bài đã nộp.');
      rawScore = rawScoreFromTen(values.totalScore, maxScore);
      if (
        gradingAttempt.status === 'GRADED' &&
        rawScore !== Number(gradingAttempt.totalScore) &&
        !values.feedback.trim()
      )
        throw new Error('Nhập nhận xét giải thích lý do điều chỉnh điểm.');
    } catch (error) {
      action.setError(error.message);
      return;
    }
    const result = await action.run(
      `/api/v1/exams/attempts/${encodeURIComponent(gradingAttempt.attemptId)}/grade`,
      {
        method: 'PUT',
        body: {
          totalScore: rawScore,
          feedback: `Điểm quy đổi: ${tenPointScore(rawScore, maxScore)}/10.${values.feedback.trim() ? ` ${values.feedback.trim()}` : ''}`,
        },
      },
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
    const student = transferStudent;
    if (!student) {
      action.setError('Chọn một sinh viên từ kết quả tìm kiếm.');
      return;
    }
    const result = await action.run(
      `/api/v1/exams/${encodeURIComponent(exam.examId)}/transfers`,
      {
        method: 'POST',
        body: {
          studentId: student.userId,
          originalClassId: student.originalClassId,
          reason: values.reason.trim() || null,
        },
      },
      'Đã thêm sinh viên vào danh sách thi ghép.'
    );
    if (result) {
      setTransferOpen(false);
      setTransferStudent(null);
      roster.reload();
    }
  };
  return (
    <>
      {removeTarget && (
        <ConfirmDialog
          title="Gỡ câu hỏi khỏi đề"
          description="Việc gỡ câu hỏi phụ thuộc vào trạng thái bài làm của đề thi."
          confirmLabel="Gỡ câu hỏi"
          busy={action.busy}
          onCancel={() => !action.busy && setRemoveTarget(null)}
          onConfirm={removeQuestion}
        />
      )}
      <Container
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
              <Button disabled={action.busy || questionsLocked} onClick={generate}>
                Sinh theo ma trận
              </Button>
            ) : null
          }
        >
          {() =>
            tab === 'questions' ? (
              <>
                {listItems(attempts.data).length > 0 && (
                  <p className="mb-4 text-body-sm text-[#64748B]">
                    Đề đã có lượt làm. Danh sách câu hỏi được giữ cố định.
                  </p>
                )}
                <Resource resource={examQuestions}>
                  {(rows) => (
                    <Table
                      rows={rows}
                      columns={['Câu hỏi', 'Chủ đề', 'Độ khó', '']}
                      cells={(item) => [
                        item.content || item.questionText || '—',
                        topicNameOf(item),
                        <span>
                          {labelOf(item.difficultyLevel)}
                          {item.scoreWeight != null ? ` · ${item.scoreWeight} điểm` : ''}
                        </span>,
                        <Button
                          variant="secondary"
                          disabled={action.busy || questionsLocked}
                          onClick={() => setRemoveTarget(item)}
                        >
                          Gỡ
                        </Button>,
                      ]}
                    />
                  )}
                </Resource>
                {subjectId ? (
                  <>
                    <Card className="mt-5 grid gap-3 p-4 md:grid-cols-3">
                      <SharedFormField
                        value={questionSearch}
                        onChange={(event) => setQuestionSearch(event.target.value)}
                        placeholder="Nhập nội dung câu hỏi"
                        className="mt-2 block w-full"
                        label={<>Tìm câu hỏi</>}
                        wrapperClassName="text-body-sm font-semibold md:col-span-3"
                      />
                      <SelectField
                        label="Chủ đề"
                        value={questionTopicId}
                        onChange={(event) => setQuestionTopicId(event.target.value)}
                      >
                        <option value="">Tất cả chủ đề</option>
                        {listItems(candidateTopics.data).map((topic) => (
                          <option key={topic.topicId} value={topic.topicId}>
                            {topic.topicName}
                          </option>
                        ))}
                      </SelectField>
                      <SelectField
                        label="Độ khó"
                        value={questionDifficulty}
                        onChange={(event) => setQuestionDifficulty(event.target.value)}
                      >
                        <option value="">Tất cả độ khó</option>
                        {['EASY', 'MEDIUM', 'HARD'].map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </SelectField>
                      <p className="self-end pb-3 text-body-sm text-[#64748B]">Chỉ hiển thị câu hỏi đã được duyệt.</p>
                    </Card>
                    <Resource resource={candidates}>
                      {(rows) => {
                        const available = rows.filter(
                          (item) =>
                            item.approvalStatus === 'APPROVED' &&
                            !questions.some((question) => question.questionId === item.questionId) &&
                            (!questionSearch.trim() ||
                              item.content?.toLowerCase().includes(questionSearch.trim().toLowerCase()))
                        );
                        return available.length ? (
                          <Table
                            rows={available}
                            columns={['Ngân hàng câu hỏi', 'Chủ đề', 'Độ khó', '']}
                            cells={(item) => [
                              item.content || '—',
                              topicNameOf(item),
                              item.difficultyLevel || '—',
                              <Button disabled={action.busy || questionsLocked} onClick={() => addQuestion(item)}>
                                Thêm vào đề
                              </Button>,
                            ]}
                          />
                        ) : (
                          <Card className="mt-5 p-5 text-body-sm text-[#64748B]">
                            Không có câu hỏi đã duyệt phù hợp để thêm vào đề.
                          </Card>
                        );
                      }}
                    </Resource>
                  </>
                ) : (
                  <Card className="mt-4 p-4">Chưa có dữ liệu học phần của lớp để tải Ngân hàng câu hỏi.</Card>
                )}
              </>
            ) : tab === 'attempts' ? (
              <Resource resource={attempts}>
                {(rows) => (
                  <>
                    <Card className="mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
                      <div>
                        <strong>{rows.length}</strong>
                        <p className="text-body-sm text-[#64748B]">lượt làm</p>
                      </div>
                      <div>
                        <strong>{rows.filter((item) => item.status === 'SUBMITTED').length}</strong>
                        <p className="text-body-sm text-[#64748B]">đã nộp</p>
                      </div>
                      <div>
                        <strong>{rows.filter((item) => attemptScore(item, questions) !== null).length}</strong>
                        <p className="text-body-sm text-[#64748B]">đã có điểm</p>
                      </div>
                    </Card>
                    {!maxScore && !examQuestions.loading && (
                      <p role="alert" className="mb-4 text-primary">
                        {examQuestions.error || 'Chưa có thang điểm hợp lệ để chấm bài.'}
                      </p>
                    )}
                    <Table
                      rows={rows}
                      columns={['Sinh viên', 'Lần làm', 'Trạng thái', 'Nộp bài', 'Điểm', '']}
                      cells={(item) => [
                        item.studentName || item.studentCode || item.studentUsername || '—',
                        item.attemptNumber ?? '—',
                        item.status || '—',
                        item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : 'Chưa nộp',
                        formatAttemptScore(item, questions),
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => setViewAttempt(item)}>
                            Xem chi tiết
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={action.busy || !maxScore || !['SUBMITTED', 'GRADED'].includes(item.status)}
                            onClick={() => openGrading(item)}
                          >
                            {item.status !== 'GRADED' ? 'Chấm bài' : 'Sửa điểm'}
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
                            setTransferStudent(null);
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
      </Container>
      {transferOpen && (
        <Modal
          wide
          title="Thêm sinh viên thi ghép"
          busy={action.busy}
          onClose={() => !action.busy && setTransferOpen(false)}
        >
          <Form className="grid gap-4" onSubmit={addTransfer}>
            <p className="text-body-sm text-[#64748B]">Tìm sinh viên, chọn lớp gốc rồi thêm vào danh sách thi ghép.</p>
            <StudentSearchField
              disabled={action.busy}
              onSelect={setTransferStudent}
              mapResults={(student) => {
                const classes = new Map(listItems(classOptions.data).map((item) => [item.classId, item]));
                const matches = (student.enrolledClasses || []).filter(
                  (item) =>
                    item.status === 'ACTIVE' &&
                    item.classId !== exam.classId &&
                    (!subjectId || item.subjectId === subjectId || classes.get(item.classId)?.subjectId === subjectId)
                );
                return matches.length
                  ? matches.map((item) => ({
                      ...student,
                      originalClassId: item.classId,
                      originalClassCode: item.classCode || classes.get(item.classId)?.classCode,
                    }))
                  : [{ ...student, originalClassId: null, originalClassCode: 'Hệ thống tự xác định' }];
              }}
            />
            <SharedFormField
              name="reason"
              rows={3}
              className="mt-2 block w-full"
              multiline
              label={<>Lý do</>}
              wrapperClassName="text-body-sm font-semibold"
            />
            <SubmitButton type="submit" busy={action.busy} disabled={!transferStudent}>
              Thêm vào đề thi
            </SubmitButton>
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
                      <strong>Trạng thái:</strong> {labelOf(item.status)}
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
                      <strong>Điểm:</strong>{' '}
                      {formatAttemptScore(item, item.questions?.length ? item.questions : questions)}
                    </p>
                  </Card>
                  {item.status === 'SUBMITTED' && (
                    <Button
                      disabled={action.busy || !maxScore}
                      onClick={() => {
                        setViewAttempt(null);
                        openGrading(item);
                      }}
                    >
                      Chấm bài này
                    </Button>
                  )}
                  {item.questions?.length > 0 && (
                    <Table
                      rows={item.questions}
                      columns={['Câu hỏi', 'Câu trả lời', 'Kết quả', 'Điểm câu /10']}
                      cells={(question) => {
                        const selectedIds = question.selectedOptionIds || [];
                        const answer =
                          question.answerText?.trim() ||
                          (question.options || [])
                            .filter((option) => selectedIds.includes(option.optionId))
                            .map((option) => option.content)
                            .join(', ');
                        const total = examMaxScore(item.questions);
                        return [
                          question.content,
                          answer || 'Chưa trả lời',
                          item.status !== 'GRADED'
                            ? 'Chưa chấm'
                            : !answer
                              ? 'Chưa trả lời'
                              : question.isCorrect === true
                                ? 'Đúng'
                                : question.isCorrect === false
                                  ? 'Sai'
                                  : 'Đã chấm',
                          item.status === 'GRADED'
                            ? `${tenPointScore(question.score ?? 0, total) ?? '—'} / ${tenPointScore(question.scoreWeight ?? 1, total) ?? '—'}`
                            : 'Chưa chấm',
                        ];
                      }}
                    />
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
            {action.error && (
              <p role="alert" className="text-primary">
                {action.error}
              </p>
            )}
            <p className="text-body-sm text-[#64748B]">Điểm theo thang 10, quy đổi theo trọng số từng câu trong đề.</p>
            {maxScore && String(gradeValue).trim() !== '' && Number(gradeValue) >= 0 && Number(gradeValue) <= 10 && (
              <p className="text-body-sm text-[#64748B]">
                Điểm quy đổi sau khi lưu: {tenPointScore(rawScoreFromTen(gradeValue, maxScore), maxScore)}/10.
              </p>
            )}
            <SharedFormField
              name="totalScore"
              type="number"
              min="0"
              max="10"
              step="0.01"
              required
              value={gradeValue}
              onChange={(event) => setGradeValue(event.target.value)}
              className="mt-2 block w-full"
              label={<>Điểm cuối cùng (0–10)</>}
            />
            <SharedFormField
              name="feedback"
              defaultValue={gradingAttempt.feedback || ''}
              rows={4}
              className="mt-2 block w-full"
              multiline
              label={<>Nhận xét gửi cho sinh viên</>}
              required={
                gradingAttempt.status === 'GRADED' &&
                tenPointScore(gradingAttempt.totalScore, maxScore) !== Number(gradeValue)
              }
            />
            <SubmitButton busy={action.busy} disabled={!maxScore}>
              Lưu điểm
            </SubmitButton>
          </Form>
        </Modal>
      )}
    </>
  );
}

export function MatrixManager({ classes, createPage = false, scopedSubjectId = '' }) {
  const [subjectId, setSubjectId] = useState(
    () => scopedSubjectId || new URLSearchParams(window.location.search).get('subjectId') || ''
  );
  const [modal, setModal] = useState(createPage ? { mode: 'create' } : null);
  const EditorContainer = createPage ? AuthoringPanel : Modal;
  const [details, setDetails] = useState([
    { topicId: '', difficultyLevel: 'MEDIUM', numQuestions: 1, weightPercent: 100 },
  ]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [validation, setValidation] = useState(null);
  const adminMode = getDemoSession()?.role === 'ADMIN';
  const assignedScope = useTeachingScope(!adminMode);
  const globalSubjects = useResource(adminMode ? '/api/v1/subjects' : null, true);
  const subjects = adminMode ? globalSubjects : assignedScope.subjects;
  const matrixSubjectId = modal?.row?.subjectId || subjectId;
  const topics = useApiData(matrixSubjectId ? `/api/v1/subjects/${encodeURIComponent(matrixSubjectId)}/topics` : null);
  const clos = useCloCatalog([matrixSubjectId]);
  const matrices = useApiData(`/api/v1/exam-matrices${subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''}`);
  const action = useAction();
  const openCreate = () => {
    if (scopedSubjectId) {
      setDetails([{ topicId: '', difficultyLevel: 'MEDIUM', numQuestions: 1, weightPercent: 100 }]);
      setModal({ mode: 'create' });
    } else navigate(queryPath('lecturer_matrix_create.html', { subjectId }));
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
    const totalPoints = Number(values.totalPoints);
    const weightTotal = details.reduce((total, item) => total + Number(item.weightPercent || 0), 0);
    const duplicateCriteria = new Set();
    if (
      !details.length ||
      !values.matrixName.trim() ||
      !Number.isFinite(totalPoints) ||
      totalPoints <= 0 ||
      details.some((item) => {
        const key = `${item.topicId}:${item.cloId || ''}:${item.difficultyLevel}`;
        const duplicate = duplicateCriteria.has(key);
        duplicateCriteria.add(key);
        return !item.topicId || Number(item.numQuestions) < 1 || Number(item.weightPercent) <= 0 || duplicate;
      })
    ) {
      action.setError(
        'Nhập tên, tổng điểm; mỗi dòng cần chủ đề, mức khó, ít nhất 1 câu và trọng số hợp lệ. Không lặp cùng chủ đề, CLO và mức khó.'
      );
      return;
    }
    if (Math.abs(weightTotal - 100) > 0.01) {
      action.setError(`Tổng trọng số hiện là ${weightTotal}%; cần bằng 100%.`);
      return;
    }
    if (!matrixSubjectId || !listItems(subjects.data).some((item) => item.subjectId === matrixSubjectId)) {
      action.setError('Vui lòng chọn học phần.');
      return;
    }
    if (details.some((item) => !listItems(topics.data).some((topic) => topic.topicId === item.topicId))) {
      action.setError('Chủ đề đã chọn không thuộc học phần này.');
      return;
    }
    const cloIds = details.map((item) => item.cloId).filter(Boolean);
    if (cloIds.length && (clos.loading || clos.error)) {
      action.setError('Vui lòng tải đầy đủ CLO trước khi lưu.');
      return;
    }
    const cloError = validateCloIds(cloIds, clos.data, matrixSubjectId);
    if (cloError) {
      action.setError(cloError);
      return;
    }
    const body = {
      subjectId: modal.row?.subjectId || subjectId,
      matrixName: values.matrixName.trim(),
      examType: values.examType,
      description: values.description.trim(),
      totalPoints,
      details: details.map((item) => ({
        topicId: item.topicId,
        cloId: item.cloId || null,
        difficultyLevel: item.difficultyLevel,
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
      if (createPage) {
        navigate('lecturer_assessments.html?tab=matrices');
        return;
      }
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
      {!modal && action.feedback}
      <AuthAlert error>{!modal && (subjects.error || topics.error || clos.error)}</AuthAlert>
      {deleteTarget && (
        <ConfirmDialog
          title="Xóa ma trận đề"
          description={`Xóa ${deleteTarget.matrixName || 'ma trận đề'}? Ma trận đã được sử dụng có thể không xóa được.`}
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
            disabled={Boolean(scopedSubjectId)}
            onChange={(event) => {
              setSubjectId(event.target.value);
              if (createPage)
                setDetails([{ topicId: '', difficultyLevel: 'MEDIUM', numQuestions: 1, weightPercent: 100 }]);
            }}
            className="min-w-64"
          >
            <option value="">{createPage ? 'Chọn học phần' : 'Tất cả học phần'}</option>
            {listItems(subjects.data).map((item) => (
              <option key={item.subjectId} value={item.subjectId}>
                {item.subjectCode ? `${item.subjectCode} · ` : ''}
                {item.subjectName}
              </option>
            ))}
          </SelectField>
          {!createPage && (
            <Button disabled={!subjectId || action.busy} onClick={openCreate}>
              Tạo ma trận
            </Button>
          )}
        </div>
      </Card>
      {!createPage && (
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
      )}
      {modal && (
        <EditorContainer
          title={modal.mode === 'edit' ? 'Chỉnh sửa ma trận đề' : 'Tạo ma trận đề'}
          busy={action.busy}
          onClose={() =>
            !action.busy && (createPage ? navigate('lecturer_assessments.html?tab=matrices') : setModal(null))
          }
        >
          {(action.error || clos.error) && (
            <p role="alert" className="mb-4 text-body-sm text-red-700">
              {action.error || clos.error}
            </p>
          )}
          <Form className="grid gap-4" onSubmit={save}>
            <SharedFormField
              name="matrixName"
              required
              defaultValue={modal.row?.matrixName || ''}
              className="mt-2 block w-full"
              label={<>Tên ma trận</>}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SharedSelectField
                name="examType"
                defaultValue={modal.row?.examType || 'QUIZ'}
                className="mt-2 block w-full"
                label={<>Loại đề</>}
              >
                <option value="PRACTICE">Luyện tập</option>
                <option value="QUIZ">Kiểm tra ngắn</option>
                <option value="MIDTERM">Giữa kỳ</option>
                {getDemoSession()?.role === 'ADMIN' && <option value="FINAL">Cuối kỳ</option>}
              </SharedSelectField>
              <SharedFormField
                name="totalPoints"
                type="number"
                min="0"
                step="0.5"
                required
                defaultValue={modal.row?.totalPoints ?? 10}
                className="mt-2 block w-full"
                label={<>Tổng điểm</>}
              />
            </div>
            <SharedFormField
              name="description"
              rows={3}
              defaultValue={modal.row?.description || ''}
              className="mt-2 block w-full"
              multiline
              label={<>Mô tả</>}
            />
            <Card className="p-4">
              <h3 className="font-bold">Cấu trúc đề</h3>
              <p className="mt-1 text-body-sm text-[#64748B]">
                Mỗi dòng xác định số câu cần lấy từ một chủ đề ở một mức độ khó. Tổng trọng số của các dòng phải bằng
                100%.
              </p>
              {details.map((item, index) => (
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5" key={index}>
                  <SharedSelectField
                    value={item.topicId}
                    name={`topicId-${index}`}
                    onChange={(event) =>
                      setDetails((rows) =>
                        rows.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                topicId: event.target.value,
                              }
                            : row
                        )
                      )
                    }
                    label={
                      <>
                        <span>Chủ đề *</span>
                      </>
                    }
                    className="grid gap-1 text-body-sm"
                  >
                    <option value="">Chọn chủ đề</option>
                    {listItems(topics.data).map((topic) => (
                      <option key={topic.topicId} value={topic.topicId}>
                        {topic.topicName}
                      </option>
                    ))}
                  </SharedSelectField>
                  <SharedSelectField
                    name={`cloId-${index}`}
                    label="CLO"
                    value={item.cloId || ''}
                    disabled={clos.loading || Boolean(clos.error)}
                    onChange={(event) =>
                      setDetails((rows) =>
                        rows.map((row, i) => (i === index ? { ...row, cloId: event.target.value } : row))
                      )
                    }
                  >
                    <option value="">Không giới hạn CLO</option>
                    {clos.data
                      .filter((clo) => clo.subjectId === matrixSubjectId && (clo.isActive || clo.cloId === item.cloId))
                      .map((clo) => (
                        <option key={clo.cloId} value={clo.cloId} disabled={!clo.isActive}>
                          {clo.cloCode}
                          {!clo.isActive ? ' · ngừng hoạt động' : ''}
                        </option>
                      ))}
                  </SharedSelectField>
                  <SharedSelectField
                    value={item.difficultyLevel}
                    onChange={(event) =>
                      setDetails((rows) =>
                        rows.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                difficultyLevel: event.target.value,
                              }
                            : row
                        )
                      )
                    }
                    label={
                      <>
                        <span>Mức độ khó *</span>
                      </>
                    }
                    className="grid gap-1 text-body-sm"
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </SharedSelectField>
                  <SharedFormField
                    aria-label="Số câu"
                    type="number"
                    min="1"
                    value={item.numQuestions}
                    onChange={(event) =>
                      setDetails((rows) =>
                        rows.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                numQuestions: event.target.value,
                              }
                            : row
                        )
                      )
                    }
                    className=""
                    label={
                      <>
                        <span>Số câu *</span>
                      </>
                    }
                    wrapperClassName="grid gap-1 text-body-sm"
                  />
                  <SharedFormField
                    aria-label="Trọng số"
                    type="number"
                    min="1"
                    max="100"
                    value={item.weightPercent}
                    onChange={(event) =>
                      setDetails((rows) =>
                        rows.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                weightPercent: event.target.value,
                              }
                            : row
                        )
                      )
                    }
                    className=""
                    label={
                      <>
                        <span>Trọng số (%) *</span>
                      </>
                    }
                    wrapperClassName="grid gap-1 text-body-sm"
                  />
                </div>
              ))}
              <p className="mt-3 text-body-sm font-semibold text-[#475569]">
                Tổng số câu: {details.reduce((total, item) => total + (Number(item.numQuestions) || 0), 0)} · Tổng trọng
                số: {details.reduce((total, item) => total + (Number(item.weightPercent) || 0), 0)}%
              </p>
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
            <SubmitButton busy={action.busy} disabled={!subjectId || topics.loading || Boolean(topics.error)}>
              Lưu ma trận
            </SubmitButton>
          </Form>
        </EditorContainer>
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
      description="Theo dõi lớp học, kỳ thi và hoạt động giảng dạy."
      hideTitle
    >
      <div className="space-y-6">
        <UnifiedDashboardBanner role="LECTURER" />
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
        <Card className="col-span-full p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-title-lg font-medium">Lớp phụ trách</h2>
            <a
              href="lecturer_courses.html"
              className="inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Xem tất cả lớp
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                arrow_forward
              </span>
            </a>
          </div>
          <Resource resource={classes}>
            {(items) => (
              <div className="dashboard-class-cards mt-4 grid gap-3">
                {items.slice(0, 8).map((item) => (
                  <Card
                    as="a"
                    key={item.classId}
                    href={`lecturer_courses.html?classId=${encodeURIComponent(item.classId)}`}
                    className="group flex min-w-0 items-center gap-3 p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-primary">
                      <span className="material-symbols-outlined" aria-hidden="true">
                        school
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-body-md font-semibold text-slate-900">{nameOf(item)}</h3>
                      {item.subjectName && item.subjectName !== nameOf(item) && (
                        <p className="mt-1 truncate text-body-sm text-slate-500" title={item.subjectName}>
                          {item.subjectName}
                        </p>
                      )}
                      {item.status && <div className="mt-2">{state(item.status)}</div>}
                    </div>
                    <span
                      className="material-symbols-outlined shrink-0 text-slate-400 group-hover:text-primary"
                      aria-hidden="true"
                    >
                      chevron_right
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </Resource>
        </Card>
      </DashboardOverview>
      </div>
    </LecturerPageShell>
  );
}

export function LecturerAssessmentApiPage({
  grading = false,
  createPage = false,
  embedded = false,
  scopedClassId = '',
}) {
  const Shell = embedded ? React.Fragment : LecturerPageShell;
  const classes = useResource('/api/v1/instructor/classes', true);
  const rows = listItems(classes.data);
  const [tab, setTab] = useState(
    new URLSearchParams(window.location.search).get('tab') === 'matrices' ? 'matrices' : 'exams'
  );
  const [classId, setClassId] = useState(
    () => scopedClassId || new URLSearchParams(window.location.search).get('classId') || ''
  );
  const [creating, setCreating] = useState(createPage);
  const [editing, setEditing] = useState(null);
  const [managing, setManaging] = useState(null);
  const [deleteExam, setDeleteExam] = useState(null);
  const [allExams, setAllExams] = useState([]);
  const [allExamsLoading, setAllExamsLoading] = useState(false);
  const [allExamsError, setAllExamsError] = useState('');
  const EditorContainer = createPage ? AuthoringPanel : Modal;
  const selected = scopedClassId || classId || 'ALL';
  const exams = useApiData(selected !== 'ALL' ? `/api/v1/exams/class/${encodeURIComponent(selected)}` : null);
  const matrices = useApiData(
    selected !== 'ALL' && rows.find((row) => row.classId === selected)?.subjectId
      ? `/api/v1/exam-matrices?subjectId=${encodeURIComponent(rows.find((row) => row.classId === selected).subjectId)}`
      : null
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
    if (selected === 'ALL' || !rows.some((item) => item.classId === selected)) {
      action.setError('Vui lòng chọn lớp học.');
      return;
    }
    if (!values.title.trim() || new Date(values.endTime) <= new Date(values.startTime)) {
      action.setError('Nhập tên đề thi và thời gian kết thúc sau thời gian bắt đầu.');
      return;
    }
    const body = {
      ...(!editing ? { classId: selected } : {}),
      ...(values.matrixId ? { matrixId: values.matrixId } : {}),
      title: values.title.trim(),
      examType: values.examType,
      durationMinutes: Number(values.durationMinutes),
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
      maxAttempts: Number(values.maxAttempts),
      shuffleQuestions: values.shuffleQuestions === 'on',
      shuffleOptions: values.shuffleOptions === 'on',
      isPublished: values.isPublished === 'on',
    };
    const result = await action.run(
      editing ? `/api/v1/exams/${encodeURIComponent(editing.examId)}` : '/api/v1/exams',
      { method: editing ? 'PUT' : 'POST', body },
      editing ? 'Đã cập nhật đề thi.' : 'Đã tạo đề thi.'
    );
    if (result) {
      setCreating(false);
      setEditing(null);
      examResource.reload();
      if (!editing) setManaging(result);
    }
  };
  const editExam = async (exam) => {
    const result = await action.run(`/api/v1/exams/${encodeURIComponent(exam.examId)}`, {}, '');
    if (result) setEditing(result);
  };
  return (
    <Shell
      {...(embedded
        ? {}
        : {
            currentPage: grading ? 'lecturer_grading.html' : 'lecturer_assessments.html',
            title: createPage ? 'Tạo đề thi' : grading ? 'Chấm bài kiểm tra' : 'Bài tập & kiểm tra',
            eyebrow: 'ĐÁNH GIÁ',
          })}
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
      {!createPage && (
        <div className="mt-6">
          <Tabs
            items={
              grading || embedded
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
                {tab === 'exams' && !scopedClassId && (
                  <ClassSelect classes={rows} value={selected} onChange={setClassId} />
                )}
                {!grading && tab === 'exams' && (
                  <Button
                    icon="add"
                    disabled={!selected || selected === 'ALL'}
                    onClick={() =>
                      embedded
                        ? setCreating(true)
                        : navigate(queryPath('lecturer_exam_create.html', { classId: selected }))
                    }
                  >
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
                        <button
                          className="text-left font-semibold text-primary hover:underline"
                          onClick={() => setManaging(item)}
                        >
                          {nameOf(item)}
                        </button>,
                        labelOf(item.examType),
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
      )}
      {createPage && <AuthAlert error>{matrices.error}</AuthAlert>}
      {(creating || editing) && (
        <EditorContainer
          title={editing ? 'Chỉnh sửa đề thi' : 'Thiết lập đề thi'}
          description="Chuẩn bị thông tin, cấu trúc và lịch thi trước khi thêm câu hỏi."
          icon="quiz"
          busy={action.busy}
          onClose={() => {
            if (createPage) {
              navigate(queryPath('lecturer_assessments.html', { classId }));
              return;
            }
            setCreating(false);
            setEditing(null);
          }}
        >
          <Form className="authoring-grouped-form" busy={action.busy} onSubmit={createExam}>
            <AuthoringSection
              number="01"
              icon="school"
              title="Thông tin chung"
              description="Chọn lớp học và đặt tên để dễ nhận diện đề thi."
            >
              <div className="authoring-fields authoring-fields--exam-info">
                {createPage && (
                  <Resource resource={classes}>
                    {() => <ClassSelect classes={rows} value={selected} onChange={setClassId} />}
                  </Resource>
                )}
                <SharedFormField
                  name="title"
                  defaultValue={editing?.title || ''}
                  placeholder="Ví dụ: Kiểm tra giữa kỳ — Vật lý đại cương"
                  required
                  className="mt-2 w-full"
                  label={<>Tên đề thi *</>}
                  wrapperClassName="text-body-sm font-semibold"
                />
              </div>
            </AuthoringSection>
            <div className="authoring-exam-columns">
              <AuthoringSection
                number="02"
                icon="quiz"
                title="Cấu trúc đề thi"
                description="Thiết lập loại đề, thời lượng làm bài và ma trận câu hỏi."
              >
                <div className="authoring-fields">
                  <SharedSelectField
                    name="examType"
                    defaultValue={editing?.examType || 'PRACTICE'}
                    label={<>Loại đề</>}
                    className="text-body-sm font-semibold"
                  >
                    <option value="PRACTICE">Luyện tập</option>
                    <option value="QUIZ">Kiểm tra ngắn</option>
                    <option value="MIDTERM">Giữa kỳ</option>
                  </SharedSelectField>
                  <SharedFormField
                    name="durationMinutes"
                    type="number"
                    min="1"
                    defaultValue={editing?.durationMinutes || ''}
                    required
                    className="mt-2 w-full"
                    label={<>Thời lượng (phút)</>}
                    wrapperClassName="text-body-sm font-semibold"
                  />
                </div>
                <SelectField
                  key={selected}
                  label="Ma trận đề"
                  name="matrixId"
                  defaultValue={editing?.matrixId || ''}
                  disabled={matrices.loading || Boolean(matrices.error)}
                >
                  <option value="">Không sử dụng ma trận</option>
                  {listItems(matrices.data).map((matrix) => (
                    <option key={matrix.matrixId} value={matrix.matrixId}>
                      {matrix.matrixName || matrix.name || 'Ma trận đề'}
                    </option>
                  ))}
                </SelectField>
              </AuthoringSection>
              <AuthoringSection
                number="03"
                icon="event"
                title="Lịch thi"
                description="Khoảng thời gian sinh viên được phép vào làm bài."
              >
                <div className="authoring-time-fields">
                  <SharedFormField
                    name="startTime"
                    type="datetime-local"
                    defaultValue={localDateTimeInput(editing?.startTime)}
                    required
                    className="mt-2 w-full"
                    label={<>Bắt đầu</>}
                    wrapperClassName="text-body-sm font-semibold"
                  />
                  <SharedFormField
                    name="endTime"
                    type="datetime-local"
                    defaultValue={localDateTimeInput(editing?.endTime)}
                    required
                    className="mt-2 w-full"
                    label={<>Kết thúc</>}
                    wrapperClassName="text-body-sm font-semibold"
                  />
                </div>
              </AuthoringSection>
            </div>

            <AuthoringSection number="03" icon="settings" title="Cấu hình bài thi">
              <SharedFormField
                label="Số lượt làm tối đa"
                name="maxAttempts"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={editing?.maxAttempts ?? 1}
              />
              <div className="mt-4 flex flex-wrap gap-5 text-body-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="exam-checkbox"
                    name="shuffleQuestions"
                    defaultChecked={editing?.shuffleQuestions ?? false}
                  />
                  Xáo trộn câu hỏi
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="exam-checkbox"
                    name="shuffleOptions"
                    defaultChecked={editing?.shuffleOptions ?? false}
                  />
                  Xáo trộn đáp án
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="exam-checkbox"
                    name="isPublished"
                    defaultChecked={editing?.isPublished ?? false}
                  />
                  Cho phép sinh viên truy cập
                </label>
              </div>
            </AuthoringSection>
            <div className="authoring-page__footer">
              <p>
                <span className="material-symbols-outlined" aria-hidden="true">
                  playlist_add
                </span>
                Sau khi tạo đề, bạn có thể thêm câu hỏi hoặc sinh câu hỏi từ ma trận.
              </p>
              <div className="authoring-page__footer-actions">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={action.busy}
                  onClick={() => {
                    if (createPage) {
                      navigate(queryPath('lecturer_assessments.html', { classId }));
                      return;
                    }
                    setCreating(false);
                    setEditing(null);
                  }}
                >
                  Hủy
                </Button>
                <SubmitButton
                  busy={action.busy}
                  disabled={selected === 'ALL' || classes.loading || Boolean(classes.error)}
                >
                  {editing ? 'Lưu thay đổi' : 'Tạo đề thi'}
                </SubmitButton>
              </div>
            </div>
          </Form>
        </EditorContainer>
      )}
      {createPage && !creating && (
        <Button variant="secondary" onClick={() => navigate(queryPath('lecturer_assessments.html', { classId }))}>
          Quay lại danh sách
        </Button>
      )}
      {managing && (
        <ExamManagementModal
          pageMode={createPage}
          exam={managing}
          subjectId={rows.find((item) => item.classId === (managing.classId || selected))?.subjectId}
          initialTab={grading ? 'attempts' : 'questions'}
          onClose={() =>
            createPage ? navigate(queryPath('lecturer_assessments.html', { classId })) : setManaging(null)
          }
          onChanged={examResource.reload}
        />
      )}
    </Shell>
  );
}

export function LecturerGradingApiPage() {
  return <LecturerAssessmentApiPage grading />;
}

export function LecturerExperimentsApiPage({ embedded = false, scopedClassId = '', scopedSubjectId = '' }) {
  const Shell = embedded ? React.Fragment : LecturerPageShell;
  const assignedScope = useTeachingScope();
  const subjects = assignedScope.subjects;
  const classes = assignedScope.classes;
  const subjectRows = listItems(subjects.data);
  const classRows = listItems(classes.data).filter((row) => !scopedClassId || row.classId === scopedClassId);
  const [subjectId, setSubjectId] = useState(scopedSubjectId);
  const selectedSubject = subjectId;
  const experiments = useApiData(
    `/api/v1/experiments${selectedSubject ? `?subjectId=${encodeURIComponent(selectedSubject)}` : ''}`
  );
  const [modal, setModal] = useState(null);
  const [lastAssignment, setLastAssignment] = useState(null);
  const action = useAction();
  const submit = async (event) => {
    event.preventDefault();
    if (action.busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    let sceneAssetsJson;
    if (modal === 'create' && values.sceneAssetsJson?.trim()) {
      try {
        sceneAssetsJson = JSON.parse(values.sceneAssetsJson);
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
            ...(values.description.trim() && { description: values.description.trim() }),
            ...(values.sceneAssetUrl.trim() && { sceneAssetUrl: values.sceneAssetUrl.trim() }),
            ...(sceneAssetsJson !== undefined && { sceneAssetsJson }),
            ...(values.instructions.trim() && { instructions: values.instructions.trim() }),
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
            classId: scopedClassId || values.classId,
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
      disabled={Boolean(scopedSubjectId)}
      onChange={(event) => setSubjectId(event.target.value)}
    >
      <option value="">Tất cả học phần</option>
      {subjectRows.map((item) => (
        <option key={item.subjectId} value={item.subjectId}>
          {item.subjectCode ? `${item.subjectCode} · ` : ''}
          {item.subjectName || item.subjectCode || 'Học phần'}
        </option>
      ))}
    </SelectField>
  );
  return (
    <Shell {...(embedded ? {} : { currentPage: 'lecturer_labs.html', title: 'Thí nghiệm 3D', eyebrow: 'THỰC HÀNH' })}>
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
                <SharedFormField label="Tên thí nghiệm" name="title" required placeholder="Nhập tên thí nghiệm" />
                <SharedFormField label="Mô tả" name="description" required multiline />
                <SharedFormField label="Liên kết mô phỏng 3D" name="sceneAssetUrl" required placeholder="https://…" />
                <SharedFormField
                  name="sceneAssetsJson"
                  label="Thiết lập mô phỏng (không bắt buộc)"
                  placeholder="Cấu hình tài nguyên (nếu có)"
                  className=""
                  multiline
                />
                <SharedFormField label="Hướng dẫn thực hiện" name="instructions" multiline />
                <SharedFormField
                  name="orderIndex"
                  label="Thứ tự hiển thị"
                  type="number"
                  min="0"
                  required
                  placeholder="Thứ tự"
                  className=""
                />
              </>
            ) : (
              <>
                <SelectField
                  label="Lớp học"
                  name="classId"
                  required
                  defaultValue={scopedClassId}
                  disabled={Boolean(scopedClassId)}
                >
                  <option value="">Chọn lớp</option>
                  {classRows
                    .filter((item) => !modal.subjectId || item.subjectId === modal.subjectId)
                    .map((item) => (
                      <option key={item.classId} value={item.classId}>
                        {item.classCode || item.className || 'Lớp học'}
                      </option>
                    ))}
                </SelectField>
                <SharedFormField label="Hạn nộp" name="dueDate" required type="datetime-local" />
                <SharedFormField
                  name="instructionsOverride"
                  label="Hướng dẫn bổ sung"
                  placeholder="Hướng dẫn bổ sung"
                  className=""
                  multiline
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
          items={[
            { id: 'experiments', label: 'Danh sách thí nghiệm' },
            { id: 'grading', label: 'Chấm bài thí nghiệm' },
          ]}
          actions={
            <>
              {subjectSelect}
              <Button disabled={!selectedSubject} onClick={() => setModal('create')}>
                Tạo thí nghiệm
              </Button>
            </>
          }
        >
          {(activeTab) =>
            activeTab === 'grading' ? (
              <ExperimentGradingPanel classes={{ ...classes, data: classRows }} classId={scopedClassId || undefined} />
            ) : (
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
            )
          }
        </Tabs>
      </div>
    </Shell>
  );
}

export function LecturerMatrixCreatePage() {
  return (
    <LecturerPageShell
      currentPage="lecturer_assessments.html"
      title="Tạo ma trận đề"
      eyebrow="ĐÁNH GIÁ"
      description="Thiết lập cấu trúc ma trận đề theo học phần."
    >
      <MatrixManager createPage />
    </LecturerPageShell>
  );
}
