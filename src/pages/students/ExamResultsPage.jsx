import React from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { DonutChart } from '../../components/DataCharts.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { results } from '../../data/lmsData.js';

const answerRows = [
  { q: '01', topic: 'Định luật II Newton', answer: 'Đúng', score: '0.5/0.5' },
  { q: '02', topic: 'Lực ma sát', answer: 'Đúng', score: '0.5/0.5' },
  { q: '03', topic: 'Chuyển động tròn', answer: 'Sai', score: '0/0.5' },
  { q: '04', topic: 'Công và năng lượng', answer: 'Đúng', score: '0.5/0.5' },
  { q: '05', topic: 'Bảo toàn động lượng', answer: 'Đúng', score: '0.5/0.5' },
];

export function ExamResultsPage() {
  return (
    <AppShell
      currentPage="exam_session.html"
      title="Kết quả bài thi · PTIT Physics 1"
      breadcrumbs={['Kiểm tra']}
      current="Kết quả bài thi"
    >
      <PageContainer>
        <PageTitle
          eyebrow="BÀI KIỂM TRA CHƯƠNG 2"
          title="Kết quả & phân tích bài làm"
          description="Bạn đã hoàn thành bài kiểm tra lúc 10:42 ngày 19/03/2025."
          actions={
            <>
              <Button variant="secondary" icon="download">
                Tải kết quả
              </Button>
              <Button icon="replay">Làm lại bài</Button>
            </>
          }
        />
        <Card className="p-6 bg-gradient-to-r from-[#FEF2F2] to-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div>
              <span className="text-body-sm text-[#64748B]">Điểm tổng kết</span>
              <div className="flex items-baseline gap-2 mt-1">
                <strong className="text-[56px] leading-none text-primary">8.5</strong>
                <span className="text-headline-sm text-[#64748B]">/ 10</span>
              </div>
              <StatusBadge tone="success" className="mt-4">
                Tốt hơn 78% sinh viên
              </StatusBadge>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {results.map((item) => (
                <div key={item.label} className="p-4 bg-white rounded-xl border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-primary">{item.icon}</span>
                  <span className="block text-body-sm text-[#64748B] mt-2">{item.label}</span>
                  <strong className="text-headline-sm block mt-1">
                    {item.value}
                    <small className="text-body-sm font-normal text-[#64748B]">{item.unit}</small>
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <MetricGrid
          items={[
            {
              label: 'Câu trả lời đúng',
              value: '17',
              detail: '/20 câu',
              icon: 'check_circle',
              tone: 'success',
              sideChart: <DonutChart value={(17 / 20) * 100} label="Tỷ lệ trả lời đúng" compact />,
            },
            {
              label: 'Thời gian làm bài',
              value: '38',
              detail: '/45 phút',
              icon: 'timer',
              tone: 'primary',
              sideChart: <DonutChart value={(38 / 45) * 100} label="Thời gian đã sử dụng" color="#0284c7" compact />,
            },
            {
              label: 'Câu cần xem lại',
              value: '3',
              detail: '/20 câu',
              icon: 'flag',
              tone: 'warning',
              sideChart: <DonutChart value={(3 / 20) * 100} label="Tỷ lệ câu cần xem lại" color="#b45309" compact />,
            },
            { label: 'Điểm quy đổi', value: 'B+', detail: 'xếp loại', icon: 'military_tech', tone: 'warning' },
          ]}
        />
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-headline-md font-bold">Chi tiết câu trả lời</h2>
            <StatusBadge tone="neutral">20 câu hỏi</StatusBadge>
          </div>
          <DataTable
            columns={['Câu', 'Chủ đề', 'Kết quả', 'Điểm']}
            rows={answerRows}
            renderRow={(row) => (
              <tr className="border-t border-[#E2E8F0]" key={row.q}>
                <td className="px-4 py-3 font-mono">{row.q}</td>
                <td className="px-4 py-3">{row.topic}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={row.answer === 'Đúng' ? 'success' : 'primary'}>{row.answer}</StatusBadge>
                </td>
                <td className="px-4 py-3 font-semibold">{row.score}</td>
              </tr>
            )}
          />
        </Card>
      </PageContainer>
    </AppShell>
  );
}
