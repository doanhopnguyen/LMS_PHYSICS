import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5188';
const targets = await (await fetch('http://127.0.0.1:9339/json')).json();
const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map(),
  errors = [];
socket.addEventListener('message', ({ data }) => {
  const reply = JSON.parse(data);
  if (reply.method === 'Runtime.exceptionThrown')
    errors.push(reply.params.exceptionDetails.exception?.description || reply.params.exceptionDetails.text);
  const job = pending.get(reply.id);
  if (job) {
    pending.delete(reply.id);
    reply.error ? job.reject(reply.error) : job.resolve(reply.result);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const pause = () => new Promise((resolve) => setTimeout(resolve, 150));
const click = async (selector) => {
  assert.equal(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`), true, selector);
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await pause();
};
const key = async (value) => {
  await evaluate(
    `document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(value)},bubbles:true}))`
  );
  await pause();
};
const change = async (selector, value) => {
  await evaluate(
    `(() => { const input=document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true})); })()`
  );
  await pause();
};
try {
  await send('Runtime.enable');
  await send('Page.navigate', { url: origin + '/login' });
  await pause();
  await evaluate(`(async () => {
    const React=(await import('/node_modules/.vite/deps/react.js')).default;
    const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const {FormField}=await import('/src/components/FormField.jsx');
    const {SelectField}=await import('/src/components/SelectField.jsx');
    const {DatePicker}=await import('/src/components/DatePicker.jsx');
    const {FormDialog}=await import('/src/components/FormDialog.jsx');
    const host=document.createElement('div');document.body.append(host);document.querySelector('#root').style.display='none';
    function Harness() {
      const [date,setDate]=React.useState('2026-10-03');
      const [role,setRole]=React.useState('a');
      const [dialog,setDialog]=React.useState(false);
      window.setTestDate=setDate;window.setTestRole=setRole;window.showTestDialog=setDialog;
      return React.createElement('div',{style:{padding:'24px',width:'min(100%, 420px)'}},
        React.createElement('form',{id:'picker-test'},
          React.createElement(FormField,{id:'date',name:'date',type:'date',label:'Ngày thi',value:date,onChange:e=>setDate(e.target.value),min:'2026-10-02',max:'2026-11-10',disabledDates:['2026-10-04']}),
          React.createElement(FormField,{id:'datetime',name:'datetime',type:'datetime-local',label:'Ngày và giờ',defaultValue:'2026-10-03T08:15',required:true}),
          React.createElement(FormField,{id:'time',name:'time',type:'time',label:'Giờ học',defaultValue:'08:00',min:'07:00',max:'20:00',required:true}),
          React.createElement(FormField,{id:'month',name:'month',type:'month',label:'Tháng thống kê',defaultValue:'2026-10'}),
          React.createElement(SelectField,{id:'role',name:'role',label:'Vai trò',value:role,onChange:e=>setRole(e.target.value)},
            React.createElement('option',{value:'a'},'Sinh viên'),React.createElement('option',{value:'disabled',disabled:true},'Không thể chọn'),React.createElement('option',{value:'b'},'Giảng viên')),
          React.createElement(SelectField,{id:'uncontrolled',name:'uncontrolled',label:'Số dòng',defaultValue:'20'},React.createElement('option',{value:'10'},'10'),React.createElement('option',{value:'20'},'20')),
          React.createElement(FormField,{id:'required',name:'required',type:'date',label:'Ngày bắt buộc',required:true}),
          React.createElement(FormField,{id:'disabled',type:'date',label:'Ngày đã khóa',disabled:true}),
          React.createElement('button',{type:'reset'},'Đặt lại')),
        React.createElement('div',{id:'direct'},React.createElement(DatePicker,{value:date,onChange:setDate,label:'Ngày trực tiếp'})),
        dialog && React.createElement(FormDialog,{title:'Thời gian',onClose:()=>setDialog(false)},React.createElement(FormField,{type:'date',id:'modal-date',label:'Ngày trong popup',defaultValue:'2026-10-03'}))
      );
    }
    createRoot(host).render(React.createElement(Harness));
  })()`);
  await pause();
  errors.length = 0;
  await click('#date + button');
  assert.equal(await evaluate(`document.querySelector('[data-day="2026-10-01"]').disabled`), true);
  assert.equal(await evaluate(`document.querySelector('[data-day="2026-10-04"]').disabled`), true);
  assert.equal(await evaluate(`document.querySelectorAll('[aria-selected="true"][data-day]').length`), 1);
  await key('ArrowDown');
  assert.equal(await evaluate('document.activeElement.dataset.day'), '2026-10-10');
  await key('Enter');
  // Synthetic Enter has no browser activation, unlike a real keypress.
  await evaluate('document.activeElement.click()');
  await pause();
  assert.equal(await evaluate(`document.querySelector('#date').value`), '2026-10-10');
  assert.equal(await evaluate(`!!document.querySelector('.picker-popover')`), false);
  assert.equal(await evaluate(`document.activeElement===document.querySelector('#date + button')`), true);
  assert.ok(await evaluate(`document.querySelector('#date + button').textContent.includes('10/10/2026')`));
  await click('#date + button');
  await key('Escape');
  assert.equal(await evaluate(`!!document.querySelector('.picker-popover')`), false);
  await click('#date + button');
  await evaluate(`document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`);
  await pause();
  assert.equal(await evaluate(`!!document.querySelector('.picker-popover')`), false);
  await click('#datetime + button');
  await click('[data-day="2026-10-05"]');
  await change('.date-picker-time-fields input', '09');
  await change('.date-picker-time-fields label:nth-child(2) input', '30');
  await click('.date-picker-time > button');
  assert.equal(
    await evaluate(`new FormData(document.querySelector('#picker-test')).get('datetime')`),
    '2026-10-05T09:30'
  );
  await click('#time + button');
  await evaluate(`document.querySelector('.date-picker-time-fields input').focus()`);
  await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await send('Input.dispatchKeyEvent', {type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  assert.equal(await evaluate(`document.activeElement===document.querySelector('.date-picker-time-fields label:nth-child(2) input')`),true);
  assert.ok(await evaluate(`!!document.querySelector('.picker-popover')`));
  await change('.date-picker-time-fields input', '21');
  await click('.date-picker-time > button');
  assert.equal(await evaluate(`document.querySelector('#time').value`), '08:00');
  assert.ok(await evaluate(`!!document.querySelector('.picker-error')`));
  await change('.date-picker-time-fields input', '10');
  await click('.date-picker-time > button');
  assert.equal(await evaluate(`document.querySelector('#time').value`), '10:00');
  await click('#month + button');
  await click('.date-picker-months button:nth-child(11)');
  assert.equal(await evaluate(`document.querySelector('#month').value`), '2026-11');
  await click('#role + button');
  await key('ArrowDown');
  await key('Enter');
  assert.equal(await evaluate(`document.querySelector('#role').value`), 'b');
  assert.equal(await evaluate(`new FormData(document.querySelector('#picker-test')).get('role')`), 'b');
  await click('#uncontrolled + button');
  await key('Home');
  await key('Enter');
  assert.equal(await evaluate(`document.querySelector('#uncontrolled').value`), '10');
  await click('button[type="reset"]');
  assert.equal(await evaluate(`document.querySelector('#uncontrolled').value`), '20');
  assert.ok(await evaluate(`document.querySelector('#uncontrolled + button').textContent.includes('20')`));
  await evaluate(`window.setTestDate('2026-11-03');window.setTestRole('a')`);
  await pause();
  assert.ok(await evaluate(`document.querySelector('#date + button').textContent.includes('03/11/2026')`));
  assert.ok(await evaluate(`document.querySelector('#role + button').textContent.includes('Sinh viên')`));
  assert.equal(await evaluate(`document.querySelector('#required').checkValidity()`), false);
  assert.equal(await evaluate(`document.querySelector('#disabled + button').disabled`), true);
  await evaluate(`window.showTestDialog(true)`);
  await pause();
  await click('#modal-date + button');
  await key('Escape');
  assert.ok(await evaluate(`!!document.querySelector('.form-dialog')`));
  assert.equal(await evaluate(`!!document.querySelector('.picker-popover')`), false);
  await key('Escape');
  assert.equal(await evaluate(`!!document.querySelector('.form-dialog')`), false);
  await mkdir('docs/test-feedback/pickers-screenshots', { recursive: true });
  for (const width of [1280, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const name of ['date', 'role']) {
      await click('#' + name + ' + button');
      const geometry = await evaluate(
        `(() => {const r=document.querySelector('.picker-popover').getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth};})()`
      );
      assert.ok(geometry.left >= 0 && geometry.right <= geometry.width, JSON.stringify(geometry));
      const capture = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(
        'docs/test-feedback/pickers-screenshots/' + name + '-' + width + '.png',
        Buffer.from(capture.data, 'base64')
      );
      await key('Escape');
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS: single date, bounds/disabled dates, arrows, Escape, controlled updates, FormData, time/datetime/month, select, reset, modal and 1280/390/320px popovers.'
  );
} finally {
  socket.close();
}
