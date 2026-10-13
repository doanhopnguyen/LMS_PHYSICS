import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { QuestionAnswer } from '../../components/QuestionAnswer.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { api } from '../../lib/apiClient.js';
import { getDemoSession } from '../../lib/demoSession.js';
import { navigate } from '../../lib/navigation.js';
import { queryPath } from '../../lib/lecturerUtils.js';
import { createAnswerQueue } from '../../lib/answerQueue.js';
import {
  Button,
  Card,
  Field,
  Lookup,
  Resource,
  SelectField,
  Table,
  itemsOf,
  useResource,
  useMutation,
} from '../lecturers/LecturerShared.jsx';

const levelLabel = {
  INSUFFICIENT_DATA: 'Chưa đủ dữ liệu',
  NEEDS_PRACTICE: 'Cần luyện tập',
  IMPROVING: 'Đang cải thiện',
  GOOD: 'Nắm vững',
};
const resumeKey = (classId) => `ptit-adaptive:${getDemoSession()?.userId || ''}:${classId}`;
export function AdaptivePracticeEntry() {
  const classes = useResource('/api/v1/students/me/classes', true);
  const [classId, setClassId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [resume, setResume] = useState('');
  const weak = useResource(classId ? `/api/v1/student/classes/${classId}/weak-topics` : null);
  const action = useMutation();
  return (
    <Card className="my-5 p-5">
      <h2 className="mb-4 text-title-lg font-semibold">Luyện tập theo gợi ý</h2>
      {action.feedback}
      <Lookup
        label="Lớp học"
        resource={classes}
        idKey="classId"
        value={classId}
        onChange={(id) => {
          setClassId(id);
          setTopicId('');
          setResume(localStorage.getItem(resumeKey(id)) || '');
          action.clear();
        }}
      />
      {classId && (
        <Resource value={weak}>
          {(data) => (
            <>
              <Table
                rows={itemsOf(data)}
                columns={['Chủ đề', 'Độ chính xác', 'Mức độ']}
                cells={(row) => [
                  row.topicName,
                  row.hasEnoughData ? `${row.accuracyRate}%` : '—',
                  levelLabel[row.weaknessLevel] || row.weaknessLevel,
                ]}
              />
              <Form
                className="mt-4 grid gap-4 sm:grid-cols-2"
                busy={action.busy}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const raw = Object.fromEntries(new FormData(e.currentTarget));
                  const response = await action.run(
                    () =>
                      api.practice.create(classId, {
                        questionCount: Number(raw.questionCount),
                        ...(topicId ? { topicId } : {}),
                        allowExpandedSubjectTopics: raw.expand === 'on',
                      }),
                    ''
                  );
                  if (response.ok) {
                    localStorage.setItem(resumeKey(classId), response.data.sessionId);
                    navigate(queryPath('practice_session.html', { sessionId: response.data.sessionId, classId }));
                  }
                }}
              >
                <SelectField label="Chủ đề luyện tập" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                  <option value="">Theo gợi ý</option>
                  {itemsOf(data).map((row) => (
                    <option key={row.topicId} value={row.topicId}>
                      {row.topicName}
                    </option>
                  ))}
                </SelectField>
                <Field
                  label="Số câu"
                  name="questionCount"
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  required
                  defaultValue={10}
                />
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="expand" />
                  Cho phép mở rộng chủ đề cùng môn
                </label>
                <SubmitButton disabled={action.busy}>Bắt đầu luyện tập</SubmitButton>
              </Form>
              {resume && (
                <Button
                  className="mt-4"
                  variant="secondary"
                  onClick={() => navigate(queryPath('practice_session.html', { sessionId: resume, classId }))}
                >
                  Mở phiên gần nhất trên thiết bị
                </Button>
              )}
            </>
          )}
        </Resource>
      )}
    </Card>
  );
}
export function AdaptiveSessionPage() {
  const sessionId = new URLSearchParams(location.search).get('sessionId');
  const session = useResource(sessionId ? `/api/v1/student/practice-sessions/${sessionId}` : null);
  return (
    <AppShell currentPage="exam_practice_center.html" title="Luyện tập theo gợi ý">
      <PageContainer>
        <PageTitle
          title="Luyện tập theo gợi ý"
          actions={
            <Button variant="secondary" onClick={() => navigate('exam_practice_center.html')}>
              Về ôn luyện
            </Button>
          }
        />
        <Resource value={session} empty="Chọn phiên từ trung tâm ôn luyện.">
          {(data) => <AdaptiveSession key={sessionId} initial={data} reload={session.reload} />}
        </Resource>
      </PageContainer>
    </AppShell>
  );
}
function AdaptiveSession({ initial, reload }) {
  const [session, setSession] = useState(initial);
  const [questions, setQuestions] = useState(initial.questions || []);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(0);
  const draft = useRef(initial.questions || []);
  const locked = useRef(false);
  const queue = useRef(null);
  if (!queue.current) queue.current = createAnswerQueue((body) => api.practice.saveAnswer(initial.sessionId, body));
  const active = session.status === 'IN_PROGRESS';
  useEffect(() => {
    if (initial.status !== 'COMPLETED') return;
    let alive = true;
    api.practice.results(initial.sessionId).then(
      (value) => {
        if (alive) {
          setResult(value);
          setQuestions(value.questions || []);
        }
      },
      (failure) => alive && setError(failure.message)
    );
    return () => {
      alive = false;
    };
  }, [initial.sessionId, initial.status]);
  const save = async (questionId) => {
    if (locked.current || !active) return;
    const row = draft.current.find((item) => item.questionId === questionId);
    setSaving((value) => value + 1);
    try {
      await queue.current.enqueue({
        questionId,
        selectedOptionIds: row.selectedOptionIds || [],
        answerText: row.answerText ?? null,
      });
      setError('');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving((value) => value - 1);
    }
  };
  const submit = async () => {
    if (locked.current || !active) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      // Save current text too: pressing Submit must not depend on blur ordering.
      for (const row of draft.current)
        await queue.current.enqueue({
          questionId: row.questionId,
          selectedOptionIds: row.selectedOptionIds || [],
          answerText: row.answerText ?? null,
        });
      await queue.current.flush();
      const completed = await api.practice.submit(initial.sessionId);
      setSession({ ...session, status: completed.status });
      setResult(completed);
      setQuestions(completed.questions || []);
    } catch (failure) {
      setError(failure.message);
      // A lost submit response can leave the server completed: reload before retrying.
      try {
        const actual = await api.practice.get(initial.sessionId);
        if (actual.status !== 'IN_PROGRESS') {
          setSession(actual);
          setQuestions(actual.questions || []);
          if (actual.status === 'COMPLETED') setResult(await api.practice.results(initial.sessionId));
        }
      } catch {}
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <p className="font-semibold">
        {active ? 'Đang luyện tập' : session.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Phiên đã kết thúc'} ·{' '}
        {questions.length} câu
      </p>
      {initial.isDeficient && <Card className="p-4">{initial.deficiencyNotice}</Card>}
      {initial.expandedTopicsUsed && <Card className="p-4">{initial.expansionReason}</Card>}
      {error && (
        <p role="alert" className="text-primary">
          {error}
        </p>
      )}
      {result && (
        <Card className="p-5">
          <p className="text-title-lg font-semibold">
            {result.correctCount}/{result.totalQuestions} câu đúng · {result.accuracyRate}%
          </p>
          <p>Điểm: {result.totalScore}</p>
        </Card>
      )}
      {questions.map((question, i) => (
        <Card key={question.questionId} className="space-y-4 p-5">
          <h2 className="font-semibold">
            Câu {i + 1} · {question.topicName}
          </h2>
          <p className="whitespace-pre-wrap">{question.content}</p>
          {active ? (
            <QuestionAnswer
              question={question}
              disabled={busy}
              onChange={(patch) => {
                if (locked.current) return;
                draft.current = draft.current.map((row) =>
                  row.questionId === question.questionId ? { ...row, ...patch } : row
                );
                setQuestions(draft.current);
                if (!['FILL_BLANK', 'SHORT_ANSWER'].includes(question.questionType)) save(question.questionId);
              }}
              onSaveText={() => save(question.questionId)}
            />
          ) : (
            <>
              <p>
                Câu trả lời:{' '}
                {question.answerText ||
                  (question.options || [])
                    .filter((row) => (question.selectedOptionIds || []).includes(row.optionId))
                    .map((row) => row.content)
                    .join(', ') ||
                  'Chưa trả lời'}
              </p>
              {typeof question.isCorrect === 'boolean' && <p>{question.isCorrect ? 'Đúng' : 'Sai'}</p>}
              {question.acceptedAnswers?.length > 0 && <p>Đáp án: {question.acceptedAnswers.join(' / ')}</p>}
              {(question.options || []).some((row) => row.isCorrect === true) && (
                <p>
                  Đáp án:{' '}
                  {question.options
                    .filter((row) => row.isCorrect === true)
                    .map((row) => row.content)
                    .join(', ')}
                </p>
              )}
              {question.explanation && <p>{question.explanation}</p>}
            </>
          )}
        </Card>
      ))}
      {active && (
        <div className="flex items-center gap-3">
          <Button disabled={busy} onClick={submit}>
            Nộp luyện tập
          </Button>
          <span role="status">{saving ? 'Đang lưu…' : 'Đã lưu'}</span>
        </div>
      )}
      {result?.updatedWeakTopics && (
        <Table
          rows={result.updatedWeakTopics}
          columns={['Chủ đề', 'Mức độ']}
          cells={(row) => [row.topicName, levelLabel[row.weaknessLevel] || row.weaknessLevel]}
        />
      )}
      {!active && (
        <Button variant="secondary" onClick={reload}>
          Tải lại kết quả
        </Button>
      )}
    </div>
  );
}
