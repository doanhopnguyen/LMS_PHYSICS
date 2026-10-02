import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

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

const waitFor = async (expression) => {
  for(let i=0;i<100;i++) { if(await evaluate(expression)) return; await pause(100); }
  throw new Error('Timed out: ' + expression);
};
const choose = async (label, value) => {
  await evaluate(`(() => { const e=[...document.querySelectorAll('label')].find(e=>e.textContent.includes(${JSON.stringify(label)})).querySelector('select');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await pause(200);
};
const screenshot = async (name) => {
  const result=await send('Page.captureScreenshot',{format:'png'});
  await writeFile('.tmp-ui-chrome/'+name+'.png',Buffer.from(result.data,'base64'));
};
try {
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'STUDENT'}));
    localStorage.setItem('ptit-physics-access-token','isolated-test-token');
    window.testCalls=[];window.failSend=false;window.failEnd=false;
    window.fetch=async(input,options={})=>{
      const url=new URL(input,location.origin),path=url.pathname,method=options.method||'GET';
      const body=options.body?JSON.parse(options.body):null;
      testCalls.push({path,query:Object.fromEntries(url.searchParams),method,body});
      let data=[];
      if(path==='/api/v1/users/me')data={userId:'u',username:'Student',role:'STUDENT'};
      if(path==='/api/v1/notifications/summary')data={unreadCount:0};
      if(path==='/api/v1/students/me/classes')data={content:[{classId:'c1',classCode:'PHY101-01',subjectId:'s1',subjectName:'Vật lý 1'},{classId:'c2',classCode:'PHY102-01',subjectId:'s2',subjectName:'Vật lý 2'}],last:true};
      if(path==='/api/v1/subjects/s1/topics')data=[{topicId:'t1',topicName:'Động lực học'}];
      if(path==='/api/v1/subjects/s2/topics')data=[{topicId:'t2',topicName:'Điện trường'}];
      if(path==='/api/v1/students/me/materials')data=[
        {materialId:'m1',topicId:'t1',title:'Định luật Newton',type:'TEXT'},
        {materialId:'m2',topicId:'t1',title:'Bài giảng cơ học',type:'PDF',fileUrl:'https://example.com/mechanics.pdf'},
        {materialId:'m3',topicId:'t2',title:'Điện trường tĩnh',type:'VIDEO',fileUrl:'https://example.com/video'}
      ].filter(m=>(!url.searchParams.get('type')||m.type===url.searchParams.get('type'))&&(!url.searchParams.get('topicId')||m.topicId===url.searchParams.get('topicId'))&&(!url.searchParams.get('classId')||m.topicId===(url.searchParams.get('classId')==='c1'?'t1':'t2')));
      if(path==='/api/v1/materials/m1')data={materialId:'m1',title:'Định luật Newton',type:'TEXT',version:2,contentText:'Nội dung bài đọc Newton',sourceCitation:'Giáo trình Vật lý'};
      if(path==='/api/v1/experiments/e1')data={experimentId:'e1',title:'Rơi tự do',instructions:'1. Đặt quả cầu thép ở độ cao s. 2. Đo thời gian rơi t qua cổng quang. 3. Vẽ đồ thị s = f(t^2) và tính sai số gia tốc g.'};
      if(path==='/api/v1/ai-tutor/conversations/my')data=[{conversationId:'old',classId:'c2',topicId:'t2',mode:'TEXT',startedAt:'2026-10-01',endedAt:'2026-10-02',messageCount:2}];
      if(path==='/api/v1/ai-tutor/conversations/old/messages')data=[{messageId:'old-user',sender:'USER',contentText:'Điện trường là gì?'},{messageId:'old-ai',sender:'AI',contentText:'Hãy xét lực tác dụng lên điện tích.'}];
      if(path==='/api/v1/ai-tutor/conversations'&&method==='POST')data={conversationId:'new',classId:body.classId,topicId:body.topicId,mode:body.mode,startedAt:'2026-10-02',messageCount:0};
      if(path==='/api/v1/ai-tutor/conversations/new/messages'&&method==='POST'){
        if(failSend)return Response.json({message:'Lỗi gửi thử nghiệm'},{status:500});
        data={messageId:'reply',sender:'AI',contentText:'Bắt đầu từ sơ đồ lực.\\nXác định các lực tác dụng.'};
      }
      if(path==='/api/v1/ai-tutor/conversations/new/end'){
        if(failEnd)return Response.json({message:'Lỗi kết thúc thử nghiệm'},{status:500});
        data={conversationId:'new',classId:'c1',endedAt:'2026-10-02',messageCount:2};
      }
      return Response.json({status:200,data});
    };
  `});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin+'/library.html'});
  await waitFor(`document.querySelectorAll('article.lms-card--accent').length===3`);
  await evaluate(`document.querySelector('article .row-action-trigger').click()`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('[role=menuitem]')].map(e=>e.textContent.trim())`), ['Xem chi tiết', 'Mở tài liệu']);
  await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent.includes('Xem chi tiết')).click()`);
  await waitFor(`document.querySelector('[role=dialog]')?.textContent.includes('Nội dung bài đọc Newton')`);
  assert.ok(await evaluate(`document.querySelector('[role=dialog] a')?.href.includes('classId=c1') && document.querySelector('[role=dialog] a')?.href.includes('materialId=m1')`));
  await evaluate(`document.querySelector('[role=dialog] button[aria-label="Đóng"]').click()`);
  await screenshot('library-desktop');
  await choose('Lớp học','c1'); await choose('Chủ đề','t1'); await choose('Loại học liệu','PDF');
  await waitFor(`document.querySelectorAll('article.lms-card--accent').length===1`);
  const call=await evaluate(`testCalls.filter(c=>c.path==='/api/v1/students/me/materials').at(-1)`);
  assert.deepEqual(call.query,{classId:'c1',topicId:'t1',type:'PDF'});
  assert.equal(await evaluate(`testCalls.some(c=>c.path.startsWith('/api/v1/topics/')&&c.path.endsWith('/materials'))`),false);
  await choose('Loại học liệu','MARKDOWN');
  await waitFor(`document.body.textContent.includes('Không tìm thấy tài liệu')`);
  assert.equal(await evaluate(`document.querySelectorAll('article.lms-card--accent').length`),0);
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await screenshot('library-mobile');
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
  console.log('Library: API filters, context links, empty results and mobile width passed.');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin+'/ai_tutor.html'});
  await waitFor(`!!document.querySelector('.ai-chat__history-item')`);
  await evaluate(`document.querySelector('.ai-chat__history-item').click()`);
  await waitFor(`document.querySelectorAll('.chat-message').length===2`);
  assert.equal(await evaluate(`document.querySelector('textarea').disabled`),true);
  assert.ok(await evaluate(`document.querySelector('.chat-page__conversation').textContent.includes('Điện trường')`));
  await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Chat mới')).click()`);
  await choose('Lớp học','c1'); await choose('Chủ đề','t1');
  const enterText=async(text)=>evaluate(`(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,${JSON.stringify(text)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await enterText('Giải thích Newton');
  await evaluate(`document.querySelector('.chat-composer').requestSubmit()`);
  await waitFor(`document.querySelectorAll('.chat-message').length===2`);
  assert.deepEqual(await evaluate(`testCalls.find(c=>c.path==='/api/v1/ai-tutor/conversations'&&c.method==='POST').body`),{classId:'c1',topicId:'t1',mode:'TEXT'});
  assert.deepEqual(await evaluate(`testCalls.find(c=>c.path.endsWith('/new/messages')&&c.method==='POST').body`),{content:'Giải thích Newton'});
  await screenshot('chat-desktop');
  const chatStyle = await evaluate(`(() => {
    const panel=document.querySelector('.chat-page__conversation');
    const composer=document.querySelector('.chat-composer');
    const button=document.querySelector('.ai-chat__send');
    return {bottom:panel.getBoundingClientRect().bottom,height:innerHeight,sharedCard:composer.classList.contains('lms-card'),round:getComputedStyle(composer).borderRadius,header:getComputedStyle(document.querySelector('.app-header')).backgroundColor,send:getComputedStyle(button).backgroundColor,bubble:getComputedStyle(document.querySelector('.chat-message.is-user')).backgroundColor};
  })()`);
  assert.ok(chatStyle.bottom >= chatStyle.height - 32, 'Chat should extend to the bottom of the viewport');
  assert.equal(chatStyle.sharedCard, true);
  assert.equal(chatStyle.round, '32px');
  assert.equal(chatStyle.send, chatStyle.header);
  assert.equal(chatStyle.bubble, chatStyle.header);
  const chatSurfaces=await evaluate(`(() => {
    const history=document.querySelector('.ai-chat__history');
    const header=document.querySelector('.app-header');
    const input=document.querySelector('.chat-composer textarea');
    input.focus();
    return {history:getComputedStyle(history).backgroundColor,gradient:getComputedStyle(history).backgroundImage,headerGradient:getComputedStyle(header).backgroundImage,title:getComputedStyle(history.querySelector('h2')).color,inputBorder:getComputedStyle(input).borderTopWidth,inputOutline:getComputedStyle(input).outlineStyle,inputShadow:getComputedStyle(input).boxShadow};
  })()`);
  assert.equal(chatSurfaces.history,chatStyle.header);
  assert.equal(chatSurfaces.gradient,chatSurfaces.headerGradient);
  assert.equal(chatSurfaces.title,'rgb(255, 255, 255)');
  assert.equal(chatSurfaces.inputBorder,'0px');
  assert.equal(chatSurfaces.inputOutline,'none');
  assert.equal(chatSurfaces.inputShadow,'none');
  await evaluate(`window.failSend=true`);await enterText('Tin nhắn lỗi');
  await evaluate(`document.querySelector('.chat-composer').requestSubmit()`);
  await waitFor(`!document.querySelector('textarea').disabled && document.querySelector('textarea').value==='Tin nhắn lỗi'`);
  assert.equal(await evaluate(`document.querySelectorAll('.chat-message').length`),2);
  await evaluate(`window.failEnd=true;[...document.querySelectorAll('button')].find(e=>e.textContent==='Kết thúc phiên').click()`);
  await pause(300);assert.equal(await evaluate(`document.querySelector('textarea').disabled`),false);
  await evaluate(`window.failEnd=false;[...document.querySelectorAll('button')].find(e=>e.textContent==='Kết thúc phiên').click()`);
  await waitFor(`document.querySelector('textarea').disabled`);
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await screenshot('chat-mobile');
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
  assert.deepEqual(errors,[]);
  console.log('Chat: ended history, correct context/payload, send recovery, end errors and mobile width passed.');
  await send('Page.navigate',{url:origin+'/3d_workspace.html?experimentId=e1'});
  await waitFor(`document.querySelector('.lab-instructions')?.textContent.includes('Đặt quả cầu thép')`);
  const instructionsStyle=await evaluate(`(() => {const card=document.querySelector('.lab-instructions');return {heading:getComputedStyle(card.querySelector('h2')).color,text:getComputedStyle(card.querySelector('.whitespace-pre-wrap')).color,background:getComputedStyle(card).backgroundColor};})()`);
  assert.equal(instructionsStyle.heading,'rgb(30, 41, 59)');
  assert.equal(instructionsStyle.text,'rgb(51, 65, 85)');
  assert.notEqual(instructionsStyle.text,instructionsStyle.background);
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
  assert.deepEqual(errors,[]);
  console.log('Chat surfaces: header-red history, single composer outline; lab instructions: dark readable text passed.');
} finally { await send('Browser.close').catch(()=>{});socket.close(); }
