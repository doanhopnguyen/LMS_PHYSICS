import React from 'react';
import { AppShell } from './AppShell.jsx';
import { PageContainer } from './PageContainer.jsx';
import { PageTitle } from './PageTitle.jsx';
import { Button } from './Button.jsx';
import { navigate } from '../lib/navigation.js';
import { getPageFile } from '../lib/routes.js';
import { lecturerBackLink } from '../lib/detailNavigation.js';
import {
  lecturerNavigation,
  lecturerUser,
  lecturerUtilityNavigation,
} from '../data/lecturerData.js';

export function LecturerPageShell({ currentPage, title, eyebrow, description, actions, children }) {
  const back = lecturerBackLink(getPageFile(), window.location.search);
  const actionsInFilters = ['lecturer_question_bank.html', 'lecturer_materials.html'].includes(getPageFile());
  return (
    <AppShell
      currentPage={currentPage}
      title={`${title} · PTIT Physics LMS`}
      user={lecturerUser}
      homeHref="lecturer_dashboard.html"
      navigationItems={lecturerNavigation}
      utilityItems={lecturerUtilityNavigation}
      showChatLauncher={false}
      filterActions={actionsInFilters ? actions : undefined}
    >
      <PageContainer>
        <PageTitle eyebrow={eyebrow} title={title} description={description} actions={back ? <><Button variant="secondary" onClick={() => navigate(back.href)}>{back.label}</Button>{actions}</> : actionsInFilters ? undefined : actions} />
        {children}
      </PageContainer>
    </AppShell>
  );
}
