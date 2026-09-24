import React from 'react';
import { AppShell } from './AppShell.jsx';
import { PageContainer } from './PageContainer.jsx';
import { PageTitle } from './PageTitle.jsx';
import {
  lecturerNavigation,
  lecturerUser,
  lecturerUtilityNavigation,
} from '../data/lecturerData.js';

export function LecturerPageShell({ currentPage, title, eyebrow, description, actions, children }) {
  return (
    <AppShell
      currentPage={currentPage}
      title={`${title} · PTIT Physics LMS`}
      user={lecturerUser}
      homeHref="lecturer_dashboard.html"
      navigationItems={lecturerNavigation}
      utilityItems={lecturerUtilityNavigation}
      showChatLauncher={false}
    >
      <PageContainer>
        <PageTitle eyebrow={eyebrow} title={title} description={description} actions={actions} />
        {children}
      </PageContainer>
    </AppShell>
  );
}
