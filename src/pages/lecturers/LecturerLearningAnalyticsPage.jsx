import React, { useMemo, useState } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { HorizontalBarChart } from '../../components/DataCharts.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { labs } from '../../data/lmsData.js';
import {
  aiActivityAggregates,
  aiInsightTopics,
  assessmentAttempts,
  assessments,
  labAssignments,
  labSubmissions,
  lecturerCourses,
  lecturerLabMetadata,
  lecturerMaterials,
  lecturerQuestions,
  lecturerStudents,
  questionChapterLabels,
} from '../../data/lecturerData.js';
import { filterAIActivity, getTopAITopics } from '../../lib/aiInsights.js';
import { loadLabGradings } from '../../lib/labGradingState.js';
import {
  getAnalyticsRange,
  getAssessmentPerformance,
  getChapterPerformance,
  getCLOPerformance,
  getLabPerformance,
  getStudentLearningSummary,
} from '../../lib/learningAnalytics.js';

const formatValue = (value, suffix = '') =>
  value === null || value === undefined
    ? 'Chưa có dữ liệu'
    : `${Number(value).toFixed(1).replace(/\.0$/, '')}${suffix}`;

function ScoreDistribution({ scores }) {
  const buckets = [
    { label: '0 – <5', count: scores.filter((score) => score < 5).length },
    { label: '5 – <6.5', count: scores.filter((score) => score >= 5 && score < 6.5).length },
    { label: '6.5 – <8', count: scores.filter((score) => score >= 6.5 && score < 8).length },
    { label: '8 – 10', count: scores.filter((score) => score >= 8).length },
  ];
  const max = Math.max(1, ...buckets.map((item) => item.count));
  return (
    <div className="space-y-4">
      {buckets.map((bucket) => (
        <div key={bucket.label} className="grid grid-cols-[72px_1fr_auto] items-center gap-3">
          <span className="text-body-sm font-semibold">{bucket.label}</span>
          <div className="h-3 overflow-hidden rounded-full bg-[#E2E8F0]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(bucket.count / max) * 100}%` }} />
          </div>
          <span className="text-body-sm text-[#64748B]">{bucket.count} lượt làm</span>
        </div>
      ))}
    </div>
  );
}

