import React, { useEffect, useState } from 'react';
import { Button } from './Button.jsx';
import { Card } from './Card.jsx';
import { FileImage } from './FileImage.jsx';
import { QuestionResponse } from './QuestionResponse.jsx';
import '../styles/exam-session.css';

// The exam and recommended-practice flows share presentation while keeping
// their own API contracts, save queues and server-side scoring.
export function ExamTakingWorkspace({
  allQuestions = [],
  enabled = true,
  disabled = false,
  savingQuestions = [],
  onAnswerChange,
  onAnswerSave,
  sidebar,
  questionDetails,
  emptyContent,
  progress,
}) {
  const [layout, setLayout] = useState('single');
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const questions =
    layout === 'single' ? (allQuestions[activeQuestion] ? [allQuestions[activeQuestion]] : []) : allQuestions;
  useEffect(() => {
    const navigator = document.querySelector('.exam-taking-navigator');
    const page = navigator?.closest('.exam-taking-page');
    if (!navigator || !page) return undefined;
    const resize = () => page.style.setProperty('--exam-dock-height', `${navigator.getBoundingClientRect().height}px`);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(navigator);
    return () => {
      observer.disconnect();
      page.style.removeProperty('--exam-dock-height');
    };
  }, [enabled, allQuestions.length]);
  useEffect(() => {
    const strip = document.querySelector('.exam-taking-question-grid');
    const selected = strip?.querySelector('[aria-current="step"]');
    if (!strip || !selected) return;
    const stripBounds = strip.getBoundingClientRect();
    const selectedBounds = selected.getBoundingClientRect();
    if (selectedBounds.left < stripBounds.left || selectedBounds.right > stripBounds.right)
      strip.scrollTo({
        left:
          strip.scrollLeft + selectedBounds.left - stripBounds.left - (strip.clientWidth - selectedBounds.width) / 2,
      });
  }, [activeQuestion, allQuestions.length]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="exam-taking-layout">
        <Card className="exam-taking-workspace">
          {!enabled && emptyContent}
          {enabled && questions.length > 0 && (
            <div className="space-y-5">
              {questions.map((question, index) => (
                <Card
                  as="section"
                  id={`exam-question-${question.questionId}`}
                  key={question.questionId}
                  className="exam-taking-question"
                >
                  <div className="exam-taking-question-heading">
                    <h3>
                      <span className="exam-taking-question-number">
                        Câu {question.orderIndex || (layout === 'single' ? activeQuestion + 1 : index + 1)}
                      </span>
                      <span>{question.content}</span>
                    </h3>
                    <Button
                      variant="secondary"
                      icon={flaggedQuestions.includes(question.questionId) ? 'outlined_flag' : 'flag'}
                      aria-pressed={flaggedQuestions.includes(question.questionId)}
                      onClick={() =>
                        setFlaggedQuestions((rows) =>
                          rows.includes(question.questionId)
                            ? rows.filter((id) => id !== question.questionId)
                            : [...rows, question.questionId]
                        )
                      }
                    >
                      {flaggedQuestions.includes(question.questionId) ? 'Bỏ cờ' : 'Cờ'}
                    </Button>
                  </div>
                  {questionDetails?.(question)}
                  {question.mediaUrl && (
                    <FileImage src={question.mediaUrl} alt="Nội dung minh họa" className="mt-3 max-h-64 rounded-lg" />
                  )}
                  <QuestionResponse
                    question={question}
                    disabled={disabled}
                    saving={savingQuestions.includes(question.questionId)}
                    onChange={(patch) => onAnswerChange(question, patch)}
                    onSave={() => onAnswerSave(question)}
                  />
                </Card>
              ))}
            </div>
          )}
          {enabled && layout === 'single' && allQuestions[activeQuestion] && (
            <nav aria-label="Chuyển câu hỏi" className="exam-taking-pagination">
              <Button
                variant="secondary"
                disabled={disabled || activeQuestion === 0}
                onClick={() => setActiveQuestion((value) => value - 1)}
                icon="chevron_left"
              >
                Câu trước
              </Button>
              <Button
                variant="secondary"
                disabled={disabled || activeQuestion >= allQuestions.length - 1}
                onClick={() => setActiveQuestion((value) => value + 1)}
                icon="chevron_right"
              >
                Câu sau
              </Button>
            </nav>
          )}
        </Card>
        <aside className="exam-taking-sidebar">{sidebar}</aside>
      </div>
      {enabled && (
        <Card as="nav" aria-label="Chọn câu hỏi" className="exam-taking-navigator">
          <h2 className="text-headline-sm font-bold">Chọn câu</h2>
          <div className="exam-taking-view-toggle">
            <Button
              variant={layout === 'single' ? 'primary' : 'secondary'}
              aria-pressed={layout === 'single'}
              onClick={() => setLayout('single')}
            >
              Từng câu
            </Button>
            <Button
              variant={layout === 'all' ? 'primary' : 'secondary'}
              aria-pressed={layout === 'all'}
              onClick={() => setLayout('all')}
            >
              Theo thứ tự
            </Button>
          </div>
          <div className="exam-taking-question-grid">
            {allQuestions.map((question, index) => {
              const answered = Boolean((question.selectedOptionIds || []).length || question.answerText);
              const flagged = flaggedQuestions.includes(question.questionId);
              return (
                <button
                  type="button"
                  key={question.questionId}
                  disabled={disabled}
                  aria-label={`Câu ${index + 1}${answered ? ', đã trả lời' : ', chưa trả lời'}${flagged ? ', đã đánh dấu' : ''}`}
                  aria-current={index === activeQuestion ? 'step' : undefined}
                  onClick={() => {
                    setActiveQuestion(index);
                    if (layout === 'all') {
                      document.getElementById(`exam-question-${question.questionId}`)?.scrollIntoView({
                        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                        block: 'start',
                      });
                    }
                  }}
                  className={`rounded-lg border p-2 text-sm font-bold ${flagged ? 'border-amber-300 bg-amber-100 text-amber-800' : index === activeQuestion ? 'border-primary bg-[#FEE2E2] text-primary' : answered ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-[#CBD5E1]'}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-body-sm text-[#64748B]">
            Đã trả lời{' '}
            {progress?.answeredQuestions ??
              allQuestions.filter((item) => (item.selectedOptionIds || []).length || item.answerText).length}
            /{progress?.totalQuestions ?? allQuestions.length} câu.
          </p>
        </Card>
      )}
    </div>
  );
}
