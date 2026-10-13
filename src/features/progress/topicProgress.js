export function progressStatus(rows,topicId,classId) {
 const row=rows.find(p=>p.topicId===topicId&&p.classId===classId);
 return row?.status==='COMPLETED' ? 'COMPLETED' : row?.status==='IN_PROGRESS' ? 'IN_PROGRESS' : 'NOT_STARTED';
}
export function topicPercent(topics,rows,classId) {
 if(!topics.length)return 0;
 return Math.round(100*topics.filter(t=>progressStatus(rows,t.topicId,classId)==='COMPLETED').length/topics.length);
}
export function orderedTopics(chapters,topics) {
 const ids=chapters.slice().sort((a,b)=>(a.orderIndex||0)-(b.orderIndex||0)).map(c=>c.chapterId);
 return topics.slice().sort((a,b)=>{
  const ai=ids.indexOf(a.chapterId),bi=ids.indexOf(b.chapterId);
  return (ai<0?ids.length:ai)-(bi<0?ids.length:bi)||(a.orderIndex||0)-(b.orderIndex||0);
 });
}
export function continueTopic(topics,rows,classId) {
 const pending=topics.filter(t=>progressStatus(rows,t.topicId,classId)!=='COMPLETED');
 const recent=rows.filter(p=>p.classId===classId&&p.status!=='COMPLETED'&&pending.some(t=>t.topicId===p.topicId)).sort((a,b)=>(Date.parse(b.lastAccessedAt)||0)-(Date.parse(a.lastAccessedAt)||0))[0];
 return pending.find(t=>t.topicId===recent?.topicId)||pending[0]||topics[0];
}
export function materialScopes(materials,classId) {
 const approved=materials.filter(m=>m.approvalStatus==='APPROVED');
 return {shared:approved.filter(m=>m.scope==='SHARED'),classMaterials:approved.filter(m=>m.scope==='CLASS'&&m.classId===classId)};
}
