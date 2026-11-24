'use strict';
/* SAVAŞ-DESTEK-AI.0 — AI savaş desteği kararları (gerçek çalışma zamanı; STARS_ROOT=<kök> eski sürümü koşar, p54'te yeni vakalar FAIL beklenir).
   Fikstür: orta / 5 AI / tohum 22; S = ilk AI (destek isteyen), X = ikinci AI (düşman), C = üçüncü AI (aday). Herkes temaslı, haritayı bilir,
   istihbarat 3; C'nin filoları X'in başkentine komşu sistemde (erişim). X, S'ye savaş açar (S savunan) ya da tersi.
   S1 müttefik savunması · S2 doktrin farkı (pasifist saldırı ↔ savunma, militarist) · S4 ekonomik kriz · S5 çok güçlü düşman · S6 erişim yok
   S10 ikinci cephe · S12 savaş bitti → teklif geçersiz · S13 insan → AI cevabı · S14 AI → insan gelen kutusu · S17 zaten taraf → ikinci ücretli katılım yok
   S18 Save8: yardım isteği beklemesi korunur, tekrar istek yok · E1 AI kendi savunma savaşında müttefikten destek ister, kabulde katılım bir kez
   E2 güçlü durumda istek yok · E3 ret / bekleme sonrası aynı adaya 180 gün yeni istek yok · S20 aynı koşulda doktrine göre karar farkı (maliyet) */
