'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const mode=process.argv[2]||'after',root=path.resolve(process.env.STARS_GAME_ROOT||path.join(__dirname,mode==='before'?'baselines/96g2':'..'));
const out=path.resolve(process.env.STARS_BUILDING_OUTPUT||path.join(__dirname,'audit96h0/ui-'+mode));fs.mkdirSync(out,{recursive:true});
let server,browser;const rows=[],errors=[];
async function prepare(p){
 await p.evaluate(()=>{
  ADVISOR_OFF=true;CFG.seed=404;CFG.size='orta';CFG.aiCount=5;CFG.origin='standart';CFG.aiOrigins=false;CFG.randomEvents=false;CFG.council='kapali';CFG.crisis='kapali';startGame();
  UI.closeModal();UI.setSpeed(0);G.autoSave=false;document.getElementById('title').classList.add('hidden');
  const s=G.sys[G.p.home],pl=s.planets.find(p=>p.owner===0&&p.col);
  for(const other of s.planets)if(other!==pl&&other.col)UI.planetFolds().add(s.id+':'+other.i);
  pl.col.pop=40;pl.col.cap=50;pl.col.q=[];pl.col.auto=false;
  pl.col.b={maden:2,santral:2,ciftlik:2,lab:1,dokum:1,tersane:1,kale:1,arsiv:1,klinik:1,kuyu:1,asansor:1,habitat:1,fabrika:2,liman:1};
  for(const k in G.p.res)G.p.res[k]=100000;
  View.sel=null;View.selSys=s;UI.tab('sistem');UI.refresh();
  window.buildingTarget={s:s.id,p:pl.i};
 });
 await p.locator('.bWrap').first().waitFor();
 await p.evaluate(()=>{const pane=document.getElementById('panel'),first=pane.querySelector('.bWrap');pane.scrollTop+=first.getBoundingClientRect().top-pane.getBoundingClientRect().top-25;});
}
async function measure(p){return p.evaluate(()=>{
 const pane=document.getElementById('panel'),pr=pane.getBoundingClientRect(),cards=[...pane.querySelectorAll('.bWrap')];
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
 return {viewport:[innerWidth,innerHeight],panel:rect(pane),expected:Object.keys(BUILDINGS).length,total:cards.length,visible:cards.filter(c=>{const r=c.getBoundingClientRect();return r.top>=pr.top&&r.bottom<=pr.bottom}).length,
 cards:cards.map(c=>({name:c.querySelector('.buildingName').textContent,count:c.querySelector('.buildingCount').textContent,card:rect(c),build:rect(c.querySelector('[data-a="build"]')),demolish:c.querySelector('[data-a="demolish"]')?rect(c.querySelector('[data-a="demolish"]')):null}))};
 });}
