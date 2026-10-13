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
import { useApiData, listItems } from '../../hooks/useApiData.js';
import { api } from '../../lib/apiClient.js';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { labelOf } from '../../lib/lecturerUtils.js';

const questionTypes = [
  ['MCQ_SINGLE', 'Một đáp án'],
  ['MCQ_MULTI', 'Nhiều đáp án'],
  ['TRUE_FALSE', 'Đúng / Sai'],
  ['SHORT_ANSWER', 'Trả lời ngắn'],
  ['FILL_BLANK', 'Điền khuyết'],
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

function QuestionEditor({ initial, subjects, busy, onClose, onSave }) {
  const [subjectId, setSubjectId] = useState(initial?.subjectId || '');
  const [topicId, setTopicId] = useState(initial?.topicId || '');
  const [type, setType] = useState(initial?.questionType || 'MCQ_SINGLE');
  const [options, setOptions] = useState(() => optionRows(initial));
  const [cloIds, setCloIds] = useState(initial?.cloIds || []);
  const clos = useApiData(subjectId ? `/api/v1/subjects/${subjectId}/clos` : null);
  const [error, setError] = useState('');
  const topics = useApiData(subjectId ? `/api/v1/subjects/${encodeURIComponent(subjectId)}/topics` : null);
  const topicRows = listItems(topics.data);
  useEffect(() => {
    if (!topics.loading && !topics.error && topicId && !topicRows.some((topic) => topic.topicId === topicId))
      setTopicId('');
  }, [subjectId, topicId, topicRows]);
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
    if (!values.content.trim()) return setError('Vui lòng nhập nội dung câu hỏi.');
    if (
      !['SHORT_ANSWER', 'FILL_BLANK'].includes(type) &&
      (preparedOptions.length < 2 || !preparedOptions.some((option) => option.isCorrect))
    )
      return setError('Câu trắc nghiệm cần ít nhất 2 đáp án và phải có đáp án đúng.');
    const acceptedAnswers = String(values.acceptedAnswers || '')
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);
    if (type === 'FILL_BLANK' && !acceptedAnswers.length) return setError('Nhập đáp án chấp nhận.');
    if (type === 'MCQ_SINGLE' && preparedOptions.filter((row) => row.isCorrect).length !== 1)
      return setError('Chọn đúng một đáp án.');
    setError('');
    onSave({
      subjectId,
      topicId,
      questionType: type,
      content: values.content.trim(),
      mediaUrl: values.mediaUrl.trim(),
      difficultyLevel: values.difficultyLevel,
      cognitiveLevel: values.cognitiveLevel.trim(),
      options: ['FILL_BLANK', 'SHORT_ANSWER'].includes(type) ? [] : preparedOptions,
      acceptedAnswers: type === 'FILL_BLANK' ? acceptedAnswers : [],
      cloIds,
      approvalStatus: 'DRAFT',
    });
  };
  return (
    <FormDialog title={initial?.questionId ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi'} busy={busy} wide onClose={onClose}>
      <Form className="grid gap-4" onSubmit={submit} busy={busy}>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Học phần *"
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
        {(topics.error || clos.error) && <p role="alert">{topics.error || clos.error}</p>}
        <fieldset className="grid gap-2">
          <legend className="font-semibold">Chuẩn đầu ra</legend>
          {listItems(clos.data)
            .filter((row) => row.isActive !== false || cloIds.includes(row.cloId))
            .map((row) => (
              <label key={row.cloId} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  disabled={busy}
                  checked={cloIds.includes(row.cloId)}
                  onChange={(e) =>
                    setCloIds((ids) => (e.target.checked ? [...ids, row.cloId] : ids.filter((id) => id !== row.cloId)))
                  }
                />
                {row.cloCode} · {row.description}
              </label>
            ))}
        </fieldset>
        {type === 'FILL_BLANK' && (
          <SharedFormField
            name="acceptedAnswers"
            label="Đáp án chấp nhận · mỗi dòng một đáp án"
            multiline
            required
            defaultValue={(initial?.acceptedAnswers || []).join('\n')}
          />
        )}
        {!['FILL_BLANK', 'SHORT_ANSWER'].includes(type) && (
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
        )}
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <SubmitButton busy={busy}>{initial ? 'Lưu thay đổi' : 'Tạo câu hỏi'}</SubmitButton>
      </Form>
    </FormDialog>
  );
}

