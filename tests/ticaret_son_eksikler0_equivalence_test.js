'use strict';
/* TİCARET-SON-EKSİKLER.0 — tek oyunculu eşdeğerlik (kontrol = p53, STARS_CONTROL_ROOT = git archive 1dec704; yoksa NOT RUN).
   Aynı tohumdan yeni oyun (orta, 6 AI), kontrol ve aday aynı gerçek gün adımlarıyla 48 ay ilerler; her ay Save8 SHA-256 + RNG.
   Bu faz BİLEREK davranış ekler (insan sahibe çok taraflı transit talebi, son 60 günde izin yenileme, AI yenileme isteği, süre uyarısı).
   Adayda bu yolların ilk tetiklendiği gün izlenir (Commerce.transitOpen, transitNote, geçerli izne yeniden izin verilmesi). Kural:
   ilk tetikten ÖNCEKİ her ay iki kol birebir aynı olmalı; ilk ayrışma ancak tetik ayında ya da sonrasında olabilir (BİLGİ olarak yazılır). */
const assert=require('assert/strict'),crypto=require('crypto'),path=require('path'),fs=require('fs'),{runtime}=require('./helpers/runtime');
const CTL=process.env.STARS_CONTROL_ROOT;let pass=0,fail=0;const ROOT=path.resolve(__dirname,'..');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const STEP=`var __step=()=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+1&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};`;
const TRIG=`var TRIG=null;const T=k=>{if(TRIG===null)TRIG={d:G.day,k};};
if(Commerce.transitOpen){const f=Commerce.transitOpen;Commerce.transitOpen=function(){T('transitOpen');return f.apply(this,arguments);};}
if(typeof transitNote==='function'){const f=transitNote;transitNote=function(){T('transitNote');return f.apply(this,arguments);};}
{const f=executeDeal;executeDeal=function(o){if([...(o.give||[]).map(i=>[o.from,o.to,i]),...(o.want||[]).map(i=>[o.to,o.from,i])].some(([g,t,i])=>i.t==='portTransit'&&G.emps[g]?.portTransit?.[t]>G.day))T('renew');return f.apply(this,arguments);};}
if(Commerce.aiPermitRenew){const f=Commerce.aiPermitRenew;Commerce.aiPermitRenew=function(c){const k=JSON.stringify(c.aiTalk||{});const r=f.apply(this,arguments);if(JSON.stringify(c.aiTalk||{})!==k)T('aiPermitRenew');return r;};}`;
function run(root,seed,months,cand){const h=runtime({root});h.run(`resetSetupNaming();Object.assign(CFG,{seed:${seed},size:'orta',aiCount:6});setupGame({...CFG});G.autoSave=false;`+STEP+(cand?TRIG:'var TRIG=null;'));const out=[];
  for(let m=0;m<months;m++){h.run('__step()');out.push(sha(h.run('serialize()'))+':'+h.run('RND_STATE'));}
  return {out,trig:JSON.parse(h.run('JSON.stringify(TRIG)'))};}
if(!CTL||!fs.existsSync(path.join(CTL,'commerce.js'))){console.log('NOT RUN: STARS_CONTROL_ROOT (p53 sabit kopya kökü, git archive 1dec704) verilmedi');console.log('GEÇEN: 0 KALAN: 0');}
else for(const seed of [11,22,404]){try{const a=run(CTL,seed,48,false).out,{out:b,trig}=run(ROOT,seed,48,true);
  const diff=b.findIndex((x,k)=>x!==a[k]),tm=trig?Math.floor(trig.d/30):null;
  /* ay k (0 tabanlı) sonu = gün ~30(k+1); tetik günü d ise tetiğin dahil olduğu ilk ölçüm ayı floor(d/30) */
  if(diff>=0)assert.ok(tm!==null&&diff>=tm-1,'seed '+seed+': ayrışma '+(diff+1)+'. ay, tetik '+(trig?trig.k+' gün '+Math.floor(trig.d):'yok'));
  pass++;console.log('PASS seed '+seed+' 48 ay · '+(diff<0?'48 ay boyunca birebir (yeni davranış '+(trig?'tetiklendi ama dünyayı değiştirmedi: '+trig.k:'tetiklenmedi')+')':'tetikten önce birebir; ilk ayrışma '+(diff+1)+'. ay, ilk tetik '+trig.k+' gün '+Math.floor(trig.d)));}
  catch(e){fail++;console.log('FAIL seed '+seed+'\n'+(e&&e.stack||e).slice(0,1500));}}
if(CTL)console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
