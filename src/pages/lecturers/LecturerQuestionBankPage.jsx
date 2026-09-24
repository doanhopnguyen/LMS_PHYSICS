import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import {
  cognitiveLevelLabels,
  assessments,
  lecturerMaterials,
  lecturerQuestions,
  materialChapterLabels,
  materialStatusMeta,
  questionBankStats,
  questionChapterLabels,
  questionTypeLabels,
} from '../../data/lecturerData.js';

const clos = ['CLO1', 'CLO2', 'CLO3', 'CLO4'];
const initialAnswers = ['A', 'B', 'C', 'D'].map((id) => ({ id, content: '', correct: false }));
const emptyForm = {
  id: '', chapterId: '', topic: '', cognitiveLevel: '', clo: '', type: 'SINGLE_CHOICE',
  content: '', keywords: '', guidance: '', answers: initialAnswers, explanation: '',
  sourceMaterialId: '', sourcePage: '', status: 'DRAFT',
};

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`)) : '—';
}

function nextQuestionId(questions, chapterId) {
  const prefix = `Q-${chapterId}-`;
  const next = Math.max(0, ...questions.filter((item) => item.id.startsWith(prefix)).map((item) => Number(item.id.slice(prefix.length)) || 0)) + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

function QuestionFormModal({ question, questions, approvedMaterials, onClose, onSave }) {
  const [form, setForm] = useState(() => question ? {
    ...question,
    keywords: question.keywords.join(', '),
    guidance: question.guidance ?? '',
    answers: question.answers.map((answer) => ({ ...answer })),
  } : { ...emptyForm, answers: initialAnswers.map((answer) => ({ ...answer })) });
  const [errors, setErrors] = useState({});

  const update = (field, value) => setForm((current) => {
    if (field === 'chapterId' && !question) return { ...current, chapterId: value, id: value ? nextQuestionId(questions, value) : '' };
    if (field === 'type' && value === 'SINGLE_CHOICE') {
      let found = false;
      return { ...current, type: value, answers: current.answers.map((answer) => ({ ...answer, correct: answer.correct && !found ? (found = true) : false })) };
    }
    return { ...current, [field]: value };
  });
  const updateAnswer = (index, field, value) => setForm((current) => ({
    ...current,
    answers: current.answers.map((answer, answerIndex) => {
      if (field === 'correct' && current.type === 'SINGLE_CHOICE') return { ...answer, correct: answerIndex === index };
      return answerIndex === index ? { ...answer, [field]: value } : answer;
    }),
  }));
  const addAnswer = () => setForm((current) => ({ ...current, answers: [...current.answers, { id: String.fromCharCode(65 + current.answers.length), content: '', correct: false }] }));
  const removeAnswer = (index) => setForm((current) => ({ ...current, answers: current.answers.filter((_, answerIndex) => answerIndex !== index).map((answer, answerIndex) => ({ ...answer, id: String.fromCharCode(65 + answerIndex) })) }));

  const validate = () => {
    const nextErrors = {};
    if (!form.content.trim()) nextErrors.content = 'Vui lòng nhập nội dung câu hỏi.';
    if (!form.chapterId) nextErrors.chapterId = 'Vui lòng chọn chương.';
    if (!form.topic.trim()) nextErrors.topic = 'Vui lòng nhập chủ đề.';
    if (!form.cognitiveLevel) nextErrors.cognitiveLevel = 'Vui lòng chọn mức độ nhận thức.';
    if (!form.clo) nextErrors.clo = 'Vui lòng chọn CLO.';
    const usableAnswers = form.answers.filter((answer) => answer.content.trim());
    const correctCount = usableAnswers.filter((answer) => answer.correct).length;
    if (usableAnswers.length < 2) nextErrors.answers = 'Câu hỏi phải có ít nhất 2 đáp án có nội dung.';
    else if (correctCount === 0) nextErrors.answers = 'Vui lòng chọn ít nhất một đáp án đúng.';
    else if (form.type === 'SINGLE_CHOICE' && correctCount !== 1) nextErrors.answers = 'Câu hỏi một đáp án chỉ được có đúng 1 đáp án đúng.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const save = (status) => {
    if (!validate()) return;
    onSave({
      ...form,
      id: form.id || nextQuestionId(questions, form.chapterId),
      topic: form.topic.trim(), content: form.content.trim(), guidance: form.guidance.trim(),
      keywords: form.keywords.split(',').map((item) => item.trim()).filter(Boolean),
      answers: form.answers.filter((answer) => answer.content.trim()).map((answer) => ({ ...answer, content: answer.content.trim() })),
      explanation: form.explanation.trim(), status,
    });
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#0F172A]/45 p-2 md:p-6" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="max-h-[calc(100dvh-16px)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="question-form-title">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white p-5 md:px-6"><div><p className="text-label-md font-bold text-primary">NGÂN HÀNG CÂU HỎI</p><h2 id="question-form-title" className="text-headline-md font-bold">{question ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi'}</h2></div><button type="button" onClick={onClose} aria-label="Đóng biểu mẫu" className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]"><span className="material-symbols-outlined">close</span></button></div>
        <div className="space-y-6 p-5 md:p-6">
          <section><h3 className="text-headline-sm font-bold">Thông tin cơ bản</h3><div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <label className="text-body-sm font-semibold">Mã câu hỏi<input value={form.id || (form.chapterId ? nextQuestionId(questions, form.chapterId) : 'Tự sinh sau khi chọn chương')} readOnly className="mt-2 w-full border border-[#CBD5E1] bg-[#F8FAFC] px-4" /></label>
            <label className="text-body-sm font-semibold">Chương *<select value={form.chapterId} onChange={(event) => update('chapterId', event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-4" aria-invalid={Boolean(errors.chapterId)}><option value="">Chọn chương</option>{Object.entries(questionChapterLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{errors.chapterId && <span className="mt-1 block text-body-sm text-primary">{errors.chapterId}</span>}</label>
            <label className="text-body-sm font-semibold">Chủ đề *<input value={form.topic} onChange={(event) => update('topic', event.target.value)} className="mt-2 w-full border border-[#CBD5E1] px-4" aria-invalid={Boolean(errors.topic)} />{errors.topic && <span className="mt-1 block text-body-sm text-primary">{errors.topic}</span>}</label>
            <label className="text-body-sm font-semibold">Mức độ nhận thức *<select value={form.cognitiveLevel} onChange={(event) => update('cognitiveLevel', event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"><option value="">Chọn mức độ</option>{Object.entries(cognitiveLevelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{errors.cognitiveLevel && <span className="mt-1 block text-body-sm text-primary">{errors.cognitiveLevel}</span>}</label>
            <label className="text-body-sm font-semibold">CLO *<select value={form.clo} onChange={(event) => update('clo', event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"><option value="">Chọn CLO</option>{clos.map((clo) => <option key={clo}>{clo}</option>)}</select>{errors.clo && <span className="mt-1 block text-body-sm text-primary">{errors.clo}</span>}</label>
            <label className="text-body-sm font-semibold">Loại câu hỏi *<select value={form.type} onChange={(event) => update('type', event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-4">{Object.entries(questionTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div><label className="mt-4 block text-body-sm font-semibold">Từ khóa<input value={form.keywords} onChange={(event) => update('keywords', event.target.value)} placeholder="Ví dụ: newton, gia tốc, hợp lực" className="mt-2 w-full border border-[#CBD5E1] px-4" /></label></section>

          <section className="border-t border-[#E2E8F0] pt-6"><h3 className="text-headline-sm font-bold">Nội dung câu hỏi</h3><label className="mt-4 block text-body-sm font-semibold">Nội dung *<textarea value={form.content} onChange={(event) => update('content', event.target.value)} rows="4" placeholder="Nhập nội dung câu hỏi..." className="mt-2 w-full border border-[#CBD5E1] p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-[#FEE2E2]" aria-invalid={Boolean(errors.content)} />{errors.content && <span className="mt-1 block text-body-sm text-primary">{errors.content}</span>}</label><label className="mt-4 block text-body-sm font-semibold">Giải thích/Hướng dẫn<textarea value={form.guidance} onChange={(event) => update('guidance', event.target.value)} rows="2" className="mt-2 w-full border border-[#CBD5E1] p-3" /></label></section>

          <section className="border-t border-[#E2E8F0] pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-headline-sm font-bold">Quản lý đáp án</h3><p className="mt-1 text-body-sm text-[#64748B]">{form.type === 'SINGLE_CHOICE' ? 'Chọn đúng một đáp án.' : 'Có thể chọn nhiều đáp án đúng.'}</p></div><Button type="button" variant="secondary" icon="add" onClick={addAnswer}>Thêm đáp án</Button></div><div className="mt-4 space-y-3">{form.answers.map((answer, index) => <Card as="div" key={`${answer.id}-${index}`} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3"><label className="flex flex-1 items-center gap-3"><input type={form.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'} name="correct-answer" checked={answer.correct} onChange={(event) => updateAnswer(index, 'correct', event.target.checked)} className="h-5 w-5 accent-[#E52220]" aria-label={`Đánh dấu đáp án ${answer.id} là đúng`} /><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] font-bold">{answer.id}</span><input value={answer.content} onChange={(event) => updateAnswer(index, 'content', event.target.value)} placeholder={`Nội dung đáp án ${answer.id}`} className="w-full border border-[#CBD5E1] px-4" /></label><button type="button" onClick={() => removeAnswer(index)} aria-label={`Xóa đáp án ${answer.id}`} className="self-end text-[#64748B] hover:text-primary sm:self-auto"><span className="material-symbols-outlined">delete</span></button></Card>)}</div>{errors.answers && <p className="mt-2 text-body-sm text-primary">{errors.answers}</p>}</section>

          <section className="border-t border-[#E2E8F0] pt-6"><h3 className="text-headline-sm font-bold">Lời giải / Giải thích đáp án</h3><textarea aria-label="Lời giải hoặc giải thích đáp án" value={form.explanation} onChange={(event) => update('explanation', event.target.value)} rows="5" placeholder="Nhập lời giải để sinh viên xem sau khi làm bài..." className="mt-4 w-full border border-[#CBD5E1] p-3" /></section>

          <section className="border-t border-[#E2E8F0] pt-6"><h3 className="text-headline-sm font-bold">Nguồn tham khảo</h3><p className="mt-1 text-body-sm text-[#64748B]">Chỉ hiển thị học liệu đã được phê duyệt.</p><div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"><label className="text-body-sm font-semibold">Học liệu<select value={form.sourceMaterialId} onChange={(event) => update('sourceMaterialId', event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"><option value="">Không chọn nguồn</option>{approvedMaterials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label><label className="text-body-sm font-semibold">Trang<input value={form.sourcePage} onChange={(event) => update('sourcePage', event.target.value)} placeholder="Ví dụ: 52" className="mt-2 w-full border border-[#CBD5E1] px-4" /></label></div></section>

          <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-[#E2E8F0] bg-white p-5 sm:flex-row sm:justify-end md:-mx-6 md:-mb-6 md:px-6"><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button type="button" variant="secondary" icon="save" onClick={() => save('DRAFT')}>Lưu bản nháp</Button><Button type="button" icon="send" onClick={() => save('PENDING_APPROVAL')}>Lưu & gửi phê duyệt</Button></div>
        </div>
      </section>
    </div>
  );
}

function QuestionDetailModal({ question, materials, onClose }) {
  const source = materials.find((item) => item.id === question.sourceMaterialId);
  const status = materialStatusMeta[question.status];
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#0F172A]/45 p-2 md:p-6" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="max-h-[calc(100dvh-16px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="question-detail-title"><div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] p-5 md:p-6"><div><div className="flex flex-wrap gap-2"><StatusBadge tone={status.tone}>{status.label}</StatusBadge><StatusBadge tone="neutral">{question.id}</StatusBadge></div><h2 id="question-detail-title" className="mt-3 text-headline-md font-bold">Chi tiết câu hỏi</h2></div><button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]"><span className="material-symbols-outlined">close</span></button></div><div className="space-y-5 p-5 md:p-6">
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-body-sm"><div><dt className="text-[#64748B]">Chương</dt><dd className="mt-1 font-semibold">{questionChapterLabels[question.chapterId]}</dd></div><div><dt className="text-[#64748B]">Chủ đề</dt><dd className="mt-1 font-semibold">{question.topic}</dd></div><div><dt className="text-[#64748B]">Mức độ</dt><dd className="mt-1 font-semibold">{cognitiveLevelLabels[question.cognitiveLevel]}</dd></div><div><dt className="text-[#64748B]">CLO · Loại</dt><dd className="mt-1 font-semibold">{question.clo} · {questionTypeLabels[question.type]}</dd></div></dl>
      <Card className="p-5"><h3 className="text-body-lg font-semibold leading-7">{question.content}</h3><div className="mt-5 space-y-2">{question.answers.map((answer) => <Card as="div" key={answer.id} className={`flex gap-3 border p-3 ${answer.correct ? 'border-[#86EFAC] bg-[#F0FDF4]' : 'border-[#E2E8F0]'}`}><strong>{answer.id}.</strong><span className={answer.correct ? 'font-semibold text-[#15803D]' : ''}>{answer.content}{answer.correct && ' — Đáp án đúng'}</span></Card>)}</div></Card>
      <div><h3 className="font-semibold">Lời giải</h3><p className="mt-2 whitespace-pre-line text-body-md text-[#64748B]">{question.explanation || 'Chưa có lời giải.'}</p></div>
      <div><h3 className="font-semibold">Nguồn tham khảo</h3><p className="mt-2 text-body-md text-[#64748B]">{source ? `${source.title} — ${materialChapterLabels[source.chapter]}${question.sourcePage ? ` — Trang ${question.sourcePage}` : ''}` : 'Chưa gắn nguồn tham khảo.'}</p></div>
      <div className="grid grid-cols-2 gap-4 text-body-sm"><div><span className="text-[#64748B]">Ngày tạo</span><strong className="mt-1 block">{formatDate(question.createdAt)}</strong></div><div><span className="text-[#64748B]">Ngày cập nhật</span><strong className="mt-1 block">{formatDate(question.updatedAt)}</strong></div></div>
      <div className="flex justify-end"><Button type="button" variant="secondary" onClick={onClose}>Đóng</Button></div>
    </div></section></div>
  );
}

export function LecturerQuestionBankPage() {
  const requestedChapter = new URLSearchParams(window.location.search).get('chapter');
  const [questions, setQuestions] = useState(lecturerQuestions);
  const [query, setQuery] = useState('');
  const [chapter, setChapter] = useState(
    requestedChapter && questionChapterLabels[requestedChapter] ? requestedChapter : 'ALL'
  );
  const [level, setLevel] = useState('ALL');
  const [clo, setClo] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState('');
  const approvedMaterials = useMemo(() => lecturerMaterials.filter((item) => item.status === 'APPROVED'), []);

  useEffect(() => {
    if (!formOpen && !viewing && !deleting) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') { setFormOpen(false); setViewing(null); setDeleting(null); } };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [deleting, formOpen, viewing]);
  useEffect(() => { if (!feedback) return undefined; const timer = window.setTimeout(() => setFeedback(''), 3000); return () => window.clearTimeout(timer); }, [feedback]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi');
    return questions.filter((item) => {
      const searchable = `${item.id} ${item.content} ${item.topic} ${item.keywords.join(' ')}`.toLocaleLowerCase('vi');
      return (!normalized || searchable.includes(normalized)) && (chapter === 'ALL' || item.chapterId === chapter) && (level === 'ALL' || item.cognitiveLevel === level) && (clo === 'ALL' || item.clo === clo) && (status === 'ALL' || item.status === status) && (type === 'ALL' || item.type === type);
    });
  }, [chapter, clo, level, query, questions, status, type]);
  const pagination = usePagination(filtered, [query, chapter, level, clo, status, type]);

  const resetFilters = () => { setQuery(''); setChapter('ALL'); setLevel('ALL'); setClo('ALL'); setStatus('ALL'); setType('ALL'); };
  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (question) => { setEditing(question); setFormOpen(true); };
  const saveQuestion = (values) => {
    const today = new Date().toISOString().slice(0, 10);
    if (editing) { setQuestions((current) => current.map((item) => item.id === editing.id ? { ...item, ...values, id: editing.id, updatedAt: today } : item)); setFeedback('Đã cập nhật câu hỏi.'); }
    else { setQuestions((current) => [{ ...values, createdAt: today, updatedAt: today }, ...current]); setFeedback(values.status === 'DRAFT' ? 'Đã lưu bản nháp.' : 'Đã gửi câu hỏi chờ phê duyệt.'); }
    setFormOpen(false); setEditing(null);
  };
  const copyQuestion = (question) => { const today = new Date().toISOString().slice(0, 10); const id = nextQuestionId(questions, question.chapterId); setQuestions((current) => [{ ...question, id, content: `${question.content} (Bản sao)`, status: 'DRAFT', createdAt: today, updatedAt: today, answers: question.answers.map((answer) => ({ ...answer })) }, ...current]); setFeedback(`Đã sao chép thành ${id}.`); };
  const changeStatus = (id, nextStatus) => { const today = new Date().toISOString().slice(0, 10); setQuestions((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus, updatedAt: today } : item)); setFeedback(`Đã chuyển trạng thái sang “${materialStatusMeta[nextStatus].label}”.`); };
  const confirmDelete = () => {
    const referenced = assessments.some((assessment) => assessment.questionIds.includes(deleting.id));
    if (referenced) {
      setFeedback(`Không thể xóa ${deleting.id} vì câu hỏi đang được tham chiếu bởi bài kiểm tra.`);
      setDeleting(null);
      return;
    }
    setQuestions((current) => current.filter((item) => item.id !== deleting.id));
    setFeedback(`Đã xóa câu hỏi ${deleting.id}.`);
    setDeleting(null);
  };

  return (
    <LecturerPageShell currentPage="lecturer_question_bank.html" title="Ngân hàng câu hỏi" eyebrow="VẬT LÝ ĐẠI CƯƠNG 1 · BAS1201" description="Quản lý và chuẩn hóa câu hỏi Vật lý đại cương 1" actions={<><Button variant="secondary" icon="upload_file" onClick={() => setFeedback('Đã mở giao diện mô phỏng nhập câu hỏi. Chức năng đọc file sẽ được bổ sung sau.')}>Nhập câu hỏi</Button><Button icon="add" onClick={openCreate}>Tạo câu hỏi</Button></>}>
      {feedback && <div className="flex items-center gap-2 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] px-4 py-3 text-body-sm font-semibold text-[#15803D]" role="status"><span className="material-symbols-outlined">check_circle</span>{feedback}</div>}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Thống kê ngân hàng câu hỏi"><StatCard label="Tổng câu hỏi" value={String(questionBankStats.total)} icon="quiz" /><StatCard label="Đã phê duyệt" value={String(questionBankStats.approved)} icon="verified" tone="success" /><StatCard label="Chờ phê duyệt" value={String(questionBankStats.pending)} icon="pending_actions" tone="warning" /><StatCard label="Bản nháp" value={String(questionBankStats.draft)} icon="draft" /></section>
      <Card className="p-5"><div className="relative"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">search</span><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Tìm theo nội dung hoặc mã câu hỏi..." aria-label="Tìm câu hỏi" className="w-full border border-[#CBD5E1] bg-[#F8FAFC] pl-11 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-[#FEE2E2]" /></div><div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="text-body-sm font-semibold">Chương<select value={chapter} onChange={(event) => setChapter(event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-3"><option value="ALL">Tất cả chương</option>{Object.entries(questionChapterLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-body-sm font-semibold">Mức độ<select value={level} onChange={(event) => setLevel(event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-3"><option value="ALL">Tất cả</option>{Object.entries(cognitiveLevelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-body-sm font-semibold">CLO<select value={clo} onChange={(event) => setClo(event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-3"><option value="ALL">Tất cả</option>{clos.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-body-sm font-semibold">Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-3"><option value="ALL">Tất cả</option>{Object.entries(materialStatusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label>
        <label className="text-body-sm font-semibold">Loại câu hỏi<select value={type} onChange={(event) => setType(event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-3"><option value="ALL">Tất cả</option>{Object.entries(questionTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div></Card>
      <Card className="p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-headline-md font-bold">Danh sách câu hỏi</h2><p className="mt-1 text-body-sm text-[#64748B]">Hiển thị {filtered.length}/{questions.length} câu hỏi mẫu</p></div>{(query || chapter !== 'ALL' || level !== 'ALL' || clo !== 'ALL' || status !== 'ALL' || type !== 'ALL') && <Button variant="ghost" onClick={resetFilters}>Xóa bộ lọc</Button>}</div>
        {filtered.length ? <><DataTable paginate={false} columns={['Mã câu hỏi', 'Nội dung', 'Chương', 'Mức độ', 'CLO', 'Loại', 'Trạng thái', 'Hành động']} rows={pagination.pageItems} renderRow={(row) => { const statusMeta = materialStatusMeta[row.status]; return <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-4 font-mono font-semibold whitespace-nowrap">{row.id}</td><td className="px-3 py-4"><div className="max-w-[360px] min-w-[240px]"><p className="line-clamp-2 font-medium">{row.content}</p><span className="mt-1 block text-label-sm text-[#64748B]">{row.topic}</span></div></td><td className="px-3 py-4 min-w-[160px]">{questionChapterLabels[row.chapterId].split(' — ')[0]}</td><td className="px-3 py-4 whitespace-nowrap">{cognitiveLevelLabels[row.cognitiveLevel]}</td><td className="px-3 py-4 font-semibold">{row.clo}</td><td className="px-3 py-4 min-w-[130px]">{row.type === 'SINGLE_CHOICE' ? 'Một đáp án' : 'Nhiều đáp án'}</td><td className="px-3 py-4"><StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge></td><td className="px-3 py-4"><div className="flex items-center gap-2"><Button variant="secondary" onClick={() => setViewing(row)}>Xem</Button><details className="relative"><summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-[#CBD5E1] text-[#64748B]" aria-label={`Tùy chọn ${row.id}`}><span className="material-symbols-outlined">more_vert</span></summary><div className="absolute bottom-11 right-0 z-30 w-48 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg"><button type="button" onClick={() => setViewing(row)} className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]">Xem chi tiết</button><button type="button" onClick={() => openEdit(row)} className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]">Chỉnh sửa</button><button type="button" onClick={() => copyQuestion(row)} className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]">Sao chép</button>{row.status === 'APPROVED' && <button type="button" onClick={() => changeStatus(row.id, 'ARCHIVED')} className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]">Lưu trữ</button>}{row.status === 'DRAFT' && <button type="button" onClick={() => changeStatus(row.id, 'PENDING_APPROVAL')} className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]">Gửi phê duyệt</button>}{row.status === 'PENDING_APPROVAL' && <button type="button" onClick={() => changeStatus(row.id, 'APPROVED')} className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]">Phê duyệt</button>}<button type="button" onClick={() => setDeleting(row)} className="w-full rounded-lg px-3 py-2 text-left text-body-sm text-primary hover:bg-[#FEF2F2]">Xóa</button></div></details></div></td></tr>; }} /><Pagination currentPage={pagination.currentPage} pageSize={pagination.pageSize} totalItems={filtered.length} onPageChange={pagination.setCurrentPage} onPageSizeChange={pagination.setPageSize} /></> : <div className="py-12 text-center"><span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span><h3 className="mt-3 text-headline-sm font-bold">Không tìm thấy câu hỏi</h3><p className="mt-1 text-body-md text-[#64748B]">Không có câu hỏi phù hợp với từ khóa hoặc bộ lọc hiện tại.</p><Button variant="secondary" className="mt-5" onClick={resetFilters}>Xóa bộ lọc</Button></div>}
      </Card>
      {formOpen && <QuestionFormModal question={editing} questions={questions} approvedMaterials={approvedMaterials} onClose={() => { setFormOpen(false); setEditing(null); }} onSave={saveQuestion} />}
      {viewing && <QuestionDetailModal question={viewing} materials={lecturerMaterials} onClose={() => setViewing(null)} />}
      {deleting && <ConfirmDialog title="Xóa câu hỏi?" description={`Câu hỏi ${deleting.id} sẽ bị xóa khỏi ngân hàng câu hỏi.`} confirmLabel="Xóa câu hỏi" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
    </LecturerPageShell>
  );
}
