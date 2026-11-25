// node cephe.cjs <kök> <tohum> <ay> <çıkış.json>   [CAMP_SIZE=ulu CAMP_AI=9 · CAMP_TENSION]
// FED-AI-SİYASET.0 Faz E: savaşa giriş yolları ve çok taraflı cephe hunisi. Dünyaya yazmaz, RNG çekmez (sarmalayıcılar sayar).
//  declare: declareWar çağrıları opts.kind'e göre (declaration / federation / vassal / warJoin / ...)
//  fedDefend: federasyon üyesine saldırı → savunma yükümlülüğü var mı, her üye neden katılmadı
//  campaigns: ≥2 aynı-rol üyeli kampanya sayısı (jointContext adayı), jointContext null olmayan bağlam sayısı
const fs=require('fs'),path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
h.sb.SIZE=process.env.CAMP_SIZE||'ulu';h.sb.AIS=+(process.env.CAMP_AI||9);h.sb.TEN=process.env.CAMP_TENSION||null;
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:SIZE,aiCount:AIS});if(TEN)CFG.tension=TEN;setupGame({...CFG});G.autoSave=false;
var D={declare:{},fedAttack:{calls:0,noFed:0,noDuty:0,cutoff:0,duty:0},fedSkip:{},fedJoin:0,vasProtect:{},multi:{campaigns:0,ctx:0,ctxMembers:[]},pairs:[]};
const inc=(o,k,n=1)=>o[k]=(o[k]||0)+n;
{const f=declareWar;declareWar=function(a,b,o){if(a&&b&&!a.war?.[b.id]&&!b.wild&&!a.wild)inc(D.declare,(o&&o.kind)||'ilan');return f.apply(this,arguments);};}
{const f=fedDefend;fedDefend=function(att,vic){D.fedAttack.calls++;const fd=findFed(vic);
  if(!fd)D.fedAttack.noFed++;else if(!fedDuty(fd,'defense'))D.fedAttack.noDuty++;else{const fr=warLedgerFind(att.id,vic.id);if(fd.defenseFrontCutoff&&(!fr||fr.id<fd.defenseFrontCutoff))D.fedAttack.cutoff++;else{D.fedAttack.duty++;
   for(const id of fd.members){if(id===vic.id)continue;const m=G.emps[id];let k;
    if(!m||m.dead)k='olu';else if(m.war[att.id])k='zaten-savasta';else if(m.ally[att.id])k='saldirganin-muttefiki';else if(m.id===att.id)k='saldirgan-uye';
    else{const g=fedSupportGate(m,att,false);if(!g.ok)k='kapi:'+String(g.why||'?').replace(/[0-9.,]+/g,'#').slice(0,50);
     else if(m.ai&&typeof aiDefenseShirk==='function'&&fedFoundRead(()=>aiDefenseShirk(m,att,vic,fd)))k='ai-kacinma';else k='katilir';}
    inc(D.fedSkip,k);}}}}
  const before=G.emps.filter(m=>m.war[att.id]).length;const r=f.apply(this,arguments);D.fedJoin+=G.emps.filter(m=>m.war[att.id]).length-before;return r;};}
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}
 fedFoundRead(()=>{const fr=(G.warLedger?.fronts||[]).filter(f=>f.ended===null&&warLedgerPair(...f.sides));const by={};
  for(const f of fr)for(let i=0;i<2;i++){const k=f.campaign+':'+f.roles[i];(by[k]=by[k]||new Set()).add(f.sides[i]);}
  for(const [k,s] of Object.entries(by))if(s.size>1){D.multi.campaigns++;const [c,r]=k.split(':').map(Number);const sp=[...s].find(id=>G.emps[id].ai);
   const f0=fr.find(f=>f.campaign===c&&f.sides.includes(sp)&&f.roles[f.sides.indexOf(sp)]===r);if(sp!==undefined&&f0){const ctx=jointContext(c,r,sp,f0.sides[1-f0.sides.indexOf(sp)]);if(ctx){D.multi.ctx++;if(D.multi.ctxMembers.length<200)D.multi.ctxMembers.push(ctx.members.length);}}}});};`);
const t0=Date.now();for(let m=1;m<=+months;m++)h.run('__m()');
const r=JSON.parse(h.run('JSON.stringify(D)'));r.sec=Math.round((Date.now()-t0)/1000);fs.writeFileSync(out,JSON.stringify(r));
console.log(path.basename(out),JSON.stringify(r));