const assert=require('assert/strict'),path=require('path');const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function world(O={}){const h=runtime({root:ROOT});h.sb.OPT=JSON.stringify(O);h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
 var OPT=JSON.parse(OPT),ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide),S=ais[0],X=ais[1],C=ais[2],E=G.p;
 for(const a of G.emps)for(const b of G.emps)if(a!==b){a.contact[b.id]=true;a.ally[b.id]=false;a.war[b.id]=false;a.rel[b.id]=40;(a.intel||={})[b.id]=3;if(a.nap)delete a.nap[b.id];}
 for(const s of G.sys)s.seen=G.emps.map(e=>e.id);
 if(OPT.ally!==false){S.ally[C.id]=C.ally[S.id]=true;S.rel[C.id]=C.rel[S.id]=80;}
 if(OPT.miz){C._pers=OPT.miz;C._persAt=G.memAge;}
 for(const e of [S,C,X,E])for(const k of ['min','ene','ala','etk'])e.res[k]=3000;
 if(OPT.crisis){C.res.ene=5;C.res.ala=5;C.inc={...(C.inc||{}),ene:-30,ala:-10};}
 if(OPT.xstrong)for(let i=0;i<6;i++)newFleet(X,X.home,[{c:'zir'},{c:'zir'},{c:'zir'},{c:'zir'}],'güç');
 if(OPT.cstrong!==false)for(let i=0;i<3;i++)newFleet(C,C.home,[{c:'kru'},{c:'kru'}],'güç');
 {const xs=G.sys[X.home],adj=xs.lanes.map(i=>G.sys[i]).find(s=>s.owner<0)||xs;if(!OPT.noreach)for(const f of G.fleets.filter(f=>f.e===C.id&&isArmed(f))){f.sys=adj.id;f.mv=null;}else for(const f of G.fleets.filter(f=>f.e===C.id))f.ships=[];}
 const att=OPT.sponsorAttacks?S:X,def=OPT.sponsorAttacks?X:S;warAuthorize(att,def,{n:'t'});declareWar(att,def);warAuthClear();
 if(OPT.otherWar){const Y=ais[3];warAuthorize(Y,C,{n:'t'});declareWar(Y,C);warAuthClear();for(let i=0;i<4;i++)newFleet(Y,Y.home,[{c:'zir'},{c:'zir'},{c:'zir'}],'güç');}
 var F=warLedgerFind(S.id,X.id),IT={t:'warJoin',front:F.id,target:X.id};
 var offer=(give=[])=>({from:S.id,to:C.id,give,want:[IT],born:G.day,expires:G.day+60});`);return h;}
const verdict=(h,give='[]')=>J(h,`(()=>{const r=aiRespond(C,offer(${give}));return {v:r.v,why:String(r.why||'')};})()`);
const cost=h=>J(h,'Math.round(itemValue(C,IT,S))');

test('S1 müttefik savunması, güçlü AI, 300 alaşım: kabul (savunma sadakati); ücretsiz istekte karşı teklif',()=>{const h=world();assert.equal(verdict(h,"[{t:'res',r:'ala',v:300}]").v,'kabul');assert.equal(verdict(h).v,'karsi');});
test('S2 doktrin: aynı koşulda pasifistin saldırıya katılım maliyeti savunmadan belirgin yüksek; militaristin saldırı maliyeti pasifistten düşük',()=>{
  const po=cost(world({miz:'pasifist',sponsorAttacks:1})),pd=cost(world({miz:'pasifist'})),mo=cost(world({miz:'militarist',sponsorAttacks:1}));
  assert.ok(po>pd*1.8,'pasifist saldırı '+po+' > savunma '+pd);assert.ok(mo<po*0.7,'militarist saldırı '+mo+' < pasifist saldırı '+po);});
test('S2b pasifist, saldırı savaşına 300 alaşımla katılmaz (karşı teklif / ret), savunmaya kabul eder',()=>{
  assert.notEqual(verdict(world({miz:'pasifist',sponsorAttacks:1}),"[{t:'res',r:'ala',v:300}]").v,'kabul');assert.equal(verdict(world({miz:'pasifist'}),"[{t:'res',r:'ala',v:300}]").v,'kabul');});
test('S4 ekonomik kriz: ödemeyle de katılım reddedilir, gerekçe ekonomi',()=>{const r=verdict(world({crisis:1}),"[{t:'res',r:'ala',v:300}]");assert.equal(r.v,'red');assert.match(r.why,/kriz/);});
test('S5 çok güçlü düşman: ret (güç / erişim)',()=>{const r=verdict(world({xstrong:1,cstrong:false}),"[{t:'res',r:'ala',v:300}]");assert.equal(r.v,'red');});
test('S6 erişim yok (silahlı filo yok): ret',()=>{const r=verdict(world({noreach:1}),"[{t:'res',r:'ala',v:300}]");assert.equal(r.v,'red');assert.match(r.why,/erişim/);});
test('S10 ikinci cephe: süren savaşı kuvvetini bağlayan AI yeni cepheye katılmaz',()=>{const r=verdict(world({otherWar:1}),"[{t:'res',r:'ala',v:300}]");assert.equal(r.v,'red');assert.match(r.why,/savaş/);});
test('S12 savaş bitti: bekleyen katılım teklifi geçersiz, ödeme / savaş yok',()=>{const h=world();const r=J(h,`(()=>{const o=offer([{t:'res',r:'ala',v:300}]);makePeace(S,X,{force:true,quiet:true});const a0=S.res.ala;const q=dealQuote(o);const ok=q.ok?executeDeal(o):false;return {q:q.ok,ok:!!ok,war:!!C.war[X.id],pay:a0-S.res.ala};})()`);
  assert.equal(r.q,false);assert.equal(r.ok,false);assert.equal(r.war,false);assert.equal(r.pay,0);});
test('S13 insan → AI: oyuncunun savunma savaşına destek isteği AI kapılarından geçer (kriz → ret, normal → karar)',()=>{
  const h=world();const r=J(h,`(()=>{warAuthorize(X,E,{n:'t'});declareWar(X,E);warAuthClear();E.ally[C.id]=C.ally[E.id]=true;C.rel[E.id]=80;const f=warLedgerFind(E.id,X.id);
   const o={from:E.id,to:C.id,give:[{t:'res',r:'ala',v:300}],want:[{t:'warJoin',front:f.id,target:X.id}],born:G.day,expires:G.day+60};const a=aiRespond(C,o).v;C.res.ene=5;C.res.ala=5;C.inc={...(C.inc||{}),ene:-30,ala:-10};const b=aiRespond(C,o);return {a,b:b.v,why:b.why};})()`);
  assert.ok(['kabul','karsi'].includes(r.a),r.a);assert.equal(r.b,'red');assert.match(r.why,/kriz/);});
test('E1 AI kendi savunma savaşında zorlanınca müttefikten destek ister; kabulde müttefik cepheye katılır, ödeme bir kez',()=>{
  const h=world({xstrong:1});const r=J(h,`(()=>{const a0=S.res.ala+S.res.min,c0=C.res.ala+C.res.min;const ok=aiWarHelpAsk(S);const f2=warLedgerFind(C.id,X.id);
   return {ok,war:!!C.war[X.id],front:f2?{parent:f2.parent,camp:f2.campaign===F.campaign}:null,paid:a0-(S.res.ala+S.res.min),got:(C.res.ala+C.res.min)-c0,cool:S.aiTalk?.warHelp?.until>G.day,ev:(S.aiStrategy?.events||[]).slice(-1)[0]||null};})()`);
  assert.equal(r.ok,true,'istek gönderildi');assert.ok(r.cool,'aylık bekleme');
  if(r.war){assert.equal(r.front.camp,true,'aynı sefer');assert.equal(r.paid,r.got,'ödeme tek ve eşit '+JSON.stringify(r));}});
test('E2 güçlü durumdaki AI yardım istemez',()=>{const h=world({cstrong:false});const r=J(h,`(()=>{for(let i=0;i<6;i++)newFleet(S,S.home,[{c:'zir'},{c:'zir'},{c:'zir'}],'güç');return aiWarHelpAsk(S);})()`);assert.equal(r,false);});
test('E3 aynı cephe + aday için 180 gün yeni istek yok; ay içinde ikinci istek yok',()=>{const h=world({xstrong:1});
  const r=J(h,`(()=>{const a=aiWarHelpAsk(S);const b=aiWarHelpAsk(S);G.day+=31;C.war[X.id]=false;X.war[C.id]=false;const k='warHelp:'+F.id+':'+C.id,c=S.aiTalk[k]?.until>G.day;return {a,b,c};})()`);
  assert.equal(r.a,true);assert.equal(r.b,false,'ay içinde ikinci istek yok');assert.equal(r.c,true,'aday bekleme süresi');});
test('S14 AI → insan: AI oyuncudan (müttefik) destek isterse istek oyuncunun gelen kutusuna gider, kendiliğinden katılım yok',()=>{
  const h=world({xstrong:1,ally:false});const r=J(h,`(()=>{S.ally[E.id]=E.ally[S.id]=true;S.rel[E.id]=90;for(const o of G.emps)if(o!==E&&o!==S)S.rel[o.id]=0;const ok=aiWarHelpAsk(S);
   const rec=DiplomaticInbox.state().records.filter(x=>x.status==='pending'&&x.kind==='aideal');return {ok,rec:rec.length,war:!!E.war[X.id]};})()`);
  assert.equal(r.ok,true);assert.ok(r.rec>=1,'gelen kutusu');assert.equal(r.war,false,'oyuncu adına katılım yok');});
test('S17 zaten taraf olan devlete ikinci ücretli katılım yok (kapı)',()=>{const h=world();const r=J(h,`(()=>{executeDeal(offer([{t:'res',r:'ala',v:300}]));const g=warSupportGate(C,S,IT);const q=dealQuote(offer([{t:'res',r:'ala',v:300}]));return {war:!!C.war[X.id],g:g.ok,why:g.why,q:q.ok};})()`);
  assert.equal(r.war,true);assert.equal(r.g,false);assert.equal(r.q,false);});
test('S18 Save8: yardım isteği bekleme kayıtları yükleme sonrası korunur; yüklenen dünyada aynı ay ikinci istek yok',()=>{const h=world({xstrong:1});h.run('aiWarHelpAsk(S)');const save=h.run('serialize()');
  const g=runtime({root:ROOT});g.sb.S0=save;assert.equal(g.run('deserialize(S0)'),true);const r=J(g,`(()=>{const S=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide)[0];return {cool:S.aiTalk?.warHelp?.until>G.day,again:aiWarHelpAsk(S)};})()`);
  assert.equal(r.cool,true);assert.equal(r.again,false);});
test('S20 doktrinler aynı koşulda farklı maliyet üretir (p54: hepsi aynı)',()=>{const v=['militarist','pasifist','tuccar','yayilmaci'].map(m=>cost(world({miz:m,sponsorAttacks:1})));assert.ok(new Set(v).size>=3,'farklı değerler '+v.join(','));});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
