import React, { useEffect, useId, useRef, useState } from 'react';
import '../styles/media-viewer.css';
import { LoadingIndicator } from './LoadingIndicator.jsx';

export function MediaViewer({
  title,
  label = 'Tài liệu',
  icon = 'description',
  meta,
  actions,
  fill = false,
  compact = false,
  nativePdf = false,
  children,
}) {
  const [expanded, setExpanded] = useState(false);
  const container = useRef(null);
  const expandButton = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    container.current?.focus();
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setExpanded(false);
    };
    document.addEventListener('keydown', escape, true);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      document.removeEventListener('keydown', escape, true);
      expandButton.current?.focus({ preventScroll: true });
    };
  }, [expanded]);
  const expandControl = (
    <button
      type="button"
      ref={expandButton}
      className="media-viewer__action"
      aria-expanded={expanded}
      aria-label={expanded ? 'Thu gọn khung xem' : 'Mở rộng khung xem'}
      title={expanded ? 'Thu gọn khung xem (Esc)' : 'Mở rộng khung xem'}
      onClick={() => setExpanded((value) => !value)}
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {expanded ? 'close_fullscreen' : 'open_in_full'}
      </span>
      {!nativePdf && <span>{expanded ? 'Thu gọn' : 'Mở rộng'}</span>}
    </button>
  );
  return (
    <section
      ref={container}
      className={`media-viewer${nativePdf ? ' pdf-file-viewer' : ''}${nativePdf && fill ? ' pdf-file-viewer--fill' : ''}${fill ? ' media-viewer--fill' : ''}${compact ? ' media-viewer--compact' : ''}${expanded ? ' media-viewer--expanded' : ''}`}
      aria-label={nativePdf ? title || 'Trình xem PDF' : expanded ? undefined : `Trình xem ${label.toLowerCase()}`}
      aria-labelledby={expanded && !nativePdf ? titleId : undefined}
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded ? true : undefined}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (!expanded || event.key !== 'Tab') return;
        const nodes = [
          ...container.current.querySelectorAll(
            'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),iframe,video[controls],audio[controls]'
          ),
        ];
        if (event.shiftKey && (document.activeElement === nodes[0] || document.activeElement === container.current)) {
          event.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) {
          event.preventDefault();
          nodes[0]?.focus();
        }
      }}
    >
      {nativePdf ? (
        <div className="pdf-file-viewer__controls">{expandControl}</div>
      ) : (
        <header className="media-viewer__toolbar">
          <div className="media-viewer__identity">
            <span className="media-viewer__icon" aria-hidden="true">
              <span className="material-symbols-outlined">{icon}</span>
            </span>
            <div className="media-viewer__info">
              <span className="media-viewer__label">{label}</span>
              {(!compact || expanded) && (
                <p className="media-viewer__title" id={titleId} title={title}>
                  {title || 'Tài liệu học tập'}
                </p>
              )}
              {meta && <p className="media-viewer__meta">{meta}</p>}
            </div>
          </div>
          <div className="media-viewer__actions">
            {actions}
            {expandControl}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}

export function ViewerStatus({ error, children, onRetry }) {
  if (!error)
    return (
      <LoadingIndicator className="media-viewer__status">{children || 'Đang chuẩn bị nội dung…'}</LoadingIndicator>
    );
  return (
    <div className="media-viewer__status" role={error ? 'alert' : 'status'}>
      <span className="material-symbols-outlined" aria-hidden="true">
        error_outline
      </span>
      <strong>Không thể mở nội dung</strong>
      <p>{children}</p>
      {onRetry && (
        <button type="button" className="media-viewer__action" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
