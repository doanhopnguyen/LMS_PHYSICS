import React, { useEffect, useId, useState } from 'react';
import { Button } from './Button.jsx';
import { questionTypes, isTextQuestion, questionInstruction } from '../lib/questionTypes.js';
import '../styles/question-types.css';

export function QuestionTypePicker({ value, onChange, disabled }) {
  const name = useId();
  return (
    <fieldset className="question-type-picker" disabled={disabled}>
      <legend>Loại câu hỏi</legend>
      <div className="question-type-picker__grid">
        {questionTypes.map(([type, label], index) => (
          <label key={type} data-selected={value === type || (type === 'SHORT_ANSWER' && value === 'FILL_BLANK')}>
            <input
              type="radio"
              name={name}
              value={type}
              checked={value === type || (type === 'SHORT_ANSWER' && value === 'FILL_BLANK')}
              onChange={() => onChange(type)}
            />
            <span className="material-symbols-outlined" aria-hidden="true">
              {['radio_button_checked', 'checklist', 'short_text', 'rule'][index]}
            </span>
            <strong>{label}</strong>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function QuestionAnswerEditor({
  type,
  options,
  onOptionsChange,
  acceptedAnswers,
  onAcceptedAnswersChange,
  disabled,
}) {
  const name = useId();
  const text = isTextQuestion(type);
  const binary = type === 'TRUE_FALSE';
  const [previewText, setPreviewText] = useState('');
  const [previewOptions, setPreviewOptions] = useState([]);
  useEffect(() => {
    setPreviewText('');
    setPreviewOptions([]);
  }, [type]);
  const update = (index, patch) =>
    onOptionsChange(
      options.map((row, i) =>
        i === index
          ? { ...row, ...patch }
          : patch.isCorrect && type !== 'MCQ_MULTI'
            ? { ...row, isCorrect: false }
            : row
      )
    );
  return (
    <fieldset className="question-answer-editor" disabled={disabled}>
      <legend>{text ? 'Đáp án được chấp nhận' : binary ? 'Đáp án của mệnh đề' : 'Các lựa chọn trả lời'}</legend>
      <p className="question-type-help">
        {text
          ? 'Mỗi dòng là một đáp án hợp lệ. Máy chủ đối chiếu và chấm điểm khi sinh viên nộp bài.'
          : binary
            ? 'Nội dung câu hỏi là một mệnh đề. Chọn Đúng hoặc Sai làm đáp án chuẩn.'
            : type === 'MCQ_MULTI'
              ? 'Đánh dấu ít nhất hai đáp án đúng.'
              : 'Đánh dấu duy nhất một đáp án đúng.'}
      </p>
      {text ? (
        <label className="question-answer-editor__text">
          <span>Đáp án chuẩn và các cách viết được chấp nhận *</span>
          <textarea
            rows={4}
            value={acceptedAnswers}
            onChange={(event) => onAcceptedAnswersChange(event.target.value)}
            placeholder={'Ví dụ:\n9,8 m/s²\n9.8 m/s²'}
            required
          />
        </label>
      ) : (
        <div className="question-answer-editor__options" data-binary={binary}>
          {options.map((row, index) => (
            <div key={index} className="question-answer-editor__option" data-correct={row.isCorrect}>
              <label className="question-answer-editor__correct">
                <input
                  type={type === 'MCQ_MULTI' ? 'checkbox' : 'radio'}
                  name={name}
                  checked={row.isCorrect}
                  onChange={(event) => update(index, { isCorrect: event.target.checked })}
                />
                <span>{binary ? row.content : `Đáp án ${String.fromCharCode(65 + index)} đúng`}</span>
              </label>
              {!binary && (
                <label className="question-answer-editor__text">
                  <span>Nội dung đáp án {String.fromCharCode(65 + index)} *</span>
                  <input
                    value={row.content}
                    onChange={(event) => update(index, { content: event.target.value })}
                    required
                  />
                </label>
              )}
              {!binary && (
                <label className="question-answer-editor__text">
                  <span>Giải thích (tùy chọn)</span>
                  <input
                    value={row.explanation}
                    onChange={(event) => update(index, { explanation: event.target.value })}
                  />
                </label>
              )}
              {!binary && (
                <Button
                  variant="secondary"
                  disabled={disabled || options.length <= 2}
                  onClick={() => onOptionsChange(options.filter((_, i) => i !== index))}
                >
                  Xóa lựa chọn
                </Button>
              )}
            </div>
          ))}
          {!binary && (
            <Button
              variant="secondary"
              onClick={() => onOptionsChange([...options, { content: '', isCorrect: false, explanation: '' }])}
            >
              Thêm lựa chọn
            </Button>
          )}
        </div>
      )}
      <details className="question-answer-preview">
        <summary>Xem trước phần trả lời của sinh viên</summary>
        <p>{questionInstruction(type)}</p>
        <p>Bạn có thể nhập hoặc chọn thử tại đây. Câu trả lời thử không được lưu vào đáp án chuẩn.</p>
        {text ? (
          <input
            type="text"
            placeholder="Nhập câu trả lời…"
            value={previewText}
            onChange={(event) => setPreviewText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault();
            }}
            aria-label="Xem trước câu trả lời ngắn"
            autoComplete="off"
          />
        ) : (
          options.map((row, index) => (
            <label key={index}>
              <input
                type={type === 'MCQ_MULTI' ? 'checkbox' : 'radio'}
                name={`${name}-preview`}
                checked={previewOptions.includes(index)}
                onChange={() =>
                  setPreviewOptions((current) =>
                    type === 'MCQ_MULTI'
                      ? current.includes(index)
                        ? current.filter((value) => value !== index)
                        : [...current, index]
                      : [index]
                  )
                }
              />
              {row.content || `Lựa chọn ${String.fromCharCode(65 + index)}`}
            </label>
          ))
        )}
      </details>
    </fieldset>
  );
}
