'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{create}=require('../../research/mp1/server/relay');
const [mode,sys]=process.argv.slice(2),n=+sys,ai=n===100?9:16,mp=mode==='mp'||mode==='join';
const data={mode,n,ai,seed:11,rows:[],errors:[]},browsers=[],out=path.join(__dirname,'raw',mode+'-'+n+'.json');
function write(){fs.writeFileSync(out,JSON.stringify(data));}
const viewport={width:844,height:390},wait=(p,f,x)=>p.waitForFunction(f,x,{timeout:20000}),tap=(p,s)=>p.locator(s).first().tap({timeout:8000});
const helper=fs.readFileSync(path.join(__dirname,'../../tests/browser-mp-pwa-resume.cjs'),'utf8');
const {design,order}=new Function('viewport','wait','tap','assert','shot',helper.slice(helper.indexOf('async function design('),helper.indexOf('async function main()'))+';return {design,order}')(viewport,wait,tap,assert,async()=>{});
async function page(){const br=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info']});browsers.push(br);data.chromium=br.version();const p=await br.newPage({viewport,isMobile:true,hasTouch:true});p.on('pageerror',e=>data.errors.push(e.message));return p;}
async function room(h,g,url){
 await h.goto(url);await tap(h,'#mp1Btn');await tap(h,'[data-m="create"]');await wait(h,()=>MP1Host.lobby?.mode==='design');
 assert(await h.evaluate(([n,ai])=>{const cfg={size:setupSizeKey(n),aiCount:ai,seed:11};Object.assign(CFG,cfg);return MP1Host.host.configure(cfg).ok;},[n,ai]));
 await tap(h,'#mp7EditMe');await design(h,'Ölçüm Host');await g.goto(url+'/mp/play?code='+await h.evaluate(()=>MP1Host.code));
 await g.fill('#jName','Ölçüm Misafir');await tap(g,'[data-j="go"]');await tap(g,'#jEditMe');await design(g,'Ölçüm Devleti');await tap(g,'#jReady');
 await wait(h,()=>MP1Host.host.canStart().ok);await tap(h,'[data-m="start"]');await wait(g,()=>window.MP6Stars?.S.appliedRev>0);await h.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));}
function probes(guest){
 window.T={active:false};const wrap=(obj,k,label=k)=>{const fn=obj[k];if(typeof fn!=='function')return;obj[k]=function(...a){if(!T.active)return fn.apply(this,a);
 const t=performance.now();try{return fn.apply(this,a);}finally{(T[label]||=[]).push(performance.now()-t);}};};
 wrap(View,'draw');wrap(UI,'refresh');if(guest){wrap(window,'deserialize');const msg=MP6Stars.onMessage;
 MP6Stars.onMessage=function(m){if(T.active&&['mirror','mirrorDelta'].includes(m.type))T.rx={at:performance.now(),rev:m.rev};return msg.apply(this,arguments);};
 const draw=View.draw;View.draw=function(){const r=draw.apply(this,arguments);if(T.active&&T.rx&&MP6Stars.S.appliedRev===T.rx.rev&&!MP6Stars.S.building){(T.rxDraw||=[]).push(performance.now()-T.rx.at);T.rx=null;}return r;};}
 else{window.step=n=>{for(let i=0;i<n&&!G.over;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}};
 for(const k of ['monthTick','aiTurn','diploTick','economyTick','tradeFlowTick','combatTick','invasionTick','autoExploreTick','aiEconomyPlan','empireIncome','aiKnownRoute','txCaptureGraph'])wrap(window,k);
 if(window.MP1Host?.host)wrap(MP1Host.host,'publish');}
 const raf=t=>{if(T.active){if(T.last)(T.frames||=[]).push(t-T.last);T.last=t;}requestAnimationFrame(raf);};requestAnimationFrame(raf);
 new PerformanceObserver(l=>{if(T.active)for(const x of l.getEntries())(T.long||=[]).push(x.duration);}).observe({entryTypes:['longtask']});
}
function scene(k){UI.closeModal();if($('diploPane').classList.contains('show'))UI.act('closeDiplo');View.fit();
 const f=G.fleets.find(f=>f.e===0&&f.path.length)||G.fleets.find(f=>f.e===0);View.sel=f||null;
 if(k!=='map')for(let i=0;i<6;i++)$('map').dispatchEvent(new WheelEvent('wheel',{clientX:400,clientY:180,deltaY:-60,cancelable:true}));
 if(k==='panel')UI.openDiplo();forceRedraw('audit');return {zoom:View.cam.z,f:f?.id,hops:f?.path?.length,panel:$('diploPane').classList.contains('show')};}
