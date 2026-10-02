import { SelectField as SharedSelectField } from '../../components/SelectField.jsx';
import React from 'react';
import { Card } from '../../components/Card.jsx';
import { DonutChart, LineChart, ProgressFillList } from '../../components/DataCharts.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { weeklyEngagement } from '../../data/lecturerData.js';

export function LecturerAnalyticsPage() {
  return (
    <LecturerPageShell
      currentPage="lecturer_analytics.html"
      title="Phân tích học tập"
      eyebrow="DỮ LIỆU LỚP HỌC"
      description="Phân tích mức độ tham gia, kết quả và tiến độ để điều chỉnh hoạt động giảng dạy."
      actions={
        <SharedSelectField label={<>Lớp học</>} className="text-body-sm font-semibold">
          <option>D23CQCN01-B</option>
          <option>D23CQCN02-B</option>
        </SharedSelectField>
      }
    >
      <MetricGrid
        items={[
          {
            label: 'Điểm trung bình',
            value: '7.8',
            detail: '/10',
            icon: 'leaderboard',
            sideChart: <DonutChart value={78} compact label="Điểm trung bình" />,
          },
          {
            label: 'Tỷ lệ hoàn thành',
            value: '68',
            detail: '%',
            icon: 'task_alt',
            sideChart: <DonutChart value={68} compact label="Tỷ lệ hoàn thành" />,
          },
          {
            label: 'Mức độ tham gia',
            value: '84',
            detail: '%',
            icon: 'groups',
            sideChart: <DonutChart value={84} compact label="Mức độ tham gia" />,
          },
          { label: 'Sinh viên cần hỗ trợ', value: '8', detail: '/42', icon: 'support_agent', tone: 'warning' },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-headline-md font-bold">Mức độ tham gia theo tuần</h2>
            <span className="text-body-sm text-[#64748B]">8 tuần gần nhất</span>
          </div>
          <div className="mt-5">
            <LineChart
              values={weeklyEngagement}
              labels={weeklyEngagement.map((_, index) => `T${index + 1}`)}
              label="Mức độ tham gia theo tuần"
              color="#e52220"
            />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-headline-md font-bold">Tiến độ theo chương</h2>
          <div className="mt-6">
            <ProgressFillList
              items={[
                { label: 'Động học chất điểm', value: 96 },
                { label: 'Động lực học chất điểm', value: 75 },
                { label: 'Công và năng lượng', value: 48 },
                { label: 'Dao động và sóng', value: 16 },
              ]}
            />
          </div>
        </Card>
      </div>
      <Card className="p-6">
        <h2 className="text-headline-md font-bold">Phân bố năng lực lớp</h2>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            ['Tốt', '14 sinh viên', 'success'],
            ['Đạt yêu cầu', '20 sinh viên', 'primary'],
            ['Cần hỗ trợ', '8 sinh viên', 'warning'],
          ].map(([label, value, tone]) => (
            <Card
              as="div"
              key={label}
              className={`border p-5 ${tone === 'success' ? 'border-[#86EFAC] bg-[#F0FDF4]' : tone === 'warning' ? 'border-[#FDE68A] bg-[#FFFBEB]' : 'border-[#FECACA] bg-[#FEF2F2]'}`}
            >
              <span className="text-body-sm text-[#64748B]">{label}</span>
              <strong className="mt-1 block text-headline-md">{value}</strong>
            </Card>
          ))}
        </div>
      </Card>
    </LecturerPageShell>
  );
}
