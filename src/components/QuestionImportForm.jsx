import React, { useState } from 'react';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { AuthAlert } from './AuthLayout.jsx';
import { apiRequest } from '../lib/apiClient.js';
import { listItems, useApiData } from '../hooks/useApiData.js';

export function QuestionImportForm() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const subjects = useApiData('/api/v1/subjects?size=100');
  const topics = useApiData(subject ? `/api/v1/subjects/${encodeURIComponent(subject)}/topics` : null);
  async function download() {
    setError(''); setBusy(true);
    try {
      const blob = await apiRequest('/api/v1/questions/import-excel/template', { responseType: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = 'cau-hoi-mau.xlsx'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function submit(event) {
    event.preventDefault(); setError(''); setResult(null);
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!file?.size || !/\.xlsx$/i.test(file.name)) { setError('Vui lòng chọn tệp Excel .xlsx có nội dung.'); return; }
    setBusy(true);
    try { setResult(await apiRequest('/api/v1/questions/import-excel', { method: 'POST', query: { subjectId: subject, topicId: topic }, formData: form })); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <section aria-label="Nhập câu hỏi từ Excel">
    <AuthAlert error>{error}</AuthAlert>
    <Card className="authoring-form p-6">
      <Button variant="secondary" icon="download" onClick={download} disabled={busy}>Tải tệp mẫu .xlsx</Button>
      {(subjects.error || topics.error) && <p role="alert" className="mt-4 text-primary">{subjects.error || topics.error} <button onClick={() => { subjects.reload(); topics.reload(); }}>Thử lại</button></p>}
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">Học phần<select className="mt-2 block w-full rounded-xl border p-3" required value={subject} disabled={subjects.loading || busy} onChange={(e) => { setSubject(e.target.value); setTopic(''); setResult(null); }}><option value="">{subjects.loading ? 'Đang tải…' : 'Chọn học phần'}</option>{listItems(subjects.data).map((s) => <option key={s.subjectId} value={s.subjectId}>{s.subjectCode} · {s.subjectName}</option>)}</select></label>
        <label className="block">Chủ đề<select className="mt-2 block w-full rounded-xl border p-3" required value={topic} disabled={!subject || topics.loading || busy} onChange={(e) => setTopic(e.target.value)}><option value="">{topics.loading ? 'Đang tải…' : 'Chọn chủ đề'}</option>{listItems(topics.data).map((t) => <option key={t.topicId} value={t.topicId}>{t.topicName}</option>)}</select></label>
        <label className="block">Tệp câu hỏi<input className="mt-2 block w-full rounded-xl border p-3" name="file" type="file" accept=".xlsx" required disabled={busy} /></label>
        <div className="authoring-actions"><Button icon="upload" type="submit" disabled={busy || !topic}>{busy ? 'Đang xử lý…' : 'Nhập câu hỏi'}</Button></div>
      </form>
    </Card>
    {result && <Card className="mt-5 p-6"><h2 className="font-semibold">Kết quả nhập</h2><p className="mt-2">Đã đọc {result.totalParsed ?? 0} câu hỏi · Đã nhập {result.totalImported ?? 0} câu hỏi.</p>{result.warnings?.length > 0 && <ul className="mt-3 list-disc pl-5 text-amber-700">{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}</Card>}
  </section>;
}
