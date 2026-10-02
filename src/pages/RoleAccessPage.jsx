import React from 'react';
import { ErrorPage } from './ErrorPage.jsx';

export function RoleAccessPage({ session }) {
  return <ErrorPage status={403} session={session} />;
}
