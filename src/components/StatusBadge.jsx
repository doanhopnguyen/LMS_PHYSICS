import React from 'react';

const toneClasses = {
  primary: 'bg-[#FEE2E2] text-primary border-[#FECACA]',
  success: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]',
  warning: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
  neutral: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]'
};

export function StatusBadge({ children, tone = 'neutral', className = '' }) {
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-label-sm font-label-sm ${toneClasses[tone] ?? toneClasses.neutral} ${className}`}>{children}</span>;
}
