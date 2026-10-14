import { SelectField as SharedSelectField } from './SelectField.jsx';
import { FormField as SharedFormField } from './FormField.jsx';
import { Form, SubmitButton } from './Form.jsx';
import React, { useState } from 'react';
import { Card } from './Card.jsx';
import { AuthAlert } from './AuthLayout.jsx';
import { api } from '../lib/apiClient.js';
import { approveAdminImport } from '../lib/adminQuestionApproval.js';
import { Button } from './Button.jsx';
import { listItems, useApiData } from '../hooks/useApiData.js';

export function QuestionImportForm({ onImported, autoApprove = false, initialResult = null, onResult, onBusyChange }) {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(initialResult);
  const hasPendingApprovals = autoApprove && result && (result.totalApproved ?? 0) < (result.totalImported ?? 0);
  const subjects = useApiData('/api/v1/subjects?size=100');
  const topics = useApiData(subject ? `/api/v1/subjects/${encodeURIComponent(subject)}/topics` : null);

  async function submit(event) {
    event.preventDefault();
    if (busy || hasPendingApprovals) return;
    setError('');
    setResult(null);
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!file?.size || !/\.(xlsx|xls)$/i.test(file.name)) {
      setError('Vui lòng chọn tệp Excel (.xlsx hoặc .xls) có nội dung.');
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
    try {
      const imported = await api.questions.importExcel(form, { subjectId: subject, topicId: topic });
      setResult(imported);
      onResult?.(imported);
      const finished = autoApprove ? await approveAdminImport(imported) : imported;
      setResult(finished);
      onResult?.(finished);
      onImported?.(finished);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  async function retryApproval() {
    if (busy || !result) return;
    setBusy(true);
    onBusyChange?.(true);
    setError('');
    try {
      const finished = await approveAdminImport(result);
      setResult(finished);
      onResult?.(finished);
      onImported?.(finished);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <section aria-label="Nhập câu hỏi từ Excel">
      <AuthAlert error>{error}</AuthAlert>
      <Card className="authoring-form p-6">
        {(subjects.error || topics.error) && (
          <p role="alert" className="mt-4 text-primary">
            {subjects.error || topics.error}{' '}
            <button
              type="button"
              onClick={() => {
                subjects.reload();
                topics.reload();
              }}
            >
              Thử lại
            </button>
          </p>
        )}
        <Form onSubmit={submit} className="space-y-4">
          <SharedSelectField
            required
            value={subject}
            name="importSubjectId"
            disabled={subjects.loading || busy || Boolean(hasPendingApprovals)}
            onChange={(event) => {
              setSubject(event.target.value);
              setTopic('');
              setResult(null);
              onResult?.(null);
            }}
            label={<>Học phần</>}
            className="block"
          >
            <option value="">{subjects.loading ? 'Đang tải…' : 'Chọn học phần'}</option>
            {listItems(subjects.data).map((item) => (
              <option key={item.subjectId} value={item.subjectId}>
                {item.subjectCode} · {item.subjectName}
              </option>
            ))}
          </SharedSelectField>
          <SharedSelectField
            required
            value={topic}
            name="importTopicId"
            disabled={!subject || topics.loading || busy || Boolean(hasPendingApprovals)}
            onChange={(event) => {
              setTopic(event.target.value);
              setResult(null);
              onResult?.(null);
            }}
            label={<>Chủ đề</>}
            className="block"
          >
            <option value="">{topics.loading ? 'Đang tải…' : 'Chọn chủ đề'}</option>
            {listItems(topics.data).map((item) => (
              <option key={item.topicId} value={item.topicId}>
                {item.topicName}
              </option>
            ))}
          </SharedSelectField>
          <SharedFormField
            className="mt-2 block w-full"
            name="file"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            required
            disabled={busy || Boolean(hasPendingApprovals)}
            label={<>Tệp câu hỏi Excel</>}
            wrapperClassName="block"
          />
          <p className="text-body-sm text-[#64748B]">Chỉ nhận tệp Excel theo mẫu của hệ thống.</p>
          <div className="authoring-actions">
            <SubmitButton icon="upload" type="submit" disabled={busy || !topic || Boolean(hasPendingApprovals)}>
              {busy ? 'Đang xử lý…' : 'Nhập câu hỏi'}
            </SubmitButton>
          </div>
        </Form>
      </Card>
      {result && (
        <Card className="mt-5 p-6">
          <h2 className="font-semibold">Kết quả nhập</h2>
          <p className="mt-2">
            Đã đọc {result.totalParsed ?? 0} câu hỏi · Đã nhập {result.totalImported ?? 0} câu hỏi.
          </p>
          {autoApprove && (
            <p className="mt-2">
              Đã duyệt {result.totalApproved ?? 0}/{result.totalImported ?? 0} câu hỏi.
            </p>
          )}
          {autoApprove && result.approvalFailures?.length > 0 && (
            <>
              <ul className="mt-3 list-disc pl-5 text-body-sm text-red-700" role="alert">
                {result.approvalFailures.map(({ question, message }, index) => (
                  <li key={question.questionId || index}>
                    {question.content}: {message}
                  </li>
                ))}
              </ul>
              <Button className="mt-3" disabled={busy} onClick={retryApproval}>
                Thử duyệt lại câu hỏi đã nhập
              </Button>
            </>
          )}
          {autoApprove && result.missingQuestions > 0 && (
            <p role="alert" className="mt-3 text-body-sm text-red-700">
              API chưa trả về đủ mã câu hỏi để duyệt. Các câu đã nhập vẫn được giữ trong ngân hàng.
            </p>
          )}
          {autoApprove &&
            hasPendingApprovals &&
            !result.approvalFailures?.length &&
            !result.missingQuestions &&
            !busy && (
              <Button className="mt-3" onClick={retryApproval}>
                Thử duyệt lại câu hỏi đã nhập
              </Button>
            )}
          {result.warnings?.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-amber-700">
              {result.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </section>
  );
}
