import React from 'react';
import { labelOf } from '../lib/lecturerUtils.js';

const toneClasses = {
  primary: 'bg-[#FEE2E2] text-primary border-[#FECACA]',
  success: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]',
  warning: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
  neutral: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
  danger: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
};

const statusTones = {
  ACTIVE: 'success', APPROVED: 'success', COMPLETED: 'success', CONFIRMED: 'success',
  GRADED: 'success', OPEN: 'success', PENDING: 'warning', IN_PROGRESS: 'primary',
  REJECTED: 'danger', CANCELLED: 'danger', BLOCKED: 'danger', LOCKED: 'danger', DISABLED: 'neutral',
  INACTIVE: 'neutral', DRAFT: 'neutral', SUBMITTED: 'primary',
};

export function StatusBadge({ children, tone, status, className = '' }) {
  const selectedTone = tone || statusTones[status] || 'neutral';
  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center whitespace-nowrap px-2.5 py-0.5 rounded-full border text-label-sm font-label-sm ${toneClasses[selectedTone] ?? toneClasses.neutral} ${className}`}
    >
      {children ?? labelOf(status)}
    </span>
  );
}
