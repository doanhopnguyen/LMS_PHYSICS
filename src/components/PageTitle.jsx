import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { PageHeaderContext } from './PageHeaderContext.jsx';

export function PageTitle({ eyebrow, title, description, actions, accentColor = '#e52220', inHeader = true }) {
  const context = useContext(PageHeaderContext);
  const headerTarget = context?.enabled !== false ? context?.target : null;
  const content = (
    <div className="page-heading" style={{ '--page-title-accent': accentColor }}>
      <div className="page-title__surface">
        <div className="page-title__copy">
          {eyebrow && title && (
            <div className="page-title__eyebrow text-label-md font-bold tracking-wide uppercase mb-1">{eyebrow}</div>
          )}
          <h1 className="text-headline-lg font-headline-lg text-on-surface font-bold tracking-tight">
            {title || eyebrow}
          </h1>
        </div>
        {!headerTarget && actions && (
          <div className="page-title__actions flex items-center gap-2 flex-wrap">{actions}</div>
        )}
      </div>
    </div>
  );
  return headerTarget && inHeader ? (
    <>
      {createPortal(content, headerTarget)}
      {actions && (
        <div className="page-content-actions" aria-label="Thao tác trang">
          {actions}
        </div>
      )}
    </>
  ) : (
    content
  );
}
