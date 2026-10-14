import React from 'react';
import { AppShell } from './AppShell.jsx';
import { PageContainer } from './PageContainer.jsx';
import { PageTitle } from './PageTitle.jsx';
import { getPageFile } from '../lib/routes.js';
import { lecturerBackLink } from '../lib/detailNavigation.js';
import { lecturerNavigation, lecturerUser, lecturerUtilityNavigation } from '../data/lecturerData.js';

export function LecturerPageShell({ currentPage, title, eyebrow, description, actions, children, backHref }) {
  const page = getPageFile();
  const query = new URLSearchParams(window.location.search);
  const scopedBack =
    ['lecturer_courses.html', 'lecturer_question_bank.html'].includes(page) && query.get('subjectId')
      ? `${page}${page === 'lecturer_question_bank.html' && query.get('tab') ? `?tab=${query.get('tab')}` : ''}`
      : lecturerBackLink(page, window.location.search)?.href;
  return (
    <AppShell
      currentPage={currentPage}
      title={`${title} · PTIT Physics LMS`}
      user={lecturerUser}
      homeHref="lecturer_dashboard.html"
      navigationItems={lecturerNavigation}
      utilityItems={lecturerUtilityNavigation}
      showChatLauncher={false}
      contentClass="lecturer-workspace-content"
      backHref={backHref || scopedBack}
    >
      <PageContainer>
        <PageTitle eyebrow={eyebrow} title={title} description={description} actions={actions} />
        {children}
      </PageContainer>
    </AppShell>
  );
}
