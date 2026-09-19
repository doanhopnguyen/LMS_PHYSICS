import React from 'react';

export function PageTitle({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        {eyebrow && <div className="text-label-md text-primary font-bold tracking-wide uppercase mb-1">{eyebrow}</div>}
        <h1 className="text-headline-lg font-headline-lg text-on-surface font-bold tracking-tight">{title}</h1>
        {description && <p className="text-body-md text-[#64748B] mt-1 max-w-3xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