export function LecturerLearningAnalyticsPage() {
  const initialFilters = {
    classId: 'ALL',
    range: 'SEMESTER',
    chapterId: 'ALL',
    customStart: '2026-08-01',
    customEnd: '2026-09-22',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState('');
  const [progressFilter, setProgressFilter] = useState('ALL');
  const [examFilter, setExamFilter] = useState('ALL');
  const [labFilter, setLabFilter] = useState('ALL');
  const range = useMemo(() => getAnalyticsRange(filters.range, filters.customStart, filters.customEnd), [filters]);
  const scopedStudents = useMemo(
    () => lecturerStudents.filter((student) => filters.classId === 'ALL' || student.className === filters.classId),
    [filters.classId]
  );
  const assessmentData = useMemo(
    () =>
      getAssessmentPerformance({
        assessments,
        attempts: assessmentAttempts,
        students: lecturerStudents,
        classId: filters.classId,
        chapterId: filters.chapterId,
        range,
      }),
    [filters.classId, filters.chapterId, range]
  );
  const chapterData = useMemo(
    () =>
      getChapterPerformance({
        attempts: assessmentData.attempts,
        assessments: assessmentData.assessments,
        questions:
          filters.chapterId === 'ALL'
            ? lecturerQuestions
            : lecturerQuestions.filter((question) => question.chapterId === filters.chapterId),
        chapterLabels: questionChapterLabels,
      }),
    [assessmentData, filters.chapterId]
  );
  const cloData = useMemo(
    () =>
      getCLOPerformance({
        attempts: assessmentData.attempts,
        questions:
          filters.chapterId === 'ALL'
            ? lecturerQuestions
            : lecturerQuestions.filter((question) => question.chapterId === filters.chapterId),
      }),
    [assessmentData.attempts, filters.chapterId]
  );
  const gradings = loadLabGradings();
  const labData = useMemo(
    () =>
      getLabPerformance({
        labs,
        assignments: labAssignments,
        submissions: labSubmissions,
        gradings,
        students: lecturerStudents,
        classId: filters.classId,
        chapterId: filters.chapterId,
        range,
        labMetadata: lecturerLabMetadata,
      }),
    [filters.classId, filters.chapterId, range]
  );
  const scopedLabAssignmentIds = useMemo(() => new Set(labData.flatMap((item) => item.assignmentIds)), [labData]);
  const scopedLabAssignments = useMemo(
    () => labAssignments.filter((item) => scopedLabAssignmentIds.has(item.id)),
    [scopedLabAssignmentIds]
  );
  const scopedLabSubmissions = useMemo(
    () => labSubmissions.filter((item) => scopedLabAssignmentIds.has(item.assignmentId)),
    [scopedLabAssignmentIds]
  );
  const studentSummary = useMemo(
    () =>
      getStudentLearningSummary({
        students: scopedStudents,
        assessments: assessmentData.assessments,
        attempts: assessmentData.attempts,
        labAssignments: scopedLabAssignments,
        labSubmissions: scopedLabSubmissions,
        gradings,
      }),
    [assessmentData, scopedLabAssignments, scopedLabSubmissions, scopedStudents]
  );
  const aiRows = useMemo(() => filterAIActivity(aiActivityAggregates, { ...filters, range: filters.range }), [filters]);
  const topAITopics = useMemo(() => getTopAITopics(aiRows, aiInsightTopics), [aiRows]);
  const labAssigned = labData.reduce((sum, item) => sum + item.assigned, 0);
  const labSubmitted = labData.reduce((sum, item) => sum + item.submitted, 0);
  const labPending = labData.reduce((sum, item) => sum + item.pending, 0);
  const visibleStudents = useMemo(
    () =>
      studentSummary.filter((student) => {
        const normalized = query.trim().toLocaleLowerCase('vi');
        const progressMatch =
          progressFilter === 'ALL' ||
          (progressFilter === 'LOW' && student.progress < 50) ||
          (progressFilter === 'MEDIUM' && student.progress >= 50 && student.progress < 80) ||
          (progressFilter === 'HIGH' && student.progress >= 80);
        const examMatch =
          examFilter === 'ALL' ||
          (examFilter === 'COMPLETE' && student.examAssigned > 0 && student.examCompleted >= student.examAssigned) ||
          (examFilter === 'INCOMPLETE' && student.examCompleted < student.examAssigned);
        const labMatch =
          labFilter === 'ALL' ||
          (labFilter === 'COMPLETE' && student.labAssigned > 0 && student.labCompleted >= student.labAssigned) ||
          (labFilter === 'INCOMPLETE' && student.labCompleted < student.labAssigned);
        return (
          (!normalized || `${student.id} ${student.name}`.toLocaleLowerCase('vi').includes(normalized)) &&
          progressMatch &&
          examMatch &&
          labMatch
        );
      }),
    [examFilter, labFilter, progressFilter, query, studentSummary]
  );
  const reset = () => {
    setFilters(initialFilters);
    setQuery('');
    setProgressFilter('ALL');
    setExamFilter('ALL');
    setLabFilter('ALL');
  };
  const hasLearningData = scopedStudents.length || assessmentData.attempts.length || labSubmitted;
  const worstChapter = [...chapterData].sort((a, b) => (a.rate ?? 100) - (b.rate ?? 100))[0];
  const mostIncompleteLab = [...labData]
    .filter((item) => item.assigned > 0)
    .sort((a, b) => (b.assigned - b.submitted) / b.assigned - (a.assigned - a.submitted) / a.assigned)[0];
  const topAI = topAITopics[0];
  const supportSignals = [
    worstChapter && {
      title: questionChapterLabels[worstChapter.id],
      type: 'Tỷ lệ trả lời chưa chính xác',
      metric: `${formatValue(100 - worstChapter.rate, '%')} trên ${worstChapter.answered} lượt trả lời`,
      source: 'Assessment Attempts → Question Bank',
      href: `lecturer_question_bank.html?chapter=${worstChapter.id}`,
      action: 'Xem câu hỏi',
    },
    mostIncompleteLab && {
      title: mostIncompleteLab.title,
      type: 'Báo cáo thí nghiệm chưa nộp',
      metric: `${mostIncompleteLab.assigned - mostIncompleteLab.submitted}/${mostIncompleteLab.assigned} lượt giao chưa có báo cáo`,
      source: 'Lab Assignments → Lab Submissions',
      href: 'lecturer_labs.html',
      action: 'Xem báo cáo',
    },
    topAI && {
      title: topAI.name,
      type: 'Chủ đề được hỏi nhiều trên AI',
      metric: `${topAI.questions} lượt hỏi · ${topAI.insufficient} lượt thiếu căn cứ`,
      source: 'AI Insights tổng hợp',
      href: `lecturer_ai_insights.html?chapter=${topAI.chapterId}`,
      action: 'Xem AI Insights',
    },
  ].filter(Boolean);

  return (
    <LecturerPageShell
      currentPage="lecturer_analytics.html"
      title="Phân tích kết quả học tập"
      eyebrow="LEARNING ANALYTICS"
      description="Theo dõi tiến độ, kết quả và mức độ hoàn thành học phần Vật lý đại cương 1"
    >
      <Breadcrumbs items={['Giảng viên']} current="Phân tích kết quả học tập" />
      <Card className="mt-5 p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <label className="text-body-sm font-semibold">
            Học phần
            <select value="BAS1201" disabled className="mt-2 w-full border border-[#CBD5E1] bg-[#F1F5F9] px-4">
              <option value="BAS1201">Vật lý đại cương 1 · BAS1201</option>
            </select>
          </label>
          <label className="text-body-sm font-semibold">
            Lớp học
            <select
              value={filters.classId}
              onChange={(event) => setFilters({ ...filters, classId: event.target.value })}
              className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
            >
              <option value="ALL">Tất cả lớp</option>
              {lecturerCourses.map((course) => (
                <option key={course.className}>{course.className}</option>
              ))}
            </select>
          </label>
          <label className="text-body-sm font-semibold">
            Khoảng thời gian
            <select
              value={filters.range}
              onChange={(event) => setFilters({ ...filters, range: event.target.value })}
              className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
            >
              <option value="7D">7 ngày gần nhất</option>
              <option value="30D">30 ngày gần nhất</option>
              <option value="SEMESTER">Học kỳ hiện tại</option>
              <option value="CUSTOM">Tùy chỉnh</option>
            </select>
          </label>
          <label className="text-body-sm font-semibold">
            Chương
            <select
              value={filters.chapterId}
              onChange={(event) => setFilters({ ...filters, chapterId: event.target.value })}
              className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
            >
              <option value="ALL">Tất cả chương</option>
              {Object.entries(questionChapterLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {filters.range === 'CUSTOM' && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-body-sm font-semibold">
              Từ ngày
              <input
                type="date"
                value={filters.customStart}
                onChange={(event) => setFilters({ ...filters, customStart: event.target.value })}
                className="mt-2 w-full border border-[#CBD5E1] px-4"
              />
            </label>
            <label className="text-body-sm font-semibold">
              Đến ngày
              <input
                type="date"
                value={filters.customEnd}
                onChange={(event) => setFilters({ ...filters, customEnd: event.target.value })}
                className="mt-2 w-full border border-[#CBD5E1] px-4"
              />
            </label>
          </div>
        )}
      </Card>
      {!hasLearningData ? (
        <Card className="mt-5 p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-[#94A3B8]">analytics</span>
          <h2 className="mt-3 text-headline-sm font-bold">Chưa có dữ liệu học tập</h2>
          <p className="mt-1 text-body-md text-[#64748B]">
            Kết quả phân tích sẽ xuất hiện khi có dữ liệu từ các hoạt động học tập.
          </p>
          <Button variant="secondary" className="mt-5" onClick={reset}>
            Xóa bộ lọc
          </Button>
        </Card>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
            <StatCard label="Tổng sinh viên" value={String(scopedStudents.length)} icon="groups" />
            <StatCard label="Hoàn thành học liệu" value="Chưa có dữ liệu" icon="menu_book" />
            <StatCard
              label="Điểm kiểm tra trung bình"
              value={formatValue(assessmentData.average)}
              detail={assessmentData.average === null ? '' : '/10 chuẩn hóa'}
              icon="leaderboard"
            />
            <StatCard
              label="Hoàn thành bài kiểm tra"
              value={formatValue(assessmentData.completionRate, '%')}
              icon="task_alt"
            />
            <StatCard
              label="Hoàn thành thí nghiệm"
              value={labAssigned ? formatValue((labSubmitted / labAssigned) * 100, '%') : 'Chưa có dữ liệu'}
              icon="science"
            />
            <StatCard label="Báo cáo chờ chấm" value={String(labPending)} icon="grading" tone="warning" />
          </section>
          <Card className="mt-5 p-5 md:p-6">
            <Tabs
              items={[
                { id: 'OVERVIEW', label: 'Tổng quan' },
                { id: 'STUDENTS', label: 'Sinh viên' },
              ]}
            >
              {(tab) =>
                tab === 'STUDENTS' ? (
                  <div className="space-y-5 pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      <label className="text-body-sm font-semibold">
                        Tìm sinh viên
                        <input
                          type="search"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Tìm theo tên hoặc mã sinh viên..."
                          className="mt-2 w-full border border-[#CBD5E1] px-4"
                        />
                      </label>
                      <label className="text-body-sm font-semibold">
                        Tiến độ học liệu
                        <select
                          value={progressFilter}
                          onChange={(event) => setProgressFilter(event.target.value)}
                          className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
                        >
                          <option value="ALL">Tất cả</option>
                          <option value="LOW">Dưới 50%</option>
                          <option value="MEDIUM">50% – dưới 80%</option>
                          <option value="HIGH">Từ 80%</option>
                        </select>
                      </label>
                      <label className="text-body-sm font-semibold">
                        Bài kiểm tra
                        <select
                          value={examFilter}
                          onChange={(event) => setExamFilter(event.target.value)}
                          className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
                        >
                          <option value="ALL">Tất cả</option>
                          <option value="COMPLETE">Đã hoàn thành tất cả</option>
                          <option value="INCOMPLETE">Chưa hoàn thành</option>
                        </select>
                      </label>
                      <label className="text-body-sm font-semibold">
                        Thí nghiệm
                        <select
                          value={labFilter}
                          onChange={(event) => setLabFilter(event.target.value)}
                          className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
                        >
                          <option value="ALL">Tất cả</option>
                          <option value="COMPLETE">Đã hoàn thành tất cả</option>
                          <option value="INCOMPLETE">Chưa hoàn thành</option>
                        </select>
                      </label>
                    </div>
                    {visibleStudents.length ? (
                      <DataTable
                        columns={[
                          'Mã sinh viên',
                          'Họ tên',
                          'Lớp',
                          'Tiến độ',
                          'Bài kiểm tra',
                          'Điểm KT TB',
                          'Thí nghiệm',
                          'Điểm Lab TB',
                          '',
                        ]}
                        rows={visibleStudents}
                        renderRow={(student) => (
                          <tr className="border-t border-[#E2E8F0]">
                            <td className="px-3 py-3 font-mono">{student.id}</td>
                            <td className="px-3 py-3 font-semibold whitespace-nowrap">{student.name}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{student.className}</td>
                            <td className="min-w-[130px] px-3 py-3">
                              <ProgressBar value={student.progress} compact />
                              <span className="text-label-sm text-[#64748B]">{student.progress}% tổng hợp</span>
                            </td>
                            <td className="px-3 py-3">
                              {student.examCompleted}/{student.examAssigned}
                            </td>
                            <td className="px-3 py-3">{formatValue(student.examAverage)}</td>
                            <td className="px-3 py-3">
                              {student.labCompleted}/{student.labAssigned}
                            </td>
                            <td className="px-3 py-3">{formatValue(student.labAverage)}</td>
                            <td className="px-3 py-3">
                              <a
                                href={`lecturer_student_detail.html?student=${student.id}`}
                                className="font-semibold text-primary whitespace-nowrap"
                              >
                                Xem chi tiết
                              </a>
                            </td>
                          </tr>
                        )}
                      />
                    ) : (
                      <div className="py-10 text-center">
                        <h3 className="text-headline-sm font-bold">Không tìm thấy dữ liệu phù hợp</h3>
                        <Button variant="secondary" className="mt-4" onClick={reset}>
                          Xóa bộ lọc
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 pt-5">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      <Card className="p-5">
                        <SectionHeader title="Tiến độ học tập" description="Theo chương của học phần." />
                        <div className="mt-5 space-y-3">
                          {Object.entries(questionChapterLabels).map(([id, label]) => {
                            const materialCount = lecturerMaterials.filter(
                              (material) =>
                                material.chapter === `CHAPTER_${id.replace('CH', '')}` || material.chapter === 'ALL'
                            ).length;
                            return (
                              <div key={id} className="rounded-xl border border-[#E2E8F0] p-4">
                                <div className="flex justify-between gap-3">
                                  <strong>{label}</strong>
                                  <StatusBadge tone="neutral">Chưa có dữ liệu completion</StatusBadge>
                                </div>
                                <p className="mt-2 text-body-sm text-[#64748B]">
                                  {materialCount} học liệu liên quan · chưa có mapping hoàn thành theo sinh viên.
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                      <Card className="p-5">
                        <SectionHeader title="Kết quả bài kiểm tra" />
                        <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 gap-3 text-body-sm">
                          {[
                            ['Tổng bài', assessmentData.total],
                            ['Đã kết thúc', assessmentData.closed],
                            ['Bài đã nộp', assessmentData.submitted],
                            ['Điểm TB', formatValue(assessmentData.average)],
                            ['Cao nhất', formatValue(assessmentData.highest)],
                            ['Thấp nhất', formatValue(assessmentData.lowest)],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-xl bg-[#F8FAFC] p-3">
                              <span className="text-[#64748B]">{label}</span>
                              <strong className="mt-1 block">{value}</strong>
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-body-sm text-[#64748B]">
                          Điểm được chuẩn hóa về thang 10. Tỷ lệ đạt chưa hiển thị vì chưa có ngưỡng đạt được cấu hình.
                        </p>
                        <div className="mt-5">
                          <ScoreDistribution scores={assessmentData.normalizedScores} />
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <a href="lecturer_assessments.html">
                            <Button variant="secondary">Xem bài kiểm tra</Button>
                          </a>
                          {assessmentData.assessments[0] && (
                            <a href={`lecturer_assessment_results.html?assessment=${assessmentData.assessments[0].id}`}>
                              <Button variant="secondary">Xem kết quả</Button>
                            </a>
                          )}
                        </div>
                      </Card>
                    </div>
                    <div>
                      <SectionHeader
                        title="Kết quả theo chương"
                        description="Câu chưa trả lời được tính là chưa chính xác; chỉ dùng bài đã nộp hợp lệ."
                      />
                      <div className="mt-4">
                        <DataTable
                          columns={['Chương', 'Câu đã làm', 'Đúng', 'Sai/chưa trả lời', 'Tỷ lệ đúng', 'Điểm TB', '']}
                          rows={chapterData}
                          renderRow={(row) => (
                            <tr className="border-t border-[#E2E8F0]">
                              <td className="min-w-[230px] px-3 py-3 font-semibold">{questionChapterLabels[row.id]}</td>
                              <td className="px-3 py-3">{row.answered}</td>
                              <td className="px-3 py-3">{row.correct}</td>
                              <td className="px-3 py-3">{row.incorrect}</td>
                              <td className="px-3 py-3">{formatValue(row.rate, '%')}</td>
                              <td className="px-3 py-3">{formatValue(row.average)}</td>
                              <td className="px-3 py-3">
                                <a
                                  href={`lecturer_question_bank.html?chapter=${row.id}`}
                                  className="font-semibold text-primary"
                                >
                                  Xem chi tiết
                                </a>
                              </td>
                            </tr>
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <SectionHeader
                        title="Kết quả thí nghiệm 3D"
                        description="Điểm trung bình chỉ dùng kết quả CONFIRMED hoặc PUBLISHED."
                      />
                      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {labData.map((lab) => (
                          <Card key={lab.id} className="p-5">
                            <h3 className="text-headline-sm font-bold">{lab.title}</h3>
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-body-sm">
                              {[
                                ['Được giao', lab.assigned],
                                ['Đã nộp', lab.submitted],
                                ['Chờ chấm', lab.pending],
                                ['Đã xác nhận', lab.confirmed],
                                ['Điểm TB', formatValue(lab.average)],
                              ].map(([label, value]) => (
                                <div key={label} className="rounded-lg bg-[#F8FAFC] p-3">
                                  <span className="text-[#64748B]">{label}</span>
                                  <strong className="mt-1 block">{value}</strong>
                                </div>
                              ))}
                            </div>
                            <a href="lecturer_labs.html">
                              <Button variant="secondary" className="mt-4">
                                Xem báo cáo
                              </Button>
                            </a>
                          </Card>
                        ))}
                      </div>
                    </div>
                    <div>
                      <SectionHeader
                        title="Kết quả theo chuẩn đầu ra học phần"
                        description="Không tự kết luận mức độ đạt CLO khi chưa có ngưỡng được phê duyệt."
                      />
                      <div className="mt-4">
                        <DataTable
                          columns={[
                            'CLO',
                            'Mô tả',
                            'Câu hỏi liên quan',
                            'Lượt trả lời',
                            'Tỷ lệ đúng',
                            'Điểm đạt / tối đa',
                          ]}
                          rows={cloData}
                          renderRow={(row) => (
                            <tr className="border-t border-[#E2E8F0]">
                              <td className="px-3 py-3 font-bold text-primary">{row.id}</td>
                              <td className="min-w-[260px] px-3 py-3 text-[#64748B]">
                                Chưa có mô tả CLO trong dữ liệu học phần hiện tại.
                              </td>
                              <td className="px-3 py-3">{row.questionCount}</td>
                              <td className="px-3 py-3">{row.answers}</td>
                              <td className="px-3 py-3">{formatValue(row.rate, '%')}</td>
                              <td className="px-3 py-3">
                                {row.earned} / {row.possible}
                              </td>
                            </tr>
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      <Card className="p-5">
                        <SectionHeader
                          title="Nội dung cần giảng viên xem xét"
                          description="Các tín hiệu quan sát độc lập, không phải kết luận năng lực."
                        />
                        <div className="mt-4 space-y-3">
                          {supportSignals.map((signal) => (
                            <div
                              key={`${signal.type}-${signal.title}`}
                              className="rounded-xl border border-[#E2E8F0] p-4"
                            >
                              <StatusBadge tone="warning">{signal.type}</StatusBadge>
                              <h3 className="mt-2 font-bold">{signal.title}</h3>
                              <p className="mt-1 text-body-sm">{signal.metric}</p>
                              <p className="mt-1 text-label-sm text-[#64748B]">
                                Nguồn: {signal.source} · Phạm vi bộ lọc hiện tại
                              </p>
                              <a
                                href={signal.href}
                                className="mt-3 inline-block text-body-sm font-semibold text-primary"
                              >
                                {signal.action} →
                              </a>
                            </div>
                          ))}
                        </div>
                      </Card>
                      <Card className="p-5">
                        <SectionHeader
                          title="Gợi ý hỗ trợ học tập"
                          description="Gợi ý theo quy tắc minh bạch, không sử dụng mô hình dự đoán."
                        />
                        <div className="mt-4 space-y-3">
                          {worstChapter && (
                            <div className="rounded-xl bg-[#FEF2F2] p-4 text-body-sm">
                              Nhiều lượt trả lời chưa chính xác ở {questionChapterLabels[worstChapter.id]}. Giảng viên
                              có thể xem lại câu hỏi và học liệu liên quan.
                            </div>
                          )}
                          {mostIncompleteLab && mostIncompleteLab.assigned > mostIncompleteLab.submitted && (
                            <div className="rounded-xl bg-[#FEF3C7] p-4 text-body-sm">
                              Có báo cáo {mostIncompleteLab.title} chưa được nộp. Giảng viên có thể kiểm tra tiến độ
                              thực hiện.
                            </div>
                          )}
                          {topAI?.insufficient > 0 && (
                            <div className="rounded-xl bg-[#F1F5F9] p-4 text-body-sm">
                              {topAI.name} có phản hồi thiếu căn cứ. Cần xem xét học liệu liên quan trước khi đưa ra
                              quyết định.
                            </div>
                          )}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <a href="lecturer_courses.html">
                            <Button variant="secondary">Học phần</Button>
                          </a>
                          <a href="lecturer_students.html">
                            <Button variant="secondary">Sinh viên</Button>
                          </a>
                          <a href="lecturer_materials.html">
                            <Button variant="secondary">Học liệu</Button>
                          </a>
                          <a href="lecturer_ai_insights.html">
                            <Button>AI Insights</Button>
                          </a>
                        </div>
                      </Card>
                    </div>
                  </div>
                )
              }
            </Tabs>
          </Card>
        </>
      )}
    </LecturerPageShell>
  );
}
