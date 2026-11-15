'use strict';
/* MP-FIELD-FIX.0 — motor / komut düzeyi: (N1) uzak insanın Fetih adayları kendi bildiği sahiplikten; host kabulü ve misafir aynası aynı kural,
   tek oyunculu oyuncu ve AI yolu değişmez. (N2) müzakere masasından "Savaşa Destek İste": belirli cepheye / hazırlığa bağlı warJoin satırları,
   geçersiz satır gerekçesi, warSupportList salt okuma, kapanan savaşa gecikmiş kabul işlenmez. (N3) sevkiyattaki filoyu birleştirme reddi korunur.
   Dünya: helpers/beta-fed-found0-mp-world.cjs (misafir B=1, C=3, D=4). */
const assert=require('assert/strict'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const prep=h=>h.run(`for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=40;e.war[o.id]=false;}}
  for(const s of G.sys)for(const e of G.emps)if(!e.wild&&!s.seen.includes(e.id))s.seen.push(e.id);
  for(const e of G.emps.filter(e=>!e.wild)){const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,4);for(const l of nb)territoryOwnerSet(G.sys[l],e.id);}
  for(const r of ['min','ene','ala','yiy','tuk','etk'])G.emps[1].res[r]=4000;remember(G.emps[2],1,'savasIlan');`);

test('N1 uzak insan Fetih adayları: keşfedilmiş ama sahipliği BİLİNMEYEN sistem aday değil (host kabul etmez); oyuncu gözlemi sahipliği bildirince aday olur; tek oyunculu oyuncu ve AI kuralı aynı',()=>{
  const h=world();prep(h);
  const s=J(h,'G.sys.filter(s=>s.owner===2&&s.id!==G.emps[2].home).map(s=>s.id)');assert(s.length>=2,'fikstür: hedefin başkent dışı sistemleri');
  h.run(`G.emps[1].mapOwners={};for(const id of ${JSON.stringify(s)})G.emps[1].mapOwners[id]=-1;G.emps[1].mapOwners[${s[0]}]=2;`);   /* B yalnız birini sahibiyle gördü */
  const cand=J(h,'warFetihCandidates(G.emps[1],G.emps[2]).map(x=>x.id)');assert.deepEqual(cand,[s[0]],'yalnız bilinen sahiplik: '+JSON.stringify(cand));
  const bad=cmd(h,'B',{kind:'warQuote',target:2,goal:'fetih',targets:[s[1]]});assert.notEqual(bad.extra&&bad.extra.preview&&bad.extra.preview.ok,true,'bilinmeyen sistem için önizleme geçmez');
  const no=cmd(h,'B',{kind:'war',target:2,goal:'fetih',targets:[s[1]]});assert.notEqual(no.status,'ok','host bilinmeyen sahiplikteki hedefi kabul etmez: '+JSON.stringify(no));assert.equal(J(h,'!!G.emps[1].war[2]'),false);
  h.run(`G.emps[1].mapOwners[${s[1]}]=2;`);   /* keşif / gözlem sahipliği bildirdi */
  assert.deepEqual(J(h,'warFetihCandidates(G.emps[1],G.emps[2]).map(x=>x.id).sort((a,b)=>a-b)'),[s[0],s[1]].sort((a,b)=>a-b),'yeni bilgiyle aday listesi güncellenir');
  const ok=cmd(h,'B',{kind:'war',target:2,goal:'fetih',targets:[s[1]]});assert.equal(ok.status,'ok',JSON.stringify(ok));assert.deepEqual(J(h,'G.emps[1].wg[2].targets'),[s[1]],'seçim ilana taşındı');
  /* gerçek sahibi değişen sistem: bilgi "hedefin" dese bile aday değil (gizli sahibi gerekçede sızmaz) */
  h.run(`territoryOwnerSet(G.sys[${s[0]}],4);`);assert.equal(J(h,`warFetihCandidates(G.emps[1],G.emps[2]).some(x=>x.id===${s[0]})`),false);
  /* tek oyunculu oyuncu (G.p) ve AI: kural değişmedi */
  assert.equal(J(h,`warFetihCandidates(G.p,G.emps[2]).length`),J(h,`G.sys.filter(s=>s.id!==G.emps[2].home&&s.owner===2&&s.seen.includes(G.p.id)).length`),'G.p: keşfedilmiş + gerçek sahip');
  assert.equal(J(h,`warFetihCandidates(G.emps[5],G.emps[2]).every(x=>aiKnownSystem(G.emps[5],G.sys[x.id])?.owner===2)`),true,'AI: aiKnownSystem');
});

test('N2 Savaşa Destek İste: aktif cephe + bekleyen hazırlık satırları warJoin maddesine bağlı; geçersiz satır gerekçeli; warSupportList salt okuma; teklif doğru cepheye bağlanır; kapanan savaşa gecikmiş kabul işlenmez',()=>{
  const h=world();prep(h);
  h.run(`for(const id of [1,3])G.emps[id].contact[2]=G.emps[2].contact[id]=true;for(const [a,b] of [[1,3]]){G.emps[a].contact[b]=G.emps[b].contact[a]=true;}`);
  const w=cmd(h,'B',{kind:'war',target:2,goal:'fetih',targets:J(h,'warFetihDefault(G.emps[1],G.emps[2]).slice(0,1)')});assert.equal(w.status,'ok',JSON.stringify(w));
  const F=J(h,'warLedgerFind(1,2).id');
  const rev0=h.run('MP.state.worldRevision'),r=cmd(h,'B',{kind:'warSupportList',to:3});assert.equal(r.status,'ok',JSON.stringify(r));assert.equal(h.run('MP.state.worldRevision'),rev0,'salt okuma');
  const row=r.extra.rows.find(x=>x.kind==='front'&&x.front===F);assert(row&&row.target===2&&/Cephe #/.test(row.label),'cephe satırı: '+JSON.stringify(r.extra.rows));
  /* geçersiz: C hedefle saldırmazlık paktında → satır gerekçeli */
  h.run('G.emps[3].nap=G.emps[3].nap||{};G.emps[2].nap=G.emps[2].nap||{};G.emps[3].nap[2]=G.emps[2].nap[3]=G.day+999;');
  const r2=cmd(h,'B',{kind:'warSupportList',to:3}).extra.rows.find(x=>x.front===F);assert.equal(r2.ok,false);assert.match(r2.why,/saldırmazlık|ittifak/i);
  h.run('delete G.emps[3].nap[2];delete G.emps[2].nap[3];');
  /* teklif: misafir B → misafir C, belirli cepheye bağlı */
  const o=cmd(h,'B',{kind:'offer',to:3,give:[],want:[{t:'warJoin',front:F,target:2}]});assert.equal(o.status,'ok',JSON.stringify(o));
  const off=J(h,'MP.dip.offers.at(-1)');assert.deepEqual(off.want.map(i=>[i.t,i.front,i.target]),[['warJoin',F,2]],'teklif doğru cepheye bağlı');
  /* savaş barışla kapanır → C'nin gecikmiş kabulü işlenmez */
  h.run('makePeace(G.emps[1],G.emps[2],{force:true,quiet:true});');
  const late=cmd(h,'C',{kind:'respond',offer:off.id,action:'accept'});assert.notEqual(late.status,'ok','kapanan cepheye gecikmiş kabul: '+JSON.stringify(late));assert.equal(J(h,'!!G.emps[3].war[2]'),false);
  /* hazırlık satırı */
  const p=cmd(h,'B',{kind:'warPrepare',target:2,goal:'fetih',targets:J(h,'warFetihDefault(G.emps[1],G.emps[2]).slice(0,1)')});
  assert.equal(p.status,'ok','hazırlık açıldı: '+JSON.stringify(p));{const rows=cmd(h,'B',{kind:'warSupportList',to:3}).extra.rows;assert(rows.some(x=>x.kind==='plan'&&x.target===2&&/Hazırlık #/.test(x.label)),'hazırlık satırı '+JSON.stringify(rows));}
});

test('N3 sevkiyattaki filoyu birleştirme: host kuralı aynı (rules:shipment), filolar değişmez',()=>{
  const h=world();prep(h);
  const fx=J(h,'(()=>{const e=G.emps[1],home=G.sys[e.home];const a=newFleet(e,home.id,[{c:"kor"}]),t=newFleet(e,home.id,[{c:"kor"}]);a.shipment={fleet:t.id,state:"ready",attempts:0,next:0};return {a:a.id,t:t.id};})()');
  const r=cmd(h,'B',{kind:'merge',fleet:fx.a});assert.equal(r.code,'rules:shipment');assert.equal(J(h,`G.fleets.filter(f=>f.id===${fx.a}||f.id===${fx.t}).length`),2);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
