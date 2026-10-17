import React from 'react';
import { FormDialog } from './FormDialog.jsx';
import { Button } from './Button.jsx';
import { FileImage } from './FileImage.jsx';
import { LoadingIndicator } from './LoadingIndicator.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { CloLabels, useCloCatalog } from './CloPicker.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { questionTypeLabel } from '../lib/questionTypes.js';
import { difficultyLevels, cognitiveLevels } from '../lib/questionLevels.js';
import { safeUrl } from '../lib/lecturerUtils.js';

const levelLabel = (choices, value) => choices.find(([id]) => id === value)?.[1] || value || '—';

export function QuestionDetailDialog({ questionId, subjectId, topicName, onClose }) {
  const resource = useApiData(`/api/v1/questions/${encodeURIComponent(questionId)}`);
  const question = resource.data;
  const clos = useCloCatalog([question?.subjectId || subjectId]);
  return (
    <FormDialog title="Chi tiết câu hỏi" wide expandable onClose={onClose}>
      {resource.loading ? (
        <LoadingIndicator>Đang tải câu hỏi…</LoadingIndicator>
      ) : resource.error ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-body-sm text-primary">
          {resource.error}
          <Button variant="secondary" onClick={resource.reload}>
            Thử lại
          </Button>
        </div>
      ) : question ? (
        <div className="space-y-5">
          <dl className="grid gap-4 text-body-sm sm:grid-cols-2">
            {[
              ['Loại câu hỏi', questionTypeLabel(question.questionType)],
              ['Chủ đề', question.topicName || topicName || '—'],
              ['Độ khó', levelLabel(difficultyLevels, question.difficultyLevel)],
              ['Mức độ nhận thức', levelLabel(cognitiveLevels, question.cognitiveLevel)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-500">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <CloLabels ids={question.cloIds} rows={clos.data} />
          <section>
            <h3 className="mb-2 font-semibold">Nội dung câu hỏi</h3>
            <p className="whitespace-pre-wrap break-words leading-7">
              {question.content || question.questionText || '—'}
            </p>
            {safeUrl(question.mediaUrl) && (
              <FileImage
                src={safeUrl(question.mediaUrl)}
                alt="Hình minh họa câu hỏi"
                className="mt-3 max-h-80 max-w-full rounded-2xl object-contain"
              />
            )}
          </section>
          <section>
            <h3 className="mb-3 font-semibold">Đáp án</h3>
            <ul className="space-y-3">
              {(question.options || []).map((option, index) => (
                <li
                  key={option.optionId || index}
                  className={`rounded-2xl border p-4 ${option.isCorrect ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                      {String.fromCharCode(65 + index)}. {option.content}
                    </p>
                    {option.isCorrect && <StatusBadge tone="success">Đáp án đúng</StatusBadge>}
                  </div>
                  {option.explanation && (
                    <p className="mt-2 whitespace-pre-wrap break-words text-body-sm text-slate-500">
                      {option.explanation}
                    </p>
                  )}
                </li>
              ))}
              {(question.acceptedAnswers || []).map((answer, index) => (
                <li
                  key={index}
                  className="rounded-2xl border border-green-200 bg-green-50 p-3 whitespace-pre-wrap break-words"
                >
                  {answer}
                </li>
              ))}
            </ul>
            {!question.options?.length && !question.acceptedAnswers?.length && (
              <p className="text-body-sm text-slate-500">Chưa có dữ liệu đáp án.</p>
            )}
          </section>
          {question.explanation && (
            <section>
              <h3 className="mb-2 font-semibold">Lời giải</h3>
              <p className="whitespace-pre-wrap break-words">{question.explanation}</p>
            </section>
          )}
        </div>
      ) : (
        <p>Không tìm thấy câu hỏi.</p>
      )}
    </FormDialog>
  );
}
