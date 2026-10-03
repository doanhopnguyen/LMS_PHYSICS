import React, { useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { DashboardOverview } from '../../components/DashboardOverview.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { demoRoles } from '../../lib/demoSession.js';
import { taNavigation, taUtilityNavigation } from '../../data/taNavigation.js';
import { listItems, useApiData } from '../../hooks/useApiData.js';

const user = { ...demoRoles.TA, role: demoRoles.TA.label };
function TAShell({ currentPage, title, description, children }) {
  return (
    <AppShell
      currentPage={currentPage}
      title={`${title} · PTIT Physics LMS`}
      user={user}
      homeHref="ta_dashboard.html"
      navigationItems={taNavigation}
      utilityItems={taUtilityNavigation}
      showChatLauncher={false}
    >
      <PageContainer>
        <PageTitle eyebrow="KHU VỰC TRỢ GIẢNG" title={title} description={description} />
        {children}
      </PageContainer>
    </AppShell>
  );
}
const className = (item) => item.className || item.classCode || 'Lớp học';
const status = (value) => <StatusBadge status={value} />;
const classUrl = (id) => `ta_class_support.html?classId=${encodeURIComponent(id)}`;

function ClassList({ classes, loading, error, reload, actionLabel = 'Mở hỗ trợ' }) {
  if (loading) return <p role="status">Đang tải lớp được phân công…</p>;
  if (error)
    return (
      <p role="alert">
        {error} <Button onClick={reload}>Thử lại</Button>
      </p>
    );
  if (classes.length === 0 && !actionLabel) return null;
  return (
    <DataTable
      columns={['Lớp học', 'Học phần', 'Trạng thái', '']}
      rows={classes}
      renderRow={(item) => (
        <tr key={item.classId} className="border-t">
          <td className="p-3 font-medium">{className(item)}</td>
          <td className="p-3">{item.subjectName || item.subjectCode || '—'}</td>
          <td className="p-3">{status(item.status)}</td>
          <td className="p-3">
            <a href={classUrl(item.classId)}>
              <Button variant="secondary">{actionLabel}</Button>
            </a>
          </td>
        </tr>
      )}
    />
  );
}

export function TADashboardApiPage() {
  const classesResource = useApiData('/api/v1/classes?page=0&size=20');
  const classes = listItems(classesResource.data);
  const metrics = [
    {
      label: 'Lớp được phân công',
      value: classesResource.data?.totalElements ?? classes.length,
      detail: 'Các lớp đang hỗ trợ',
      icon: 'groups',
      tone: 'primary',
    },
    {
      label: 'Lớp đang hoạt động',
      value: classes.filter((item) => item.status === 'ACTIVE').length,
      detail: 'Trong trang dữ liệu hiện tại',
      icon: 'school',
      tone: 'success',
    },
  ];
  return (
    <TAShell
      currentPage="ta_dashboard.html"
      title="Tổng quan trợ giảng"
      description="Theo dõi các lớp và công việc hỗ trợ giảng dạy."
    >
      <div className="mt-6">
        <DashboardOverview role="TA">
          <MetricGrid columns={2} items={metrics} />
          <Card className="col-span-full p-6">
            <SectionHeader
              icon="assignment_late"
              title="Công việc được phân công"
              action={
                <a href="ta_work_queue.html" className="font-semibold text-primary">
                  Xem tất cả
                </a>
              }
            />
            <div className="mt-5 overflow-x-auto">
              <ClassList
                classes={classes.slice(0, 5)}
                loading={classesResource.loading}
                error={classesResource.error}
                reload={classesResource.reload}
              />
            </div>
          </Card>
        </DashboardOverview>
      </div>
    </TAShell>
  );
}

export function TAWorkQueueApiPage() {
  const classesResource = useApiData('/api/v1/classes?page=0&size=50');
  const classes = listItems(classesResource.data);
  return (
    <TAShell
      currentPage="ta_work_queue.html"
      title="Lớp và công việc được phân công"
      description="Chọn lớp để xem sinh viên, nhân sự, kỳ thi và thực hiện chấm rubric."
    >
      <Card className="mt-6 overflow-x-auto p-5">
        <ClassList
          classes={classes}
          loading={classesResource.loading}
          error={classesResource.error}
          reload={classesResource.reload}
        />
      </Card>
    </TAShell>
  );
}

export { TAClassSupportTabsPage as TAClassSupportApiPage } from './TAClassSupportTabsPage.jsx';
