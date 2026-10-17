import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { Card } from '../../components/Card.jsx';
import { AdaptivePracticeButton as Button } from '../../components/AdaptivePracticeUI.jsx';
import { LoadingIndicator } from '../../components/LoadingIndicator.jsx';
import { ExamTakingWorkspace } from '../../components/ExamTakingWorkspace.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { api } from '../../lib/apiClient.js';
import { answerPayload, isTextQuestion, questionTypeLabel } from '../../lib/questionTypes.js';
import { accuracyText, weaknessLabels, rememberPractice, practiceHomeHref } from '../../lib/adaptivePractice.js';
import { navigate } from '../../lib/navigation.js';
import '../../styles/adaptive-practice.css';

const responseText = (question) =>
  question.answerText ||
  (question.options || [])
    .filter((option) => (question.selectedOptionIds || []).includes(option.optionId))
    .map((option) => option.content)
    .join(', ') ||
  'Chưa trả lời';

export function AdaptivePracticeSession({ sessionId }) {
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState([]);
  const [retry, setRetry] = useState(0);
  const drafts = useRef(new Map());
  const queues = useRef(new Map());
  const timers = useRef(new Map());
  const locked = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let alive = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const data = await api.practice.get(sessionId);
        if (!data?.sessionId) throw new Error('Không tìm thấy bài luyện tập.');
        const completed = data.status === 'COMPLETED' ? await api.practice.results(sessionId) : null;
        if (!alive) return;
        setSession(data);
        setResult(completed);
        setQuestions(completed?.questions || data.questions || []);
        rememberPractice(data);
      } catch (err) {
        if (alive) setError(err.message || 'Không thể tải bài luyện.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      mounted.current = false;
      for (const timer of timers.current.values()) clearTimeout(timer);
      timers.current.clear();
    };
  }, [sessionId, retry]);

  const save = (question, suppliedBody) => {
    clearTimeout(timers.current.get(question.questionId));
    timers.current.delete(question.questionId);
    const id = question.questionId;
    const body = suppliedBody || drafts.current.get(id) || answerPayload(question);
    setSaving((ids) => [...new Set([...ids, id])]);
    const previous = queues.current.get(id) || Promise.resolve();
    const task = previous
      .catch(() => {})
      .then(() => api.practice.saveAnswer(sessionId, body))
      .catch((err) => {
        if (mounted.current) setError(err.message || 'Chưa lưu được câu trả lời. Vui lòng thử lại trước khi nộp bài.');
      })
      .finally(() => {
        if (queues.current.get(id) === task) {
          queues.current.delete(id);
          if (mounted.current) setSaving((ids) => ids.filter((value) => value !== id));
        }
      });
    queues.current.set(id, task);
    return task;
  };
  const change = (question, patch) => {
    if (locked.current || result) return;
    const current = { ...question, ...drafts.current.get(question.questionId) };
    const next = { ...current, ...(typeof patch === 'function' ? patch(current) : patch) };
    const body = answerPayload(next);
    drafts.current.set(question.questionId, body);
    setQuestions((rows) => rows.map((row) => (row.questionId === question.questionId ? { ...row, ...body } : row)));
    if (isTextQuestion(question.questionType)) {
      clearTimeout(timers.current.get(question.questionId));
      timers.current.set(
        question.questionId,
        setTimeout(() => save(next, body), 700)
      );
    } else save(next, body);
  };
  const flushAnswers = async () => {
    for (const timer of timers.current.values()) clearTimeout(timer);
    timers.current.clear();
    await Promise.all([...queues.current.values()]);
    // This API has no batch-save endpoint. Keep the final flush bounded, and let
    // any failed request stop submission so unsaved text cannot be graded.
    for (let offset = 0; offset < questions.length; offset += 4) {
      await Promise.all(
        questions
          .slice(offset, offset + 4)
          .map((question) =>
            api.practice.saveAnswer(sessionId, drafts.current.get(question.questionId) || answerPayload(question))
          )
      );
    }
  };
  const finish = async () => {
    if (locked.current || result || !questions.length || !window.confirm('Nộp bài luyện tập và xem kết quả?')) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await flushAnswers();
      const completed = await api.practice.submit(sessionId);
      setResult(completed);
      setQuestions(completed.questions || questions);
      rememberPractice({ ...session, status: 'COMPLETED' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      // A network failure after submit may still have completed the session.
      try {
        const current = await api.practice.get(sessionId);
        if (current.status !== 'COMPLETED') throw err;
        const completed = await api.practice.results(sessionId);
        setResult(completed);
        setQuestions(completed.questions || questions);
        rememberPractice(current);
      } catch {
        setError(err.message || 'Chưa thể nộp bài. Câu trả lời đang nhập vẫn được giữ trên trang.');
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const leave = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      if (!result && session) await flushAnswers();
      navigate(practiceHomeHref(session?.classId));
    } catch (err) {
      setError(err.message || 'Chưa lưu được bài luyện. Vui lòng thử lại.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  return (
    <AppShell
      currentPage="exam_practice_center.html"
      title="Luyện tập theo gợi ý · PTIT Physics"
      showAcademicFilters={false}
      showChatLauncher={false}
      showChrome={Boolean(result)}
      backHref={result ? practiceHomeHref(session?.classId) : undefined}
      footer={Boolean(result)}
      contentClass={result ? '' : 'exam-taking-page'}
      toolbar={
        !result ? (
          <DetailToolbar
            title="Luyện tập theo gợi ý"
            subtitle="Câu trả lời được tự động lưu"
            backLabel="Về gợi ý ôn tập"
            onBack={leave}
            actions={
              session && (
                <div className="exam-taking-actions">
                  <Button
                    icon="task_alt"
                    data-action="submit-practice"
                    disabled={busy || !questions.length}
                    onClick={finish}
                  >
                    {busy ? 'Đang lưu và nộp…' : 'Nộp bài luyện'}
                  </Button>
                </div>
              )
            }
          />
        ) : undefined
      }
    >
      <PageContainer className={result ? 'adaptive-session' : undefined}>
        {result && (
          <>
            <PageTitle
              eyebrow="LUYỆN TẬP CÁ NHÂN"
              title={result ? 'Kết quả bài luyện' : 'Củng cố từng câu, vững từng chủ đề'}
              description="Bài luyện được gợi ý từ lịch sử trả lời của bạn."
            />
          </>
        )}
        {error && (
          <div role="alert" className="adaptive-practice__notice">
            {error}
            {!session && (
              <Button variant="secondary" onClick={() => setRetry((v) => v + 1)}>
                Thử tải lại
              </Button>
            )}
          </div>
        )}
        {loading ? (
          <LoadingIndicator>Đang chuẩn bị bài luyện của bạn…</LoadingIndicator>
        ) : result ? (
          <>
            <Card className="adaptive-result-summary">
              <div>
                <span className="adaptive-practice__eyebrow">THÊM MỘT BƯỚC TIẾN BỘ</span>
                <h2>Bạn đã hoàn thành bài luyện</h2>
                <p>Tiếp tục từ những câu còn vướng để củng cố kiến thức.</p>
              </div>
              <div className="adaptive-result-summary__numbers">
                <div>
                  <strong>{result.correctCount ?? '—'}</strong>
                  <span>Câu đúng</span>
                </div>
                <div>
                  <strong>{result.wrongCount ?? '—'}</strong>
                  <span>Câu chưa đúng</span>
                </div>
                <div>
                  <strong>{accuracyText(result.accuracyRate)}</strong>
                  <span>Độ chính xác</span>
                </div>
              </div>
            </Card>
            <section className="adaptive-result-list" aria-label="Xem lại câu trả lời">
              {questions.map((row, index) => {
                const correctOptions = (row.options || []).filter((option) => option.isCorrect === true);
                const answers = row.acceptedAnswers || [];
                return (
                  <Card key={row.questionId} className="adaptive-result-question">
                    <div className="adaptive-result-question__heading">
                      <span>
                        Câu {index + 1} · {questionTypeLabel(row.questionType)}
                      </span>
                      <StatusBadge
                        tone={row.isCorrect === true ? 'success' : row.isCorrect === false ? 'warning' : 'neutral'}
                      >
                        {row.isCorrect === true ? 'Đúng' : row.isCorrect === false ? 'Chưa đúng' : 'Đã ghi nhận'}
                      </StatusBadge>
                    </div>
                    <h3>{row.content}</h3>
                    <p>
                      <strong>Bạn trả lời:</strong> {responseText(row)}
                    </p>
                    {(answers.length > 0 || correctOptions.length > 0) && (
                      <p className="adaptive-result-question__solution">
                        <strong>Đáp án được chấp nhận:</strong>{' '}
                        {[...answers, ...correctOptions.map((option) => option.content)].join(' · ')}
                      </p>
                    )}
                    {row.explanation && <p>{row.explanation}</p>}
                    {row.isCorrect == null && (
                      <p className="adaptive-practice__explain">
                        Chi tiết đáp án chưa được mở theo cấu hình của lớp học.
                      </p>
                    )}
                  </Card>
                );
              })}
            </section>
            {!!result.updatedWeakTopics?.length && (
              <Card className="adaptive-result-question">
                <h2>Gợi ý sau bài luyện</h2>
                <div className="adaptive-updated-topics">
                  {result.updatedWeakTopics.map((topic) => (
                    <div key={topic.topicId}>
                      <strong>{topic.topicName}</strong>
                      <span>{weaknessLabels[topic.weaknessLevel] || 'Đang cập nhật'}</span>
                      <p>{topic.recommendation}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            <Button icon="psychology" onClick={() => navigate(practiceHomeHref(session?.classId))}>
              Chọn bài luyện tiếp theo
            </Button>
          </>
        ) : (
          session && (
            <>
              {(session.deficiencyNotice || session.expansionReason) && (
                <div className="adaptive-session__info" role="status">
                  {session.deficiencyNotice && <p>{session.deficiencyNotice}</p>}
                  {session.expansionReason && <p>{session.expansionReason}</p>}
                </div>
              )}
              <ExamTakingWorkspace
                key={sessionId}
                allQuestions={questions}
                disabled={busy}
                savingQuestions={saving}
                onAnswerChange={change}
                onAnswerSave={(row) => {
                  if (!locked.current) save(row);
                }}
                questionDetails={(row) => (
                  <div className="adaptive-question-context">
                    <StatusBadge tone={row.isReviewed ? 'warning' : 'neutral'}>
                      {row.isReviewed ? 'Ôn lại câu đã sai' : 'Câu hỏi mới'}
                    </StatusBadge>
                    <span>{[row.chapterName, row.topicName].filter(Boolean).join(' / ')}</span>
                  </div>
                )}
                sidebar={
                  <Card className="exam-taking-info">
                    <h2 className="text-headline-sm font-bold">Thông tin bài luyện</h2>
                    <dl className="mt-5 space-y-4 text-body-sm">
                      <div className="border-b border-[#E2E8F0] pb-3">
                        <dt className="text-[#64748B]">Loại đề</dt>
                        <dd className="mt-1 font-semibold">Gợi ý từ câu đã trả lời sai</dd>
                      </div>
                      <div className="border-b border-[#E2E8F0] pb-3">
                        <dt className="text-[#64748B]">Số câu hỏi</dt>
                        <dd className="mt-1 font-semibold">{questions.length} câu</dd>
                      </div>
                      <div>
                        <dt className="text-[#64748B]">Thời gian làm bài</dt>
                        <dd className="mt-1 font-semibold">Không giới hạn</dd>
                      </div>
                    </dl>
                    <p className="mt-5 text-body-sm text-[#64748B]">
                      Bài gợi ý tập trung vào chủ đề cần ôn. Bạn có thể quay lại để tiếp tục bài đã lưu.
                    </p>
                  </Card>
                }
              />
            </>
          )
        )}
      </PageContainer>
    </AppShell>
  );
}
