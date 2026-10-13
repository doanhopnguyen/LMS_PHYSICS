import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { apiRequest } from '../../lib/apiClient.js';
import { getDemoSession } from '../../lib/demoSession.js';
import { menuByRole } from '../../routes/resolveLmsRoute.js';
import { loadAllPages } from '../../lib/lecturerUtils.js';
export { Card, Button, apiRequest };
export { Form } from '../../components/Form.jsx';
export { FormField } from '../../components/FormField.jsx';
export { SelectField } from '../../components/SelectField.jsx';
export { FormDialog } from '../../components/FormDialog.jsx';
export { Tabs } from '../../components/Tabs.jsx';
export { Table } from '../../pages/lecturers/LecturerShared.jsx';
export function useLoad(loader, key) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ key: null, loading: true });
  useEffect(() => {
    let active = true;
    setState({ key, loading: true });
    Promise.resolve().then(loader).then(data => { if (active) setState({ key, data, loading: false }); })
      .catch(error => { if (active) setState({ key, error: error.message, loading: false }); });
    return () => { active = false; };
  }, [key, version]);
  return { ...(state.key === key ? state : { loading: true }), reload: () => setVersion(v => v + 1) };
}
export const all = path => loadAllPages(apiRequest, path);
export function useList(path) { return useLoad(() => all(path), path); }
export function LoadState({ value, children }) {
  if (value.loading) return <p role="status" className="p-5">Đang tải…</p>;
  if (value.error) return <Card className="p-5"><p role="alert">{value.error}</p><Button variant="secondary" onClick={value.reload}>Thử lại</Button></Card>;
  return typeof children === 'function' ? children(value.data) : children;
}
export function useAction() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async fn => {
    if (lock.current) return { ok: false };
    lock.current = true; setBusy(true); setError('');
    try { return { ok: true, data: await fn() }; }
    catch (e) { setError(e.message); return { ok: false }; }
    finally { lock.current = false; setBusy(false); }
  };
  return { busy, run, feedback: error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : null };
}
export function LmsShell({ title, children }) {
  const session = getDemoSession();
  const items = menuByRole[session?.role] || [];
  const active = items.find(([href]) => window.location.pathname.startsWith(href))?.[0];
  return <AppShell title={title} currentPage={active} user={session} homeHref={items[0]?.[0]} navigationItems={items} utilityItems={[]} showChatLauncher={false}>
    <main className="mx-auto w-full max-w-[1440px] space-y-5 p-4 md:p-6"><h1 className="text-headline-sm font-bold">{title}</h1>{children}</main>
  </AppShell>;
}
