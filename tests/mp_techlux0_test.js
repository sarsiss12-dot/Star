'use strict';
/* MP-TECHLUX.0 — Teknoloji ve Lüks Mal çok oyunculu müzakerede (motorun 'tech' / 'lux' maddeleri; yeni motor yok).
   T1 misafir C → misafir B: C teknoloji verir, B'den lüks mal erişimi ister (İZLENİYOR); B karşı teklif; C kabul → B'de teknoloji, C'de
      lüks erişim kaydı (veren B); ikinci kabul yok
   T2 İZLENİYOR yoksa istek reddi (gerekçe varlık söylemez); dealAssets istihbaratsız liste DÖNDÜRMEZ
   T3 dealAssets İZLENİYOR ile: karşı tarafın isteyende olmayan teknolojileri (erişim koşuluyla) ve lüks malları
   T4 karşı teklifte karşı tarafın açıkça sunduğu madde istihbaratsız istenebilir; sunulmayan madde istenemez
   T5 bekleyen teklif: veren lüks malın kaynağını kaybeder → teklif gerekçeyle geçersiz, iki tarafa neden; kabul işlenmez
   T6 birleşik teklif (teknoloji + lüks + kaynak): kabul anında teknoloji geçersiz → hiçbir madde uygulanmaz
   T7 ayna / gizlilik: alana teknoloji ve erişim kaydı (π), verene verdiği erişim; üçüncü misafire hiçbiri; kabukta teknoloji ağacı yok
   T8 insan → AI: AI'dan teknoloji isteme / AI'ya verme motorun aiRespond kararıyla; kabulde gerçek etki
   T9 kayıt: Save8 gidiş-dönüşte teknoloji ve erişim kaydı aynı; aynı cid tek teklif
   T10 kabul anında isteyenin istihbaratı düşmüşse kabul gerekçeyle reddedilir */
