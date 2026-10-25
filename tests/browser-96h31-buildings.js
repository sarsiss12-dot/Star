'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const mode=process.argv[2]||'after',root=path.resolve(process.env.STARS_GAME_ROOT||path.join(__dirname,mode==='before'?'baselines/96h3':'..'));
const out=path.resolve(process.env.STARS_BUILDING_OUTPUT||path.join(__dirname,'audit96h31/ui-'+mode));fs.mkdirSync(out,{recursive:true});
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
 cards:cards.map(c=>({name:c.querySelector('.buildingName').textContent,count:c.querySelector('.buildingCount').textContent,card:rect(c),build:rect(c.querySelector('[data-a="build"]')),demolish:c.querySelector('[data-a="demolish"]')?rect(c.querySelector('[data-a="demolish"]')):null,painted:c.querySelector('.demIcon')?rect(c.querySelector('.demIcon')):c.querySelector('[data-a="demolish"]')?rect(c.querySelector('[data-a="demolish"]')):null,iconFont:parseFloat(getComputedStyle(c.querySelector('.demIcon')||c.querySelector('.demX')||c).fontSize)}))};
 });}
async function extraActions(p,row){
 const check=(name,ok)=>{assert(ok,name);row.checks.push(name)};
 row.hitProbe=await p.evaluate(()=>[...document.querySelectorAll('.bWrap.has-dem')].map(c=>{const r=c.getBoundingClientRect(),d=c.querySelector('.demX').getBoundingClientRect(),pr=$('panel').getBoundingClientRect(),a=(x,y)=>document.elementFromPoint(x,y)?.closest('[data-a]')?.dataset.a;return {key:c.dataset.building,y:r.y,bottom:r.bottom,pr:[pr.top,pr.bottom],width:r.width,actions:[a(d.x+22,d.y+22),a(r.x+20,r.y+35),a(r.right-20,r.top+8)],clip:getComputedStyle(c.querySelector('.abtn')).clipPath}}));
 check('every real hit point belongs exclusively to build or demolition, including the full title strip',await p.evaluate(()=>[...document.querySelectorAll('.bWrap.has-dem')].every(c=>{
  const r=c.getBoundingClientRect(),d=c.querySelector('.demX').getBoundingClientRect();const pr=document.getElementById('panel').getBoundingClientRect();if(r.top<pr.top||r.bottom>pr.bottom)return true;
  const action=(x,y)=>document.elementFromPoint(x,y)?.closest('[data-a]')?.dataset.a;
  return action(d.x+22,d.y+22)==='demolish'&&action(r.x+20,r.y+35)==='build'&&action(r.right-20,r.top+8)==='build';
 })));
 check('name/cost/count text never enters the demolition hit area',await p.evaluate(()=>[...document.querySelectorAll('.bWrap.has-dem')].every(c=>{const d=c.querySelector('.demX').getBoundingClientRect(),range=document.createRange();return [...c.querySelectorAll('.buildingName,.buildingCount,.buildingCost>span')].every(n=>{range.selectNodeContents(n);return [...range.getClientRects()].every(r=>!(r.left<d.right&&r.right>d.left&&r.top<d.bottom&&r.bottom>d.top));});})));
 // Isolate navigation from anomaly notices created by the preceding live simulation.
 await p.evaluate(()=>{G.inbox=[];UI.drawInbox()});
 await p.locator('#tabs [data-x="filo"]').tap();await p.locator('#tabs [data-x="intel"]').tap();await p.locator('#tabs [data-x="sistem"]').tap();await p.waitForFunction(()=>document.querySelectorAll('.bWrap').length===22);
 check('system fleet and intelligence tabs return to all22 construction cards',await p.evaluate(()=>document.querySelectorAll('.bWrap').length===22));
 await p.locator('#sbToggle').tap();check('sidebar toggle closes the real panel',await p.evaluate(()=>$('sidebar').classList.contains('off')));await p.locator('#sbToggle').tap();check('sidebar toggle restores the construction panel',await p.evaluate(()=>!$('sidebar').classList.contains('off')));
 const target=await p.evaluate(()=>buildingTarget),key=target.s+':'+target.p+':maden';
 await p.evaluate(()=>{UI.closeModal();G.speed=0;window.pl31=G.sys[buildingTarget.s].planets[buildingTarget.p];pl31.col.q=[];pl31.col.b.maden=1;for(const r in G.p.res)G.p.res[r]=100000;UI.keepScroll=true;UI.refresh()});
 await p.locator('[data-a="demolish"][data-x="'+key+'"]').tap();
 check('confirmation names the actual planet and actual building',await p.evaluate(()=>{const s=$('modal').textContent;return s.includes(pl31.name)&&s.includes(BUILDINGS.maden.n)}));
 await p.evaluate(()=>{const fn=UI._hooks.demolishConfirm;pl31.owner=1;window.cash31=JSON.stringify(G.p.res);fn();window.noOwnership31=pl31.col.q.length===0&&JSON.stringify(G.p.res)===cash31;pl31.owner=0;UI.closeModal();UI.refresh()});
 check('ownership changes invalidate the former confirmation',await p.evaluate(()=>noOwnership31));
 await p.evaluate(()=>{for(const r in G.p.res)G.p.res[r]=0;window.cash31=JSON.stringify(G.p.res);UI.refresh()});
 await p.locator('[data-a="build"][data-x="'+key+'"]').tap();
 check('insufficient funds show disabled state and no paid order',await p.evaluate(()=>pl31.col.q.length===0&&JSON.stringify(G.p.res)===cash31&&document.querySelector('[data-building="maden"] .abtn').classList.contains('dis')));
 await p.evaluate(()=>{for(const r in G.p.res)G.p.res[r]=100000;pl31.col.b.maden=BUILDINGS.maden.max;window.cash31=JSON.stringify(G.p.res);UI.refresh()});
 await p.locator('[data-a="build"][data-x="'+key+'"]').tap();
 check('building limit remains visible and cannot be exceeded',await p.evaluate(()=>pl31.col.q.length===0&&JSON.stringify(G.p.res)===cash31&&document.querySelector('[data-building="maden"] .buildingCount').textContent.startsWith(BUILDINGS.maden.max+'/'+BUILDINGS.maden.max)));
 const lock=await p.evaluate(()=>{window.lock31=Object.keys(BUILDINGS).find(k=>BUILDINGS[k].tech&&!G.p.techs[BUILDINGS[k].tech]);window.cash31=JSON.stringify(G.p.res);return lock31});
 await p.locator('[data-a="build"][data-x="'+target.s+':'+target.p+':'+lock+'"]').tap();
 check('research lock is visible and prevents construction',await p.evaluate(()=>pl31.col.q.length===0&&JSON.stringify(G.p.res)===cash31&&document.querySelector('[data-building="'+lock31+'"] .buildingName').textContent.includes('🔒')));
 await p.evaluate(()=>{pl31.col.b.maden=1;UI.refresh()});
 await p.locator('[data-a="build"][data-x="'+key+'"]').tap();
 await p.waitForFunction(()=>document.querySelector('[data-building="maden"] .buildingCount').textContent.includes('+1'));
 row.queuedProbe=await p.evaluate(()=>{const e=document.querySelector('[data-building="maden"] .buildingCount');return {text:e.textContent,w:e.clientWidth,scroll:e.scrollWidth,queue:pl31.col.q,modal:$('modal').textContent,hidden:$('modal').classList.contains('hidden')}});
 check('queued count is legible alongside the exact current limit',await p.evaluate(()=>{const el=document.querySelector('[data-building="maden"] .buildingCount');return el.textContent==='1/'+BUILDINGS.maden.max+' +1'&&el.scrollWidth<=el.clientWidth+1}));
 if(row.viewport[0]<=740){
  await p.evaluate(()=>{UI.closeModal();window.panel31=$('panel');panel31.scrollTop=100;window.y31=panel31.scrollTop;window.day31=G.day});
  for(const speed of [1,2,3,4]){
   await p.locator('[data-a="spd"][data-x="'+speed+'"]').tap();await p.waitForTimeout(2300);
   check('speed '+speed+' keeps the panel and reading position',await p.evaluate(()=>panel31===$('panel')&&Math.abs(panel31.scrollTop-y31)<2));
  }
  await p.locator('[data-a="spd"][data-x="0"]').tap();check('all live-speed windows advance the actual simulation',await p.evaluate(()=>G.day>day31));
 }
}
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
 const confirmBox31=await p.locator('[data-a="demolishConfirm"]').boundingBox();await p.locator('[data-a="demolishConfirm"]').tap();await p.touchscreen.tap(confirmBox31.x+confirmBox31.width/2,confirmBox31.y+confirmBox31.height/2);await p.evaluate(()=>doubleConfirm96());
 check('real double touch confirms only one demolition without falling through to a paid order',await p.evaluate(()=>{const q=G.sys[buildingTarget.s].planets[buildingTarget.p].col.q;return q.length===1&&q[0].dem&&q[0].key==='maden'&&q[0].s===buildingTarget.s&&q[0].p===buildingTarget.p&&G.sys[buildingTarget.s].planets[buildingTarget.p].col.b.maden===2&&G.p.res.min===cashBefore96}));
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
  if(mode==='after'){
   row.hitGridSamples=await p.evaluate(()=>{let checked=0;const pr=$('panel').getBoundingClientRect();for(const c of document.querySelectorAll('.bWrap')){const r=c.getBoundingClientRect(),d=c.querySelector('.demX')?.getBoundingClientRect();if(r.top<pr.top||r.bottom>pr.bottom)continue;for(let x=r.left+2;x<r.right-2;x+=4)for(let y=r.top+2;y<r.bottom-2;y+=4){if(d&&(Math.abs(x-d.left)<1||Math.abs(y-d.top)<1))continue;const expected=d&&x>=d.left&&x<d.right&&y>=d.top&&y<d.bottom?'demolish':'build',actual=document.elementFromPoint(x,y)?.closest('[data-a]')?.dataset.a;if(actual!==expected)throw Error(c.dataset.building+' hit mismatch '+x+','+y+' '+actual+'/'+expected);checked++;}}return checked;});
   await actions(p,row);row.checks.push('entire visible card hit grid has no overlapping or dead action regions');await extraActions(p,row);
  }
  await context.close();
 }
 const portrait=await browser.newContext({viewport:{width:360,height:740},hasTouch:true,isMobile:true});const pp=await portrait.newPage();await pp.goto('http://127.0.0.1:'+server.address().port);await pp.waitForFunction(()=>typeof UI!=='undefined');await pp.evaluate(()=>{startGame();UI.checkOrient()});assert(await pp.locator('#rotate').isVisible());assert(await pp.evaluate(()=>document.elementFromPoint(innerWidth/2,innerHeight/2)?.closest('#rotate')!==null));await portrait.close();
 assert.equal(errors.length,0);fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({browser:browser.version(),root,mode,rows,portraitChecks:2,checks:rows.reduce((n,r)=>n+(r.checks?.length||0),0)+2,errors,physicalAndroid:'NOT RUN'},null,2));
 console.log(JSON.stringify(rows.map(r=>({viewport:r.viewport,visible:r.visible,card:r.cards[0].card}))));
}finally{await browser?.close();server?.close()}})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({rows,errors,error:e.stack},null,2));process.exitCode=1});
