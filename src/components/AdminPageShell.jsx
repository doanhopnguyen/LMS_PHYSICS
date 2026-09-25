import React from 'react';
import { AppShell } from './AppShell.jsx';
import { PageContainer } from './PageContainer.jsx';
import { PageTitle } from './PageTitle.jsx';
import { adminNavigation, adminUser } from '../data/adminData.js';

export function AdminPageShell({ currentPage, title, eyebrow = 'QUẢN TRỊ HỆ THỐNG', description, actions, children, pageTitleInHeader = true }) {
  return (
    <AppShell currentPage={currentPage} title={`${title} · PTIT Physics LMS`} user={adminUser} homeHref="admin_dashboard.html" navigationItems={adminNavigation} utilityItems={[]} showChatLauncher={false}>
      <PageContainer>
        <PageTitle eyebrow={eyebrow} title={title} description={description} actions={actions} inHeader={pageTitleInHeader} />
        {children}
      </PageContainer>
    </AppShell>
  );
}
