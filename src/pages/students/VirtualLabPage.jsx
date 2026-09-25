import { PaginatedList } from "../../components/Pagination.jsx";
import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { api } from '../../lib/apiClient.js';

const GRADIENT_PRESETS = [
  'from-[#E52220] to-[#F59E0B]',
  'from-[#1E3A8A] to-[#0F766E]',
  'from-[#334155] to-[#7C3AED]',
  'from-[#14532D] to-[#0F766E]',
  'from-[#7C2D12] to-[#DC2626]',
  'from-[#0F172A] to-[#1D4ED8]',
];

export function VirtualLabPage() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    // Fetch experiments – subjectId optional; try without filter first
    api.experiments.list(undefined)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setExperiments(list);
      })
      .catch((err) => setError(err.message || 'Không thể tải danh sách thí nghiệm.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell
      currentPage="virtual_lab.html"
      title="Phòng thí nghiệm 3D · PTIT Physics 1"
      breadcrumbs={['Phòng thí nghiệm 3D']}
      current="Danh sách thí nghiệm"
    >
      <PageContainer>
        <PageTitle eyebrow="Phòng thí nghiệm 3D" actions={<a href="student_evidence.html"><Button icon="history">Minh chứng & báo cáo</Button></a>} />

        {loading && <p className="text-body-md text-[#64748B] py-10 text-center">Đang tải danh sách thí nghiệm...</p>}
        {error && <p className="text-body-md text-primary py-10 text-center">{error}</p>}
        {!loading && !error && experiments.length === 0 && (
          <p className="text-body-md text-[#64748B] py-10 text-center">Chưa có bài thí nghiệm nào.</p>
        )}
        {!loading && !error && experiments.length > 0 && (
          <PaginatedList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {experiments.map((exp, idx) => (
              <Card
                key={exp.experimentId}
                className="overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <div
                  className={`h-36 bg-gradient-to-br ${GRADIENT_PRESETS[idx % GRADIENT_PRESETS.length]} flex items-center justify-center text-white`}
                >
                  <span className="material-symbols-outlined text-6xl opacity-70">science</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-label-md text-[#64748B]">TN {String(exp.orderIndex || idx + 1).padStart(2, '0')}</span>
                  </div>
                  <h2 className="text-headline-sm font-bold mt-3 min-h-[52px]">{exp.title}</h2>
                  {exp.description && (
                    <p className="text-body-sm text-[#64748B] mt-1 line-clamp-2">{exp.description}</p>
                  )}
                  <div className="flex gap-2 mt-5">
                    <a href="3d_workspace.html" className="flex-1">
                      <Button className="w-full" icon="play_arrow">
                        Bắt đầu
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
          </PaginatedList>
        )}
      </PageContainer>
    </AppShell>
  );
}


