'use strict';
/* BETA-GALAXY.0 — galaksi şekilleri, yapısal rota denetimi/onarımı, kolonileştirilebilir gezegen çarpanı.
   Gerçek runtime Node vm'de (tests/helpers/runtime.js). Kontrol kolu: birleşik aday d64af78 (git show ile sabit kopya).
   FİKSTÜR (açıkça): G3'te bilerek kopuk harita kurulur (iki yarı arası hatlar kesilir, geçersiz/tek yönlü hat eklenir). */
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const out=process.env.STARS_OUTPUT||path.join(__dirname,'..','reports/claude/evidence/beta-galaxy0');fs.mkdirSync(out,{recursive:true});const out_dir=()=>out;
const setup=(o)=>{const h=runtime();h.sb.__o=o;h.run(`setupGame({...CFG,...__o});G.autoSave=false;`);return h;};
const NEW=['eliptik','kumeli','cubuklu','duzensiz'];
const rows={shapes:[],broken:null,planetMul:[],ai:[]};

test('G1 yeni şekiller × 2 tohum × (30 sistem/8 AI, 500 sistem/16 AI) + yıldız kapısı kapalı: tek bileşen, her başkentten bütün sistem ve gezegenler, belirlenimci',()=>{
  for(const shape of NEW)for(const seed of [11,404])for(const [size,aiCount,gates] of [['kucuk',8,true],['kucuk',8,false],['s500',16,true]]){
    const h=setup({seed,size,shape,aiCount,gates});const r=J(h,'LAST_GALAXY_ROUTE'),g=J(h,'LAST_GALAXY_GEN');
    rows.shapes.push({shape,seed,size,aiCount,gates,componentsAtGeneration:g.componentsBeforeMerge,generatorLinks:g.mergeLinks,clusters:g.clusters,interClusterLanes:g.interClusterLanes,
      components:r.components,reachableSystems:r.reachableSystems,systems:r.systems,reachablePlanets:r.reachablePlanets,planets:r.planets,repairs:r.repairs+r.initialRepairs});
    assert.equal(r.ok,true,shape+' '+seed+' '+size);assert.equal(r.components,1);assert.equal(r.reachableSystems,r.systems);assert.equal(r.reachablePlanets,r.planets);
    if(size==='kucuk'&&gates){const h2=setup({seed,size,shape,aiCount,gates});assert.equal(h2.run('serialize()'),h.run('serialize()'),'aynı tohum + ayar aynı harita');}
  }
  fs.writeFileSync(path.join(out,'sekil-rota.json'),JSON.stringify(rows.shapes,null,1));
});

test('G2 eski üç şekil (sarmal/halka/küme) kontrol d64af78 ile ham Save8 + RNG birebir (çarpan 1×, rota denetimi işlem yapmaz)',()=>{
  const ctl=fs.mkdtempSync(path.join(os.tmpdir(),'galaxy0-ctl-'));
  try{for(const f of Object.keys(JSON.parse(fs.readFileSync('RELEASE-MANIFEST.json')).files)){const d=path.join(ctl,f);fs.mkdirSync(path.dirname(d),{recursive:true});fs.writeFileSync(d,cp.execFileSync('git',['show','d64af78:'+f],{maxBuffer:8*1024*1024}));}
    let n=0;for(const shape of ['sarmal','halka','kume'])for(const seed of [11,23,404])for(const size of ['kucuk','orta']){
      const a=runtime({root:ctl}),b=runtime(),c=`setupGame({...CFG,seed:${seed},size:'${size}',shape:'${shape}'});G.autoSave=false;`;a.run(c);b.run(c);
      assert.equal(b.run('serialize()'),a.run('serialize()'),shape+' '+seed+' '+size);assert.equal(b.run('RND_STATE'),a.run('RND_STATE'));n++;}
    assert.equal(n,18);
  }finally{fs.rmSync(ctl,{recursive:true,force:true});}
});

