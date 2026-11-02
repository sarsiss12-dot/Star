'use strict';
/* MP.7.5 — savaş / barış tutarlılığı (tek oyunculu runtime; Node vm + DOM taklidi).
   Ölçülen kök neden (gerçek telefon gözlemi "kabul edildi ama bekliyor / kayıtlar birikiyor"): barış kaydının anahtarı teklifin
   doğuş gününü içerir; AI 450 günde bir yeniden teklif eder, kayıt 540 günde dolar → aynı devletten iki bekleyen barış kaydı.
   Biri kabul edilip savaş bitince diğeri süresi dolana kadar "bekliyor" kalıyordu (sync barış kaydını hiç kapatmıyordu).
   Ayrıca üst ⚔ sayacı her canlı düşmanı sayar, diplomasi listesi yalnız temas kurulanları gösterir → AKTİF SAVAŞLAR penceresi. */
const assert=require('assert/strict'),{world,harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),eq=(a,b=true)=>assert.equal(a,b);
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const atWar=(h,id)=>h.run(`G.p.war[${id}]=true;G.emps[${id}].war[0]=true;G.p.warSince=G.p.warSince||{};G.p.warSince[${id}]=G.day-400;G.emps[${id}].warSince=G.emps[${id}].warSince||{};G.emps[${id}].warSince[0]=G.day-400;`);
test('aynı devletten ikinci barış teklifi eskisinin yerine geçer; kabul savaşı bitirir, kalan barış kaydı "Savaş sona erdi" ile kapanır, kartı kalkar',()=>{
  const h=world();atWar(h,1);
  h.run(`UI.peaceOffer(G.emps[1]);G.day+=30;G.inbox=[];UI.peaceOffer(G.emps[1]);DiplomaticInbox.sync();`);
  const recs=J(h,`DiplomaticInbox.state().records.filter(r=>r.kind==='peace').map(r=>[r.id,r.status,r.why||''])`);
  eq(recs.length,2);eq(recs[0][1],'invalid');assert.match(recs[0][2],/daha yeni teklif/);eq(recs[1][1],'pending');
  const r=J(h,`DiplomaticInbox.resolve(${recs[1][0]},true,'haracguzar',G.emps)`);eq(r.ok,true,JSON.stringify(r));eq(J(h,'!!G.p.war[1]'),false,'war ended');
  eq(J(h,'DiplomaticInbox.pending()'),0);
});
test('savaş başka yoldan bittiyse (motorun makePeace\'i) bekleyen barış kaydı ve kartı kapanır',()=>{
  const h=world();atWar(h,2);h.run(`UI.peaceOffer(G.emps[2]);makePeace(G.p,G.emps[2]);DiplomaticInbox.sync();`);
  eq(J(h,`DiplomaticInbox.state().records.find(r=>r.kind==='peace').status`),'invalid');eq(J(h,`(G.inbox||[]).some(n=>n.kind==='peace')`),false);
});
test('savaş sürerken bekleyen tek barış kaydı açık kalır (yanlışlıkla kapanmaz)',()=>{
  const h=world();atWar(h,3);h.run(`UI.peaceOffer(G.emps[3]);DiplomaticInbox.sync();`);eq(J(h,`DiplomaticInbox.state().records.find(r=>r.kind==='peace').status`),'pending');
});
test('AKTİF SAVAŞLAR: üst sayaç ile aynı liste; temas kurulmamış düşman "Bilinmeyen düşman"; cephe / tek taraflı durum / barış teklifi gösterilir',()=>{
  const h=world();atWar(h,1);atWar(h,2);h.run(`G.p.contact[2]=false;G.emps[2].contact[0]=false;G.p.war[3]=true;UI.peaceOffer(G.emps[1]);warLedgerSync&&warLedgerSync('test');`);
  const L=J(h,'UI.activeWarsList()'),top=J(h,'UI.topStatusItems().wars');
  eq(L.length,top,'same count as the top counter');
  const byId=Object.fromEntries(L.map(w=>[w.id,w]));
  eq(byId[2].name,'Bilinmeyen düşman');eq(byId[2].known,false);eq(byId[1].pend,1);eq(byId[3].mutual,false);
  h.run('UI.activeWarsOpen()');const html=J(h,`document.getElementById('modal').innerHTML`);
  assert.match(html,/AKTİF SAVAŞLAR/);assert.match(html,/Bilinmeyen düşman/);assert.doesNotMatch(html,new RegExp(J(h,'G.emps[2].name')));
  eq(J(h,`UI.topStatusItems().items?1:1`),1);
});
end();
