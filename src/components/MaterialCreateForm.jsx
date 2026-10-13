import { SelectField as SharedSelectField } from './SelectField.jsx';
import { FormField as SharedFormField } from './FormField.jsx';
import { Form, SubmitButton } from './Form.jsx';
import React, { useState } from 'react';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { AuthAlert } from './AuthLayout.jsx';
import { apiRequest } from '../lib/apiClient.js';
import { listItems, useApiData } from '../hooks/useApiData.js';
import { MaterialContentFields, materialFormats } from './MaterialContentFields.jsx';
import { MarkdownContent } from './MarkdownContent.jsx';
import { validateVideoMaterial } from '../lib/materialSources.js';

export function MaterialCreateForm() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('MARKDOWN');
  const [editorKey, setEditorKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const subjects = useApiData('/api/v1/subjects?size=100');
  const topics = useApiData(subject ? `/api/v1/subjects/${encodeURIComponent(subject)}/topics` : null);
  const materials = useApiData(topic ? `/api/v1/topics/${encodeURIComponent(topic)}/materials` : null);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    body.set('type', type);
    body.set('topicId', topic);
    setError('');
    setMessage('');
    const videoError = validateVideoMaterial(body);
    if (videoError) {
      setError(videoError);
      return;
    }
    if (!body.get('file')?.size) body.delete('file');
    if (type === 'MARKDOWN' && !String(body.get('contentText')).trim()) {
      setError('Vui lòng nhập nội dung Markdown.');
      return;
    }
    setBusy(true);
    try {
      await apiRequest(`/api/v1/topics/${encodeURIComponent(topic)}/materials`, { method: 'POST', formData: body });
      form.reset();
      setType('MARKDOWN');
      setEditorKey((value) => value + 1);
      materials.reload();
      setMessage('Đã tạo học liệu.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      <Card className="authoring-form mt-6 p-6">
        {(subjects.error || topics.error) && (
          <p role="alert" className="text-primary">
            {subjects.error || topics.error}{' '}
            <Button
              onClick={() => {
                subjects.reload();
                topics.reload();
              }}
            >
              Thử lại
            </Button>
          </p>
        )}
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <SharedSelectField
            className="mt-2 block w-full"
            value={subject}
            disabled={busy || subjects.loading}
            onChange={(e) => {
              setSubject(e.target.value);
              setTopic('');
            }}
            label={<>Học phần</>}
          >
            <option value="">Chọn học phần</option>
            {listItems(subjects.data).map((item) => (
              <option key={item.subjectId} value={item.subjectId}>
                {item.subjectName}
              </option>
            ))}
          </SharedSelectField>
          <SharedSelectField
            className="mt-2 block w-full"
            value={topic}
            disabled={busy || !subject || topics.loading}
            onChange={(e) => setTopic(e.target.value)}
            label={<>Chủ đề</>}
          >
            <option value="">Chọn chủ đề</option>
            {listItems(topics.data).map((item) => (
              <option key={item.topicId} value={item.topicId}>
                {item.topicName}
              </option>
            ))}
          </SharedSelectField>
        </div>
        <Form className="space-y-4" onSubmit={submit}>
          <SharedFormField
            name="title"
            required
            className="mt-2 block w-full"
            label={<>Tiêu đề</>}
            wrapperClassName="block"
          />
          <SharedSelectField
            value={type}
            disabled={busy}
            onChange={(e) => setType(e.target.value)}
            label={<>Định dạng</>}
            className="block"
          >
            {materialFormats.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SharedSelectField>
          <MaterialContentFields key={`${type}-${editorKey}`} type={type} busy={busy} />
          <div className="authoring-actions">
            <SubmitButton icon="save" type="submit" disabled={!topic || busy}>
              {busy ? 'Đang lưu…' : 'Tạo học liệu'}
            </SubmitButton>
          </div>
        </Form>
      </Card>
      {topic && (
        <Card className="mt-5 p-6">
          <h2 className="font-semibold">Học liệu trong chủ đề</h2>
          {materials.loading ? (
            <p role="status">Đang tải…</p>
          ) : materials.error ? (
            <p role="alert">
              {materials.error} <Button onClick={materials.reload}>Thử lại</Button>
            </p>
          ) : listItems(materials.data).length === 0 ? (
            <p className="mt-3">Chưa có học liệu.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {listItems(materials.data).map((item) => (
                <li className="py-3" key={item.materialId}>
                  <strong>{item.title}</strong>
                  <p className="text-sm text-slate-500">
                    {item.type} · {item.approvalStatus}
                  </p>
                  {item.contentText && (
                    <details className="mt-2">
                      <summary>Xem nội dung</summary>
                      {item.type === 'MARKDOWN' ? (
                        <MarkdownContent content={item.contentText} />
                      ) : (
                        <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm">
                          {item.contentText}
                        </pre>
                      )}
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
