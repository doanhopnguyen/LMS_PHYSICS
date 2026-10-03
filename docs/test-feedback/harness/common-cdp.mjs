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
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},15000);pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r)},reject:e=>{clearTimeout(timer);reject(e)}});socket.send(JSON.stringify({id,method,params}));});
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

export {fixture, origin, be, socket, send, evaluate, pause, waitFor, navigate, login, api, probe, setValue, screenshot, results, runtimeErrors};
