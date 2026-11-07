'use strict';
const assert=require('assert/strict');
module.exports=async(H,B)=>{
 const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:15000});
 await B.evaluate(()=>UI.closeModal());
 await H.evaluate(()=>{UI.closeModal();G.council=null;G.warLedger=warLedgerEmpty();for(const e of G.emps){e.war={};e.exh={};e.wg={};e.ally={};e.civics=[];}const a=G.emps[0],b=G.emps[1];a.contact[1]=b.contact[0]=true;a.war[1]=b.war[0]=true;warLedgerOpen(0,1);MP1Host.host.publish();});
 await wait(B,()=>MP6Stars.S.mirror.news.records.some(r=>r.key==='war-front:1'&&r.warStatus?.ended===null));
 await wait(B,()=>G.news.records.some(r=>r.key==='war-front:1'));
 await B.evaluate(()=>{const r=G.news.records.find(r=>r.key==='war-front:1');ArchiveUI.detail(r.id);});assert((await B.locator('#modal').innerText()).includes('AKTİF'));await B.screenshot({path:process.env.STARS_OUTPUT+'/guest-war-active.png'});
 await B.evaluate(()=>UI.closeModal());await H.evaluate(()=>{G.emps[0].exh[1]=100;warExhTick();MP1Host.host.publish();});
 await wait(B,()=>G.news.records.some(r=>r.key==='war-end:1'));
 await B.evaluate(()=>ArchiveUI.detail(G.news.records.find(r=>r.key==='war-front:1').id));const text=await B.locator('#modal').innerText();assert(text.includes('SONA ERDİ'));assert(text.includes('zorunlu barış'));await B.screenshot({path:process.env.STARS_OUTPUT+'/guest-war-ended.png'});
 const r=await H.evaluate(()=>{const humans=G.emps.filter(e=>e.ai===false);window.__trust=trustOf;trustOf=()=>-100;embargoTick();trustOf=__trust;return {war:[!!G.emps[0].war[1],!!G.emps[1].war[0]],humanEmbargo:humans.map(e=>Object.keys(e.embargo||{})),reason:G.warLedger.fronts.find(f=>f.id===1).endReason,save:StarsMP.validatePackage(MP1Host.host.snapshot({}).pkg).ok};});
 assert.deepEqual(r.war,[false,false]);assert(r.humanEmbargo.every(x=>x.length===0));assert(r.save);return r;
};
