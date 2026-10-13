import React from 'react';
import { FormField } from './FormField.jsx';

export function QuestionAnswer({ question, disabled, onChange, onSaveText }) {
  if (['FILL_BLANK', 'SHORT_ANSWER'].includes(question.questionType))
    return (
      <FormField
        label="Câu trả lời"
        type="text"
        value={question.answerText || ''}
        disabled={disabled}
        onChange={(event) => onChange({ answerText: event.target.value, selectedOptionIds: [] })}
        onBlur={() => onSaveText?.()}
      />
    );
  const selected = question.selectedOptionIds || [];
  return (
    <fieldset className="grid gap-3">
      <legend className="sr-only">Câu trả lời</legend>
      {(question.options || []).map((option) => (
        <label key={option.optionId} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
          <input
            type={question.questionType === 'MCQ_MULTI' ? 'checkbox' : 'radio'}
            name={`question-${question.questionId}`}
            disabled={disabled}
            checked={selected.includes(option.optionId)}
            onChange={() =>
              onChange({
                answerText: null,
                selectedOptionIds:
                  question.questionType === 'MCQ_MULTI'
                    ? selected.includes(option.optionId)
                      ? selected.filter((id) => id !== option.optionId)
                      : [...selected, option.optionId]
                    : [option.optionId],
              })
            }
          />
          {option.content}
        </label>
      ))}
    </fieldset>
  );
}
