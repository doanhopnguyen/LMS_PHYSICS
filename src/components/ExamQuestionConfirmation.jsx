import React, { useRef } from 'react';
import { FormDialog } from './FormDialog.jsx';
import { Button } from './Button.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { labelOf } from '../lib/lecturerUtils.js';

export function ExamQuestionConfirmation({
  exam,
  question,
  generating,
  questionCount,
  nextOrder,
  busy,
  error,
  onCancel,
  onConfirm,
}) {
  const cancelRef = useRef(null);
  return (
    <FormDialog
      title={generating ? 'Xác nhận sinh câu hỏi theo ma trận' : 'Xác nhận thêm câu hỏi vào đề'}
      onClose={onCancel}
      busy={busy}
      dialogRole="alertdialog"
      initialFocusRef={cancelRef}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
          <p className="text-body-sm text-[#64748B]">Đề nhận câu hỏi</p>
          <p className="mt-1 break-words font-semibold text-[#0F172A]">{exam.title || 'Đề kiểm tra'}</p>
          <p className="mt-2 text-body-sm text-[#475569]">Hiện có {questionCount} câu hỏi.</p>
        </div>
        {generating ? (
          <p className="text-body-md text-[#475569]">
            Xác nhận sinh câu hỏi theo ma trận đã chọn cho đề này. Sau khi hoàn tất, hãy kiểm tra lại danh sách câu hỏi
            trước khi giao bài cho sinh viên.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="neutral">{labelOf(question.questionType)}</StatusBadge>
              <StatusBadge tone="neutral">{labelOf(question.difficultyLevel)}</StatusBadge>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] p-4">
              <p className="mb-2 text-body-sm font-semibold text-[#64748B]">Nội dung câu hỏi</p>
              <p className="whitespace-pre-wrap break-words text-body-md text-[#0F172A]">
                {question.content || question.questionText || 'Chưa có nội dung'}
              </p>
              {question.options?.length > 0 && (
                <ul className="mt-3 space-y-2 text-body-sm text-[#475569]">
                  {question.options.map((option, index) => (
                    <li className="break-words" key={option.optionId || index}>
                      {String.fromCharCode(65 + index)}. {option.content}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-body-sm text-[#64748B]">
              Thêm ở vị trí {nextOrder}, trọng số 1. Đề sẽ có {questionCount + 1} câu hỏi sau khi xác nhận.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-body-sm text-primary">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3 border-t border-[#E2E8F0] pt-4">
          <Button ref={cancelRef} variant="secondary" disabled={busy} onClick={onCancel}>
            Quay lại
          </Button>
          <Button icon={generating ? 'auto_awesome' : 'playlist_add_check'} disabled={busy} onClick={onConfirm}>
            {busy ? 'Đang lưu…' : generating ? 'OK, sinh câu hỏi' : 'OK, thêm vào đề'}
          </Button>
        </div>
      </div>
    </FormDialog>
  );
}
