import React from 'react';
import { formatPercent } from '../lib/formatPercent.js';

export function Card({
  children,
  className = '',
  as: Component = 'section',
  progress,
  status,
  contentClassName = '',
  variant = 'default',
  accentColor = '#e52220',
  style,
  ...props
}) {
  if (progress !== undefined) {
    const percentage = Math.min(100, Math.max(0, Number(progress) || 0));
    const state = percentage === 100 ? 'complete' : percentage > 0 ? 'active' : 'pending';
    const statusText =
      status || (state === 'complete' ? 'Đã hoàn thành' : state === 'active' ? 'Đang thực hiện' : 'Chưa bắt đầu');
    return (
      <Component {...props} style={style} className={`progress-card ${className}`} data-progress-state={state}>
        <div className={`progress-card__surface ${contentClassName}`}>{children}</div>
        <div className="progress-card__ribbon">
          <span className="material-symbols-outlined" aria-hidden="true">
            {state === 'complete' ? 'check_circle' : state === 'active' ? 'pending' : 'schedule'}
          </span>
          <span>{statusText}</span>
          <strong>{formatPercent(percentage)}</strong>
        </div>
      </Component>
    );
  }
  return (
    <Component
      {...props}
      style={{ '--card-accent': accentColor, ...style }}
      className={`lms-card ${variant === 'accent' ? 'lms-card--accent' : ''} bg-surface-container-lowest rounded-2xl border border-[#E2E8F0] shadow-sm ${className}`}
    >
      {children}
    </Component>
  );
}
