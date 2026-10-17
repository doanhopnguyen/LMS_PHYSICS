import React, { useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { AdminQuestionsApiPage } from './AdminQuestionsApiPage.jsx';
import { AdminMaterialsPage } from './AdminMaterialsPage.jsx';

export function AdminContentReviewPage() {
  const [tabActionTarget, setTabActionTarget] = useState(null);
  return (
    <AdminPageShell currentPage="admin_materials.html" title="Duyệt ngân hàng & học liệu">
      <Tabs
        items={[
          { id: 'questions', label: 'Ngân hàng câu hỏi' },
          { id: 'materials', label: 'Học liệu' },
        ]}
        actions={<div ref={setTabActionTarget} className="flex flex-wrap items-center justify-end gap-2" />}
      >
        {(active) =>
          active === 'questions' ? (
            <AdminQuestionsApiPage embedded reviewOnly tabActionTarget={tabActionTarget} />
          ) : (
            <AdminMaterialsPage embedded />
          )
        }
      </Tabs>
    </AdminPageShell>
  );
}
