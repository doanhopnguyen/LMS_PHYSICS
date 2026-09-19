import React from 'react';
import { Card } from './Card.jsx';

export function StatCard({ label, value, detail, icon, tone = 'primary', progress }) {
  const tones = {
    primary: 'bg-[#FEE2E2] text-primary',
    success: 'bg-[#DCFCE7] text-[#15803D]',
    warning: 'bg-[#FEF3C7] text-[#B45309]',
    neutral: 'bg-[#F1F5F9] text-[#475569]'
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-body-md text-[#64748B]">{label}</span>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${tones[tone] ?? tones.primary}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className="text-display-lg-mobile text-on-surface font-bold tracking-tight">{value}</span>
        {detail && <span className="text-body-md text-[#64748B]">{detail}</span>}
      </div>
      {progress !== undefined ? <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary-container" style={{ width: `${progress}%` }} /></div> : null}
    </Card>
  );
}
