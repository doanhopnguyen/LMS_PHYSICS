import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { PaginatedCollection } from '../../components/Pagination.jsx';
import { api } from '../../lib/apiClient.js';

const meta = {
  EXPERIMENT: ['Minh chứng thí nghiệm', 'success'],
  EXAM: ['Minh chứng bài thi', 'warning'],
  AI_CONVERSATION: ['Hoạt động AI', 'neutral'],
};
const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const dateText = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

export function StudentEvidencePage() {
  const [items, setItems] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingId, setOpeningId] = useState('');
  const [fileError, setFileError] = useState('');
  const reload = async () => {
    setLoading(true);
    setError('');
    setFileError('');
    try {
      const [evidence, logs, assignments, conversations] = await Promise.all([
        api.students.myEvidence(),
        api.students.myActivityLogs().catch(() => []),
        api.students.myExperimentAssignments().catch(() => []),
        api.aiTutor.myConversations().catch(() => []),
      ]);
      const evidenceRows = rowsOf(evidence);
      const experimentNames = new Map();
      rowsOf(assignments).forEach((item) => {
        const name = item.experimentTitle || 'Bài thí nghiệm';
        if (item.submissionId) experimentNames.set(String(item.submissionId), name);
        if (item.assignmentId) experimentNames.set(String(item.assignmentId), name);
      });
      const aiNames = new Map(
        rowsOf(conversations).map((item) => [
          String(item.conversationId),
          `Trao đổi AI${item.mode ? ` · ${item.mode}` : ''}`,
        ])
      );
      const examNames = new Map(
        await Promise.all(
          evidenceRows
            .filter((item) => item.sourceType === 'EXAM' && item.sourceId)
            .map(async (item) => {
              const attempt = await api.exams.getAttempt(item.sourceId).catch(() => null);
              return [String(item.sourceId), attempt?.examTitle || 'Bài thi đã nộp'];
            })
        )
      );
      setItems(
        evidenceRows.map((item) => ({
          ...item,
          sourceName:
            item.sourceType === 'EXPERIMENT'
              ? experimentNames.get(String(item.sourceId)) || 'Bài thí nghiệm'
              : item.sourceType === 'EXAM'
                ? examNames.get(String(item.sourceId)) || 'Bài thi đã nộp'
                : item.sourceType === 'AI_CONVERSATION'
                  ? aiNames.get(String(item.sourceId)) || 'Trao đổi với trợ giảng AI'
                  : 'Nguồn minh chứng',
        }))
      );
      setActivity(rowsOf(logs));
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải minh chứng.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    reload();
  }, []);
  const openEvidence = async (item) => {
    setFileError('');
    if (!item.fileId) {
      if (item.fileUrl) window.open(item.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setOpeningId(item.evidenceId);
    try {
      const response = await api.files.downloadUrl(item.fileId);
      const url = response?.downloadUrl || response?.url;
      if (!url) throw new Error('Không nhận được liên kết tải tệp từ hệ thống.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (requestError) {
      setFileError(requestError?.message || 'Không thể mở tệp minh chứng.');
    } finally {
      setOpeningId('');
    }
  };
  return (
    <AppShell
      currentPage="student_evidence.html"
      title="Minh chứng thí nghiệm · PTIT Physics 1"
      filterActions={
        <>
          <Button variant="secondary" icon="refresh" onClick={reload} disabled={loading}>
            Tải lại
          </Button>
          <a href="virtual_lab.html">
            <Button icon="science">Mở danh sách lab</Button>
          </a>
        </>
      }
    >
      <PageContainer>
        <PageTitle
          eyebrow="KHO MINH CHỨNG CÁ NHÂN"
          title="Báo cáo và minh chứng thí nghiệm"
          description="Theo dõi tệp số liệu, ảnh, đồ thị, trạng thái chấm và hoạt động học tập của bạn."
        />
        {loading && <p className="py-10 text-center text-body-md text-[#64748B]">Đang tải minh chứng…</p>}
        {error && (
          <p role="alert" className="py-10 text-center text-body-md text-primary">
            {error}
          </p>
        )}
        {!loading && !error && (
          <>
            {fileError && (
              <p role="alert" className="mt-4 text-body-sm text-primary">
                {fileError}
              </p>
            )}
            <Card className="mt-6 p-5">
              <SectionHeader icon="folder_open" title="Danh sách minh chứng" className="mb-5" />
              <PaginatedCollection items={items} pageSize={10}>
                {(pageItems) => (
                  <DataTable
                    paginate={false}
                    columns={['Nguồn minh chứng', 'Thời điểm tạo', 'Tệp', 'Trạng thái']}
                    rows={pageItems}
                    renderRow={(item) => {
                      const [label, tone] = meta[item.sourceType] || ['Minh chứng', 'neutral'];
                      return (
                        <tr key={item.evidenceId} className="border-t border-[#E2E8F0]">
                          <td className="px-3 py-3">
                            <strong>{item.sourceName}</strong>
                            <span className="mt-1 block text-xs text-[#64748B]">{label}</span>
                          </td>
                          <td className="px-3 py-3 text-[#64748B]">{dateText(item.createdAt)}</td>
                          <td className="px-3 py-3">
                            {item.fileId || item.fileUrl ? (
                              <Button
                                variant="secondary"
                                disabled={openingId === item.evidenceId}
                                onClick={() => openEvidence(item)}
                              >
                                {openingId === item.evidenceId ? 'Đang mở…' : 'Mở tệp'}
                              </Button>
                            ) : (
                              'Không có tệp'
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge tone={tone}>{label}</StatusBadge>
                          </td>
                        </tr>
                      );
                    }}
                  />
                )}
              </PaginatedCollection>
              {items.length === 0 && <p className="py-8 text-center text-[#64748B]">Chưa có minh chứng nào.</p>}
            </Card>
            <Card className="mt-6 p-5">
              <SectionHeader icon="history" title="Nhật ký hoạt động học tập" className="mb-2" />
              <p className="text-body-sm text-[#64748B]">Các hoạt động gần đây do hệ thống ghi nhận.</p>
              <PaginatedCollection items={activity} pageSize={8}>
                {(pageItems) => (
                  <DataTable
                    paginate={false}
                    columns={['Hoạt động', 'Đối tượng', 'Thời điểm']}
                    rows={pageItems}
                    renderRow={(item, index) => (
                      <tr
                        key={item.activityLogId || item.logId || `${item.createdAt}-${index}`}
                        className="border-t border-[#E2E8F0]"
                      >
                        <td className="px-3 py-3 font-medium">
                          {item.actionType || item.action || 'Hoạt động học tập'}
                        </td>
                        <td className="px-3 py-3 text-[#64748B]">{item.objectType || item.entityType || '—'}</td>
                        <td className="px-3 py-3 text-[#64748B]">{dateText(item.createdAt)}</td>
                      </tr>
                    )}
                  />
                )}
              </PaginatedCollection>
              {!activity.length && (
                <p className="py-6 text-center text-[#64748B]">Chưa có hoạt động nào được ghi nhận.</p>
              )}
            </Card>
          </>
        )}
      </PageContainer>
    </AppShell>
  );
}
