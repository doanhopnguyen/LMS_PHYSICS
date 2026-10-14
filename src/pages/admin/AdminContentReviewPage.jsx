import React from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { AdminQuestionsApiPage } from './AdminQuestionsApiPage.jsx';
import { AdminMaterialsPage } from './AdminMaterialsPage.jsx';

export function AdminContentReviewPage() {
  return (
    <AdminPageShell currentPage="admin_materials.html" title="Duyệt ngân hàng & học liệu">
      <Tabs
        items={[
          { id: 'questions', label: 'Ngân hàng câu hỏi' },
          { id: 'materials', label: 'Học liệu' },
        ]}
      >
        {(active) =>
          active === 'questions' ? <AdminQuestionsApiPage embedded reviewOnly /> : <AdminMaterialsPage embedded />
        }
      </Tabs>
    </AdminPageShell>
  );
}
