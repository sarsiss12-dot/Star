'use strict';
/* MP-WARON.0 — tek oyunculu yol ve müzakere masası arayüzü (MP yok / sahte MP host bayrağı).
   S1 tek oyunculu: oyuncunun AI'ya verdiği savaş sözü (son tarihsiz) kabulde HEMEN ilan edilir (eski davranış), söz kaydı yazılmaz
   S2 tek oyunculu masa: Savaş sözü düğmesi etkin, madde son tarih taşımaz; özet satırı "kabul anında savaş ilan eder"; Savaşa Destek ayrı satır
   S3 çok oyunculu masa (host bayrağı): verilen sözde son tarih seçimi (90/180/360), ⏱ ile değişir; özet "İLAN EDİLMEZ" + tutulmazsa sonucu;
      saldırmazlık uyarısı yalnız verende
   S4 aktif söz paneli: veren için "Sözü yerine getir" düğmesi normal savaş akışına (data-a="war" + hedef), alan için yalnız durum */
const assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
const game=()=>{const h=runtime();h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
  for(const o of G.emps)if(o!==G.p&&!o.wild){G.p.contact[o.id]=o.contact[G.p.id]=true;G.p.rel[o.id]=o.rel[G.p.id]=80;for(const q of G.emps)if(q!==o&&!q.wild)o.contact[q.id]=true;}G.p.res.etk=9000;
  for(const o of G.emps)if(o.ai&&!o.wild&&isPurifier(o)){o.mizac='militarist';delete o._pers;}
  var __H='';UI.openModal=h=>{__H=h;};UI.pickList=(t,l,fn)=>fn(0);`);return h;};
const ais=h=>J(h,'G.emps.filter(o=>o.ai&&!o.wild&&!o.dead).map(o=>o.id)');

test('S1 tek oyunculu: oyuncunun AI\'ya verdiği savaş sözü kabulde hemen ilan edilir, söz kaydı yazılmaz',()=>{
  const h=game();const [a,t]=ais(h);
  const r=J(h,`(()=>{const o={from:0,to:${a},give:[{t:'warOn',target:${t}}],want:[],born:G.day,expires:G.day+300};const q=dealQuote(o);if(!q.ok)return {q:q.reasons};const ok=executeDeal(o);return {ok,war:!!G.p.war[${t}],p:G.p.warPledges||null};})()`);
  assert(!r.q,'quote: '+JSON.stringify(r.q));assert.equal(r.war,true,'eski davranış: hemen savaş');assert.equal(r.p,null,'söz kaydı yok');
});

test('S2 tek oyunculu masa: Savaş sözü etkin, son tarih yok; özet "kabul anında"; Savaşa Destek ayrı satır',()=>{
  const h=game();const [a,t]=ais(h);
  const r=J(h,`(()=>{UI.deal={from:0,to:${a},give:[],want:[]};UI.diploPage='deal';UI.dealAdd('give:warOn');const it=UI.deal.give[0];
    const html=UI.dealTermsHtml({give:[it],want:[{t:'warJoin',front:7,target:${t}}]},G.p,G.emps[${a}]);return {it,html,mp:UI.mpGame()};})()`);
  assert.equal(r.mp,false);assert.equal(r.it.t,'warOn');assert.equal(r.it.until,undefined,'tek oyunculuda son tarih yok');
  assert.match(r.html,/kabul anında/);assert.match(r.html,/savaş ilan eder/);assert.match(r.html,/dealJoinRow/);assert.match(r.html,/Savaşa Destek/);assert.match(r.html,/Genel Savaş Sözü'nden ayrı/);
});

test('S3 çok oyunculu masa: son tarih seçimi + ⏱ değişimi; özet İLAN EDİLMEZ + sonuç; saldırmazlık uyarısı yalnız verende',()=>{
  const h=game();const [a,t]=ais(h);
  const r=J(h,`(()=>{globalThis.MP1Host={started:true};G.p.nap=G.p.nap||{};G.p.nap[${t}]=G.day+400;UI.deal={from:0,to:${a},give:[],want:[]};UI.diploPage='deal';UI.dealAdd('give:warOn');
    const it=UI.deal.give[0],u0=it.until;UI.dealPledgeDays('give:0');const u1=UI.deal.give[0].until;
    const html=UI.dealTermsHtml(UI.deal,G.p,G.emps[${a}]);const other=UI.dealTermsHtml({give:[],want:[{...it}]},G.p,G.emps[${a}]);
    const q=dealQuote({from:0,to:${a},give:[{...UI.deal.give[0]}],want:[],born:G.day,expires:G.day+300});return {d0:Math.floor(G.day),u0,u1,html,other,q:q.ok,why:q.reasons};})()`);
  assert.equal(r.u0,r.d0+90,'ilk seçim 90 gün');assert.equal(r.u1,r.d0+180,'⏱ → 180 gün');
  assert.match(r.html,/İLAN EDİLMEZ/);assert.match(r.html,/ilişkisi −20/);assert.match(r.html,/karşılık iade edilmez/);assert.match(r.html,/Saldırmazlık/);
  assert(!/dealPledgeWarn/.test(r.other),'karşı tarafın antlaşmaları özetten sızmaz');
  assert.equal(r.q,true,'host oyuncusunun AI\'ya son tarihli sözü motorda geçerli: '+JSON.stringify(r.why));
});

test('S4 aktif söz paneli: veren için normal savaş akışı düğmesi, alan için yalnız durum',()=>{
  const h=game();const [a,t]=ais(h);
  const r=J(h,`(()=>{G.p.warPledges=[{id:1,to:${a},target:${t},day:Math.floor(G.day),until:Math.floor(G.day)+90,state:'open'}];
    const mine=UI.warPledgeHtml(G.emps[${a}]),tgt=UI.warPledgeHtml(G.emps[${t}]);G.emps[${a}].warPledges=[{id:1,to:0,target:${t},day:0,until:Math.floor(G.day)+50,state:'open'}];G.p.warPledges=[];
    const recv=UI.warPledgeHtml(G.emps[${a}]);return {mine,tgt,recv};})()`);
  assert.match(r.mine,/SAVAŞ SÖZLERİ/);assert.match(r.mine,new RegExp('data-a="war" data-x="'+t+'"'));assert.match(r.mine,/kalan/);
  assert.match(r.tgt,/Senin sözün/,'hedefin ilişki sayfasında da verenin kendi sözü');
  assert.match(r.recv,/Sana verilen söz/);assert(!/data-a="war"/.test(r.recv),'alana savaş düğmesi yok');
});
test('S5 gelen kutusu kaydı / karşı teklif taslağı son tarihi korur (encodeOffer): kart etiketi "Savaş sözü · son tarih", taslakta aynı tarih',()=>{
  const h=game();const [a,t]=ais(h);
  const r=J(h,`(()=>{const p={from:${a},to:0,give:[{t:'warOn',target:${t},until:Math.floor(G.day)+120}],want:[{t:'res',r:'min',v:10}],born:G.day,expires:G.day+300};const e=encodeOffer(p);return {e:e.give[0],lbl:dealLabel(e.give[0])};})()`);
  assert.equal(r.e.until!==undefined,true,'until korunur');assert.match(r.lbl,/Savaş sözü/);assert.match(r.lbl,/son tarih/);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
