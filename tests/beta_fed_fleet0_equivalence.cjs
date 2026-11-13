'use strict';
/* BETA-FED-FLEET.0 kontrol / aday eşdeğerliği: aynı Save8'den P27 (43a3612, sabit kopya kök) ve aday ay ay ham Save8 baytı + RNG.
   Kontrol kolu: federal fon / filo / eski hazine YOK (G.feds boş) — her ay birebir eşit olmalı. Bir kolda federasyon doğduğu ay
   ham karşılaştırma "etkin senaryo"ya geçer: ilk ayrışan ayın farkları yol yol listelenir ve yalnız beklenen alanlarla (federasyon fonu /
   katkı kaydı / federal filo / bunlara bağlı kaynak) açıklanır. Kullanım: STARS_CONTROL_ROOT=<p27 kökü> node tests/beta_fed_fleet0_equivalence.cjs
   (kök verilmezse git show 43a3612 ile geçici sabit kopya kurulur). Çıktı STARS_OUTPUT (varsayılan reports/claude/evidence/beta-fed-fleet0). */
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),crypto=require('crypto'),{runtime}=require('./helpers/runtime');
const commit='43a36127d5bf66918ff4a7f89ae515ca40149789',sha=s=>crypto.createHash('sha256').update(s).digest('hex');
let control=process.env.STARS_CONTROL_ROOT,tmp=null;
if(!control){tmp=fs.mkdtempSync(path.join(os.tmpdir(),'fedfleet0-control-'));control=tmp;for(const f of Object.keys(JSON.parse(fs.readFileSync('RELEASE-MANIFEST.json')).files)){const d=path.join(control,f);fs.mkdirSync(path.dirname(d),{recursive:true});fs.writeFileSync(d,cp.execFileSync('git',['show',commit+':'+f],{maxBuffer:8*1024*1024}));}}
if(fs.lstatSync(path.join(control,'diplomacy.js')).isSymbolicLink())throw Error('kontrol kökü bağ (symlink) olmamalı');
const out=process.env.STARS_OUTPUT||path.join(__dirname,'..','reports/claude/evidence/beta-fed-fleet0');fs.mkdirSync(out,{recursive:true});
const MONTHS=+(process.env.FEDFLEET_MONTHS||36),SEEDS=(process.env.FEDFLEET_SEEDS||'11,22,23,42,404').split(',').map(Number);
const step=`function step(){for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}`;
function paths(a,b,p='',o=[]){if(o.length>60)return o;if(JSON.stringify(a)===JSON.stringify(b))return o;
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))paths(a[k],b[k],p+'.'+k,o);return o;}
  o.push(p);return o;}
const rows=[];let fail=0;
for(const seed of SEEDS){
  const raw=runtime({root:control});raw.run(`setupGame({...CFG,seed:${seed},size:'orta',aiCount:5});G.autoSave=false;`);const s=raw.run('serialize()');
  const a=runtime({root:control}),b=runtime();for(const h of [a,b]){h.sb.save=s;h.run(`if(!deserialize(save))throw Error('load');${step}`);}
  const row={seed,months:[],control:{equal:0},active:null};
  for(let m=1;m<=MONTHS;m++){a.run('step()');b.run('step()');const av=a.run('serialize()'),bv=b.run('serialize()'),ra=a.run('RND_STATE'),rb=b.run('RND_STATE');
    const feds=[+a.run('(G.feds||[]).length'),+b.run('(G.feds||[]).length')];
    if(!feds[0]&&!feds[1]){const eq=av===bv&&ra===rb;row.months.push({m,sha:sha(bv),rng:rb,eq});if(eq)row.control.equal++;else{fail++;row.control.firstFail={m,paths:paths(JSON.parse(av),JSON.parse(bv)).slice(0,30)};break;}continue;}
    /* etkin senaryo: federasyon var */
    const A=JSON.parse(av),B=JSON.parse(bv),d=paths(A,B);
    if(!row.active){row.active={firstFedMonth:m,feds};}
    if(av!==bv||ra!==rb){const fa=JSON.parse(a.run('JSON.stringify(G.feds.map(f=>({id:f.id,members:f.members,leader:f.leader,laws:f.laws,fund:f.fund,treasury:f.treasury||0})))')),fb=JSON.parse(b.run('JSON.stringify(G.feds.map(f=>({id:f.id,members:f.members,leader:f.leader,laws:f.laws,fund:f.fund,treasury:f.treasury||0,contrib:f.contrib||null,fleetOrderMonth:f.fleetOrderMonth??null})))'));
      if(!row.active.firstDiff)row.active.firstDiff={m,rngEqual:ra===rb,paths:d.slice(0,40),controlFeds:fa,candidateFeds:fb};
      const cls=[...new Set(d.map(x=>x.replace(/\.\d+/g,'.#').split('.').slice(0,5).join('.')))];row.active.later=row.active.later||[];row.active.later.push({m,rngEqual:ra===rb,classes:cls.slice(0,25)});
      if(m>=row.active.firstDiff.m+(+process.env.FEDFLEET_ACTIVE||12))break;continue;}
    row.months.push({m,sha:sha(bv),rng:rb,eq:true,feds});}
  rows.push(row);console.log((row.control.firstFail?'FAIL':'PASS')+' seed '+seed+': federasyonsuz '+row.control.equal+' ay ham Save8/RNG eşit'+(row.active?'; ilk federasyon ayı '+row.active.firstFedMonth+(row.active.firstDiff?', ilk fark ayı '+row.active.firstDiff.m+' ('+row.active.firstDiff.paths.slice(0,6).join(' ')+')':', fark yok'):''));
}
fs.writeFileSync(path.join(out,'esdegerlik-p27-aday.json'),JSON.stringify({controlCommit:commit,months:MONTHS,seeds:SEEDS,rows},null,1));
if(tmp)fs.rmSync(tmp,{recursive:true,force:true});
console.log(`GEÇEN: ${SEEDS.length-fail} KALAN: ${fail}`);if(fail)process.exitCode=1;
