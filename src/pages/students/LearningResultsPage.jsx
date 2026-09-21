import React from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Card } from '../../components/Card.jsx';
import { DonutChart, LineChart, MiniColumnChart, ProgressFillList } from '../../components/DataCharts.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { results } from '../../data/lmsData.js';

const chapterProgress = [
  { label: 'Động học chất điểm', value: 100, tone: 'success' },
  { label: 'Động lực học chất điểm', value: 75, tone: 'primary' },
  { label: 'Công và năng lượng', value: 42, tone: 'warning' },
  { label: 'Dao động và sóng', value: 18, tone: 'neutral' },
];

const weeklyScores = [55, 68, 62, 76, 72, 84, 79, 88];

export function LearningResultsPage() {
  const metrics = results.map((item, index) => ({
    label: item.label,
    value: item.value,
    detail: item.unit,
    icon: item.icon,
    tone: item.tone === 'gold' ? 'warning' : item.tone === 'green' ? 'success' : item.tone,
    chart: null,
    sideChart:
      index === 0 ? (
        <MiniColumnChart values={[6.8, 7.2, 7.6, 7.9, 8.1, 8.5]} compact />
      ) : index === 1 ? (
        <DonutChart value={84.5} label="Độ chính xác" compact />
      ) : index === 2 ? (
        <DonutChart value={75} label="Bài đã hoàn thành" compact />
      ) : null,
  }));
  return (
    <AppShell
      currentPage="learning_results.html"
      title="Kết quả học tập · PTIT Physics 1"
      breadcrumbs={['Kết quả học tập']}
      current="Phân tích năng lực"
    >
      <PageContainer>
        <PageTitle
          eyebrow="DỮ LIỆU HỌC TẬP"
          title="Kết quả & phân tích năng lực"
          description="Theo dõi tiến bộ, điểm mạnh và các chủ đề cần cải thiện trong học kỳ này."
        />
        <MetricGrid items={metrics} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-md font-bold">Tiến độ theo chương</h2>
              <span className="text-body-sm text-[#64748B]">Học kỳ 1</span>
            </div>
            <div className="mt-6">
              <ProgressFillList items={chapterProgress} />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-md font-bold">Điểm theo tuần</h2>
              <select className="rounded-lg border border-[#CBD5E1] px-3 py-2 text-body-sm bg-white">
                <option>8 tuần gần nhất</option>
                <option>Cả học kỳ</option>
              </select>
            </div>
            <div className="mt-6">
              <LineChart values={weeklyScores} labels={weeklyScores.map((_, index) => `T${index + 1}`)} />
            </div>
          </Card>
        </div>
        <Card className="p-6">
          <h2 className="text-headline-md font-bold">Gợi ý cải thiện cá nhân</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {[
              [
                'priority_high',
                'Ôn lại lực ma sát',
                'Bạn sai 3/5 câu ở chủ đề này. Làm bộ luyện tập Chương 2.',
                'primary',
              ],
              ['auto_awesome', 'Phát huy điểm mạnh', 'Bạn có điểm cao ổn định ở chủ đề Động học.', 'success'],
              ['schedule', 'Duy trì nhịp học', 'Học 25 phút mỗi ngày để giữ chuỗi 5 ngày.', 'warning'],
            ].map(([icon, title, text, tone]) => (
              <div
                key={title}
                className={`p-4 rounded-xl border ${tone === 'primary' ? 'bg-[#FEF2F2] border-[#FECACA]' : tone === 'success' ? 'bg-[#F0FDF4] border-[#86EFAC]' : 'bg-[#FFFBEB] border-[#FDE68A]'}`}
              >
                <span className="material-symbols-outlined text-primary">{icon}</span>
                <h3 className="font-semibold mt-3">{title}</h3>
                <p className="text-body-sm text-[#64748B] mt-1">{text}</p>
              </div>
            ))}
          </div>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
