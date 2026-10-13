import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLmsRoute } from '../src/routes/resolveLmsRoute.js';
import { provisionClass } from '../src/features/classes/classProvisioning.js';
import { topicPercent, materialScopes, continueTopic } from '../src/features/progress/topicProgress.js';
test('nested routes preserve identifiers and reject unsupported actions',()=>{
  assert.equal(resolveLmsRoute('/student/classes/c1/learn/t2').topicId,'t2');
  assert.equal(resolveLmsRoute('/teacher/classes/new').valid,false);
  assert.equal(resolveLmsRoute('/teacher/classes/c1/delete').valid,false);
  assert.equal(resolveLmsRoute('/admin/classes/c1/learn/t1').valid,false);
  assert.equal(resolveLmsRoute('/admin/subjects/s1/banks').role,'ADMIN');
  assert.equal(resolveLmsRoute('/exam_session'),null);
});
test('topic progress counts completed topics across unequal chapters and excludes other classes',()=>{
 const topics=[{topicId:'t1',chapterId:'a'},{topicId:'t2',chapterId:'b'},{topicId:'t3',chapterId:'b'}];
 const rows=[{topicId:'t1',classId:'c1',status:'COMPLETED'},{topicId:'t2',classId:'c1',status:'IN_PROGRESS',progressPercent:99},{topicId:'t3',classId:'c2',status:'COMPLETED'}];
 assert.equal(topicPercent(topics,rows,'c1'),33);
 assert.equal(topicPercent([],rows,'c1'),0);
 assert.equal(topicPercent(topics.slice(1),rows,'c1'),0);
});
test('scope adapter separates approved curriculum from only this class supplements',()=>{
 const scopes=materialScopes([{materialId:'shared',scope:'SHARED',approvalStatus:'APPROVED'},{materialId:'own',scope:'CLASS',classId:'c1',approvalStatus:'APPROVED'},{materialId:'other',scope:'CLASS',classId:'c2',approvalStatus:'APPROVED'},{materialId:'pending',scope:'CLASS',classId:'c1',approvalStatus:'PENDING'}],'c1');
 assert.deepEqual(scopes.shared.map(m=>m.materialId),['shared']);
 assert.deepEqual(scopes.classMaterials.map(m=>m.materialId),['own']);
});
test('continue learning selects recent unfinished topic in the current class and curriculum',()=>{
 const topics=[{topicId:'t1'},{topicId:'t2'},{topicId:'t3'}];
 const rows=[{topicId:'t1',classId:'c1',status:'COMPLETED'},{topicId:'t2',classId:'c1',status:'IN_PROGRESS',lastAccessedAt:'2026-01-01'},{topicId:'t3',classId:'c1',status:'IN_PROGRESS',lastAccessedAt:'2026-02-01'},{topicId:'foreign',classId:'c1',status:'IN_PROGRESS',lastAccessedAt:'2026-03-01'}];
 assert.equal(continueTopic(topics,rows,'c1').topicId,'t3');
 assert.equal(continueTopic(topics,rows,'c2').topicId,'t1');
});
test('failed enrollment retries the created class without creating another class',async()=>{
 const calls=[];let savedId,fail=true;
 const request=async(path,opts)=>{calls.push({path,opts});if(path==='/api/v1/classes')return {classId:'new-class'};if(fail)throw Error('BE enrollment failed');};
 const draft={subjectId:'s1',semesterId:'sem1',instructorId:'i1',classCode:'VL01',studentIds:['u1']};
 await assert.rejects(()=>provisionClass(request,draft,null,id=>savedId=id),/BE enrollment/);
 fail=false;
 await provisionClass(request,draft,savedId,()=>assert.fail('must not create again'));
 assert.equal(calls.filter(c=>c.path==='/api/v1/classes').length,1);
 assert.deepEqual(calls.at(-1).opts.body,{studentIds:['u1']});
 assert.equal(savedId,'new-class');
});
