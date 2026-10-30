'use strict';
/* MP.6 — ayna dünya (research/mp6/mirror.js) ve çekirdek entegrasyonu: host'un gerçek STARS motoru (Node vm) ve AYRI bir vm'de
   misafir tarafı (motorun kendi deserialize'ı). Dünya seed 22, orta, 5 AI; misafirler 3 ve 5 uzak insan.
   Kanıtlanan: saflık (host Save8/RNG değişmez), görünürlük eşitliği (misafirin bilinen/görünen kümesi host'un o devlet için
   hesapladığıyla aynı), yeniden numaralandırma (misafir = 0, host'un devleti = misafirin numarası), gizlilik (beyaz liste),
   fark/uygulama gidiş-dönüşü, çekirdek mesajları ve misafir sayfası (aynı index.html + katı CSP). */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),http=require('http'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime');
const root=path.resolve(__dirname,'..'),T=[];const test=(n,f)=>T.push([n,f]);   // async vakalar da sırayla koşar
const MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8'),CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const STEP='function step(d){for(let i=0;i<d*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick();}}';
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
let W=null;
function world(){if(W)return W;const h=runtime({root});h.run(MIR);h.run(CORE);
  h.run(`setupGame({...CFG,size:'orta',aiCount:5,seed:22});G.autoSave=false;for(const id of [3,5])G.emps[id].ai=false;${STEP};step(500);
    for(const k of ['etk','min'])G.emps[3].res[k]+=500;G.emps[3].contact[5]=G.emps[5].contact[3]=true;G.emps[3].rel[5]=G.emps[5].rel[3]=40;`);
  return W=h;}
function guest(text){const g=runtime({root});g.sb.__t=text;assert.equal(g.run('deserialize(__t)'),true,'engine deserialize accepts the mirror');return g;}

test('saflık: ayna üretmek host Save8 ve RNG\'yi değiştirmez; aynı durumda aynı ayna (deterministik); tohum yerine kozmetik tohum',()=>{
  const h=world();const s0=h.run('serialize()'),r0=h.run('RND_STATE');
  const a=h.run('JSON.stringify(StarsMirror.build(3,{cosmeticSeed:7}))'),b=h.run('JSON.stringify(StarsMirror.build(3,{cosmeticSeed:7}))');
  assert.equal(h.run('serialize()'),s0);assert.equal(h.run('RND_STATE'),r0);assert.equal(a,b);
  const m=JSON.parse(a);assert.equal(m.seed,7);assert.equal(m.cfg.seed,7);assert.equal(m.rs,1);assert.notEqual(J(h,'G.seed'),7);
});
test('misafir tarafında motorun kendi deserialize\'ı: G.p = misafirin devleti (0); kaynak, koloni, filo, araştırma host\'taki gerçeğiyle aynı; bilinen/görünen sistem kümesi birebir aynı',()=>{
  const h=world();for(const me of [3,5]){const g=guest(h.run(`JSON.stringify(StarsMirror.build(${me},{cosmeticSeed:7}))`));
    assert.deepEqual(J(g,'[G.p.id,G.p.ai,G.p.name]'),[0,false,J(h,`G.emps[${me}].name`)]);
    assert.deepEqual(J(g,'G.p.res'),J(h,`G.emps[${me}].res`));assert.deepEqual(J(g,'G.p.colonies'),J(h,`G.emps[${me}].colonies`));
    assert.deepEqual(J(g,'Object.keys(G.p.techs).sort()'),J(h,`Object.keys(G.emps[${me}].techs).sort()`));assert.deepEqual(J(g,'G.p.research.targets'),J(h,`G.emps[${me}].research.targets`));
    assert.deepEqual(J(g,'G.fleets.filter(f=>f.e===0).map(f=>[f.id,f.sys,f.ships.length]).sort()'),J(h,`G.fleets.filter(f=>f.e===${me}).map(f=>[f.id,f.sys,f.ships.length]).sort()`));
    for(const k of ['known','visible'])assert.deepEqual(J(g,`[...explorationContext(G.emps[0]).${k}].sort((a,b)=>a-b)`),J(h,`[...explorationContext(G.emps[${me}]).${k}].sort((a,b)=>a-b)`),me+' '+k);}
});
test('yeniden numaralandırma: yalnız misafir ↔ 0 yer değiştirir; sistem/gezegen sahibi, filo sahibi ve ilişki haritaları buna göre; host\'un devleti misafirin numarasında',()=>{
  const h=world(),me=3,m=JSON.parse(h.run(`JSON.stringify(StarsMirror.build(${me},{cosmeticSeed:7}))`)),pi=x=>x===me?0:x===0?me:x;
  const vis=new Set(J(h,`[...explorationContext(G.emps[${me}]).visible]`));
  for(const s of m.sys)if(vis.has(s.i))assert.equal(s.o,pi(J(h,`G.sys[${s.i}].owner`)),'owner '+s.i);
  for(const f of m.fl)assert.equal(f.e,pi(J(h,`G.fleets.find(x=>x.id===${f.id}).e`)));
  assert.equal(m.emps[0].rel[pi(5)],J(h,`G.emps[${me}].rel[5]`));assert.equal(m.emps[0].contact[pi(5)],true);
  assert.equal(m.emps[me].id,me,'host empire sits at the guest\'s old index');assert.equal(m.emps.every((e,i)=>e.id===i),true);
});
test('gizlilik (beyaz liste): başka devletin kaynak/teknoloji/araştırma/AI planı yok; host günlüğü yok; bilinmeyen sistemde ad/yıldız/gezegen/sahip yok; yabancı koloni ayrıntısı ve yabancı filo rotası yok; temassız devlet adı yok',()=>{
  const h=world(),me=3,m=JSON.parse(h.run(`JSON.stringify(StarsMirror.build(${me},{cosmeticSeed:7,log:[{d:1,m:'not',c:''}]}))`));
  const known=new Set(J(h,`[...explorationContext(G.emps[${me}]).known]`)),vis=new Set(J(h,`[...explorationContext(G.emps[${me}]).visible]`));
  for(const e of m.emps.slice(1)){assert.equal(Object.values(e.res).reduce((a,b)=>a+b,0),0);assert.deepEqual([Object.keys(e.techs).length,e.research.targets.length,Object.keys(e.rq).length],[0,0,0]);
    for(const k of ['aiStrategy','aiIntel','aiShipPlan','aiTalk','spy','mem'])assert(!e[k]||!Object.keys(e[k]).length,k);}
  assert.deepEqual(m.log,[{d:1,m:'not',c:''}],'only the guest\'s own notes');
  const hostLog=J(h,'G.log.map(x=>x.m)');assert(!hostLog.some(t=>JSON.stringify(m).includes(JSON.stringify(t).slice(1,-1))&&t.length>12),'no host log line');
  for(const s of m.sys){if(!known.has(s.i))assert.deepEqual([s.n,s.p.length,s.o,s.st],['',0,-1,0],'unknown '+s.i);
    if(!vis.has(s.i)&&s.o!==-1)assert.equal(s.o,0,'owner only where visible (or own)');
    for(const p of s.p)if(p.col&&p.owner!==0)assert.deepEqual([Object.keys(p.col.b).length,p.col.q.length,p.col.stab],[0,0,0]);}
  for(const f of m.fl)if(f.e!==0){assert.deepEqual([f.path.length,f.mv],[0,null]);assert(vis.has(f.sys));}
  const uncontacted=J(h,`G.emps.filter(o=>o.id!==${me}&&!G.emps[${me}].contact[o.id]).map(o=>o.id)`);
  for(const id of uncontacted){const e=m.emps[id===0?me:id];assert.equal(e.name,'Bilinmeyen devlet');}
  const text=JSON.stringify(m);for(const id of uncontacted)assert(!text.includes(J(h,`G.emps[${id}].name`)),'uncontacted name leaked');
});
test('fark/uygulama: 20 gün sonraki ayna = önceki ayna + fark (bayt bayt); fark tam aynadan çok küçük',()=>{
  const h=world();const a=J(h,'StarsMirror.build(3,{cosmeticSeed:7})');h.run('var __s=serialize(),__r=RND_STATE;step(20)');const b=J(h,'StarsMirror.build(3,{cosmeticSeed:7})');
  h.run('deserialize(__s);RND_STATE=__r');
  const g=runtime({root});g.run(MIR);g.sb.__a=JSON.stringify(a);g.sb.__o=J(h,`StarsMirror.diff(${JSON.stringify(a)},${JSON.stringify(b)})`);
  const c=JSON.parse(g.run('JSON.stringify(StarsMirror.apply(JSON.parse(__a),__o))'));assert.equal(JSON.stringify(c),JSON.stringify(b));
  assert(JSON.stringify(g.sb.__o).length<JSON.stringify(b).length/2,'delta smaller than full');
});
test('çekirdek: misafir "ui:stars" isteyince ayna (tam, sonra fark) gönderilir; bozuk istek ve devletsiz bağlantı reddedilir; yeniden bağlanmada ve resync\'te tam ayna; host Save8/RNG değişmez',()=>{
  const h=runtime({root});h.run(MIR);h.run(CORE);h.sb.__out=[];
  h.run(`${STEP};var MP=StarsMP.createHost({roomId:'r6',random:n=>'ab'.repeat(n),send:(c,t)=>__out.push([c,t]),mirrorMs:0,lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(2);MP.configure({size:'orta',aiCount:5,seed:22});
    MP.onMessage('cB',JSON.stringify({v:1,type:'hello',name:'Bora'}));MP.onMessage('cB',JSON.stringify({v:1,type:'claim',empire:3}));MP.onMessage('cB',JSON.stringify({v:1,type:'ready',value:true}));
    if(!MP.start().ok)throw Error('start');step(10);`);
  const msgs=c=>h.sb.__out.filter(([x])=>x===c).map(([,t])=>JSON.parse(t));
  h.run(`MP.onMessage('cX',JSON.stringify({v:1,type:'ui',mode:'stars'}))`);assert.equal(msgs('cX').at(-1).code,'no-empire');
  h.run(`MP.onMessage('cB',JSON.stringify({v:1,type:'ui',mode:'other'}))`);assert.equal(msgs('cB').at(-1).code,'bad-ui');
  const s0=h.run('serialize()'),r0=h.run('RND_STATE');
  h.run(`MP.onMessage('cB',JSON.stringify({v:1,type:'ui',mode:'stars'}))`);const full=msgs('cB').filter(m=>m.type==='mirror');assert.equal(full.length,1);
  assert.equal(h.run('serialize()'),s0);assert.equal(h.run('RND_STATE'),r0);
  h.run('step(3);MP.publish()');const d=msgs('cB').filter(m=>m.type==='mirrorDelta');assert(d.length>=1);assert.equal(d.at(-1).base,full[0].rev);
  const g=runtime({root});g.run(MIR);g.sb.__m=full[0].full;g.sb.__o=d.at(-1).ops;g.run('StarsMirror.apply(__m,__o)');
  assert.equal(JSON.stringify(g.sb.__m.day),JSON.stringify(J(h,'G.day')),'guest copy follows the host');
  h.run(`MP.onMessage('cB',JSON.stringify({v:1,type:'resync'}))`);assert.equal(msgs('cB').filter(m=>m.type==='mirror').length,2,'resync → full');
  const tok=msgs('cB').find(m=>m.type==='assign').token;h.run(`MP.onMessage('cB2',JSON.stringify({v:1,type:'hello',name:'Bora',token:'${tok}'}))`);
  h.run(`MP.onMessage('cB2',JSON.stringify({v:1,type:'ui',mode:'stars'}))`);assert(msgs('cB2').filter(m=>m.type==='mirror').length>=1,'reconnect → full');
  const priv=msgs('cB2').filter(m=>m.type==='mirror')[0].full;assert.equal(priv.emps[0].name,J(h,'G.emps[3].name'));assert.notEqual(priv.cfg.seed,22);
});
test('misafir sayfası (/mp/play): aynı index.html + <base href="/"> + lobi/ayna betikleri; runtime baytları değişmez; CSP katı (yalnız index\'in kendi satır içi betiği ve tam ekran işleyicisi özetle)',async()=>{
  const relay=require('../research/mp1/server/relay.js').create({MP1_PORT:'0'});const s=await relay.start();
  try{const get=p=>new Promise((res,rej)=>http.get({host:'127.0.0.1',port:s.address().port,path:p},r=>{const b=[];r.on('data',d=>b.push(d));r.on('end',()=>res({status:r.statusCode,h:r.headers,body:Buffer.concat(b).toString()}));}).on('error',rej));
    const r=await get('/mp/play?code=ABCD-EFGH');assert.equal(r.status,200);
    const orig=fs.readFileSync(path.join(root,'index.html'),'utf8');
    assert.equal(r.body,orig.replace('<head>','<head><base href="/">').replace('</body>','<link rel="stylesheet" href="/research/mp1/client/mp1.css"><link rel="stylesheet" href="/research/mp3/client/mp3.css"><link rel="stylesheet" href="/research/mp31/client/mp31.css"><link rel="stylesheet" href="/research/mp6/client/mp6.css"><script src="/research/mp1/client/view.js"></script><script src="/research/mp3/client/dip-ui.js"></script><script src="/research/mp31/client/pol-ui.js"></script><script src="/research/mp6/mirror.js"></script><script src="/research/mp6/client/guest-stars.js"></script><script src="/research/mp1/client/join.js"></script></body>'));
    const csp=r.h['content-security-policy'];assert.match(csp,/script-src 'self' 'unsafe-hashes' 'sha256-/);assert(!/script-src[^;]*'unsafe-inline'/.test(csp),'no unsafe-inline scripts');
    const inline=[...orig.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>"'sha256-"+crypto.createHash('sha256').update(m[1]).digest('base64')+"'");
    for(const x of inline)assert(csp.includes(x),'inline script hash');assert(csp.includes("'sha256-"+crypto.createHash('sha256').update('forceFullscreen()').digest('base64')+"'"));
    for(const p of ['/research/mp6/mirror.js','/research/mp6/client/guest-stars.js','/research/mp6/client/mp6.css'])assert.equal((await get(p)).status,200,p);
    assert.equal((await get('/mp/join?code=X')).status,200,'legacy lite client kept during the transition');
  }finally{relay.shutdown('test');}
});
test('performans: 45 / 60 / 100 sistemde ayna boyutu, host üretim süresi, misafir deserialize süresi',()=>{
  const out={};
  for(const [size,ai] of [['orta',5],['buyuk',7],['ulu',11]]){const h=runtime({root});h.run(MIR);
    h.run(`setupGame({...CFG,size:${JSON.stringify(size)},aiCount:${ai},seed:42});G.autoSave=false;G.emps[1].ai=false;${STEP};step(200);`);
    let t=Date.now();const text=h.run('JSON.stringify(StarsMirror.build(1,{cosmeticSeed:7}))');const bms=Date.now()-t;
    t=Date.now();guest(text);const lms=Date.now()-t;out[J(h,'G.sys.length')]={kb:Math.round(text.length/1024),buildMs:bms,loadMs:lms};
    assert(text.length<300000);}
  console.log('   '+Object.entries(out).map(([n,r])=>n+' sistem: ayna '+r.kb+' KB, host üretimi '+r.buildMs+' ms, misafir yüklemesi '+r.loadMs+' ms').join(' · '));
});
(async()=>{let pass=0,fail=0;for(const [n,f] of T){try{await f();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
  console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);})();
