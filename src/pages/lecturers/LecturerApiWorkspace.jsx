import { LoadingIndicator } from '../../components/LoadingIndicator.jsx';
import { TabAction } from '../../components/TabAction.jsx';
import { QuestionSelectionList } from '../../components/QuestionSelectionList.jsx';
import { QuestionDetailDialog } from '../../components/QuestionDetailDialog.jsx';
import '../../styles/exam-question-workspace.css';
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
import { StatCard } from '../../components/StatCard.jsx';
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
import { prepareExamDistribution, runExamDistribution, validateExamTargets } from '../../lib/examDistribution.js';
import { examUpdatePayload } from '../../lib/examEditing.js';
import { ExamQuestionConfirmation } from '../../components/ExamQuestionConfirmation.jsx';
import { labelOf } from '../../lib/lecturerUtils.js';
import {
  examMaxScore,
  tenPointScore,
  rawScoreFromTen,
  attemptScore,
  formatAttemptScore,
  attemptMaxScore,
  examScoringSummary,
  questionWeight,
} from '../../lib/examScoring.js';

const nameOf = (row) =>
  row?.className || row?.classCode || row?.title || row?.name || row?.subjectName || row?.username || '—';
const state = (value) => <StatusBadge status={value} />;
function Resource({ resource, children }) {
  if (resource.loading) return <LoadingIndicator className="mt-5 p-6">Đang tải dữ liệu…</LoadingIndicator>;
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

function ExamManagementPageContent({ children }) {
  return <div className="min-w-0">{children}</div>;
}

function ExamManagementModal({
  exam,
  subjectId,
  initialTab = 'questions',
  pageMode = false,
  onClose,
  onChanged,
  onEdit,
  onCopy,
  parentBusy = false,
  parentError,
  onTitleChange,
}) {
  const Container = pageMode ? ExamManagementPageContent : Modal;
  const [tab, setTab] = useState(initialTab === 'bank' ? 'questions' : initialTab);
  const [questionTopicId, setQuestionTopicId] = useState('');
  const [questionDifficulty, setQuestionDifficulty] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [viewQuestion, setViewQuestion] = useState(null);
  const [showEditWarning, setShowEditWarning] = useState(0);
  const [gradingAttempt, setGradingAttempt] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [viewAttempt, setViewAttempt] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [generateConfirmation, setGenerateConfirmation] = useState(false);
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
  const candidates = useApiData(tab === 'questions' && subjectId ? `/api/v1/questions?${candidateQuery}` : null);
  const action = useAction();
  const questions = listItems(examQuestions.data);
  const examInfo = { ...exam, ...detail.data };
  useEffect(() => {
    if (pageMode && examInfo.title) onTitleChange?.(examInfo.title);
  }, [pageMode, examInfo.title, onTitleChange]);
  const nextQuestionOrder = questions.reduce((maximum, item) => Math.max(maximum, Number(item.orderIndex) || 0), 0) + 1;
  const maxScore = examQuestions.loading || examQuestions.error ? null : examMaxScore(questions);
  const gradingMaxScore = attemptMaxScore(gradingAttempt, questions);
  const scoringInfo = examScoringSummary(detail.data || exam, questions);
  const attemptCount = listItems(attempts.data).length;
  const questionsLocked = attempts.loading || Boolean(attempts.error) || attemptCount > 0;
  const editBlockReason = attempts.loading
    ? 'Đang kiểm tra lượt làm của sinh viên. Vui lòng đợi hoàn tất rồi nhấn chỉnh sửa lại.'
    : attempts.error
      ? 'Không tải được danh sách lượt làm nên chưa thể cho phép chỉnh sửa đề. Nhấn “Kiểm tra lại” để thử tải lại.'
      : attemptCount > 0
        ? `Đề đã có ${attemptCount} lượt làm của sinh viên nên không thể chỉnh sửa đề hoặc thay đổi câu hỏi. Chọn “Sao chép / giao lớp khác” để tạo bản đề mới và chỉnh sửa.`
        : '';
  const openGrading = (attempt) => {
    action.clear();
    const maximum = attemptMaxScore(attempt, questions);
    if (!maximum) {
      action.setError('Chưa tải đủ trọng số câu hỏi của lượt làm để chấm điểm.');
      return;
    }
    setGradeValue(tenPointScore(attempt.totalScore, maximum) ?? '');
    setGradingAttempt(attempt);
  };
  const topicNameOf = (question) => questionTopicName(question, listItems(candidateTopics.data));
  const addQuestion = async (question) => {
    if (action.busy || parentBusy) return;
    if (examQuestions.loading || examQuestions.error) {
      action.setError('Chưa tải được danh sách câu hỏi hiện tại. Vui lòng thử lại.');
      return;
    }
    if (questionsLocked) {
      action.setError(editBlockReason);
      return;
    }
    const result = await action.run(
      `/api/v1/exams/${encodeURIComponent(exam.examId)}/questions`,
      { method: 'POST', body: { questionId: question.questionId, scoreWeight: 1, orderIndex: nextQuestionOrder } },
      'Đã thêm câu hỏi vào đề.'
    );
    if (result) {
      examQuestions.reload();
      detail.reload();
      onChanged?.();
    }
  };
  const generate = async () => {
    if (action.busy || parentBusy) return;
    if (questionsLocked) {
      action.setError(editBlockReason);
      return;
    }
    const result = await action.run(
      `/api/v1/exams/${encodeURIComponent(exam.examId)}/generate-questions`,
      { method: 'POST' },
      'Đã sinh câu hỏi theo ma trận.'
    );
    if (result) {
      setGenerateConfirmation(false);
      examQuestions.reload();
      detail.reload();
      onChanged?.();
    }
  };
  const removeQuestion = async () => {
    if (!removeTarget) return;
    if (questionsLocked) {
      action.setError(editBlockReason);
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
      rawScore = rawScoreFromTen(values.totalScore, gradingMaxScore);
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
          feedback: `Điểm quy đổi: ${tenPointScore(rawScore, gradingMaxScore)}/10.${values.feedback.trim() ? ` ${values.feedback.trim()}` : ''}`,
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
      {generateConfirmation && (
        <ExamQuestionConfirmation
          exam={detail.data || exam}
          generating
          questionCount={questions.length}
          nextOrder={nextQuestionOrder}
          busy={action.busy}
          error={action.error}
          onCancel={() => !action.busy && setGenerateConfirmation(false)}
          onConfirm={generate}
        />
      )}
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
        expandable={!pageMode}
        onOpenPage={
          pageMode
            ? undefined
            : () =>
                navigate(
                  queryPath(
                    getDemoSession()?.role === 'ADMIN' ? 'admin_assessments.html' : 'lecturer_assessments.html',
                    { examId: exam.examId, classId: examInfo.classId, view: 'page', examTab: tab }
                  )
                )
        }
        title={`Quản lý đề thi · ${examInfo.title || 'Đề thi'}`}
        busy={action.busy || parentBusy}
        onClose={() => !action.busy && !parentBusy && onClose()}
      >
        <AuthAlert>{action.notice}</AuthAlert>
        {action.error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-body-sm text-primary"
          >
            {action.error}
          </p>
        )}
        {parentError && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-body-sm text-primary"
          >
            {parentError}
          </p>
        )}
        {showEditWarning > 0 && questionsLocked && (
          <AuthAlert
            key={showEditWarning}
            error
            onClose={() => setShowEditWarning(0)}
            actions={
              attempts.error ? (
                <Button variant="secondary" onClick={attempts.reload}>
                  Kiểm tra lại
                </Button>
              ) : undefined
            }
          >
            {editBlockReason}
          </AuthAlert>
        )}
        <Tabs
          items={[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'questions', label: 'Câu hỏi trong đề' },
            { id: 'attempts', label: 'Bài làm' },
            { id: 'roster', label: 'Danh sách sinh viên' },
          ]}
          activeId={tab}
          onChange={setTab}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {[
                onEdit && {
                  label: 'Sửa thông tin đề',
                  icon: 'edit',
                  danger: questionsLocked,
                  title: questionsLocked ? editBlockReason : undefined,
                  onSelect: () => {
                    if (questionsLocked) {
                      setShowEditWarning((count) => count + 1);
                      return;
                    }
                    setShowEditWarning(0);
                    onEdit({ ...exam, ...detail.data, classId: detail.data?.classId || exam.classId });
                  },
                },
                onCopy && {
                  label: 'Sao chép / giao lớp khác',
                  icon: 'content_copy',
                  onSelect: () => onCopy(detail.data || exam),
                },
                tab === 'questions' &&
                  detail.data?.matrixId && {
                    label: 'Sinh theo ma trận',
                    disabled: questionsLocked || examQuestions.loading || Boolean(examQuestions.error),
                    title: questionsLocked ? editBlockReason : undefined,
                    onSelect: () => {
                      action.clear();
                      setGenerateConfirmation(true);
                    },
                  },
                tab === 'roster' && {
                  label: 'Thêm sinh viên thi ghép',
                  disabled: roster.loading || Boolean(roster.error),
                  onSelect: () => {
                    setTransferStudent(null);
                    setTransferOpen(true);
                  },
                },
              ]
                .filter(Boolean)
                .map((item) => (
                  <Button
                    key={item.label}
                    variant="secondary"
                    icon={item.icon}
                    disabled={action.busy || parentBusy || item.disabled}
                    title={item.title}
                    className={item.danger ? '!border-red-300 !bg-red-50 !text-red-700' : ''}
                    onClick={item.onSelect}
                  >
                    {item.label}
                  </Button>
                ))}
            </div>
          }
        >
          {() =>
            tab === 'overview' ? (
              <Resource resource={detail}>
                {() => (
                  <div className="mt-5 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-headline-sm font-bold">{examInfo.title || exam.title || 'Đề thi'}</h3>
                        <p className="mt-1 text-body-sm text-[#64748B]">
                          {listItems(classOptions.data).find((item) => item.classId === examInfo.classId)?.classCode ||
                            'Lớp nhận đề'}
                        </p>
                      </div>
                      <StatusBadge tone={examInfo.isPublished ? 'success' : 'neutral'}>
                        {examInfo.isPublished ? 'Đang hiển thị' : 'Chưa hiển thị'}
                      </StatusBadge>
                    </div>
                    <dl className="grid grid-cols-1 gap-5 rounded-xl border border-[#E2E8F0] p-5 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ['Loại đề', labelOf(examInfo.examType)],
                        [
                          'Thời lượng',
                          examInfo.durationMinutes ? `${examInfo.durationMinutes} phút` : 'Không giới hạn',
                        ],
                        [
                          'Số câu hỏi',
                          examQuestions.loading
                            ? 'Đang tải…'
                            : examQuestions.error
                              ? 'Chưa tải được'
                              : `${questions.length} câu`,
                        ],
                        [
                          'Bắt đầu',
                          examInfo.startTime ? new Date(examInfo.startTime).toLocaleString('vi-VN') : 'Chưa thiết lập',
                        ],
                        [
                          'Kết thúc',
                          examInfo.endTime ? new Date(examInfo.endTime).toLocaleString('vi-VN') : 'Chưa thiết lập',
                        ],
                        ['Số lượt làm tối đa', examInfo.maxAttempts ?? '—'],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-body-sm text-[#64748B]">{label}</dt>
                          <dd className="mt-1 font-semibold">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="flex flex-wrap gap-3">
                      <Button icon="quiz" variant="secondary" onClick={() => setTab('questions')}>
                        Xem câu hỏi trong đề
                      </Button>
                      <Button
                        icon="add"
                        disabled={action.busy || parentBusy || questionsLocked}
                        onClick={() => setTab('questions')}
                      >
                        Thêm từ ngân hàng
                      </Button>
                    </div>
                  </div>
                )}
              </Resource>
            ) : tab === 'questions' ? (
              <div className="exam-question-workspace">
                <section className="exam-question-panel" aria-label="Câu hỏi trong đề">
                  <h3 className="mb-3 text-title-md font-semibold">Câu hỏi trong đề ({questions.length})</h3>
                  <div className="exam-question-panel__list">
                    <Resource resource={examQuestions}>
                      {(rows) => (
                        <QuestionSelectionList
                          rows={rows}
                          onView={setViewQuestion}
                          getActions={(item) => [
                            {
                              label: 'Gỡ khỏi đề',
                              danger: true,
                              disabled: action.busy || parentBusy || questionsLocked,
                              title: questionsLocked ? editBlockReason : undefined,
                              onSelect: () => setRemoveTarget(item),
                            },
                          ]}
                          columns={['Câu hỏi', 'Chủ đề', 'Độ khó', 'Điểm / 10', '']}
                          cells={(item) => [
                            item.content || item.questionText || '—',
                            topicNameOf(item),
                            labelOf(item.difficultyLevel),
                            tenPointScore(questionWeight(item), maxScore)?.toLocaleString('vi-VN', {
                              maximumFractionDigits: 2,
                            }) ?? '—',
                          ]}
                        />
                      )}
                    </Resource>
                  </div>
                </section>
                <section className="exam-question-panel exam-question-panel--bank" aria-label="Ngân hàng câu hỏi">
                  <h3 className="mb-3 text-title-md font-semibold">Ngân hàng câu hỏi</h3>
                  {subjectId ? (
                    <>
                      <div className="exam-question-panel__list">
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
                              <QuestionSelectionList
                                rows={available}
                                onView={setViewQuestion}
                                getActions={(item) => [
                                  {
                                    label: 'Thêm vào đề',
                                    disabled:
                                      action.busy ||
                                      parentBusy ||
                                      questionsLocked ||
                                      examQuestions.loading ||
                                      Boolean(examQuestions.error),
                                    title: questionsLocked ? editBlockReason : undefined,
                                    onSelect: () => addQuestion(item),
                                  },
                                ]}
                                columns={['Ngân hàng câu hỏi', 'Chủ đề', 'Độ khó', '']}
                                cells={(item) => [
                                  item.content || '—',
                                  topicNameOf(item),
                                  labelOf(item.difficultyLevel),
                                ]}
                              />
                            ) : (
                              <p className="py-4 text-body-sm text-[#64748B]">
                                Không có câu hỏi đã duyệt phù hợp để thêm vào đề.
                              </p>
                            );
                          }}
                        </Resource>
                      </div>
                      <div className="exam-question-panel__filters">
                        <SharedFormField
                          value={questionSearch}
                          inlineLabel
                          onChange={(event) => setQuestionSearch(event.target.value)}
                          placeholder="Nhập nội dung câu hỏi"
                          className="mt-2 block w-full"
                          label={<>Tìm câu hỏi</>}
                          wrapperClassName="text-body-sm font-semibold sm:col-span-2"
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
                      </div>
                    </>
                  ) : (
                    <Card className="mt-4 p-4">Chưa có dữ liệu học phần của lớp để tải Ngân hàng câu hỏi.</Card>
                  )}
                </section>
              </div>
            ) : tab === 'attempts' ? (
              <Resource resource={attempts}>
                {(rows) => (
                  <>
                    <div className="exam-summary-cards">
                      <StatCard
                        label="Lượt làm"
                        value={rows.length}
                        icon="assignment"
                        ribbonLabel="TỔNG LƯỢT LÀM"
                        accentColor="#0284c7"
                      />
                      <StatCard
                        label="Đã nộp"
                        value={rows.filter((item) => item.status === 'SUBMITTED').length}
                        icon="task_alt"
                        ribbonLabel="BÀI ĐÃ NỘP"
                        accentColor="#059669"
                      />
                      <StatCard
                        label="Đã có điểm"
                        value={rows.filter((item) => attemptScore(item, questions) !== null).length}
                        icon="grading"
                        ribbonLabel="BÀI ĐÃ CÓ ĐIỂM"
                        accentColor="#7c3aed"
                      />
                    </div>
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
                            disabled={
                              action.busy ||
                              !attemptMaxScore(item, questions) ||
                              !['SUBMITTED', 'GRADED'].includes(item.status)
                            }
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
                      <div className="exam-summary-cards">
                        {[
                          [
                            'Tổng sinh viên',
                            data.totalParticipants ?? official.length + transferred.length,
                            'groups',
                            '#0284c7',
                            'TỔNG SINH VIÊN',
                          ],
                          ['Chính thức', data.officialStudentCount ?? official.length, 'school', '#059669', 'SINH VIÊN CHÍNH THỨC'],
                          ['Thi ghép', data.transferredStudentCount ?? transferred.length, 'group_add', '#7c3aed', 'SINH VIÊN THI GHÉP'],
                        ].map(([label, value, icon, accentColor, ribbonLabel]) => (
                          <StatCard
                            key={label}
                            label={label}
                            value={value}
                            icon={icon}
                            accentColor={accentColor}
                            ribbonLabel={ribbonLabel}
                          />
                        ))}
                      </div>
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
      {viewQuestion && (
        <QuestionDetailDialog
          key={viewQuestion.questionId}
          questionId={viewQuestion.questionId}
          subjectId={subjectId}
          topicName={topicNameOf(viewQuestion)}
          onClose={() => setViewQuestion(null)}
        />
      )}
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
            <p className="text-body-sm text-[#64748B]">{scoringInfo.description}</p>
            {gradingMaxScore &&
              String(gradeValue).trim() !== '' &&
              Number(gradeValue) >= 0 &&
              Number(gradeValue) <= 10 && (
                <p className="text-body-sm text-[#64748B]">
                  Điểm quy đổi sau khi lưu:{' '}
                  {tenPointScore(rawScoreFromTen(gradeValue, gradingMaxScore), gradingMaxScore)}/10.
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
                tenPointScore(gradingAttempt.totalScore, gradingMaxScore) !== Number(gradeValue)
              }
            />
            <SubmitButton busy={action.busy} disabled={!gradingMaxScore}>
              Lưu điểm
            </SubmitButton>
          </Form>
        </Modal>
      )}
    </>
  );
}

