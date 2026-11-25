'use strict';
/* FED-AI-SİYASET.0 — tek oyunculu eşdeğerlik (kontrol = p55, STARS_CONTROL_ROOT = git archive 914c003; yoksa NOT RUN).
   Aynı tohumdan yeni oyun, kontrol ve aday aynı gerçek gün adımlarıyla; her ay Save8 SHA-256 + RNG.
   Bu faz BİLEREK iki AI kararını değiştirir: (1) barış ödül avı yalnız filonun girdiği değil, meşru bilinen (aiKnownSystem) yuva / kalıntıyı da hedefler;
   (2) federasyonda üye sesi ve çıkışı (aiFedMismatch → aiFedMemberReform / aiFedStayReview, reform oyunda iyi niyet tavanı, ayrıldığı birliğe dönmeme).
   Adayda bu yolların İLK tetiği izlenir: filonun hiç girmediği yuva / kalıntıya aiMove, null olmayan aiFedMismatch, reform önergesine AI oyu, ayrılma belleği.
   Kural: ilk tetikten ÖNCEKİ her ay iki kol birebir; ilk ayrışma ancak tetik ayında ya da sonrasında (BİLGİ). */
const assert=require('assert/strict'),crypto=require('crypto'),path=require('path'),fs=require('fs'),{runtime}=require('./helpers/runtime');
const CTL=process.env.STARS_CONTROL_ROOT;let pass=0,fail=0;const ROOT=path.resolve(__dirname,'..');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const STEP=`var __step=()=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+1&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};`;
const TRIG=`var TRIG=null;const T=k=>{if(TRIG===null)TRIG={d:G.day,k};};
{const f=aiMove;aiMove=function(e,fl,to){const s=G.sys[to];if(s&&e&&!s.seen.includes(e.id)&&(s.nest&&s.nest.hp>0||s.ruin&&s.ruin.hp>0))T('prize-known');return f.apply(this,arguments);};}
{const f=aiFedMismatch;aiFedMismatch=function(){const r=f.apply(this,arguments);if(r)T('fed-mismatch');return r;};}
{const f=aiFedVoteWant;aiFedVoteWant=function(e,fd,v){if(v&&v.motion==='reform')T('reform-vote');return f.apply(this,arguments);};}
{const f=aiFedLeftRecently;aiFedLeftRecently=function(){const r=f.apply(this,arguments);if(r)T('fed-left');return r;};}`;
function run(root,seed,size,ais,months,cand){const h=runtime({root});h.run(`resetSetupNaming();Object.assign(CFG,{seed:${seed},size:'${size}',aiCount:${ais}});setupGame({...CFG});G.autoSave=false;`+STEP+(cand?TRIG:'var TRIG=null;'));const out=[];
  for(let m=0;m<months;m++){h.run('__step()');out.push(sha(h.run('serialize()'))+':'+h.run('RND_STATE'));}
  return {out,trig:JSON.parse(h.run('JSON.stringify(TRIG)'))};}
if(!CTL||!fs.existsSync(path.join(CTL,'ai.js'))){console.log('NOT RUN: STARS_CONTROL_ROOT (p55 sabit kopya kökü, git archive 914c003) verilmedi');console.log('GEÇEN: 0 KALAN: 0');}
else for(const [seed,size,ais] of [[11,'orta',6],[22,'orta',6],[404,'ulu',9]]){try{const a=run(CTL,seed,size,ais,48,false).out,{out:b,trig}=run(ROOT,seed,size,ais,48,true);
  const diff=b.findIndex((x,k)=>x!==a[k]),tm=trig?Math.floor(trig.d/30):null;
  if(diff>=0)assert.ok(tm!==null&&diff>=tm-1,'seed '+seed+': ayrışma '+(diff+1)+'. ay, tetik '+(trig?trig.k+' gün '+Math.floor(trig.d):'yok'));
  pass++;console.log('PASS seed '+seed+' '+size+'/'+ais+' 48 ay · '+(diff<0?'48 ay boyunca birebir (yeni yol '+(trig?'çağrıldı ama dünyayı değiştirmedi: '+trig.k+' gün '+Math.floor(trig.d):'çağrılmadı')+')':'tetikten önce birebir; ilk ayrışma '+(diff+1)+'. ay, ilk tetik '+trig.k+' gün '+Math.floor(trig.d)));}
  catch(e){fail++;console.log('FAIL seed '+seed+'\n'+(e&&e.stack||e).slice(0,1500));}}
/* Eski kayıt: p55'te 60 ay oynanmış (federasyonlu) Save8 adayda açılır; federasyon / savaş defteri / ortak harekât birebir, yükle → kaydet aday = p55 bayt bayt; p55 MP paketi build kapısından geçer. */
if(CTL&&fs.existsSync(path.join(CTL,'ai.js')))try{const a=runtime({root:CTL});a.run(`resetSetupNaming();Object.assign(CFG,{seed:11,size:'ulu',aiCount:9});setupGame({...CFG});G.autoSave=false;`+STEP);
  for(let m=0;m<60;m++)a.run('__step()');const save=a.run('serialize()'),info=JSON.parse(a.run('JSON.stringify({feds:(G.feds||[]).length,build:BUILD_ID})'));
  const b=runtime({root:ROOT});b.sb.S=save;assert.equal(b.run('deserialize(S)'),true,'p55 kaydı açıldı');
  for(const x of ['JSON.stringify(G.feds)','JSON.stringify(G.warLedger)','JSON.stringify(G.jointOps)','JSON.stringify(G.emps.map(e=>[e.contact,e.aiFedReason||null,e.war,e.ally]))'])assert.equal(b.run(x),a.run(x),'birebir: '+x);
  const c=runtime({root:CTL});c.sb.S=save;c.run('deserialize(S)');assert.equal(b.run('serialize()'),c.run('serialize()'),'yükle → kaydet: aday = p55 bayt bayt');
  b.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));const pk={format:'stars-mp-save',mpVersion:4,build:info.build,createdAt:1,saveId:'s-0123456789abcdef',session:{},diplomacy:{},display:{},save8:save,integrity:''};
  b.sb.PK=JSON.stringify(pk);const v=JSON.parse(b.run('JSON.stringify(StarsMP.validatePackage(JSON.parse(PK)))'));assert.notEqual(v.why,'build','p55 paketi build nedeniyle reddedilmez: '+JSON.stringify(v));
  pass++;console.log('PASS p55 Save8 (60 ay, '+info.feds+' federasyon) adayda açılır, federasyon / savaş defteri / ortak harekât / temas birebir, yeniden kayıt p55 ile bayt bayt aynı; p55 MP paketi build kapısından geçer ('+(v.ok?'geçerli':'ret nedeni '+v.why)+')');}
  catch(e){fail++;console.log('FAIL eski kayıt uyumu\n'+(e&&e.stack||e).slice(0,1500));}
if(CTL)console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
