import React from 'react';
import '../styles/loading.css';

export function LoadingIndicator({ children = 'Đang tải…', inline = false, size, className = '', ...props }) {
  return (
    <span
      {...props}
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`ptit-loading ptit-loading--${size || (inline ? 'small' : 'medium')}${inline ? ' ptit-loading--inline' : ''} ${className}`}
    >
      <span className="ptit-loading__mark" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL || '/'}ptitlogo.png`} alt="" width="54" height="69" />
      </span>
      {children && <span className="ptit-loading__label">{children}</span>}
    </span>
  );
}
