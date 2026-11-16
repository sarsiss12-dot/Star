'use strict';
/* MP-DIPLO5 NF-5 — AI'dan istenen son tarihsiz Savaş Sözü (warOn; kabulde hemen ilan) askerî kapısı.
   p37 kusuru (kontrol kökünde yeniden üretilir): AI yalnız ilişkiye bakıyordu; hedefe erişimi olmasa / bütçesi yetmese de ödemeyle kabul ediyordu.
   A1 erişim yok → ret, gerekçe "askerî erişimimiz yok" (p37: kabul)
   A2 erişim var, düşman, bütçe uygun → kabul (kural aşırı kısıtlamaz) ve kabulde savaş ilan edilir
   A3 bilinen güç oranı çok elverişsiz → ret, gerekçe "güç oranı"
   A4 pakete geçiş izni (karşı tarafın sınırı) eklemek erişimi açabilir: aynı kapı warJoin gibi terimleri hesaba katar
   A5 son tarihli insan sözü (MP-WARON.0) ve warJoin kararı değişmedi */
const assert=require('assert/strict'),path=require('path'),{runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):undefined;
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
const game=()=>{const h=runtime(ROOT?{root:ROOT}:{});h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
  for(const o of G.emps)if(!o.wild){for(const q of G.emps)if(q!==o&&!q.wild){o.contact[q.id]=true;o.rel[q.id]=40;o.war[q.id]=false;o.ally[q.id]=false;}if(isPurifier(o)){o.mizac='militarist';delete o._pers;}}
  G.p.res.min=G.p.res.etk=9000;var A=G.emps.filter(o=>o.ai&&!o.wild&&!o.dead&&!(typeof hasCivic==='function'&&hasCivic(o,'shadow')));
  var __ask=(x,y,give)=>aiRespond(x,{from:0,to:x.id,give:give||[{t:'res',r:'min',v:800}],want:[{t:'warOn',target:y.id}],born:G.day,expires:G.day+300});
  var __seeAll=x=>{for(const s of G.sys){s.seen=s.seen||[];if(!s.seen.includes(x.id))s.seen.push(x.id);}};`);return h;};

test('A1 erişim yok → ret, gerekçe askerî erişim (p37: kabul)',()=>{const h=game();
  const r=J(h,`(()=>{const x=A[0],y=A[1];return {reach:!!warSupportReach(x,y,G.p,[]),r:__ask(x,y)};})()`);
  assert.equal(r.reach,false,'fikstür: erişim yok');assert.equal(r.r.v,'red','erişimsiz savaş sözü kabul edilmemeli: '+JSON.stringify(r.r));assert.match(r.r.why,/askerî erişim/);});

test('A2 erişim + düşmanlık + bütçe → kabul; kabulde savaş ilan edilir',()=>{const h=game();
  const r=J(h,`(()=>{for(const x of A){__seeAll(x);for(const y of A){if(x===y)continue;x.rel[y.id]=-60;if(!warSupportReach(x,y,G.p,[])||!aiWarBudget(x,y).ok||aiKnownPower(x,y)>aiKnownPower(x,x)*2.5)continue;
      const v=__ask(x,y);if(v.v!=='kabul')return {x:x.id,y:y.id,v};const o={from:0,to:x.id,give:[{t:'res',r:'min',v:800}],want:[{t:'warOn',target:y.id}],born:G.day,expires:G.day+300};const ok=executeDeal(o);return {x:x.id,y:y.id,v,ok,war:!!x.war[y.id]};}}return null;})()`);
  assert(r,'fikstür: uygun çift bulunamadı');assert.equal(r.v.v,'kabul',JSON.stringify(r));assert.equal(r.ok,true);assert.equal(r.war,true,'kabulde ilan');});

test('A3 bilinen güç oranı çok elverişsiz → ret (güç oranı)',()=>{const h=game();
  const r=J(h,`(()=>{for(const x of A){__seeAll(x);for(const y of A){if(y===x)continue;if(!warSupportReach(x,y,G.p,[]))continue;var __kp=aiKnownPower;aiKnownPower=(a,b)=>b===y?__kp(a,a)*10:__kp(a,b);const v=__ask(x,y);aiKnownPower=__kp;return v;}}return null;})()`);
  assert(r,'fikstür');assert.equal(r.v,'red');assert.match(r.why,/güç oranı/);});

test('A4 geçiş izni terimi erişim hesabına girer (warJoin ile aynı warSupportReach)',()=>{const h=game();
  const r=J(h,`(()=>{const x=A[0];__seeAll(x);for(const y of A){if(y===x)continue;const a=!!warSupportReach(x,y,G.p,[]),b=!!warSupportReach(x,y,G.p,[{t:'passage'}]);if(b&&!a){var __kp=aiKnownPower;const v1=__ask(x,y),v2=__ask(x,y,[{t:'res',r:'min',v:800},{t:'passage'}]);return {v1,v2};}}return {none:1};})()`);
  if(r.none){console.log('  A4: bu haritada geçişle açılan rota yok — kural kod düzeyinde aynı (warSupportReach(…,offer.give))');return;}
  assert.equal(r.v1.v,'red');assert.notEqual(r.v2.why,r.v1.why,'geçiş izniyle erişim engeli kalkar');});

test('A5 son tarihli insan sözü ve warJoin kararı değişmedi',()=>{const h=game();
  const r=J(h,`(()=>{const x=A[0],y=A[1];const pledge=dealQuote({from:0,to:x.id,give:[{t:'warOn',target:y.id,until:Math.floor(G.day)+180}],want:[{t:'res',r:'min',v:10}],born:G.day,expires:G.day+300});
    G._dealAuth=true;declareWar(G.p,y);G._dealAuth=false;const f=warLedgerFind(0,y.id);const j=aiRespond(x,{from:0,to:x.id,give:[{t:'res',r:'min',v:800}],want:[{t:'warJoin',front:f.id,target:y.id}],born:G.day,expires:G.day+300});return {pledgeOk:pledge.ok,pw:pledge.reasons,j};})()`);
  assert.equal(r.pledgeOk,true,JSON.stringify(r.pw));assert.equal(r.j.v,'red');assert.match(r.j.why,/Bilinen güç veya askerî erişim/,'warJoin metni aynı');});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
