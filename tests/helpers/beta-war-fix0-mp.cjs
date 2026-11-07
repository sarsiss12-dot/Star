'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
module.exports=async(H,B,out)=>{
 const wait=(p,f,arg)=>p.waitForFunction(f,arg,{timeout:15000});
 const original=await H.evaluate(()=>serialize());
 try{
 await H.evaluate(()=>{UI.closeModal();MP1Host.host.local({kind:'speed',value:0});G.feds=[];G.council=null;G.warLedger=warLedgerEmpty();for(const e of G.emps){e.war={};e.warSince={};e.warDefense={};e.exh={};e.ally={};e.civics=[];e.overlord=null;}G.inbox=[];const a=G.emps[0],b=G.emps[1],c=G.emps[2];for(const x of [a,b,c])for(const y of [a,b,c])x.contact[y.id]=true;MP1Host.host.publish();});
 await wait(B,()=>!G.emps[1].war[0]);
 await H.evaluate(()=>{const a=G.emps[0],b=G.emps[1],c=G.emps[2];warAuthorize(a,b,{n:'Kontrollü doğrudan savaş'});if(!declareWar(a,b))throw Error('first front');warAuthClear();MP1Host.host.publish();});
 await wait(B,()=>G.inbox.some(n=>n.kind==='warstart'&&n.data.front===1));
 await H.evaluate(()=>{const a=G.emps[0],b=G.emps[1],c=G.emps[2];warAuthorize(c,b,{n:'Kontrollü federasyon çağrısı'});if(!declareWar(c,b,{sponsor:a.id,enemy:b.id,kind:'federation'}))throw Error('second front');warAuthClear();MP1Host.host.publish();});
 await wait(B,()=>G.inbox.filter(n=>n.kind==='warstart').length===2);
 const cards=await B.evaluate(()=>G.inbox.filter(n=>n.kind==='warstart').map(n=>({front:n.data.front,campaign:n.data.campaign,title:n.title,sub:n.sub,key:n.key})));
 assert.equal(new Set(cards.map(c=>c.front)).size,2);assert.equal(new Set(cards.map(c=>c.campaign)).size,1);assert(cards.some(c=>c.sub.includes('Federasyon')));
 await B.screenshot({path:path.join(out,'warfix-guest-two-fronts.png')});
 for(let i=0;i<2;i++){await H.evaluate(()=>MP1Host.host.publish());await B.waitForTimeout(650);}
 assert.equal(await B.evaluate(()=>G.inbox.filter(n=>n.kind==='warstart').length),2,'mirror rebuild duplicates/loss');
 const deal=await H.evaluate(()=>{for(const e of [G.emps[0],G.emps[1]])e.res.etk=10000;const r=MP1Host.host.local({kind:'offer',to:1,give:[{t:'peace'}],want:[]});if(!r.ok)throw Error(JSON.stringify(r));return MP1Host.host.dip.offers.filter(o=>o.from===0&&o.to===1&&o.status==='pending').at(-1).id;});
 await wait(B,id=>DiplomaticInbox.state().records.some(r=>r.mp===id&&r.status==='pending'),deal);
 await B.evaluate(()=>UI.closeModal());
 if(await B.locator('#diploPane').evaluate(e=>e.classList.contains('show')))await B.locator('#diploPane [data-a="closeDiplo"]').tap({timeout:8000});
 const uid=await B.evaluate(id=>G.inbox.find(n=>n.key==='mp71:'+id)?.uid,deal);assert(uid);
 for(let i=0;i<2;i++){const builds=await B.evaluate(()=>MP6Stars.S.stats.builds);await H.evaluate(()=>{G.emps[1].res.ene+=1;MP1Host.host.publish();});await wait(B,n=>MP6Stars.S.stats.builds>n,builds);assert.equal(await B.evaluate(id=>G.inbox.find(n=>n.key==='mp71:'+id)?.uid,deal),uid,'offer live UID changed under touch target');assert(await B.evaluate(()=>new Set(G.inbox.map(n=>n.uid)).size===G.inbox.length),'duplicate card IDs');}
 await B.locator('#inbox [data-a="openNote"][data-x="'+uid+'"]').tap({timeout:8000});
 await B.locator('#inboxYes').tap({timeout:8000});
 await wait(H,id=>MP1Host.host.dip.offers.find(o=>o.id===id)?.status==='accepted'&&!G.emps[0].war[1],deal);
 await B.evaluate(()=>UI.closeModal());await wait(B,()=>!G.p.war[1]&&G.p.war[2]);
 const before=await H.evaluate(()=>MP1Host.host.stats.deals);
 await B.evaluate(id=>MP1Join.cmd({kind:'respond',offer:id,action:'accept'}),deal);
 await B.waitForTimeout(700);assert.equal(await H.evaluate(()=>MP1Host.host.stats.deals),before,'duplicate applied peace twice');
 const state=await H.evaluate(()=>{const txt=serialize();if(!deserialize(txt))throw Error('Save8 load');MP1Host.host.publish();return {hostWar:!!G.emps[0].war[1],guestOtherWar:!!G.emps[1].war[2],ended:G.warLedger.fronts[0].endReason,pkg:StarsMP.validatePackage(MP1Host.host.snapshot({}).pkg).ok};});assert.equal(state.hostWar,false);assert(state.guestOtherWar);assert(state.pkg);
 await B.context().setOffline(true);await B.waitForTimeout(700);await B.context().setOffline(false);await wait(B,()=>MP1Join.ws?.readyState===1&&MP1Join.hostOnline);await wait(B,()=>!G.p.war[1]&&G.p.war[2]);
 await B.screenshot({path:path.join(out,'warfix-guest-partial-peace.png')});
 const result={cards,singleTrustedPeaceTap:true,duplicateApplied:false,save8:state,reconnect:true};fs.writeFileSync(path.join(out,'warfix-mp.json'),JSON.stringify(result,null,2));return result;
 }finally{await B.evaluate(()=>UI.closeModal());await H.evaluate(txt=>{UI.closeModal();if(!deserialize(txt))throw Error('restore fixture');MP1Host.host.publish();},original);}
};
