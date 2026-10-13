import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLmsRoute } from '../src/routes/resolveLmsRoute.js';
import { provisionClass } from '../src/features/classes/classProvisioning.js';
test('nested routes preserve identifiers and reject unsupported actions',()=>{
  assert.equal(resolveLmsRoute('/student/classes/c1/learn/t2').topicId,'t2');
  assert.equal(resolveLmsRoute('/teacher/classes/new').valid,false);
  assert.equal(resolveLmsRoute('/teacher/classes/c1/delete').valid,false);
  assert.equal(resolveLmsRoute('/admin/classes/c1/learn/t1').valid,false);
  assert.equal(resolveLmsRoute('/admin/subjects/s1/banks').role,'ADMIN');
  assert.equal(resolveLmsRoute('/exam_session'),null);
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
