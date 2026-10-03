import React from 'react';

export function SectionHeader({ icon, title, action, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] ${className}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="w-8 h-8 shrink-0 rounded-lg bg-[#FEE2E2] text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">{icon}</span>
          </span>
        )}
        <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">{title}</h2>
      </div>
      {action}
    </div>
  );
}
