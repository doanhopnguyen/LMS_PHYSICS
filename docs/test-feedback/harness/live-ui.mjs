import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { routeFiles } from '../../../src/lib/routes.js';
const fixture = JSON.parse(await readFile('.tmp-comprehensive-test/fixture.json','utf8'));
const origin='http://127.0.0.1:5188';
const be='http://127.0.0.1:18080';
const target=(await (await fetch('http://127.0.0.1:9340/json')).json()).find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
const pending=new Map();let seq=0;const runtimeErrors=[],network=[],results=[],smoke=[];
socket.addEventListener('message',({data})=>{
 const r=JSON.parse(data);
 if(r.method==='Runtime.exceptionThrown')runtimeErrors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);
 if(r.method==='Network.responseReceived'&&r.params.response.url.includes('/api/'))network.push({url:r.params.response.url,status:r.params.response.status});
 const job=pending.get(r.id);if(job){pending.delete(r.id);r.error?job.reject(new Error(JSON.stringify(r.error))):job.resolve(r.result);}
});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(expr){for(let i=0;i<100;i++){if(await evaluate(expr))return;await pause(100);}throw new Error('Timed out: '+expr);}
async function navigate(path){await send('Page.navigate',{url:origin+'/'+path});await waitFor(`document.querySelector('#root')?.textContent.length>30`);await pause(500);}
async function login(user){
 const r=await fetch(be+'/api/v1/users/signin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:user,password:user+'123456'})});
 const auth=(await r.json()).data;if(!auth?.accessToken)throw new Error('Login '+user+' failed '+r.status);
 const me=await (await fetch(be+'/api/v1/users/me',{headers:{Authorization:'Bearer '+auth.accessToken}})).json();
 await evaluate(`localStorage.setItem('ptit-physics-access-token',${JSON.stringify(auth.accessToken)});localStorage.setItem('ptit-physics-refresh-token',${JSON.stringify(auth.refreshToken)});localStorage.setItem('ptit-physics-demo-session',${JSON.stringify(JSON.stringify(me.data))});`);
 return auth.accessToken;
}
async function api(path,token){return (await (await fetch(be+path,{headers:{Authorization:'Bearer '+token}})).json()).data;}
async function probe(id,description,check,action){try{const actual=await action();const passed=check(actual);results.push({id,description,passed,actual});console.log(`${passed?'PASS':'FAIL'} ${id}: ${JSON.stringify(actual)}`);}catch(e){results.push({id,description,passed:false,error:e.message});console.log(`ERROR ${id}: ${e.message}`);}}
async function setValue(selector,value){await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await pause(50);}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('docs/test-feedback/'+name+'.png',Buffer.from(r.data,'base64'));}
await mkdir('docs/test-feedback',{recursive:true});
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await navigate('login');
const studentToken=await login('sv_an');
const query=`experimentId=${fixture.experimentId}&classId=${fixture.classId}&assignmentId=${fixture.assignmentId}`;
await probe('UI-LAB-CONTEXT','List → simulation → report preserves assignment',r=>r.workspaceAssignment===fixture.assignmentId&&r.reportAssignment===fixture.assignmentId,async()=>{
 await navigate('virtual_lab');await waitFor(`!![...document.querySelectorAll('a[href]')].find(a=>a.href.includes('3d_workspace')&&a.href.includes('${fixture.experimentId}'))`);
 const href=await evaluate(`[...document.querySelectorAll('a[href]')].find(a=>a.href.includes('3d_workspace')&&a.href.includes('${fixture.experimentId}')).getAttribute('href')`);
 await navigate(href);await waitFor(`!!document.querySelector('iframe')`);
 const reportHref=await evaluate(`[...document.querySelectorAll('a[href]')].find(a=>a.href.includes('lab_report_rubric')).getAttribute('href')`);
 await navigate(reportHref);await waitFor(`!!document.querySelector('form textarea')`);
 const result={workspaceAssignment:new URL(href,origin).searchParams.get('assignmentId'),reportAssignment:new URL(reportHref,origin).searchParams.get('assignmentId'),submitDisabled:await evaluate(`document.querySelector('form button[type=submit]').disabled`)};
 await screenshot('lab-lost-assignment');return result;
});
await navigate('lab_report_rubric?'+query);await waitFor(`!!document.querySelector('form textarea')`);
await probe('UI-LAB-INVALID-JSON','Invalid JSON gives a concise validation message',r=>r.message && r.requests===0,async()=>{
 const start=network.length;await setValue('textarea','{ invalid');await evaluate(`document.querySelector('form').requestSubmit()`);await waitFor(`document.body.textContent.includes('Dữ liệu thô phải là JSON hợp lệ.')`);
 return {message:true,requests:network.slice(start).filter(r=>r.url.includes('/submit')).length};
});
await probe('UI-LAB-RAW-JSON','Valid measurement JSON can be submitted through the actual UI',r=>r.success,async()=>{
 await setValue('textarea',JSON.stringify({measurements:[1.2,1.3],unit:'m'}));await evaluate(`document.querySelector('form').requestSubmit()`);
 await waitFor(`!document.querySelector('form button[type=submit]').disabled`);await pause(300);
 const result=await evaluate(`({success:document.body.textContent.includes('Đã gửi báo cáo thí nghiệm.'),error:document.querySelector('form [role=alert]')?.textContent,globalToasts:document.querySelectorAll('.api-toast').length})`);
 await screenshot('lab-json-submit-error');return result;
});
await probe('UI-LAB-URL-SUBMIT','Evidence URL submits and persists',r=>r.success&&r.persisted,async()=>{
 await setValue('textarea','');const url='https://example.test/ui-evidence-'+Date.now();await setValue('input[type=url]',url);await evaluate(`document.querySelector('form').requestSubmit()`);await waitFor(`document.body.textContent.includes('Đã gửi báo cáo thí nghiệm.')`);
 const token=await login('admin');const list=await api(`/api/v1/experiments/assignments/${fixture.assignmentId}/submissions`,token);await login('sv_an');return {success:true,persisted:list.some(s=>s.evidenceUrl===url)};
});
await probe('UI-LAB-OVERRIDE','Report shows class-specific assigned instructions',r=>r.showsOverride,async()=>({showsOverride:await evaluate(`document.body.textContent.includes('QA class-specific instructions')`),showsOriginal:await evaluate(`document.body.textContent.includes('QA original instructions')`)}));
await probe('UI-LAB-MOBILE','Report has no horizontal overflow at 390px',r=>!r.overflow,async()=>{await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(100);await screenshot('lab-report-mobile');return await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,width:document.documentElement.scrollWidth})`);});
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await login('gv_nguyen');
await probe('UI-LAB-CONFIRMED','Actual confirmed report is read only in grader',r=>r.scores===2&&r.allDisabled,async()=>{await navigate(`lecturer_lab_grading?submissionId=${fixture.submissionId}&classId=${fixture.classId}`);await waitFor(`document.querySelectorAll('input[name=score]').length===2`);return await evaluate(`({scores:document.querySelectorAll('input[name=score]').length,allDisabled:[...document.querySelectorAll('input[name=score]')].every(e=>e.disabled)})`);});
let currentUser='';
for(const route of routeFiles){
 const user=route.startsWith('lecturer_')?'gv_nguyen':route.startsWith('admin_')?'admin':route.startsWith('ta_')?'ta_hung':'sv_an';
 if(user!==currentUser){await login(user);currentUser=user;}
 const startErrors=runtimeErrors.length,startNet=network.length;
 let extra='';if(route==='3d_workspace.html'||route==='lab_report_rubric.html')extra='?'+query;
 if(['lecturer_lab_grading.html','lecturer_lab_submission_detail.html'].includes(route))extra=`?submissionId=${fixture.submissionId}&classId=${fixture.classId}`;
 if(['lecturer_course_detail.html','ta_class_support.html'].includes(route))extra=`?classId=${fixture.classId}`;
 try{await navigate(route+extra);const r=await evaluate(`({text:document.querySelector('#root')?.textContent?.length||0,title:document.querySelector('h1')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth})`);smoke.push({route,user,...r,errors:runtimeErrors.slice(startErrors),apiFailures:network.slice(startNet).filter(x=>x.status>=400)});console.log(`SMOKE ${route}: text=${r.text} errors=${runtimeErrors.length-startErrors} failedAPI=${smoke.at(-1).apiFailures.length}`);}
 catch(e){smoke.push({route,user,error:e.message});console.log(`SMOKE ERROR ${route}: ${e.message}`);}
 await writeFile('.tmp-comprehensive-test/live-ui-results.json',JSON.stringify({results,smoke,runtimeErrors},null,2));
}
console.log(`UI TOTAL ${results.length}; PASS ${results.filter(r=>r.passed).length}; FAIL ${results.filter(r=>!r.passed).length}; SMOKE ${smoke.length}`);
await send('Browser.close').catch(()=>{});socket.close();
