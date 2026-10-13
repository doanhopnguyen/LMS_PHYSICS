import React from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { DetailToolbar } from '../../components/DetailToolbar.jsx';
import { MaterialFilePreview } from '../../components/MaterialFilePreview.jsx';
import { MarkdownContent } from '../../components/MarkdownContent.jsx';
import { StudentMaterialVideo } from '../../components/StudentMaterialVideo.jsx';
import { Resource, useResource, itemsOf } from '../lecturers/LecturerShared.jsx';
import { queryPath } from '../../lib/lecturerUtils.js';

export function DocumentViewerPage() {
  const params = new URLSearchParams(location.search);
  const classId = params.get('classId'),
    topicId = params.get('topicId'),
    materialId = params.get('materialId'),
    subjectId = params.get('subjectId');
  const resource = useResource(
    classId && materialId ? queryPath(`/api/v1/classes/${classId}/materials`, { topicId }) : null
  );
  const material = itemsOf(resource.data).find((row) => row.materialId === materialId);
  return (
    <AppShell
      currentPage="document_viewer.html"
      footer={false}
      title={material?.title || 'Tài liệu'}
      toolbar={
        <DetailToolbar
          title={material?.title || 'Tài liệu'}
          backLabel="Về học liệu"
          backHref={queryPath('learning_module.html', { classId, subjectId, topicId, materialId })}
        />
      }
    >
      <div className="p-4 sm:p-6">
        <Resource value={resource} empty="Mở tài liệu từ lớp học.">
          {() =>
            material ? (
              material.type === 'VIDEO' ? (
                <StudentMaterialVideo material={{ ...material, classId }} />
              ) : material.contentText ? (
                <MarkdownContent content={material.contentText} />
              ) : (
                <MaterialFilePreview material={material} fill />
              )
            ) : (
              <p role="alert">Không tìm thấy học liệu trong lớp.</p>
            )
          }
        </Resource>
      </div>
    </AppShell>
  );
}
