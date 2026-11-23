'use strict';
/* TİCARET-GEÇERLİ-HAT.0 — AI'nın geçerli alternatif liman çiftini seçmesi (gerçek aiOpportunityTick; STARS_ROOT=<kök> eski sürümü koşar).
   Fikstür (Codex research/ticaret-kok-neden0/partner.cjs ile aynı geometri, başlatan küçük kimlikli AI olacak biçimde):
   başlatan i=1 limanları 4 ve 9; ortak p=2 limanı 0; sahip o=3 limanı 3. Hat 0-1-2-3-4 ve 0-9. o yalnız i'ye Transit İzni vermiş.
   4 → 0 (i'nin izniyle 3 ara durak) ileri yönde açık ve en kısa; ama p'nin dönüş yükü (0 → 4) 3'te izinsiz → teklif geçersiz. 9 ↔ 0 doğrudan, iki yönde geçerli.
   G1 ilk çift geçersiz, ikinci geçerli → 9 ile tek sözleşme; iki yük birer kez teslim (AI–AI)
   G2 ilk çift zaten geçerli (p de izinli) → alternatif denenmez, 4 ile sözleşme
   G3 iki çift de geçersiz (0-9 hattı yok) → sözleşme / Etki yok, eski ret (trade-quote-rejected)
   G4 alternatif liman ortakça bilinmiyor → sözleşme yok
   G5 savaş → siyasi kapı, sözleşme yok; G6 ambargo → sözleşme yok
   G7 ihraç stoku yok → sözleşme yok
   G8 alternatif rotanın kapasitesi düşük → yük kapasiteye göre ya da hiç; sınır aşılmaz
   G9 ortak teklifi reddeder (güven 0, düşmanca) → sözleşme yok, bekleme
   G10 aynı ay ikinci tur / ertesi gün → ikinci sözleşme yok
   G11 Save8 kaydı → yükle → karar: kayıtsız dünyayla aynı sonuç
   G12 oyuncu–AI: alternatif çiftle teklif oyuncunun gelen kutusuna gider; kabul edilmeden sözleşme / stok değişimi yok
   G13 bütçe: alternatif denemesi ortak 96 rota bütçesinden düşer ve en çok 3 aday */
const assert=require('assert/strict'),path=require('path');const {fresh}=require('./helpers/dispatch-fixture');const {setup}=require('./helpers/96a-fixture');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function world(O={}){const h=fresh(0,ROOT);h.run(setup);h.sb.OPT=JSON.stringify(O);h.run(`(function(){const O=JSON.parse(OPT);
  const I=G.emps[1],P=O.player?G.p:G.emps[2],own=G.emps[3];
  for(const id of [0,3]){G.sys[id].planets[0].col=null;G.sys[id].planets[0].owner=-1;G.sys[id].owner=-1;}
  for(const e of G.emps){e.colonies=[];e.contact={};}
  port(P,0);port(I,4);port(I,9);port(own,3);link(3,4);if(!O.noAlt)link(0,9);
  for(const id of [0,1,2,3,4])G.sys[id].x=90*id;G.sys[9].x=1000;
  for(const e of [I,P,own]){e.mizac=e._pers='yayilmaci';for(const o of [I,P,own])if(o!==e){e.contact[o.id]=true;(e.intel||={})[o.id]=3;e.rel[o.id]=O.rel??60;(e.mem||={})[o.id]=[{v:O.trust??60,d:G.day,k:'t'}];}}
  if(O.alt9Unknown){G.sys[9].seen=G.sys[9].seen.filter(x=>x!==P.id);G.sys[9].surv=(G.sys[9].surv||[]).filter(x=>x!==P.id);P.intel[I.id]=0;}
  if(O.lowCap){const c=G.sys[9].planets[0].col;c.pop=1;c.b.liman=1;}
  I.pact[P.id]=P.pact[I.id]=true;own.portTransit={[I.id]:G.day+360};if(O.both)own.portTransit[P.id]=G.day+360;
  I.inc={min:100,ene:-5,yiy:1,ala:1,tuk:1};P.inc={ene:100,min:-5,yiy:1,ala:1,tuk:1};I.res.min=500;P.res.ene=500;I.res.ene=30;P.res.min=30;
  if(O.noStock){for(const r of ['ene','min','yiy','ala','tuk']){I.res[r]=0;I.inc[r]=-1;}}
  if(O.war){I.war[P.id]=P.war[I.id]=true;}if(O.embargo){(I.embargo||={})[P.id]=true;}
  I.ai=true;if(!O.player)P.ai=true;own.ai=true;
  Commerce.state();})()`);return h;}
