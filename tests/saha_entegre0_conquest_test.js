'use strict';
/* SAHA-ENTEGRE.0 Faz A — fetih anında filo kaybı (Issue #66, PR #64).
   Ölçüm invasionTick() ÖNCESİ / SONRASI yapılır (eski silme captureSystem'den ÖNCE oluyordu; captureSystem sarmalayıcısı onu kaçırır).
   Fikstür: tests/fixtures/96h9/seed11-month66-siege.save (sys 6: devlet 0 gezegeni; sys 13: devlet 1 gezegenleri).
   Her vaka: saldıran filolar kurulur → hedef gezegenin kalkanı ve garnizonu sıfırlanır → invasionTick → ilk gün adımı → iki aylık işlem.
   STARS_ROOT=<kök> ile eski sürüm (p47 / PR #64) aynı vakalarla koşulur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
const SAVE=fs.readFileSync(path.join(__dirname,'fixtures/96h9/seed11-month66-siege.save'),'utf8');
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
/* o: {atk, def, sys, fleets:[[cls...]], ally:[id,[cls...]], guest:true, otherWar:id, garrison:n, shield:n, bombard:true} */
function scenario(o){
  const h=runtime({root:ROOT});h.sb.raw=SAVE;assert.equal(h.run('deserialize(raw)'),true);h.sb.O=JSON.stringify(o);
  return JSON.parse(h.run(`JSON.stringify((()=>{const o=JSON.parse(O);G.autoSave=false;
    const A=G.emps[o.atk],D=G.emps[o.def],S=G.sys[o.sys],pl=S.planets.find(p=>p.col&&p.owner===o.def);if(!pl)return {err:'hedef gezegen yok'};
    A.war[D.id]=D.war[A.id]=true;if(A.ally)A.ally[D.id]=false;if(D.ally)D.ally[A.id]=false;
    if(o.guest)A.ai=false;
    if(o.otherWar!==undefined){A.war[o.otherWar]=G.emps[o.otherWar].war[A.id]=true;}
    /* hedef sistemdeki savunan / üçüncü taraf silahlı filolar kaldırılır (yörünge savaşı bu testin konusu değil) */
    G.fleets=G.fleets.filter(f=>f.sys!==S.id||f.e===A.id&&false);
    const made=o.fleets.map((cls,i)=>newFleet(A,S.id,cls.map(c=>({c})),'Saldırı '+(i+1)));
    let ally=null;if(o.ally){const Al=G.emps[o.ally[0]];Al.dead=false;Al.ally=Al.ally||{};A.ally=A.ally||{};Al.ally[A.id]=A.ally[Al.id]=true;Al.war[D.id]=D.war[Al.id]=true;
      ally=newFleet(Al,S.id,o.ally[1].map(c=>({c})),'Müttefik');}
    pl.col.shield=o.shield||0;pl.col.garrison=o.garrison||0;if(o.bombard)pl.col.siege=5;
    const snap=f=>f&&G.fleets.includes(f)?{n:f.ships.length,cls:f.ships.map(s=>s.c).join(','),h:+f.ships.reduce((a,s)=>a+s.h,0).toFixed(4),p:Math.round(fleetPower(f)),g:Math.round(groundPower(f)),w:+f.ships.filter(s=>SHIPS[s.c].rol!=='ordu').reduce((a,s)=>a+s.h,0).toFixed(4)}:null;
    const ids=[...made,...(ally?[ally]:[])];const before=ids.map(snap);
    invasionTick();
    const at=ids.map(snap),owner=pl.owner,garr=pl.col.garrison,base=garrisonOf(pl.col,G.emps[pl.owner],pl);
    const rule=(G.fleetJournal||[]).filter(r=>ids.some(f=>f.id===r.fleet)&&r.reason==='rule').map(r=>r.detail||'');
    /* ilk gün adımı */
    G.day+=.5;dailyTick(.5);const day1=ids.map(snap);
    /* iki aylık işlem (gerçek gün adımları + ay sonu; AI kendi filosunu yönetebilir) */
    const m0=Math.floor(G.day/30);let guard=0;
    while(Math.floor(G.day/30)<m0+2&&guard++<400){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>b)monthTick();}
    const ruleLater=(G.fleetJournal||[]).filter(r=>ids.some(f=>f.id===r.fleet)&&r.reason==='rule').map(r=>r.detail||'');
    const gone=ids.filter(f=>!G.fleets.includes(f)).map(f=>({id:f.id,why:((G.fleetJournal||[]).filter(r=>r.fleet===f.id).at(-1)||{}).reason||'yok'}));
    const m2={owner:pl.owner,garr:Math.round(pl.col.garrison||0),base:Math.round(pl.col.garrisonBase||0)};
    return {owner,garr,base:Math.max(10,Math.round(base)),before,at,day1,rule,ruleLater,gone,m2,atk:A.id};
  })())`));
}
const same=(r,i)=>JSON.stringify(r.at[i])===JSON.stringify(r.before[i]);
function check(r,label,{capture=true}={}){
  assert(!r.err,r.err);
  if(capture)assert.equal(r.owner,r.atk,label+': gezegen ele geçirildi');
  r.before.forEach((b,i)=>{assert.ok(r.at[i],label+': fetih anında filo '+i+' silindi ('+JSON.stringify(b)+')');assert.ok(same(r,i),label+': filo '+i+' değişti '+JSON.stringify(b)+' → '+JSON.stringify(r.at[i]));});
  r.day1.forEach((d,i)=>assert.ok(d&&d.n===r.before[i].n,label+': ilk gün adımında filo '+i+' kayboldu'));
  assert.deepEqual(r.rule,[],label+': fetih "kural" kaybı olarak kaydedildi');
  assert.deepEqual(r.ruleLater,[],label+': sonraki iki ayda "kural" kaybı');
  for(const g of r.gone)assert.ok(['merge','combat','attrition'].includes(g.why),label+': iki ayda gerekçesiz kayıp '+JSON.stringify(g));
}
const ATK_AI={atk:1,def:0,sys:6};
test('A1 yalnız Taarruz Ordusu (AI saldırgan)',()=>{const r=scenario({...ATK_AI,fleets:[['ord','ord','ord']]});check(r,'A1');assert.equal(r.garr,r.base,'garnizon yerel savunma');});
test('A2 yalnız savaş gemileri (bombardımanla düşüş, 6. kuşatma ayı)',()=>{const r=scenario({...ATK_AI,fleets:[['kor','kor','muh']],bombard:true});check(r,'A2');});
test('A3 Taarruz Ordusu + korvet (karma, saha 15K varyantı)',()=>{const r=scenario({...ATK_AI,fleets:[['ord','ord','kor','kor']]});check(r,'A3');});
test('A4 Taarruz Ordusu + farklı savaş gemileri',()=>{const r=scenario({...ATK_AI,fleets:[['ord','ord','kor','muh','kru','zir']]});check(r,'A4');});
test('A5 aynı sistemde iki ayrı oyuncu filosu (ordu + savaş)',()=>{const r=scenario({...ATK_AI,fleets:[['ord','ord'],['kor','muh','kru']]});check(r,'A5');});
test('A6 aynı sistemde müttefik filo',()=>{const r=scenario({...ATK_AI,fleets:[['ord','kor']],ally:[2,['ord','kor','muh']]});check(r,'A6');});
test('A7 host insan saldırgan (devlet 0 → devlet 1 gezegeni)',()=>{const r=scenario({atk:0,def:1,sys:13,fleets:[['ord','ord','kor','muh']]});check(r,'A7');});
test('A8 MP misafir saldırgan (ai=false, devlet 0 değil)',()=>{const r=scenario({...ATK_AI,guest:true,fleets:[['ord','ord','kor','kru']]});check(r,'A8');});
test('A9 fetih anında başka bir savaş sürüyor',()=>{const r=scenario({...ATK_AI,otherWar:2,fleets:[['ord','kor','muh']]});check(r,'A9');});
test('A10 gerçek kara savaşı zayiatı korunur: savaş gemisine dokunulmaz, yalnız ordu erir',()=>{
  const r=scenario({...ATK_AI,garrison:60,fleets:[['ord','ord','ord','kor','muh']]});assert(!r.err,r.err);
  const b=r.before[0],a=r.at[0];assert.ok(a,'filo var');assert.ok(a.g<b.g,'ordu kara savaşında eridi');assert.equal(a.w,b.w,'savaş gemisi gövdeleri aynen (kara savaşı yalnız orduyu eritir)');
  assert.ok(a.cls.split(',').includes('kor')&&a.cls.split(',').includes('muh'),'savaş gemileri yerinde: '+a.cls);assert.deepEqual(r.rule,[]);});
test('A11 fetih sonrası garnizon: sıfır değil, aynı ordu iki kez sayılmaz; iki ay sonra taban + yörüngedeki ordu desteği',()=>{
  const r=scenario({...ATK_AI,fleets:[['ord','ord','ord','ord','ord','ord']]});check(r,'A11');
  assert.ok(r.garr>=10&&r.garr===r.base,'fetih anında garnizon = yerel taban '+r.garr+' / '+r.base);
  assert.ok(r.garr<r.before[0].g*.6,'eski kural (ordunun %60\'ı) uygulanmadı');
  assert.equal(r.m2.owner,r.atk,'iki ay sonra gezegen hâlâ saldırganın');assert.ok(r.m2.garr>0,'iki ay sonra savunmasız değil: '+JSON.stringify(r.m2));});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
