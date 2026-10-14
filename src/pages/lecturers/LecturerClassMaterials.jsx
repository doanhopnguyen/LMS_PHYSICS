import React, { useState } from 'react';
import { api } from '../../lib/apiClient.js';
import { validateVideoMaterial } from '../../lib/materialSources.js';
import { MaterialEditorForm } from './LecturerContent.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { MarkdownContent } from '../../components/MarkdownContent.jsx';
import { MaterialFilePreview } from '../../components/MaterialFilePreview.jsx';
import {
  Button,
  Field,
  Lookup,
  Modal,
  Resource,
  Table,
  useResource,
  useMutation,
  itemsOf,
  labelOf,
} from './LecturerShared.jsx';

export function LecturerClassMaterials({ classId, subjectId }) {
  const resource = useResource(`/api/v1/classes/${classId}/materials`);
  const topics = useResource(`/api/v1/subjects/${subjectId}/topics`);
  const [topicId, setTopicId] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState(null);
  const action = useMutation();
  const rows = itemsOf(resource.data).filter(
    (row) =>
      row.scope === 'CLASS' &&
      (!search.trim() || row.title?.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')))
  );
  const save = async (event) => {
    event.preventDefault();
    if (!itemsOf(topics.data).some((row) => row.topicId === topicId)) {
      action.setError('Chọn chủ đề thuộc môn của lớp.');
      return;
    }
    const form = new FormData(event.currentTarget);
    form.set('topicId', topicId);
    form.set('scope', 'CLASS');
    form.set('classId', classId);
    const error = validateVideoMaterial(form);
    if (error) {
      action.setError(error);
      return;
    }
    if (!form.get('file')?.size) form.delete('file');
    if (['TEXT', 'MARKDOWN'].includes(form.get('type')) && !String(form.get('contentText') || '').trim()) {
      action.setError('Nhập nội dung học liệu.');
      return;
    }
    const result = await action.run(
      () => api.materials.createForClass(classId, topicId, form),
      'Đã tạo học liệu riêng cho lớp.'
    );
    if (result.ok) {
      setCreating(false);
      resource.reload();
    }
  };
  return (
    <>
      {action.feedback}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <Field
          label="Tìm học liệu riêng"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button
          icon="add"
          onClick={() => {
            action.clear();
            setTopicId('');
            setCreating(true);
          }}
        >
          Tạo học liệu riêng cho lớp
        </Button>
      </div>
      <Resource value={resource}>
        {() => (
          <Table
            asCards
            rows={rows}
            columns={['Học liệu', 'Chủ đề', 'Loại', 'Trạng thái', 'Thao tác']}
            cells={(row) => [
              row.title,
              itemsOf(topics.data).find((topic) => topic.topicId === row.topicId)?.topicName || 'Chủ đề',
              labelOf(row.type),
              <StatusBadge status={row.approvalStatus} />,
              <Button variant="secondary" onClick={() => setView(row)}>
                Xem học liệu
              </Button>,
            ]}
          />
        )}
      </Resource>
      {creating && (
        <Modal
          title="Tạo học liệu riêng cho lớp"
          busy={action.busy}
          wide
          expandable
          onClose={() => !action.busy && setCreating(false)}
        >
          {action.error && (
            <p role="alert" className="mb-4 text-red-700">
              {action.error}
            </p>
          )}
          <Lookup
            name="privateTopicId"
            label="Chủ đề"
            resource={topics}
            idKey="topicId"
            value={topicId}
            onChange={setTopicId}
          />
          <MaterialEditorForm onSubmit={save} busy={action.busy || !topicId} />
        </Modal>
      )}
      {view && (
        <Modal title={view.title} wide expandable onClose={() => setView(null)}>
          {view.type === 'MARKDOWN' ? (
            <MarkdownContent content={view.contentText || ''} />
          ) : view.type === 'TEXT' ? (
            <p className="whitespace-pre-wrap break-words">{view.contentText}</p>
          ) : (
            <MaterialFilePreview material={view} />
          )}
        </Modal>
      )}
    </>
  );
}