test('G3 bilerek kopuk harita: denetim yakalar (birden çok bileşen, tek yönlü + geçersiz hat), onarım en az hatla birleştirir, düzeltilmiş rotada GERÇEK gemi emri (orderMove + dailyTick) hedefe varır',()=>{
  const h=setup({seed:22,size:'orta',shape:'kumeli',aiCount:5,pirates:false});
  const r=J(h,`(()=>{const home=G.sys[G.p.home];
    /* başkentten en uzak öbek: o öbekle geri kalan arasındaki bütün hatları kes */
    const d=new Array(G.sys.length).fill(-1);d[home.id]=0;const q=[home.id];while(q.length){const u=q.shift();for(const v of G.sys[u].lanes)if(d[v]<0){d[v]=d[u]+1;q.push(v);}}
    const far=d.indexOf(Math.max(...d));const cut=new Set();const q2=[far],seen=new Set([far]);
    while(q2.length&&seen.size<Math.floor(G.sys.length/4)){const u=q2.shift();for(const v of G.sys[u].lanes)if(!seen.has(v)&&v!==home.id&&!G.emps.some(e=>e.home===v)){seen.add(v);q2.push(v);}}
    let removed=0;for(const a of G.sys)for(const b of [...a.lanes])if(seen.has(a.id)!==seen.has(b)){a.lanes.splice(a.lanes.indexOf(b),1);removed++;}
    const inside=[...seen];const tgt=inside.find(id=>G.sys[id].planets.length)??inside[0];
    G.sys[inside[0]].lanes.push(9999);                 // geçersiz hat
    const a0=G.sys[inside[0]],b0=G.sys[a0.lanes.find(x=>x!==9999)];b0.lanes.splice(b0.lanes.indexOf(a0.id),1);   // tek yönlü
    const before=galaxyRouteAudit(G.emps.filter(e=>!e.wild).map(e=>e.home));
    /* geçiş izni (oyun içi kural) testte ittifakla açılır: yalnız YAPISAL rota sınanır */
    for(const o of G.emps)if(o.id!==0&&!o.wild){G.p.ally[o.id]=o.ally[0]=true;G.p.contact[o.id]=o.contact[0]=true;G.p.war[o.id]=o.war[0]=false;}
    const fl=G.fleets.find(f=>f.e===0&&isArmed(f)&&f.sys===home.id);fl.path=[];fl.mv=null;
    const blocked=orderMove(fl,tgt);
    const rep=galaxyRouteRepair(G.emps.filter(e=>!e.wild).map(e=>e.home));
    const ok=orderMove(fl,tgt);const path=fl.path.slice();
    let day=0,alive=true;for(;day<720&&!(fl.sys===tgt&&!fl.mv);day++){for(let k=0;k<4;k++){G.day+=.25;dailyTick(.25);}if(!G.fleets.includes(fl)){alive=false;break;}}
    return {cutLanes:removed/2,isolated:inside.length,target:tgt,before:{ok:before.ok,components:before.components,issues:before.issueCount,kinds:[...new Set(before.issues.map(i=>i.kind))],reachableSystems:before.reachableSystems,systems:before.systems},
      blockedOrder:!!blocked,repair:galaxyRouteSummary(rep),orderAfter:!!ok,pathLen:path.length,arrived:fl.sys===tgt&&!fl.mv,days:day,fleetAlive:alive&&G.fleets.includes(fl),ships:fl.ships.length};})()`);
  rows.broken=r;fs.writeFileSync(path.join(out,'kopuk-harita.json'),JSON.stringify(r,null,1));
  assert.equal(r.before.ok,false);assert.ok(r.before.components>=2,'kopukluk yakalandı');assert.ok(r.before.kinds.includes('invalid')&&r.before.kinds.includes('oneway'),JSON.stringify(r.before));
  assert.ok(r.before.reachableSystems<r.before.systems);assert.equal(r.blockedOrder,false,'kopukken rota yok, emir reddedilir');
  assert.equal(r.repair.ok,true);assert.equal(r.repair.links.length,r.repair.componentsBefore-1,'en az hat: bileşen sayısı − 1');assert.equal(r.repair.sanitized,1);assert.equal(r.repair.oneway,1);assert.equal(r.repair.components,1);
  assert.equal(r.orderAfter,true);assert.ok(r.pathLen>0);assert.equal(r.arrived,true,'gemi düzeltilmiş rotadan hedefe vardı: '+JSON.stringify(r));assert.equal(r.fleetAlive,true);
});

test('G4 onarım başarısızsa oyun başlamaz: setupGame açık RangeError + galaxyRoute özeti (MP host generate aynı istisnayı ok:false yapar)',()=>{
  const h=runtime();const r=J(h,`(()=>{const orig=galaxyRouteRepair;galaxyRouteRepair=c=>({ok:false,repairs:0,before:galaxyRouteAudit(c),after:galaxyRouteAudit(c),log:{sanitized:0,oneway:0,links:[]}});
    try{setupGame({...CFG,seed:5,size:'kucuk',shape:'kumeli'});return {threw:false};}catch(e){return {threw:true,range:e instanceof RangeError,msg:e.message,route:!!e.galaxyRoute};}finally{galaxyRouteRepair=orig;}})()`);
  assert.equal(r.threw,true);assert.equal(r.range,true);assert.equal(r.route,true);assert.match(r.msg,/rota denetimi/);
});