const tick=(h,extra='')=>J(h,`(()=>{${extra}const notes=[];const n0=AIDiagnostics.note;AIDiagnostics.note=function(c,a,b){if(a&&a.id===1)notes.push(c);return n0.apply(this,arguments);};
  const I=G.emps[1],P=${'G.emps[2]'};const st=Commerce.state();st.aiAt={};const e0=[I.res.etk,P.res.etk];let used=null;
  const ao=Commerce.aiAltPorts;Commerce.aiAltPorts=ao&&function(a,b,A,B,ports,budget){const r0=budget.routes,r=ao.apply(this,arguments);used=(used||0)+(r0-budget.routes);return r;};
  Commerce.aiOpportunityTick();AIDiagnostics.note=n0;if(ao)Commerce.aiAltPorts=ao;
  const cs=st.contracts.filter(c=>!c.once&&!Commerce.closed(c)&&[c.a,c.b].includes(1)&&[c.a,c.b].includes(2)).map(c=>({a:c.a,b:c.b,legs:c.legs.map(l=>[l.e,l.r,l.v,l.source,l.target])}));
  return {cs,notes,etk:[I.res.etk-e0[0],P.res.etk-e0[1]],altUsed:used,cool:I.aiTalk?.['commerce:2']?.reason||I.aiTalk?.['commerce:0']?.reason||null};})()`);
const sail=(h,days)=>h.run(`for(let i=0;i<${days};i++){G.day+=1;Commerce.tick(1);}`);

test('G1 ilk çift (4) dönüş izni yüzünden geçersiz, ikinci (9) geçerli → 9 ile tek sözleşme; iki yük birer kez teslim',()=>{
  const h=world();const r=tick(h);assert.equal(r.cs.length,1,'tek sözleşme '+JSON.stringify(r));
  assert.ok(r.cs[0].legs.every(l=>l[3]===9||l[4]===9),'liman 9 '+JSON.stringify(r.cs[0].legs));assert.ok(r.notes.includes('trade-alt-port'),'alternatif notu');
  const s0=J(h,'[G.emps[1].res.ene,G.emps[2].res.min]');sail(h,40);const s1=J(h,`{st:[G.emps[1].res.ene,G.emps[2].res.min],v:Commerce.state().convoys.map(v=>[v.id,v.status,v.delivered,v.receipt])}`);
  const cid=h.run('Commerce.state().contracts[0].id');h.run(`Commerce.cancel(${cid},G.emps[1])`);sail(h,200);const s2=J(h,`{st:[G.emps[1].res.ene,G.emps[2].res.min],v:Commerce.state().convoys.map(v=>[v.id,v.status,v.delivered,v.receipt])}`);
  const del=s2.v.filter(v=>v[1]==='delivered');assert.equal(del.length,2,'iki teslim '+JSON.stringify(s2.v));assert.ok(del.every(v=>v[0]===v[3]),'makbuz konvoy başına tek');
  assert.ok(s2.st[0]>s0[0]&&s2.st[1]>s0[1],'iki taraf da aldı');assert.deepEqual(s2.v.length,2,'iptal sonrası yeni sefer yok');});
test('G2 ilk çift zaten geçerli (ortak da izinli) → alternatif denenmez, 4 ile sözleşme',()=>{const r=tick(world({both:true}));
  assert.equal(r.cs.length,1);assert.ok(r.cs[0].legs.some(l=>l[3]===4||l[4]===4),'liman 4 '+JSON.stringify(r.cs[0].legs));assert.ok(!r.notes.includes('trade-alt-port'));assert.ok(!r.altUsed,'alternatif bütçesi harcanmadı');});
