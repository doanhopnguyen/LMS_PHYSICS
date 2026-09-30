import React, { useMemo, useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { api } from '../../lib/apiClient.js';
import { listItems, useApiData } from '../../hooks/useApiData.js';

const analyticsTabs = [
  { id: 'difficulty', label: 'Độ khó chủ đề', endpoint: 'topic-difficulty' },
  { id: 'questions', label: 'Chất lượng câu hỏi', endpoint: 'question-quality' },
  { id: 'materials', label: 'Hiệu quả học liệu', endpoint: 'material-effectiveness' },
  { id: 'ai', label: 'Lỗ hổng AI', endpoint: 'ai-gaps' },
];
const percent = (value) => (typeof value === 'number' ? `${Math.round(value * 100)}%` : '—');

export function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('difficulty');
  const [filters, setFilters] = useState({ subjectId: '', classId: '', topicId: '', period: '', minUsed: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const current = analyticsTabs.find((tab) => tab.id === activeTab) || analyticsTabs[0];
  const subjects = useApiData('/api/v1/subjects?isActive=true&page=0&size=100');
  const classes = useApiData('/api/v1/classes?page=0&size=100');
  const topics = useApiData(
    filters.subjectId ? `/api/v1/subjects/${encodeURIComponent(filters.subjectId)}/topics` : null
  );
  const query = useMemo(() => {
    const params = new URLSearchParams();
    const allowed =
      activeTab === 'difficulty'
        ? ['subjectId', 'classId', 'period']
        : activeTab === 'questions'
          ? ['subjectId', 'topicId', 'minUsed']
          : activeTab === 'materials'
            ? ['subjectId', 'topicId', 'period']
            : ['subjectId', 'period'];
    allowed.forEach((key) => {
      if (appliedFilters[key]) params.set(key, appliedFilters[key]);
    });
    return params.toString();
  }, [activeTab, appliedFilters]);
  const resource = useApiData(`/api/v1/analytics/${current.endpoint}${query ? `?${query}` : ''}`);
  const rows = listItems(resource.data);
  const setFilter = (name, value) =>
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
      ...(name === 'subjectId' ? { topicId: '' } : {}),
    }));
  async function regenerate() {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await api.analytics.triggerAggregation();
      resource.reload();
      setMessage('Đã gửi yêu cầu tổng hợp lại số liệu.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  const select = (label, name, options, disabled = false, required = false) => (
    <label className="text-body-sm">
      {label}
      <select
        required={required}
        value={filters[name]}
        disabled={disabled}
        onChange={(event) => setFilter(name, event.target.value)}
        className="mt-1 block w-full rounded-xl border p-2"
      >
        <option value="">
          {name === 'topicId' && !filters.subjectId ? 'Chọn học phần trước' : `Tất cả ${label.toLowerCase()}`}
        </option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
  const subjectOptions = listItems(subjects.data).map((item) => ({
    id: item.subjectId,
    label: `${item.subjectCode ? `${item.subjectCode} · ` : ''}${item.subjectName}`,
  }));
  const classOptions = listItems(classes.data).map((item) => ({
    id: item.classId,
    label: item.classCode || item.className || 'Lớp học',
  }));
  const topicOptions = listItems(topics.data).map((item) => ({ id: item.topicId, label: item.topicName }));
  const table =
    activeTab === 'difficulty' ? (
      <DataTable
        columns={['Chủ đề', 'Điểm TB', 'Tỷ lệ lỗi', 'Kỳ dữ liệu']}
        rows={rows}
        renderRow={(row) => (
          <tr className="border-t" key={row.statId}>
            <td className="p-3 font-medium">{row.topicName || '—'}</td>
            <td className="p-3">{row.avgScore ?? '—'}</td>
            <td className="p-3">{percent(row.errorRate)}</td>
            <td className="p-3">{row.period || '—'}</td>
          </tr>
        )}
      />
    ) : activeTab === 'questions' ? (
      <DataTable
        columns={['Câu hỏi', 'Chủ đề', 'Lần dùng', 'Tỷ lệ đúng', 'DI', 'Chất lượng']}
        rows={rows}
        renderRow={(row) => (
          <tr className="border-t" key={row.questionId}>
            <td className="p-3">{row.questionText || '—'}</td>
            <td className="p-3">{row.topicName || '—'}</td>
            <td className="p-3">{row.timesUsed ?? 0}</td>
            <td className="p-3">{percent(row.correctRate)}</td>
            <td className="p-3">{row.discriminationIndex ?? '—'}</td>
            <td className="p-3">{row.qualityLabel || '—'}</td>
          </tr>
        )}
      />
    ) : activeTab === 'materials' ? (
      <DataTable
        columns={['Học liệu', 'Chủ đề', 'Lượt xem', 'TG đọc TB', 'Cải thiện điểm']}
        rows={rows}
        renderRow={(row) => (
          <tr className="border-t" key={row.materialId}>
            <td className="p-3 font-medium">{row.title || '—'}</td>
            <td className="p-3">{row.topicName || '—'}</td>
            <td className="p-3">{row.viewCount ?? 0}</td>
            <td className="p-3">{row.avgTimeSpentSeconds ? `${row.avgTimeSpentSeconds}s` : '—'}</td>
            <td className="p-3">{percent(row.correlatedScoreImprovement)}</td>
          </tr>
        )}
      />
    ) : (
      <DataTable
        columns={['Chủ đề', 'Lần AI từ chối', 'Câu hỏi thường gặp', 'Kỳ dữ liệu']}
        rows={rows}
        renderRow={(row) => (
          <tr className="border-t" key={row.gapId}>
            <td className="p-3 font-medium">{row.topicName || '—'}</td>
            <td className="p-3">{row.refusalCount ?? 0}</td>
            <td className="p-3">{row.frequentQuerySample || '—'}</td>
            <td className="p-3">{row.period || '—'}</td>
          </tr>
        )}
      />
    );

  return (
    <AdminPageShell
      currentPage="admin_analytics.html"
      title="Phân tích học tập"
      description="Theo dõi chất lượng câu hỏi, học liệu, độ khó chủ đề và lỗ hổng AI từ dữ liệu tổng hợp."
    >
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      <Card className="mt-6 p-5">
        <Tabs
          items={analyticsTabs}
          activeId={activeTab}
          onChange={setActiveTab}
          actions={
            <Button icon="refresh" disabled={busy} onClick={regenerate}>
              {busy ? 'Đang tổng hợp…' : 'Tổng hợp lại dữ liệu'}
            </Button>
          }
        >
          {() => (
            <>
              <Form
                className="mt-5 grid gap-3 md:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setAppliedFilters(filters);
                }}
              >
                {select('Học phần', 'subjectId', subjectOptions, subjects.loading)}
                {activeTab === 'difficulty' && select('Lớp học', 'classId', classOptions, classes.loading)}
                {['questions', 'materials'].includes(activeTab) &&
                  select('Chủ đề', 'topicId', topicOptions, !filters.subjectId || topics.loading)}
                {['difficulty', 'materials', 'ai'].includes(activeTab) && (
                  <label className="text-body-sm">
                    Kỳ dữ liệu
                    <input
                      value={filters.period}
                      onChange={(event) => setFilter('period', event.target.value)}
                      placeholder="VD: 2026-1"
                      className="mt-1 block w-full rounded-xl border p-2"
                    />
                  </label>
                )}
                {activeTab === 'questions' && (
                  <label className="text-body-sm">
                    Số lần dùng tối thiểu
                    <input
                      type="number"
                      min="0"
                      value={filters.minUsed}
                      onChange={(event) => setFilter('minUsed', event.target.value)}
                      className="mt-1 block w-full rounded-xl border p-2"
                    />
                  </label>
                )}
                <div className="flex items-end">
                  <SubmitButton type="submit" variant="secondary">
                    Áp dụng lọc
                  </SubmitButton>
                </div>
              </Form>
              <div className="mt-5 overflow-x-auto">
                {resource.loading ? (
                  <p role="status">Đang tải dữ liệu phân tích…</p>
                ) : resource.error ? (
                  <p role="alert">
                    {resource.error} <Button onClick={resource.reload}>Thử lại</Button>
                  </p>
                ) : rows.length ? (
                  table
                ) : (
                  <p className="p-3 text-[#64748B]">Chưa có dữ liệu phân tích phù hợp.</p>
                )}
              </div>
            </>
          )}
        </Tabs>
      </Card>
    </AdminPageShell>
  );
}
