'use strict';
/* SAVAŞ-DESTEK-AI.0 — tek oyunculu eşdeğerlik (kontrol = p54, STARS_CONTROL_ROOT = git archive 5aefe56; yoksa NOT RUN).
   Aynı tohumdan yeni oyun (orta, 6 AI), kontrol ve aday aynı gerçek gün adımlarıyla 48 ay; her ay Save8 SHA-256 + RNG.
   Bu faz BİLEREK AI savaş desteği kararını değiştirir: warJoin değerlemesi (itemValue), aiRespond katılım kapısı (aiWarJoinGate),
   aktif savaşta yardım isteği (aiWarHelpAsk). Adayda bu yolların İLK çağrısı izlenir (warJoin maddeli itemValue / aiRespond,
   gönderilen war-help-ask). Kural: ilk tetikten ÖNCEKİ her ay iki kol birebir; ilk ayrışma ancak tetik ayında ya da sonrasında (BİLGİ). */
const assert=require('assert/strict'),crypto=require('crypto'),path=require('path'),fs=require('fs'),{runtime}=require('./helpers/runtime');
const CTL=process.env.STARS_CONTROL_ROOT;let pass=0,fail=0;const ROOT=path.resolve(__dirname,'..');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const STEP=`var __step=()=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+1&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};`;
const TRIG=`var TRIG=null;const T=k=>{if(TRIG===null)TRIG={d:G.day,k};};
{const f=itemValue;itemValue=function(e,it){if(it&&it.t==='warJoin')T('itemValue:warJoin');return f.apply(this,arguments);};}
{const f=aiRespond;aiRespond=function(ai,o){if((o.want||[]).concat(o.give||[]).some(i=>i.t==='warJoin'))T('aiRespond:warJoin');return f.apply(this,arguments);};}
if(typeof aiPlanEvent==='function'){const f=aiPlanEvent;aiPlanEvent=function(e,k){if(k==='war-help-ask')T('war-help-ask');return f.apply(this,arguments);};}`;
function run(root,seed,months,cand){const h=runtime({root});h.run(`resetSetupNaming();Object.assign(CFG,{seed:${seed},size:'orta',aiCount:6});setupGame({...CFG});G.autoSave=false;`+STEP+(cand?TRIG:'var TRIG=null;'));const out=[];
  for(let m=0;m<months;m++){h.run('__step()');out.push(sha(h.run('serialize()'))+':'+h.run('RND_STATE'));}
  return {out,trig:JSON.parse(h.run('JSON.stringify(TRIG)'))};}
if(!CTL||!fs.existsSync(path.join(CTL,'ai.js'))){console.log('NOT RUN: STARS_CONTROL_ROOT (p54 sabit kopya kökü, git archive 5aefe56) verilmedi');console.log('GEÇEN: 0 KALAN: 0');}
else for(const seed of [11,22,404]){try{const a=run(CTL,seed,48,false).out,{out:b,trig}=run(ROOT,seed,48,true);
  const diff=b.findIndex((x,k)=>x!==a[k]),tm=trig?Math.floor(trig.d/30):null;
  if(diff>=0)assert.ok(tm!==null&&diff>=tm-1,'seed '+seed+': ayrışma '+(diff+1)+'. ay, tetik '+(trig?trig.k+' gün '+Math.floor(trig.d):'yok'));
  pass++;console.log('PASS seed '+seed+' 48 ay · '+(diff<0?'48 ay boyunca birebir (yeni yol '+(trig?'çağrıldı ama dünyayı değiştirmedi: '+trig.k+' gün '+Math.floor(trig.d):'çağrılmadı')+')':'tetikten önce birebir; ilk ayrışma '+(diff+1)+'. ay, ilk tetik '+trig.k+' gün '+Math.floor(trig.d)));}
  catch(e){fail++;console.log('FAIL seed '+seed+'\n'+(e&&e.stack||e).slice(0,1500));}}
/* Eski kayıt: p54'te 60 ay + açılan bir AI–AI savaşıyla 6 ay oynanmış Save8 adayda açılır (savaş defteri, aiTalk, aiStrategy birebir); p54 MP paketi p55 yükleyicisinde build nedeniyle reddedilmez. */
if(CTL&&fs.existsSync(path.join(CTL,'ai.js')))try{const a=runtime({root:CTL});a.run(`resetSetupNaming();Object.assign(CFG,{seed:11,size:'ulu',aiCount:9});setupGame({...CFG});G.autoSave=false;`+STEP);
  for(let m=0;m<60;m++)a.run('__step()');a.run(`{const ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide);warAuthorize(ais[0],ais[1],{n:'t'});declareWar(ais[0],ais[1]);warAuthClear();}`);for(let m=0;m<6;m++)a.run('__step()');const save=a.run('serialize()'),info=JSON.parse(a.run('JSON.stringify({f:(G.warLedger?.fronts||[]).length,build:BUILD_ID})'));
  const b=runtime({root:ROOT});b.sb.S=save;assert.equal(b.run('deserialize(S)'),true,'p54 kaydı açıldı');
  for(const x of ['JSON.stringify(G.warLedger)','JSON.stringify(G.emps.map(e=>[e.aiTalk||null,e.aiStrategy||null,e.war,e.ally]))'])assert.equal(b.run(x),a.run(x),'birebir: '+x);
  /* p54'ün kendisinde de yükle → kaydet ham baytı değişir (çalışma önbellekleri); ölçüt: aday ile p54 aynı kaydı aynı baytlarla yeniden yazar */
  const c=runtime({root:CTL});c.sb.S=save;c.run('deserialize(S)');assert.equal(b.run('serialize()'),c.run('serialize()'),'yükle → kaydet: aday = p54 bayt bayt');
  b.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));const pk={format:'stars-mp-save',mpVersion:4,build:info.build,createdAt:1,saveId:'s-0123456789abcdef',session:{},diplomacy:{},display:{},save8:save,integrity:''};
  b.sb.PK=JSON.stringify(pk);const v=JSON.parse(b.run('JSON.stringify(StarsMP.validatePackage(JSON.parse(PK)))'));assert.notEqual(v.why,'build','p54 paketi build nedeniyle reddedilmez: '+JSON.stringify(v));
  pass++;console.log('PASS p54 Save8 (66 ay, '+info.f+' cephe) adayda açılır, savaş defteri / aiTalk / aiStrategy birebir, yeniden kayıt p54 ile bayt bayt aynı; p54 MP paketi build kapısından geçer ('+(v.ok?'geçerli':'ret nedeni '+v.why)+')');}
  catch(e){fail++;console.log('FAIL eski kayıt uyumu\n'+(e&&e.stack||e).slice(0,1500));}
if(CTL)console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
