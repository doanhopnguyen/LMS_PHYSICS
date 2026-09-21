import React from 'react';

export function PageTitle({ eyebrow, title, description, actions, accentColor = '#e52220' }) {
  return (
    <div className="page-title" style={{ '--page-title-accent': accentColor }}>
      <div className="page-title__surface">
        <div className="page-title__copy">
          {eyebrow && (
            <div className="page-title__eyebrow text-label-md font-bold tracking-wide uppercase mb-1">{eyebrow}</div>
          )}
          <h1 className="text-headline-lg font-headline-lg text-on-surface font-bold tracking-tight">{title}</h1>
          {description && <p className="text-body-md text-[#64748B] mt-1 max-w-3xl">{description}</p>}
        </div>
        {actions && <div className="page-title__actions flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
