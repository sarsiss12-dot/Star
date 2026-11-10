'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
module.exports=async(H,B,C,out,{tap,wait})=>{
 assert.equal(await H.evaluate(()=>!!G.p&&G.fleets.length>0),true,'B1 fixture requires an active authoritative game');
 const original=await H.evaluate(()=>serialize()),rows=[];
 try{
  for(const p of[H,B,C])await p.evaluate(()=>UI.closeModal());
  await wait(H,()=>{const r=MP1Host.host.local({kind:'speed',value:0});return(r.ok||r.code==='rules:same')&&G.speed===0;});
  const actor=await B.evaluate(()=>MP1Join.empireId),fixture=await H.evaluate(require('./beta-stability0-fixture.cjs').prepare,actor);
  await H.evaluate(()=>MP1Host.host.publish());
  await wait(B,f=>fleetRecoveryGroups(G.p).some(g=>g.id===f.lost&&g.ships.length===27&&g.jobs.length===2),fixture);
  assert.equal(await C.evaluate(f=>fleetRecoveryGroups(G.p).some(g=>g.id===f.lost),fixture),false);
  // Previously flaky selfleet path is exercised with native input before recovery.
  await B.evaluate(()=>{View.sel=null;UI.act('tab','filo');UI.refresh();});const selector='#panel [data-a="selfleet"][data-x="'+fixture.target+'"]',summary=B.locator(selector).first().locator('xpath=ancestor::details[not(@open)]/summary').first();if(await summary.count()){await summary.scrollIntoViewIfNeeded();if(process.env.MPP0_DESKTOP==='1')await summary.click({timeout:8000});else await summary.tap({timeout:8000});}await tap(B,selector);
  assert.equal(await B.evaluate(()=>View.sel?.id),fixture.target);
  for(const vp of[{width:800,height:360},{width:915,height:412},{width:960,height:540},{width:1920,height:1080}]){
   await B.setViewportSize(vp);
   for(const scale of[80,100,125]){
    await B.evaluate(({scale,id})=>{UI.setUIScale(scale);UI.closeModal();UI.act('fleetRecovery',id);},{scale,id:fixture.lost});
    await wait(B,()=>document.querySelector('#modal [data-a="fleetRecoveryDo"]'));
    const r=await B.locator('#modal').boundingBox();assert(r&&r.x>=-1&&r.y>=-1&&r.x+r.width<=vp.width+2&&r.y+r.height<=vp.height+2);
    rows.push({viewport:vp,requestedScale:scale,scale:await B.evaluate(()=>UI.getUIScale()),modalBox:r});
   }
   await B.screenshot({path:path.join(out,'stability-recovery-'+vp.width+'.png')});
  }
  await B.setViewportSize({width:960,height:540});
  await B.evaluate(f=>{UI.setUIScale(100);UI.closeModal();UI.act('fleetRecovery',f.lost);},fixture);
  await tap(B,'#modal [data-a="fleetRecoveryDo"][data-x$=":merge"]');
  await wait(B,()=>document.querySelector('#fleetRecoveryResult')?.textContent.includes('UYGULANDI'));
  await wait(H,f=>fleetRecoveryGroups(G.emps[f.actor]).find(g=>g.id===f.lost)?.ships.length===1,fixture);
  assert.equal(await H.evaluate(f=>fleetRecoveryGroups(G.emps[f.actor]).find(g=>g.id===f.lost).ships[0].ships.length,fixture),27);
  await tap(B,'#modal #fleetRecoveryResult [data-a="fleetRecovery"]');
  const index=await B.evaluate(f=>UI._fleetRecoveryPending.choices.findIndex(x=>x.target.fleet===f.target),fixture);assert(index>=0);
  const before=await H.evaluate(f=>({...G.emps[f.actor].res}),fixture);
  const sent=await B.evaluate(()=>MP6Stars.S.stats.sent.fleetRecovery||0);
  await tap(B,'#modal [data-a="fleetRecoveryDo"][data-x$=":'+index+'"]');
  await wait(B,()=>document.querySelector('#fleetRecoveryResult')?.textContent.includes('UYGULANDI'));
  await wait(H,f=>G.fleets.find(x=>x.id===f.target)?.ships.length===28,fixture);
  assert.deepEqual(await H.evaluate(f=>({...G.emps[f.actor].res}),fixture),before);
  assert.equal(await B.evaluate(()=>MP6Stars.S.stats.sent.fleetRecovery||0),sent+1);
  assert.equal(await H.evaluate(f=>G.sys[f.sys].queue.filter(q=>q.delivery?.fleet===f.target).length,fixture),2);
  await B.screenshot({path:path.join(out,'stability-recovery-ack.png')});
  assert.equal(await C.evaluate(f=>(G.fleetJournal||[]).some(r=>r.fleet===f.lost),fixture),false);
  rows.push({fixture,realCombat:true,nativeSelfleet:true,nativeBulkMerge:true,shipsBefore:27,shipsAfter:28,includedOriginalTargetShip:1,paidJobs:2,sameResources:true,hostAck:true,thirdPartyPrivate:true});
  fs.writeFileSync(path.join(out,'stability-recovery-ui.json'),JSON.stringify(rows,null,2));return rows;
 }catch(error){for(const [name,p]of[['H',H],['B',B],['C',C]]){await p.screenshot({path:path.join(out,'stability-failure-'+name+'.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'stability-failure-'+name+'.json'),JSON.stringify(await p.evaluate(()=>({modal:document.getElementById('modal')?.innerText,pending:UI._fleetRecoveryPending,groups:fleetRecoveryGroups(G.p).map(g=>({id:g.id,ships:g.ships.map(f=>f.id),jobs:g.jobs.length,stamp:fleetRecoveryStamp(g)})),results:globalThis.MP1Join?.results.slice(-5),rev:globalThis.MP6Stars?.S.rev,appliedRev:globalThis.MP6Stars?.S.appliedRev})),null,2));}throw error;}finally{for(const p of[H,B,C])await p.evaluate(()=>UI.closeModal()).catch(()=>{});await H.evaluate(s=>{if(!deserialize(s))throw Error('restore');G.autoSave=false;MP1Host.host.publish();},original);}
};
