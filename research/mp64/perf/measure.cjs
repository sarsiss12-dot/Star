'use strict';
/* MP.6.4 — geç oyun performans ön ölçümü (yalnız tanı; optimizasyon PERF.1'de).
   Aynı tohum ve başlangıç, iki kol: A = sensör paylaşımı kapalı, B = oyuncu (devlet 0) temaslı ve barıştaki her devletle
   karşılıklı sensör paylaşımında (FİKSTÜR: e.shareVis — motorun shareVision alanı; maliyet atlanır, her ay yenilenir).
   Gerçek motor Node vm'de (tests/helpers/runtime.js), harita çizimi @napi-rs/canvas (Skia, CPU) — tarayıcı GPU/kompozitör DEĞİL.
   Kullanım: node --expose-gc research/mp64/perf/measure.cjs [size=ulu] [ai=11] [months=240] [seed=22] > out.json */
const path=require('path'),fs=require('fs'),{performance}=require('perf_hooks');
const root=path.resolve(__dirname,'../../..');
const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const [size='ulu',ai='11',months='240',seed='22']=process.argv.slice(2);
const MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const CHECK=[12,60,120,180,240].filter(m=>m<=+months);
function arm(name,share,contactAll=false){
  const h=runtime({root,native:true,width:1280,height:720});h.sb.performance=performance;h.run(MIR);   // gerçek yüksek çözünürlüklü saat
  h.run(`setupGame({...CFG,size:${JSON.stringify(size)},aiCount:${+ai},seed:${+seed}});G.autoSave=false;enterGame();
    if(${contactAll}){for(const a of G.emps)for(const b of G.emps)if(a!==b&&!a.wild&&!b.wild){a.contact[b.id]=true;}}   /* C kolu fikstürü: herkesle temas */if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();UI.setSpeed(0);
    var __perf={ai:0,vis:0,shared:0,month:0,daily:0,aiN:0};
    const wrapT=(name,key)=>{const o=globalThis[name];globalThis[name]=function(){const t=performance.now();try{return o.apply(this,arguments);}finally{__perf[key]+=performance.now()-t;if(key==='ai')__perf.aiN++;}};};
    wrapT('aiTurn','ai');wrapT('updateVision','vis');wrapT('refreshSharedVision','shared');wrapT('monthTick','month');
    function __share(){if(!${share})return;const p=G.p;p.shareVis=p.shareVis||{};for(const o of G.emps){if(o===p||o.dead||o.wild||!p.contact[o.id]||p.war[o.id])continue;p.shareVis[o.id]=true;o.shareVis=o.shareVis||{};o.shareVis[p.id]=true;}}
    function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){const t=performance.now();G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();__perf.daily+=performance.now()-t;if(Math.floor(G.day/30)>b){__share();monthTick();updateVision();break;}}}`);
  const res={arm:name,share,checkpoints:[]};let m=0;const wall0=performance.now();
  while(m<+months){
    const t0=performance.now(),p0=JSON.parse(h.run('JSON.stringify(__perf)'));
    for(let k=0;k<12&&m<+months;k++,m++)h.run('__step()');
    const dt=performance.now()-t0,p1=JSON.parse(h.run('JSON.stringify(__perf)'));
    if(!CHECK.includes(m))continue;
    const per=k=>+((p1[k]-p0[k])/12).toFixed(2);
    const draw=[];h.run('View.fit&&View.fit()');for(let i=0;i<8;i++){const t=performance.now();h.run('View.dirty=true;View.draw('+(1000+i*16)+')');draw.push(performance.now()-t);}draw.sort((a,b)=>a-b);
    const counts=JSON.parse(h.run(`JSON.stringify((()=>{const vis=new Set(G.vis||[]);for(const v of (G._sensorVision||new Map()).values())for(const id of v)vis.add(id);
      const fv=G.fleets.filter(f=>f.ships.length&&(f.e===0||vis.has(f.sys>=0?f.sys:(f.mv?f.mv.to:-1))));
      return {systems:G.sys.length,visible:vis.size,seen0:G.sys.filter(s=>s.seen.includes(0)).length,fleets:G.fleets.filter(f=>f.ships.length).length,visibleFleets:fv.length,ships:G.fleets.reduce((n,f)=>n+f.ships.length,0),
        alive:G.emps.filter(e=>!e.dead&&!e.wild).length,news:(G.news&&G.news.records||[]).length,newsHidden:(G.news&&G.news.hidden||[]).length,log:G.log.length,
        shareActive:Object.keys(G.p.shareVis||{}).filter(id=>sensorShareActive(G.p,G.emps[id])).length};})())`));
    const t1=performance.now();const save=h.run('serialize()');const serMs=performance.now()-t1;
    /* MP: ayna (devlet 1 misafir) kurma ve boyut; misafir tarafında motorun deserialize'ı */
    const t2=performance.now();const mir=h.run('JSON.stringify(StarsMirror.build(1,{cosmeticSeed:7}))');const mirMs=performance.now()-t2;
    const g=runtime({root});g.sb.__t=mir;const t3=performance.now();const ok=g.run('deserialize(__t)');const desMs=performance.now()-t3;
    if(global.gc)global.gc();
    res.checkpoints.push({month:m,day:Math.floor(+h.run('G.day')),simMsPerMonth:+(dt/12).toFixed(1),breakdown:{aiTurn:per('ai'),updateVision:per('vis'),refreshSharedVision:per('shared'),monthTick:per('month'),dailyLoop:per('daily')},
      aiTurnCalls:Math.round((p1.aiN-p0.aiN)/12),drawMs:{median:+draw[4].toFixed(1),max:+draw[7].toFixed(1)},counts,saveKB:Math.round(save.length/1024),serializeMs:+serMs.toFixed(1),
      mirror:{buildMs:+mirMs.toFixed(1),kb:Math.round(mir.length/1024),guestDeserializeMs:+desMs.toFixed(1),ok},heapMB:Math.round(process.memoryUsage().heapUsed/1048576)});
    process.stderr.write(name+' month '+m+' '+JSON.stringify(res.checkpoints.at(-1))+'\n');
  }
  res.wallSec=+((performance.now()-wall0)/1000).toFixed(1);return res;
}
/* MP64_ARMS=A,B,C — C: B + başlangıçta bütün devletlerle temas (paylaşım hemen geniş: "galaksinin büyük bölümü görünür" durumu) */
const want=(process.env.MP64_ARMS||'A,B').split(','),ARMS={A:()=>arm('A-paylasim-kapali',false),B:()=>arm('B-paylasim-acik',true),C:()=>arm('C-temas-tam-paylasim-acik',true,true)};
const out={size,ai:+ai,months:+months,seed:+seed,node:process.version,arms:want.filter(k=>ARMS[k]).map(k=>ARMS[k]())};
process.stdout.write(JSON.stringify(out,null,1)+'\n');
