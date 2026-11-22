'use strict';
// Only fixture setup and time control run on the host. Player decisions use the real relay and touch UI.
module.exports=async({test,pg,tap,wait,settle,assert,cmd,shot})=>{
 const {B,C,H}=pg;
 const b=await B.evaluate(()=>MP1Join.empireId),c=await C.evaluate(()=>MP1Join.empireId);
 await B.setViewportSize({width:800,height:360});await C.setViewportSize({width:844,height:390});
 await H.evaluate(([b,c])=>{
  MP1Host.host.local({kind:'speed',value:0});
  for(const i of [0,b,c])for(const j of [0,b,c])if(i!==j){const e=G.emps[i];e.contact[j]=true;e.rel[j]=80;e.res.etk=800;e.war[j]=false;}
  MP1Host.host.publish();
 },[b,c]);
 async function openDeal(page,id){
  await page.evaluate(real=>{UI.closeModal();const id=real===0?MP1Join.empireId:real;
   UI.forgetDeal(id);UI.openDeal(id);},id);
 }
 async function offer(page,to,side){
  const n=await H.evaluate(()=>MP1Host.host.dip.offers.length);
  await openDeal(page,to);await tap(page,'[data-a="dealAdd"][data-x="'+side+':portTransit"]');
  await tap(page,'[data-a="dealSend"]');
  await wait(H,n=>MP1Host.host.dip.offers.length>n,n);
  return H.evaluate(()=>MP1Host.host.dip.offers.at(-1).id);
 }
 async function record(page,id){
  await wait(page,id=>{MP71Dip.tick();return DiplomaticInbox.state().records.some(r=>r.mp===id&&r.status==='pending');},id);
  await page.evaluate(id=>ArchiveUI.record(DiplomaticInbox.state().records.find(r=>r.mp===id).id),id);
 }
 await settle('transit-temas');
 await test('TL1 B liman izni verir, C reddeder ve hiçbir hak oluşmaz',async()=>{
  const id=await offer(B,c,'give');await record(C,id);await tap(C,'#inboxNo');
  await wait(H,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='rejected',id);
  assert.equal(await H.evaluate(([b,c])=>!!G.emps[b].portTransit?.[c],[b,c]),false);
 });
 await test('TL2 C izin ister, B kabul eder, iki misafir aynı yön ve süreyi görür',async()=>{
  const id=await offer(C,b,'want');await record(B,id);await shot(B,'transit-kabul');await tap(B,'#inboxYes');
  await wait(H,([b,c])=>G.emps[b].portTransit?.[c]>G.day,[b,c]);
  await settle('transit-kabul');
  const end=await H.evaluate(([b,c])=>G.emps[b].portTransit[c],[b,c]);
  assert.equal(await B.evaluate(c=>G.p.portTransit[c],c),end);
  assert.equal(await C.evaluate(b=>G.emps[b].portTransit[0],b),end);
  const denied=await cmd('C',{kind:'revokePortTransit',target:c,actor:b});
  assert.equal(denied.status,'rejected');assert.equal(await H.evaluate(([b,c])=>G.emps[b].portTransit[c],[b,c]),end);
 });
 await test('TL3 izni veren misafir masadan geri alır',async()=>{
  await openDeal(B,c);await tap(B,'[data-a="revokePortTransit"]');
  await wait(H,([b,c])=>!G.emps[b].portTransit?.[c],[b,c]);await settle('transit-iptal');
 });
 await test('TL4 karşı teklif, kayıtlı izin ve süre sonu',async()=>{
  const id=await offer(C,b,'want');await record(B,id);await tap(B,'#inboxCounter');
  await tap(B,'[data-a="dealAdd"][data-x="want:portTransit"]');await tap(B,'[data-a="dealSend"]');
  await wait(H,id=>MP1Host.host.dip.offers.some(r=>r.id>id&&r.status==='pending'),id);
  const reply=await H.evaluate(()=>MP1Host.host.dip.offers.at(-1).id);
  await record(C,reply);await tap(C,'#inboxYes');
  await wait(H,([b,c])=>G.emps[b].portTransit?.[c]>G.day&&G.emps[c].portTransit?.[b]>G.day,[b,c]);
  const evidence=await H.evaluate(([b,c])=>{
   const raw=serialize(),end=G.emps[b].portTransit[c];
   const loaded=deserialize(raw);
   const preserved=loaded&&G.emps[b].portTransit[c]===end;
   G.day=end;const effective=Commerce.portRight(G.emps[b],G.emps[c]);MP1Host.host.publish();
   return {preserved,effective};
  },[b,c]);
  assert.deepEqual(evidence,{preserved:true,effective:false});
 });
};
