import React from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { modules } from '../../data/lmsData.js';

export function CourseDetailPage() {
  return (
    <AppShell
      currentPage="course_detail.html"
      title="Chi tiết học phần · PTIT Physics 1"
      breadcrumbs={['Học phần của tôi']}
      current="Chi tiết học phần"
    >
      <PageContainer>
        <PageTitle
          eyebrow="BAS1201 · D23CQCN01-B"
          title="Vật lý đại cương 1"
          description="Học phần nền tảng về cơ học, dao động, sóng và các định luật bảo toàn trong chương trình PTIT."
          actions={
            <>
              <a href="interactive_lesson.html">
                <Button icon="play_arrow">Tiếp tục học</Button>
              </a>
              <Button variant="secondary" icon="download">
                Tải đề cương
              </Button>
            </>
          }
        />
        <Card className="bg-gradient-to-r from-[#FEF2F2] to-white p-5">
          <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <StatusBadge tone="primary">ĐANG HỌC</StatusBadge>
                <span className="text-body-sm text-[#64748B]">Cập nhật hôm nay lúc 09:30</span>
              </div>
              <h2 className="text-headline-md font-bold">Chương 2: Động lực học chất điểm</h2>
              <p className="mt-1 text-body-md text-[#64748B]">
                Bài 4: Các định luật Newton và ứng dụng trong cơ học kỹ thuật
              </p>
              <ProgressBar value={75} label="Tiến độ học phần" className="mt-4 max-w-xl text-[#64748B]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Card as="div" className="p-3">
                <span className="text-body-sm text-[#64748B]">Điểm hiện tại</span>
                <strong className="mt-1 block text-headline-md">
                  8.5<span className="text-body-sm font-normal">/10</span>
                </strong>
              </Card>
              <Card as="div" className="p-3">
                <span className="text-body-sm text-[#64748B]">Thời lượng</span>
                <strong className="mt-1 block text-headline-md">3 tín chỉ</strong>
              </Card>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <Card className="p-5 lg:col-span-8">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h2 className="text-headline-md font-bold">Mục lục học phần</h2>
              <span className="text-body-sm text-[#64748B]">4 chương · 24 bài học</span>
            </div>
            <div className="mt-4 space-y-2">
              {modules.map((module) => (
                <Card as="a"
                  key={module.number}
                  href={`learning_module.html?module=${module.number}`}
                  className="group flex items-center gap-3 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] font-bold text-primary">
                    {module.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-headline-sm font-bold group-hover:text-primary">{module.title}</h3>
                        <span className="text-body-sm text-[#64748B]">{module.lessons} bài học</span>
                      </div>
                      <StatusBadge tone={module.progress === 100 ? 'success' : module.progress ? 'primary' : 'neutral'}>
                        {module.status}
                      </StatusBadge>
                    </div>
                    <ProgressBar value={module.progress} className="mt-2" />
                  </div>
                  <span className="material-symbols-outlined text-[#94A3B8] transition-transform group-hover:translate-x-1 group-hover:text-primary">
                    arrow_forward
                  </span>
                </Card>
              ))}
            </div>
          </Card>
          <div className="space-y-5 lg:col-span-4">
            <Card className="p-5">
              <h2 className="mb-3 text-headline-sm font-bold">Công thức trọng tâm</h2>
              <Card as="div" className="border-[#FECACA] bg-[#FEF2F2] p-4 text-center font-mono text-lg text-primary">
                F = m · a
              </Card>
              <p className="mt-3 text-body-sm text-[#64748B]">Mở sổ tay công thức theo từng chương để ôn tập nhanh.</p>
              <a
                href="document_viewer.html"
                className="mt-3 inline-flex items-center gap-1 text-body-sm font-semibold text-primary"
              >
                Mở sổ tay <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </Card>
            <Card className="p-5">
              <h2 className="mb-3 text-headline-sm font-bold">Lịch học sắp tới</h2>
              <div className="space-y-2">
                <Card as="div" className="flex gap-3 bg-[#FEF2F2] p-3">
                  <span className="text-center font-bold text-primary">
                    24
                    <br />
                    <small className="font-normal">THÁNG 3</small>
                  </span>
                  <div>
                    <strong className="text-body-md">Động lực học chất điểm</strong>
                    <p className="text-body-sm text-[#64748B]">09:30 · Phòng A2-304</p>
                  </div>
                </Card>
                <Card as="div" className="flex gap-3 bg-[#FFFBEB] p-3">
                  <span className="text-center font-bold text-[#B45309]">
                    26
                    <br />
                    <small className="font-normal">THÁNG 3</small>
                  </span>
                  <div>
                    <strong className="text-body-md">Thực hành Lab 3D</strong>
                    <p className="text-body-sm text-[#64748B]">14:00 · Phòng máy 4</p>
                  </div>
                </Card>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
