import { getDemoSession } from './demoSession.js';

const key = () => {
  const id = getDemoSession()?.userId;
  return id ? `ptit-notifications:${id}` : null;
};
export function readNotifications() {
  try {
    const storageKey = key();
    const data = storageKey ? JSON.parse(localStorage.getItem(storageKey) || '[]') : [];
    return Array.isArray(data) ? data.filter((item) => typeof item?.title === 'string' && typeof item?.id === 'string').slice(0, 50) : [];
  } catch { return []; }
}
function write(items) {
  const storageKey = key();
  if (!storageKey) return;
  try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch { return; }
  window.dispatchEvent(new Event('ptit-notifications-changed'));
}
export function addNotification(title) {
  if (typeof title !== 'string' || !title.trim()) return;
  const items = readNotifications();
  if (items[0]?.title === title && Date.now() - items[0].createdAt < 2000) return;
  write([{ id: crypto.randomUUID(), title, createdAt: Date.now(), unread: true }, ...items].slice(0, 50));
}
export function markNotificationsRead(id) {
  write(readNotifications().map((item) => !id || item.id === id ? { ...item, unread: false } : item));
}