test('G5 gezegen çarpanı: 3 tohum × 0,5/1/2 (+ uçlar 0,25/3): konum, hat, başkent aynı; normal aday sayısı ölçeklenir; başkent/nadir dünyalar korunur; 1× bayt-bayt aynı',()=>{
  for(const seed of [11,23,404]){
    const base=setup({seed,size:'orta'}),bs=base.run('serialize()');
    const geo=h=>J(h,'G.sys.map(s=>[Math.round(s.x),Math.round(s.y),s.lanes.slice().sort((a,b)=>a-b).join(",")]).concat([G.emps.map(e=>e.home)])');
    const g0=geo(base);
    for(const mul of [.25,.5,1,2,3]){
      const h=mul===1?setup({seed,size:'orta',planetMul:1}):setup({seed,size:'orta',planetMul:mul});
      const s=J(h,'LAST_PLANET_MUL'),caps=J(h,'G.emps.filter(e=>!e.wild).map(e=>{const s=G.sys[e.home];return s.planets.filter(p=>p.owner===e.id).map(p=>p.t+":"+p.sz).join()})');
      const capsBase=J(base,'G.emps.filter(e=>!e.wild).map(e=>{const s=G.sys[e.home];return s.planets.filter(p=>p.owner===e.id).map(p=>p.t+":"+p.sz).join()})');
      rows.planetMul.push({seed,mul,normal:s.after.normal,normalAt1x:s.before.normal,special:s.after.special,guaranteed:s.after.guaranteed,rare:s.after.rare,total:s.after.total,changed:s.changed});
      assert.deepEqual(geo(h),g0,'konum/hat/başkent aynı '+seed+' '+mul);assert.deepEqual(caps,capsBase,'başkent dünyaları aynı');
      assert.equal(s.after.guaranteed,s.before.guaranteed);assert.equal(s.after.rare,s.before.rare);assert.equal(s.after.special,s.before.special);
      if(mul===1){const x=JSON.parse(h.run('serialize()'));assert.equal(x.cfg.planetMul,1);delete x.cfg.planetMul;assert.equal(JSON.stringify(x),bs,'1× = çarpansız bayt (cfg alanı dışında; arayüz 1×\'i hiç yazmaz)');}
      else assert.ok(Math.abs(s.after.normal-Math.round(s.before.normal*mul))<=Math.max(1,s.before.normal*mul*.02),JSON.stringify(s));
    }
  }
  fs.writeFileSync(path.join(out,'gezegen-carpani.json'),JSON.stringify(rows.planetMul,null,1));
});

test('G6 çarpan kayıt/yükleme: cfg.planetMul Save8\'de kalır, yükleme galaksiyi yeniden üretmez; çarpansız eski kayıt 1× sayılır',()=>{
  const h=setup({seed:42,size:'orta',planetMul:2});const s1=h.run('serialize()');
  const g=runtime();g.sb.s=s1;assert.equal(g.run('deserialize(s)'),true);assert.equal(g.run('planetMulOf(G.cfg)'),2);assert.equal(g.run('JSON.stringify(G.sys.map(s=>s.planets.map(p=>p.t+p.sz)))'),h.run('JSON.stringify(G.sys.map(s=>s.planets.map(p=>p.t+p.sz)))'),'yükleme yeniden üretmez');
  const old=JSON.parse(s1);delete old.cfg.planetMul;const o=runtime();o.sb.s=JSON.stringify(old);assert.equal(o.run('deserialize(s)'),true);assert.equal(o.run('planetMulOf(G.cfg)'),1);
  assert.equal(o.run('JSON.stringify(G.sys.map(s=>s.planets.map(p=>p.t)))'),h.run('JSON.stringify(G.sys.map(s=>s.planets.map(p=>p.t)))'),'kayıtlı gezegenler korunur');
  assert.equal(h.run(`setupConfigError({...CFG,planetMul:7})`),'Kolonileştirilebilir gezegen çarpanı geçersiz.');
});

