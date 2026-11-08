'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
module.exports=async(H,B,out)=>{
 const wait=(p,f,a)=>p.waitForFunction(f,a,{timeout:15000}),tap=(p,s)=>p.locator(s).first().tap({timeout:8000});
 const original=await H.evaluate(()=>serialize()),originalSpeed=await H.evaluate(()=>G.speed);const result=[];
 try{
 for(const reverse of [false,true]){
 await H.evaluate(()=>{UI.closeModal();MP1Host.host.local({kind:'speed',value:0});G.feds=[];delete G.fedFounding;G.diplomaticInbox=DiplomaticInbox.empty();G.inbox=[];for(const e of G.emps){e.overlord=null;e._fedLeaveUntil=0;e.civics=[];e.res.etk=10000;}for(const [a,b] of [[0,1]]){G.emps[a].contact[b]=G.emps[b].contact[a]=true;G.emps[a].ally[b]=G.emps[b].ally[a]=true;G.emps[a].war[b]=G.emps[b].war[a]=false;}MP1Host.host.publish();UI.openFed();});
 await wait(B,()=>!findFed(G.p)&&!G.fedFounding);await B.evaluate(()=>{UI.closeModal();UI.openFed();});
 const proposer=reverse?B:H,receiver=reverse?H:B,peer=1;
 await tap(proposer,'[data-a="fedFoundType"][data-x="bilimsel"]');
 await tap(proposer,'[data-a="fedFoundSelect"][data-x="'+peer+'"]');
 await tap(proposer,'[data-a="fedFoundStart"]');
 await wait(H,()=>G.fedFounding?.proposals.length===1);await wait(receiver,()=>G.inbox.some(n=>n.kind==='fedfound'));
 const before=await H.evaluate(()=>({fed:G.feds.length,cost:G.emps[fedFoundGet(1).by].res.etk,reply:fedFoundGet(1).replies[1-fedFoundGet(1).by].status}));assert.equal(before.fed,0);assert.equal(before.cost,10000);assert.equal(before.reply,'pending');
 // Use the actual invite's full record and its real accept target.
 if(await receiver.locator('#diploPane').evaluate(e=>e.classList.contains('show')))await tap(receiver,'#diploPane [data-a="closeFed"],#diploPane [data-a="closeDiplo"]');
 const uid=await receiver.evaluate(()=>G.inbox.find(n=>n.kind==='fedfound').uid);await tap(receiver,'#inbox [data-a="openNote"][data-x="'+uid+'"]');
 await receiver.screenshot({path:path.join(out,'fd0-'+(reverse?'host':'guest')+'-invite.png')});
 const text=await receiver.locator('#modal').innerText();assert(text.includes('Federasyon kuruluş daveti'));assert(text.includes('bilim')||text.includes('Bilim'));
 await tap(receiver,'#inboxYes');await receiver.evaluate(()=>UI.closeModal());
 await wait(H,()=>Object.values(fedFoundGet(1).replies).every(r=>r.status==='accepted'));assert.equal(await H.evaluate(()=>G.feds.length),0,'AI acceptance or remote reply finalized without proposer');
 await proposer.evaluate(()=>UI.openFed());await tap(proposer,'[data-a="fedFoundFinish"][data-x="1"]');
 await wait(H,()=>G.feds.length===1);await wait(B,()=>!!findFed(G.p));
 const final=await H.evaluate(()=>({members:G.feds[0].members,by:fedFoundGet(1).by,cost:G.emps[fedFoundGet(1).by].res.etk,status:fedFoundGet(1).status}));assert.deepEqual(final.members,reverse?[1,0]:[0,1]);assert.equal(final.cost,9780);assert.equal(final.status,'founded');
 const h=await B.evaluate(()=>({members:findFed(G.p).members,name:findFed(G.p).name,notices:DiplomaticInbox.state().records.filter(r=>r.kind==='fedfoundResult').map(r=>r.title)}));assert.equal(h.members.length,2);assert(h.notices.some(t=>t.includes('KURULDU')));
 await B.screenshot({path:path.join(out,'fd0-'+(reverse?'guest-founder':'host-founder')+'-formed.png')});
 await B.context().setOffline(true);await B.waitForTimeout(500);await B.context().setOffline(false);await wait(B,()=>MP1Join.hostOnline&&MP1Join.ws.readyState===1&&findFed(G.p)?.members.length===2);
 result.push({reverse,before,final,guest:h,reconnect:true});
 }
 fs.writeFileSync(path.join(out,'fedfound-browser.json'),JSON.stringify(result,null,2));return result;
 }catch(e){for(const [n,p]of[['host',H],['guest',B]])try{await p.screenshot({path:path.join(out,'fd0-failure-'+n+'.png')});fs.writeFileSync(path.join(out,'fd0-failure-'+n+'.json'),JSON.stringify(await p.evaluate(()=>({proposals:G.fedFounding,mirror:globalThis.MP6Stars?.S.mirror?.world,stats:globalThis.MP6Stars?.S.stats,boot:globalThis.MP6Stars?.S.boot,inbox:G.inbox,records:DiplomaticInbox.state().records,pane:$('diploPane').innerHTML,modal:$('modal').innerHTML})),null,2));}catch{}throw e;
 }finally{await H.evaluate(s=>{UI.closeModal();deserialize(s);MP1Host.host.publish();},original);await B.evaluate(()=>UI.closeModal());await H.evaluate(value=>{const r=MP1Host.host.local({kind:'speed',value});if(!r.ok&&r.code!=='rules:same')throw Error('fixture speed restore '+r.code);},originalSpeed);}
};