export function AdminQuestionsApiPage() {
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [chapterId, setChapterId] = useState('');
  const chapters = useApiData(subjectId ? `/api/v1/subjects/${subjectId}/chapters` : null);
  const [rejecting, setRejecting] = useState(null);
  const [history, setHistory] = useState(null);
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState(null);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const subjects = useApiData('/api/v1/subjects?page=0&size=100');
  const topics = useApiData(subjectId ? `/api/v1/subjects/${encodeURIComponent(subjectId)}/topics` : null);
  const query = useMemo(() => {
    const parameters = new URLSearchParams({ page: String(page), size: '20' });
    if (subjectId) parameters.set('subjectId', subjectId);
    if (chapterId) parameters.set('chapterId', chapterId);
    if (topicId) parameters.set('topicId', topicId);
    if (difficulty) parameters.set('difficultyLevel', difficulty);
    return parameters.toString();
  }, [chapterId, difficulty, page, subjectId, topicId]);
  const questions = useApiData(`/api/v1/questions?${query}`);
  const subjectRows = listItems(subjects.data);
  const topicRows = listItems(topics.data);
  const questionRows = listItems(questions.data);
  const total = questions.data?.totalElements ?? questionRows.length;
  const subjectName = (question) =>
    question.subjectCode ||
    question.subjectName ||
    subjectRows.find((subject) => subject.subjectId === question.subjectId)?.subjectCode ||
    subjectRows.find((subject) => subject.subjectId === question.subjectId)?.subjectName ||
    '—';
  useEffect(() => {
    if (!topics.loading && !topics.error && topicId && !topicRows.some((topic) => topic.topicId === topicId))
      setTopicId('');
  }, [subjectId, topicId, topicRows]);
  const start = () => {
    setBusy(true);
    setError('');
    setMessage('');
  };
  const reload = () => {
    questions.reload();
    subjects.reload();
  };
  const changeFilter = (setter, value) => {
    setter(value);
    setPage(0);
  };
  async function save(payload) {
    start();
    try {
      const result = editor?.questionId
        ? await api.questions.update(editor.questionId, payload)
        : await api.questions.create(payload);
      setEditor(null);
      questions.reload();
      setMessage(editor?.questionId ? 'Đã cập nhật câu hỏi.' : 'Đã lưu bản nháp.');
    } catch (requestError) {
      setError(requestError.message);
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
  async function govern(question, operation) {
    start();
    try {
      const result = await operation();
      questions.updateData((data) => ({
        ...data,
        content: listItems(data).map((row) => (row.questionId === question.questionId ? result : row)),
      }));
      setMessage('Đã cập nhật trạng thái.');
      setRejecting(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function showHistory(question) {
    start();
    try {
      setHistory({ question, rows: await api.questions.approvals(question.questionId) });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function approve(question) {
    start();
    try {
      await api.questions.approve(question.questionId);
      questions.reload();
      setMessage('Đã duyệt câu hỏi.');
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
      setDeleting(null);
      setMessage('Đã xóa câu hỏi.');
    } catch (requestError) {
      setError(requestError.message);
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
    <AdminPageShell
      currentPage="admin_questions.html"
      title="Ngân hàng câu hỏi"
      description="Quản trị viên duyệt, chỉnh sửa và xóa câu hỏi dùng trong các đề thi."
    >
      {rejecting && (
        <FormDialog title="Từ chối câu hỏi" busy={busy} onClose={() => !busy && setRejecting(null)}>
          <Form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const body = Object.fromEntries(new FormData(e.currentTarget));
              govern(rejecting, () => api.questions.reject(rejecting.questionId, body));
            }}
          >
            <SharedFormField label="Lý do" name="rejectionReason" multiline required />
            <SubmitButton disabled={busy}>Từ chối</SubmitButton>
          </Form>
        </FormDialog>
      )}
      {history && (
        <FormDialog title="Lịch sử duyệt" onClose={() => setHistory(null)}>
          <ul className="divide-y">
            {listItems(history.rows).map((row) => (
              <li key={row.approvalId} className="py-3">
                <strong>{row.action}</strong>
                <p>
                  {row.fromStatus} → {row.toStatus}
                </p>
                <p>{row.comment}</p>
                <time>{row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : ''}</time>
              </li>
            ))}
          </ul>
          {history.question.rejectionReason && <p>{history.question.rejectionReason}</p>}
        </FormDialog>
      )}
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      {editor !== null && (
        <QuestionEditor
          initial={editor || undefined}
          subjects={subjectRows}
          busy={busy}
          onClose={() => !busy && setEditor(null)}
          onSave={save}
        />
      )}
      {importing && (
        <FormDialog title="Nhập câu hỏi từ Excel" onClose={() => setImporting(false)} wide>
          <QuestionImportForm
            onImported={(result) => {
              questions.reload();
              setMessage(`Đã đọc ${result.totalParsed ?? 0} câu, nhập thành công ${result.totalImported ?? 0} câu.`);
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
            <SelectField
              label="Học phần"
              value={subjectId}
              onChange={(event) => {
                changeFilter(setSubjectId, event.target.value);
                setTopicId('');
                setChapterId('');
                setChapterId('');
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
              label="Chương"
              value={chapterId}
              disabled={!subjectId || chapters.loading}
              onChange={(e) => {
                changeFilter(setChapterId, e.target.value);
                setTopicId('');
              }}
            >
              <option value="">Tất cả chương</option>
              {listItems(chapters.data).map((row) => (
                <option key={row.chapterId} value={row.chapterId}>
                  {row.chapterName}
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
              {topicRows
                .filter((topic) => !chapterId || topic.chapterId === chapterId)
                .map((topic) => (
                  <option key={topic.topicId} value={topic.topicId}>
                    {topic.topicName}
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
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={busy} onClick={downloadTemplate}>
              Tải mẫu Excel
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setImporting(true)} icon="upload_file">
              Nhập Excel
            </Button>
            <Button onClick={() => setEditor({})} icon="add">
              Tạo câu hỏi
            </Button>
          </div>
        </div>
      </Card>
      <Card className="mt-5 overflow-x-auto p-5">
        {questions.loading ? (
          <p role="status">Đang tải câu hỏi…</p>
        ) : questions.error ? (
          <p role="alert">
            {questions.error}{' '}
            <Button variant="secondary" onClick={reload}>
              Thử lại
            </Button>
          </p>
        ) : (
          <>
            <DataTable
              paginate={false}
              columns={['Nội dung', 'Học phần', 'Loại', 'Độ khó', 'Trạng thái', '']}
              rows={questionRows}
              renderRow={(question) => (
                <tr key={question.questionId} className="border-t border-[#E2E8F0]">
                  <td className="max-w-md p-3 font-medium">{question.content || '—'}</td>
                  <td className="p-3">{subjectName(question)}</td>
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
                        question.approvalStatus === 'PENDING' && {
                          label: 'Duyệt câu hỏi',
                          onSelect: () => approve(question),
                        },
                        ['DRAFT', 'REJECTED'].includes(question.approvalStatus) && {
                          label: 'Gửi duyệt',
                          onSelect: () => govern(question, () => api.questions.submitReview(question.questionId)),
                        },
                        question.approvalStatus === 'PENDING' && {
                          label: 'Từ chối',
                          onSelect: () => setRejecting(question),
                        },
                        { label: 'Lịch sử duyệt', onSelect: () => showHistory(question) },
                        { label: 'Chỉnh sửa', onSelect: () => edit(question) },
                        { label: 'Xóa', danger: true, onSelect: () => setDeleting(question) },
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
    </AdminPageShell>
  );
}
