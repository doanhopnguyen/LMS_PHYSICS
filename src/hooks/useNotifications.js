import { useEffect, useState } from 'react';
import { readNotifications } from '../lib/notifications.js';

export function useNotifications() {
  const [items, setItems] = useState(readNotifications);
  useEffect(() => {
    const update = () => setItems(readNotifications());
    const events = ['ptit-notifications-changed', 'ptit-session-changed', 'storage'];
    events.forEach((event) => window.addEventListener(event, update));
    return () => events.forEach((event) => window.removeEventListener(event, update));
  }, []);
  return items;
}
