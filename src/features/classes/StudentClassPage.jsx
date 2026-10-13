import React from 'react';
import {LmsShell,Card,Table,LoadState,useLoad,all} from '../shared/LmsUi.jsx';
import {ProgressBar} from '../../components/ProgressBar.jsx';
import {ClassTabs} from './ClassTabs.jsx';
import {StudentLearning} from '../materials/StudentLearning.jsx';
import {continueTopic,orderedTopics,topicPercent} from '../progress/topicProgress.js';
export function StudentClassPage({route,cls}){
 if(route.section==='learn')return <StudentLearning route={route} cls={cls}/>;
 return <StudentClassContent route={route} cls={cls}/>;
}
function StudentClassContent({route,cls}){
 const value=useLoad(async()=>{const [chapters,topics,progress,exams,labs]=await Promise.all([all(`/api/v1/subjects/${cls.subjectId}/chapters`),all(`/api/v1/subjects/${cls.subjectId}/topics`),all(`/api/v1/students/me/progress?classId=${cls.classId}`),all(`/api/v1/exams/class/${cls.classId}`),all('/api/v1/students/me/experiment-assignments')]);return{chapters,topics,progress,exams,labs:labs.filter(l=>l.classId===cls.classId)};},cls.classId);
 return <LmsShell title={cls.classCode}><ClassTabs route={route}><LoadState value={value}>{data=>{const topics=orderedTopics(data.chapters,data.topics),next=continueTopic(topics,data.progress,cls.classId),percent=topicPercent(topics,data.progress,cls.classId);return <div className="space-y-4 pt-4">{!route.section&&<><Card className="space-y-4 p-5"><p>Tiến trình {percent}%</p><ProgressBar value={percent}/>{next&&<a className="text-primary font-semibold" href={`/student/classes/${cls.classId}/learn/${next.topicId}`}>Tiếp tục học</a>}</Card><h2 className="font-semibold">Bài sắp đến hạn</h2><Table columns={['Bài','Hạn']} rows={[...data.exams.filter(e=>e.endTime&&Date.parse(e.endTime)>Date.now()).map(e=>({title:e.title,due:e.endTime,href:`/exam_session?classId=${cls.classId}&examId=${e.examId}`})),...data.labs.filter(l=>!l.submittedAt&&l.dueDate&&Date.parse(l.dueDate)>Date.now()).map(l=>({title:l.experimentTitle,due:l.dueDate,href:`/lab_report_rubric?classId=${cls.classId}&experimentId=${l.experimentId}&assignmentId=${l.assignmentId}`}))].sort((a,b)=>Date.parse(a.due)-Date.parse(b.due))} cells={r=>[<a className="text-primary" href={r.href}>{r.title}</a>,new Date(r.due).toLocaleString('vi-VN')]}/></>}
 {route.section==='assignments'&&<Table columns={['Bài','Loại','Thời lượng','']} rows={data.exams} cells={e=>[e.title,e.examType,`${e.durationMinutes} phút`,<a className="text-primary" href={`/exam_session?classId=${cls.classId}&examId=${e.examId}`}>Mở bài</a>]}/>}
 {route.section==='labs'&&<Table columns={['Thí nghiệm','Hạn nộp','Trạng thái','']} rows={data.labs} cells={l=>[l.experimentTitle,l.dueDate?new Date(l.dueDate).toLocaleString('vi-VN'):'—',l.submissionStatus||'Chưa nộp',<div className="flex gap-3"><a className="text-primary" href={`/3d_workspace?classId=${cls.classId}&experimentId=${l.experimentId}&assignmentId=${l.assignmentId}`}>Mô phỏng</a><a className="text-primary" href={`/lab_report_rubric?classId=${cls.classId}&experimentId=${l.experimentId}&assignmentId=${l.assignmentId}`}>Báo cáo</a></div>]}/>}
 {route.section==='grades'&&<><StudentExamGrades exams={data.exams} classId={cls.classId}/><Table columns={['Thí nghiệm','Điểm','Nhận xét']} rows={data.labs} cells={l=>[l.experimentTitle,['GRADED','CONFIRMED'].includes(l.submissionStatus)?l.score??'—':'Chưa chấm',l.feedback]}/></>}
 </div>;}}</LoadState></ClassTabs></LmsShell>;
}
function StudentExamGrades({exams,classId}){
 const value=useLoad(async()=>(await Promise.all(exams.map(e=>all(`/api/v1/exams/${e.examId}/my-attempts`).then(rows=>rows.map(a=>({...a,title:e.title})))))).flat(),exams.map(e=>e.examId).join(','));
 return <LoadState value={value}>{rows=><Table columns={['Bài','Lần làm','Điểm','']} rows={rows} cells={a=>[a.title,a.attemptNumber,a.status==='GRADED'?a.totalScore??'—':'Chưa chấm',<a className="text-primary" href={`/exam_results?classId=${classId}&examId=${a.examId}&attemptId=${a.attemptId}`}>Kết quả</a>]}/>}</LoadState>;
}
