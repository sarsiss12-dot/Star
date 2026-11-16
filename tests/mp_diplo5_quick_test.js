'use strict';
/* MP-DIPLO5 NF-4 — Diplomasi kısayolları (Saldırmazlık / Ticaret Paktı / Geçiş İste / Geçiş Ver), p35 İttifak Daveti kalıbı.
   Q1 tek oyunculu AI alıcı: tek dokunuş = dealQuote → aiRespond → executeDeal; sonuç aynı satırda (kabul / ret / karşı teklif)
   Q2 geçiş yönü: "Geçiş Ver" senin sınırını ona açar (e.passage[o]); "Geçiş İste" onun sınırını sana (o.passage[e])
   Q3 kilitler gerekçeli pasif: savaşta (Saldırmazlık / Ticaret / Geçiş), zaten yürürlükte, doktrin yasağı
   Q4 çift dokunuş: gönderilirken ve beklerken ikinci teklif yok (MP köprüsü taklidi: tek 'offer')
   Q5 MP yanıtları: 'duplicate' → "Bekliyor"; bağlantı yok → "Gönderilemedi"; pencere yenilenince bekleyen teklif host listesinden bulunur
   Q6 Şartlı Teklif… masayı doğru maddeyle açar (Geçiş İste → istenen tarafta passage)
   Q7 ilişki sayfası satırı: dört kısayol, maliyet, durum, gerekçe; federasyon kuruluşu / üyelik yolu (ön ittifaksız) etkilenmez */
const assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
const game=()=>{const h=runtime();h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
  for(const o of G.emps)if(!o.wild){for(const q of G.emps)if(q!==o&&!q.wild){o.contact[q.id]=true;o.rel[q.id]=90;o.war[q.id]=false;o.ally[q.id]=false;if(o.nap)delete o.nap[q.id];if(o.pact)o.pact[q.id]=false;if(o.passage)delete o.passage[q.id];}if(isPurifier(o)){o.mizac='militarist';delete o._pers;}}
  G.p.res.etk=G.p.res.min=G.p.res.ene=5000;var __A=G.emps.filter(o=>o.ai&&!o.wild&&!o.dead);var __o=__A[0];`);return h;};

test('Q1 AI alıcı: tek dokunuş → motor kararı; sonuç aynı satırda',()=>{const h=game();
  const r=J(h,`(()=>{const out={};for(const k of ['nap','pact']){UI.quickTreatySend(k,__o.id);out[k]={st:UI.quickTreatyState(k,__o.id).state,nap:!!(G.p.nap&&G.p.nap[__o.id]>G.day),pact:!!(G.p.pact&&G.p.pact[__o.id])};}return out;})()`);
  for(const k of ['nap','pact']){assert(['accepted','rejected','countered'].includes(r[k].st),k+' '+JSON.stringify(r[k]));if(r[k].st==='accepted')assert.equal(r[k][k],true,k+' yürürlükte');}
  console.log('  Q1 AI kararları: '+JSON.stringify({nap:r.nap.st,pact:r.pact.st}));});

test('Q2 geçiş yönü: Ver → senin sınırın ona; İste → onun sınırı sana',()=>{let h=game();
  let r=J(h,`(()=>{var __a=aiRespond;aiRespond=()=>({v:'kabul'});UI.quickTreatySend('passGive',__o.id);aiRespond=__a;return {mine:!!(G.p.passage||{})[__o.id],theirs:!!(__o.passage||{})[0],st:UI.quickTreatyState('passGive',__o.id).state};})()`);
  assert.deepEqual(r,{mine:true,theirs:false,st:'accepted'});
  h=game();r=J(h,`(()=>{var __a=aiRespond;aiRespond=()=>({v:'kabul'});UI.quickTreatySend('passWant',__o.id);aiRespond=__a;return {mine:!!(G.p.passage||{})[__o.id],theirs:!!(__o.passage||{})[0],st:UI.quickTreatyState('passWant',__o.id).state};})()`);
  assert.deepEqual(r,{mine:false,theirs:true,st:'accepted'});});

test('Q3 kilitler gerekçeli pasif: savaş / zaten yürürlükte / doktrin',()=>{const h=game();
  const r=J(h,`(()=>{G.p.war[__o.id]=__o.war[0]=true;const w={nap:UI.quickTreatyGate('nap',__o).why,pact:UI.quickTreatyGate('pact',__o).why,pass:UI.quickTreatyGate('passGive',__o).why};G.p.war[__o.id]=__o.war[0]=false;
    G.p.pact=G.p.pact||{};__o.pact=__o.pact||{};G.p.pact[__o.id]=__o.pact[0]=true;const act=UI.quickTreatyGate('pact',__o).why;G.p.pact[__o.id]=__o.pact[0]=false;
    var __db=diploBlocked;diploBlocked=(a,b)=>true;const doc=UI.quickTreatyGate('nap',__o).why;const html=UI.quickTreatyHtml(G.p,__o);diploBlocked=__db;return {w,act,doc,html};})()`);
  for(const k of ["nap","pact","pass"])assert.match(r.w[k],/[Ss]avaş sür/,k);
  assert.match(r.act,/yürürlükte/);assert.match(r.doc,/Doktrin/);assert.match(r.html,/quickTreatyWhy/);assert.match(r.html,/disabled/);});

test('Q4 çift dokunuş: gönderilirken / beklerken ikinci teklif yok',()=>{const h=game();
  const r=J(h,`(()=>{let n=0;const cbs=[];UI.mpQuickOffer=(to,give,want,cb)=>{n++;cbs.push(cb);return true;};UI.mpOfferState=id=>({status:'pending'});
    UI.quickTreatySend('nap',__o.id);UI.quickTreatySend('nap',__o.id);const s1=UI.quickTreatyState('nap',__o.id).state;cbs[0]({status:'ok',extra:{offer:7}});UI.quickTreatySend('nap',__o.id);UI.quickTreatySend('nap',__o.id);
    return {n,s1,s2:UI.quickTreatyState('nap',__o.id).state};})()`);
  assert.deepEqual(r,{n:1,s1:'sending',s2:'pending'});});

test('Q5 duplicate → Bekliyor; bağlantı yok → Gönderilemedi; yenilenen pencere bekleyen teklifi bulur',()=>{const h=game();
  const r=J(h,`(()=>{const out={};UI.mpQuickOffer=(to,give,want,cb)=>{cb({status:'rejected',code:'rules:duplicate'});return true;};UI.mpPendingFind=(to,g,w)=>({id:9,status:'pending'});UI.mpOfferState=()=>({status:'pending'});
    UI.quickTreatySend('pact',__o.id);out.dup=UI.quickTreatyState('pact',__o.id).state;
    UI.mpQuickOffer=(to,give,want,cb)=>{cb({status:'rejected',code:'host-yok',why:'Host bağlı değil; işlem gönderilmedi.'});return true;};UI.mpPendingFind=()=>null;UI.quickTreatySend('nap',__o.id);out.err=UI.quickTreatyState('nap',__o.id);
    UI._qtInv={};UI.mpPendingFind=(to,g,w)=>g.some(i=>i.t==='pact')?{id:9,status:'pending'}:null;out.refresh=UI.quickTreatyState('pact',__o.id).state;
    UI.mpOfferState=()=>({status:'accepted'});out.later=UI.quickTreatyState('pact',__o.id).state;return out;})()`);
  assert.equal(r.dup,'pending');assert.equal(r.err.state,'error');assert.match(r.err.text,/Gönderilemedi: Host bağlı değil/);assert.equal(r.refresh,'pending');assert.equal(r.later,'accepted');});

test('Q6 Şartlı Teklif… masayı doğru maddeyle açar',()=>{const h=game();
  const r=J(h,`(()=>{UI.quickTreatyCond('passWant',__o.id);const a={give:UI.deal.give,want:UI.deal.want};UI.quickTreatyCond('nap',__o.id);return {a,b:{give:UI.deal.give,want:UI.deal.want}};})()`);
  assert.deepEqual(r.a,{give:[],want:[{t:'passage'}]});assert.deepEqual(r.b,{give:[{t:'nap'}],want:[]});});

test('Q7 ilişki sayfası: dört kısayol + maliyet + yön metni; federasyon kuruluşu ön ittifak istemez',()=>{const h=game();
  const r=J(h,`(()=>{const html=UI.diploRelationship(G.p,__o);const fq=typeof fedFoundCandidate==='function'?fedFoundCandidate(G.p,__o):null;return {html,fq:fq&&typeof fq==='object'?fq:{v:fq}};})()`);
  for(const k of ['nap','pact','passWant','passGive'])assert.match(r.html,new RegExp('data-x="'+k+':'));
  assert.match(r.html,/HIZLI ANTLAŞMA/);assert.match(r.html,/veren: KARŞI TARAF → alan: SEN/);assert.match(r.html,/veren: SEN → alan: KARŞI TARAF/);
  assert.equal(/ittifak gerek/i.test(JSON.stringify(r.fq)),false,'kuruluş adaylığı ittifak istemez: '+JSON.stringify(r.fq));});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
