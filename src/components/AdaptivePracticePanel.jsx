import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/apiClient.js';
import { navigate } from '../lib/navigation.js';
import {
  accuracyText,
  weaknessLabels,
  savedPractice,
  rememberPractice,
  practiceSessionHref,
} from '../lib/adaptivePractice.js';
import { AdaptivePracticeButton as Button, AdaptivePracticeIcon } from './AdaptivePracticeUI.jsx';
import { MetricGrid } from './MetricGrid.jsx';
import { StatCard } from './StatCard.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { SelectField } from './SelectField.jsx';
import { LoadingIndicator } from './LoadingIndicator.jsx';
import '../styles/adaptive-practice.css';

const rowsOf = (data) => (Array.isArray(data) ? data : data?.content || []);

export function AdaptivePracticePanel() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const params = new URLSearchParams(window.location.search);
  const semester = params.get('semester') || '';
  const classId = params.has('class') ? params.get('class') || 'ALL' : params.get('recommendClassId') || 'ALL';
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api.students
      .myClasses()
      .then((data) => {
        if (alive)
          setClasses(
            rowsOf(data).filter(
              (row) =>
                (!semester || String(row.semesterId) === semester) &&
                (classId === 'ALL' || String(row.classId) === classId)
            )
          );
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Không thể tải lớp học.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [semester, classId, retry]);
  if (loading) return <LoadingIndicator>Đang tải lớp học…</LoadingIndicator>;
  if (error)
    return (
      <div className="adaptive-practice__notice" role="alert">
        {error}
        <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
          Thử lại
        </Button>
      </div>
    );
  if (!classes.length)
    return (
      <div className="adaptive-practice__empty">
        <AdaptivePracticeIcon name="school" />
        <h3>Gợi ý sẽ xuất hiện theo lớp học</h3>
        <p>Không có lớp học trong phạm vi đã chọn để bắt đầu luyện tập.</p>
        <a href="my_courses.html">Xem học phần của tôi</a>
      </div>
    );
  return (
    <div className="space-y-10">
      {classes.map((item) => (
        <section key={item.classId} data-practice-class={item.classId} className="space-y-5">
          {classes.length > 1 && (
            <h2 className="text-headline-md font-bold">
              {[item.subjectName || item.subjectCode, item.classCode || item.className].filter(Boolean).join(' · ') ||
                'Lớp học'}
            </h2>
          )}
          <PracticeClassPanel classItem={item} />
        </section>
      ))}
    </div>
  );
}

