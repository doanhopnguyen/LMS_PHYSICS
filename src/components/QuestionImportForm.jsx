import { Form, SubmitButton } from './Form.jsx';
import React, { useState } from 'react';
import { Card } from './Card.jsx';
import { AuthAlert } from './AuthLayout.jsx';
import { api } from '../lib/apiClient.js';
import { listItems, useApiData } from '../hooks/useApiData.js';

export function QuestionImportForm() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const subjects = useApiData('/api/v1/subjects?size=100');
  const topics = useApiData(subject ? `/api/v1/subjects/${encodeURIComponent(subject)}/topics` : null);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setResult(null);
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!file?.size || (file.type && file.type !== 'application/pdf') || !/\.pdf$/i.test(file.name)) {
      setError('Vui lòng chọn tệp PDF có nội dung.');
      return;
    }
    setBusy(true);
    try {
      setResult(await api.questions.importPdf(form, { subjectId: subject, topicId: topic }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Nhập câu hỏi từ PDF">
      <AuthAlert error>{error}</AuthAlert>
      <Card className="authoring-form p-6">
        {(subjects.error || topics.error) && <p role="alert" className="mt-4 text-primary">{subjects.error || topics.error} <button type="button" onClick={() => { subjects.reload(); topics.reload(); }}>Thử lại</button></p>}
        <Form onSubmit={submit} className="space-y-4">
          <label className="block">Học phần
            <select className="mt-2 block w-full rounded-xl border p-3" required value={subject} disabled={subjects.loading || busy} onChange={(event) => { setSubject(event.target.value); setTopic(''); setResult(null); }}>
              <option value="">{subjects.loading ? 'Đang tải…' : 'Chọn học phần'}</option>
              {listItems(subjects.data).map((item) => <option key={item.subjectId} value={item.subjectId}>{item.subjectCode} · {item.subjectName}</option>)}
            </select>
          </label>
          <label className="block">Chủ đề
            <select className="mt-2 block w-full rounded-xl border p-3" required value={topic} disabled={!subject || topics.loading || busy} onChange={(event) => setTopic(event.target.value)}>
              <option value="">{topics.loading ? 'Đang tải…' : 'Chọn chủ đề'}</option>
              {listItems(topics.data).map((item) => <option key={item.topicId} value={item.topicId}>{item.topicName}</option>)}
            </select>
          </label>
          <label className="block">Tệp câu hỏi PDF<input className="mt-2 block w-full rounded-xl border p-3" name="file" type="file" accept="application/pdf,.pdf" required disabled={busy} /></label>
          <p className="text-body-sm text-[#64748B]">Hệ thống gửi tệp PDF đến endpoint import hiện hành của backend.</p>
          <div className="authoring-actions"><SubmitButton icon="upload" type="submit" disabled={busy || !topic}>{busy ? 'Đang xử lý…' : 'Nhập câu hỏi'}</SubmitButton></div>
        </Form>
      </Card>
      {result && <Card className="mt-5 p-6"><h2 className="font-semibold">Kết quả nhập</h2><p className="mt-2">Đã đọc {result.totalParsed ?? 0} câu hỏi · Đã nhập {result.totalImported ?? 0} câu hỏi.</p>{result.warnings?.length > 0 && <ul className="mt-3 list-disc pl-5 text-amber-700">{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}</Card>}
    </section>
  );
}
