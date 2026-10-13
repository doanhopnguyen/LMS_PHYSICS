import React, { useState } from 'react';
import { api } from '../../lib/apiClient.js';
import { Form, SubmitButton } from '../../components/Form.jsx';
import {
  Button,
  Card,
  Field,
  Lookup,
  Modal,
  Resource,
  SelectField,
  Table,
  itemsOf,
  useMutation,
  useResource,
} from '../lecturers/LecturerShared.jsx';

export function AdminCurriculum({ kind }) {
  const [subjectId, setSubjectId] = useState('');
  const [editor, setEditor] = useState(null);
  const action = useMutation();
  const subjects = useResource('/api/v1/subjects', true);
  const chapters = useResource(subjectId ? `/api/v1/subjects/${subjectId}/chapters` : null);
  const clos = useResource(subjectId ? `/api/v1/subjects/${subjectId}/clos` : null);
  const topics = useResource(subjectId ? `/api/v1/subjects/${subjectId}/topics` : null);
  const isChapter = kind === 'chapters';
  const rows = isChapter ? chapters : clos;
  const idKey = isChapter ? 'chapterId' : 'cloId';
  const codeKey = isChapter ? 'chapterCode' : 'cloCode';
  const codeLabel = isChapter ? 'Mã chương' : 'Mã CLO';
  const service = isChapter ? api.chapters : api.clos;
  const moveTopic = async (chapterId, topicId, offset) => {
    const group = itemsOf(topics.data)
      .filter((row) => row.chapterId === chapterId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const i = group.findIndex((row) => row.topicId === topicId);
    if (i + offset < 0 || i + offset >= group.length) return;
    [group[i], group[i + offset]] = [group[i + offset], group[i]];
    const result = await action.run(() =>
      api.chapters.reorderTopics(
        chapterId,
        group.map((row) => row.topicId)
      )
    );
    if (result.ok) topics.reload();
  };
  return (
    <div>
      {action.feedback}
      <Card className="mt-5 flex flex-wrap items-end gap-4 p-5">
        <Lookup
          label="Môn học"
          resource={subjects}
          idKey="subjectId"
          value={subjectId}
          onChange={(id) => {
            setSubjectId(id);
            setEditor(null);
            action.clear();
          }}
        />
        <Button disabled={!subjectId || action.busy} onClick={() => setEditor({})}>
          Thêm {isChapter ? 'chương' : 'CLO'}
        </Button>
      </Card>
      <Resource value={rows}>
        {(data) => (
          <Table
            rows={itemsOf(data)}
            columns={['Mã', 'Nội dung', 'Thứ tự', 'Trạng thái', '']}
            cells={(row) => [
              row[codeKey],
              isChapter ? row.chapterName : row.description,
              row.orderIndex,
              row.isActive ? 'Hoạt động' : 'Tạm ngưng',
              <div className="flex gap-2">
                <Button variant="secondary" disabled={action.busy} onClick={() => setEditor(row)}>
                  Sửa
                </Button>
                <Button
                  variant="ghost"
                  disabled={action.busy}
                  onClick={() => action.confirm('Xóa mục này?', () => service.remove(row[idKey]), rows.reload)}
                >
                  Xóa
                </Button>
              </div>,
            ]}
          />
        )}
      </Resource>
      {isChapter && subjectId && (
        <Resource value={chapters}>
          {() => (
            <Resource value={topics}>
              {(data) => (
                <Table
                  rows={itemsOf(data)}
                  columns={['Chủ đề', 'Chương', 'Thứ tự']}
                  cells={(row) => [
                    row.topicName,
                    <SelectField
                      label="Chương"
                      aria-label={`Chương của ${row.topicName}`}
                      value={row.chapterId || ''}
                      disabled={action.busy}
                      onChange={async (e) => {
                        const result = await action.run(() => api.chapters.assignTopic(row.topicId, e.target.value));
                        if (result.ok) topics.reload();
                      }}
                    >
                      <option value="">Chưa phân chương</option>
                      {itemsOf(chapters.data).map((chapter) => (
                        <option key={chapter.chapterId} value={chapter.chapterId}>
                          {chapter.chapterName}
                        </option>
                      ))}
                    </SelectField>,
                    row.chapterId ? (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          aria-label={`Đưa ${row.topicName} lên`}
                          disabled={action.busy}
                          onClick={() => moveTopic(row.chapterId, row.topicId, -1)}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="secondary"
                          aria-label={`Đưa ${row.topicName} xuống`}
                          disabled={action.busy}
                          onClick={() => moveTopic(row.chapterId, row.topicId, 1)}
                        >
                          ↓
                        </Button>
                      </div>
                    ) : (
                      '—'
                    ),
                  ]}
                />
              )}
            </Resource>
          )}
        </Resource>
      )}
      {editor && (
        <Modal
          title={editor[idKey] ? 'Cập nhật' : `Thêm ${isChapter ? 'chương' : 'CLO'}`}
          busy={action.busy}
          onClose={() => setEditor(null)}
        >
          <Form
            className="grid gap-4"
            busy={action.busy}
            onSubmit={async (e) => {
              e.preventDefault();
              const raw = Object.fromEntries(new FormData(e.currentTarget));
              const body = { ...raw, orderIndex: Number(raw.orderIndex), isActive: raw.isActive === 'true' };
              const result = await action.run(() =>
                editor[idKey] ? service.update(editor[idKey], body) : service.create(subjectId, body)
              );
              if (result.ok) {
                setEditor(null);
                rows.reload();
              }
            }}
          >
            <Field label={codeLabel} name={codeKey} defaultValue={editor[codeKey] || ''} maxLength={50} required />
            {isChapter && (
              <Field
                label="Tên chương"
                name="chapterName"
                defaultValue={editor.chapterName || ''}
                maxLength={255}
                required
              />
            )}
            <Field
              label="Nội dung"
              name="description"
              multiline
              defaultValue={editor.description || ''}
              required={!isChapter}
            />
            <Field
              label="Thứ tự"
              name="orderIndex"
              type="number"
              min={0}
              step={1}
              defaultValue={editor.orderIndex || 0}
              required
            />
            <SelectField label="Trạng thái" name="isActive" defaultValue={String(editor.isActive !== false)}>
              <option value="true">Hoạt động</option>
              <option value="false">Tạm ngưng</option>
            </SelectField>
            <SubmitButton disabled={action.busy}>Lưu</SubmitButton>
          </Form>
        </Modal>
      )}
    </div>
  );
}