function PracticeClassPanel({ classItem }) {
  const classId = classItem.classId;
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(10);
  const [expanded, setExpanded] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const creating = useRef(false);

  useEffect(() => {
    let active = true;
    setTopics([]);
    setError('');
    setShowAll(false);
    setExpanded(false);
    if (!classId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.practice
      .weakTopics(classId)
      .then((data) => active && setTopics(rowsOf(data)))
      .catch((err) => active && setError(err.message || 'Không thể tải gợi ý ôn tập.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [classId]);

  const start = async (topicId) => {
    if (creating.current || !classId) return;
    creating.current = true;
    setStarting(true);
    setError('');
    try {
      const session = await api.practice.create(classId, {
        questionCount: count,
        ...(topicId ? { topicId } : {}),
        allowExpandedSubjectTopics: expanded,
      });
      if (!session?.sessionId) throw new Error('Chưa nhận được mã bài luyện. Vui lòng thử lại.');
      rememberPractice(session);
      navigate(practiceSessionHref(session.sessionId));
    } catch (err) {
      setError(err.message || 'Không thể tạo bài luyện tập.');
    } finally {
      creating.current = false;
      setStarting(false);
    }
  };
  const previous = savedPractice(classId);
  const ranking = { NEEDS_PRACTICE: 0, IMPROVING: 1, INSUFFICIENT_DATA: 2, GOOD: 3 };
  const ordered = [...topics].sort((a, b) => (ranking[a.weaknessLevel] ?? 4) - (ranking[b.weaknessLevel] ?? 4));
  const selectedClass = classItem;

  return (
    <div className="adaptive-practice space-y-6" aria-label="Gợi ý ôn tập">
      <MetricGrid
        items={[
          {
            label: 'Chủ đề gợi ý',
            value: topics.length,
            detail: 'Theo lớp học đang chọn',
            icon: 'quiz',
            tone: 'primary',
          },
          {
            label: 'Cần củng cố',
            value: topics.filter((topic) => topic.weaknessLevel === 'NEEDS_PRACTICE').length,
            detail: 'Ưu tiên luyện tập tiếp theo',
            icon: 'psychology',
            tone: 'warning',
          },
          {
            label: 'Câu từng trả lời sai',
            value: topics.reduce((total, topic) => total + (topic.wrongCount ?? 0), 0),
            detail: 'Từ lịch sử trả lời theo chủ đề',
            icon: 'history',
            tone: 'warning',
          },
          {
            label: 'Đang tiến bộ',
            value: topics.filter((topic) => topic.weaknessLevel === 'IMPROVING').length,
            detail: 'Tiếp tục luyện để nắm vững',
            icon: 'trending_up',
            tone: 'success',
          },
        ]}
      />
      <div className="adaptive-practice__controls">
        <SelectField
          label="Số câu muốn luyện"
          name="adaptiveQuestionCount"
          value={count}
          disabled={starting}
          onChange={(event) => setCount(Number(event.target.value))}
        >
          {[5, 10, 15, 20, 30, 50].map((value) => (
            <option key={value} value={value}>
              {value} câu
            </option>
          ))}
        </SelectField>
        <Button
          data-action="start-practice"
          icon="play_arrow"
          disabled={starting || loading || !classId || (!topics.length && !error)}
          onClick={() => start()}
        >
          {starting ? 'Đang chuẩn bị…' : 'Bắt đầu bài gợi ý'}
        </Button>
        {previous && (
          <Button
            variant="secondary"
            icon="history"
            disabled={starting}
            onClick={() => navigate(practiceSessionHref(previous.sessionId))}
          >
            {previous.status === 'COMPLETED' ? 'Xem bài luyện gần nhất' : 'Tiếp tục bài luyện gần nhất'}
          </Button>
        )}
      </div>
      <div className="adaptive-practice__preferences">
        <label>
          <input
            type="checkbox"
            className="exam-checkbox"
            checked={expanded}
            disabled={starting}
            onChange={(event) => setExpanded(event.target.checked)}
          />
          Bổ sung câu từ chủ đề khác nếu chưa đủ câu cần ôn
        </label>
      </div>
      {error && (
        <div className="adaptive-practice__notice" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <LoadingIndicator>Đang phân tích lịch sử trả lời…</LoadingIndicator>
      ) : !error && !topics.length ? (
        <div className="adaptive-practice__empty">
          <AdaptivePracticeIcon name="auto_stories" />
          <h3>Chưa có chủ đề để gợi ý</h3>
          <p>Lớp học này chưa có dữ liệu chủ đề luyện tập. Bạn có thể chọn lớp khác hoặc quay lại sau.</p>
        </div>
      ) : (
        <>
          <div className="adaptive-practice__section-heading">
            <h3>Chủ đề nên luyện tiếp</h3>
            <span>{selectedClass?.subjectName || selectedClass?.classCode}</span>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {(showAll ? ordered : ordered.slice(0, 6)).map((topic, index) => (
              <div key={topic.topicId} className="adaptive-topic" data-level={topic.weaknessLevel}>
                <StatCard
                  label={topic.topicName}
                  value={topic.hasEnoughData ? accuracyText(topic.accuracyRate) : '—'}
                  detail={topic.hasEnoughData ? 'Độ chính xác' : 'Chưa đủ dữ liệu đánh giá'}
                  icon="quiz"
                  ribbonLabel={selectedClass?.subjectName || selectedClass?.classCode || 'Gợi ý ôn tập'}
                  ribbonPosition="bottom"
                  accentColor={['#E52220', '#0284C7', '#7C3AED'][index % 3]}
                  footer={
                    <>
                      <div className="flex items-center justify-between gap-3 text-body-sm">
                        <span className="min-w-0 text-[#64748B]">{topic.chapterName || 'Chủ đề học phần'}</span>
                        <span className="adaptive-topic__status">
                          <StatusBadge
                            tone={
                              topic.weaknessLevel === 'NEEDS_PRACTICE'
                                ? 'warning'
                                : topic.weaknessLevel === 'GOOD' || topic.weaknessLevel === 'IMPROVING'
                                  ? 'success'
                                  : 'neutral'
                            }
                          >
                            {weaknessLabels[topic.weaknessLevel] || 'Đang cập nhật'}
                          </StatusBadge>
                        </span>
                      </div>
                      <p className="mt-2 text-body-sm text-[#64748B]">
                        {topic.wrongCount ?? 0} câu sai / {topic.totalAnswered ?? 0} câu đã trả lời
                      </p>
                      <p className="mt-2 text-body-sm text-[#64748B]">
                        {topic.recommendation || 'Luyện thêm để củng cố kiến thức của chủ đề này.'}
                      </p>
                      <Button
                        className="mt-3 w-full"
                        icon="play_arrow"
                        disabled={starting}
                        onClick={() => start(topic.topicId)}
                      >
                        Luyện chủ đề này
                      </Button>
                    </>
                  }
                />
              </div>
            ))}
          </div>
          {ordered.length > 6 && (
            <Button variant="ghost" onClick={() => setShowAll((value) => !value)}>
              {showAll ? 'Thu gọn chủ đề' : `Xem thêm ${ordered.length - 6} chủ đề`}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
