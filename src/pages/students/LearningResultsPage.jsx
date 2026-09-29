import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DonutChart, LineChart, MiniColumnChart, ProgressFillList } from '../../components/DataCharts.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { api } from '../../lib/apiClient.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const isFinished = (attempt) => Boolean(attempt?.submittedAt) || ['SUBMITTED', 'GRADED', 'COMPLETED'].includes(attempt?.status);
const scoreOf = (attempt) => Number(attempt?.totalScore ?? attempt?.score);
const dateLabel = (value, index) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : `Lần ${index + 1}`;
};

export function LearningResultsPage() {
  const [classes, setClasses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const classRows = rowsOf(await api.students.myClasses());
        const grouped = await Promise.all(classRows.map(async (classItem) => {
          const [topicData, progressData, examData] = await Promise.all([
            classItem.subjectId ? api.subjects.topics(classItem.subjectId).catch(() => []) : Promise.resolve([]),
            api.students.myProgress(classItem.classId).catch(() => []),
            api.exams.listForClass(classItem.classId).catch(() => []),
          ]);
          const progressByTopic = new Map(rowsOf(progressData).map((item) => [String(item.topicId), item]));
          const topicRows = rowsOf(topicData).map((topic) => ({
            ...topic,
            classId: classItem.classId,
            classLabel: classItem.classCode || classItem.className || classItem.subjectName || 'Học phần',
            subjectName: classItem.subjectName || classItem.subjectCode || 'Học phần',
            progressPercent: Number(progressByTopic.get(String(topic.topicId))?.progressPercent ?? progressByTopic.get(String(topic.topicId))?.completionPercent ?? 0),
          }));
          const exams = rowsOf(examData);
          const attemptsByExam = await Promise.all(exams.map(async (exam) => rowsOf(await api.exams.myAttempts(exam.examId).catch(() => [])).map((attempt) => ({ ...attempt, examTitle: exam.title || 'Đề kiểm tra', classId: classItem.classId, subjectName: classItem.subjectName || classItem.subjectCode || 'Học phần' }))));
          return { classItem, topics: topicRows, attempts: attemptsByExam.flat() };
        }));
        if (!alive) return;
        setClasses(classRows);
        setTopics(grouped.flatMap((item) => item.topics).sort((left, right) => String(left.subjectName).localeCompare(String(right.subjectName)) || Number(left.orderIndex ?? 0) - Number(right.orderIndex ?? 0)));
        setAttempts(grouped.flatMap((item) => item.attempts));
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Không thể tải kết quả học tập.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [reloadKey]);

  const submittedAttempts = useMemo(() => attempts.filter(isFinished), [attempts]);
  const scoredAttempts = useMemo(() => submittedAttempts.filter((item) => Number.isFinite(scoreOf(item))), [submittedAttempts]);
  const averageScore = scoredAttempts.length ? scoredAttempts.reduce((sum, item) => sum + scoreOf(item), 0) / scoredAttempts.length : null;
  const overallProgress = topics.length ? topics.reduce((sum, item) => sum + item.progressPercent, 0) / topics.length : 0;
  const completedTopics = topics.filter((item) => item.progressPercent >= 100).length;
  const scoreTimeline = useMemo(() => [...scoredAttempts].sort((left, right) => new Date(left.submittedAt || left.startedAt || 0) - new Date(right.submittedAt || right.startedAt || 0)).slice(-8), [scoredAttempts]);
  const scoreValues = scoreTimeline.map((item) => {
    const score = scoreOf(item);
    return score <= 10 ? Math.round(score * 10) : Math.min(100, Math.round(score));
  });
  const chapterProgress = topics.map((item) => ({ label: `${item.subjectName} · ${item.topicName || item.name || 'Chủ đề'}`, value: item.progressPercent, tone: item.progressPercent >= 100 ? 'success' : item.progressPercent > 0 ? 'primary' : 'neutral' }));
  const lowestTopic = [...topics].sort((left, right) => left.progressPercent - right.progressPercent)[0];
  const strongestTopic = [...topics].sort((left, right) => right.progressPercent - left.progressPercent)[0];
  const metrics = [
    { label: 'Điểm trung bình', value: averageScore === null ? '—' : averageScore.toFixed(1), detail: scoredAttempts.length ? `${scoredAttempts.length} lượt đã có điểm` : 'Chưa có lượt được chấm', icon: 'emoji_events', tone: 'warning', sideChart: scoreValues.length ? <MiniColumnChart values={scoreValues} compact label="Xu hướng điểm quy đổi" /> : null },
    { label: 'Tiến độ học liệu', value: `${Math.round(overallProgress)}%`, detail: `${topics.length} chủ đề thuộc các lớp đang học`, icon: 'target', tone: 'success', sideChart: <DonutChart value={overallProgress} compact label="Tiến độ học liệu" /> },
    { label: 'Chủ đề hoàn thành', value: completedTopics, detail: `/ ${topics.length || 0} chủ đề`, icon: 'task_alt', tone: 'primary', sideChart: <DonutChart value={topics.length ? (completedTopics / topics.length) * 100 : 0} compact label="Chủ đề hoàn thành" /> },
    { label: 'Lượt đã nộp', value: submittedAttempts.length, detail: attempts.length ? `${attempts.length} lượt làm bài` : 'Chưa có lượt làm bài', icon: 'assignment_turned_in', tone: 'neutral' },
  ];
  const recommendations = [
    lowestTopic && { icon: 'priority_high', title: `Tiếp tục ${lowestTopic.topicName || lowestTopic.name || 'chủ đề'}`, text: `Tiến độ hiện tại ${Math.round(lowestTopic.progressPercent)}%. Mở học liệu để tiếp tục hoàn thành chủ đề này.`, tone: 'primary', href: `learning_module.html?classId=${encodeURIComponent(lowestTopic.classId)}&subjectId=${encodeURIComponent(lowestTopic.subjectId || '')}&topicId=${encodeURIComponent(lowestTopic.topicId)}` },
    strongestTopic && strongestTopic.progressPercent >= 100 && { icon: 'auto_awesome', title: 'Chủ đề đã hoàn thành', text: `${strongestTopic.topicName || strongestTopic.name || 'Chủ đề'} đã đạt 100% tiến độ học liệu.`, tone: 'success' },
    scoredAttempts.length ? { icon: 'grade', title: 'Kết quả gần nhất', text: `Bạn đã có ${scoredAttempts.length} lượt được chấm. Mở phần ôn luyện để xem lại đề và kết quả.`, tone: 'warning', href: 'exam_practice_center.html' } : { icon: 'assignment', title: 'Chưa có điểm', text: 'Bạn chưa có lượt làm bài được chấm. Hãy mở phần ôn luyện khi đề được công bố.', tone: 'warning', href: 'exam_practice_center.html' },
  ].filter(Boolean);

  return <AppShell currentPage="learning_results.html" title="Kết quả học tập · PTIT Physics 1" breadcrumbs={['Kết quả học tập']} current="Phân tích năng lực" filterActions={<Button variant="secondary" icon="refresh" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}>Tải lại</Button>}><PageContainer>
    <PageTitle eyebrow="DỮ LIỆU HỌC TẬP" title="Kết quả & tiến độ học tập" description="Dữ liệu được tổng hợp từ tiến độ học liệu và các lượt làm bài của bạn." />
    {loading ? <Card className="p-8 text-center text-[#64748B]">Đang tải kết quả học tập…</Card> : error && !classes.length ? <Card className="p-8 text-center"><p role="alert" className="text-primary">{error}</p><Button className="mt-4" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</Button></Card> : <>
      {error && <Card className="mb-5 p-4 text-primary" role="alert">{error}</Card>}
      <MetricGrid items={metrics} />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6"><div className="flex items-center justify-between"><h2 className="text-headline-md font-bold">Tiến độ theo chủ đề</h2><span className="text-body-sm text-[#64748B]">{topics.length} chủ đề</span></div><div className="mt-6">{chapterProgress.length ? <ProgressFillList items={chapterProgress} label="Tiến độ theo chủ đề" /> : <p className="text-body-sm text-[#64748B]">Chưa có chủ đề học tập để thống kê.</p>}</div></Card>
        <Card className="p-6"><div className="flex items-center justify-between"><h2 className="text-headline-md font-bold">Điểm theo lượt làm</h2><span className="text-body-sm text-[#64748B]">Tối đa 8 lượt gần nhất</span></div><div className="mt-6">{scoreValues.length ? <><LineChart values={scoreValues} labels={scoreTimeline.map((item, index) => dateLabel(item.submittedAt || item.startedAt, index))} label="Điểm theo lượt làm, quy đổi theo phần trăm" /><p className="mt-2 text-body-sm text-[#64748B]">Điểm được quy đổi về thang 100 để so sánh xu hướng.</p></> : <p className="py-16 text-center text-body-sm text-[#64748B]">Chưa có lượt làm bài được chấm để hiển thị biểu đồ.</p>}</div></Card>
      </div>
      <Card className="mt-6 p-6"><h2 className="text-headline-md font-bold">Gợi ý theo dữ liệu của bạn</h2><div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">{recommendations.map((item) => <Card as="div" key={item.title} className={`p-4 border ${item.tone === 'primary' ? 'bg-[#FEF2F2] border-[#FECACA]' : item.tone === 'success' ? 'bg-[#F0FDF4] border-[#86EFAC]' : 'bg-[#FFFBEB] border-[#FDE68A]'}`}><span className="material-symbols-outlined text-primary">{item.icon}</span><h3 className="mt-3 font-semibold">{item.title}</h3><p className="mt-1 text-body-sm text-[#64748B]">{item.text}</p>{item.href && <a className="mt-3 inline-block text-body-sm font-semibold text-primary" href={item.href}>Mở ngay</a>}</Card>)}</div></Card>
      {!classes.length && <Card className="mt-6 p-8 text-center text-[#64748B]">Bạn chưa được ghi danh vào học phần nào.</Card>}
    </>}
  </PageContainer></AppShell>;
}
