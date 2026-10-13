import React from 'react';
import { LmsShell, LoadState, useLoad, apiRequest, Tabs } from '../shared/LmsUi.jsx';
import { navigate } from '../../lib/navigation.js';
import { CurriculumManager } from './CurriculumManager.jsx';
import { QuestionPanel } from './QuestionPanel.jsx';
import { SubjectLabs } from '../labs/SubjectLabs.jsx';
export function SubjectPage({ route }) {
 const value=useLoad(()=>apiRequest(`/api/v1/subjects/${encodeURIComponent(route.id)}`),route.id),tab=route.section||'curriculum';
 return <LoadState value={value}>{subject=><LmsShell title={subject.subjectName}><Tabs items={[{id:'curriculum',label:'Khung chương trình'},{id:'banks',label:'Ngân hàng câu hỏi'},{id:'labs',label:'Thí nghiệm'}]} activeId={tab} onChange={id=>navigate(`/admin/subjects/${subject.subjectId}/${id}`)}>{id=>id==='curriculum'?<CurriculumManager subjectId={subject.subjectId}/>:id==='banks'?<QuestionPanel subject={subject}/>:<SubjectLabs subjectId={subject.subjectId}/>}</Tabs></LmsShell>}</LoadState>;
}
