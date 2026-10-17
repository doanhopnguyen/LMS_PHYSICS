import React from 'react';
import { isTextQuestion, questionTypeLabel, questionInstruction } from '../lib/questionTypes.js';
import '../styles/question-types.css';

export function QuestionResponse({ question, onChange, onSave, disabled, saving }) {
  const type = question.questionType;
  const text = isTextQuestion(type);
  return (
    <fieldset className="question-response" disabled={disabled}>
      <legend className="question-response__type">{questionTypeLabel(type)}</legend>
      <p className="question-type-help" id={`instruction-${question.questionId}`}>
        {questionInstruction(type)}
      </p>
      {text ? (
        <label className="question-response__text">
          <span>Câu trả lời của bạn</span>
          <input
            type="text"
            value={question.answerText || ''}
            onChange={(event) => onChange({ answerText: event.target.value })}
            onBlur={onSave}
            placeholder="Nhập câu trả lời…"
            aria-describedby={`instruction-${question.questionId}`}
            autoComplete="off"
          />
          <small>Câu trả lời được lưu khi bạn rời ô nhập và trước khi nộp bài.</small>
        </label>
      ) : (
        <div className="question-response__choices" data-binary={type === 'TRUE_FALSE'}>
          {(question.options || []).map((option, index) => {
            const checked = (question.selectedOptionIds || []).includes(option.optionId);
            return (
              <label key={option.optionId} className="exam-taking-option" data-selected={checked}>
                <input
                  type={type === 'MCQ_MULTI' ? 'checkbox' : 'radio'}
                  name={`question-${question.questionId}`}
                  checked={checked}
                  onChange={() =>
                    onChange((current) => ({
                      selectedOptionIds:
                        type === 'MCQ_MULTI'
                          ? (current.selectedOptionIds || []).includes(option.optionId)
                            ? current.selectedOptionIds.filter((id) => id !== option.optionId)
                            : [...(current.selectedOptionIds || []), option.optionId]
                          : [option.optionId],
                    }))
                  }
                />
                {type !== 'TRUE_FALSE' && (
                  <span className="question-response__letter" aria-hidden="true">
                    {String.fromCharCode(65 + index)}
                  </span>
                )}
                <span>{option.content}</span>
              </label>
            );
          })}
        </div>
      )}
      <span className="question-response__save" role="status" aria-live="polite">
        {saving ? 'Đang lưu câu trả lời…' : ''}
      </span>
    </fieldset>
  );
}
