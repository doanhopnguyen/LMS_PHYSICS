import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5194';
const directory = path.resolve('.tmp-authoring-ui');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9364',
    `--user-data-dir=${path.join(directory, 'profile')}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' }
);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      target = (await (await fetch('http://127.0.0.1:9364/json')).json()).find((item) => item.type === 'page');
    } catch {
      await delay(100);
    }
  }
  assert.ok(target);
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  const send = async (method, params = {}) => {
    const id = ++sequence;
    const result = await new Promise((resolve) => {
      pending.set(id, resolve);
      socket.send(JSON.stringify({ id, method, params }));
    });
    if (result.error) throw new Error(JSON.stringify(result.error));
    return result.result;
  };
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const wait = async (expression) => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const navigate = async (route) => {
    await send('Page.navigate', { url: `${origin}/${route}` });
    await wait('!!document.querySelector("h1")');
  };
  const click = async (text) => {
    await evaluate(
      `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().includes(${JSON.stringify(text)}));if(!b)throw Error('Missing button');b.click()})()`
    );
    await delay(150);
  };
  const input = async (selector, value) => {
    await evaluate(
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`
    );
    await delay(100);
  };
  const choose = async (label, value) => {
    await evaluate(
      `(()=>{const e=[...document.querySelectorAll('label')].find(e=>e.textContent.includes(${JSON.stringify(label)})).querySelector('select');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}))})()`
    );
    await delay(150);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:location.pathname.includes('lecturer')?'INSTRUCTOR':'STUDENT'}));
    localStorage.setItem('ptit-physics-access-token','isolated-test-token');
    window.testCalls=[];window.rejectSave=false;
    window.fetch=async(input,options={})=>{
      const url=new URL(input,location.origin), p=url.pathname, method=options.method||'GET';
      const body=options.body instanceof FormData?Object.fromEntries([...options.body].map(([k,v])=>[k,v instanceof File?{name:v.name,size:v.size}:v])):options.body?JSON.parse(options.body):null;
      testCalls.push({p,method,body});let data=[];
      if(p==='/api/v1/users/me')data={userId:'u',username:'Tester',role:location.pathname.includes('lecturer')?'INSTRUCTOR':'STUDENT'};
      if(p==='/api/v1/notifications/summary')data={unreadCount:0};
      if(p==='/api/v1/subjects')data={content:[{subjectId:'s1',subjectName:'Vật lý 1'}],last:true};
      if(p==='/api/v1/classes'||p==='/api/v1/students/me/classes')data={content:[{classId:'c1',className:'Lớp Vật lý',subjectId:'s1',subjectName:'Vật lý 1'}],last:true};
      if(p==='/api/v1/subjects/s1/topics')data=[{topicId:'t1',topicName:'Động lực học'}];
      if(p==='/api/v1/exam-matrices'&&method==='GET')data=[{matrixId:'mx1',matrixName:'Ma trận 1'}];
      if(p==='/api/v1/exam-matrices'&&method==='POST')data={matrixId:'mx2',...body};
      if(p==='/api/v1/topics/t1/materials'&&method==='POST'){
        if(rejectSave)return Response.json({message:'Không thể lưu thử nghiệm'},{status:500});
        data={materialId:'m1',...body};
      }
      if(p==='/api/v1/exams'&&method==='POST')data={examId:'e1',...body};
      if(p==='/api/v1/exams/e1')data={examId:'e1',classId:'c1',title:'Đề thử nghiệm',matrixId:'mx1'};
      if(p==='/api/v1/students/me/materials')data=[{materialId:'m1',topicId:'t1',title:'Định luật Newton',type:'MARKDOWN',contentText:'# Newton\\n\\n**Lực** tác dụng\\n\\n- Khối lượng\\n- Gia tốc\\n\\n| Đại lượng | Đơn vị |\\n| --- | --- |\\n| Lực | N |'}];
      const fileMode=new URLSearchParams(location.search).get('fileMd');
      if(p==='/api/v1/students/me/materials'&&fileMode)data=[{materialId:'m1',topicId:'t1',title:'Bài đọc Markdown',type:fileMode==='type'?'MARKDOWN':'OTHER',fileName:fileMode==='extension'?'bai-hoc.md':'file-id',fileUrl:'/fixtures/lesson-file'}];
      if(p==='/fixtures/lesson-file')return new Response('# Bài đọc từ file\\n\\n**Lực** tác dụng\\n\\n- Khối lượng\\n- Gia tốc', {headers:{'Content-Type':fileMode==='mime'?'text/markdown':'application/octet-stream'}});
      return Response.json({data});
    };
  `,
  });

  await navigate('lecturer_materials?subjectId=s1&topicId=t1');
  await wait('!!document.querySelector("button") && !document.body.textContent.includes("Đang tải danh sách")');
  await click('Tạo học liệu');
  await wait(
    'location.pathname==="/lecturer_material_create" && !!document.querySelector("textarea") && !document.querySelector("textarea").disabled'
  );
  assert.equal(await evaluate('document.querySelectorAll("[role=dialog]").length'), 0);
  const markdown =
    '# Newton\n\n**Lực** tác dụng\n\n- Khối lượng\n- Gia tốc\n\n| Đại lượng | Đơn vị |\n| --- | --- |\n| Lực | N |\n\n<script>window.hacked=true</script>\n\n[Unsafe](javascript:alert(1))';
  await input('textarea[name=contentText]', markdown);
  assert.equal(await evaluate('document.querySelector(".markdown-content h1").textContent'), 'Newton');
  assert.equal(await evaluate('document.querySelectorAll(".markdown-content li").length'), 2);
  assert.equal(await evaluate('!!document.querySelector(".markdown-content table")'), true);
  assert.equal(
    await evaluate(
      '!!window.hacked || !!document.querySelector(".markdown-content script") || !!document.querySelector(".markdown-content a[href^=javascript]")'
    ),
    false
  );
  assert.equal(
    await evaluate(
      'getComputedStyle(document.querySelector(".markdown-editor")).gridTemplateColumns.split(" ").length'
    ),
    2
  );
  await input('input[name=title]', 'Bài học Newton');
  await evaluate('window.rejectSave=true;document.querySelector("form").requestSubmit()');
  await wait('document.body.textContent.includes("Không thể lưu thử nghiệm")');
  assert.equal(await evaluate('document.querySelector("textarea").value'), markdown);
  await evaluate('window.rejectSave=false');
  await choose('Định dạng', 'VIDEO');
  assert.equal(
    await evaluate(
      '!!document.querySelector("textarea[name=contentText]") && !!document.querySelector("input[type=url]") && !document.querySelector("input[type=file]")'
    ),
    true
  );
  await choose('Định dạng', 'PDF');
  assert.equal(
    await evaluate(
      '!!document.querySelector("input[type=file]") && !document.querySelector("textarea") && !document.querySelector("input[name=sourceCitation]")'
    ),
    true
  );
  assert.deepEqual(
    await evaluate('[...document.querySelector("select[name=type]").options].map(option=>option.value).sort()'),
    ['MARKDOWN', 'OTHER', 'PDF', 'SLIDE', 'TEXT', 'VIDEO']
  );
  await choose('Định dạng', 'OTHER');
  await evaluate(
    `(()=>{const dt=new DataTransfer();dt.items.add(new File(['word-data'],'bai-hoc.docx',{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));document.querySelector('input[type=file]').files=dt.files;document.querySelector('form').requestSubmit()})()`
  );
  await wait('location.pathname==="/lecturer_materials"');
  const word = await evaluate('testCalls.filter(c=>c.method==="POST"&&c.p.includes("materials")).at(-1).body');
  assert.equal(word.type, 'OTHER');
  assert.equal(word.file.name, 'bai-hoc.docx');
  assert.equal(word.contentText, undefined);
  assert.equal(word.sourceCitation, undefined);

  await navigate('lecturer_assessments?tab=matrices');
  await wait('document.querySelectorAll("select option[value=s1]").length>0');
  await choose('Học phần', 's1');
  await click('Tạo ma trận');
  await wait('location.pathname==="/lecturer_matrix_create" && !!document.querySelector("input[name=matrixName]")');
  assert.equal(await evaluate('document.querySelectorAll("[role=dialog]").length'), 0);
  await input('input[name=matrixName]', 'Ma trận thử nghiệm');
  await choose('Chủ đề', 't1');
  await evaluate('document.querySelector("form").requestSubmit()');
  await wait('location.pathname==="/lecturer_assessments"');
  const matrix = await evaluate('testCalls.find(c=>c.method==="POST"&&c.p==="/api/v1/exam-matrices").body');
  assert.equal(matrix.subjectId, 's1');
  assert.equal(matrix.details[0].topicId, 't1');
  assert.equal(await evaluate('new URLSearchParams(location.search).get("tab")'), 'matrices');

  await navigate('lecturer_assessments?classId=c1');
  await click('Tạo đề thi');
  await wait('location.pathname==="/lecturer_exam_create" && !!document.querySelector("input[name=title]")');
  assert.equal(await evaluate('document.querySelectorAll("[role=dialog]").length'), 0);
  await input('input[name=title]', 'Đề thử nghiệm');
  await input('input[name=durationMinutes]', '45');
  await input('input[name=startTime]', '2026-10-05T08:00');
  await input('input[name=endTime]', '2026-10-05T09:00');
  await writeFile(
    path.join(directory, 'exam-desktop.png'),
    Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  );
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false);
  await writeFile(
    path.join(directory, 'exam-mobile.png'),
    Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  );
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await evaluate('document.querySelector("form").requestSubmit()');
  await wait(
    'testCalls.some(c=>c.method==="POST"&&c.p==="/api/v1/exams") && !document.querySelector("input[name=title]")'
  );
  assert.equal(await evaluate('document.querySelectorAll("[role=dialog]").length'), 0);
  assert.equal(await evaluate('testCalls.find(c=>c.method==="POST"&&c.p==="/api/v1/exams").body.classId'), 'c1');

  await navigate('lecturer_material_create?subjectId=s1&topicId=t1');
  await wait('!!document.querySelector("textarea") && !document.querySelector("textarea").disabled');
  await input('textarea', markdown);
  await writeFile(
    path.join(directory, 'markdown-desktop.png'),
    Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  );
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false);
  assert.equal(
    await evaluate(
      'getComputedStyle(document.querySelector(".markdown-editor")).gridTemplateColumns.split(" ").length'
    ),
    1
  );
  await writeFile(
    path.join(directory, 'material-mobile.png'),
    Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  );
  await navigate('interactive_lesson?classId=c1&topicId=t1');
  await wait('!!document.querySelector(".markdown-content h1")');
  assert.equal(await evaluate('document.querySelector(".markdown-content h1").textContent'), 'Newton');
  assert.equal(
    await evaluate(
      '!!document.querySelector(".markdown-content strong") && !!document.querySelector(".markdown-content table")'
    ),
    true
  );
  assert.equal(await evaluate('!!document.querySelector("a[href*=library]")'), false);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false);
  for (const fileMode of ['extension', 'type', 'mime']) {
    await navigate(`interactive_lesson?classId=c1&topicId=t1&fileMd=${fileMode}`);
    await wait('!!document.querySelector(".markdown-content h1")');
    assert.equal(await evaluate('document.querySelector(".markdown-content h1").textContent'), 'Bài đọc từ file');
    assert.equal(await evaluate('document.querySelector(".markdown-content strong").textContent'), 'Lực');
    assert.equal(await evaluate('document.querySelectorAll(".markdown-content li").length'), 2);
    assert.equal(
      await evaluate('document.body.textContent.includes("Giảng viên chưa cập nhật nội dung văn bản")'),
      false
    );
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false);
  }
  await click('Mở rộng khung xem');
  await wait('!!document.querySelector("[role=dialog] .markdown-content h1")');
  await navigate('learning_module?classId=c1&topicId=t1&materialId=m1&fileMd=extension');
  await wait('!!document.querySelector(".markdown-content h1")');
  assert.equal(await evaluate('document.querySelector(".markdown-content h1").textContent'), 'Bài đọc từ file');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: create-page navigation, live Markdown preview, safe rendering, dynamic material fields, Word upload, failed-save recovery, matrix/exam submission, student rendering and mobile layout.'
  );
} finally {
  socket?.close();
  browser.kill();
}
