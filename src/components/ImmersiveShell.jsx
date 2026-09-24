import React, { useEffect, useState } from 'react';
import { ChatLauncher } from './ChatLauncher.jsx';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { navigate, routeFromLink } from '../lib/navigation.js';
import { PageHeaderProvider } from './PageHeaderContext.jsx';

export function ImmersiveShell({
  children,
  title,
  bodyClass = 'bg-[#090d16] text-white min-h-screen',
  topbar,
  showChatLauncher = true,
  showChrome = false,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useDocumentMeta({ title, bodyClass });

  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <PageHeaderProvider>
    <div
      className="app-shell app-shell-white immersive-shell min-h-screen flex flex-col"
      onClick={(event) => {
        const link = event.target.closest('a');
        if (!link) return;
        const target = routeFromLink(link);
        if (target) {
          event.preventDefault();
          navigate(target);
        }
      }}
    >
      {showChrome && <Header onMenuClick={() => setSidebarOpen((open) => !open)} />}
      {showChrome && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      {showChrome && sidebarOpen && (
        <button className="sidebar-backdrop" aria-label="Đóng thanh điều hướng" onClick={() => setSidebarOpen(false)} />
      )}
      <div
        className={`immersive-shell-content ${!showChrome ? 'immersive-shell-content-no-chrome' : ''} flex-1 min-h-0`}
      >
        <div className="detail-toolbar-shell">{topbar}</div>
        {children}
      </div>
      {showChatLauncher && <ChatLauncher />}
    </div>
    </PageHeaderProvider>
  );
}
