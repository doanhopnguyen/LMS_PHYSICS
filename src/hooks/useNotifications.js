import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, tokenStore } from '../lib/apiClient.js';
import { listItems } from './useApiData.js';

const NotificationsContext = createContext(null);
const empty = { items: [], unread: 0, total: 0, page: 0, loading: false, error: '' };

export function NotificationsProvider({ children }) {
  const [state, setState] = useState(empty);
  const [busy, setBusy] = useState(false);
  const version = useRef(0);
  const mounted = useRef(false);
  const mutation = useRef(false);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    if (!tokenStore.getAccessToken()) { setState(empty); return; }
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const [data, summary] = await Promise.all([api.notifications.list({ page: 0, size: 20 }), api.notifications.summary()]);
      if (mounted.current && request === version.current) setState({ items: listItems(data), unread: summary?.unreadCount ?? 0, total: data?.totalElements ?? listItems(data).length, page: 0, loading: false, error: '' });
    } catch (error) {
      if (mounted.current && request === version.current) setState((current) => ({ ...current, loading: false, error: error.message || 'Không thể tải thông báo.' }));
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    refresh();
    const sessionChanged = () => { ++version.current; setState(empty); refresh(); };
    const whenVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    const interval = window.setInterval(whenVisible, 60000);
    window.addEventListener('ptit-session-changed', sessionChanged);
    window.addEventListener('focus', whenVisible);
    document.addEventListener('visibilitychange', whenVisible);
    return () => {
      mounted.current = false;
      ++version.current;
      window.clearInterval(interval);
      window.removeEventListener('ptit-session-changed', sessionChanged);
      window.removeEventListener('focus', whenVisible);
      document.removeEventListener('visibilitychange', whenVisible);
    };
  }, [refresh]);
  async function mutate(operation) {
    if (mutation.current || !tokenStore.getAccessToken()) return;
    mutation.current = true;
    setBusy(true);
    try { await operation(); await refresh(); }
    catch (error) { if (mounted.current) setState((current) => ({ ...current, error: error.message })); }
    finally { mutation.current = false; if (mounted.current) setBusy(false); }
  }
  async function loadMore() {
    if (state.loading || state.items.length >= state.total) return;
    const request = ++version.current;
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await api.notifications.list({ page: state.page + 1, size: 20 });
      if (mounted.current && request === version.current) setState((current) => ({ ...current, items: [...new Map([...current.items, ...listItems(data)].map((item) => [item.notificationId, item])).values()], page: state.page + 1, loading: false }));
    } catch (error) {
      if (mounted.current && request === version.current) setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }
  return React.createElement(NotificationsContext.Provider, { value: { ...state, busy, refresh, loadMore, markRead: (id) => mutate(() => api.notifications.markRead(id)), markAllRead: () => mutate(() => api.notifications.markAllRead()), remove: (id) => mutate(() => api.notifications.remove(id)) } }, children);
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
