'use strict';
/* SAHA-GÜVENCE.1 — tek oyunculu eşdeğerlik (kontrol = p48, STARS_CONTROL_ROOT = git archive 347ef0d). Önceki faz notu:
   SAHA-ENTEGRE.0 — tek oyunculu eşdeğerlik: aynı tohumdan yeni oyun, kontrol (STARS_CONTROL_ROOT = p47 + PR #64 fetih düzeltmesi sabit kopyası,
   ör. git archive 0d50abc) ve aday aynı 48 ay gerçek gün adımlarıyla ilerler; her 6 ayda Save8 SHA-256 ve RNG durumu birebir olmalı.
   Faz B–G (talep bedeli, haritadan seçim, yorgunluk göstergesi, BİLİM ANOMALİLERİ, TÜMÜNÜ KENARA AL, Savaşa Yardım, lojistik görünümü)
   AI'nın hiç kullanmadığı / insanın açıkça seçtiği yollardır: insanın hiçbir şey seçmediği oyunda dünya baytları değişmemeli.
   Adayda her 6 ayda salt okunur yeni işlevler çağrılır (warCenterIndex, warHelpOptions, warFetihCandidates{capital}, warFetihClaimCost,
   warDeclarationPreview); dünyaya yazmadıkları için sonraki Save8 / RNG yine aynı olmalı.
   Faz A (fetih anında filo silinmesi düzeltmesi) BİLEREK davranış değiştirir: STARS_P47_ROOT (8984b51) verilirse aynı vakalar p47 ile de koşulur ve
   ilk ayrışma ayı yalnız BİLGİ olarak yazılır (PASS / FAIL sayılmaz). Kontrol kökü verilmezse NOT RUN. */
const assert=require('assert/strict'),crypto=require('crypto'),path=require('path'),fs=require('fs'),{runtime}=require('./helpers/runtime');
const CTL=process.env.STARS_CONTROL_ROOT,P47=process.env.STARS_P47_ROOT;let pass=0,fail=0;
const ROOT=path.resolve(__dirname,'..');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const STEP=`var __step=n=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+n&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};`;
const PROBE=`(()=>{const E=G.p;let n=0;for(const s of G.sys)if(s.battleReport){battleUnarmedLost(s,0);battleUnarmedText(battleUnarmedLost(s,0));}for(const f of G.feds||[])fedVoteSource(f);warCenterIndex(E);for(const o of G.emps){if(o===E||o.dead||o.wild||o.crisisSide)continue;
  warHelpOptions(E,o);const c=warFetihCandidates(E,o,{capital:true});n+=c.length;if(c.length){const t=c.slice(0,7).map(x=>x.id);warFetihClaimCost(E,o,t);
  if(E.contact[o.id]&&!E.war[o.id])warDeclarationPreview(E,o,'fetih',{targets:t});}}return n;})()`;
function run(root,seed,months){const h=runtime({root});h.run(`resetSetupNaming();Object.assign(CFG,{seed:${seed},size:'orta',aiCount:6});setupGame({...CFG});G.autoSave=false;`+STEP);const out=[];
  const cand=root===ROOT;for(let m=0;m<months;m+=6){h.run('__step(6)');if(cand)h.run(PROBE);out.push(sha(h.run('serialize()'))+':'+h.run('JSON.stringify(typeof rnd==="function"&&rnd.state?rnd.state():G.rs||null)'));}
  return out;}
if(!CTL||!fs.existsSync(path.join(CTL,'diplomacy.js'))){console.log('NOT RUN: STARS_CONTROL_ROOT (p48 sabit kopya kökü, git archive 347ef0d) verilmedi');console.log('GEÇEN: 0 KALAN: 0');}
else for(const seed of [11,22,404]){let b=null;try{const a=run(CTL,seed,48);b=run(ROOT,seed,48);
  assert.deepEqual(b,a,'seed '+seed+' Save8/RNG ay ay aynı');pass++;console.log('PASS seed '+seed+' 48 ay · 8 nokta · SAHA-GÜVENCE.1 değişiklikleri AI oyununda dünyaya yazmadı (salt okunur çağrılar dahil)');}
  catch(e){fail++;console.log('FAIL seed '+seed+'\n'+(e&&e.stack||e).slice(0,3000));}
  if(b&&P47&&fs.existsSync(path.join(P47,'economy.js'))){const c=run(path.resolve(P47),seed,48),i=c.findIndex((x,k)=>x!==b[k]);
    console.log('BİLGİ seed '+seed+' p47 karşılaştırması (Faz A bilinçli davranış farkı): '+(i<0?'48 ay boyunca aynı (bu tohumda temiz işgalde K.tf filo silinmesi tetiklenmedi)':'ilk ayrışma '+(i+1)*6+'. ay'));}}
if(CTL)console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
