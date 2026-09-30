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

const questionTypes = [['MCQ_SINGLE', 'Một đáp án'], ['MCQ_MULTI', 'Nhiều đáp án'], ['TRUE_FALSE', 'Đúng / Sai'], ['SHORT_ANSWER', 'Trả lời ngắn']];
const difficulties = [['EASY', 'Dễ'], ['MEDIUM', 'Trung bình'], ['HARD', 'Khó']];
const labelFor = (options, value) => options.find(([id]) => id === value)?.[1] || value || '—';
const optionRows = (initial) => Array.isArray(initial?.options) && initial.options.length ? initial.options.map((item) => ({ content: item.content || '', isCorrect: Boolean(item.isCorrect), explanation: item.explanation || '' })) : Array.from({ length: 2 }, () => ({ content: '', isCorrect: false, explanation: '' }));

function QuestionEditor({ initial, subjects, busy, onClose, onSave }) {
  const [subjectId, setSubjectId] = useState(initial?.subjectId || '');
  const [topicId, setTopicId] = useState(initial?.topicId || '');
  const [type, setType] = useState(initial?.questionType || 'MCQ_SINGLE');
  const [options, setOptions] = useState(() => optionRows(initial));
  const [error, setError] = useState('');
  const topics = useApiData(subjectId ? `/api/v1/subjects/${encodeURIComponent(subjectId)}/topics` : null);
  const topicRows = listItems(topics.data);
  useEffect(() => { if (topicId && !topicRows.some((topic) => topic.topicId === topicId)) setTopicId(''); }, [subjectId, topicId, topicRows]);
  const updateOption = (index, patch) => setOptions((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : type === 'MCQ_SINGLE' && patch.isCorrect ? { ...row, isCorrect: false } : row));
  const submit = (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const preparedOptions = options.map((option, orderIndex) => ({ ...option, content: option.content.trim(), explanation: option.explanation.trim(), orderIndex })).filter((option) => option.content);
    if (!subjectId || !topicId) return setError('Vui lòng chọn học phần và chủ đề.');
    if (!values.content.trim()) return setError('Vui lòng nhập nội dung câu hỏi.');
    if (type !== 'SHORT_ANSWER' && (preparedOptions.length < 2 || !preparedOptions.some((option) => option.isCorrect))) return setError('Câu trắc nghiệm cần ít nhất 2 đáp án và phải có đáp án đúng.');
    setError('');
    onSave({ subjectId, topicId, questionType: type, content: values.content.trim(), mediaUrl: values.mediaUrl.trim(), difficultyLevel: values.difficultyLevel, cognitiveLevel: values.cognitiveLevel.trim(), options: preparedOptions });
  };
  return <FormDialog title={initial?.questionId ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi'} busy={busy} wide onClose={onClose}>
    <Form className="grid gap-4" onSubmit={submit} busy={busy}>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Học phần *" value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicId(''); }} required><option value="">Chọn học phần</option>{subjects.map((subject) => <option key={subject.subjectId} value={subject.subjectId}>{subject.subjectCode ? `${subject.subjectCode} — ${subject.subjectName}` : subject.subjectName}</option>)}</SelectField>
        <SelectField label="Chủ đề *" value={topicId} onChange={(event) => setTopicId(event.target.value)} disabled={!subjectId || topics.loading} required><option value="">{subjectId ? 'Chọn chủ đề' : 'Chọn học phần trước'}</option>{topicRows.map((topic) => <option key={topic.topicId} value={topic.topicId}>{topic.topicName}</option>)}</SelectField>
        <SelectField label="Loại câu hỏi" value={type} onChange={(event) => setType(event.target.value)}>{questionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
        <SelectField label="Độ khó" name="difficultyLevel" defaultValue={initial?.difficultyLevel || 'EASY'}>{difficulties.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
      </div>
      <label className="grid gap-1.5 text-body-sm font-medium">Nội dung câu hỏi *<textarea name="content" required rows="4" defaultValue={initial?.content || ''} className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2" /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-body-sm font-medium">Mức nhận thức<input name="cognitiveLevel" defaultValue={initial?.cognitiveLevel || ''} className="h-10 rounded-xl border border-[#CBD5E1] px-3" /></label>
        <label className="grid gap-1.5 text-body-sm font-medium">URL hình ảnh<input name="mediaUrl" type="url" defaultValue={initial?.mediaUrl || ''} className="h-10 rounded-xl border border-[#CBD5E1] px-3" /></label>
      </div>
      <fieldset className="grid gap-3"><legend className="font-semibold">Đáp án</legend>{options.map((option, index) => <Card as="div" className="grid gap-3 p-4" key={index}>
        <div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-body-sm font-medium"><input type={type === 'MCQ_SINGLE' ? 'radio' : 'checkbox'} name={type === 'MCQ_SINGLE' ? 'correct-answer' : `correct-${index}`} checked={option.isCorrect} onChange={(event) => updateOption(index, { isCorrect: event.target.checked })} />Đáp án {index + 1} đúng</label><Button variant="secondary" disabled={options.length <= 2} onClick={() => setOptions((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>Xóa đáp án</Button></div>
        <input aria-label={`Nội dung đáp án ${index + 1}`} required value={option.content} onChange={(event) => updateOption(index, { content: event.target.value })} placeholder="Nội dung đáp án" className="h-10 rounded-xl border border-[#CBD5E1] px-3" />
        <input aria-label={`Giải thích đáp án ${index + 1}`} value={option.explanation} onChange={(event) => updateOption(index, { explanation: event.target.value })} placeholder="Giải thích (không bắt buộc)" className="h-10 rounded-xl border border-[#CBD5E1] px-3" />
      </Card>)}<Button variant="secondary" onClick={() => setOptions((rows) => [...rows, { content: '', isCorrect: false, explanation: '' }])}>Thêm đáp án</Button></fieldset>
      {error && <p role="alert" className="text-red-700">{error}</p>}<SubmitButton busy={busy}>{initial ? 'Lưu thay đổi' : 'Tạo câu hỏi'}</SubmitButton>
    </Form>
  </FormDialog>;
}

export function AdminQuestionsApiPage() {
  const [subjectId, setSubjectId] = useState(''); const [topicId, setTopicId] = useState(''); const [difficulty, setDifficulty] = useState(''); const [page, setPage] = useState(0); const [editor, setEditor] = useState(null); const [importing, setImporting] = useState(false); const [deleting, setDeleting] = useState(null); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const subjects = useApiData('/api/v1/subjects?page=0&size=100'); const topics = useApiData(subjectId ? `/api/v1/subjects/${encodeURIComponent(subjectId)}/topics` : null);
  const query = useMemo(() => { const parameters = new URLSearchParams({ page: String(page), size: '20' }); if (subjectId) parameters.set('subjectId', subjectId); if (topicId) parameters.set('topicId', topicId); if (difficulty) parameters.set('difficultyLevel', difficulty); return parameters.toString(); }, [difficulty, page, subjectId, topicId]);
  const questions = useApiData(`/api/v1/questions?${query}`); const subjectRows = listItems(subjects.data); const topicRows = listItems(topics.data); const questionRows = listItems(questions.data); const total = questions.data?.totalElements ?? questionRows.length;
  const subjectName = (question) => question.subjectCode || question.subjectName || subjectRows.find((subject) => subject.subjectId === question.subjectId)?.subjectCode || subjectRows.find((subject) => subject.subjectId === question.subjectId)?.subjectName || '—';
  useEffect(() => { if (topicId && !topicRows.some((topic) => topic.topicId === topicId)) setTopicId(''); }, [subjectId, topicId, topicRows]);
  const start = () => { setBusy(true); setError(''); setMessage(''); }; const reload = () => { questions.reload(); subjects.reload(); }; const changeFilter = (setter, value) => { setter(value); setPage(0); };
  async function save(payload) { start(); try { const result = editor?.questionId ? await api.questions.update(editor.questionId, payload) : await api.questions.create(payload); setEditor(null); questions.reload(); setMessage(editor?.questionId ? 'Đã cập nhật câu hỏi.' : `Đã tạo câu hỏi ${result?.questionId ? 'và đang chờ duyệt.' : 'mới.'}`); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } }
  async function edit(question) { start(); try { setEditor(await api.questions.get(question.questionId)); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } }
  async function approve(question) { start(); try { await api.questions.approve(question.questionId); questions.reload(); setMessage('Đã duyệt câu hỏi.'); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } }
  async function remove() { if (!deleting) return; start(); try { await api.questions.remove(deleting.questionId); questions.reload(); setDeleting(null); setMessage('Đã xóa câu hỏi.'); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } }
  async function downloadTemplate() { start(); try { const blob = await api.questions.downloadTemplate(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'mau-nhap-cau-hoi.xlsx'; link.click(); URL.revokeObjectURL(url); setMessage('Đã tải mẫu Excel câu hỏi.'); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } }
  return <AdminPageShell currentPage="admin_questions.html" title="Ngân hàng câu hỏi" description="Quản trị viên duyệt, chỉnh sửa và xóa câu hỏi dùng trong các đề thi.">
    <AuthAlert>{message}</AuthAlert><AuthAlert error>{error}</AuthAlert>{editor !== null && <QuestionEditor initial={editor || undefined} subjects={subjectRows} busy={busy} onClose={() => !busy && setEditor(null)} onSave={save} />}{importing && <FormDialog title="Nhập câu hỏi từ Excel" onClose={() => setImporting(false)} wide><QuestionImportForm onImported={(result) => { questions.reload(); setMessage(`Đã đọc ${result.totalParsed ?? 0} câu, nhập thành công ${result.totalImported ?? 0} câu.`); }} /></FormDialog>}{deleting && <ConfirmDialog title="Xóa câu hỏi" description="Câu hỏi sẽ bị xóa khỏi ngân hàng câu hỏi. Thao tác này không thể hoàn tác." confirmLabel="Xóa câu hỏi" busy={busy} onCancel={() => !busy && setDeleting(null)} onConfirm={remove} />}
    <Card className="mt-6 p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="grid flex-1 gap-3 sm:grid-cols-3">
      <SelectField label="Học phần" value={subjectId} onChange={(event) => { changeFilter(setSubjectId, event.target.value); setTopicId(''); }}><option value="">Tất cả học phần</option>{subjectRows.map((subject) => <option key={subject.subjectId} value={subject.subjectId}>{subject.subjectCode || subject.subjectName}</option>)}</SelectField>
      <SelectField label="Chủ đề" value={topicId} disabled={!subjectId} onChange={(event) => changeFilter(setTopicId, event.target.value)}><option value="">Tất cả chủ đề</option>{topicRows.map((topic) => <option key={topic.topicId} value={topic.topicId}>{topic.topicName}</option>)}</SelectField>
      <SelectField label="Độ khó" value={difficulty} onChange={(event) => changeFilter(setDifficulty, event.target.value)}><option value="">Tất cả độ khó</option>{difficulties.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
    </div><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={busy} onClick={downloadTemplate}>Tải mẫu Excel</Button><Button variant="secondary" disabled={busy} onClick={() => setImporting(true)} icon="upload_file">Nhập Excel</Button><Button onClick={() => setEditor({})} icon="add">Tạo câu hỏi</Button></div></div></Card>
    <Card className="mt-5 overflow-x-auto p-5">{questions.loading ? <p role="status">Đang tải câu hỏi…</p> : questions.error ? <p role="alert">{questions.error} <Button variant="secondary" onClick={reload}>Thử lại</Button></p> : <>
      <DataTable paginate={false} columns={['Nội dung', 'Học phần', 'Loại', 'Độ khó', 'Trạng thái', '']} rows={questionRows} renderRow={(question) => <tr key={question.questionId} className="border-t border-[#E2E8F0]"><td className="max-w-md p-3 font-medium">{question.content || '—'}</td><td className="p-3">{subjectName(question)}</td><td className="p-3">{labelFor(questionTypes, question.questionType)}</td><td className="p-3">{labelFor(difficulties, question.difficultyLevel)}</td><td className="p-3"><StatusBadge tone={question.approvalStatus === 'APPROVED' ? 'success' : 'warning'}>{question.approvalStatus === 'APPROVED' ? 'Đã duyệt' : question.approvalStatus || 'Chờ duyệt'}</StatusBadge></td><td className="p-3"><ActionMenu label="Thao tác với câu hỏi" disabled={busy} items={[question.approvalStatus !== 'APPROVED' && { label: 'Duyệt câu hỏi', onSelect: () => approve(question) }, { label: 'Chỉnh sửa', onSelect: () => edit(question) }, { label: 'Xóa', danger: true, onSelect: () => setDeleting(question) }]} /></td></tr>} />
      {!questionRows.length && <p className="py-6 text-center text-[#64748B]">Không có câu hỏi phù hợp.</p>}<Pagination currentPage={page + 1} pageSize={20} totalItems={total} onPageChange={(nextPage) => setPage(nextPage - 1)} />
    </>}</Card>
  </AdminPageShell>;
}
