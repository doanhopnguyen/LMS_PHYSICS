import { FormField as SharedFormField } from '../../components/FormField.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import { ActionMenu } from '../../components/ActionMenu.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormDialog } from '../../components/FormDialog.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { QuestionImportForm } from '../../components/QuestionImportForm.jsx';
import { CloPicker, CloLabels, useCloCatalog } from '../../components/CloPicker.jsx';
import { validateCloIds } from '../../lib/cloSelection.js';
import { approveAdminQuestion } from '../../lib/adminQuestionApproval.js';
import { useCollection } from './AdminManagementShared.jsx';
import { useApiData, listItems } from '../../hooks/useApiData.js';
import { api } from '../../lib/apiClient.js';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { labelOf, safeUrl } from '../../lib/lecturerUtils.js';

const questionTypes = [
  ['MCQ_SINGLE', 'Một đáp án'],
  ['MCQ_MULTI', 'Nhiều đáp án'],
  ['TRUE_FALSE', 'Đúng / Sai'],
  ['SHORT_ANSWER', 'Trả lời ngắn'],
];
const difficulties = [
  ['EASY', 'Dễ'],
  ['MEDIUM', 'Trung bình'],
  ['HARD', 'Khó'],
];
const labelFor = (options, value) => options.find(([id]) => id === value)?.[1] || labelOf(value);
const optionRows = (initial) =>
  Array.isArray(initial?.options) && initial.options.length
    ? initial.options.map((item) => ({
        content: item.content || '',
        isCorrect: Boolean(item.isCorrect),
        explanation: item.explanation || '',
      }))
    : Array.from({ length: 2 }, () => ({ content: '', isCorrect: false, explanation: '' }));

