import React, { useState } from 'react';
import { Card, Button, Form, FormField, SelectField, FormDialog, Table, useLoad, useAction, LoadState, all, apiRequest } from '../shared/LmsUi.jsx';
import { MaterialContentFields, materialFormats } from '../../components/MaterialContentFields.jsx';
import { MaterialFilePreview } from '../../components/MaterialFilePreview.jsx';
import { MaterialSource } from '../../components/MaterialSource.jsx';
import { MarkdownContent } from '../../components/MarkdownContent.jsx';
import { validateVideoMaterial } from '../../lib/materialSources.js';
import { getDemoSession } from '../../lib/demoSession.js';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';

export function MaterialViewer({ material }) {
  return <article className="space-y-4"><h3 className="font-semibold">{material.title}</h3>
    {material.type === 'MARKDOWN' && material.contentText ? <MarkdownContent content={material.contentText} /> : material.contentText ? <p className="whitespace-pre-wrap break-words">{material.contentText}</p> : null}
    {(material.type === 'VIDEO' || material.fileUrl || material.fileId) && <MaterialFilePreview material={material} />}
    {material.sourceCitation && <MaterialSource value={material.sourceCitation} />}
  </article>;
}
export function MaterialEditor({ subjectId, topics, scope = 'SHARED', classId, initial = {}, onClose, onSaved }) {
  const [topicId, setTopicId] = useState(initial.topicId || topics[0]?.topicId || '');
  const [type, setType] = useState(initial.type || 'MARKDOWN');
  const action = useAction();
  async function save(e) {
    e.preventDefault();
    const body = new FormData(e.currentTarget);
    body.set('topicId', topicId); body.set('type', type);
    if (!initial.materialId) { body.set('scope', scope); if (classId) body.set('classId', classId); }
    if (!body.get('file')?.size) body.delete('file');
    const result = await action.run(async () => {
      if (!topics.some(t => t.topicId === topicId)) throw new Error('Chọn chủ đề trong môn học.');
      const error = validateVideoMaterial(body, initial); if (error) throw new Error(error);
      const path = initial.materialId ? `/api/v1/topics/${topicId}/materials/${initial.materialId}` : scope === 'CLASS' ? `/api/v1/classes/${classId}/topics/${topicId}/materials` : `/api/v1/topics/${topicId}/materials`;
      return apiRequest(path, { method: initial.materialId ? 'PUT' : 'POST', formData: body });
    });
    if (result.ok) onSaved(result.data);
  }
  return <FormDialog wide title={initial.materialId ? 'Sửa học liệu' : 'Thêm học liệu'} busy={action.busy} onClose={onClose}>
    <Form onSubmit={save} className="space-y-4">{action.feedback}<fieldset disabled={action.busy} className="space-y-4">
      <SelectField label="Chủ đề" required value={topicId} disabled={Boolean(initial.materialId)} onChange={e => setTopicId(e.target.value)}><option value="">Chọn chủ đề</option>{topics.map(t => <option key={t.topicId} value={t.topicId}>{t.topicName}</option>)}</SelectField>
      <FormField label="Tiêu đề" name="title" defaultValue={initial.title || ''} required />
      <SelectField label="Định dạng" value={type} onChange={e => setType(e.target.value)}>{materialFormats.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</SelectField>
      <MaterialContentFields key={type} type={type} initial={initial} busy={action.busy} />
      {type !== 'VIDEO' && <FormField label="Nguồn tham khảo" name="sourceCitation" defaultValue={initial.sourceCitation || ''} />}
      <Button type="submit" disabled={!topicId || action.busy}>Lưu học liệu</Button>
    </fieldset></Form>
  </FormDialog>;
}
export function MaterialPanel({ subjectId, classId, topics, scope = 'SHARED', ownOnly = false, fixedTopicId }) {
  const [editor, setEditor] = useState(null), [preview, setPreview] = useState(null), [deleting, setDeleting] = useState(null);
  const action = useAction();
  const value = useLoad(async () => {
    const rows = classId ? await all(`/api/v1/classes/${classId}/materials`) : (await Promise.all(topics.map(t => all(`/api/v1/topics/${t.topicId}/materials`)))).flat();
    return rows.filter(m => m.scope === scope && (!classId || scope !== 'CLASS' || m.classId === classId) && (!ownOnly || m.createdBy === getDemoSession()?.userId) && (!fixedTopicId || m.topicId === fixedTopicId));
  }, JSON.stringify([subjectId,classId,scope,ownOnly,fixedTopicId,topics.map(t => t.topicId)]));
  const canEdit = row => getDemoSession()?.role === 'ADMIN' || row.createdBy === getDemoSession()?.userId;
  return <section className="space-y-4">{!deleting && action.feedback}<Button disabled={!topics.length} onClick={() => setEditor(fixedTopicId ? { topicId: fixedTopicId } : {})}>Thêm học liệu</Button>
    <LoadState value={value}>{rows => <Table columns={['Học liệu', 'Chủ đề', 'Trạng thái', '']} rows={rows} cells={m => [m.title, topics.find(t => t.topicId === m.topicId)?.topicName || '—', m.approvalStatus, <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setPreview(m)}>Xem</Button>{canEdit(m) && <><Button variant="secondary" onClick={() => setEditor(m)}>Sửa</Button><Button variant="ghost" onClick={() => setDeleting(m)}>Xóa</Button></>}</div>]} />}</LoadState>
    {editor && <MaterialEditor subjectId={subjectId} classId={classId} scope={scope} topics={fixedTopicId ? topics.filter(t => t.topicId === fixedTopicId) : topics} initial={editor} onClose={() => setEditor(null)} onSaved={() => {setEditor(null); value.reload();}} />}
    {preview && <FormDialog reader title={preview.title} onClose={() => setPreview(null)}><div className="overflow-auto p-5"><MaterialViewer material={preview} /></div></FormDialog>}
    {deleting && <ConfirmDialog title="Xóa học liệu?" description={<>{deleting.title}{action.feedback}</>} busy={action.busy} onCancel={() => setDeleting(null)} onConfirm={async () => { const r=await action.run(()=>apiRequest(`/api/v1/topics/${deleting.topicId}/materials/${deleting.materialId}`,{method:'DELETE'})); if(r.ok){setDeleting(null);value.reload();} }} />}
  </section>;
}
