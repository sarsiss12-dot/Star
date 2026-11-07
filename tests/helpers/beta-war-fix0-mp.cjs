'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
module.exports=async(H,B,out)=>{
 const wait=(p,f,arg)=>p.waitForFunction(f,arg,{timeout:15000});
 const original=await H.evaluate(()=>serialize());
 try{
 await H.evaluate(()=>{UI.closeModal();MP1Host.host.local({kind:'speed',value:0});G.feds=[];G.council=null;G.warLedger=warLedgerEmpty();for(const e of G.emps){e.war={};e.warSince={};e.warDefense={};e.exh={};e.ally={};e.civics=[];e.overlord=null;}G.inbox=[];const a=G.emps[0],b=G.emps[1],c=G.emps[2];for(const x of [a,b,c])for(const y of [a,b,c])x.contact[y.id]=true;b.contact[c.id]=false;c.contact[b.id]=false;MP1Host.host.publish();});
 await wait(B,()=>!G.emps[1].war[0]);
 await H.evaluate(()=>{const a=G.emps[0],b=G.emps[1],c=G.emps[2];warAuthorize(a,b,{n:'Kontrollü doğrudan savaş'});if(!declareWar(a,b))throw Error('first front');warAuthClear();MP1Host.host.publish();});
 await wait(B,()=>G.inbox.some(n=>n.kind==='warstart'&&n.data.front===1));
 await H.evaluate(()=>{const a=G.emps[0],b=G.emps[1],c=G.emps[2];warAuthorize(c,b,{n:'Kontrollü federasyon çağrısı'});if(!declareWar(c,b,{sponsor:a.id,enemy:b.id,kind:'federation'}))throw Error('second front');warAuthClear();MP1Host.host.publish();});
 await wait(B,()=>G.inbox.filter(n=>n.kind==='warstart').length===2);
 const cards=await B.evaluate(()=>G.inbox.filter(n=>n.kind==='warstart').map(n=>({front:n.data.front,campaign:n.data.campaign,title:n.title,sub:n.sub,key:n.key})));
 assert.equal(new Set(cards.map(c=>c.front)).size,2);assert.equal(new Set(cards.map(c=>c.campaign)).size,1);assert(cards.some(c=>c.sub.includes('Federasyon')));
 await B.screenshot({path:path.join(out,'warfix-guest-two-fronts.png')});
 const newsId=await B.evaluate(()=>G.news.records.find(r=>r.key==='war-front:2').id);await B.evaluate(()=>ArchiveUI.open('news'));await B.locator('[data-a="newsDetail"][data-x="'+newsId+'"]').tap({timeout:8000});const detailText=await B.locator('#modal').innerText();assert(detailText.includes('Federasyon savunma paktı'));assert(detailText.includes('Çağıran devlet:'));fs.writeFileSync(path.join(out,'warfix-guest-news-detail.txt'),detailText);await B.screenshot({path:path.join(out,'warfix-guest-news-detail.png')});await B.locator('#modal .mhd [data-a="closem"]').tap({timeout:8000});
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
 const firstPartial=await H.evaluate(()=>({peaceWithHost:!G.emps[1].war[0],otherEnemyStillActive:!!G.emps[1].war[2]}));assert(firstPartial.otherEnemyStillActive);
 const before=await H.evaluate(()=>MP1Host.host.stats.deals);
 await B.evaluate(id=>MP1Join.cmd({kind:'respond',offer:id,action:'accept'}),deal);
 await B.waitForTimeout(700);assert.equal(await H.evaluate(()=>MP1Host.host.stats.deals),before,'duplicate applied peace twice');
 // A new source war may call the guest; peace then settles that exact old call.
 await H.evaluate(()=>{const a=G.emps[0],b=G.emps[1],l=G.emps[3];if(b.war[2])makePeace(b,G.emps[2]);b.overlord=l.id;b.contact[l.id]=l.contact[b.id]=true;vassalInstall(l,b,'bekci',vassalDefaultTerms('bekci'),'voluntary');warAuthorize(l,a,{n:'Yeni kaynak savaş'});if(!declareWar(l,a))throw Error('lord source');warAuthClear();vassalJoinWars(l,b);if(!b.war[0])throw Error('new source call rejected');MP1Host.host.publish();});
 await wait(B,()=>!!G.p.war[1]);
 const second=await H.evaluate(()=>{const r=MP1Host.host.local({kind:'offer',to:1,give:[{t:'peace'}],want:[]});if(!r.ok)throw Error(JSON.stringify(r));return MP1Host.host.dip.offers.filter(o=>o.from===0&&o.to===1&&o.status==='pending').at(-1).id;});
 await wait(B,id=>G.inbox.some(n=>n.key==='mp71:'+id),second);await B.evaluate(()=>UI.closeModal());const uid2=await B.evaluate(id=>G.inbox.find(n=>n.key==='mp71:'+id).uid,second);await B.locator('#inbox [data-a="openNote"][data-x="'+uid2+'"]').tap({timeout:8000});await B.locator('#inboxYes').tap({timeout:8000});await wait(H,()=>!G.emps[1].war[0]);await B.evaluate(()=>UI.closeModal());
 await H.evaluate(()=>{vassalTick();if(G.emps[1].war[0])throw Error('old monthly call reopened peace');if(!G.emps[3].war[0])throw Error('partial peace incorrectly closed lord source');MP1Host.host.publish();});await wait(B,()=>!G.p.war[1]);
 const state=await H.evaluate(()=>{const txt=serialize();if(!deserialize(txt))throw Error('Save8 load');MP1Host.host.publish();return {hostWar:!!G.emps[0].war[1],sourceWar:!!G.emps[3].war[0],ended:G.warLedger.fronts[0].endReason,pkg:StarsMP.validatePackage(MP1Host.host.snapshot({}).pkg).ok};});assert.equal(state.hostWar,false);assert(state.sourceWar);assert(state.pkg);
 await B.context().setOffline(true);await B.waitForTimeout(700);await B.context().setOffline(false);await wait(B,()=>MP1Join.ws?.readyState===1&&MP1Join.hostOnline);await wait(B,()=>!G.p.war[1]);
 await B.screenshot({path:path.join(out,'warfix-guest-partial-peace.png')});
 const result={cards,guestInitiallyDidNotKnowSideFront:true,firstPartial,singleTrustedPeaceTap:true,duplicateApplied:false,vassalOldCallStayedPeace:true,newSourceCallAllowed:true,save8:state,reconnect:true};fs.writeFileSync(path.join(out,'warfix-mp.json'),JSON.stringify(result,null,2));return result;
 }finally{await B.evaluate(()=>UI.closeModal());await H.evaluate(txt=>{UI.closeModal();if(!deserialize(txt))throw Error('restore fixture');MP1Host.host.publish();},original);}
};
