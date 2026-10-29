'use strict';
/* MP.1.1: relay'in internete açılma (üretim) kipi. Gerçek TCP/TLS soketleri.
   - herkese açık bağlama TLS/vekil + https Origin olmadan reddedilir, MP1_DEV kapalı olmalı;
   - güvenilen vekil arkasında TLS'siz istek → 308 / 403, HSTS, /healthz;
   - IP başı oda açma sınırı, SIGTERM benzeri kapanış;
   - smoke aracı: doğrudan TLS, TLS vekili arkası ve Dockerfile'ın kopyaladığı dosya kümesi;
   - host arka plana alınınca misafire nedenli duraklatma (gerçek motor, vm);
   - kaynakta gizli anahtar yok.
   Gerçek internet sunucusu yok: bu testler yerel makinededir. */
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),crypto=require('crypto'),assert=require('assert/strict'),{spawnSync,execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const relayMod=require('../research/mp1/server/relay.js'),{connect}=require('../research/mp1/deploy/ws-client.js'),smoke=require('../research/mp1/deploy/smoke.js');
const {selfSigned,startProxy}=require('./helpers/mp11-tls-proxy.js');
let pass=0,fail=0;const tests=[];const test=(n,f)=>tests.push([n,f]);
const tls=selfSigned();
const freePort=()=>new Promise(res=>{const s=require('net').createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
async function relay(env){const r=relayMod.create({MP1_PORT:'0',...env});const s=await r.start();r.server=s;r.port=s.address().port;return r;}
function stop(r){return new Promise(res=>{r.shutdown('test-end');r.server.closeAllConnections?.();r.server.close(()=>res());setTimeout(res,200);});}
const get=(port,p,headers={})=>new Promise((ok,no)=>http.get({host:'127.0.0.1',port,path:p,headers},r=>{const b=[];r.on('data',d=>b.push(d));r.on('end',()=>ok({status:r.statusCode,h:r.headers,body:Buffer.concat(b).toString()}));}).on('error',no));
async function quiet(fn){const o=console.log,lines=[];console.log=(...a)=>lines.push(a.join(' '));try{return {r:await fn(),lines};}finally{console.log=o;}}

test('public bind is refused without TLS or trusted proxy, without https origins, or with MP1_DEV; loopback stays a dev default',async()=>{
  for(const [env,re] of [[{MP1_BIND:'0.0.0.0'},/TLS yok.*MP1_ORIGINS boş/],[{MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1'},/MP1_ORIGINS boş/],
    [{MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:'http://stars.example'},/https:\/\/alan/],
    [{MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:'https://stars.example',MP1_DEV:'1'},/MP1_DEV/],
    [{MP1_BIND:'0.0.0.0',MP1_ORIGINS:'https://stars.example'},/TLS yok/]])
    await assert.rejects(relayMod.create({MP1_PORT:'0',...env}).start(),re,JSON.stringify(env));
  const cli=spawnSync(process.execPath,[path.join(root,'research/mp1/server/relay.js')],{env:{...process.env,MP1_BIND:'0.0.0.0',MP1_PORT:'0'},encoding:'utf8',timeout:10000});
  assert.equal(cli.status,1);assert.match(cli.stderr,/herkese açık başlatılamaz/);assert.equal(cli.stdout,'');
  const ok=await relay({MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:'https://stars.example'});assert.equal(ok.cfg.public,true);await stop(ok);
  const t=await relay({MP1_BIND:'0.0.0.0',MP1_TLS_CERT:tls.cert,MP1_TLS_KEY:tls.key,MP1_ORIGINS:'https://localhost'});assert.equal(t.cfg.tls,true);await stop(t);
  const dev=await relay({});assert.equal(dev.cfg.public,false);await stop(dev);
  assert.equal(relayMod.create({PORT:'8123'}).cfg.port,8123,'platform PORT is honoured');assert.equal(relayMod.create({PORT:'8123',MP1_PORT:'9000'}).cfg.port,9000);
});
test('behind a trusted proxy: plain HTTP is redirected (308) or refused (403 for WebSocket), HSTS on HTTPS, /healthz always answers',async()=>{
  const r=await relay({MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:'https://stars.example'});try{
    const h=await get(r.port,'/healthz');assert.equal(h.status,200);assert.equal(h.body,'{"ok":true}');
    const red=await get(r.port,'/mp/join?code=ABCD',{host:'stars.example'});assert.equal(red.status,308);assert.equal(red.h.location,'https://stars.example/mp/join?code=ABCD');
    assert.equal((await get(r.port,'/',{host:'stars.example','x-forwarded-proto':'http'})).status,308);
    assert.equal((await get(r.port,'/',{host:'evil.example/"><x'})).status,403,'an odd Host is never echoed into Location');
    const ok=await get(r.port,'/',{host:'stars.example','x-forwarded-proto':'https'});assert.equal(ok.status,200);assert.match(ok.h['strict-transport-security'],/max-age=31536000/);
    assert.equal((await get(r.port,'/',{host:'stars.example','x-forwarded-proto':'https, http'})).status,308,'only the last (proxy-added) hop counts');
    const u=`ws://127.0.0.1:${r.port}/mp1/ws?role=host`,o='https://stars.example';
    assert.equal((await connect(u,{origin:o,headers:{host:'stars.example'}})).status,403,'plain ws refused');
    assert.equal((await connect(u,{origin:o,headers:{'x-forwarded-proto':'http'}})).status,403);
    const w=await connect(u,{origin:o,headers:{'x-forwarded-proto':'https'}});assert.equal(w.status,101);assert.match((await w.ctl('room')).code,/^[A-Z2-9]{8}$/);w.end();
    assert.equal((await connect(u,{origin:'https://other.example',headers:{'x-forwarded-proto':'https'}})).status,403,'origin allowlist');
    assert.equal((await get(r.port,'/mp/stats',{'x-forwarded-proto':'https'})).status,404);
    assert.equal(r.stats.denied.insecure,3,'odd Host + two plain WebSocket upgrades (redirects are not denials)');
  }finally{await stop(r);}
});
test('room creation is limited per IP (10/min by default); guessing and joining limits stay as in MP.1',async()=>{
  const r=await relay({});try{const hs=[];
    for(let i=0;i<10;i++){const h=await connect(`ws://127.0.0.1:${r.port}/mp1/ws?role=host`);await h.ctl('room');hs.push(h);}
    const x=await connect(`ws://127.0.0.1:${r.port}/mp1/ws?role=host`);assert.equal((await x.ctl('error')).code,'rate-limited');assert.equal((await x.waitClose()).code,4029);
    assert.equal(r.stats.denied['create-rate'],1);assert.equal(r.rooms.size,10);hs.forEach(h=>h.end());
  }finally{await stop(r);}
});
test('platform restart (SIGTERM path): every room closes with reason server-restart and the CLI exits cleanly',async()=>{
  const r=await relay({});const h=await connect(`ws://127.0.0.1:${r.port}/mp1/ws?role=host`);const {code}=await h.ctl('room');
  const g=await connect(`ws://127.0.0.1:${r.port}/mp1/ws?role=client&code=${code}`);await g.ctl('welcome');
  r.shutdown();assert.equal((await g.ctl('room-closed')).reason,'server-restart');assert.equal((await g.waitClose()).code,4001);assert.equal((await h.ctl('room-closed')).reason,'server-restart');
  await new Promise(res=>r.server.close(()=>res()));
  const p=require('child_process').spawn(process.execPath,[path.join(root,'research/mp1/server/relay.js')],{env:{...process.env,MP1_PORT:'0'}});let out='';p.stdout.on('data',d=>out+=d);
  await new Promise(res=>{const t=setInterval(()=>{if(/relay http/.test(out)){clearInterval(t);res();}},20);});
  p.kill('SIGTERM');const code2=await new Promise(res=>p.on('exit',c=>res(c)));assert.equal(code2,0);assert.match(out,/yalnız yerel/);assert(!/[A-HJ-NP-Z2-9]{8}/.test(out.replace(/STARS MP\.1 relay[^\n]*/,'')));
});
test('smoke tool passes against direct TLS (wss) with a certificate',async()=>{
  const port=await freePort();
  const r2=await relay({MP1_BIND:'0.0.0.0',MP1_PORT:String(port),MP1_TLS_CERT:tls.cert,MP1_TLS_KEY:tls.key,MP1_ORIGINS:'https://localhost:'+port});try{
    const {r:res,lines}=await quiet(()=>smoke.main(['https://localhost:'+port,'--ca',tls.cert]));
    assert.equal(res.ok,true,lines.join('\n'));assert.equal(res.res.length,10);assert.match(lines.at(-1),/SMOKE PASS 10\/10/);
  }finally{await stop(r2);}
});
test('smoke tool passes through a TLS-terminating reverse proxy (MP1_TRUST_PROXY, X-Forwarded-*), including http→https on the relay port',async()=>{
  const r=await relay({MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:'https://localhost:1'});
  const px=await startProxy({target:r.port,cert:tls.cert,key:tls.key});r.cfg.origins.splice(0,1,'https://localhost:'+px.port);
  try{const {r:res,lines}=await quiet(()=>smoke.main(['https://localhost:'+px.port,'--ca',tls.cert]));assert.equal(res.ok,true,lines.join('\n'));
    const direct=await get(r.port,'/',{host:'localhost:'+px.port});assert.equal(direct.status,308,'the relay port itself never serves plain HTTP');
    assert(px.bytes()>0);
  }finally{await px.close();await stop(r);}
});
test('Dockerfile copies a complete, secret-free file set: the relay runs from only those files and passes the smoke test',async()=>{
  const df=fs.readFileSync(path.join(root,'research/mp1/deploy/Dockerfile'),'utf8').replace(/\\\n/g,' ');
  const srcs=[];for(const line of df.split('\n'))if(/^COPY /.test(line)){const parts=line.trim().split(/\s+/).slice(1);parts.pop();srcs.push(...parts);}
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mp11img-'));
  for(const s of srcs){const from=path.join(root,s),to=path.join(dir,s);fs.mkdirSync(path.dirname(to),{recursive:true});fs.cpSync(from,to,{recursive:true});}
  const ign=fs.readFileSync(path.join(root,'.dockerignore'),'utf8').split('\n').filter(l=>l.startsWith('!')).map(l=>l.slice(1).replace(/\/$/,''));
  for(const s of srcs)assert(ign.includes(s.replace(/\/$/,'')),'.dockerignore allows '+s);
  const files=execFileSync('find',[dir,'-type','f']).toString().trim().split('\n').map(f=>path.relative(dir,f));
  assert.equal(files.filter(f=>!f.startsWith('research/')).length,20,'19 runtime + manifest');
  assert(files.every(f=>!/test|releases|\.zip|\.pem|\.env|node_modules/.test(f)),files.join());
  const env={...process.env,MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1'};
  const port=await freePort(),pport=await freePort();
  const p2=require('child_process').spawn(process.execPath,[path.join(dir,'research/mp1/server/relay.js')],{env:{...env,MP1_PORT:String(port),MP1_ORIGINS:'https://localhost:'+pport}});
  let o2='';p2.stdout.on('data',d=>o2+=d);await new Promise(res=>{const t=setInterval(()=>{if(/relay http/.test(o2)){clearInterval(t);res();}},20);});
  const px=await startProxy({target:port,cert:tls.cert,key:tls.key,port:pport});
  try{const {r:res,lines}=await quiet(()=>smoke.main(['https://localhost:'+pport,'--ca',tls.cert]));assert.equal(res.ok,true,lines.join('\n'));
    assert.match(o2,/herkese açık kip: TLS vekilde, izinli köken 1/);}
  finally{p2.kill();await px.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('host in background (Android hidden tab / screen lock): lobby tells guests why the game is paused; MP.0 call without a reason is unchanged',async()=>{
  const {runtime}=require('./helpers/runtime');const h=runtime({root});h.sb.__out=[];h.sb.__rand=n=>crypto.randomBytes(n).toString('hex');
  h.run(fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'));
  h.run(`var MP=StarsMP.createHost({roomId:'r',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true};}}});MP.installGuards();
    MP.configure({size:'orta',aiCount:5,seed:11});MP.onMessage('c1',JSON.stringify({v:1,type:'hello',name:'A'}));MP.onMessage('c1',JSON.stringify({v:1,type:'claim',empire:3}));
    MP.onMessage('c1',JSON.stringify({v:1,type:'ready',value:true}));MP.start();`);
  const last=()=>JSON.parse(h.run(`JSON.stringify(__out.filter(([c,t])=>c==='c1'&&JSON.parse(t).type==='lobby').map(([,t])=>JSON.parse(t)).at(-1))`));
  const rng=h.run('RND_STATE'),save=h.run('serialize()');
  h.run(`MP.setPaused(true,'host-background')`);assert.deepEqual([last().phase,last().pause],['paused','host-background']);
  h.run(`MP.onMessage('c1',JSON.stringify({v:1,type:'cmd',seq:1,cid:'bgcmd0001',cmd:{kind:'build',sys:0,planet:0,key:'santral'}}))`);
  assert.equal(JSON.parse(h.sb.__out.at(-1)[1]).code,'paused','commands wait while the host is in the background');
  h.run(`MP.setPaused(true,'host-offline')`);assert.equal(last().pause,'host-offline');
  h.run('MP.setPaused(false)');assert.deepEqual([last().phase,last().pause],['ingame',null]);
  assert.equal(h.run('RND_STATE'),rng);assert.equal(h.run('serialize()'),save,'pausing never touches Save8 or RNG');
  const m0=runtime({root});m0.sb.__o=[];m0.run(fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'));
  m0.run(`setupGame({...CFG,seed:11});var M=StarsMP.createHost({roomId:'r',random:()=> 'ab'.repeat(16),send:(c,t)=>__o.push(t)});M.setPaused(true)`);
  assert.equal(m0.run('M.state.paused'),true);assert.equal(m0.run('__o.length'),0,'MP.0 (no lobby) sends nothing new');
});
test('no secrets in the deployable sources: no private keys, tokens or real hostnames in research/mp1 and deploy files',async()=>{
  const files=execFileSync('git',['-C',root,'ls-files','research/mp1','research/mp0/server','research/mp0/mp-core.js','.dockerignore']).toString().trim().split('\n')
    .concat(fs.readdirSync(path.join(root,'research/mp1/deploy')).map(f=>'research/mp1/deploy/'+f));
  for(const f of new Set(files)){if(!fs.existsSync(path.join(root,f))||/\.(png|json)$/.test(f))continue;const t=fs.readFileSync(path.join(root,f),'utf8');
    assert(!/BEGIN [A-Z ]*PRIVATE KEY/.test(t),f);assert(!/(ghp_|github_pat_|AKIA[0-9A-Z]{16}|xox[bp]-|sk-[A-Za-z0-9]{20})/.test(t),f);
    assert(!/^\s*MP1_TLS_KEY=-----/m.test(t),f);}
  const env=fs.readFileSync(path.join(root,'research/mp1/deploy/relay.env.example'),'utf8');assert.match(env,/ornek-alan\.tr/,'placeholder domain only');
});

(async()=>{
  for(const [n,f] of tests){try{await f();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+(e&&e.stack||e));}}
  tls.cleanup();console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
})();
