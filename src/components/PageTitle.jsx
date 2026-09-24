import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { PageHeaderContext } from './PageHeaderContext.jsx';

export function PageTitle({ eyebrow, title, description, actions, accentColor = '#e52220' }) {
  const context = useContext(PageHeaderContext);
  const content = (
    <div className="page-heading" style={{ '--page-title-accent': accentColor }}>
      <div className="page-title__surface">
        <div className="page-title__copy">
          {eyebrow && title && (
            <div className="page-title__eyebrow text-label-md font-bold tracking-wide uppercase mb-1">{eyebrow}</div>
          )}
          <h1 className="text-headline-lg font-headline-lg text-on-surface font-bold tracking-tight">{title || eyebrow}</h1>
        </div>
        {actions && <div className="page-title__actions flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
  return context?.target ? createPortal(content, context.target) : content;
}
