import React from 'react';
import { Card } from './Card.jsx';
import { StatusBadge } from './StatusBadge.jsx';

export function ResourceCard({ resource }) {
  return (
    <Card className="p-4 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2">
        <span className="w-10 h-10 rounded-full bg-[#FEE2E2] text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">{resource.icon}</span>
        </span>
        <StatusBadge tone="neutral">{resource.tag}</StatusBadge>
      </div>
      <div>
        <h3 className="text-headline-sm font-bold text-on-surface">{resource.title}</h3>
        <p className="text-body-sm text-[#64748B] mt-1">{resource.type}</p>
        <p className="text-body-sm text-[#64748B]">{resource.author}</p>
      </div>
      <a className="text-body-md font-semibold text-primary hover:underline mt-auto" href="document_viewer.html">
        Mở tài liệu
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </a>
    </Card>
  );
}