const assert=require('assert/strict'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const prep=h=>h.run(`for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=60;e.war[o.id]=false;e.contact[o.id]=true;}if(!e.wild&&isPurifier(e)){e.mizac='militarist';delete e._pers;}}
  for(const r of ['min','ene','ala','yiy','tuk','etk'])for(const id of [1,3,4])G.emps[id].res[r]=5000;
  for(const e of G.emps)e.intel={};
  /* fikstür: C'nin B'de bulunmayan, B'nin erişebildiği bir teknolojisi; B'nin C'de olmayan bir lüks malı */
  var __T=Object.keys(TECHS).find(t=>!(TECHS[t].requirements||[]).length&&!G.emps[1].techs[t]&&!G.emps[3].techs[t]&&!G.emps[4].techs[t]);G.emps[3].techs[__T]=true;
  var __T2=Object.keys(TECHS).find(t=>t!==__T&&!(TECHS[t].requirements||[]).length&&!G.emps[1].techs[t]&&!G.emps[3].techs[t]);G.emps[1].techs[__T2]=true;
  var __K=Object.keys(LUXURY)[0],__K2=Object.keys(LUXURY)[1];G.emps[1].luxOwn={[__K]:true,[__K2]:true};G.emps[3].luxOwn={};G.emps[4].luxOwn={};`);
const last=h=>J(h,'MP.dip.offers.at(-1)');
const V=h=>J(h,'({T:__T,T2:__T2,K:__K,K2:__K2})');
const ro=(h,c,x)=>cmd(h,c,x);

test('T1 C teknoloji verir + B\'den lüks ister (İZLENİYOR); B karşı teklif; C kabul → B\'de teknoloji, C\'de erişim kaydı; ikinci kabul yok',()=>{
  const h=world();prep(h);const v=V(h);h.run('G.emps[3].intel[1]=2;');
  const o=cmd(h,'C',{kind:'offer',to:1,give:[{t:'tech',id:v.T}],want:[{t:'lux',k:v.K}]});assert.equal(o.status,'ok',JSON.stringify(o));
  const r1=last(h);assert.deepEqual(r1.give,[{t:'tech',id:v.T}]);assert.deepEqual(r1.want,[{t:'lux',k:v.K}]);
  const ct=cmd(h,'B',{kind:'counter',offer:r1.id,give:[{t:'lux',k:v.K},{t:'res',r:'min',v:10}],want:[{t:'tech',id:v.T}]});assert.equal(ct.status,'ok',JSON.stringify(ct));
  const r2=last(h);const acc=cmd(h,'C',{kind:'respond',offer:r2.id,action:'accept'});assert.equal(acc.status,'ok',JSON.stringify(acc));
  const st=J(h,`({bt:!!G.emps[1].techs[__T],ct:!!G.emps[3].techs[__T],g:G.emps[3].luxGrant,bown:!!G.emps[1].luxOwn[__K]})`);
  assert.equal(st.bt,true,'alanda teknoloji');assert.equal(st.ct,true,'veren teknolojiyi korur');assert.deepEqual(st.g,{[v.K]:1},'C erişim kaydı (veren B)');assert.equal(st.bown,true,'veren malı kaybetmez');
  assert.notEqual(cmd(h,'C',{kind:'respond',offer:r2.id,action:'accept'}).status,'ok','ikinci kabul yok');
});

test('T2 İZLENİYOR yoksa istek reddi (varlık söylenmez); dealAssets istihbaratsız liste döndürmez',()=>{
  const h=world();prep(h);const v=V(h);
  const r=cmd(h,'C',{kind:'offer',to:1,give:[{t:'res',r:'min',v:5}],want:[{t:'tech',id:v.T2}]});assert.equal(r.status,'rejected');assert.match(JSON.stringify(r.detail),/İZLENİYOR/);
  assert(!JSON.stringify(r.detail).includes(J(h,'TECHS[__T2].n')),'gerekçe teknoloji adını / varlığını söylemez');
  const r2=cmd(h,'C',{kind:'offer',to:1,give:[{t:'res',r:'min',v:5}],want:[{t:'lux',k:v.K2}]});assert.equal(r2.status,'rejected');assert.match(JSON.stringify(r2.detail),/İZLENİYOR/);
  const a=cmd(h,'C',{kind:'dealAssets',to:1});assert.equal(a.status,'ok');assert.equal(a.extra.intel,false);assert.equal(a.extra.tech,undefined);assert.equal(a.extra.lux,undefined);
});

test('T3 dealAssets İZLENİYOR ile: isteyende olmayan teknolojiler (erişim koşuluyla) ve lüks mallar',()=>{
  const h=world();prep(h);const v=V(h);h.run('G.emps[3].intel[1]=2;');
  const a=cmd(h,'C',{kind:'dealAssets',to:1});assert.equal(a.extra.intel,true);
  assert(a.extra.tech.some(t=>t.id===v.T2&&t.ok===true),'B\'nin C\'de olmayan teknolojisi');assert(!a.extra.tech.some(t=>J(h,`!!G.emps[3].techs[${JSON.stringify(t.id)}]`)),'C\'nin zaten bildikleri yok');
  assert.deepEqual(a.extra.lux.map(x=>x.k).sort(),[v.K,v.K2].sort());
});

test('T4 karşı teklifte açıkça sunulan madde istihbaratsız istenebilir; sunulmayan istenemez',()=>{
  const h=world();prep(h);const v=V(h);
  assert.equal(cmd(h,'B',{kind:'offer',to:3,give:[{t:'tech',id:v.T2}],want:[{t:'res',r:'min',v:50}]}).status,'ok');const r=last(h);
  const ok=cmd(h,'C',{kind:'counter',offer:r.id,give:[{t:'res',r:'min',v:20}],want:[{t:'tech',id:v.T2}]});assert.equal(ok.status,'ok',JSON.stringify(ok));
  const r2=last(h);assert.equal(cmd(h,'B',{kind:'counter',offer:r2.id,give:[{t:'tech',id:v.T2}],want:[{t:'res',r:'min',v:40}]}).status,'ok');const r3=last(h);
  const bad=cmd(h,'C',{kind:'counter',offer:r3.id,give:[{t:'res',r:'min',v:30}],want:[{t:'tech',id:v.T2},{t:'lux',k:v.K}]});assert.equal(bad.status,'rejected');assert.match(JSON.stringify(bad.detail),/İZLENİYOR/);
  /* kabulde de: C'nin önceki teklifine (sunulan madde) B'nin kabulü istihbarat istemez — r3'ü C kabul eder */
  const acc=cmd(h,'C',{kind:'respond',offer:r3.id,action:'accept'});assert.equal(acc.status,'ok',JSON.stringify(acc));assert.equal(J(h,'!!G.emps[3].techs[__T2]'),true);
});

test('T5 bekleyen teklif: veren lüks malın kaynağını kaybeder → geçersiz + iki tarafa neden; kabul işlenmez',()=>{
  const h=world();prep(h);const v=V(h);h.run('G.emps[3].intel[1]=2;');
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'res',r:'min',v:10}],want:[{t:'lux',k:v.K}]}).status,'ok');const r=last(h);
  h.run(`G.emps[1].luxOwn={[__K2]:true};MP.publish&&MP.publish();`);
  const st=J(h,`MP.dip.offers.find(o=>o.id===${r.id})`);assert.equal(st.status,'invalid',JSON.stringify(st));assert.match(st.why,/lüks/);
  assert(h.sb.out.some(([to,t])=>to==='C'&&/lüks malın kaynağına sahip değil/.test(t)),'C nedeni görür');assert(h.sb.out.some(([to,t])=>to==='B'&&/lüks malın kaynağına sahip değil/.test(t)),'B nedeni görür');
  assert.notEqual(cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'}).status,'ok');assert.equal(J(h,'G.emps[3].luxGrant||null'),null);
});

