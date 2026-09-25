import { Form, SubmitButton } from '../../components/Form.jsx';
import React, { useMemo, useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { api } from '../../lib/apiClient.js';
import { listItems, useApiData } from '../../hooks/useApiData.js';

const analyticsTabs = [
  { id: 'difficulty', label: 'Độ khó chủ đề', endpoint: 'topic-difficulty' },
  { id: 'questions', label: 'Chất lượng câu hỏi', endpoint: 'question-quality' },
  { id: 'materials', label: 'Hiệu quả học liệu', endpoint: 'material-effectiveness' },
  { id: 'ai', label: 'Lỗ hổng AI Tutor', endpoint: 'ai-gaps' },
];

function percent(value) { return typeof value === 'number' ? `${Math.round(value * 100)}%` : '—'; }

export function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('difficulty');
  const [filters, setFilters] = useState({ subjectId: '', classId: '', topicId: '', period: '', minUsed: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const current = analyticsTabs.find((tab) => tab.id === activeTab) || analyticsTabs[0];
  const query = useMemo(() => {
    const params = new URLSearchParams();
    const allowed = activeTab === 'difficulty' ? ['subjectId', 'classId', 'period'] : activeTab === 'questions' ? ['subjectId', 'topicId', 'minUsed'] : activeTab === 'materials' ? ['subjectId', 'topicId', 'period'] : ['subjectId', 'period'];
    allowed.forEach((key) => { if (appliedFilters[key]) params.set(key, appliedFilters[key]); });
    return params.toString();
  }, [activeTab, appliedFilters]);
  const resource = useApiData(`/api/v1/analytics/${current.endpoint}${query ? `?${query}` : ''}`);
  const rows = listItems(resource.data);
  const applyFilters = (event) => { event.preventDefault(); setAppliedFilters(filters); };
  async function regenerate() {
    setBusy(true); setMessage(''); setError('');
    try { await api.analytics.triggerAggregation(); setMessage('Đã gửi yêu cầu tổng hợp lại số liệu.'); }
    catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }
  const filterField = (label, name, placeholder) => <label className="text-body-sm" key={name}>{label}<input value={filters[name]} onChange={(event) => setFilters((currentFilters) => ({ ...currentFilters, [name]: event.target.value }))} placeholder={placeholder} className="mt-1 block w-full rounded-xl border p-2" /></label>;
  const table = activeTab === 'difficulty' ? <DataTable columns={['Chủ đề', 'Điểm TB', 'Tỷ lệ lỗi', 'Kỳ dữ liệu']} rows={rows} renderRow={(row) => <tr className="border-t" key={row.statId}><td className="p-3 font-medium">{row.topicName || row.topicId}</td><td className="p-3">{row.avgScore ?? '—'}</td><td className="p-3">{percent(row.errorRate)}</td><td className="p-3">{row.period || '—'}</td></tr>} /> : activeTab === 'questions' ? <DataTable columns={['Câu hỏi', 'Chủ đề', 'Lần dùng', 'Tỷ lệ đúng', 'DI', 'Chất lượng']} rows={rows} renderRow={(row) => <tr className="border-t" key={row.questionId}><td className="p-3">{row.questionText || row.questionId}</td><td className="p-3">{row.topicName || '—'}</td><td className="p-3">{row.timesUsed ?? 0}</td><td className="p-3">{percent(row.correctRate)}</td><td className="p-3">{row.discriminationIndex ?? '—'}</td><td className="p-3">{row.qualityLabel || '—'}</td></tr>} /> : activeTab === 'materials' ? <DataTable columns={['Học liệu', 'Chủ đề', 'Lượt xem', 'TG đọc TB', 'Cải thiện điểm']} rows={rows} renderRow={(row) => <tr className="border-t" key={row.materialId}><td className="p-3 font-medium">{row.title || row.materialId}</td><td className="p-3">{row.topicName || '—'}</td><td className="p-3">{row.viewCount ?? 0}</td><td className="p-3">{row.avgTimeSpentSeconds ? `${row.avgTimeSpentSeconds}s` : '—'}</td><td className="p-3">{percent(row.correlatedScoreImprovement)}</td></tr>} /> : <DataTable columns={['Chủ đề', 'Lần AI từ chối', 'Câu hỏi thường gặp', 'Kỳ dữ liệu']} rows={rows} renderRow={(row) => <tr className="border-t" key={row.gapId}><td className="p-3 font-medium">{row.topicName || row.topicId}</td><td className="p-3">{row.refusalCount ?? 0}</td><td className="p-3">{row.frequentQuerySample || '—'}</td><td className="p-3">{row.period || '—'}</td></tr>} />;

  return <AdminPageShell currentPage="admin_analytics.html" title="Phân tích học tập" description="Theo dõi chất lượng câu hỏi, học liệu, độ khó chủ đề và lỗ hổng AI từ dữ liệu tổng hợp.">
    <AuthAlert>{message}</AuthAlert><AuthAlert error>{error}</AuthAlert>
    <Card className="mt-6 p-5"><Tabs items={analyticsTabs} activeId={activeTab} onChange={setActiveTab} actions={<Button icon="refresh" disabled={busy} onClick={regenerate}>{busy ? 'Đang tổng hợp…' : 'Tổng hợp lại dữ liệu'}</Button>}>{() => <><Form className="mt-5 grid gap-3 md:grid-cols-4" onSubmit={applyFilters}>{filterField('Mã học phần', 'subjectId', 'UUID học phần')}{activeTab === 'difficulty' && filterField('Mã lớp', 'classId', 'UUID lớp')}{['questions', 'materials'].includes(activeTab) && filterField('Mã chủ đề', 'topicId', 'UUID chủ đề')}{['difficulty', 'materials', 'ai'].includes(activeTab) && filterField('Kỳ dữ liệu', 'period', 'VD: 2026-1')}{activeTab === 'questions' && filterField('Số lần dùng tối thiểu', 'minUsed', 'VD: 10')}<div className="flex items-end"><SubmitButton type="submit" variant="secondary">Áp dụng lọc</SubmitButton></div></Form><div className="mt-5 overflow-x-auto">{resource.loading ? <p role="status">Đang tải dữ liệu phân tích…</p> : resource.error ? <p role="alert">{resource.error} <Button onClick={resource.reload}>Thử lại</Button></p> : rows.length ? table : <p className="p-3 text-[#64748B]">Chưa có dữ liệu phân tích phù hợp.</p>}</div></>}</Tabs></Card>
  </AdminPageShell>;
}
