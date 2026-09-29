import React from 'react';
import { PageHeaderSlot } from './PageHeaderContext.jsx';

export function DetailToolbar({
  title,
  subtitle,
  backHref = 'dashboard.html',
  backLabel = 'Quay lại',
  onBack,
  actions,
  showBack = true,
}) {
  const backContent = (
    <>
      <span>{backLabel}</span>
    </>
  );
  return (
    <div className={`detail-toolbar-space ${actions ? 'has-actions' : ''}`}>
      <header
        className={`app-header detail-toolbar ${actions ? 'has-actions' : ''}`}
        aria-label="Công cụ trang chi tiết"
      >
        {showBack && onBack ? (
          <button type="button" onClick={onBack} className="detail-toolbar-back" aria-label={backLabel}>
            {backContent}
          </button>
        ) : showBack ? (
          <a href={backHref} className="detail-toolbar-back" aria-label={backLabel}>
            {backContent}
          </a>
        ) : null}
        {showBack && <span className="detail-toolbar-divider" />}
        <PageHeaderSlot />
        <div className="detail-toolbar-info">
          <strong>{title}</strong>
          {subtitle && <span>{subtitle}</span>}
        </div>
        {actions && <div className="detail-toolbar-actions">{actions}</div>}
      </header>
    </div>
  );
}
