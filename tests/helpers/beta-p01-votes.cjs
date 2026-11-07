'use strict';
const assert=require('assert/strict');
module.exports=async(H,B)=>{
 const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:15000});
 await H.evaluate(()=>{MP1Host.host.local({kind:'speed',value:0});G.cfg.council='normal';G.council={name:'İki insan oylaması',founder:0,members:[0,1],laws:{},targeted:{},treasury:0,president:0,terms:{0:1},voteIn:12,dead:false,vote:{key:'ticaretStd',target:null,opened:G.day,yes:[],no:[],speeches:[],done:false,age:0,sponsor:null}};MP1Host.host.publish();});
 await wait(B,()=>!!G.council?.vote);await B.evaluate(()=>{UI.closeModal();UI.openCouncil();window.__seen0=MP6Stars.S.seenResults;MP6Stars.S.seenResults=1e9;});
 const count=await B.evaluate(()=>MP6Stars.S.stats.sent.councilVote||0);
 await B.locator('#diploPane [data-a="cncYes"]').tap({timeout:8000});
 await wait(H,()=>G.council.vote?.yes.includes(1));
 await wait(B,()=>!!UI._councilPending&&document.getElementById('councilVoteStatus').textContent.includes('bekliyor'));
 assert.equal(await B.locator('#diploPane [data-a="cncYes"]').isDisabled(),true);
 // Delay only UI consumption of the actual host ACK; do not fabricate its result.
 await B.evaluate(()=>{UI.openDiplo();MP6Stars.S.seenResults=window.__seen0;});
 await wait(B,()=>!!UI._councilAck);assert((await B.evaluate(()=>$('diploPane')._surfaceKey)).startsWith('diplo:'));
 assert.equal(await B.evaluate(()=>MP6Stars.S.stats.sent.councilVote||0),count+1);
 assert.equal(await H.evaluate(()=>G.council.vote.yes.filter(x=>x===1).length),1);
 await H.evaluate(()=>{UI.closeModal();UI.openCouncil();});await H.locator('#diploPane [data-a="cncNo"]').tap({timeout:8000});
 await wait(H,()=>!G.council.vote||G.council.vote.done);await B.context().setOffline(true);await B.waitForTimeout(700);await B.context().setOffline(false);
 await wait(B,()=>MP1Join.ws?.readyState===1&&MP1Join.hostOnline);await wait(B,()=>!G.council.vote||G.council.vote.done);
 return {guestYes:1,hostNo:1,singleTap:true,realAckHeldByTest:true,otherPanelKept:true,reconnect:true};
};