export function MatrixManager({
  classes,
  createPage = false,
  scopedSubjectId = '',
  plainToolbar = false,
  tabActionTarget = null,
}) {
  const [subjectId, setSubjectId] = useState(
    () => scopedSubjectId || new URLSearchParams(window.location.search).get('subjectId') || ''
  );
  const [modal, setModal] = useState(createPage ? { mode: 'create' } : null);
  const EditorContainer = createPage ? AuthoringPanel : Modal;
  const FilterContainer = plainToolbar ? 'div' : Card;
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
    if (adminMode || scopedSubjectId) {
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
      <FilterContainer
        className={plainToolbar && tabActionTarget && !createPage ? 'hidden' : plainToolbar ? 'my-5' : 'mt-5 p-5'}
      >
        <div
          className={
            plainToolbar
              ? 'flex flex-wrap items-center gap-4'
              : createPage
                ? 'grid gap-3'
                : 'grid grid-cols-[minmax(0,320px)_auto] items-center justify-start gap-3'
          }
        >
          <TabAction target={plainToolbar && !createPage ? tabActionTarget : null}>
            <SelectField
              label="Học phần"
              value={subjectId}
              disabled={Boolean(scopedSubjectId)}
              onChange={(event) => {
                setSubjectId(event.target.value);
                if (createPage)
                  setDetails([{ topicId: '', difficultyLevel: 'MEDIUM', numQuestions: 1, weightPercent: 100 }]);
              }}
              className={plainToolbar ? '!min-w-0 !w-full sm:!w-80 !flex-nowrap' : '!min-w-0 !w-full !flex-nowrap'}
            >
              <option value="">{createPage ? 'Chọn học phần' : 'Tất cả học phần'}</option>
              {listItems(subjects.data).map((item) => (
                <option key={item.subjectId} value={item.subjectId}>
                  {item.subjectCode ? `${item.subjectCode} · ` : ''}
                  {item.subjectName}
                </option>
              ))}
            </SelectField>
          </TabAction>
          {!createPage && (
            <TabAction target={tabActionTarget}>
              <Button
                className={`${plainToolbar ? 'ml-auto ' : ''}shrink-0 whitespace-nowrap`}
                icon="add"
                disabled={!subjectId || action.busy}
                onClick={openCreate}
              >
                Tạo ma trận
              </Button>
            </TabAction>
          )}
        </div>
      </FilterContainer>
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
          expandable={!createPage}
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
                    <option value="">Không gán CLO</option>
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
  adminFinal = false,
  tabActionTarget = null,
  onExamTitleChange,
}) {
  const Shell = embedded ? React.Fragment : LecturerPageShell;
  const pageParameters = new URLSearchParams(window.location.search);
  const requestedExamId = pageParameters.get('view') === 'page' ? pageParameters.get('examId') : '';
  const managementPage = createPage || Boolean(requestedExamId);
  const [managementTitle, setManagementTitle] = useState('');
  const classes = useResource(adminFinal ? '/api/v1/classes' : '/api/v1/instructor/classes', true);
  const rows = listItems(classes.data);
  const [tab, setTab] = useState(
    !adminFinal && new URLSearchParams(window.location.search).get('tab') === 'matrices' ? 'matrices' : 'exams'
  );
  const [classId, setClassId] = useState(
    () => scopedClassId || new URLSearchParams(window.location.search).get('classId') || ''
  );
  const [creating, setCreating] = useState(createPage && !requestedExamId);
  const [editing, setEditing] = useState(null);
  const [managing, setManaging] = useState(() =>
    requestedExamId
      ? {
          examId: requestedExamId,
          classId: pageParameters.get('classId') || scopedClassId,
        }
      : null
  );
  const [copySource, setCopySource] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [distributing, setDistributing] = useState(false);
  const distributionRef = useRef(null);
  const distributionRunning = useRef(false);
  const [deleteExam, setDeleteExam] = useState(null);
  const [allExams, setAllExams] = useState([]);
  const [allExamsLoading, setAllExamsLoading] = useState(false);
  const [allExamsError, setAllExamsError] = useState('');
  const EditorContainer = createPage ? AuthoringPanel : Modal;
  const selected = scopedClassId || classId || 'ALL';
  const formClassId = editing?.classId || selected;
  const draftExam = editing || copySource;
  const copySubjectId = copySource ? rows.find((item) => item.classId === copySource.classId)?.subjectId : '';
  const exams = useApiData(selected !== 'ALL' ? `/api/v1/exams/class/${encodeURIComponent(selected)}` : null);
  const matrices = useApiData(
    formClassId !== 'ALL' && rows.find((row) => row.classId === formClassId)?.subjectId
      ? `/api/v1/exam-matrices?subjectId=${encodeURIComponent(rows.find((row) => row.classId === formClassId).subjectId)}`
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
  const editorBusy = action.busy || distributing;
  const hasPendingDistribution = distribution?.targets.some((target) => !target.complete);
  const changeTargetClass = (nextClassId) => {
    setClassId(nextClassId);
  };
  const continueDistribution = async (job) => {
    if (distributionRunning.current) return;
    distributionRunning.current = true;
    setDistributing(true);
    action.clear();
    try {
      const results = await runExamDistribution(job, api.exams, setDistribution);
      action.setNotice(
        `Đã ${copySource ? 'sao chép' : 'tạo'} đề cho ${results.length} lớp. Mỗi lớp có một bản đề riêng.`
      );
      setCopySource(null);
      if (results.length === 1) setManaging(results[0]);
    } catch (error) {
      action.setError(
        `Chưa giao xong đề cho tất cả lớp. ${error.message} Bạn có thể tiếp tục các lớp còn lại bên dưới.`
      );
    } finally {
      distributionRunning.current = false;
      setDistributing(false);
      examResource.reload();
    }
  };
  const createExam = async (event) => {
    event.preventDefault();
    if (editorBusy || distributionRunning.current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    let targets;
    try {
      if (!editing) targets = validateExamTargets(rows, formClassId, [], copySubjectId);
    } catch (error) {
      action.setError(error.message);
      return;
    }
    if (
      !values.title.trim() ||
      !Number.isFinite(Date.parse(values.startTime)) ||
      !Number.isFinite(Date.parse(values.endTime)) ||
      new Date(values.endTime) <= new Date(values.startTime)
    ) {
      action.setError('Nhập tên đề thi và thời gian kết thúc sau thời gian bắt đầu.');
      return;
    }
    if (!editing && Date.parse(values.endTime) <= Date.now()) {
      action.setError('Chọn thời gian kết thúc trong tương lai để tạo hoặc sao chép đề.');
      return;
    }
    const examType = adminFinal ? 'FINAL' : values.examType || editing?.examType;
    if (
      !adminFinal &&
      !['PRACTICE', 'QUIZ', 'MIDTERM'].includes(examType) &&
      !(editing && examType === editing.examType)
    ) {
      action.setError('Chọn loại đề luyện tập, kiểm tra ngắn hoặc giữa kỳ để tiếp tục.');
      return;
    }
    const body = {
      ...(copySource?.matrixId || values.matrixId ? { matrixId: copySource?.matrixId || values.matrixId } : {}),
      title: values.title.trim(),
      examType,
      durationMinutes: Number(values.durationMinutes),
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
      maxAttempts: Number(values.maxAttempts),
      shuffleQuestions: values.shuffleQuestions === 'on',
      shuffleOptions: values.shuffleOptions === 'on',
      isPublished: values.isPublished === 'on',
    };
    if (!editing) {
      let job;
      try {
        job = prepareExamDistribution(body, targets, copySource?.sourceQuestions);
      } catch (error) {
        action.setError(error.message);
        return;
      }
      distributionRef.current = job;
      setDistribution({ ...job });
      setCreating(false);
      await continueDistribution(job);
      return;
    }
    const update = examUpdatePayload(editing, values);
    if (!Object.keys(update).length) {
      action.setNotice('Thông tin đề thi đã được lưu, không có thay đổi mới.');
      setManaging(editing);
      setEditing(null);
      return;
    }
    const result = await action.run(
      `/api/v1/exams/${encodeURIComponent(editing.examId)}`,
      { method: 'PUT', body: update },
      'Đã cập nhật đề thi.'
    );
    if (result) {
      setCreating(false);
      setEditing(null);
      examResource.reload();
      setManaging({ ...editing, ...update, ...(typeof result === 'object' ? result : {}) });
    }
  };
  const editExam = async (exam) => {
    if (editorBusy || distributionRunning.current) return;
    const result = await action.run(`/api/v1/exams/${encodeURIComponent(exam.examId)}`, {}, '');
    if (result) {
      setManaging(null);
      setCreating(false);
      setCopySource(null);
      setEditing({
        ...exam,
        ...result,
        classId: result.classId || exam.classId || (selected !== 'ALL' ? selected : undefined),
      });
    }
  };
  const copyExam = async (exam) => {
    if (editorBusy || distributionRunning.current) return;
    if (hasPendingDistribution) {
      action.setError('Hoàn tất các lớp đang giao trước khi sao chép đề mới.');
      return;
    }
    setDistributing(true);
    distributionRunning.current = true;
    action.clear();
    try {
      const [source, questions] = await Promise.all([api.exams.get(exam.examId), api.exams.questions(exam.examId)]);
      if (!rows.find((item) => item.classId === source.classId)?.subjectId)
        throw new Error('Chưa xác định được môn học của lớp nguồn. Vui lòng tải lại danh sách lớp.');
      setManaging(null);
      setEditing(null);
      setClassId(scopedClassId || source.classId);
      setCopySource({
        ...source,
        title: `${source.title || 'Đề thi'} (bản sao)`,
        isPublished: false,
        sourceQuestions: listItems(questions),
      });
      setCreating(true);
    } catch (error) {
      action.setError(error.message || 'Không thể tải đề nguồn để sao chép.');
    } finally {
      setDistributing(false);
      distributionRunning.current = false;
    }
  };
  return (
    <Shell
      {...(embedded
        ? {}
        : {
            currentPage: grading ? 'lecturer_grading.html' : 'lecturer_assessments.html',
            title: managementPage
              ? managing
                ? managementTitle || managing.title || 'Đề thi'
                : editing
                  ? 'Chỉnh sửa đề thi'
                  : 'Tạo đề thi'
              : grading
                ? 'Chấm bài kiểm tra'
                : 'Bài tập & kiểm tra',
            eyebrow: 'ĐÁNH GIÁ',
          })}
    >
      <AuthAlert>{action.notice}</AuthAlert>
      <AuthAlert error>{action.error}</AuthAlert>
      {distribution && (hasPendingDistribution || distributing) && (
        <Card className="mt-4 space-y-3 p-5">
          <h2 className="text-headline-sm font-bold">
            {distributing ? 'Đang giao đề cho các lớp…' : 'Có lớp chưa giao xong đề'}
          </h2>
          <p role="status" className="text-body-sm text-[#64748B]">
            Đã hoàn tất {distribution.targets.filter((target) => target.complete).length}/{distribution.targets.length}{' '}
            lớp. Các bản đề được chỉnh sửa độc lập.
          </p>
          <div className="space-y-2">
            {distribution.targets.map((target) => (
              <div
                key={target.classId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] p-3"
              >
                <div>
                  <strong className="text-body-md">
                    {nameOf(rows.find((item) => item.classId === target.classId))}
                  </strong>
                  <p className={`mt-1 text-body-sm ${target.error ? 'text-primary' : 'text-[#64748B]'}`}>
                    {target.complete
                      ? 'Đã giao đề'
                      : target.error || (target.exam ? 'Đang hoàn thiện bản đề' : 'Chưa tạo đề')}
                  </p>
                </div>
                {target.complete && (
                  <Button variant="secondary" disabled={editorBusy} onClick={() => setManaging(target.exam)}>
                    Quản lý đề
                  </Button>
                )}
              </div>
            ))}
          </div>
          {hasPendingDistribution && (
            <Button icon="refresh" disabled={editorBusy} onClick={() => continueDistribution(distributionRef.current)}>
              Tiếp tục giao các lớp còn lại
            </Button>
          )}
        </Card>
      )}
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
              examResource.reload();
            }
          }}
        />
      )}
      {!managementPage && (
        <div
          className={
            adminFinal && tabActionTarget
              ? 'mt-6 [&>.tabs>.tabs-toolbar]:hidden'
              : adminFinal
                ? 'mt-6 [&_.tabs-toolbar]:!border-0 [&_.tabs-actions]:!w-full [&_.tabs-actions]:!justify-between'
                : 'mt-6'
          }
        >
          <Tabs
            hideSingleTab={adminFinal}
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
                  <TabAction target={adminFinal ? tabActionTarget : null}>
                    <ClassSelect classes={rows} value={selected} onChange={setClassId} />
                  </TabAction>
                )}
                {!grading && tab === 'exams' && (
                  <TabAction target={tabActionTarget}>
                    <Button
                      icon="add"
                      disabled={
                        (!adminFinal && (!selected || selected === 'ALL')) || editorBusy || hasPendingDistribution
                      }
                      onClick={() =>
                        embedded
                          ? (setCopySource(null), setCreating(true))
                          : navigate(queryPath('lecturer_exam_create.html', { classId: selected }))
                      }
                    >
                      {adminFinal ? 'Tạo đề thi cuối kỳ' : 'Tạo đề thi'}
                    </Button>
                  </TabAction>
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
                      rows={adminFinal ? items.filter((item) => item.examType === 'FINAL') : items}
                      columns={['Kỳ thi', 'Lớp nhận đề', 'Hiển thị', 'Loại', 'Thời gian', 'Số câu', 'Thao tác']}
                      cells={(item) => [
                        <button
                          className="text-left font-semibold text-primary hover:underline"
                          onClick={() => setManaging(item)}
                        >
                          {nameOf(item)}
                        </button>,
                        rows.find((row) => row.classId === item.classId)?.classCode ||
                          nameOf(rows.find((row) => row.classId === item.classId)),
                        <StatusBadge tone={item.isPublished === true ? 'success' : 'neutral'}>
                          {item.isPublished === true
                            ? 'Đang hiển thị'
                            : item.isPublished === false
                              ? 'Chưa hiển thị'
                              : 'Chưa có thông tin'}
                        </StatusBadge>,
                        labelOf(item.examType),
                        item.startTime ? new Date(item.startTime).toLocaleString('vi-VN') : '—',
                        item.totalQuestions ?? '—',
                        <ActionMenu
                          label={`Thao tác với ${nameOf(item)}`}
                          disabled={editorBusy}
                          items={
                            grading
                              ? [{ label: 'Xem danh sách bài làm', onSelect: () => setManaging(item) }]
                              : [
                                  { label: 'Câu hỏi & bài làm', onSelect: () => setManaging(item) },
                                  { label: 'Sửa thông tin đề thi', onSelect: () => editExam(item) },
                                  { label: 'Sao chép / giao lớp khác', onSelect: () => copyExam(item) },
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
          wide
          expandable={!createPage}
          key={editing?.examId || (copySource ? `copy-${copySource.examId}` : 'new-exam')}
          title={
            editing
              ? 'Chỉnh sửa đề thi'
              : copySource
                ? 'Sao chép / giao đề cho lớp khác'
                : adminFinal
                  ? 'Tạo đề thi cuối kỳ'
                  : 'Thiết lập đề thi'
          }
          description="Chuẩn bị thông tin, cấu trúc và lịch thi trước khi thêm câu hỏi."
          icon="quiz"
          busy={editorBusy}
          onClose={() => {
            if (editorBusy) return;
            if (createPage) {
              navigate(queryPath('lecturer_assessments.html', { classId }));
              return;
            }
            setCreating(false);
            setEditing(null);
            setCopySource(null);
          }}
        >
          {action.error && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-body-sm text-primary"
            >
              {action.error}
            </p>
          )}
          <Form className="authoring-grouped-form" busy={editorBusy} onSubmit={createExam}>
            {copySource && (
              <p className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-body-sm text-[#1E3A8A]">
                Sao chép {copySource.sourceQuestions.length} câu hỏi cùng thứ tự và trọng số. Bản sao mặc định chưa hiển
                thị cho sinh viên; chọn lại lịch thi và lớp nhận đề bên dưới.
              </p>
            )}
            <AuthoringSection
              number="01"
              icon="school"
              title="Thông tin chung"
              description="Chọn lớp học và đặt tên để dễ nhận diện đề thi."
            >
              <div className="authoring-fields authoring-fields--exam-info">
                {!editing && !scopedClassId && (
                  <Resource resource={classes}>
                    {() => (
                      <SharedSelectField
                        name="classId"
                        label="Lớp nhận đề chính *"
                        value={selected === 'ALL' ? '' : selected}
                        onChange={(event) => changeTargetClass(event.target.value)}
                        required
                      >
                        <option value="">Chọn lớp nhận đề</option>
                        {rows
                          .filter((item) => !copySource || item.subjectId === copySubjectId)
                          .map((item) => (
                            <option key={item.classId} value={item.classId}>
                              {nameOf(item)}
                            </option>
                          ))}
                      </SharedSelectField>
                    )}
                  </Resource>
                )}
                {(editing || scopedClassId) && (
                  <p className="text-body-sm text-[#64748B]">
                    Lớp nhận đề:{' '}
                    <strong>
                      {rows.find((item) => item.classId === formClassId)?.classCode ||
                        editing?.classCode ||
                        'Giữ nguyên lớp của đề thi'}
                    </strong>
                  </p>
                )}
                <SharedFormField
                  name="title"
                  defaultValue={draftExam?.title || ''}
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
                    defaultValue={adminFinal ? 'FINAL' : draftExam?.examType || 'PRACTICE'}
                    required
                    disabled={editing?.examType === 'FINAL'}
                    label={<>Loại đề</>}
                    className="text-body-sm font-semibold"
                  >
                    {(adminFinal || draftExam?.examType === 'FINAL') && (
                      <option value="FINAL" disabled={!adminFinal && !editing}>
                        {adminFinal || editing ? 'Thi cuối kỳ' : 'Thi cuối kỳ · chọn loại đề mới'}
                      </option>
                    )}
                    {!adminFinal && (
                      <>
                        <option value="PRACTICE">Luyện tập</option>
                        <option value="QUIZ">Kiểm tra ngắn</option>
                        <option value="MIDTERM">Giữa kỳ</option>
                      </>
                    )}
                  </SharedSelectField>
                  <SharedFormField
                    name="durationMinutes"
                    type="number"
                    min="1"
                    defaultValue={draftExam?.durationMinutes || ''}
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
                  defaultValue={draftExam?.matrixId || ''}
                  disabled={
                    Boolean(copySource) ||
                    !rows.some((item) => item.classId === formClassId && item.subjectId) ||
                    matrices.loading ||
                    Boolean(matrices.error)
                  }
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
                    defaultValue={localDateTimeInput(draftExam?.startTime)}
                    required
                    className="mt-2 w-full"
                    label={<>Bắt đầu</>}
                    wrapperClassName="text-body-sm font-semibold"
                  />
                  <SharedFormField
                    name="endTime"
                    type="datetime-local"
                    defaultValue={localDateTimeInput(draftExam?.endTime)}
                    required
                    className="mt-2 w-full"
                    label={<>Kết thúc</>}
                    wrapperClassName="text-body-sm font-semibold"
                  />
                </div>
              </AuthoringSection>
            </div>

            <AuthoringSection number="04" icon="settings" title="Cấu hình bài thi">
              <SharedFormField
                label="Số lượt làm tối đa"
                name="maxAttempts"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={draftExam?.maxAttempts ?? 1}
              />
              <div className="mt-4 flex flex-wrap gap-5 text-body-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="exam-checkbox"
                    name="shuffleQuestions"
                    defaultChecked={draftExam?.shuffleQuestions ?? false}
                  />
                  Xáo trộn câu hỏi
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="exam-checkbox"
                    name="shuffleOptions"
                    defaultChecked={draftExam?.shuffleOptions ?? false}
                  />
                  Xáo trộn đáp án
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="exam-checkbox"
                    name="isPublished"
                    defaultChecked={draftExam?.isPublished ?? false}
                  />
                  Hiển thị đề và cho phép sinh viên truy cập các lớp đã chọn
                </label>
              </div>
            </AuthoringSection>
            <div className="authoring-page__footer">
              <p>
                <span className="material-symbols-outlined" aria-hidden="true">
                  playlist_add
                </span>
                {copySource
                  ? 'Bản sao có đầy đủ câu hỏi của đề nguồn. Mỗi lớp có thể chỉnh sửa riêng.'
                  : 'Sau khi tạo, chọn từng bản đề để thêm câu hỏi. Có thể sao chép đề đã hoàn thiện sang lớp khác.'}
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
                  busy={editorBusy}
                  disabled={!editing && (formClassId === 'ALL' || classes.loading || Boolean(classes.error))}
                >
                  {editing ? 'Lưu thay đổi' : copySource ? 'Sao chép đề thi' : 'Tạo đề thi'}
                </SubmitButton>
              </div>
            </div>
          </Form>
        </EditorContainer>
      )}
      {managing && (
        <ExamManagementModal
          pageMode={managementPage}
          onTitleChange={embedded ? onExamTitleChange : setManagementTitle}
          exam={managing}
          subjectId={rows.find((item) => item.classId === (managing.classId || selected))?.subjectId}
          initialTab={
            requestedExamId
              ? ['overview', 'questions', 'attempts', 'roster'].includes(pageParameters.get('examTab'))
                ? pageParameters.get('examTab')
                : 'questions'
              : grading
                ? 'attempts'
                : createPage
                  ? 'bank'
                  : 'questions'
          }
          onClose={() =>
            managementPage
              ? navigate(queryPath(adminFinal ? 'admin_assessments.html' : 'lecturer_assessments.html', { classId }))
              : setManaging(null)
          }
          onChanged={examResource.reload}
          onEdit={!grading ? editExam : undefined}
          onCopy={!grading ? copyExam : undefined}
          parentBusy={editorBusy}
          parentError={action.error}
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
