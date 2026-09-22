import React, { useMemo, useState } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { HorizontalBarChart, LineChart } from '../../components/DataCharts.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import {
  aiActivityAggregates,
  aiImprovementSuggestions,
  aiInsightTopics,
  aiInsufficientEvidenceReasons,
  lecturerCourses,
  lecturerMaterials,
  materialChapterLabels,
  materialStatusMeta,
  materialTypeLabels,
  questionChapterLabels,
} from '../../data/lecturerData.js';
import {
  filterAIActivity,
  getAIActivityByChapter,
  getAIActivityByDate,
  getAIStats,
  getInsufficientEvidenceTopics,
  getTopAITopics,
} from '../../lib/aiInsights.js';

const suggestionStatusMeta = {
  NEW: { label: 'Chưa xem xét', tone: 'neutral' },
  REVIEWING: { label: 'Đang xem xét', tone: 'warning' },
  RESOLVED: { label: 'Đã xử lý', tone: 'success' },
  DISMISSED: { label: 'Không cần xử lý', tone: 'neutral' },
};
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const formatDate = (value) => new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T12:00:00`));

function MaterialsList({ ids }) {
  const materials = ids.map((id) => lecturerMaterials.find((item) => item.id === id)).filter(Boolean);
  return (
    <div className="space-y-3">
      {materials.length ? (
        materials.map((material) => (
          <div key={material.id} className="rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <strong>{material.title}</strong>
                <p className="mt-1 text-body-sm text-[#64748B]">
                  {materialTypeLabels[material.type]} · {materialChapterLabels[material.chapter]}
                </p>
              </div>
              <StatusBadge tone={materialStatusMeta[material.status].tone}>
                {materialStatusMeta[material.status].label}
              </StatusBadge>
            </div>
            <p className="mt-2 text-body-sm text-[#64748B]">Nguồn: {material.source}</p>
            <a
              href={`lecturer_materials.html?material=${material.id}`}
              className="mt-3 inline-block text-body-sm font-semibold text-primary"
            >
              Xem học liệu →
            </a>
          </div>
        ))
      ) : (
        <p className="text-body-sm text-[#64748B]">Chưa có học liệu liên quan trong dữ liệu hiện tại.</p>
      )}
    </div>
  );
}

function TopicDetail({ topic, approvedMaterials, onClose }) {
  const citationRate = topic.responses ? (topic.cited / topic.responses) * 100 : 0;
  const refusalRate = topic.responses ? (topic.insufficient / topic.responses) * 100 : 0;
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#0F172A]/45 p-2 md:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="max-h-[calc(100dvh-16px)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-detail-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] p-5 md:p-6">
          <div>
            <p className="text-label-md font-bold text-primary">{questionChapterLabels[topic.chapterId]}</p>
            <h2 id="topic-detail-title" className="mt-1 text-headline-md font-bold">
              {topic.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng chi tiết chủ đề" className="p-2 text-[#64748B]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-6 p-5 md:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['Tổng lượt hỏi', topic.questions],
              ['Sinh viên sử dụng', topic.students],
              ['Có dẫn nguồn', formatPercent(citationRate)],
              ['Từ chối', formatPercent(refusalRate)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#F8FAFC] p-4">
                <span className="text-body-sm text-[#64748B]">{label}</span>
                <strong className="mt-1 block text-headline-sm">{value}</strong>
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-bold">Nhóm câu hỏi thường gặp</h3>
            <ul className="mt-3 space-y-2">
              {topic.frequentQuestionGroups.map((group) => (
                <li key={group} className="flex gap-2 text-body-md">
                  <span className="material-symbols-outlined text-primary">help</span>
                  {group}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-body-sm text-[#64748B]">
              Các nhóm câu hỏi đã được tổng hợp và loại bỏ thông tin định danh; không hiển thị hội thoại cá nhân.
            </p>
          </div>
          <div>
            <h3 className="font-bold">Học liệu liên quan đã phê duyệt</h3>
            <div className="mt-3">
              <MaterialsList ids={topic.materialIds.filter((id) => approvedMaterials.some((item) => item.id === id))} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function LecturerAiInsightsPage() {
  const requestedChapter = new URLSearchParams(window.location.search).get('chapter');
  const initialFilters = {
    classId: 'ALL',
    range: '30D',
    chapterId: requestedChapter && questionChapterLabels[requestedChapter] ? requestedChapter : 'ALL',
    customStart: '2026-09-01',
    customEnd: '2026-09-22',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [suggestions, setSuggestions] = useState(aiImprovementSuggestions);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [feedback, setFeedback] = useState('');
  const approvedMaterials = lecturerMaterials.filter((item) => item.status === 'APPROVED');
  const filtered = useMemo(() => filterAIActivity(aiActivityAggregates, filters), [filters]);
  const stats = useMemo(() => getAIStats(filtered, aiInsightTopics), [filtered]);
  const chapterRows = useMemo(() => getAIActivityByChapter(filtered), [filtered]);
  const topics = useMemo(() => getTopAITopics(filtered, aiInsightTopics), [filtered]);
  const insufficientTopics = useMemo(() => getInsufficientEvidenceTopics(filtered, aiInsightTopics), [filtered]);
  const activityByDate = useMemo(() => getAIActivityByDate(filtered), [filtered]);
  const totalText = filtered.reduce((sum, item) => sum + item.textCount, 0);
  const totalVoice = filtered.reduce((sum, item) => sum + item.voiceCount, 0);
  const resetFilters = () => setFilters(initialFilters);
  const updateSuggestion = (id, status) => {
    setSuggestions((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    setFeedback(`Đã cập nhật đề xuất sang “${suggestionStatusMeta[status].label}”.`);
  };
  const empty = !filtered.length;

  return (
    <LecturerPageShell
      currentPage="lecturer_ai_insights.html"
      title="Phân tích trợ giảng AI"
      eyebrow="AI INSIGHTS"
      description="Theo dõi hoạt động học tập và cải tiến học liệu từ dữ liệu trợ giảng AI"
    >
      <Breadcrumbs items={['Giảng viên']} current="Phân tích trợ giảng AI" />
      <Card className="mt-5 p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <label className="text-body-sm font-semibold">
            Học phần
            <select className="mt-2 w-full border border-[#CBD5E1] bg-white px-4" value="BAS1201" disabled>
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
              {Object.entries(questionChapterLabels).map(([value, label]) => (
                <option key={value} value={value}>
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
        <p className="mt-4 text-label-sm text-[#64748B]">
          Dữ liệu minh họa frontend, chưa kết nối backend hoặc mô hình AI thật.
        </p>
      </Card>
      {feedback && (
        <div
          className="mt-5 rounded-xl border border-[#86EFAC] bg-[#DCFCE7] px-4 py-3 text-body-sm font-semibold text-[#15803D]"
          role="status"
        >
          {feedback}
        </div>
      )}
      {empty ? (
        <Card className="mt-5 p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-[#94A3B8]">query_stats</span>
          <h2 className="mt-3 text-headline-sm font-bold">Không tìm thấy dữ liệu phù hợp</h2>
          <p className="mt-1 text-body-md text-[#64748B]">Thống kê sẽ xuất hiện khi có dữ liệu hoạt động học tập.</p>
          <Button variant="secondary" className="mt-5" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        </Card>
      ) : (
        <>
          <section
            className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4"
            aria-label="Tổng quan AI Insights"
          >
            <StatCard label="Tổng lượt hỏi AI" value={String(stats.totalQuestions)} icon="forum" />
            <StatCard label="Sinh viên sử dụng AI" value={String(stats.uniqueStudents)} icon="groups" />
            <StatCard
              label="Phản hồi có dẫn nguồn"
              value={formatPercent(stats.citationRate)}
              icon="menu_book"
              tone="success"
            />
            <StatCard label="Câu hỏi thiếu căn cứ" value={String(stats.insufficient)} icon="report" tone="warning" />
            <StatCard label="Chủ đề hỏi nhiều nhất" value={stats.topTopic} icon="trending_up" />
          </section>
          <Card className="mt-5 p-5 md:p-6">
            <Tabs
              items={[
                { id: 'OVERVIEW', label: 'Tổng quan' },
                { id: 'INSUFFICIENT', label: 'Câu hỏi chưa đủ căn cứ' },
                { id: 'SUGGESTIONS', label: 'Đề xuất cải tiến học liệu' },
                { id: 'LOG', label: 'Nhật ký tổng hợp' },
              ]}
            >
              {(tab) => {
                if (tab === 'OVERVIEW')
                  return (
                    <div className="space-y-6 pt-5">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        <Card className="p-5">
                          <SectionHeader
                            title="Xu hướng sử dụng trợ giảng AI"
                            description="Số lượt hỏi theo ngày trong phạm vi lọc."
                          />
                          <LineChart
                            values={activityByDate.map((item) => item.questions)}
                            labels={activityByDate.map((item) =>
                              new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(
                                new Date(`${item.date}T12:00:00`)
                              )
                            )}
                            label="Số lượt hỏi AI theo thời gian"
                            color="#E52220"
                          />
                        </Card>
                        <Card className="p-5">
                          <SectionHeader
                            title="Hình thức tương tác"
                            description="Metadata tổng hợp từ giao diện văn bản và giọng nói hiện có."
                          />
                          <div className="mt-5">
                            <HorizontalBarChart
                              items={[
                                {
                                  label: 'Văn bản',
                                  value: (totalText / (totalText + totalVoice)) * 100,
                                  tone: 'primary',
                                },
                                {
                                  label: 'Giọng nói',
                                  value: (totalVoice / (totalText + totalVoice)) * 100,
                                  tone: 'success',
                                },
                              ]}
                              label="Tỷ lệ hình thức tương tác"
                            />
                          </div>
                        </Card>
                      </div>
                      <div>
                        <SectionHeader title="Hoạt động AI theo chương" />
                        <div className="mt-4">
                          <DataTable
                            columns={[
                              'Chương',
                              'Lượt hỏi',
                              'Sinh viên',
                              'Có dẫn nguồn',
                              'Từ chối',
                              'Tỷ lệ từ chối',
                              '',
                            ]}
                            rows={chapterRows}
                            renderRow={(row) => (
                              <tr className="border-t border-[#E2E8F0]">
                                <td className="min-w-[220px] px-3 py-3 font-semibold">
                                  {questionChapterLabels[row.id]}
                                </td>
                                <td className="px-3 py-3">{row.questions}</td>
                                <td className="px-3 py-3">{row.students}</td>
                                <td className="px-3 py-3">{row.cited}</td>
                                <td className="px-3 py-3">{row.insufficient}</td>
                                <td className="px-3 py-3 font-semibold">{formatPercent(row.refusalRate)}</td>
                                <td className="px-3 py-3">
                                  <button
                                    type="button"
                                    onClick={() => setFilters({ ...filters, chapterId: row.id })}
                                    className="font-semibold text-primary whitespace-nowrap"
                                  >
                                    Xem chi tiết
                                  </button>
                                </td>
                              </tr>
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <SectionHeader title="Chủ đề được quan tâm" description="Sắp xếp theo số lượt hỏi giảm dần." />
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {topics.map((topic) => (
                            <Card key={topic.id} className="p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-label-md font-bold text-primary">
                                    {questionChapterLabels[topic.chapterId]}
                                  </p>
                                  <h3 className="mt-1 text-headline-sm font-bold">{topic.name}</h3>
                                </div>
                                <StatusBadge tone="neutral">{topic.questions} lượt hỏi</StatusBadge>
                              </div>
                              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-body-sm">
                                <div className="rounded-lg bg-[#F8FAFC] p-2">
                                  <strong className="block">{topic.students}</strong>
                                  <span className="text-[#64748B]">Sinh viên</span>
                                </div>
                                <div className="rounded-lg bg-[#F8FAFC] p-2">
                                  <strong className="block">{topic.insufficient}</strong>
                                  <span className="text-[#64748B]">Từ chối</span>
                                </div>
                                <div className="rounded-lg bg-[#F8FAFC] p-2">
                                  <strong className="block">
                                    {
                                      topic.materialIds.filter((id) => approvedMaterials.some((item) => item.id === id))
                                        .length
                                    }
                                  </strong>
                                  <span className="text-[#64748B]">Học liệu</span>
                                </div>
                              </div>
                              <Button variant="secondary" className="mt-4" onClick={() => setSelectedTopic(topic)}>
                                Xem chi tiết
                              </Button>
                            </Card>
                          ))}
                        </div>
                      </div>
                      <Card className="p-5">
                        <SectionHeader title="Thống kê phản hồi trợ giảng AI" />
                        <div className="mt-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
                          {[
                            ['Tổng phản hồi', stats.totalResponses],
                            ['Có dẫn nguồn', stats.cited],
                            ['Từ chối thiếu căn cứ', stats.insufficient],
                            ['Lỗi hệ thống', filtered.reduce((sum, item) => sum + item.errorCount, 0)],
                            ['Đánh giá hữu ích', 'Chưa thu thập'],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-xl bg-[#F8FAFC] p-4">
                              <span className="text-body-sm text-[#64748B]">{label}</span>
                              <strong className="mt-1 block text-headline-sm">{value}</strong>
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-body-sm text-[#64748B]">
                          Phản hồi có dẫn nguồn không đồng nghĩa với nội dung đã được xác minh là chính xác.
                        </p>
                      </Card>
                    </div>
                  );
                if (tab === 'INSUFFICIENT')
                  return (
                    <div className="space-y-4 pt-5">
                      {insufficientTopics.map((topic) => (
                        <Card key={topic.id} className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-label-md font-bold text-primary">
                                {questionChapterLabels[topic.chapterId]}
                              </p>
                              <h3 className="mt-1 text-headline-sm font-bold">{topic.name}</h3>
                            </div>
                            <StatusBadge tone="warning">{topic.insufficient} lượt từ chối</StatusBadge>
                          </div>
                          <p className="mt-3 text-body-md text-[#64748B]">
                            {aiInsufficientEvidenceReasons[topic.id] ?? aiInsufficientEvidenceReasons.DEFAULT}
                          </p>
                          <p className="mt-2 text-body-sm text-[#64748B]">
                            Số liệu là tín hiệu để giảng viên xem xét, không tự động kết luận học liệu đang thiếu hoặc
                            sai.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={() => setSelectedTopic(topic)}>
                              Xem học liệu liên quan
                            </Button>
                            <Button
                              onClick={() => {
                                const suggestion = suggestions.find((item) => item.topicId === topic.id);
                                if (suggestion) updateSuggestion(suggestion.id, 'REVIEWING');
                                else setFeedback('Đã ghi nhận đề xuất xem xét bổ sung học liệu trong phiên demo.');
                              }}
                            >
                              Đề xuất bổ sung học liệu
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  );
                if (tab === 'SUGGESTIONS')
                  return (
                    <div className="space-y-4 pt-5">
                      {suggestions.map((suggestion) => {
                        const topic =
                          topics.find((item) => item.id === suggestion.topicId) ??
                          aiInsightTopics.find((item) => item.id === suggestion.topicId);
                        const meta = suggestionStatusMeta[suggestion.status];
                        return (
                          <Card key={suggestion.id} className="p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-label-md font-bold text-primary">
                                  {questionChapterLabels[topic.chapterId]}
                                </p>
                                <h3 className="mt-1 text-headline-sm font-bold">{topic.name}</h3>
                              </div>
                              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                            </div>
                            <p className="mt-3 text-body-md text-[#64748B]">{suggestion.reason}</p>
                            <p className="mt-2 text-body-sm">
                              <strong>Số liệu hỗ trợ:</strong> {topic.questions ?? 0} lượt hỏi ·{' '}
                              {topic.insufficient ?? 0} lượt từ chối ·{' '}
                              {
                                topic.materialIds.filter((id) => approvedMaterials.some((item) => item.id === id))
                                  .length
                              }{' '}
                              học liệu đã phê duyệt.
                            </p>
                            <div className="mt-4">
                              <MaterialsList
                                ids={topic.materialIds.filter((id) => approvedMaterials.some((item) => item.id === id))}
                              />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button variant="secondary" onClick={() => setSelectedTopic(topic)}>
                                Xem chi tiết
                              </Button>
                              {suggestion.status !== 'REVIEWING' && (
                                <Button
                                  variant="secondary"
                                  onClick={() => updateSuggestion(suggestion.id, 'REVIEWING')}
                                >
                                  Đánh dấu đang xem xét
                                </Button>
                              )}
                              {suggestion.status !== 'RESOLVED' && (
                                <Button onClick={() => updateSuggestion(suggestion.id, 'RESOLVED')}>Đã xử lý</Button>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  );
                return (
                  <div className="pt-5">
                    <DataTable
                      columns={['Ngày', 'Lớp', 'Chương', 'Chủ đề', 'Lượt hỏi', 'Có nguồn', 'Từ chối']}
                      rows={filtered}
                      renderRow={(row) => {
                        const topic = aiInsightTopics.find((item) => item.id === row.topicId);
                        return (
                          <tr className="border-t border-[#E2E8F0]">
                            <td className="px-3 py-3 whitespace-nowrap">{formatDate(row.date)}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{row.classId}</td>
                            <td className="min-w-[200px] px-3 py-3">{questionChapterLabels[row.chapterId]}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{topic?.name}</td>
                            <td className="px-3 py-3">{row.questionCount}</td>
                            <td className="px-3 py-3">{row.citedResponseCount}</td>
                            <td className="px-3 py-3">{row.insufficientEvidenceCount}</td>
                          </tr>
                        );
                      }}
                    />
                  </div>
                );
              }}
            </Tabs>
          </Card>
        </>
      )}
      {selectedTopic && (
        <TopicDetail
          topic={selectedTopic}
          approvedMaterials={approvedMaterials}
          onClose={() => setSelectedTopic(null)}
        />
      )}
    </LecturerPageShell>
  );
}