test('T6 birleşik teklif (teknoloji + lüks + kaynak): kabulde teknoloji geçersiz → hiçbir madde uygulanmaz',()=>{
  const h=world();prep(h);const v=V(h);h.run('G.emps[3].intel[1]=2;');
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'tech',id:v.T},{t:'res',r:'ala',v:40}],want:[{t:'lux',k:v.K}]}).status,'ok');const r=last(h);
  h.run('delete G.emps[3].techs[__T];');   /* sweep çalışmadan (yayın yok) kabul: motorun dealQuote'u yakalar */
  const pre=J(h,`({bt:!!G.emps[1].techs[__T],ala:[G.emps[1].res.ala,G.emps[3].res.ala],g:G.emps[3].luxGrant||null})`);
  const acc=cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'});assert.notEqual(acc.status,'ok',JSON.stringify(acc));
  assert.deepEqual(J(h,`({bt:!!G.emps[1].techs[__T],ala:[G.emps[1].res.ala,G.emps[3].res.ala],g:G.emps[3].luxGrant||null})`),pre,'kısmi uygulama yok');
});

test('T7 ayna / gizlilik: alana teknoloji ve erişim kaydı (π), verene verdiği erişim; üçüncü misafire hiçbiri; kabukta ağaç yok',()=>{
  const h=world();prep(h);const v=V(h);h.run('G.emps[3].intel[1]=2;');
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'tech',id:v.T}],want:[{t:'lux',k:v.K}]}).status,'ok');const r=last(h);assert.equal(cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'}).status,'ok');
  const b=J(h,'StarsMirror.build(1)'),c=J(h,'StarsMirror.build(3)'),d=J(h,'StarsMirror.build(4)');
  assert.equal(!!b.emps[0].techs[v.T],true,'B aynası teknolojiyi görür');assert.deepEqual(c.emps[0].luxGrant,{[v.K]:1},'C aynası: veren B (π: 1)');
  assert.deepEqual(b.emps[3].luxGrant,{[v.K]:0},'B, C\'ye verdiği erişimi C kabuğunda görür (alıcı = misafir değil, veren = 0)');assert.deepEqual(b.emps.filter(e=>e&&e.luxGrant).map(e=>e.luxGrant),[{[v.K]:0}],'B verdiği erişimi görür');
  assert(d.emps.every(e=>!e||e.id===0||!e.luxGrant),'üçüncü misafire erişim kaydı yok');assert(d.emps.every(e=>!e||e.id===0||!Object.keys(e.techs||{}).length),'kabukta teknoloji ağacı yok');
});

