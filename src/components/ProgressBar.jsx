import React from 'react';

export function ProgressBar({ value = 0, className = '', color = 'bg-primary-container', label }) {
  return (
    <div className={className}>
      {label && <div className="flex items-center justify-between text-body-sm mb-1.5"><span>{label}</span><strong className="text-primary">{value}%</strong></div>}
      <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
