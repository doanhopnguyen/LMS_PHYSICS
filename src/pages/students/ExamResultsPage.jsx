import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { api } from '../../lib/apiClient.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const dateText = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');
const scoreText = (value) => (value === null || value === undefined ? '—' : Number(value).toFixed(2).replace(/\.00$/, ''));
const durationText = (startedAt, submittedAt) => {
  if (!startedAt || !submittedAt) return '—';
  return `${Math.max(0, Math.round((new Date(submittedAt) - new Date(startedAt)) / 60000))} phút`;
};
const answerText = (question) => {
  if (question.answerText) return question.answerText;
  const selected = question.selectedOptionIds || [];
  return (question.options || []).filter((option) => selected.includes(option.optionId)).map((option) => option.content).join(', ') || 'Chưa trả lời';
};

export function ExamResultsPage() {
  const params = new URLSearchParams(window.location.search);
  const attemptId = params.get('attemptId');
  const examId = params.get('examId');
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!attemptId) {
      setError('Không tìm thấy lượt làm bài để hiển thị kết quả.');
      setLoading(false);
      return undefined;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const attemptData = await api.exams.getAttempt(attemptId);
        const [examData, progressData, questionData] = await Promise.all([
          examId ? api.exams.get(examId).catch(() => null) : Promise.resolve(null),
          api.exams.attemptProgress(attemptId).catch(() => null),
          rowsOf(attemptData?.questions).length ? Promise.resolve(attemptData.questions) : api.exams.attemptQuestions(attemptId).catch(() => []),
        ]);
        if (!alive) return;
        setAttempt(attemptData);
        setExam(examData);
        setProgress(progressData);
        setQuestions(rowsOf(questionData));
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải kết quả lượt làm bài.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [attemptId, examId]);

  const title = attempt?.examTitle || exam?.title || 'Kết quả bài làm';
  const totalQuestions = progress?.totalQuestions ?? attempt?.totalQuestions ?? exam?.totalQuestions ?? questions.length;
  const answeredQuestions = progress?.answeredQuestions ?? questions.filter((question) => (question.selectedOptionIds || []).length || question.answerText).length;
  const submitted = Boolean(attempt?.submittedAt) || ['SUBMITTED', 'GRADED', 'COMPLETED'].includes(attempt?.status);

  return (
    <AppShell currentPage="exam_results.html" title={`${title} · PTIT Physics LMS`}>
      <PageContainer>
        <PageTitle
          eyebrow="KẾT QUẢ BÀI LÀM"
          title={title}
          description={attempt?.submittedAt ? `Đã nộp lúc ${dateText(attempt.submittedAt)}.` : 'Dữ liệu được lấy từ lượt làm bài của bạn.'}
          actions={<><a href="dashboard.html"><Button variant="secondary" icon="home">Về trang chủ</Button></a><a href="exam_practice_center.html"><Button variant="secondary" icon="quiz">Về ôn luyện</Button></a></>}
        />
        {loading ? <Card className="p-8 text-center text-[#64748B]">Đang tải kết quả bài làm…</Card> : error ? <Card className="p-8 text-center"><p role="alert" className="text-primary">{error}</p></Card> : <>
          <Card variant="accent" className="p-6">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div><span className="text-body-sm text-[#64748B]">Điểm tự động chấm</span><strong className="mt-1 block text-display-lg-mobile text-primary">{scoreText(attempt?.totalScore)}</strong></div>
              <StatusBadge tone={submitted ? 'success' : 'warning'}>{submitted ? 'Đã nộp bài' : attempt?.status || 'Đang cập nhật'}</StatusBadge>
            </div>
          </Card>
          <MetricGrid items={[
            { label: 'Câu đã trả lời', value: answeredQuestions, detail: `/ ${totalQuestions || 0} câu`, icon: 'task_alt', tone: 'success' },
            { label: 'Thời gian làm bài', value: durationText(attempt?.startedAt, attempt?.submittedAt), detail: attempt?.startedAt ? `Bắt đầu ${dateText(attempt.startedAt)}` : '', icon: 'timer', tone: 'primary' },
            { label: 'Lần làm', value: attempt?.attemptNumber ?? '—', detail: exam?.examType === 'PRACTICE' ? 'Đề luyện tập' : 'Bài kiểm tra', icon: 'replay', tone: 'warning' },
            { label: 'Tổng số câu', value: totalQuestions || 0, detail: 'Theo đề thi', icon: 'format_list_numbered', tone: 'primary' },
          ]} />
          <Card className="p-6">
            <SectionHeader title="Câu trả lời đã lưu" action={<StatusBadge tone="neutral">{questions.length} câu</StatusBadge>} className="mb-5" />
            <DataTable columns={['Câu', 'Nội dung', 'Câu trả lời', 'Trạng thái']} rows={questions} renderRow={(question, index) => {
              const answered = Boolean((question.selectedOptionIds || []).length || question.answerText);
              return <tr className="border-t border-[#E2E8F0]" key={question.questionId}><td className="px-4 py-3 font-mono">{question.orderIndex || index + 1}</td><td className="max-w-sm px-4 py-3">{question.content || '—'}</td><td className="px-4 py-3">{answerText(question)}</td><td className="px-4 py-3"><StatusBadge tone={answered ? 'success' : 'warning'}>{answered ? 'Đã trả lời' : 'Bỏ trống'}</StatusBadge></td></tr>;
            }} />
            {!questions.length && <p className="py-6 text-center text-[#64748B]">Chưa có chi tiết câu trả lời được trả về cho lượt làm này.</p>}
          </Card>
        </>}
      </PageContainer>
    </AppShell>
  );
}
