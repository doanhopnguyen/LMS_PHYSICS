// Reuses the existing question editor without modifying the template page.
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
import { useList } from '../shared/LmsUi.jsx';
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

export function QuestionEditor({ initial, subjects, busy, onClose, onSave, feedback }) {
  const [subjectId, setSubjectId] = useState(initial?.subjectId || (subjects.length === 1 ? subjects[0].subjectId : ''));
  const [topicId, setTopicId] = useState(initial?.topicId || '');
  const [type, setType] = useState(initial?.questionType || 'MCQ_SINGLE');
  const [options, setOptions] = useState(() => optionRows(initial));
  const [cloIds, setCloIds] = useState(initial?.cloIds || []);
  const clos = useApiData(subjectId ? `/api/v1/subjects/${subjectId}/clos` : null);
  const [error, setError] = useState('');
  const topics = useList(`/api/v1/subjects/${encodeURIComponent(subjectId)}/topics`);
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
        {feedback}
        <fieldset disabled={busy} className="contents">
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
            disabled={!subjectId || topics.loading || Boolean(topics.error)}
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
      </fieldset>
      </Form>
    </FormDialog>
  );
}

