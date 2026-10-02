import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../hooks/useNotifications.js';
import { navigate } from '../lib/navigation.js';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  const panel = useRef(null);
  const panelId = useId();
  const { items, unread, loading, error, busy, total, refresh, loadMore, markAllRead, remove } = useNotifications();
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector('button')?.focus();
    const outside = (event) => {
      if (!panel.current?.contains(event.target) && !button.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <>
      <button
        ref={button}
        type="button"
        className="header-icon-button notification-bell"
        onClick={() => {
          if (!open) refresh();
          setOpen(!open);
        }}
        aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        title="Thông báo"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          notifications
        </span>
        {unread > 0 && <span className="notification-count">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open &&
        createPortal(
          <section ref={panel} id={panelId} className="notification-panel" aria-label="Thông báo">
            <div className="notification-panel-heading">
              <h2>Thông báo</h2>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  button.current?.focus();
                }}
                aria-label="Đóng thông báo"
              >
                Đóng
              </button>
            </div>
            <div className="notification-panel-tools">
              <span>{unread} chưa đọc</span>
              <button type="button" disabled={!unread || busy || loading} onClick={markAllRead}>
                Đọc tất cả
              </button>
            </div>
            {error && (
              <div role="alert" className="px-4 py-3 text-sm text-red-700">
                {error}{' '}
                <button type="button" className="underline" disabled={loading} onClick={refresh}>
                  Thử lại
                </button>
              </div>
            )}
            {loading && (
              <p role="status" className="px-4 py-3 text-sm text-[#64748B]">
                Đang tải thông báo…
              </p>
            )}
            {items.length ? (
              <ul className="notification-list">
                {items.map((item) => {
                  const createdAt = new Date(item.createdAt);
                  const validDate = !Number.isNaN(createdAt.getTime());
                  return (
                    <li key={item.notificationId} className="notification-row">
                      <button
                        type="button"
                        disabled={busy}
                        className={!item.isRead ? 'is-unread' : ''}
                        onClick={() => {
                          setOpen(false);
                          navigate(
                            `notification_detail.html?notificationId=${encodeURIComponent(item.notificationId)}`
                          );
                        }}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">
                          {item.type === 'SCHEDULE_REMINDER' ? 'event' : 'notifications'}
                        </span>
                        <span>
                          <span className="notification-title">{item.title}</span>
                          {item.content && <span className="notification-content">{item.content}</span>}
                          {validDate && (
                            <time dateTime={createdAt.toISOString()}>
                              {createdAt.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                            </time>
                          )}
                        </span>
                        {!item.isRead && <span className="notification-dot" aria-label="Chưa đọc" />}
                      </button>
                      <button
                        type="button"
                        className="notification-delete"
                        disabled={busy}
                        onClick={() => remove(item.notificationId)}
                        aria-label={`Xóa thông báo ${item.title}`}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">
                          close
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              !loading &&
              !error && (
                <div className="notification-empty">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    notifications_none
                  </span>
                  <p>Chưa có thông báo.</p>
                </div>
              )
            )}
            {items.length < total && (
              <div className="notification-panel-tools">
                <button type="button" disabled={loading || busy} onClick={loadMore}>
                  Xem thêm thông báo
                </button>
              </div>
            )}
          </section>,
          document.body
        )}
    </>
  );
}