function QuestionEditor({ initial, subjects, busy, onClose, onSave, requestError }) {
  const [subjectId, setSubjectId] = useState(initial?.subjectId || '');
  const [topicId, setTopicId] = useState(initial?.topicId || '');
  const [type, setType] = useState(initial?.questionType || 'MCQ_SINGLE');
  const [options, setOptions] = useState(() => optionRows(initial));
  const [error, setError] = useState('');
  const [cloIds, setCloIds] = useState(initial?.cloIds || []);
  const clos = useCloCatalog([subjectId]);
  const topics = useApiData(subjectId ? `/api/v1/subjects/${encodeURIComponent(subjectId)}/topics` : null);
  const topicRows = listItems(topics.data);
  useEffect(() => {
    if (!topics.loading && !topics.error && topicId && !topicRows.some((topic) => topic.topicId === topicId))
      setTopicId('');
  }, [subjectId, topicId, topicRows, topics.loading, topics.error]);
  const updateOption = (index, patch) =>
    setOptions((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, ...patch }
          : type === 'MCQ_SINGLE' && patch.isCorrect
            ? { ...row, isCorrect: false }
            : row
      )
    );
  const submit = (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const preparedOptions = options
      .map((option, orderIndex) => ({
        ...option,
        content: option.content.trim(),
        explanation: option.explanation.trim(),
        orderIndex,
      }))
      .filter((option) => option.content);
    if (!subjectId || !topicId) return setError('Vui lòng chọn học phần và chủ đề.');
    if (clos.loading || clos.error || topics.loading || topics.error)
      return setError('Vui lòng tải đầy đủ chủ đề và CLO trước khi lưu.');
    const cloError = validateCloIds(cloIds, clos.data, subjectId);
    if (cloError) return setError(cloError);
    if (!values.content.trim()) return setError('Vui lòng nhập nội dung câu hỏi.');
    if (type !== 'SHORT_ANSWER' && (preparedOptions.length < 2 || !preparedOptions.some((option) => option.isCorrect)))
      return setError('Câu trắc nghiệm cần ít nhất 2 đáp án và phải có đáp án đúng.');
    setError('');
    onSave({
      subjectId,
      topicId,
      questionType: type,
      content: values.content.trim(),
      mediaUrl: values.mediaUrl.trim(),
      difficultyLevel: values.difficultyLevel,
      cognitiveLevel: values.cognitiveLevel.trim(),
      cloIds: [...new Set(cloIds)],
      options: preparedOptions,
    });
  };
  return (
    <FormDialog title={initial?.questionId ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi'} busy={busy} wide onClose={onClose}>
      <AuthAlert error>{requestError || topics.error}</AuthAlert>
      <Form className="grid gap-4" onSubmit={submit} busy={busy}>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Học phần *"
            name="subjectId"
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);
              setTopicId('');
              setCloIds([]);
            }}
            required
          >
            <option value="">Chọn học phần</option>
            {subjects.map((subject) => (
              <option key={subject.subjectId} value={subject.subjectId}>
                {subject.subjectCode ? `${subject.subjectCode} — ${subject.subjectName}` : subject.subjectName}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Chủ đề *"
            name="topicId"
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
            disabled={!subjectId || topics.loading}
            required
          >
            <option value="">{subjectId ? 'Chọn chủ đề' : 'Chọn học phần trước'}</option>
            {topicRows.map((topic) => (
              <option key={topic.topicId} value={topic.topicId}>
                {topic.topicName}
              </option>
            ))}
          </SelectField>
          <SelectField label="Loại câu hỏi" value={type} onChange={(event) => setType(event.target.value)}>
            {questionTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <SelectField label="Độ khó" name="difficultyLevel" defaultValue={initial?.difficultyLevel || 'EASY'}>
            {difficulties.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
        </div>
        <SharedFormField
          name="content"
          required
          rows="4"
          defaultValue={initial?.content || ''}
          className="w-full"
          multiline
          label={<>Nội dung câu hỏi *</>}
          wrapperClassName="grid gap-1.5 text-body-sm font-medium"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <SharedFormField
            name="cognitiveLevel"
            defaultValue={initial?.cognitiveLevel || ''}
            className="h-10"
            label={<>Mức nhận thức</>}
            wrapperClassName="grid gap-1.5 text-body-sm font-medium"
          />
          <SharedFormField
            name="mediaUrl"
            type="url"
            defaultValue={initial?.mediaUrl || ''}
            className="h-10"
            label={<>URL hình ảnh</>}
            wrapperClassName="grid gap-1.5 text-body-sm font-medium"
          />
        </div>
        <CloPicker subjectId={subjectId} resource={clos} value={cloIds} onChange={setCloIds} disabled={busy} />
        <fieldset className="grid gap-3">
          <legend className="font-semibold">Đáp án</legend>
          {options.map((option, index) => (
            <Card as="div" className="grid gap-3 p-4" key={index}>
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-body-sm font-medium">
                  <input
                    type={type === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                    name={type === 'MCQ_SINGLE' ? 'correct-answer' : `correct-${index}`}
                    checked={option.isCorrect}
                    onChange={(event) => updateOption(index, { isCorrect: event.target.checked })}
                  />
                  Đáp án {index + 1} đúng
                </label>
                <Button
                  variant="secondary"
                  disabled={options.length <= 2}
                  onClick={() => setOptions((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}
                >
                  Xóa đáp án
                </Button>
              </div>
              <SharedFormField
                aria-label={`Nội dung đáp án ${index + 1}`}
                required
                value={option.content}
                onChange={(event) =>
                  updateOption(index, {
                    content: event.target.value,
                  })
                }
                placeholder="Nội dung đáp án"
                className="h-10"
                bare
              />
              <SharedFormField
                aria-label={`Giải thích đáp án ${index + 1}`}
                value={option.explanation}
                onChange={(event) =>
                  updateOption(index, {
                    explanation: event.target.value,
                  })
                }
                placeholder="Giải thích (không bắt buộc)"
                className="h-10"
                bare
              />
            </Card>
          ))}
          <Button
            variant="secondary"
            onClick={() => setOptions((rows) => [...rows, { content: '', isCorrect: false, explanation: '' }])}
          >
            Thêm đáp án
          </Button>
        </fieldset>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <SubmitButton
          busy={busy}
          disabled={clos.loading || Boolean(clos.error) || topics.loading || Boolean(topics.error)}
        >
          {initial?.questionId ? 'Lưu thay đổi' : 'Tạo câu hỏi'}
        </SubmitButton>
      </Form>
    </FormDialog>
  );
}

function QuestionCloDialog({ question, busy, error, onClose, onSave }) {
  const clos = useCloCatalog([question.subjectId]);
  const [cloIds, setCloIds] = useState(question.cloIds || []);
  const [validation, setValidation] = useState('');
  return (
    <FormDialog title="Gán CLO cho câu hỏi" busy={busy} onClose={onClose}>
      <AuthAlert error>{error || validation}</AuthAlert>
      <p className="mb-4 break-words text-body-sm text-slate-500">{question.content}</p>
      <Form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (busy || clos.loading || clos.error) return;
          const issue = validateCloIds(cloIds, clos.data, question.subjectId);
          setValidation(issue);
          if (!issue) onSave([...new Set(cloIds)]);
        }}
      >
        <CloPicker subjectId={question.subjectId} resource={clos} value={cloIds} onChange={setCloIds} disabled={busy} />
        <SubmitButton busy={busy} disabled={clos.loading || Boolean(clos.error)}>
          Lưu CLO câu hỏi
        </SubmitButton>
      </Form>
    </FormDialog>
  );
}

export function AdminQuestionsApiPage({ embedded = false, scopedSubjectId = '', reviewOnly = false }) {
  const Shell = embedded ? React.Fragment : AdminPageShell;
  const [subjectId, setSubjectId] = useState(scopedSubjectId);
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [pendingCreation, setPendingCreation] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [cloTarget, setCloTarget] = useState(null);
  const [cloFilter, setCloFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState(reviewOnly ? 'PENDING' : '');
  const [search, setSearch] = useState('');
  const [review, setReview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const subjects = useCollection('/api/v1/subjects');
  const topics = useApiData(subjectId ? `/api/v1/subjects/${encodeURIComponent(subjectId)}/topics` : null);
  const query = useMemo(() => {
    const parameters = new URLSearchParams({ page: String(page), size: '20' });
    if (subjectId) parameters.set('subjectId', subjectId);
    if (topicId) parameters.set('topicId', topicId);
    if (difficulty) parameters.set('difficultyLevel', difficulty);
    return parameters.toString();
  }, [difficulty, page, subjectId, topicId]);
  const localFilters = Boolean(reviewOnly || cloFilter || approvalFilter || search.trim());
  const questions = useApiData(localFilters ? null : `/api/v1/questions?${query}`);
  // CLO, approval status and text search are not API filters: load all pages first.
  const allQuery = new URLSearchParams(query);
  allQuery.delete('page');
  const allQuestions = useCollection(localFilters ? `/api/v1/questions?${allQuery}` : null);
  const filteredQuestions = allQuestions.data.filter(
    (question) =>
      (!cloFilter || question.cloIds?.includes(cloFilter)) &&
      (!approvalFilter || question.approvalStatus === approvalFilter) &&
      (!search.trim() || question.content?.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')))
  );
  useEffect(() => {
    if (localFilters && !allQuestions.loading && !allQuestions.error) {
      setPage((current) => Math.min(current, Math.max(0, Math.ceil(filteredQuestions.length / 20) - 1)));
    }
  }, [localFilters, allQuestions.loading, allQuestions.error, filteredQuestions.length]);
  const questionResource = localFilters ? allQuestions : questions;
  const subjectRows = listItems(subjects.data).filter(
    (subject) => !scopedSubjectId || subject.subjectId === scopedSubjectId
  );
  const topicRows = listItems(topics.data);
  const questionRows = localFilters ? filteredQuestions.slice(page * 20, (page + 1) * 20) : listItems(questions.data);
  const total = localFilters ? filteredQuestions.length : (questions.data?.totalElements ?? questionRows.length);
  const clos = useCloCatalog(subjectId ? [subjectId] : questionRows.map((question) => question.subjectId));
  const subjectName = (question) =>
    question.subjectCode ||
    question.subjectName ||
    subjectRows.find((subject) => subject.subjectId === question.subjectId)?.subjectCode ||
    subjectRows.find((subject) => subject.subjectId === question.subjectId)?.subjectName ||
    '—';
  useEffect(() => {
    if (!topics.loading && !topics.error && topicId && !topicRows.some((topic) => topic.topicId === topicId))
      setTopicId('');
  }, [subjectId, topicId, topicRows, topics.loading, topics.error]);
  const start = () => {
    setBusy(true);
    setError('');
    setMessage('');
  };
  const reload = () => {
    setPage(0);
    questions.reload();
    allQuestions.reload();
    clos.reload();
    subjects.reload();
  };
  const changeFilter = (setter, value) => {
    setter(value);
    setPage(0);
  };
  async function save(payload) {
    start();
    let created;
    try {
      const result = editor?.questionId
        ? await api.questions.update(editor.questionId, payload)
        : await api.questions.create({ ...payload, approvalStatus: 'PENDING' });
      if (!editor?.questionId) {
        created = result;
        setPendingCreation(result);
        setEditor(null);
        await approveAdminQuestion(result);
        setPendingCreation(null);
      }
      setEditor(null);
      questions.reload();
      allQuestions.reload();
      clos.reload();
      setMessage(editor?.questionId ? 'Đã cập nhật câu hỏi.' : 'Đã tạo và duyệt câu hỏi.');
    } catch (requestError) {
      setError(created ? `Câu hỏi đã được tạo nhưng chưa duyệt xong. ${requestError.message}` : requestError.message);
      questions.reload();
      allQuestions.reload();
    } finally {
      setBusy(false);
    }
  }
  async function retryCreationApproval() {
    if (busy || !pendingCreation) return;
    start();
    try {
      await approveAdminQuestion(pendingCreation);
      setPendingCreation(null);
      reload();
      setMessage('Đã duyệt câu hỏi vừa tạo.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function edit(question) {
    start();
    try {
      setEditor(await api.questions.get(question.questionId));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function openReview(question) {
    start();
    try {
      setReview({ kind: 'preview', question: await api.questions.get(question.questionId) });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function submitReview(event) {
    event.preventDefault();
    if (busy || !review) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (review.kind === 'reject' && !values.rejectionReason?.trim()) {
      setError('Nhập lý do từ chối câu hỏi.');
      return;
    }
    start();
    try {
      if (review.kind === 'reject') {
        await api.questions.reject(review.question.questionId, {
          rejectionReason: values.rejectionReason.trim(),
          comment: values.comment?.trim() || '',
        });
      } else if (review.kind === 'submit') {
        await api.questions.submitReview(review.question.questionId, values.comment);
      } else await api.questions.approve(review.question.questionId, values.comment);
      questions.reload();
      allQuestions.reload();
      setMessage(
        review.kind === 'submit'
          ? 'Đã gửi câu hỏi vào hàng chờ duyệt.'
          : review.kind === 'reject'
            ? 'Đã từ chối câu hỏi.'
            : 'Đã duyệt câu hỏi.'
      );
      setReview(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    start();
    try {
      await api.questions.remove(deleting.questionId);
      questions.reload();
      allQuestions.reload();
      setDeleting(null);
      setMessage('Đã xóa câu hỏi.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function assignClos(cloIds) {
    start();
    try {
      await api.questions.assignClos(cloTarget.questionId, cloIds);
      setCloTarget(null);
      reload();
      setMessage('Đã cập nhật CLO của câu hỏi.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function downloadTemplate() {
    start();
    try {
      const blob = await api.questions.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mau-nhap-cau-hoi.xlsx';
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Đã tải mẫu Excel câu hỏi.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      {...(embedded
        ? {}
        : {
            currentPage: 'admin_questions.html',
            title: 'Ngân hàng câu hỏi',
            description: 'Quản trị viên duyệt, chỉnh sửa và xóa câu hỏi dùng trong các đề thi.',
          })}
    >
      <AuthAlert>{message}</AuthAlert>
      {pendingCreation && (
        <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-body-sm">Câu hỏi vừa tạo chưa duyệt xong.</p>
          <Button disabled={busy} onClick={retryCreationApproval}>
            Thử duyệt lại câu hỏi vừa tạo
          </Button>
        </Card>
      )}
      <AuthAlert error>{(!editor && !cloTarget && !review && error) || subjects.error || clos.error}</AuthAlert>
      {review && (
        <FormDialog
          title={
            review.kind === 'preview'
              ? 'Xem câu hỏi'
              : review.kind === 'submit'
                ? 'Gửi duyệt câu hỏi'
                : review.kind === 'reject'
                  ? 'Từ chối câu hỏi'
                  : 'Duyệt câu hỏi'
          }
          busy={busy}
          wide={review.kind === 'preview'}
          expandable={review.kind === 'preview'}
          onClose={() => !busy && setReview(null)}
        >
          {error && (
            <p role="alert" className="mb-4 text-body-sm text-red-700">
              {error}
            </p>
          )}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={review.question.approvalStatus} />
              <span className="text-body-sm text-slate-500">
                {subjectName(review.question)} · {labelFor(difficulties, review.question.difficultyLevel)}
              </span>
              <CloLabels ids={review.question.cloIds} rows={clos.data} />
            </div>
            <p className="whitespace-pre-wrap break-words">{review.question.content}</p>
            {review.kind === 'preview' ? (
              <>
                {safeUrl(review.question.mediaUrl) && (
                  <img
                    className="max-h-80 max-w-full rounded-xl object-contain"
                    src={safeUrl(review.question.mediaUrl)}
                    alt="Hình minh họa câu hỏi"
                  />
                )}
                <div className="space-y-2">
                  {(review.question.options || []).map((option, index) => (
                    <Card key={option.optionId || index} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="break-words">
                          {index + 1}. {option.content}
                        </p>
                        {option.isCorrect && <StatusBadge tone="success">Đáp án đúng</StatusBadge>}
                      </div>
                      {option.explanation && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-body-sm text-slate-500">
                          {option.explanation}
                        </p>
                      )}
                    </Card>
                  ))}
                  {review.question.acceptedAnswers?.length > 0 && (
                    <p className="text-body-sm">Đáp án chấp nhận: {review.question.acceptedAnswers.join(' · ')}</p>
                  )}
                </div>
                {review.question.rejectionReason && (
                  <p className="text-body-sm text-red-700">Lý do từ chối: {review.question.rejectionReason}</p>
                )}
                {(!reviewOnly || ['DRAFT', 'REJECTED'].includes(review.question.approvalStatus)) && (
                  <div className="flex flex-wrap justify-end gap-2">
                    {!reviewOnly && (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setReview(null);
                          edit(review.question);
                        }}
                      >
                        Chỉnh sửa câu hỏi
                      </Button>
                    )}
                    {['DRAFT', 'REJECTED'].includes(review.question.approvalStatus) && (
                      <Button
                        disabled={busy}
                        onClick={() => {
                          setError('');
                          setReview({ ...review, kind: 'submit' });
                        }}
                      >
                        {review.question.approvalStatus === 'REJECTED' ? 'Gửi duyệt lại' : 'Gửi duyệt câu hỏi'}
                      </Button>
                    )}
                  </div>
                )}
                {review.question.approvalStatus === 'PENDING' && (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        setError('');
                        setReview({ ...review, kind: 'reject' });
                      }}
                    >
                      Từ chối câu hỏi
                    </Button>
                    <Button
                      disabled={busy}
                      onClick={() => {
                        setError('');
                        setReview({ ...review, kind: 'approve' });
                      }}
                    >
                      Duyệt câu hỏi
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Form className="space-y-4" onSubmit={submitReview}>
                {review.kind === 'submit' && review.question.rejectionReason && (
                  <p className="text-body-sm text-red-700">Lý do từ chối trước đó: {review.question.rejectionReason}</p>
                )}
                {review.kind === 'reject' && (
                  <SharedFormField name="rejectionReason" label="Lý do từ chối" multiline required disabled={busy} />
                )}
                <SharedFormField name="comment" label="Nhận xét (không bắt buộc)" multiline disabled={busy} />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" disabled={busy} onClick={() => setReview(null)}>
                    Hủy
                  </Button>
                  <SubmitButton busy={busy}>
                    {review.kind === 'submit'
                      ? 'Xác nhận gửi duyệt'
                      : review.kind === 'reject'
                        ? 'Xác nhận từ chối'
                        : 'Xác nhận duyệt'}
                  </SubmitButton>
                </div>
              </Form>
            )}
          </div>
        </FormDialog>
      )}
      {editor !== null && (
        <QuestionEditor
          initial={editor || undefined}
          subjects={subjectRows}
          busy={busy}
          onClose={() => !busy && setEditor(null)}
          onSave={save}
          requestError={error}
        />
      )}
      {cloTarget && (
        <QuestionCloDialog
          question={cloTarget}
          busy={busy}
          error={error}
          onClose={() => !busy && setCloTarget(null)}
          onSave={assignClos}
        />
      )}
      {importing && (
        <FormDialog
          title="Nhập câu hỏi từ Excel"
          busy={importBusy}
          onClose={() => !importBusy && setImporting(false)}
          wide
        >
          <QuestionImportForm
            autoApprove
            initialResult={pendingImport}
            onResult={setPendingImport}
            onBusyChange={setImportBusy}
            onImported={(result) => {
              questions.reload();
              allQuestions.reload();
              clos.reload();
              setMessage(`Đã nhập ${result.totalImported ?? 0} câu, duyệt ${result.totalApproved ?? 0} câu.`);
            }}
          />
        </FormDialog>
      )}
      {deleting && (
        <ConfirmDialog
          title="Xóa câu hỏi"
          description="Câu hỏi sẽ bị xóa khỏi ngân hàng câu hỏi. Thao tác này không thể hoàn tác."
          confirmLabel="Xóa câu hỏi"
          busy={busy}
          onCancel={() => !busy && setDeleting(null)}
          onConfirm={remove}
        />
      )}
      <Card className="mt-6 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="filter-grid flex-1">
            {reviewOnly && (
              <SharedFormField
                type="search"
                name="questionSearch"
                label="Tìm câu hỏi"
                placeholder="Tìm theo nội dung…"
                value={search}
                onChange={(event) => changeFilter(setSearch, event.target.value)}
              />
            )}
            <SelectField
              label="Học phần"
              value={subjectId}
              disabled={Boolean(scopedSubjectId)}
              onChange={(event) => {
                changeFilter(setSubjectId, event.target.value);
                setTopicId('');
                setCloFilter('');
              }}
            >
              <option value="">Tất cả học phần</option>
              {subjectRows.map((subject) => (
                <option key={subject.subjectId} value={subject.subjectId}>
                  {subject.subjectCode || subject.subjectName}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Chủ đề"
              value={topicId}
              disabled={!subjectId}
              onChange={(event) => changeFilter(setTopicId, event.target.value)}
            >
              <option value="">Tất cả chủ đề</option>
              {topicRows.map((topic) => (
                <option key={topic.topicId} value={topic.topicId}>
                  {topic.topicName}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="CLO"
              name="cloFilter"
              value={cloFilter}
              disabled={!subjectId || clos.loading || Boolean(clos.error)}
              onChange={(event) => changeFilter(setCloFilter, event.target.value)}
            >
              <option value="">Tất cả CLO</option>
              {clos.data
                .filter((clo) => clo.subjectId === subjectId)
                .map((clo) => (
                  <option key={clo.cloId} value={clo.cloId}>
                    {clo.cloCode}
                    {!clo.isActive ? ' · ngừng hoạt động' : ''}
                  </option>
                ))}
            </SelectField>
            <SelectField
              label="Độ khó"
              value={difficulty}
              onChange={(event) => changeFilter(setDifficulty, event.target.value)}
            >
              <option value="">Tất cả độ khó</option>
              {difficulties.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Trạng thái"
              name="approvalFilter"
              value={approvalFilter}
              onChange={(event) => changeFilter(setApprovalFilter, event.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {['PENDING', 'DRAFT', 'APPROVED', 'REJECTED'].map((status) => (
                <option key={status} value={status}>
                  {labelOf(status)}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="flex flex-wrap gap-2">
            {reviewOnly ? (
              <Button variant="secondary" icon="refresh" disabled={busy || questionResource.loading} onClick={reload}>
                Làm mới
              </Button>
            ) : (
              <>
                <Button variant="secondary" disabled={busy} onClick={downloadTemplate}>
                  Tải mẫu Excel
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => setImporting(true)} icon="upload_file">
                  Nhập Excel
                </Button>
                <Button
                  disabled={busy || Boolean(pendingCreation)}
                  onClick={() => {
                    setError('');
                    setEditor(subjectId ? { subjectId } : {});
                  }}
                  icon="add"
                >
                  Tạo câu hỏi
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
      <Card className="mt-5 overflow-x-auto p-5">
        {questionResource.loading ? (
          <p role="status">Đang tải câu hỏi…</p>
        ) : questionResource.error ? (
          <p role="alert">
            {questionResource.error}{' '}
            <Button variant="secondary" onClick={reload}>
              Thử lại
            </Button>
          </p>
        ) : (
          <>
            <DataTable
              paginate={false}
              columns={['Nội dung', 'Học phần', 'CLO', 'Loại', 'Độ khó', 'Trạng thái', '']}
              rows={questionRows}
              renderRow={(question) => (
                <tr key={question.questionId} className="border-t border-[#E2E8F0]">
                  <td className="max-w-md p-3 font-medium">{question.content || '—'}</td>
                  <td className="p-3">{subjectName(question)}</td>
                  <td className="p-3">
                    <CloLabels ids={question.cloIds} rows={clos.data} />
                  </td>
                  <td className="p-3">{labelFor(questionTypes, question.questionType)}</td>
                  <td className="p-3">{labelFor(difficulties, question.difficultyLevel)}</td>
                  <td className="p-3">
                    <StatusBadge status={question.approvalStatus || 'PENDING'} />
                  </td>
                  <td className="p-3">
                    <ActionMenu
                      label="Thao tác với câu hỏi"
                      disabled={busy}
                      items={[
                        { label: 'Xem câu hỏi', onSelect: () => openReview(question) },
                        ['DRAFT', 'REJECTED'].includes(question.approvalStatus) && {
                          label: question.approvalStatus === 'REJECTED' ? 'Gửi duyệt lại' : 'Gửi duyệt câu hỏi',
                          onSelect: () => {
                            setError('');
                            setReview({ kind: 'submit', question });
                          },
                        },
                        question.approvalStatus === 'PENDING' && {
                          label: 'Duyệt câu hỏi',
                          onSelect: () => {
                            setError('');
                            setReview({ kind: 'approve', question });
                          },
                        },
                        question.approvalStatus === 'PENDING' && {
                          label: 'Từ chối câu hỏi',
                          onSelect: () => {
                            setError('');
                            setReview({ kind: 'reject', question });
                          },
                        },
                        !reviewOnly && { label: 'Chỉnh sửa', onSelect: () => edit(question) },
                        !reviewOnly && {
                          label: 'Gán CLO',
                          onSelect: () => {
                            setError('');
                            setCloTarget(question);
                          },
                        },
                        !reviewOnly && { label: 'Xóa', danger: true, onSelect: () => setDeleting(question) },
                      ]}
                    />
                  </td>
                </tr>
              )}
            />
            {!questionRows.length && <p className="py-6 text-center text-[#64748B]">Không có câu hỏi phù hợp.</p>}
            <Pagination
              currentPage={page + 1}
              pageSize={20}
              totalItems={total}
              onPageChange={(nextPage) => setPage(nextPage - 1)}
            />
          </>
        )}
      </Card>
    </Shell>
  );
}
