import React from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { labs } from '../../data/lmsData.js';

export function VirtualLabPage() {
  return (
    <AppShell
      currentPage="virtual_lab.html"
      title="Phòng thí nghiệm 3D · PTIT Physics 1"
      breadcrumbs={['Phòng thí nghiệm 3D']}
      current="Danh sách thí nghiệm"
    >
      <PageContainer>
        <PageTitle eyebrow="Phòng thí nghiệm 3D" actions={<a href="student_evidence.html"><Button icon="history">Minh chứng & báo cáo</Button></a>} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {labs.map((lab) => (
            <Card
              key={lab.title}
              progress={lab.progress}
              status={lab.status}
              className="overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all"
            >
              <div
                className={`h-36 bg-gradient-to-br ${lab.image === 'incline' ? 'from-[#E52220] to-[#F59E0B]' : lab.image === 'collision' ? 'from-[#1E3A8A] to-[#0F766E]' : lab.image === 'pendulum' ? 'from-[#334155] to-[#7C3AED]' : 'from-[#14532D] to-[#0F766E]'} flex items-center justify-center text-white`}
              >
                <span className="material-symbols-outlined text-6xl opacity-70">science</span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-label-md text-[#64748B]">{lab.code}</span>
                </div>
                <h2 className="text-headline-sm font-bold mt-3 min-h-[52px]">{lab.title}</h2>
                <div className="flex gap-2 mt-5">
                  <a href="3d_workspace.html" className="flex-1">
                    <Button className="w-full" icon={lab.progress ? 'play_arrow' : 'lock_open'}>
                      {lab.progress ? 'Tiếp tục' : 'Bắt đầu'}
                    </Button>
                  </a>
                  <a href="lab_report_rubric.html">
                    <button
                      className="h-10 w-10 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:text-primary hover:border-primary"
                      aria-label="Xem báo cáo"
                    >
                      <span className="material-symbols-outlined">description</span>
                    </button>
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
    </AppShell>
  );
}
