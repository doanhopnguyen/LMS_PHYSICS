import React, { useState } from 'react';
import { api } from '../../lib/apiClient.js';
import { getDemoSession } from '../../lib/demoSession.js';
import { queryPath } from '../../lib/lecturerUtils.js';
import { navigate } from '../../lib/navigation.js';
import { MaterialContentFields, materialFormats } from '../../components/MaterialContentFields.jsx';
import { validateVideoMaterial } from '../../lib/materialSources.js';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { MarkdownContent } from '../../components/MarkdownContent.jsx';
import { AuthoringPanel } from '../../components/AuthoringPanel.jsx';
import {
  Button,
  Card,
  Field,
  Lookup,
  Modal,
  Resource,
  SelectField,
  Table,
  LecturerPageShell,
  itemsOf,
  useResource,
  useMutation,
} from './LecturerShared.jsx';

export function LecturerAuthoringApiPage({ createPage = false }) {
  const classes = useResource('/api/v1/instructor/classes', true);
  const [classId, setClassId] = useState(() => new URLSearchParams(window.location.search).get('classId') || '');
  const selected = itemsOf(classes.data).find((row) => row.classId === classId);
  const topics = useResource(selected?.subjectId ? `/api/v1/subjects/${selected.subjectId}/topics` : null);
  const materials = useResource(selected ? `/api/v1/classes/${classId}/materials` : null);
  const [editor, setEditor] = useState(createPage ? {} : null);
  const [preview, setPreview] = useState(null);
  const action = useMutation();
  const userId = getDemoSession()?.userId;
  const owned = (row) =>
    row.scope === 'CLASS' && row.classId === classId && Boolean(userId) && row.createdBy === userId;
  const close = () => (createPage ? navigate(queryPath('lecturer_materials.html', { classId })) : setEditor(null));
  const Container = createPage ? AuthoringPanel : Modal;
  const edit = async (row) => {
    if (!owned(row)) return;
    const result = await action.run(() => api.materials.get(row.topicId, row.materialId), '');
    if (result.ok) setEditor(result.data);
  };
  return (
    <LecturerPageShell currentPage="lecturer_materials.html" title="Học liệu lớp">
      {action.feedback}
      <Card className="mt-5 p-5">
        <Lookup
          label="Lớp học"
          resource={classes}
          idKey="classId"
          value={classId}
          onChange={(id) => {
            setClassId(id);
            setEditor(createPage ? {} : null);
            action.clear();
          }}
        />
        {!createPage && (
          <Button
            className="mt-4"
            disabled={!selected}
            onClick={() => navigate(queryPath('lecturer_material_create.html', { classId }))}
            icon="add"
          >
            Thêm học liệu riêng
          </Button>
        )}
      </Card>
      {!createPage && (
        <Resource value={materials} empty="Chọn lớp học.">
          {(data) => (
            <Table
              asCards
              rows={itemsOf(data)}
              columns={['Học liệu', 'Phạm vi', 'Trạng thái', '']}
              cells={(row) => [
                row.title,
                row.scope === 'CLASS' ? 'Riêng lớp này' : 'Dùng chung môn học',
                <StatusBadge status={row.approvalStatus} />,
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setPreview(row)}>
                    Xem
                  </Button>
                  {owned(row) && (
                    <>
                      <Button variant="secondary" disabled={action.busy} onClick={() => edit(row)}>
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={action.busy}
                        onClick={() =>
                          action.confirm(
                            'Xóa học liệu?',
                            () => api.materials.remove(row.topicId, row.materialId),
                            materials.reload
                          )
                        }
                      >
                        Xóa
                      </Button>
                    </>
                  )}
                </div>,
              ]}
            />
          )}
        </Resource>
      )}
      {editor && selected && (
        <Container
          title={editor.materialId ? 'Sửa học liệu riêng' : 'Thêm học liệu riêng'}
          busy={action.busy}
          onClose={close}
        >
          <Resource value={topics}>
            {() => (
              <ClassMaterialForm
                key={`${classId}:${editor.materialId || 'new'}`}
                initial={editor}
                topics={itemsOf(topics.data)}
                busy={action.busy}
                onSave={async (topicId, data) => {
                  if (!itemsOf(topics.data).some((row) => row.topicId === topicId)) {
                    action.setError('Chọn chủ đề của lớp.');
                    return;
                  }
                  data.set('scope', 'CLASS');
                  data.set('classId', classId);
                  data.set('topicId', topicId);
                  const result = await action.run(
                    () =>
                      editor.materialId
                        ? api.materials.update(topicId, editor.materialId, data)
                        : api.materials.createForClass(classId, topicId, data),
                    'Đã lưu học liệu.'
                  );
                  if (result.ok) {
                    materials.reload();
                    close();
                  }
                }}
                onError={action.setError}
              />
            )}
          </Resource>
        </Container>
      )}
      {preview && (
        <Modal title={preview.title} onClose={() => setPreview(null)}>
          <StatusBadge status={preview.approvalStatus} />
          {preview.contentText && <MarkdownContent content={preview.contentText} />}
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => navigate(queryPath('lecturer_course_detail.html', { classId }))}
          >
            Về lớp học
          </Button>
        </Modal>
      )}
    </LecturerPageShell>
  );
}
function ClassMaterialForm({ initial, topics, busy, onSave, onError }) {
  const [type, setType] = useState(initial.type || 'MARKDOWN');
  return (
    <Form
      className="authoring-grouped-form"
      busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        if (!data.get('file')?.size) data.delete('file');
        const error = validateVideoMaterial(data, initial);
        if (error) {
          onError(error);
          return;
        }
        onSave(data.get('topicId'), data);
      }}
    >
      <SelectField
        name="topicId"
        label="Chủ đề"
        required
        defaultValue={initial.topicId || ''}
        disabled={busy || Boolean(initial.materialId)}
      >
        <option value="">Chọn chủ đề</option>
        {topics.map((row) => (
          <option key={row.topicId} value={row.topicId}>
            {row.topicName}
          </option>
        ))}
      </SelectField>
      {initial.materialId && <input type="hidden" name="topicId" value={initial.topicId} />}
      <Field label="Tiêu đề" name="title" defaultValue={initial.title || ''} required disabled={busy} />
      <SelectField label="Định dạng" name="type" value={type} onChange={(e) => setType(e.target.value)} disabled={busy}>
        {materialFormats.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <MaterialContentFields key={type} type={type} initial={initial} busy={busy} />
      {type !== 'VIDEO' && (
        <Field
          label="Nguồn tham khảo"
          name="sourceCitation"
          defaultValue={initial.sourceCitation || ''}
          disabled={busy}
        />
      )}
      <SubmitButton disabled={busy}>Lưu học liệu</SubmitButton>
    </Form>
  );
}
