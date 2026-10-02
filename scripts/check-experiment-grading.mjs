import assert from 'node:assert/strict';


// Isolated browser with intercepted API responses; no backend writes.
const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5188';
const targets = await (await fetch('http://127.0.0.1:9339/json')).json();
const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', ({ data }) => {
  const reply = JSON.parse(data);
  if (reply.method === 'Log.entryAdded' && reply.params.entry.level === 'error') console.log('Browser error:', reply.params.entry.text);
  if (reply.method === 'Runtime.exceptionThrown') errors.push(reply.params.exceptionDetails.exception?.description || reply.params.exceptionDetails.text);
  const entry = pending.get(reply.id);
  if (entry) { pending.delete(reply.id); reply.error ? entry.reject(reply.error) : entry.resolve(reply.result); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitFor=async(expr)=>{for(let i=0;i<100;i++){if(await evaluate(expr))return;await pause(100);}throw new Error('Timed out: '+expr);};
const setInput=async(selector,value)=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
try{
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'INSTRUCTOR'}));localStorage.setItem('ptit-physics-access-token','isolated-test-token');
    window.testCalls=[];window.failSave=false;window.failConfirm=false;
    const summary={submissionId:'11111111-1111-4111-8111-111111111111',experimentTitle:'Khảo sát chuyển động',status:'PENDING',totalScore:0,totalMaxScore:10,rubrics:[{rubricId:'r1',criteriaName:'Số liệu',maxScore:4,score:null,isGraded:false},{rubricId:'r2',criteriaName:'Phân tích',maxScore:6,score:null,isGraded:false}]};
    window.fetch=async(input,options={})=>{
      const path=new URL(input,location.origin).pathname,method=options.method||'GET',body=options.body?JSON.parse(options.body):null;
      testCalls.push({path,method,body});let data=[];
      if(path==='/api/v1/users/me')data={userId:'teacher',role:'INSTRUCTOR'};
      if(path==='/api/v1/notifications/summary')data={unreadCount:0};
      if(path==='/api/v1/classes')data={content:[{classId:'c1',classCode:'PHY101-01',subjectId:'s1'}],last:true};
      if(path==='/api/v1/subjects')data={content:[{subjectId:'s1',subjectName:'Vật lý'}],last:true};
      if(path==='/api/v1/experiments')data=[{experimentId:'e1',subjectId:'s1',title:'Khảo sát chuyển động'}];
      if(path.endsWith('/rubric-summary'))data=summary;
      if(path.endsWith('/scores')&&method==='POST'){
        if(failSave)return Response.json({message:'Lỗi lưu thử nghiệm'},{status:500});
        const row=summary.rubrics.find(r=>r.rubricId===body.rubricId);Object.assign(row,body,{isGraded:true});summary.status='GRADED';
      }
      if(path.endsWith('/confirmation')){
        if(failConfirm)return Response.json({message:'Lỗi chốt thử nghiệm'},{status:500});
        summary.status='CONFIRMED';
      }
      return Response.json({status:200,data});
    };
  `});
  await send('Page.navigate',{url:origin+'/lecturer_labs.html'});
  await waitFor(`!!document.querySelector('[role=tab]')`);
  await evaluate(`[...document.querySelectorAll('[role=tab]')].find(e=>e.textContent==='Chấm bài thí nghiệm').click()`);
  await waitFor(`!!document.querySelector('input[name=link]')`);
  await setInput('input[name=link]','/lecturer_lab_grading.html?submissionId=11111111-1111-4111-8111-111111111111');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await waitFor(`document.querySelectorAll('input[name=score]').length===2`);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Xác nhận kết quả')).disabled`),true);
  await setInput('input[name=score]','5');
  assert.equal(await evaluate(`document.querySelector('input[name=score]').checkValidity()`),false);
  await setInput('input[name=score]','0');await setInput('input[name=comment]','Kiểm tra số liệu');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await waitFor(`testCalls.some(c=>c.path.endsWith('/scores')) && !document.querySelector('input[name=score]').disabled`);
  assert.deepEqual(await evaluate(`testCalls.find(c=>c.path.endsWith('/scores')).body`),{rubricId:'r1',score:0,comment:'Kiểm tra số liệu'});
  await evaluate(`window.failSave=true`);
  await setInput('form:nth-of-type(1) input[name=score]','1');
  await evaluate(`document.querySelector('form').requestSubmit()`);await pause(200);
  assert.equal(await evaluate(`document.querySelector('input[name=score]').value`),'1');
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Xác nhận kết quả')).disabled`),true);
  await evaluate(`window.failSave=false;(()=>{const e=document.querySelectorAll('input[name=score]')[1];Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'6');e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll('form')[1].requestSubmit();})()`);
  await waitFor(`![...document.querySelectorAll('button')].find(e=>e.textContent.includes('Xác nhận kết quả')).disabled`);
  await evaluate(`window.failConfirm=true;[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Xác nhận kết quả')).click()`);
  await waitFor(`!!document.querySelector('[role=alertdialog]')`);
  await evaluate(`[...document.querySelectorAll('[role=alertdialog] button')].find(e=>e.textContent==='Chốt điểm').click()`);await pause(200);
  assert.ok(await evaluate(`!!document.querySelector('[role=alertdialog]')`));
  await evaluate(`window.failConfirm=false;[...document.querySelectorAll('[role=alertdialog] button')].find(e=>e.textContent==='Chốt điểm').click()`);
  await waitFor(`!document.querySelector('[role=alertdialog]') && document.querySelector('input[name=score]').disabled`);
  console.log('Grading: link selection, rubric payload/zero, bounds, failure recovery, confirmation and readonly passed.');
  await send('Page.navigate',{url:origin+'/lecturer_labs.html'});
  await waitFor(`!!document.querySelector('button') && document.body.textContent.includes('Giao cho lớp')`);
  await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent==='Giao cho lớp').click()`);
  await waitFor(`!!document.querySelector('input[type=datetime-local]')`);
  const width=await evaluate(`document.querySelector('input[type=datetime-local]').getBoundingClientRect().width`);
  assert.ok(width>=230&&width<=305,'compact datetime width: '+width);
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(100);
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
  assert.deepEqual(errors,[]);
  console.log('Date/time: compact desktop field and mobile width passed.');
}finally{await send('Browser.close').catch(()=>{});socket.close();}
