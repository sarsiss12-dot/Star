'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
async function cmd(p,c){const cid=await p.evaluate(c=>MP1Join.cmd(c).cid,c);await p.waitForFunction(id=>MP1Join.results.some(r=>r.cid===id),cid,{timeout:15000});return p.evaluate(id=>MP1Join.results.find(r=>r.cid===id),cid);}
const hit=async(p,s)=>{const l=p.locator(s).first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:8000});};
exports.prepare=async(H,B,C,e)=>{
 const f=await H.evaluate(e=>{MP1Host.host.local({kind:'speed',value:0});for(const id of [0,e.B,e.C]){const a=G.emps[id];a.res.min=a.res.etk=10000;for(const b of G.emps)if(!b.wild&&!b.crisisSide){a.contact[b.id]=b.contact[id]=true;}}
  const target=G.emps.find(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide&&!isPurifier(o)&&[G.p,G.emps[e.B],G.emps[e.C]].every(a=>warDeclarationPreview(a,o,Object.keys(WAR_GOALS)[0]).ok&&canPromiseWarOn(a,o).ok));if(!target)throw Error('No eligible preparation target');MP1Host.host.publish();return {target:target.id,goal:Object.keys(WAR_GOALS)[0],...e};},e);
 let r=await cmd(B,{kind:'warPrepare',target:f.target,goal:f.goal});assert.equal(r.status,'ok',JSON.stringify(r));f.id=r.extra.id;
 r=await cmd(B,{kind:'offer',to:e.C,give:[{t:'res',r:'min',v:150}],want:[{t:'warJoin',plan:f.id,target:f.target}]});assert.equal(r.status,'ok',JSON.stringify(r));f.accepted=r.extra.offer;
 assert.equal((await cmd(C,{kind:'respond',offer:f.accepted,action:'accept'})).status,'ok');
 r=await cmd(B,{kind:'offer',to:0,give:[{t:'res',r:'min',v:100}],want:[{t:'warJoin',plan:f.id,target:f.target}]});assert.equal(r.status,'ok',JSON.stringify(r));f.pending=r.extra.offer;f.state=await H.evaluate(()=>G.warLedger.preparations);return f;
};
exports.verify=async(H,B,C,s,out)=>{assert.deepEqual(await H.evaluate(()=>G.warLedger.preparations),s.state);assert.equal(await H.evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id)?.status,s.pending),'pending');fs.writeFileSync(path.join(out,'war-center-cold-preparation.json'),JSON.stringify(s,null,2));};
exports.finish=async(H,B,C,s,out)=>{
 await H.evaluate(()=>{UI.closeModal();MP71Dip.sync();});await H.waitForFunction(id=>G.inbox.some(n=>n.key==='mp71:'+id),s.pending,{timeout:15000});const uid=await H.evaluate(id=>G.inbox.find(n=>n.key==='mp71:'+id).uid,s.pending);await hit(H,'[data-a="openNote"][data-x="'+uid+'"]');await hit(H,'#inboxYes');await H.waitForFunction(id=>G.warLedger.preparations.find(p=>p.id===id).commitments.length===2,s.id,{timeout:15000});
 const before=await H.evaluate(s=>Object.fromEntries([0,s.B,s.C].map(id=>[id,G.emps[id].res.min])),s);
 await B.evaluate(id=>{UI.closeModal();WarCenterUI.open(0,null,id);},s.id);await B.waitForFunction(()=>document.querySelector('[data-a="warPrepareLaunchAsk"]:not([disabled])'),undefined,{timeout:15000});await hit(B,'[data-a="warPrepareLaunchAsk"]');await hit(B,'[data-a="warPrepareLaunch"]');await H.waitForFunction(s=>G.warLedger.preparations.find(p=>p.id===s.id).state==='launched',s,{timeout:15000});
 const after=await H.evaluate(s=>Object.fromEntries([0,s.B,s.C].map(id=>[id,G.emps[id].res.min])),s);assert.equal(before[s.B]-after[s.B],250);assert.equal(after[s.C]-before[s.C],150);assert.equal(after[0]-before[0],100);
 assert.equal(await C.evaluate(()=>MP1Join.empireId),s.C);const r=await cmd(C,{kind:'respond',offer:s.accepted,action:'accept'});assert.notEqual(r.status,'ok');assert.notEqual(r.code,'rules:not-recipient','duplicate must be tested by the original recipient');assert.deepEqual(await H.evaluate(s=>Object.fromEntries([0,s.B,s.C].map(id=>[id,G.emps[id].res.min])),s),after);
 for(const p of [H,B,C])await p.evaluate(()=>UI.closeModal());fs.writeFileSync(path.join(out,'war-center-cold-result.json'),JSON.stringify({before,after,duplicate:r.code,once:true},null,2));return {saved:true,nativeHostAccept:true,nativeGuestLaunch:true,chargedOnce:true};
};