test('G3 iki çift de geçersiz → 1–2 sözleşmesi yok, eski ret (bekleme trade-quote-rejected)',()=>{const r=tick(world({noAlt:true}));assert.equal(r.cs.length,0);
  assert.equal(r.cool,'trade-quote-rejected','eski ret '+JSON.stringify(r));assert.ok(!r.notes.includes('trade-alt-port'));});
test('G4 alternatif liman ortakça bilinmiyor → sözleşme yok',()=>{const r=tick(world({alt9Unknown:true}));assert.equal(r.cs.length,0,JSON.stringify(r));});
test('G5 savaş → siyasi kapı, sözleşme yok',()=>{const r=tick(world({war:true}));assert.equal(r.cs.length,0);assert.ok(!r.notes.includes('trade-alt-port'));});
test('G6 ambargo → sözleşme yok',()=>{const r=tick(world({embargo:true}));assert.equal(r.cs.length,0);assert.ok(!r.notes.includes('trade-alt-port'));});
test('G7 başlatanın bütün stoku yok → 1–2 sözleşmesi yok',()=>{const r=tick(world({noStock:true}));assert.equal(r.cs.length,0,JSON.stringify(r));});
test('G8 alternatif rotanın kapasitesi düşük → yük yol kapasitesini aşmaz',()=>{const h=world({lowCap:true});const r=tick(h);
  const cap=J(h,'[routeVolume(G.emps[1],9,0),routeVolume(G.emps[2],0,9)]');for(const c of r.cs)for(const l of c.legs)assert.ok(l[2]<=Math.min(...cap)+1e-9,'kapasite '+JSON.stringify({l,cap}));});
test('G9 ortak alternatif teklifi reddeder (aiRespond red) → zorla kabul yok, sözleşme yok, bekleme yazılır',()=>{const h=world();
  const r=tick(h,`const ar=aiRespond;aiRespond=function(ai,o){if(ai.id===2&&(o.give||[]).concat(o.want||[]).some(i=>i.t==='freight'))return {v:'red',why:'test reddi'};return ar.apply(this,arguments);};`);
  assert.equal(r.cs.length,0,JSON.stringify(r));assert.equal(r.cool,'trade-retry-wait','bekleme '+JSON.stringify(r));});
test('G10 aynı ay ikinci tur ve ertesi gün → ikinci sözleşme yok',()=>{const h=world();tick(h);const r2=tick(h);h.run('G.day+=1');const r3=tick(h);assert.equal(r2.cs.length,1);assert.equal(r3.cs.length,1);});
test('G11 Save8 kaydı → yükle → karar: kayıtsız dünyayla aynı sonuç',()=>{const a=world(),b=world();const s=b.run('serialize()');const c=fresh(0,ROOT);c.sb.S=s;c.run('deserialize(S)');
  tick(a);tick(c);assert.equal(c.run('JSON.stringify(G.commerce)'),a.run('JSON.stringify(G.commerce)'),'aynı ticaret durumu');assert.equal(c.run('RND_STATE'),a.run('RND_STATE'),'aynı RNG');});
test('G12 oyuncu–AI: alternatif çiftle teklif oyuncunun gelen kutusuna; kabulsüz sözleşme / stok değişimi yok',()=>{const h=world({player:true});const p0=J(h,'G.p.res');
  const r=J(h,`(()=>{const st=Commerce.state();st.aiAt={};const ib=(G.inbox||[]).length,dr=(DiplomaticInbox.state?.().records||[]).length;Commerce.aiOpportunityTick();
   return {inbox:(G.inbox||[]).length-ib,recs:(DiplomaticInbox.state?.().records||[]).length-dr,cs:st.contracts.length,cool:G.emps[1].aiTalk?.['commerce:0']?.reason||null};})()`);
  const p1=J(h,'G.p.res');assert.equal(r.cs,0,'sözleşme yok');assert.ok(r.inbox+r.recs>0,'gelen kutusu teklifi '+JSON.stringify(r));assert.deepEqual(p1,p0,'oyuncu stoku değişmedi');});
test('G13 bütçe: alternatif denemesi ortak bütçeden düşer, en çok 3 aday',()=>{const r=tick(world());assert.ok(r.altUsed>=1&&r.altUsed<=3,'harcanan '+r.altUsed);});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