test('T8 insan → AI: AI\'dan teknoloji isteme / AI\'ya verme motorun aiRespond kararıyla; kabulde gerçek etki',()=>{
  const h=world();prep(h);const v=V(h);h.run(`G.emps[3].intel[2]=2;G.emps[2].rel[3]=100;G.emps[3].rel[2]=100;var __AT=Object.keys(G.emps[2].techs).find(t=>!G.emps[3].techs[t]&&researchAccess(G.emps[3],t).ok);`);
  const at=J(h,'__AT||null');
  if(at){const a=cmd(h,'C',{kind:'offer',to:2,give:[{t:'res',r:'min',v:3000}],want:[{t:'tech',id:at}]});assert(['ok','rejected'].includes(a.status),JSON.stringify(a));
    if(a.status==='ok'&&J(h,`!!G.emps[3].techs[${JSON.stringify(at)}]`))assert.equal(J(h,`G.emps[3].res.min`)<5000,true,'kabulde ödeme');}
  const g=cmd(h,'C',{kind:'offer',to:2,give:[{t:'tech',id:v.T}],want:[]});assert.equal(g.status,'ok',JSON.stringify(g));
  const has=J(h,'!!G.emps[2].techs[__T]'),aiOffer=J(h,'MP.dip.offers.at(-1)');assert.equal(has,aiOffer.status==='accepted','AI kabul ettiyse teknoloji AI\'da: '+JSON.stringify(aiOffer.status));
});

test('T9 kayıt: Save8 gidiş-dönüş aynı; aynı cid tek teklif',()=>{
  const h=world();prep(h);const v=V(h);h.run('G.emps[3].intel[1]=2;');
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'tech',id:v.T}],want:[{t:'lux',k:v.K}]}).status,'ok');const r=last(h);assert.equal(cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'}).status,'ok');
  const s8=h.run('serialize()');h.run('G.emps[3].luxGrant=null;G.emps[1].techs={};');assert.equal(h.run('deserialize('+JSON.stringify(s8)+')'),true);
  assert.deepEqual(J(h,'G.emps[3].luxGrant'),{[v.K]:1});assert.equal(J(h,'!!G.emps[1].techs[__T]'),true);
  const n0=J(h,'MP.dip.offers.length'),x={v:1,type:'cmd',seq:900,cid:'fed0C000900',cmd:{kind:'offer',to:1,give:[{t:'lux',k:v.K2}],want:[]}};
  h.run('G.emps[3].luxOwn={[__K2]:true};');h.sb.message=JSON.stringify(x);h.run(`MP.onMessage('C',message)`);h.sb.message=JSON.stringify({...x,seq:901});h.run(`MP.onMessage('C',message)`);
  assert.equal(J(h,'MP.dip.offers.length'),n0+1,'aynı cid tek teklif');
});

test('T10 kabul anında isteyenin istihbaratı düşmüşse kabul gerekçeyle reddedilir',()=>{
  const h=world();prep(h);const v=V(h);h.run('G.emps[3].intel[1]=2;');
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'res',r:'min',v:10}],want:[{t:'lux',k:v.K}]}).status,'ok');const r=last(h);
  h.run('G.emps[3].intel[1]=1;');const acc=cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'});assert.equal(acc.status,'rejected',JSON.stringify(acc));assert.match(JSON.stringify(acc.detail),/İZLENİYOR/);
  assert.equal(J(h,'G.emps[3].luxGrant||null'),null);
});
test('T11 ayna: misafirin kendi lüks kaynağı gezegende (lux) taşınır → misafir luxOwn\'unu hesaplar; taranmamış yabancı gezegenin lüksü gitmez',()=>{
  const h=world();prep(h);const r=J(h,`(()=>{const e=G.emps[1],pl=G.sys[e.home].planets.find(p=>p.col&&p.owner===1);pl.lux=__K;
    const far=G.sys.find(s=>!s.surv.includes(1)&&s.planets.length);far.planets[0].lux=__K2;const m=StarsMirror.build(1);
    return {own:m.sys[e.home].p.find(p=>p.i===pl.i).lux||null,far:(m.sys[far.id].p||[]).some(p=>p.lux)};})()`);
  assert.equal(r.own,J(h,'__K'));assert.equal(r.far,false);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
