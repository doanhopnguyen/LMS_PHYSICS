import React from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { CountDotsChart, DonutChart, MiniColumnChart } from '../../components/DataCharts.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { exams } from '../../data/lmsData.js';

export function ExamPracticePage() {
  return (
    <AppShell
      currentPage="exam_practice_center.html"
      title="Trung tâm ôn luyện · PTIT Physics 1"
      breadcrumbs={['Ôn luyện']}
      current="Trung tâm ôn luyện"
    >
      <PageContainer>
        <PageTitle
          eyebrow="LUYỆN TẬP CÁ NHÂN"
          title="Trung tâm ôn luyện"
          description="Chọn bộ đề theo chương hoặc tạo một phiên luyện tập thích ứng với năng lực của bạn."
          actions={<Button icon="tune">Tùy chỉnh bộ đề</Button>}
        />
        <MetricGrid
          items={[
            {
              label: 'Bộ đề đã làm',
              value: '45',
              detail: 'bộ đề',
              icon: 'quiz',
              tone: 'warning',
              chart: <CountDotsChart value={45} unit="bộ đề" groupSize={5} />,
            },
            {
              label: 'Điểm trung bình',
              value: '8.4',
              detail: '/10',
              icon: 'emoji_events',
              tone: 'primary',
              sideChart: <MiniColumnChart values={[8.4]} label="Điểm trung bình: 8.4 trên 10" compact />,
            },
            {
              label: 'Độ chính xác',
              value: '84.5',
              detail: '%',
              icon: 'target',
              tone: 'success',
              sideChart: <DonutChart value={84.5} label="Độ chính xác" compact />,
            },
            {
              label: 'Chuỗi luyện tập',
              value: '5',
              detail: 'ngày',
              icon: 'local_fire_department',
              tone: 'warning',
              chart: <CountDotsChart value={5} unit="ngày liên tiếp" color="#b45309" />,
            },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <Card key={exam.title} className="p-6 flex flex-col">
              <div className="flex items-center justify-between">
                <StatusBadge tone={exam.completed ? 'success' : 'neutral'}>
                  {exam.completed ? 'Đã hoàn thành' : 'Sẵn sàng'}
                </StatusBadge>
                <span className="material-symbols-outlined text-[#94A3B8]">more_horiz</span>
              </div>
              <h2 className="text-headline-sm font-bold mt-5">{exam.title}</h2>
              <div className="grid grid-cols-2 gap-3 mt-5 text-body-sm text-[#64748B]">
                <span>
                  <span className="material-symbols-outlined text-sm mr-1">quiz</span>
                  {exam.questions} câu hỏi
                </span>
                <span>
                  <span className="material-symbols-outlined text-sm mr-1">schedule</span>
                  {exam.duration}
                </span>
                <span>
                  <span className="material-symbols-outlined text-sm mr-1">signal_cellular_alt</span>
                  {exam.difficulty}
                </span>
                <span>
                  <span className="material-symbols-outlined text-sm mr-1">grade</span>
                  {exam.score}
                </span>
              </div>
              <Button
                className="w-full mt-6"
                variant={exam.completed ? 'secondary' : 'primary'}
                icon={exam.completed ? 'replay' : 'play_arrow'}
              >
                {exam.completed ? 'Làm lại bộ đề' : 'Bắt đầu luyện tập'}
              </Button>
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-headline-md font-bold">Luyện tập theo chương</h2>
              <p className="text-body-sm text-[#64748B] mt-1">Tiến độ hoàn thành các nhóm kiến thức trong học phần.</p>
            </div>
            <a href="course_detail.html" className="text-body-sm text-primary font-semibold">
              Xem học phần
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {['Động học chất điểm', 'Động lực học chất điểm', 'Công và năng lượng'].map((chapter, index) => (
              <div key={chapter} className="p-4 rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <strong>{chapter}</strong>
                  <span className="text-body-sm text-primary">{[100, 68, 32][index]}%</span>
                </div>
                <ProgressBar value={[100, 68, 32][index]} className="mt-3" />
              </div>
            ))}
          </div>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
