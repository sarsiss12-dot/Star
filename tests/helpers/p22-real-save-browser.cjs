'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
module.exports=async(H,B,C,out,{tap,wait})=>{
 const original=await H.evaluate(()=>serialize()),source=fs.readFileSync(process.env.STARS_USER_SAVE,'utf8');
 try{
  for(const p of[H,B,C])await p.evaluate(()=>{UI.closeModal();UI.act('closeDiplo');});
  await H.evaluate(text=>{MP1Host.host.local({kind:'speed',value:0});if(!deserialize(text))throw Error('real load');G.autoSave=false;G.speed=0;G.emps[1].ai=false;G.emps[2].ai=false;MP1Host.host.publish();},source);
  await wait(B,()=>G.sys.length===300&&G.emps.length===23&&G.p.name!== 'Ororni Filosu');await wait(C,()=>G.sys.length===300&&G.emps.length===23);
  const initial=await H.evaluate(()=>({playerShips:G.fleets.filter(f=>f.e===0).reduce((n,f)=>n+f.ships.length,0),resources:JSON.stringify(G.emps.map(e=>e.res)),jobs:JSON.stringify(G.sys.flatMap(s=>(s.queue||[]).map(q=>({s:s.id,paid:q.paid,left:q.left,tot:q.tot})))),rng:RND_STATE}));assert.equal(initial.playerShips,44);
  assert.equal(await B.evaluate(()=>G.p.id),0);assert.equal(await B.evaluate(()=>G.fleets.filter(f=>f.e===0).length),await H.evaluate(()=>G.fleets.filter(f=>f.e===1).length));
  assert.equal(await C.evaluate(()=>fleetRecoveryGroups(G.p).some(g=>g.id===1&&g.ships.length===27)),false);
  // Host uses the actual saved player's recovery; native buttons, no forced click.
  await H.evaluate(()=>UI.act('fleetRecovery',1));await tap(H,'#modal [data-a="fleetRecoveryDo"][data-x$=":merge"]');
  assert.equal(await H.evaluate(()=>fleetRecoveryGroups(G.p).find(g=>g.id===1).ships.length),2);
  for(const id of[1,1945]){
   await H.evaluate(id=>{UI.closeModal();UI.act('fleetRecovery',id);},id);const i=await H.evaluate(()=>UI._fleetRecoveryPending.choices.findIndex(x=>x.target.fleet===1884));assert(i>=0);await tap(H,'#modal [data-a="fleetRecoveryDo"][data-x$=":'+i+'"]');assert.match(await H.locator('#fleetRecoveryResult').innerText(),/UYGULANDI/);
  }
  // A real guest manages its own original-save orphan group through host command / ACK.
  const guest=await H.evaluate(()=>{const e=G.emps[1],g=fleetRecoveryGroups(e)[0],t=G.fleets.find(f=>f.e===1&&f.ships.length&&!hasShipment(f));if(!g||!t)throw Error('guest group');return{id:g.id,target:t.id};});
  await wait(B,g=>fleetRecoveryGroups(G.p).some(x=>x.id===g.id),guest);await B.evaluate(g=>{UI.closeModal();UI.act('fleetRecovery',g.id);},guest);
  const pending=await B.evaluate(g=>({index:UI._fleetRecoveryPending.choices.findIndex(x=>x.target.fleet===g.target),stamp:UI._fleetRecoveryPending.stamp}),guest);assert(pending.index>=0);
  await tap(B,'#modal [data-a="fleetRecoveryDo"][data-x$=":'+pending.index+'"]');await wait(B,()=>document.querySelector('#fleetRecoveryResult')?.innerText.includes('UYGULANDI'));
  const cid=await B.evaluate(({g,p})=>MP1Join.cmd({kind:'fleetRecovery',id:g.id,action:'retarget',target:{fleet:g.target},stamp:p.stamp}).cid,{g:guest,p:pending});await wait(B,cid=>MP1Join.results.some(x=>x.cid===cid),cid);assert.notEqual(await B.evaluate(cid=>MP1Join.results.find(x=>x.cid===cid).status,cid),'ok');
  const state=await H.evaluate(()=>({playerShips:G.fleets.filter(f=>f.e===0).reduce((n,f)=>n+f.ships.length,0),resources:JSON.stringify(G.emps.map(e=>e.res)),jobs:JSON.stringify(G.sys.flatMap(s=>(s.queue||[]).map(q=>({s:s.id,paid:q.paid,left:q.left,tot:q.tot})))),rng:RND_STATE,ownJobs:G.sys.flatMap(s=>s.queue||[]).filter(q=>q.e===0&&q.delivery?.fleet===1884).length}));
  assert.equal(state.playerShips,44);assert.equal(state.ownJobs,117);assert.equal(state.resources,initial.resources);assert.equal(state.jobs,initial.jobs);assert.equal(state.rng,initial.rng);
  await H.evaluate(()=>{var s=serialize();if(!deserialize(s))throw Error('reload');G.autoSave=false;MP1Host.host.publish();});await wait(B,()=>G.sys.length===300);
  const privacy=await H.evaluate(()=>{const b=StarsMirror.build(1),c=StarsMirror.build(2);return[b,c].every((m,i)=>m.emps[i+1]?.res?.ala===0&&m.sys.filter(s=>s.o!==0).every(s=>!s.q.length)&&m.fleetJournal.every(r=>r.owner===0));});assert(privacy);
  fs.writeFileSync(path.join(out,'real-save-browser.json'),JSON.stringify({realSave:true,systems:300,empires:23,hostSavedPlayer:true,guestOriginalEmpire:1,thirdOriginalEmpire:2,nativeHost27Recovery:true,nativeGuestHostAck:true,replayRejected:true,playerShips:44,paidJobs:117,sameResources:true,sameProgress:true,sameRng:true,privacy:true,inProcessReload:true,coldNewRoom:'NOT RUN'},null,2));
 }finally{for(const p of[H,B,C])await p.evaluate(()=>UI.closeModal()).catch(()=>{});await H.evaluate(s=>{if(!deserialize(s))throw Error('restore');G.autoSave=false;MP1Host.host.publish();},original);}
};
