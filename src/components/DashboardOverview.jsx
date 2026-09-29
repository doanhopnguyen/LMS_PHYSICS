import React from 'react';
import { DashboardCalendar } from './DashboardCalendar.jsx';

export function DashboardOverview({ role, children }) {
  return (
    <div className="dashboard-overview">
      <section className="dashboard-overview__stats" aria-label="Thống kê tổng quan">
        {children}
      </section>
      <DashboardCalendar role={role} />
    </div>
  );
}
