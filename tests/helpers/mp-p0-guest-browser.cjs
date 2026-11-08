'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
module.exports=async(H,B,C,out)=>{
 const wait=(p,f,a)=>p.waitForFunction(f,a,{timeout:15000}),hit=async(p,s)=>{const l=p.locator(s).first();const summary=l.locator('xpath=ancestor::details[not(@open)]/summary').first();if(await summary.count()){await summary.scrollIntoViewIfNeeded();if(process.env.MPP0_DESKTOP==='1')await summary.click({timeout:8000});else await summary.tap({timeout:8000});}await l.scrollIntoViewIfNeeded();if(process.env.MPP0_DESKTOP==='1')await l.click({timeout:8000});else await l.tap({timeout:8000});},results=[];
 const closeViews=async p=>{await p.evaluate(()=>UI.closeModal());if(await p.locator('#diploPane').evaluate(e=>e.classList.contains('show')))await hit(p,'#diploPane .riX');};
 const original=await H.evaluate(()=>serialize()),speed=await H.evaluate(()=>G.speed);
 try{
 for(const p of[B,C])await closeViews(p);
 const fixture=await H.evaluate(()=>{UI.closeModal();MP1Host.host.local({kind:'speed',value:0});for(const e of G.emps){delete e.decisions;e.overlord=null;e.civics=[];for(const x of G.emps)if(x!==e){e.war[x.id]=false;e.contact[x.id]=false;}}for(const id of[0,1,2])for(const x of[0,1,2])if(id!==x)G.emps[id].contact[x]=true;
  const e=G.emps[1],native=nativeSensorVision(e),s=G.sys.find(s=>s.owner<0&&!native.has(s.id)&&!s.lanes.some(id=>native.has(id)));if(!s)throw Error('far fixture');G.emps[1].visionFrom={2:true};G.emps[2].visionFrom={};
  for(const sys of G.sys)if(sys.owner===2)sys.owner=-1;G.fleets=G.fleets.filter(f=>f.e!==2||f.ships.length);const cf=G.fleets.find(f=>f.e===2);cf.sys=s.id;cf.x=s.x;cf.y=s.y;cf.mv=null;cf.path=[];
  const shared=s.id,hab=G.sys[e.home];if(!G.fleets.some(f=>f.e===e.id&&fleetHasRole(f,'insaat')))newFleet(e,hab.id,[{c:'ins'}],'MP-P0 rota fikstürü');hab.surv=[...new Set([...hab.surv,1])];hab.seen=[...new Set([...hab.seen,1])];hab.planets.push({...hab.planets[0],i:hab.planets.length,t:'gay',owner:-1,col:null,shattered:false});
  const own=G.fleets.find(f=>f.e===1&&isArmed(f));for(const ship of own.ships)ship.h=.55;own.mv=null;own.path=[];
  const foreign=G.fleets.find(f=>f.e===0&&isArmed(f));foreign.sys=e.home;foreign.x=hab.x+45;foreign.y=hab.y;foreign.path=[];foreign.mv=null;for(const ship of foreign.ships)ship.h=.42;
  const science=G.fleets.find(f=>f.e===1&&fleetHasRole(f,'bilim'));science.sys=e.home;science.mv=null;science.path=[];hab.anom=true;hab.anomK='dogal';doSurvey(science,hab);
  enqueueDecision(G.emps[1],'event','e1');enqueueDecision(G.emps[1],'chain','hayalet1');enqueueDecision(G.emps[2],'anomaly','a1',G.emps[2].home);
  updateVision();MP1Host.host.publish();return {shared,hab:hab.id,own:own.id,foreign:foreign.id,science:science.id,decision:G.emps[1].decisions.pending.find(n=>n.kind==='anomaly').id};});
 await wait(B,id=>G.vis.has(id),fixture.shared);assert.equal(await B.evaluate(id=>pSeen(G.sys[id]),fixture.shared),true);assert.equal(await B.evaluate(id=>!!(playerHabitatMark(G.sys[id])&1),fixture.hab),true);
 assert.equal(await B.evaluate(()=>G.emps[1].res.min),0);assert.equal(await B.evaluate(()=>G.emps[2].decisions),undefined);assert.equal(await C.evaluate(()=>G.emps[1].decisions),undefined);
 await closeViews(B);
 const point=await B.evaluate(id=>{const f=G.fleets.find(f=>f.id===id),w=innerWidth,h=innerHeight;let target=null;for(const y of[h*.78,h*.7,h*.6,h*.5])for(const x of[w*.2,w*.3,w*.4,w*.5])if(!target&&document.elementFromPoint(x,y)?.id==='map')target={x,y};if(!target)throw Error('visible Canvas target absent');View.center(f.x,f.y);View.cam.z=.5;const p=View.s2w(target.x,target.y);View.cam.x+=f.x-p.x;View.cam.y+=f.y-p.y;return target;},fixture.foreign);
 const pickTrace=[];for(let i=0;i<16;i++){pickTrace.push(await B.evaluate(p=>({point:p,top:document.elementFromPoint(p.x,p.y)?.id,expected:View.hit(p).f?.id,selected:View.sel?.id}),point));assert.equal(await B.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,point),'map');if(process.env.MPP0_DESKTOP==='1')await B.mouse.click(point.x,point.y);else await B.touchscreen.tap(point.x,point.y);await B.waitForTimeout(350);if(await B.evaluate(id=>View.sel?.id===id,fixture.foreign))break;}
 fs.writeFileSync(path.join(out,'p0-canvas-picks.json'),JSON.stringify(pickTrace,null,2));assert.equal(await B.evaluate(()=>View.sel?.id),fixture.foreign);assert((await B.locator('#panel').innerText()).includes('%42'));await B.screenshot({path:path.join(out,'p0-foreign-health.png')});
 await B.evaluate(()=>{View.sel=null;UI.tab('filo');UI.refresh();});await hit(B,'#panel [data-a="selfleet"][data-x="'+fixture.own+'"]');assert((await B.locator('#panel').innerText()).includes('%55'));assert.equal(await B.evaluate(id=>G.fleets.find(f=>f.id===id).ships[0].h,fixture.own),.55);
 results.push({visibility:true,shared:fixture.shared,habitat:true,foreignHull:.42,ownHull:.55,privacy:true});
 // Actual anomaly and full modal decision, followed by compact event and chain choices.
 for(const kind of ['anomaly','event','chain']){
  await closeViews(B);await wait(B,k=>G.inbox.some(n=>n.kind===k&&n.decisionId),kind);
  const d=await B.evaluate(k=>{const n=G.inbox.find(n=>n.kind===k&&n.decisionId);return {uid:n.uid,id:n.decisionId};},kind),before=await H.evaluate(()=>({a:G.emps[1].res.ara,m:G.emps[1].res.min,host:JSON.stringify(G.p.res),p:G.p.id}));
  if(kind==='anomaly'){await hit(B,'#inbox [data-a="openNote"][data-x="'+d.uid+'"]');await hit(B,'#modal [data-a="anomch"][data-x="0"]');}
  else{await hit(B,'#inbox [data-a="noteOptions"][data-x="'+d.uid+'"]');await hit(B,'#inbox [data-a="noteChoice"][data-x="'+d.uid+':0"]');}
  await wait(H,id=>G.emps[1].decisions.pending.find(n=>n.id===id).status==='resolved',d.id);await wait(B,()=>document.getElementById('modal').textContent.includes('SONUÇ'));
  const after=await H.evaluate(()=>({a:G.emps[1].res.ara,m:G.emps[1].res.min,host:JSON.stringify(G.p.res),p:G.p.id}));assert.equal(before.host,after.host);assert.equal(after.p,0);if(kind==='event'){assert.equal(after.a-before.a,260);assert.equal(before.m-after.m,150);}
  const repeat=await B.evaluate(id=>{const r=MP1Join.cmd({kind:'eventChoice',id,choice:0});return r.cid;},d.id);await wait(B,cid=>MP1Join.results.some(r=>r.cid===cid),repeat);assert.equal(await B.evaluate(cid=>MP1Join.results.find(r=>r.cid===cid).status,repeat),'rejected');
  results.push({kind,decision:d.id,before,after,replay:'rejected'});await B.screenshot({path:path.join(out,'p0-'+kind+'-result.png')});await B.evaluate(()=>UI.closeModal());
 }
 await closeViews(C);await wait(C,()=>G.inbox.some(n=>n.kind==='anomaly'&&n.decisionId));
 const cd=await C.evaluate(()=>{const n=G.inbox.find(n=>n.kind==='anomaly'&&n.decisionId);return {uid:n.uid,id:n.decisionId};}),cBefore=await H.evaluate(()=>G.emps[2].res.ara),bBefore=await H.evaluate(()=>JSON.stringify(G.emps[1].res));
 await hit(C,'#inbox [data-a="noteOptions"][data-x="'+cd.uid+'"]');await hit(C,'#inbox [data-a="noteChoice"][data-x="'+cd.uid+':0"]');await wait(H,id=>G.emps[2].decisions.pending.find(n=>n.id===id).status==='resolved',cd.id);assert.equal(await H.evaluate(()=>G.emps[2].res.ara)-cBefore,180);assert.equal(await H.evaluate(()=>JSON.stringify(G.emps[1].res)),bBefore);await C.screenshot({path:path.join(out,'p0-C-own-anomaly.png')});await C.evaluate(()=>UI.closeModal());results.push({CDecision:cd.id,CResearch:180,BUnchanged:true});
 if(await H.evaluate(()=>G.fedFounding?.proposals.some(p=>p.status==='founded'))){
 // Canonical founded proposals must not regenerate popups on every mirror.
 await B.evaluate(()=>{window.__p0FedNotifications=0;const notify=UI.notify;window.__p0Notify=notify;UI.notify=function(n){if(n.kind==='fedfoundResult')window.__p0FedNotifications++;return notify.call(this,n);};});
 const baseBuild=await B.evaluate(()=>MP6Stars.S.stats.builds);for(let i=0;i<3;i++){await H.evaluate(()=>{G.day+=.5;MP1Host.host.publish();});await wait(B,n=>MP6Stars.S.stats.builds>n,baseBuild+i);}
 assert.equal(await B.evaluate(()=>window.__p0FedNotifications),0);await B.evaluate(()=>{UI.notify=window.__p0Notify;});results.push({repeatedFoundingPopups:0,mirrors:3});
 }else results.push({foundingNotification:'NOT RUN: no founded proposal in this filtered case'});
 await H.evaluate(()=>{G.emps[1].visionFrom={};updateVision();MP1Host.host.publish();});await wait(B,id=>!G.vis.has(id),fixture.shared);assert.equal(await B.evaluate(id=>pSeen(G.sys[id]),fixture.shared),true);results.push({shareEndedLiveRemoved:true,discoveryRetained:true});
 // All four fleet roles use real selection, ROTA button and Canvas input.
 const paths=[];
 for(const role of ['military','bilim','koloni','insaat']){
  const id=await B.evaluate(role=>{UI.closeModal();View.sel=null;UI.tab('filo');UI.refresh();const f=G.fleets.find(f=>f.e===0&&f.sys>=0&&(role==='military'?isArmed(f):fleetHasRole(f,role)));if(!f)throw Error('missing real fleet role '+role);return f.id;},role);
  await hit(B,'#panel [data-a="selfleet"][data-x="'+id+'"]');if(await B.evaluate(()=>View.route))await hit(B,'#panel [data-a="route"]');await hit(B,'#panel [data-a="route"]');
  const target=await H.evaluate(id=>{const f=G.fleets.find(f=>f.id===id),s=G.sys[f.sys];return {from:s.id,to:s.lanes.find(n=>canEnter(G.emps[1],G.sys[n]))};},id);assert(Number.isInteger(target.to));
  const pixel=await B.evaluate(id=>{const s=G.sys[id];let t;for(const y of[innerHeight*.78,innerHeight*.7,innerHeight*.6])for(const x of[innerWidth*.2,innerWidth*.3,innerWidth*.4,innerWidth*.5])if(!t&&document.elementFromPoint(x,y)?.id==='map')t={x,y};if(!t)throw Error('free Canvas route target absent');View.center(s.x,s.y);View.cam.z=.5;const p=View.s2w(t.x,t.y);View.cam.x+=s.x-p.x;View.cam.y+=s.y-p.y;if(View.hit(t).s?.id!==id)throw Error('wrong projected system');return t;},target.to);
  assert.equal(await B.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,pixel),'map');if(process.env.MPP0_DESKTOP==='1')await B.mouse.click(pixel.x,pixel.y);else await B.touchscreen.tap(pixel.x,pixel.y);
  await wait(H,id=>G.fleets.find(f=>f.id===id).path.length>0,id);await wait(B,id=>View.sel?.id===id&&View.sel===G.fleets.find(f=>f.id===id)&&View.sel.path.length>0,id);
  paths.push({role,id,path:await B.evaluate(()=>View.sel.path)});await B.screenshot({path:path.join(out,'p0-route-'+role+'.png')});
 }
 results.push({routes:paths});await B.evaluate(()=>{View.sel=null;UI.tab('filo');UI.refresh();});await hit(B,'#panel [data-a="selfleet"][data-x="'+fixture.own+'"]');
 await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:1}));await wait(B,id=>!!G.fleets.find(f=>f.id===id).mv,fixture.own);await wait(B,id=>{const r=MP6Stars.S.motion.rows.get(id);return r&&(r.x!==r.toX||r.y!==r.toY);},fixture.own);
 const points=await B.evaluate(async id=>{const rows=[];for(let i=0;i<30;i++){await new Promise(requestAnimationFrame);const f=G.fleets.find(f=>f.id===id),p=View.fleetPoint(f);rows.push({x:p.x,y:p.y,actualX:f.x,actualY:f.y});}return rows;},fixture.own);assert(points.some((p,i)=>i&&p.x!==points[i-1].x&&p.actualX===points[i-1].actualX||i&&p.y!==points[i-1].y&&p.actualY===points[i-1].actualY),'no interpolated frame between snapshots');results.push({motion:points});
 await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));await B.context().setOffline(true);await B.waitForTimeout(900);await B.context().setOffline(false);await wait(B,()=>MP1Join.ws?.readyState===1&&MP1Join.hostOnline);await wait(B,()=>!G.inbox.some(n=>n.decisionId&&G.p.decisions.pending.find(r=>r.id===n.decisionId)?.status==='resolved'));
 results.push({reconnect:true});fs.writeFileSync(path.join(out,'p0-guest.json'),JSON.stringify({input:process.env.MPP0_DESKTOP==='1'?'mouse':'touch',fixture,results},null,2));return results;
 }catch(e){fs.writeFileSync(path.join(out,'p0-partial-results.json'),JSON.stringify(results,null,2));for(const [n,p]of[['host',H],['B',B],['C',C]]){await p.screenshot({path:path.join(out,'p0-failure-'+n+'.png')});fs.writeFileSync(path.join(out,'p0-failure-'+n+'.json'),JSON.stringify(await p.evaluate(()=>({sys:G.sys.filter(s=>s.seen.includes(0)),inbox:G.inbox,own:G.p,sel:View.sel,stats:globalThis.MP6Stars?.S.stats})),null,2));}throw e;}
 finally{await H.evaluate(({s,speed})=>{UI.closeModal();if(!deserialize(s))throw Error('restore');G.autoSave=false;MP1Host.host.local({kind:'speed',value:speed});MP1Host.host.publish();},{s:original,speed});}
};
