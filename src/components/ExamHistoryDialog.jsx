import React, { useEffect, useState } from 'react';
import { FormDialog } from './FormDialog.jsx';
import { DataTable } from './DataTable.jsx';
import { Button } from './Button.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { api } from '../lib/apiClient.js';
import { formatAttemptScore } from '../lib/examScoring.js';
import { isFinishedAttempt } from '../lib/studentExamAvailability.js';

const formatDate = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

export function ExamHistoryDialog({ exam, onClose }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api.exams
      .myAttempts(exam.examId)
      .then(async (data) => {
        if (!alive) return;
        const rows = Array.isArray(data) ? data : data?.content || data?.data || [];
        const scoredRows = await Promise.all(
          rows.map(async (attempt) => {
            if (
              attempt.status !== 'GRADED' ||
              attempt.totalScore == null ||
              attempt.questions?.length ||
              !attempt.attemptId
            )
              return attempt;
            const questions = await api.exams.attemptQuestions(attempt.attemptId).catch(() => null);
            const values = Array.isArray(questions) ? questions : questions?.content || questions?.data;
            return Array.isArray(values) ? { ...attempt, questions: values } : attempt;
          })
        );
        if (!alive) return;
        setAttempts(
          scoredRows.sort(
            (a, b) =>
              Number(b.attemptNumber || 0) - Number(a.attemptNumber || 0) ||
              Date.parse(b.startedAt || 0) - Date.parse(a.startedAt || 0)
          )
        );
      })
      .catch((requestError) => {
        if (alive) setError(requestError.message || 'Không thể tải lịch sử bài thi.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [exam.examId, reloadKey]);

  return (
    <FormDialog title={`Lịch sử bài thi · ${exam.title || 'Đề thi'}`} onClose={onClose} wide>
      {loading ? (
        <p role="status" className="py-8 text-center text-[#64748B]">
          Đang tải lịch sử bài thi…
        </p>
      ) : error ? (
        <div className="py-6 text-center">
          <p role="alert" className="text-primary">
            {error}
          </p>
          <Button variant="secondary" className="mt-3" onClick={() => setReloadKey((value) => value + 1)}>
            Thử lại
          </Button>
        </div>
      ) : !attempts.length ? (
        <p className="py-8 text-center text-[#64748B]">Bạn chưa có lượt làm bài nào cho đề này.</p>
      ) : (
        <DataTable
          paginate={false}
          columns={['Lần làm', 'Bắt đầu', 'Nộp bài', 'Trạng thái', 'Điểm', 'Kết quả']}
          rows={attempts}
          renderRow={(attempt) => (
            <tr className="border-t border-[#E2E8F0]" key={attempt.attemptId}>
              <td className="p-3">{attempt.attemptNumber || '—'}</td>
              <td className="p-3">{formatDate(attempt.startedAt)}</td>
              <td className="p-3">{attempt.submittedAt ? formatDate(attempt.submittedAt) : 'Chưa nộp'}</td>
              <td className="p-3">
                <StatusBadge tone={attempt.status === 'GRADED' ? 'success' : 'warning'}>
                  {attempt.status === 'GRADED' ? 'Đã chấm' : isFinishedAttempt(attempt) ? 'Chờ chấm' : 'Đang làm'}
                </StatusBadge>
              </td>
              <td className="p-3">{attempt.status === 'GRADED' ? formatAttemptScore(attempt) : '—'}</td>
              <td className="p-3">
                {isFinishedAttempt(attempt) && attempt.attemptId && (
                  <a
                    className="font-semibold text-primary hover:underline"
                    href={`exam_results.html?examId=${encodeURIComponent(exam.examId)}&attemptId=${encodeURIComponent(attempt.attemptId)}`}
                  >
                    Xem kết quả
                  </a>
                )}
              </td>
            </tr>
          )}
        />
      )}
    </FormDialog>
  );
}
