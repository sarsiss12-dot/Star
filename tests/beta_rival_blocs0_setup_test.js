'use strict';
/* BETA-RIVAL-BLOCS.0 — kurulum: 0,05/0,10/0,15× gezegen çarpanı, Rakip Doktrinler klavyesiz aralığı. Gerçek runtime (Node vm). */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const OUT=process.env.STARS_OUTPUT||path.join(__dirname,'..','reports','claude','evidence','beta-rival-blocs0');
const shape=h=>J(h,`(()=>{const homes=G.emps.filter(e=>!e.wild).map(e=>e.home);return {xy:G.sys.map(s=>[s.x,s.y]),lanes:G.sys.map(s=>s.lanes.slice().sort((a,b)=>a-b)),homes,planets:G.sys.reduce((n,s)=>n+s.planets.length,0),
  census:colonizableCensus(new Set(homes)),mul:LAST_PLANET_MUL&&{mul:LAST_PLANET_MUL.mul,before:LAST_PLANET_MUL.before.normal,after:LAST_PLANET_MUL.after.normal,changed:LAST_PLANET_MUL.changed},
  homeHab:homes.every(id=>G.sys[id].planets.some(p=>PLANETS[p.t]?.k==='hab'))};})()`);

test('K1 500 sistem / 16 AI, tohum 11/23/404: 0,05 / 0,10 / 0,15 / 0,25× — konum, hat, başkent ve toplam gezegen aynı; normal aday ≈ çarpan; korunan/nadir değişmez',()=>{
  const rows=[];
  for(const seed of [11,23,404]){let base=null;
    for(const mul of [1,.25,.15,.1,.05]){const h=runtime();h.run(`setupGame({...CFG,seed:${seed},size:'s500',aiCount:16${mul===1?'':',planetMul:'+mul}});G.autoSave=false;`);const s=shape(h);
      if(mul===1)base=s;else{assert.deepEqual(s.xy,base.xy);assert.deepEqual(s.lanes,base.lanes);assert.deepEqual(s.homes,base.homes);assert.equal(s.planets,base.planets,'toplam gezegen');
        assert.equal(s.census.guaranteed,base.census.guaranteed);assert.equal(s.census.rare,base.census.rare);assert.equal(s.census.special,base.census.special);
        assert.equal(s.census.normal,Math.max(0,Math.round(base.census.normal*mul)));}
      assert.ok(s.homeHab,'başkentler yaşanabilir');
      rows.push({seed,mul,normal:s.census.normal,guaranteed:s.census.guaranteed,special:s.census.special,rare:s.census.rare,protectedHabitable:s.census.guaranteed+s.census.special+s.census.rare,totalHabitable:s.census.total,planets:s.planets});}}
  fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'gezegen-carpani-dusuk.json'),JSON.stringify(rows,null,1));
  console.log(rows.map(r=>`${r.seed} ${r.mul}× normal ${r.normal} korunan ${r.protectedHabitable} toplam ${r.totalHabitable}`).join('\n'));
});
test('K2 küçük harita 0,05×: normal aday sıfıra yuvarlanır; başlangıç dünyaları korunur; 36 ayda AI yalnız yaşanabilir/habitat hedefe koloni kurar, istisna yok',()=>{
  const h=runtime();h.run(`setupGame({...CFG,seed:11,size:'kucuk',aiCount:3,planetMul:.05,pirates:false});G.autoSave=false;
   globalThis.__bad=[];const _dc=doColonize;doColonize=function(e,f,p){const r=_dc.apply(this,arguments);return r;};
   function step(){for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}`);
  const s=shape(h);assert.ok(s.mul.before>0);assert.equal(s.census.normal,0,'normal aday sıfıra yuvarlandı: '+JSON.stringify(s.mul));assert.ok(s.homeHab);
  h.run('for(let m=0;m<36;m++)step();');
  const bad=J(h,`G.sys.flatMap(s=>s.planets.filter(p=>p.col&&PLANETS[p.t]?.k!=='hab'&&!p.col.habitat&&!p.habitat).map(p=>({s:s.id,t:p.t})))`);
  assert.deepEqual(bad,[],'ölü dünyaya koloni yok');
  assert.ok(h.run('G.emps.filter(e=>!e.wild&&!e.dead).every(e=>e.colonies.length>=1)'),'her devlet başkentini korur');
});
test('K3 Save8: 0,05× yeniden yüklenince galaksi YENİDEN ÜRETİLMEZ (aynı gezegenler); çarpansız eski kayıt 1× sayılır',()=>{
  const h=runtime();h.run(`setupGame({...CFG,seed:11,size:'orta',aiCount:5,planetMul:.05});G.autoSave=false;var txt=serialize(),pl=JSON.stringify(G.sys.map(s=>s.planets.map(p=>p.t)));G.sys=[];var ok1=deserialize(txt);`);
  assert.equal(h.run('ok1'),true,'yükleme başarılı');
  assert.equal(h.run('G.cfg.planetMul'),.05);assert.equal(h.run('JSON.stringify(G.sys.map(s=>s.planets.map(p=>p.t)))'),h.run('pl'));
  h.run(`var d=JSON.parse(txt);delete d.cfg.planetMul;var ok2=deserialize(JSON.stringify(d));`);assert.equal(h.run('ok2'),true,'eski kayıt yüklenir');assert.equal(h.run('planetMulOf(G.cfg)'),1);assert.equal(h.run('JSON.stringify(G.sys.map(s=>s.planets.map(p=>p.t)))'),h.run('pl'));
  assert.equal(h.run(`setupConfigError({...CFG,planetMul:.05})`),'');assert.notEqual(h.run(`setupConfigError({...CFG,planetMul:.07})`),'');
});
test('K4 MP lobi: host 0,05× ayarı mp-core configure ile kabul edilir; geçersiz çarpan reddedilir',()=>{
  const h=runtime();let n=0;h.sb.out=[];h.sb.rand=k=>require('crypto').createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);
  h.run(fs.readFileSync(path.join(__dirname,'..','research/mp0/mp-core.js'),'utf8'));
  h.run(`var MP=StarsMP.createHost({roomId:'pm',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true}}}});`);
  assert.equal(J(h,`MP.configure({size:'orta',aiCount:5,seed:23,planetMul:.05})`).ok,true);assert.notEqual(J(h,`MP.configure({size:'orta',aiCount:5,seed:23,planetMul:.07})`).ok,true);
});
test('K5 Rakip Doktrinler: her n (0–16) ve her dokunuş dizisinde 0 ≤ En az ≤ En çok ≤ n; hazır seçimler geçerli; AI sayısı düşünce uyarlanır; seçim kurulum sonucuna yansır',()=>{
  const h=runtime();
  const ok=J(h,`(()=>{let x=7;const rnd=()=>(x=(x*1103515245+12345)%2147483648)/2147483648,steps=['min:1','min:-1','max:1','max:-1'];
    for(let n=0;n<=16;n++){for(const k of ['az','orta','cok']){const r=rivalPreset(k,n);if(!(r.min>=0&&r.min<=r.max&&r.max<=n))return 'preset '+k+' '+n;}
     const c={...CFG,aiCount:n,aiRivals:rivalPreset('orta',n)};for(let i=0;i<200;i++){rivalStep(c,steps[Math.floor(rnd()*4)]);const r=c.aiRivals;if(!(r.min>=0&&r.min<=r.max&&r.max<=n))return 'step '+n;}}
    const c={...CFG,aiCount:12,aiRivals:{min:6,max:9}};c.aiCount=4;rivalNormalize(c);if(c.aiRivals.min!==4||c.aiRivals.max!==4)return 'normalize '+JSON.stringify(c.aiRivals);return 'ok';})()`);
  assert.equal(ok,'ok');
  for(const [k,n] of [['az',8],['orta',8],['cok',8],['orta',16]]){const r=J(h,`rivalPreset('${k}',${n})`);
    for(const seed of [11,23]){const g=runtime();g.run(`setupGame({...CFG,seed:${seed},size:'${n>8?'s200':'buyuk'}',aiCount:${n},aiRivals:${JSON.stringify(r)}});`);
      const cnt=g.run(`G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide&&RIVAL_PERSONAS.includes(personaKey(e))).length`);assert.ok(cnt>=r.min&&cnt<=r.max,`${k} ${n} ${seed}: ${cnt} ∉ ${r.min}–${r.max}`);}}
  const fixed=J(h,`(()=>{const c={...CFG,aiCount:8,aiRivals:{min:5,max:6}};rivalStep(c,'max:-1');return c.aiRivals;})()`);assert.deepEqual(fixed,{min:5,max:5},'sabit sayı');
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
