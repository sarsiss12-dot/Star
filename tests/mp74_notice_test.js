'use strict';
/* MP.7.4 — bildirim kartı: kaydırma ve karttan hızlı karar (tek oyunculu, gerçek runtime; Node vm + DOM taklidi).
   Kaydırmak yalnız kartı kaldırır (karar vermez, kaydı silmez); karar Gelen kutusu penceresinin yolundan (DiplomaticInbox.resolve)
   tek kez uygulanır; karşı teklif gerçek anlaşma penceresini açar; karar bekleyen olaylar kaydırılarak kaybolmaz. */
const assert=require('assert/strict'),{world,harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),eq=(a,b=true)=>assert.equal(a,b);
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const card=(h,uid)=>J(h,`(()=>{UI.drawInbox();const m=document.getElementById('inbox').innerHTML;return m;})()`).split('data-x="'+uid+'"').length>1;
test('ticaret teklifi kartında KABUL / REDDET / KARŞI TEKLİF; KABUL bir kez uygulanır, kayıt sonuçlanır, kart kalkar; ikinci dokunuş etkisiz',()=>{
  const h=world();h.run('var r=addOffer(40),n=G.inbox.at(-1),min0=G.p.res.min;UI.drawInbox();');
  const html=J(h,`document.getElementById('inbox').innerHTML`);
  for(const x of [':y',':n',':c'])assert(html.includes('data-a="noteQuick" data-x="'+J(h,'n.uid')+x+'"'),x);
  h.run(`UI.act('noteQuick',n.uid+':y');`);
  eq(J(h,'r.status'),'accepted');eq(J(h,'G.p.res.min-min0'),40);eq(J(h,'G.inbox.some(x=>x.uid===n.uid)'),false);
  h.run(`UI.act('noteQuick',n.uid+':y');`);eq(J(h,'G.p.res.min-min0'),40,'second tap does nothing');
  eq(J(h,'DiplomaticInbox.pending()'),0);
});
test('REDDET kaydı reddedilmiş olarak sonuçlandırır (gelen kutusunda aynı kayıt, ikinci kayıt yok)',()=>{
  const h=world();h.run('var r=addOffer(10),n=G.inbox.at(-1),c0=DiplomaticInbox.state().records.length;UI.act("noteQuick",n.uid+":n");');
  eq(J(h,'r.status'),'rejected');eq(J(h,'DiplomaticInbox.state().records.length===c0'),true);eq(J(h,'G.inbox.length'),0);
});
test('KARŞI TEKLİF gerçek anlaşma penceresini (aiDealOpen) karşı teklif kipinde açar; kayıt bekler',()=>{
  const h=world();h.run('var r=addOffer(10),n=G.inbox.at(-1),opened=null,o0=UI.aiDealOpen;UI.aiDealOpen=function(d){opened=d;return o0.apply(this,arguments);};UI.act("noteQuick",n.uid+":c");');
  eq(J(h,'!!opened&&opened.from===1'),true);eq(J(h,'r.status'),'pending');
});
test('kaydırma: teklif kartı kalkar, karar Gelen kutusunda bekler (yeni kayıt yok); karar bekleyen olay kaydırılınca gizlenir ve durum listesinden açılır (MP.7.5); bilgi kartı kalkar',()=>{
  const h=world();h.run('var r=addOffer(10),n=G.inbox.at(-1),c0=DiplomaticInbox.state().records.length;');
  eq(J(h,'UI.noteSwipe(n.uid)'),true);eq(J(h,'G.inbox.some(x=>x.uid===n.uid)'),false);eq(J(h,'r.status'),'pending');eq(J(h,'DiplomaticInbox.state().records.length===c0'),true);
  h.run(`UI.notify({kind:'chain',data:{id:'x'},ico:'?',title:'Olay',sub:'karar',key:'ch1'});var ev=G.inbox.at(-1);`);
  eq(J(h,'UI.noteSwipe(ev.uid)'),true);eq(J(h,'G.inbox.find(x=>x.uid===ev.uid).hidden'),true,'MP.7.5: decision event kept, card hidden');
  eq(J(h,`UI.topStatusItems().items.some(i=>i.x===String(ev.uid))`),true,'re-openable from the status list');
  h.run(`UI.notify({kind:'wardec',data:1,ico:'⚔',title:'SAVAŞ İLANI',sub:'x',key:'wd:1'});var wd=G.inbox.at(-1);`);
  eq(J(h,'UI.noteSwipe(wd.uid)'),true);eq(J(h,'G.inbox.some(x=>x.uid===wd.uid)'),false);
});
test('federasyon oyu / daveti kartında EVET-HAYIR / KABUL-RET; vasallık, barış, statüko ve savaş kararı kartlarında hızlı düğme yok (gerçek pencere)',()=>{
  const h=world();h.run(`var nr=UI.noteRecord;UI.noteRecord=()=>({status:'pending'});`);
  assert.match(J(h,`UI.noteQuick({kind:'fedvote',uid:7})`),/EVET[\s\S]*HAYIR/);assert.match(J(h,`UI.noteQuick({kind:'invite',uid:8})`),/KABUL[\s\S]*REDDET/);
  assert.doesNotMatch(J(h,`UI.noteQuick({kind:'invite',uid:8})`),/KARŞI/);
  for(const k of ['peace','submit','vassal','sqOffer','decision','event','chain'])eq(J(h,`UI.noteQuick({kind:'${k}',uid:9})`),'',k);
  h.run('UI.noteRecord=nr;');
});
test('duraklatan kart karar / kaydırma ile kapanınca önceki hıza döner; elle duraklatma korunur',()=>{
  const h=world();h.run(`UI.setSpeed(2);UI.prePause=0;UI.notify({kind:'wardec',data:1,ico:'⚔',pause:true,title:'SAVAŞ',sub:'x',key:'wd:2'});var w=G.inbox.at(-1);`);
  eq(J(h,'G.speed'),0);h.run('UI.noteSwipe(w.uid)');eq(J(h,'G.speed'),2);
  h.run(`UI.setSpeed(0);UI.prePause=0;UI.notify({kind:'wardec',data:2,ico:'⚔',pause:true,title:'SAVAŞ',sub:'y',key:'wd:3'});var w2=G.inbox.at(-1);UI.noteSwipe(w2.uid);`);
  eq(J(h,'G.speed'),0,'manual pause kept');
});
end();
