import React, { useState } from 'react';
import { api } from '../../lib/apiClient.js';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { Card, Field, Resource, Table, itemsOf, useResource, useMutation } from './LecturerShared.jsx';

export function ClassAssessmentSettings({ classId }) {
  const settings = useResource(`/api/v1/instructor/classes/${classId}/settings`);
  const action = useMutation();
  return (
    <div>
      {action.feedback}
      <Resource value={settings}>
        {(data) => (
          <SettingsForm
            key={JSON.stringify(data)}
            data={data}
            busy={action.busy}
            onSave={async (body) => {
              const result = await action.run(() => api.instructorClasses.updateSettings(classId, body));
              if (result.ok) settings.reload();
            }}
          />
        )}
      </Resource>
    </div>
  );
}
function SettingsForm({ data, busy, onSave }) {
  const [values, setValues] = useState(data);
  return (
    <Card className="mt-5 p-5">
      <Form
        className="grid gap-4"
        busy={busy}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            practiceEnabled: values.practiceEnabled,
            quizEnabled: values.quizEnabled,
            practiceShowSolution: values.practiceShowSolution,
            maxPracticeAttempts: Number(values.maxPracticeAttempts),
          });
        }}
      >
        {[
          ['practiceEnabled', 'Cho phép luyện tập'],
          ['quizEnabled', 'Cho phép kiểm tra ngắn'],
          ['practiceShowSolution', 'Hiển thị lời giải sau luyện tập'],
        ].map(([key, label]) => (
          <label className="flex items-center gap-3" key={key}>
            <input
              type="checkbox"
              checked={Boolean(values[key])}
              disabled={busy}
              onChange={(e) => setValues({ ...values, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
        <Field
          label="Số lượt làm đề luyện tập"
          type="number"
          min={1}
          max={100}
          step={1}
          required
          value={values.maxPracticeAttempts}
          onChange={(e) => setValues({ ...values, maxPracticeAttempts: e.target.value })}
        />
        <SubmitButton disabled={busy}>Lưu cấu hình</SubmitButton>
      </Form>
    </Card>
  );
}
export function ClassWeakTopics({ classId }) {
  const resource = useResource(`/api/v1/instructor/classes/${classId}/weak-topics-summary`);
  return (
    <Resource value={resource}>
      {(data) => (
        <Table
          rows={itemsOf(data.topics)}
          columns={['Chủ đề', 'Sinh viên cần luyện tập', 'Độ chính xác']}
          cells={(row) => [
            row.topicName,
            row.studentsNeedingPractice ?? '—',
            row.averageAccuracyRate == null ? '—' : `${row.averageAccuracyRate}%`,
          ]}
        />
      )}
    </Resource>
  );
}
