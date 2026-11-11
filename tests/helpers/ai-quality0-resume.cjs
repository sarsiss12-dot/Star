'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const tap=async(p,s)=>{const l=p.locator(s).first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:8000});};
async function navigate(H,B){
 await H.waitForFunction(()=>{const r=MP1Host.host.local({kind:'speed',value:0});return (r.ok||r.code==='rules:same')&&G.speed===0;});
 await B.evaluate(()=>{UI.closeModal();UI.act('closeDiplo');});
 if(!await B.locator('#outEmp').evaluate(e=>e.classList.contains('open')))await tap(B,'#grpEmp [data-a="grpTog"]');
 await tap(B,'#outEmp [data-a="colonies"]');assert.equal(await B.locator('#outMap [data-a="colonies"]').count(),0);
 await tap(B,'#colonyTable [data-a="colonySelect"]');await tap(B,'#colonyTable [data-a="colonyMap"]');await tap(B,'#colonyRestoreChip');
 await B.evaluate(()=>UI.act('closeDiplo'));await B.evaluate(()=>UI.act('tab','intel'));
 for(const v of['networks','operations','files'])await tap(B,'[data-a="intelView"][data-x="'+v+'"]');
 await B.evaluate(()=>UI.act('tab','sistem'));
}
exports.prepare=async(H,B,C)=>{await navigate(H,B);const s=await H.evaluate(()=>{const x=JSON.parse(serialize());if(!Array.isArray(x.fl)||!x.events)throw Error("nonempty Save8 fields required");return {rng:RND_STATE,resources:x.emps.map(e=>e.res),fleets:x.fl,systems:x.sys,world:x.world,events:x.events,war:x.warLedger};});return s;};
exports.verify=async(H,B,C,s,out)=>{const now=await H.evaluate(()=>{const x=JSON.parse(serialize());if(!Array.isArray(x.fl)||!x.events)throw Error("nonempty Save8 fields required");return {rng:RND_STATE,resources:x.emps.map(e=>e.res),fleets:x.fl,systems:x.sys,world:x.world,events:x.events,war:x.warLedger};});assert.deepEqual(now,s,'cold resume keeps strategic records exactly');await navigate(H,B);assert.deepEqual(await H.evaluate(()=>RND_STATE),s.rng);await B.screenshot({path:path.join(out,'quality-ui23-cold.png')});fs.writeFileSync(path.join(out,'quality-ui23-cold.json'),JSON.stringify({exactResourcesFleetsWorldEventsWarRng:true,nativeColoniesMinimizeRestoreAndSpyBeforeAfter:true},null,2));};
