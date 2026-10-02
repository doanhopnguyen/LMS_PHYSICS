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

const waitFor=async(expr)=>{for(let i=0;i<100;i++){if(await evaluate(expr))return;await pause(100);}throw new Error(expr);};
try{
await send('Page.enable');await send('Runtime.enable');
await send('Page.addScriptToEvaluateOnNewDocument',{source:`
const page=location.pathname;const role=page.includes('admin_')?'ADMIN':page.includes('lecturer_')?'INSTRUCTOR':page.includes('ta_')?'TA':'STUDENT';
localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role}));localStorage.setItem('ptit-physics-access-token','isolated-test-token');
window.fetch=async(input)=>{let data=[];const path=new URL(input,location.origin).pathname;if(path==='/api/v1/notifications/summary')data={unreadCount:0};if(path==='/api/v1/dashboard/me')data={};if(path.includes('open-meteo'))return Response.json({current:{temperature_2m:25,weather_code:0}});return Response.json({status:200,data});};`});
for(const width of [1440,768,390]){
await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
for(const page of ['dashboard','lecturer_dashboard','ta_dashboard','admin_dashboard']){
await send('Page.navigate',{url:origin+'/'+page});
await waitFor(`!!document.querySelector('.app-header') && !!document.querySelector('.site-footer')`);await pause(200);
const state=await evaluate(`(()=>{
const header=document.querySelector('.app-header');const brand=header.querySelector('.floating-brand-copy');const footer=document.querySelector('.site-footer__brand-lockup .floating-brand-copy');
return {title:!!header.querySelector('.page-heading'),back:!!header.querySelector('.header-back-button'),headingSize:getComputedStyle(brand.querySelector('strong')).fontSize,subSize:getComputedStyle(brand.querySelector('span')).fontSize,footerSize:getComputedStyle(footer.querySelector('strong')).fontSize,footerSubSize:getComputedStyle(footer.querySelector('span')).fontSize,headerOverflow:header.scrollWidth>header.clientWidth};
})()`);
assert.equal(state.title,false,page);assert.equal(state.back,false,page);assert.equal(state.headingSize,'14px');assert.equal(state.subSize,'12px');assert.equal(state.footerSize,'14px');assert.equal(state.footerSubSize,'12px');assert.equal(state.headerOverflow,false,page+' width '+width);
}
}
assert.deepEqual(errors,[]);console.log('All four dashboard headers match; larger brand text and no header overflow at 1440/768/390px.');
}finally{await send('Browser.close').catch(()=>{});socket.close();}
