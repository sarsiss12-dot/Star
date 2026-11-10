'use strict';const fs=require('fs'),path=require('path'),assert=require('assert/strict');
exports.prepare=async(H,B,C,e)=>{
 for(const p of[H,B,C])await p.evaluate(()=>UI.closeModal());
 await H.waitForFunction(()=>{const r=MP1Host.host.local({kind:'speed',value:0});return(r.ok||r.code==='rules:same')&&G.speed===0;});
 const f=await H.evaluate(require('./beta-stability0-fixture.cjs').prepare,e.B);
 await H.evaluate(()=>MP1Host.host.publish());await B.waitForFunction(f=>fleetRecoveryGroups(G.p).some(g=>g.id===f.lost&&g.ships.length===27),f);
 const state=await H.evaluate(f=>({resources:{...G.emps[f.actor].res},queue:G.sys[f.sys].queue.map(q=>({...q})),ships:G.fleets.filter(f=>f.e===1).reduce((n,f)=>n+f.ships.length,0),journal:G.fleetJournal.filter(r=>r.owner===f.actor)}),f);
 return {...f,...state};
};
exports.verify=async(H,B,C,s,out)=>{
 assert.deepEqual(await H.evaluate(s=>G.emps[s.actor].res,s),s.resources);
 assert.deepEqual(await H.evaluate(s=>G.sys[s.sys].queue,s),s.queue);
 assert.deepEqual(await H.evaluate(s=>G.fleetJournal.filter(r=>r.owner===s.actor),s),s.journal);
 assert.equal(await H.evaluate(s=>G.fleets.filter(f=>f.e===s.actor).reduce((n,f)=>n+f.ships.length,0),s),s.ships);
 await B.waitForFunction(s=>fleetRecoveryGroups(G.p).some(g=>g.id===s.lost&&g.ships.length===27&&g.jobs.length===2),s);
 assert.equal(await C.evaluate(s=>fleetRecoveryGroups(G.p).some(g=>g.id===s.lost),s),false);
 fs.writeFileSync(path.join(out,'stability-cold.json'),JSON.stringify({sameResources:true,samePaidQueue:true,sameHulls:true,sameAudit:true,ownRecovery:true,thirdPartyPrivate:true},null,2));
};
exports.finish=async(H,B,s,out)=>{
 await B.evaluate(s=>{UI.closeModal();UI.act('closeDiplo');UI.act('fleetRecovery',s.lost);},s);
 const p=await B.evaluate(s=>({id:UI._fleetRecoveryPending.id,stamp:UI._fleetRecoveryPending.stamp,index:UI._fleetRecoveryPending.choices.findIndex(x=>x.target.fleet===s.target)}),s);assert(p.index>=0);
 const before=await H.evaluate(s=>({...G.emps[s.actor].res}),s),l=B.locator('#modal [data-a="fleetRecoveryDo"][data-x$=":'+p.index+'"]').first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:8000});
 await B.waitForFunction(()=>document.querySelector('#fleetRecoveryResult')?.textContent.includes('UYGULANDI'));
 assert.equal(await H.evaluate(s=>G.fleets.find(f=>f.id===s.target).ships.length,s),28);assert.deepEqual(await H.evaluate(s=>G.emps[s.actor].res,s),before);
 assert.equal(await H.evaluate(s=>G.sys[s.sys].queue.filter(q=>q.delivery?.fleet===s.target).length,s),2);
 const cid=await B.evaluate(({s,p})=>MP1Join.cmd({kind:'fleetRecovery',id:s.lost,action:'retarget',target:{fleet:s.target},stamp:p.stamp}).cid,{s,p});assert(cid);
 await B.waitForFunction(cid=>MP1Join.results.some(r=>r.cid===cid),cid);const result=await B.evaluate(cid=>MP1Join.results.find(r=>r.cid===cid),cid);assert.notEqual(result.status,'ok');
 assert.deepEqual(await H.evaluate(s=>G.emps[s.actor].res,s),before);assert.equal(await H.evaluate(s=>G.fleets.find(f=>f.id===s.target).ships.length,s),28);
 await B.screenshot({path:path.join(out,'stability-cold-applied.png')});await B.evaluate(()=>UI.closeModal());
 const row={realColdRoomNativeRecovery:true,reinforcements:27,totalWithTarget:28,paidOrders:2,sameResources:true,replayStatus:result.status,replayCode:result.code};fs.writeFileSync(path.join(out,'stability-cold-applied.json'),JSON.stringify(row,null,2));return row;
};
