import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const origin = 'http://127.0.0.1:18080';
const results = [];
async function request(path, token, method = 'GET', body) {
  const multipart = body instanceof FormData;
  const response = await fetch(origin + path, {
    method, headers: { ...(token ? {Authorization: `Bearer ${token}`} : {}), ...(!multipart && body !== undefined ? {'Content-Type':'application/json'} : {}) },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  let payload; try { payload = JSON.parse(text); } catch { payload = {message:text}; }
  return { status:response.status, data:payload.data, message:payload.message, payload };
}
async function signin(username) {
  const r = await request('/api/v1/users/signin', null, 'POST', {username,password:username+'123456'});
  assert.equal(r.status,200, 'signin '+username); return r.data.accessToken;
}
const tokens = {};
for (const user of ['admin','gv_nguyen','gv_tran','ta_hung','sv_an','sv_binh','sv_cuong']) tokens[user] = await signin(user);
const myClasses = await request('/api/v1/students/me/classes?size=100',tokens.sv_an);
const classes = myClasses.data.content;
const classInfo = classes.find(c=>c.classCode==='PHY101-01') || classes[0];
const seedExperiments = (await request('/api/v1/experiments',tokens.admin)).data;
await writeFile('.tmp-comprehensive-test/seed-experiments.json',JSON.stringify(seedExperiments,null,2));
const created = await request('/api/v1/experiments',tokens.admin,'POST',{
  subjectId:classInfo.subjectId,title:'QA isolated lab '+Date.now(),instructions:'QA original instructions',
  sceneAssetUrl:'about:blank',sceneAssetsJson:{rubric:[{criteria:'QA measurement',max_score:4},{criteria:'QA analysis',max_score:6}]},
});
assert.equal(created.status,201);
const experimentId = created.data.experimentId;
const assigned = await request(`/api/v1/experiments/${experimentId}/assign`,tokens.gv_nguyen,'POST',{
  classId:classInfo.classId,dueDate:new Date(Date.now()+86400000).toISOString(),instructionsOverride:'QA class-specific instructions',
});
assert.equal(assigned.status,201);
const assignmentId = assigned.data.assignmentId;
await writeFile('.tmp-comprehensive-test/fixture.json',JSON.stringify({experimentId,assignmentId,classId:classInfo.classId,subjectId:classInfo.subjectId},null,2));
async function probe(id,description,expected,action,check) {
  try {
    const actual = await action(); const passed = check(actual);
    results.push({id,description,expected,passed,actual});
    console.log(`${passed?'PASS':'FAIL'} ${id}: ${description} ${JSON.stringify(actual)}`);
  } catch (error) { results.push({id,description,expected,passed:false,error:error.message}); console.log(`ERROR ${id}: ${error.message}`); }
}
const submitPath=`/api/v1/experiments/assignments/${assignmentId}/submit`;
const form = (raw=true)=>{const f=new FormData();f.append('evidenceUrl','https://example.test/qa-report');if(raw)f.append('rawDataJson',new Blob([JSON.stringify({measurements:[1.2,1.3],unit:'m'})],{type:'application/json'}));return f;};
await probe('LAB-RAW-BLOB','Frontend multipart JSON Blob is accepted and saved', '200 and matching rawDataJson', async()=>{
  const submitted=await request(submitPath,tokens.sv_an,'POST',form());
  const list=await request(`/api/v1/experiments/assignments/${assignmentId}/submissions`,tokens.admin);
  return {status:submitted.status,message:submitted.message,rawDataJson:list.data?.[0]?.rawDataJson};
},r=>r.status===200 && r.rawDataJson?.measurements?.[0]===1.2);
await probe('LAB-EMPTY','Empty report is rejected','4xx',async()=>{const f=new FormData();f.append('evidenceUrl','');const r=await request(submitPath,tokens.sv_an,'POST',f);return {status:r.status,message:r.message};},r=>r.status>=400 && r.status<500);
const fileForm = new FormData();fileForm.append('file',new Blob(['QA synthetic report'],{type:'application/pdf'}),'qa-report.pdf');
const fileSubmit=await request(submitPath,tokens.sv_an,'POST',fileForm);
assert.equal(fileSubmit.status,200,'file-only submission');
let list=(await request(`/api/v1/experiments/assignments/${assignmentId}/submissions`,tokens.admin)).data;
const submission=list.find(s=>s.fileId) || list.at(-1);
const submissionId=submission.submissionId;
await writeFile('.tmp-comprehensive-test/fixture.json',JSON.stringify({experimentId,assignmentId,classId:classInfo.classId,subjectId:classInfo.subjectId,submissionId},null,2));
const rubricSummary=(await request(`/api/v1/experiments/submissions/${submissionId}/rubric-summary`,tokens.admin)).data;
const rubrics=rubricSummary.rubrics;
await probe('LAB-STUDENT-IDOR','Other student cannot read a submission','403',async()=>{const r=await request(`/api/v1/experiments/submissions/${submissionId}`,tokens.sv_binh);return {status:r.status};},r=>r.status===403);
await probe('LAB-STUDENT-GRADE','Student cannot grade','403',async()=>{const r=await request(`/api/v1/experiments/submissions/${submissionId}/scores`,tokens.sv_an,'POST',{rubricId:rubrics[0].rubricId,score:2});return {status:r.status};},r=>r.status===403);
await probe('LAB-OUTSIDER-READ','Instructor outside the assigned class cannot read student report','403',async()=>{const r=await request(`/api/v1/experiments/submissions/${submissionId}`,tokens.gv_tran);return {status:r.status};},r=>r.status===403);
await probe('LAB-OUTSIDER-GRADE','Instructor outside the assigned class cannot change marks','403',async()=>{const r=await request(`/api/v1/experiments/submissions/${submissionId}/scores`,tokens.gv_tran,'POST',{rubricId:rubrics[0].rubricId,score:1});return {status:r.status};},r=>r.status===403);
await probe('LAB-SCORE-BOUNDS','Reject score higher than rubric maximum','400',async()=>{const r=await request(`/api/v1/experiments/submissions/${submissionId}/scores`,tokens.gv_nguyen,'POST',{rubricId:rubrics[0].rubricId,score:100});return {status:r.status};},r=>r.status===400);
await probe('LAB-UNKNOWN-RUBRIC','Reject unknown rubric cleanly','400 or 404',async()=>{const r=await request(`/api/v1/experiments/submissions/${submissionId}/scores`,tokens.gv_nguyen,'POST',{rubricId:randomUUID(),score:999});return {status:r.status,message:r.message};},r=>[400,404].includes(r.status));
const otherRubrics=(await request(`/api/v1/experiments/${seedExperiments[0].experimentId}/rubrics`,tokens.admin)).data;
await probe('LAB-WRONG-RUBRIC','Rubric from another experiment cannot be applied','400 or 404',async()=>{const r=await request(`/api/v1/experiments/submissions/${submissionId}/scores`,tokens.gv_nguyen,'POST',{rubricId:otherRubrics[0].rubricId,score:1});return {status:r.status,message:r.message};},r=>[400,404].includes(r.status));
for (const rubric of rubrics) assert.equal((await request(`/api/v1/experiments/submissions/${submissionId}/scores`,tokens.ta_hung,'POST',{rubricId:rubric.rubricId,score:0,comment:'QA zero score'})).status,200);
await probe('LAB-ZERO','Saved zero scores are recognized as graded','all rubrics graded, totalScore 0',async()=>{const r=await request(`/api/v1/experiments/submissions/${submissionId}/rubric-summary`,tokens.gv_nguyen);return {totalScore:r.data.totalScore,rubrics:r.data.rubrics.map(x=>({score:x.score,isGraded:x.isGraded}))};},r=>r.totalScore===0 && r.rubrics.every(x=>x.isGraded&&x.score===0));
await probe('LAB-TA-CONFIRM','TA cannot finalize marks','403',async()=>{const r=await request(`/api/v1/experiments/submissions/${submissionId}/confirmation`,tokens.ta_hung,'POST',{note:'QA'});return {status:r.status};},r=>r.status===403);
assert.equal((await request(`/api/v1/experiments/submissions/${submissionId}/confirmation`,tokens.gv_nguyen,'POST',{note:'QA complete'})).status,200);
await probe('LAB-CONFIRMED-LOCK','Confirmed submission cannot be regraded','400',async()=>{const r=await request(`/api/v1/experiments/submissions/${submissionId}/scores`,tokens.gv_nguyen,'POST',{rubricId:rubrics[0].rubricId,score:2});return {status:r.status};},r=>r.status===400);
await probe('LAB-CONFIRMED-RESUBMIT','Observe resubmission behavior after confirmation','observation only',async()=>{const r=await request(submitPath,tokens.sv_an,'POST',form(false));const items=(await request(`/api/v1/experiments/assignments/${assignmentId}/submissions`,tokens.admin)).data;return {status:r.status,count:items.length,statuses:items.map(x=>x.status)};},()=>true);
const pending= (await request(`/api/v1/experiments/assignments/${assignmentId}/submissions`,tokens.admin)).data.find(s=>s.status==='PENDING');
await probe('LAB-INCOMPLETE-CONFIRM','Cannot finalize a report with ungraded rubrics','400',async()=>{const r=await request(`/api/v1/experiments/submissions/${pending.submissionId}/confirmation`,tokens.gv_nguyen,'POST',{note:'QA no grading'});return {status:r.status};},r=>r.status===400);
for (const experiment of seedExperiments) {
  await probe('LAB-SCENE-'+experiment.orderIndex,'Simulation URL loads: '+experiment.title,'HTTP 2xx or 3xx',async()=>{
    try {const r=await fetch(experiment.sceneAssetUrl,{signal:AbortSignal.timeout(10000)});return {url:experiment.sceneAssetUrl,status:r.status};}
    catch(e){return {url:experiment.sceneAssetUrl,error:e.cause?.code || e.message};}
  },r=>r.status>=200&&r.status<400);
}
await writeFile('.tmp-comprehensive-test/backend-probes-results.json',JSON.stringify(results,null,2));
console.log(`TOTAL ${results.length}; PASS ${results.filter(x=>x.passed).length}; FAIL ${results.filter(x=>!x.passed).length}`);
