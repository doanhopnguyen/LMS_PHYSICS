import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../hooks/useNotifications.js';
import { markNotificationsRead } from '../lib/notifications.js';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  const panel = useRef(null);
  const items = useNotifications();
  const unread = items.filter((item) => item.unread).length;
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector('button')?.focus();
    const outside = (event) => {
      if (!panel.current?.contains(event.target) && !button.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => { if (event.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <>
    <button ref={button} type="button" className="header-icon-button notification-bell" onClick={() => setOpen(!open)} aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ''}`} aria-expanded={open} aria-controls="header-notifications" title="Thông báo">
      <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
      {unread > 0 && <span className="notification-count">{unread > 9 ? '9+' : unread}</span>}
    </button>
    {open && createPortal(<section ref={panel} id="header-notifications" className="notification-panel" aria-label="Thông báo">
      <div className="notification-panel-heading"><h2>Thông báo</h2><button type="button" onClick={() => { setOpen(false); button.current?.focus(); }} aria-label="Đóng thông báo">Đóng</button></div>
      <div className="notification-panel-tools"><span>{unread} chưa đọc</span><button type="button" disabled={!unread} onClick={() => markNotificationsRead()}>Đọc tất cả</button></div>
      {items.length ? <ul className="notification-list">{items.map((item) => <li key={item.id}><button type="button" className={item.unread ? 'is-unread' : ''} onClick={() => markNotificationsRead(item.id)}><span className="material-symbols-outlined" aria-hidden="true">task_alt</span><span><span className="notification-title">{item.title}</span><time dateTime={new Date(item.createdAt).toISOString()}>{new Date(item.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</time></span>{item.unread && <span className="notification-dot" aria-label="Chưa đọc" />}</button></li>)}</ul> : <div className="notification-empty"><span className="material-symbols-outlined" aria-hidden="true">notifications_none</span><p>Chưa có thông báo mới.</p></div>}
    </section>, document.body)}
  </>;
}
