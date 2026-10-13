import React from 'react';
import { Card, Button, Form, FormField, useAction, apiRequest } from '../shared/LmsUi.jsx';
import { downloadBlob } from '../shared/downloadFile.js';
export function ImportResult({result}) {
 if(!result)return null;
 return <Card className="space-y-3 p-5" role="status"><p>Đã tạo {result.totalCreated??0} · Ghi danh {result.totalEnrolled??0} · Bỏ qua {result.totalSkipped??0} / {result.totalRows??0} dòng</p>{[...(result.warnings||[]),...(result.errors||[])].length>0&&<ul className="list-disc space-y-2 pl-5 text-red-700">{[...(result.warnings||[]),...(result.errors||[])].map((m,i)=><li key={i}>{typeof m==='string'?m:m.message||`Dòng ${m.rowNumber??'—'} không hợp lệ`}</li>)}</ul>}</Card>;
}
export function StudentImport({classId,onSaved}) {
 const action=useAction();const [result,setResult]=React.useState(null);
 return <section className="space-y-4">{action.feedback}<Button variant="secondary" disabled={action.busy} onClick={()=>action.run(async()=>downloadBlob(await apiRequest(`/api/v1/classes/${classId}/students/import-excel/template`,{responseType:'blob'}),'student-template.xlsx'))}>Tải mẫu Excel</Button><Form className="flex flex-wrap items-end gap-4" onSubmit={async e=>{e.preventDefault();const body=new FormData(e.currentTarget);const r=await action.run(()=>apiRequest(`/api/v1/classes/${classId}/students/import-excel`,{method:'POST',formData:body}));if(r.ok){setResult(r.data);onSaved?.();}}}><FormField label="Tệp sinh viên" name="file" type="file" accept=".xls,.xlsx" required disabled={action.busy}/><Button type="submit" disabled={action.busy}>Import sinh viên</Button></Form><ImportResult result={result}/></section>;
}
