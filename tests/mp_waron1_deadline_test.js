'use strict';
/* MP-WARON.1 — Genel Savaş Sözü son tarih sınırı (p36 kusuru). Söz son tarihi `until` (tam gün) DAHİL tutulabilir: oyun günü
   Math.floor(G.day) <= until iken başlayan savaş "Tutuldu"; ertesi gün (floor > until) başlayan savaş sözü yerine getirmez.
   Aynı kural savaş başlangıcında (declareWar kancası) ve ay başı denetiminde (warPledgeTick) geçerli; kesirli gün değerleriyle.
   D1 son tarihten bir gün önce (until−1 + 0,7) veren ilan eder → Tutuldu
   D2 son günün başında (until + 0,0) ve sonunda (until + 0,99) → Tutuldu; o gün ay başı denetimi sözü bozmaz (açık kalır)
   D3 ertesi gün (until + 1,2), ay başı denetiminden ÖNCE veren ilan eder → Tutuldu DEĞİL; sonuç Çiğnendi (ceza bir kez); savaş yine başlar
   D4 hedef verene ilan eder — süresinde → Tutuldu; süre sonrası → Tutuldu değil
   D5 ay başı denetimi geç çalışır: süre sonrası başlayan savaş varken denetim → Çiğnendi (Tutuldu görünmez); süresinde ama kancasız başlayan
      savaş (warStart süre içinde) → Tutuldu
   D6 Düştü kuralları sınırda: hedef elenir / taraflar birbirine savaş açar / son günde Konsey yasağı → Düştü, ceza yok
   D7 kayıt → yükleme → denetim: sonuçlanmış söz ikinci kez sonuçlanmaz; ilişki cezası ve bildirim bir kez
   D8 arayüz: etiket ve panel kalan günü aynı kurala göre yazar (son gün "0 gün · son gün"), son günde teklif hâlâ geçerli */
const assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
const U=150;   /* son tarih (tam gün) */
const game=()=>{const h=runtime();h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
  for(const o of G.emps)if(!o.wild){for(const q of G.emps)if(q!==o&&!q.wild){o.contact[q.id]=true;o.rel[q.id]=40;o.war[q.id]=false;o.ally[q.id]=false;if(o.nap)delete o.nap[q.id];}if(isPurifier(o)){o.mizac='militarist';delete o._pers;}}
  var __A=G.emps.filter(o=>o.ai&&!o.wild&&!o.dead).map(o=>o.id);G.p.ai=false;
  var __pledge=(t)=>{G.p.warPledges=[{id:1,to:__A[0],target:t,day:100,until:${U},state:'open'}];return G.p.warPledges[0];};
  var __notes=[];var __say0=say;say=(m,c)=>{__notes.push(String(m));};`);return h;};
const st=(h)=>J(h,'G.p.warPledges[0]');

test('D1 son tarihten bir gün önce ilan → Tutuldu',()=>{const h=game();
  const r=J(h,`(()=>{const t=__A[1];__pledge(t);G.day=${U-1}+.7;declareWar(G.p,G.emps[t]);return {war:!!G.p.war[t],p:G.p.warPledges[0]};})()`);
  assert.equal(r.war,true);assert.equal(r.p.state,'kept');});

test('D2 son günün başında ve sonunda ilan → Tutuldu; son gün içinde ay başı denetimi sözü bozmaz',()=>{
  for(const frac of [0,.5,.99]){const h=game();
    const r=J(h,`(()=>{const t=__A[1];__pledge(t);G.day=${U}+${frac};warPledgeTick();const before=G.p.warPledges[0].state;declareWar(G.p,G.emps[t]);return {before,p:G.p.warPledges[0]};})()`);
    assert.equal(r.before,'open','son gün ('+frac+') denetimi açık bırakır');assert.equal(r.p.state,'kept','son gün ('+frac+') ilan tutar');}});

test('D3 ertesi gün, ay başı denetiminden ÖNCE veren ilan eder → Tutuldu DEĞİL; Çiğnendi bir kez; savaş yine başlar',()=>{const h=game(),c=game();
  /* kontrol kolu: aynı ilan sözsüz (declareWar'ın kendi ilişki etkileri); fark = söz cezası */
  const base=J(c,`(()=>{const t=__A[1],to=__A[0];const rel0=G.emps[to].rel[0];G.day=${U}+1.2;declareWar(G.p,G.emps[t]);warPledgeTick();return rel0-G.emps[to].rel[0];})()`);
  const r=J(h,`(()=>{const t=__A[1],to=__A[0];__pledge(t);const rel0=G.emps[to].rel[0];G.day=${U}+1.2;declareWar(G.p,G.emps[t]);const at=G.p.warPledges[0].state;warPledgeTick();warPledgeTick();
    return {war:!!G.p.war[t],at,p:G.p.warPledges[0],drop:rel0-G.emps[to].rel[0]-${'${base}'},mem:((G.emps[to].mem||{})[0]||[]).filter(m=>m.k==='paktBozdu').length};})()`.replace('${base}',base));
  assert.equal(r.war,true,'geç savaş kendi ilan kuralıyla başlar');assert.notEqual(r.at,'kept','geç ilan sözü tutmaz');assert.equal(r.p.state,'broken');
  assert.equal(r.drop,20,'ilişki cezası bir kez');assert.equal(r.mem,1,'hafıza bir kez');});

test('D4 hedef verene ilan eder: süresinde → Tutuldu; süre sonrası → Tutuldu değil',()=>{
  let h=game();let r=J(h,`(()=>{const t=__A[1];__pledge(t);G.day=${U}+.4;G._dealAuth=true;declareWar(G.emps[t],G.p);G._dealAuth=false;return G.p.warPledges[0];})()`);assert.equal(r.state,'kept');
  h=game();r=J(h,`(()=>{const t=__A[1];__pledge(t);G.day=${U}+1.01;G._dealAuth=true;declareWar(G.emps[t],G.p);G._dealAuth=false;return G.p.warPledges[0];})()`);assert.notEqual(r.state,'kept');});

test('D5 ay başı denetimi geç: süre sonrası başlayan savaş → Çiğnendi; süresinde kancasız başlayan savaş (warStart) → Tutuldu',()=>{
  let h=game();let r=J(h,`(()=>{const t=__A[1];__pledge(t);G.day=${U}+3;G.p.war[t]=G.emps[t].war[0]=true;G.p.warStart=G.p.warStart||{};G.p.warStart[t]=G.day;G.day=${U}+30;warPledgeTick();return G.p.warPledges[0];})()`);
  assert.equal(r.state,'broken',JSON.stringify(r));
  h=game();r=J(h,`(()=>{const t=__A[1];__pledge(t);G.day=${U}-.3;G.p.war[t]=G.emps[t].war[0]=true;G.p.warStart=G.p.warStart||{};G.p.warStart[t]=G.day;G.day=${U}+30;warPledgeTick();return G.p.warPledges[0];})()`);
  assert.equal(r.state,'kept',JSON.stringify(r));});

test('D6 sınırda Düştü kuralları: hedef elenir / taraflar savaşır / son günde Konsey yasağı → Düştü, ceza yok',()=>{
  const cases={dead:`G.emps[t].dead=true;`,mutual:`G.p.war[to]=G.emps[to].war[0]=true;`,council:`var __cb=councilBlocksWar;councilBlocksWar=(a,b)=>b&&b.id===t?true:__cb(a,b);`};
  for(const [k,code] of Object.entries(cases)){const h=game();
    const r=J(h,`(()=>{const t=__A[1],to=__A[0];__pledge(t);const rel0=G.emps[to].rel[0];G.day=${U}+1.5;${code}warPledgeTick();return {p:G.p.warPledges[0],drop:rel0-G.emps[to].rel[0]};})()`);
    assert.equal(r.p.state,'void',k+': '+JSON.stringify(r.p));assert.equal(r.drop,0,k+' ceza yok');}});

test('D7 kayıt → yükleme → denetim: sonuçlanmış söz ikinci kez sonuçlanmaz; ceza ve bildirim bir kez',()=>{const h=game();
  const r=J(h,`(()=>{const t=__A[1],to=__A[0];__pledge(t);const rel0=G.emps[to].rel[0];G.day=${U}+2;warPledgeTick();const n1=__notes.filter(m=>/Savaş sözü/.test(m)).length;
    const s8=serialize();const ok=deserialize(s8);warPledgeTick();G.day=${U}+40;warPledgeTick();const drop=rel0-G.emps[to].rel[0];declareWar(G.p,G.emps[t]);
    return {ok,p:G.p.warPledges[0],drop,n1,n2:__notes.filter(m=>/Savaş sözü/.test(m)).length};})()`);
  assert.equal(r.ok,true);assert.equal(r.p.state,'broken');assert.equal(r.drop,20,'ceza bir kez');assert.equal(r.n2,r.n1,'bildirim bir kez');});

test('D8 arayüz: kalan gün aynı kurala göre; son gün "son gün"; son günde teklif geçerli, ertesi gün geçersiz',()=>{const h=game();
  const r=J(h,`(()=>{const t=__A[1],to=__A[0];const it={t:'warOn',target:t,until:${U}};G.day=${U}+.8;const lbl=dealLabel(it);const g1=warPledgeGate(G.p,G.emps[to],{...it});G.p.warPledges=[{id:1,to,target:t,day:100,until:${U},state:'open'}];
    const row=warPledgeRows(G.p,G.emps[to])[0];G.p.warPledges=[];G.day=${U}+1.1;const g2=warPledgeGate(G.p,G.emps[to],{...it});return {lbl,left:row.left,g1:g1.ok,g2:g2.ok};})()`);
  assert.match(r.lbl,/son gün/);assert.equal(r.left,0);assert.equal(r.g1,true,'son günde söz hâlâ verilebilir');assert.equal(r.g2,false,'ertesi gün süresi geçmiş');});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
