'use strict';
/* MP-SYNC-FED.1 — tek oyunculu eşdeğerlik: aynı tohumdan yeni oyun, kontrol (p38 sabit kopya kökü, STARS_CONTROL_ROOT) ve aday aynı N ay
   gerçek gün adımlarıyla ilerler; ay ay Save8 SHA-256 ve RNG durumu birebir olmalı. NF-9 fedDefenseCalls yalnız arayüz / MP görünümü
   tarafından çağrılır, dünyaya yazmaz; insanın hiç karar vermediği oyunda dünya baytları değişmemeli. Ayrıca her 6 ayda fedDefenseCalls
   bütün devletler için çağrılır ve sonraki Save8 / RNG yine kontrolle aynı olmalıdır. Kontrol kökü verilmezse NOT RUN yazar (PASS sayılmaz). */
const assert=require('assert/strict'),crypto=require('crypto'),path=require('path'),fs=require('fs'),{runtime}=require('./helpers/runtime');
const CTL=process.env.STARS_CONTROL_ROOT;let pass=0,fail=0;
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const STEP=`var __step=n=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+n&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};`;
function run(root,seed,months){const h=runtime({root});h.run(`resetSetupNaming();Object.assign(CFG,{seed:${seed},size:'orta',aiCount:6});setupGame({...CFG});G.autoSave=false;`+STEP);const out=[];
  const cand=root===path.resolve(__dirname,'..');for(let m=0;m<months;m+=6){h.run('__step(6)');if(cand)h.run('for(const e of G.emps)if(!e.dead)fedDefenseCalls(e);');out.push(sha(h.run('serialize()'))+':'+h.run('JSON.stringify(typeof rnd==="function"&&rnd.state?rnd.state():G.rs||null)'));}
  const deals=JSON.parse(h.run('JSON.stringify(G.emps.map(e=>(e.tribute||[]).length))'));return {out,deals};}
if(!CTL||!fs.existsSync(path.join(CTL,'diplomacy.js'))){console.log('NOT RUN: STARS_CONTROL_ROOT (p38 sabit kopya kökü) verilmedi');console.log('GEÇEN: 0 KALAN: 0');}
else for(const seed of [11,22,404]){try{const a=run(CTL,seed,48),b=run(path.resolve(__dirname,'..'),seed,48);
  assert.deepEqual(b.out,a.out,'seed '+seed+' Save8/RNG ay ay aynı');pass++;console.log('PASS seed '+seed+' 48 ay · 8 nokta · federasyonlar / savunma çağrısı çağrıldı');}
  catch(e){fail++;console.log('FAIL seed '+seed+'\n'+(e&&e.stack||e).slice(0,3000));}}
if(CTL)console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