async function actions(p,row){
 const check=(name,ok)=>{assert(ok,name);(row.checks||(row.checks=[])).push(name)};
 check('all counters and costs clear the independent 44px demolition target',await p.evaluate(()=>[...document.querySelectorAll('.bWrap')].every(c=>{
  const d=c.querySelector('[data-a="demolish"]');if(!d)return true;const r=d.getBoundingClientRect();if(r.width<44||r.height<44)return false;
  const range=document.createRange();for(const el of c.querySelectorAll('.buildingCount,.buildingCost>span')){range.selectNodeContents(el);for(const t of range.getClientRects())if(t.right>r.left+.5&&t.bottom>r.top&&t.top<r.bottom)return false;}return true;
 })));
 const target=await p.evaluate(()=>buildingTarget),key=target.s+':'+target.p+':maden';
 await p.evaluate(()=>{window.cashBefore96=G.p.res.min;window.jobsBefore96=G.sys[buildingTarget.s].planets[buildingTarget.p].col.q.length});
 await p.locator('[data-a="build"][data-x="'+key+'"]').tap();
 await p.waitForFunction(()=>document.querySelector('[data-building="maden"] .buildingCount').textContent.includes('+1'));
 row.buildObservation=await p.evaluate(()=>({cash:G.p.res.min,before:cashBefore96,cost:buildingCost(G.p,'maden'),q:G.sys[buildingTarget.s].planets[buildingTarget.p].col.q,count:document.querySelector('[data-building="maden"] .buildingCount').textContent,speed:G.speed,day:G.day,modal:document.getElementById('modal').textContent}));
 check('one actual touch builds exactly one paid mine and updates the queue count',await p.evaluate(()=>{const q=G.sys[buildingTarget.s].planets[buildingTarget.p].col.q;return q.length===jobsBefore96+1&&q.at(-1).key==='maden'&&cashBefore96-G.p.res.min===buildingCost(G.p,'maden').min&&document.querySelector('[data-building="maden"] .buildingCount').textContent.includes('+1')}));
 await p.locator('[data-a="cancelBuild"]').last().tap();
 check('actual cancellation refunds the paid construction once',await p.evaluate(()=>G.p.res.min===cashBefore96&&G.sys[buildingTarget.s].planets[buildingTarget.p].col.q.length===jobsBefore96));
 await p.locator('[data-a="demolish"][data-x="'+key+'"]').tap();
 check('demolition touch opens a named confirmation without queuing or paying',await p.evaluate(()=>document.getElementById('modal').textContent.includes('Maden Ocağı')&&G.sys[buildingTarget.s].planets[buildingTarget.p].col.q.length===jobsBefore96&&G.p.res.min===cashBefore96));
 await p.evaluate(()=>window.oldCancelled96=UI._hooks.demolishConfirm);
 await p.locator('#modal [data-a="closem"]').tap();await p.evaluate(()=>oldCancelled96());
 check('cancelled confirmation stays invalid even if its former callback repeats',await p.evaluate(()=>G.sys[buildingTarget.s].planets[buildingTarget.p].col.q.length===jobsBefore96&&G.p.res.min===cashBefore96));
 await p.locator('[data-a="demolish"][data-x="'+key+'"]').tap();await p.evaluate(()=>window.doubleConfirm96=UI._hooks.demolishConfirm);
 await p.locator('[data-a="demolishConfirm"]').tap();await p.evaluate(()=>doubleConfirm96());
 check('confirmed demolition targets the right building once and retains it until completion',await p.evaluate(()=>{const q=G.sys[buildingTarget.s].planets[buildingTarget.p].col.q;return q.length===1&&q[0].dem&&q[0].key==='maden'&&q[0].s===buildingTarget.s&&q[0].p===buildingTarget.p&&G.sys[buildingTarget.s].planets[buildingTarget.p].col.b.maden===2&&G.p.res.min===cashBefore96}));
 await p.evaluate(()=>{colonyBuildTick(demolishDays(G.p,'maden')+.1);UI.keepScroll=true;UI.refresh()});
 check('real completion removes one mine and grants only the existing scrap refund',await p.evaluate(()=>G.sys[buildingTarget.s].planets[buildingTarget.p].col.b.maden===1&&G.p.res.min===cashBefore96+demolishRefund('maden').min));
 await p.evaluate(()=>{G.sys[buildingTarget.s].planets[buildingTarget.p].col.b.santral=1;UI.keepScroll=true;UI.refresh()});
 await p.locator('[data-a="demolish"][data-x="'+target.s+':'+target.p+':santral"]').tap();
 check('the final power plant retains the engine safety gate',await p.evaluate(()=>G.sys[buildingTarget.s].planets[buildingTarget.p].col.q.length===0&&document.getElementById('modal').classList.contains('hidden')));
 const lab=p.locator('[data-hold="lab"]');await lab.scrollIntoViewIfNeeded();const b=await lab.boundingBox(),cdp=await p.context().newCDPSession(p);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+12}]});await p.waitForTimeout(700);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 check('a real long press reveals the full laboratory name without building',await p.evaluate(()=>document.getElementById('modal').textContent.includes('Araştırma Laboratuvarı')&&!document.getElementById('modal').classList.contains('hidden')&&G.sys[buildingTarget.s].planets[buildingTarget.p].col.q.length===0));
 await p.locator('#modal [data-a="closem"]').tap();
 await p.locator('[data-a="demolish"][data-x="'+key+'"]').tap();
 await p.evaluate(()=>{const fn=UI._hooks.demolishConfirm;window.beforeLoad96=serialize();deserialize(beforeLoad96);window.reloadedCash96=G.p.res.min;fn()});
 check('a Save8 reload invalidates the former destructive confirmation',await p.evaluate(()=>JSON.parse(serialize()).v===8&&G.p.res.min===reloadedCash96&&G.sys[buildingTarget.s].planets[buildingTarget.p].col.q.length===0));
 await p.evaluate(()=>{UI.closeModal();View.selSys=G.sys[G.p.home];UI.tab('sistem');UI.keepScroll=true;UI.refresh()});
 if(row.viewport[0]<=740){
  await p.evaluate(()=>{const el=document.getElementById('panel');el.scrollTop=100;window.scrollNode96=el;window.scrollY96=el.scrollTop;window.startDay96=G.day;window.refreshes96=0;const old=UI.refresh;UI.refresh=function(...args){refreshes96++;return old.apply(this,args)};LOOP.on=true});
  await p.locator('[data-a="spd"][data-x="4"]').tap();await p.waitForTimeout(6500);await p.locator('[data-a="spd"][data-x="0"]').tap();
  const live=await p.evaluate(()=>({same:scrollNode96===document.getElementById('panel'),before:scrollY96,after:document.getElementById('panel').scrollTop,days:G.day-startDay96,refreshes:refreshes96}));row.live=live;
  check('automatic high-speed updates preserve the sidebar node and reading position',live.same&&Math.abs(live.before-live.after)<2&&live.days>0&&live.refreshes>0);
 }
}
(async()=>{try{
 server=http.createServer((q,r)=>{const n=new URL(q.url,'http://localhost').pathname,p=path.resolve(root,'.'+(n==='/'?'/index.html':n));if(!p.startsWith(root+path.sep))return r.writeHead(403).end();fs.readFile(p,(e,b)=>{if(e)return r.writeHead(404).end();r.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':'application/json');r.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/tmp/chromium133/chromium',args:['--no-sandbox','--disable-gpu','--disable-webgl','--disable-dev-shm-usage']});
 for(const [width,height] of [[1536,702],[1280,720],[740,360],[360,300]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port);await prepare(p);
  const row=await measure(p);row.status='PASS';rows.push(row);
  await p.screenshot({path:path.join(out,'buildings-'+width+'x'+height+'.png')});
  assert.equal(row.total,row.expected);assert(row.cards.every(c=>c.build.w>0));
  if(mode==='after')await actions(p,row);
  await context.close();
 }
 assert.equal(errors.length,0);fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({browser:browser.version(),root,mode,rows,checks:rows.reduce((n,r)=>n+(r.checks?.length||0),0),errors,physicalAndroid:'NOT RUN'},null,2));
 console.log(JSON.stringify(rows.map(r=>({viewport:r.viewport,visible:r.visible,card:r.cards[0].card}))));
}finally{await browser?.close();server?.close()}})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({rows,errors,error:e.stack},null,2));process.exitCode=1});
