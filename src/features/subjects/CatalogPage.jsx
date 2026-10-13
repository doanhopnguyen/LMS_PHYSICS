import React, { useState } from 'react';
import { LmsShell, Card, Button, Form, FormField, FormDialog, Table, useList, useAction, LoadState, apiRequest } from '../shared/LmsUi.jsx';
export function CatalogPage({ kind }) {
  const semester = kind === 'semesters', label = semester ? 'Học kỳ' : 'Môn học', stem = semester ? 'semester' : 'subject';
  const value = useList(`/api/v1/${kind}`), action = useAction();
  const [editor,setEditor]=useState(null), [query,setQuery]=useState('');
  async function save(e) {
    e.preventDefault(); const body=Object.fromEntries(new FormData(e.currentTarget));
    if(semester && body.startDate>body.endDate) return action.run(()=>{throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');});
    const r=await action.run(()=>apiRequest(`/api/v1/${kind}${editor[`${stem}Id`] ? '/'+editor[`${stem}Id`] : ''}`,{method:editor[`${stem}Id`]?'PUT':'POST',body}));
    if(r.ok){setEditor(null);value.reload();}
  }
  return <LmsShell title={label}><div className="flex flex-wrap gap-4"><FormField label="Tìm kiếm" value={query} onChange={e=>setQuery(e.target.value)} /><Button onClick={()=>setEditor({})}>Thêm {label.toLowerCase()}</Button></div>{!editor && action.feedback}
    <LoadState value={value}>{rows=><Table columns={['Mã','Tên','Trạng thái','']} rows={rows.filter(r=>`${r[`${stem}Name`]} ${r[`${stem}Code`]}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))} cells={r=>[r[`${stem}Code`],semester?r.semesterName:<a className="text-primary" href={`/admin/subjects/${r.subjectId}/curriculum`}>{r.subjectName}</a>,semester?(r.isCurrent?'Hiện hành':'—'):(r.isActive?'Hoạt động':'Tạm ngưng'),<div className="flex gap-2"><Button variant="secondary" onClick={()=>setEditor(r)}>Sửa</Button><Button variant="secondary" disabled={action.busy || (semester && r.isCurrent)} onClick={async()=>{const x=await action.run(()=>apiRequest(`/api/v1/${kind}/${r[`${stem}Id`]}/${semester?'set-current':'toggle-status'}`,{method:'PUT'}));if(x.ok)value.reload();}}>{semester?'Đặt hiện hành':r.isActive?'Tạm ngưng':'Kích hoạt'}</Button></div>]} />}</LoadState>
    {editor && <FormDialog title={editor[`${stem}Id`]?`Sửa ${label.toLowerCase()}`:`Thêm ${label.toLowerCase()}`} onClose={()=>setEditor(null)} busy={action.busy}><Form onSubmit={save} className="space-y-4">{action.feedback}<fieldset disabled={action.busy} className="space-y-4">
      {!editor[`${stem}Id`] && <FormField label="Mã" name={`${stem}Code`} required />}
      <FormField label="Tên" name={`${stem}Name`} defaultValue={editor[`${stem}Name`]||''} required />
      {semester ? <><FormField label="Năm học" name="academicYear" defaultValue={editor.academicYear||''} required /><FormField label="Bắt đầu" name="startDate" type="date" defaultValue={editor.startDate||''} required /><FormField label="Kết thúc" name="endDate" type="date" defaultValue={editor.endDate||''} required /></>:<FormField label="Mô tả" name="description" multiline defaultValue={editor.description||''} />}
      <Button type="submit" disabled={action.busy}>Lưu</Button></fieldset></Form></FormDialog>}
  </LmsShell>;
}
