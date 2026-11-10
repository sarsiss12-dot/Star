'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
module.exports=async(H,B,C,out,{tap,wait})=>{
 const original=await H.evaluate(()=>serialize()),rows=[];
 try{
  for(const p of[H,B,C])await p.evaluate(()=>UI.closeModal());
  await H.evaluate(()=>{const r=MP1Host.host.local({kind:'speed',value:0});if(!r.ok&&r.code!=='rules:same')throw Error(r.code);});
  const f=await H.evaluate(require('./beta-er0-fixture.cjs').prepare,1);
  const q=await H.evaluate(()=>{const e=G.p,t=G.emps[1];e.res.etk=5000;e.contact[t.id]=true;e.intel=e.intel||{};e.intel[t.id]=3;recalcMods(e);const frontier=t.colonies.map(c=>G.sys[c.s]).find(s=>s.id!==t.home&&s.lanes.some(id=>G.sys[id].owner<0));if(!frontier)throw Error('fikstür için boş sınır komşusu yok');territoryOwnerSet(G.sys[frontier.lanes.find(id=>G.sys[id].owner<0)],e.id);const q=canIncite(e,t);if(!q.ok)throw Error(q.why);UI.act('tab','intel');UI.spyTarget=1;UI.intelView='operations';UI.intelGroup='';UI.refresh();MP1Host.host.publish();return{system:q.hedef.sys.id,planet:q.hedef.pl.i,before:q.hedef.pl.col.stab,counter:q.hedef.pl.col.secede||0,etk:e.res.etk};});
  await tap(H,'#panel [data-a="intelGroup"][data-x="dogrudan"]');
  // Sabit test tohumu; normal rnd ve motorun olasılığı kullanılır, zar/sonuç taklit edilmez.
  await H.evaluate(()=>rndSeed(23));
  await tap(H,'#panel [data-a="incite"][data-x="1"]');
  const result=await H.evaluate(q=>{const e=G.emps[1],p=G.sys[q.system].planets[q.planet];internalWarningTick();MP1Host.host.publish();return{paid:q.etk-G.p.res.etk,stab:p.col.stab,counter:p.col.secede,unrest:p.col.unrest,hit:e.hitLog?.at(-1)};},q);
  assert.equal(result.paid,120);assert.equal(result.unrest?.by,0);assert.equal(result.stab,Math.max(0,q.before-25));assert.equal(result.counter,q.counter+10);assert.equal(result.hit.known,false);
  for(const p of[H,B,C])await p.evaluate(()=>UI.closeModal());
  await wait(B,q=>G.sys[q.system].planets[q.planet]?.col?.unrest?.left===12,q);
  assert.equal(await B.evaluate(q=>G.sys[q.system].planets[q.planet].col.unrest.by,q),undefined);
  assert.equal(await B.evaluate(()=>G.p.hitLog.at(-1).by),undefined);
  assert.equal(await C.evaluate(q=>G.sys[q.system].planets[q.planet]?.col?.unrest,q),undefined);
  await B.evaluate(()=>UI.act('tab','intel'));await tap(B,'#panel [data-a="intelView"][data-x="files"]');
  assert.match(await B.locator('#panel').innerText(),/İsyan Kışkırtma/);assert.match(await B.locator('#panel').innerText(),/FAİL BİLİNMİYOR/);
  await B.screenshot({path:path.join(out,'era-incite-private.png')});console.log('PASS M5 native incite:120 etki, gerçek −25/+10, B/C gizlilik');rows.push({case:'M5',actualNativeIncite:true,paid:120,stabilityDelta:-25,counterDelta:10,unknownActorHidden:true,thirdPartyHidden:true});
  await H.evaluate(()=>{for(const c of G.emps[1].colonies){const p=G.sys[c.s].planets[c.p];p.col.stab=10;p.col.secede=0;delete p.col.unrest;delete p.col.incited;}G.emps[1].schism=0;for(let i=0;i<12;i++){G.day+=30;schismTick();internalWarningTick();}MP1Host.host.publish();});
  await B.evaluate(()=>UI.closeModal());await wait(B,()=>G.p.schism===12);await B.evaluate(()=>UI.topbar());await tap(B,'#topStatusBtn');
  assert.match(await B.locator('#modal').innerText(),/İDEOLOJİK BÖLÜNME/,'Yalnız schism riski, sıfır kolonide yerel isyan diye etiketlenmemeli');
  const idx=await B.evaluate(()=>UI.topStatusItems().items.findIndex(i=>i.action==='internalRisk'));await tap(B,'#modal [data-a="pickOne"][data-x="'+idx+'"]');
  assert.match(await B.locator('#modal').innerText(),/12\/48/);assert.match(await B.locator('#modal').innerText(),/Devam eden yerel ayrılık sayacı yok/);
  await B.screenshot({path:path.join(out,'era-schism12.png')});await tap(B,'#modal [data-a="closem"]');
  const end=await H.evaluate(()=>{const e=G.emps[1],before=G.emps.length;for(let i=12;i<47;i++){G.day+=30;schismTick();internalWarningTick();}if(e.schism!==47||G.emps.length!==before)throw Error('47 sınırı');G.day+=30;schismTick();internalWarningTick();MP1Host.host.publish();return{newEmpires:G.emps.slice(before).map(x=>({id:x.id,schismOf:x.schismOf})),counter:e.schism,localCounters:e.colonies.map(c=>G.sys[c.s].planets[c.p].col.secede||0)};});
  assert(end.newEmpires.some(e=>e.schismOf===1));assert.equal(end.counter,0);assert(end.localCounters.every(n=>n===0));await wait(B,()=>G.p.schism===0);assert.equal(await C.evaluate(()=>G.news.records.filter(r=>r.key?.startsWith('internal-schism:1:')).length),0);rows.push({case:'M6',realSchismTicks:48,normalEconomyCampaign:false,separateLocalCounters:true,threshold47NoSplit:true,threshold48Split:end,privateWarnings:true});
  fs.writeFileSync(path.join(out,'era-acceptance.json'),JSON.stringify(rows,null,2));return rows;
 }catch(e){for(const[n,p]of[['H',H],['B',B],['C',C]]){await p.screenshot({path:path.join(out,'era-fail-'+n+'.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'era-fail-'+n+'.txt'),await p.locator('body').innerText().catch(()=>''));}throw e;
 }finally{for(const p of[H,B,C])await p.evaluate(()=>UI.closeModal());await H.evaluate(s=>{if(!deserialize(s))throw Error('restore');G.autoSave=false;MP1Host.host.publish();},original);}
};