const start=p=>p.evaluate(()=>{window.T={active:true};}),stop=p=>p.evaluate(()=>{T.active=false;return {...T,heap:performance.memory?.usedJSHeapSize,day:G.day};});
let relay;
async function main(){relay=create({MP1_BIND:'127.0.0.1',MP1_PORT:'0'});const s=await relay.start(),url='http://127.0.0.1:'+s.address().port,h=await page(),g=mp?await page():null,wire=[];
 if(g)g.on('websocket',w=>w.on('framereceived',f=>{try{const m=JSON.parse(String(f.payload).slice(1));wire.push([m.type||m.t,Buffer.byteLength(f.payload)]);}catch{}}));
 if(mp)await room(h,g,url);
 if(mode==='join'){
  const full=wire.filter(([kind])=>kind==='mirror');
  data.start={frames:wire.slice(),full,appliedRev:await g.evaluate(()=>MP6Stars.S.appliedRev)};
  assert(full.length&&data.start.appliedRev>0,'Tam dünya ilk katılımda uygulanmadı');return;
 }
 if(!mp){await h.goto(url);await wait(h,()=>typeof deserialize==='function');}
 await h.evaluate(probes,false);if(g)await g.evaluate(probes,true);
 for(const month of [3,120]){
 if(mp){let st;do{st=await h.evaluate(t=>{UI.closeModal();G.speed=0;G.autoSave=false;step(Math.min(120,Math.max(0,Math.ceil((t*30-G.day)*2))));MP1Host.host.publish();return [G.day,!!G.over];},month);if(st[1])throw Error('world ended '+st[0]);}while(st[0]<month*30);}
 else{const file=path.join(process.env.CHECKPOINT_DIR||'/tmp/stars-p43',[n,ai,11].join('-')+'-m'+month+'.save');
 const save=fs.readFileSync(file,'utf8');await h.evaluate(raw=>{if(!deserialize(raw))throw Error('load');enterGame(true);UI.closeModal();UI.setSpeed(0);G.autoSave=false;},save);}
 const row={month,context:await h.evaluate(()=>({d:G.day,sys:G.sys.length,ai:G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).length,liveAI:G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide&&!e.dead).length,humans:G.emps.filter(e=>!e.ai&&!e.wild&&!e.crisisSide).length})),scenes:[],ships:[]};data.rows.push(row);write();
 row.routes=await h.evaluate(mp=>G.emps.slice(0,mp?2:1).map(e=>{const f=G.fleets.find(f=>f.e===e.id&&!f.mv&&!f.combat&&isArmed(f));if(!f)return null;const to=G.sys[f.sys].lanes.find(id=>orderMove(f,id));return {id:f.id,to,hops:f.path.length};}),mp);
 if(mp){await h.evaluate(()=>MP1Host.host.publish());await g.waitForTimeout(1100);}
 for(const k of ['map','zoom','panel']){const hv=await h.evaluate(scene,k),gv=g&&await g.evaluate(scene,k);await h.waitForTimeout(900);
 await start(h);if(g)await start(g);wire.length=0;
 for(let i=0;i<9;i++){await h.evaluate(mp=>{step(2);if(mp)MP1Host.host.publish();forceRedraw('audit');},mp);await h.waitForTimeout(520);}
 row.scenes.push({k,hv,gv,h:await stop(h),g:g&&await stop(g),wire:wire.splice(0)});write();}
 await h.evaluate(()=>step(60));await start(h);row.full=[];
 for(let i=0;i<12;i++)row.full.push(await h.evaluate(()=>{const t=performance.now();step(60);return performance.now()-t;}));row.cpu=await stop(h);write();
 if(g){await h.evaluate(scene,'map');await g.evaluate(scene,'map');await h.evaluate(()=>{G.speed=0;MP1Host.host.publish();});await g.waitForTimeout(1500);
 for(let i=0;i<5;i++){const gate=await h.evaluate(()=>{const e=G.emps[1],s=G.sys[e.home];return {yard:hasYard(s)&&s.owner===e.id,funds:Object.entries(shipCost(e,'kor')).every(([k,v])=>e.res[k]>=v)};});
 if(!gate.yard||!gate.funds){row.stop=gate;break;}try{row.ships.push(await order(h,g,'ship-'+sys+'-'+month+'-'+i));}catch(e){row.commandError=e.message;break;}write();}}
 console.log(mode,n,month,JSON.stringify(row.context));}}
main().catch(e=>{data.failure=e.stack;console.error(e);process.exitCode=1;}).finally(async()=>{write();for(const b of browsers)await b.close();relay?.shutdown();});