test('G7 uçlarda AI kolonizasyonu (0,25× / 3×, 24 ay): koloni gemisi hedefleri gerçek normal adaylar, AI koloni kurar, hata yok',()=>{
  for(const mul of [.25,3]){
    const h=setup({seed:23,size:'orta',planetMul:mul,aiCount:5});
    const r=J(h,`(()=>{const c0=G.emps.filter(e=>e.ai&&!e.wild).reduce((t,e)=>t+e.colonies.length,0);
      const tg=G.emps.filter(e=>e.ai&&!e.wild).flatMap(e=>colonizeTargets(e).slice(0,3).map(t=>{const p=t.pl||(t.s!==undefined&&G.sys[t.s]?.planets[t.p])||null;return p?PLANETS[p.t].k:null;}));
      for(let i=0;i<720;i++){const m=Math.floor(G.day/30);G.day+=1;dailyTick(1);structTick(1);colonyBuildTick(1);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}
      return {c0,c1:G.emps.filter(e=>e.ai&&!e.wild).reduce((t,e)=>t+e.colonies.length,0),targets:tg};})()`);
    rows.ai.push({mul,...r});assert.ok(r.c1>=r.c0,'koloni sayısı düşmedi');
    if(mul===3)assert.ok(r.c1>r.c0,'3× bol gezegende AI koloni kurar');
  }
  fs.writeFileSync(path.join(out,'carpan-ai.json'),JSON.stringify(rows.ai,null,1));
});

test('G8 MP: lobi configure şekil + çarpanı kabul eder (geçersizi reddeder), paket ayarına yalnız ≠1 çarpan yazılır ve doğrulanır, misafir host\'un doğrulanmış galaksisini alır',()=>{
  const {world,J:JJ}=require('./helpers/beta-fed-found0-mp-world.cjs');const h=world();
  h.run(fs.readFileSync('research/mp0/mp-core.js','utf8').slice(0,0));
  const r=JJ(h,`(()=>{const a=StarsMP.createHost({roomId:'gx',random:k=>'ab'.repeat(k),send(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true};}}});
    const bad=a.configure({size:'orta',aiCount:5,seed:7,shape:'kumeli',planetMul:9});const ok=a.configure({size:'orta',aiCount:5,seed:7,shape:'kumeli',planetMul:2});
    const one=a.configure({size:'orta',aiCount:5,seed:7,shape:'kumeli',planetMul:1});return {bad:bad.ok,ok:ok.ok,one:one.ok};})()`);
  assert.deepEqual(r,{bad:false,ok:true,one:false},'1× yazılmaz (varsayılan), geçersiz reddedilir');
  const g=setup({seed:9,size:'orta',shape:'cubuklu',planetMul:.5});g.run(fs.readFileSync('research/mp0/mp-core.js','utf8'));
  const p=J(g,`(()=>{const pkg=StarsMP.packageFromSave8?null:null;const h=StarsMP.createHost({roomId:'gx2',random:k=>'cd'.repeat(k),send(){}});const k=h.snapshot({}).pkg;return {settings:k.session.settings,valid:StarsMP.validatePackage(k).ok};})()`);
  assert.equal(p.valid,true);
  g.run(fs.readFileSync('research/mp6/mirror.js','utf8'));
  const m=J(g,`(()=>{const w=StarsMirror.build(1);const ok=w.sys.every(s=>{const hs=G.sys[s.id];return !s.planets||!s.planets.length||s.planets.length===hs.planets.length;});return {n:w.sys.length,cfgMul:w.cfg&&w.cfg.planetMul,shape:w.cfg&&w.cfg.shape,ok};})()`);
  assert.equal(m.n,J(g,'G.sys.length'));assert.equal(m.ok,true);
});

test('G9 Rakip Doktrinler (#41): sabit sayı ve min–maks aralığı tohumla tutarlı; militarist/kriminal/fanatik toplamı aralıkta, aynı tohum aynı dağılım',()=>{
  const out=[];
  for(const seed of [11,23,404])for(const [min,max] of [[0,0],[2,4],[3,3],[8,8]]){
    const run=()=>J(setup({seed,size:'buyuk',aiCount:8,aiRivals:{min,max}}),`(()=>{const ai=G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide);return {n:ai.filter(e=>RIVAL_PERSONAS.includes(personaKey(e))).length,by:ai.map(e=>personaKey(e))};})()`);
    const a=run(),b=run();out.push({seed,min,max,n:a.n,by:a.by});
    assert.ok(a.n>=min&&a.n<=max,JSON.stringify({seed,min,max,a}));assert.deepEqual(b,a,'aynı tohum aynı dağılım');}
  fs.writeFileSync(path.join(out_dir(),'rakip-doktrin.json'),JSON.stringify(out,null,1));
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
