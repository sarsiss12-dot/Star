'use strict';
/* MP.1 relay: real TCP/TLS sockets against research/mp1/server/relay.js.
   Room codes, host key, room-full/closed/TTL/grace, kick, size/rate limits,
   Origin check, per-IP caps, static allowlist, no secret logging, TLS mode.
   The relay is a not-deployed prototype; this only proves its local behaviour. */
const fs=require('fs'),path=require('path'),os=require('os'),net=require('net'),tls=require('tls'),http=require('http'),https=require('https'),
  crypto=require('crypto'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const relayMod=require('../research/mp1/server/relay.js');
let pass=0,fail=0;const tests=[];
const test=(n,f)=>tests.push([n,f]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const logs=[];for(const k of ['log','error','warn','info'])console[k]=((o)=>(...a)=>{logs.push(a.join(' '));o(...a);})(console[k]);

/* Bu dosyadaki vakalar başka sınırları ölçüyor ve tek IP'den çok oda açıyor; oda açma hızı (MP.1.1) kendi testinde (mp11_online_test.js) varsayılanla ölçülür. */
async function relay(env={}){const r=relayMod.create({MP1_PORT:'0',MP1_CREATES_PER_MIN:'1000',...env});const s=await r.start();r.server=s;r.port=s.address().port;return r;}
function stop(r){return new Promise(res=>{for(const x of r.rooms.values())for(const c of [x.host,...x.clients.values()])c?.socket.destroy();r.server.close(()=>res());r.server.closeAllConnections?.();});}

/* Minimal RFC 6455 client: masked text frames out, unmasked frames in. */
function ws(port,query,{origin,host,secure,ca,xff}={}){
  return new Promise((resolve,reject)=>{
    const sock=secure?tls.connect({port,host:'127.0.0.1',ca,servername:'localhost'}):net.connect(port,'127.0.0.1');
    const key=crypto.randomBytes(16).toString('base64');
    const c={msgs:[],closed:null,status:null,waiters:[],sock,
      send(text){const b=Buffer.from(text,'utf8'),m=crypto.randomBytes(4);let h;
        if(b.length<126)h=Buffer.from([0x81,0x80|b.length]);else if(b.length<65536){h=Buffer.alloc(4);h[0]=0x81;h[1]=0x80|126;h.writeUInt16BE(b.length,2);}
        else{h=Buffer.alloc(10);h[0]=0x81;h[1]=0x80|127;h.writeBigUInt64BE(BigInt(b.length),2);}
        const d=Buffer.from(b);for(let i=0;i<d.length;i++)d[i]^=m[i&3];sock.write(Buffer.concat([h,m,d]));},
      json(obj){this.send(JSON.stringify(obj));},
      end(){sock.destroy();},
      async wait(pred,ms=2000){const t0=Date.now();for(;;){const i=c.msgs.findIndex(pred);if(i>=0)return c.msgs.splice(i,1)[0];
        if(Date.now()-t0>ms)throw Error('timeout waiting; got '+JSON.stringify(c.msgs.slice(-5))+' closed '+JSON.stringify(c.closed));await sleep(5);}},
      async waitClose(ms=2000){const t0=Date.now();while(!c.closed){if(Date.now()-t0>ms)throw Error('no close');await sleep(5);}return c.closed;},
      ctl(t,ms){return c.wait(m=>m[0]==='R'&&JSON.parse(m.slice(1)).t===t,ms).then(m=>JSON.parse(m.slice(1)));}};
    let buf=Buffer.alloc(0),up=false;
    sock.on(secure?'secureConnect':'connect',()=>sock.write('GET /mp1/ws?'+query+' HTTP/1.1\r\nHost: '+(host||'127.0.0.1:'+port)+'\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n'+
      'Sec-WebSocket-Version: 13\r\nSec-WebSocket-Key: '+key+'\r\n'+(origin?'Origin: '+origin+'\r\n':'')+(xff?'X-Forwarded-For: '+xff+'\r\n':'')+'\r\n'));
    sock.on('data',ch=>{buf=Buffer.concat([buf,ch]);
      if(!up){const i=buf.indexOf('\r\n\r\n');if(i<0)return;const head=buf.slice(0,i).toString();buf=buf.slice(i+4);c.status=+head.split(' ')[1];
        if(c.status!==101){resolve(c);return;}
        assert.equal(head.match(/Sec-WebSocket-Accept: (.*)/)[1],crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64'));
        up=true;resolve(c);}
      while(buf.length>=2){const op=buf[0]&15;let len=buf[1]&127,off=2;
        if(len===126){if(buf.length<4)return;len=buf.readUInt16BE(2);off=4;}else if(len===127){if(buf.length<10)return;len=Number(buf.readBigUInt64BE(2));off=10;}
        if(buf.length<off+len)return;const d=buf.slice(off,off+len);buf=buf.slice(off+len);
        if(op===1)c.msgs.push(d.toString('utf8'));else if(op===8)c.closed={code:d.length>=2?d.readUInt16BE(0):0,reason:d.slice(2).toString()};}});
    sock.on('close',()=>{if(!c.closed)c.closed={code:1006,reason:''};});
    sock.on('error',e=>{if(!up&&c.status==null)reject(e);});
  });
}
async function reattach(r,code,frame){const h=await ws(r.port,'role=host&code='+code);if(frame!==undefined)h.send(frame);return h;}
async function host(r,q=''){const h=await ws(r.port,'role=host'+q);const m=await h.ctl('room');return Object.assign(h,{code:m.code,key:m.key,cap:m.cap});}
async function setCap(r,h,n){h.send('C'+JSON.stringify({cap:n}));const t0=Date.now();while(r.rooms.get(h.code).cap!==n){if(Date.now()-t0>2000)throw Error('cap not applied');await sleep(2);}}
async function client(r,code){const c=await ws(r.port,'role=client&code='+encodeURIComponent(code));return c;}
function get(port,p,{method='GET',secure,ca}={}){return new Promise((res,rej)=>{const req=(secure?https:http).request({host:'127.0.0.1',port,path:p,method,ca,servername:'localhost'},x=>{const b=[];x.on('data',d=>b.push(d));x.on('end',()=>res({status:x.statusCode,headers:x.headers,body:Buffer.concat(b)}));});req.on('error',rej);req.end();});}

test('static: injected game page, exact runtime bytes, join page CSP, allowlist only, security headers, 405, stats hidden unless dev',async()=>{
  const r=await relay();try{
    const idx=await get(r.port,'/');assert.equal(idx.status,200);const html=idx.body.toString();
    const orig=fs.readFileSync(path.join(root,'index.html'),'utf8');
    assert.equal(html,orig.replace('</body>','<link rel="stylesheet" href="/research/mp1/client/mp1.css"><link rel="stylesheet" href="/research/mp3/client/mp3.css"><script src="/research/mp0/mp-core.js"></script><script src="/research/mp1/client/view.js"></script><script src="/research/mp3/client/dip-ui.js"></script><script src="/research/mp1/client/mp1-host.js"></script></body>'));   // MP.3: diplomasi paneli
    assert.equal((await get(r.port,'/index.html')).body.toString(),html);
    const man=JSON.parse(fs.readFileSync(path.join(root,'RELEASE-MANIFEST.json'),'utf8'));
    for(const f of Object.keys(man.files).filter(f=>f!=='index.html')){const x=await get(r.port,'/'+f);assert.equal(x.status,200,f);
      assert.equal(crypto.createHash('sha256').update(x.body).digest('hex'),man.files[f].sha256??man.files[f],f);}
    const j=await get(r.port,'/mp/join?code=ABCD-EFGH');assert.equal(j.status,200);assert.match(j.headers['content-security-policy'],/script-src 'self'/);
    assert.equal(j.headers['x-content-type-options'],'nosniff');assert.equal(j.headers['x-frame-options'],'DENY');assert.equal(j.headers['referrer-policy'],'no-referrer');
    for(const p of ['/research/mp1/server/relay.js','/research/mp0/server/dev-relay.js','/package.json','/tests/run-all.js','/.git/config','/%2e%2e/etc/passwd','/../etc/passwd',
      '/RELEASE-MANIFEST.json','/research/mp1/client/join.html','/mp/stats','/mp/host','/research/mp0/mp-host.js'])assert.equal((await get(r.port,p)).status,404,p);
    for(const p of ['/research/mp0/mp-core.js','/research/mp1/client/mp1-host.js','/research/mp1/client/join.js','/research/mp1/client/view.js','/research/mp1/client/mp1.css','/research/mp3/client/dip-ui.js','/research/mp3/client/mp3.css'])
      assert.equal((await get(r.port,p)).status,200,p);
    assert.equal((await get(r.port,'/',{method:'POST'})).status,405);
  }finally{await stop(r);}
  const d=await relay({MP1_DEV:'1'});try{const s=await get(d.port,'/mp/stats');assert.equal(s.status,200);const j=JSON.parse(s.body);assert.equal(j.rooms,0);
    assert.ok(!('codes' in j)&&!JSON.stringify(j).match(/key/i));}finally{await stop(d);}
});
test('room codes: 8 symbols from the 31-letter unambiguous alphabet, unique; host key is 192-bit base64url and never sent to guests',async()=>{
  const r=await relay();try{
    const codes=new Set();for(let i=0;i<40;i++){const h=await host(r);assert.match(h.code,/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);assert.match(h.key,/^[A-Za-z0-9_-]{32}$/);
      assert.equal(Buffer.from(h.key,'base64url').length,24);codes.add(h.code);h.send('X');await h.waitClose();}
    assert.equal(codes.size,40);assert.equal(relayMod.ALPHABET.length,31);assert.ok(Math.log2(31**8)>39);
    const h=await host(r);await setCap(r,h,3);const c=await client(r,h.code);const w=await c.ctl('welcome');
    assert.equal(w.host,true);assert.ok(!c.msgs.join().includes(h.key));
    const j=await h.wait(m=>m[0]==='J');assert.equal(j.slice(1),w.conn);
    c.send('{"v":1,"type":"hello"}');assert.equal(await h.wait(m=>m[0]==='F'),'F'+w.conn+'\n{"v":1,"type":"hello"}');
    c.send('T'+w.conn+'\nforged');assert.equal(await h.wait(m=>m[0]==='F'),'F'+w.conn+'\nT'+w.conn+'\nforged','a guest can only talk to the host; its text is forwarded as data');
    h.send('T'+w.conn+'\n{"x":1}');assert.equal(await c.wait(m=>m[0]==='H'),'H{"x":1}');
    h.send('Tnobody\nlost');await sleep(30);assert.equal(c.msgs.length,0);
  }finally{await stop(r);}
});
test('join: invalid code, normalised typing (lowercase, dash, spaces), room-full by host capacity, capacity frame bounds',async()=>{
  const r=await relay();try{
    const bad=await client(r,'ZZZZZZZZ');assert.equal((await bad.ctl('error')).code,'invalid-code');assert.equal((await bad.waitClose()).code,4004);
    const h=await host(r);assert.equal(h.cap,1);
    const typed=h.code.toLowerCase().slice(0,4)+'- '+h.code.toLowerCase().slice(4);
    const a=await client(r,typed);await a.ctl('welcome');
    const b=await client(r,h.code);assert.equal((await b.ctl('error')).code,'room-full');assert.equal((await b.waitClose()).code,4005);
    for(const cap of [0,8,99,-1,1.5,'3'])h.send('C'+JSON.stringify({cap}));h.send('Cnot json');await sleep(20);
    assert.equal(r.rooms.get(h.code).cap,1,'out-of-range capacity frames are ignored');
    await setCap(r,h,2);const b2=await client(r,h.code);await b2.ctl('welcome');
    const b3=await client(r,h.code);assert.equal((await b3.ctl('error')).code,'room-full');
  }finally{await stop(r);}
});
test('host identity: the code alone never grants host; wrong key, missing key, key in URL, second host refused; right key in the first frame reattaches',async()=>{
  const r=await relay({MP1_AUTH_MS:'300'});try{
    const h=await host(r);await setCap(r,h,2);const c=await client(r,h.code);const w=await c.ctl('welcome');
    for(const f of [undefined,'A','A'+h.key.slice(0,-1)+(h.key.endsWith('A')?'B':'A'),h.key,'{"v":1}','A'+h.key+'x'.repeat(600)]){
      const x=await reattach(r,h.code,f);assert.equal((await x.ctl('error',1500)).code,'bad-host-key',String(f).slice(0,12));assert.equal((await x.waitClose()).code,4003);}
    const q=await ws(r.port,'role=host&code='+h.code+'&key='+h.key);assert.equal((await q.ctl('error',1500)).code,'bad-host-key','a key in the URL is ignored (never accepted from the query string)');
    const dup=await reattach(r,h.code,'A'+h.key);assert.equal((await dup.ctl('error')).code,'host-exists');
    const unk=await reattach(r,'ZZZZZZZZ','A'+h.key);assert.equal((await unk.ctl('error')).code,'invalid-code');
    h.end();await c.ctl('host-left');
    c.send('{"v":1,"type":"ping"}');assert.equal((await c.ctl('error')).code,'no-host');
    const h2=await reattach(r,h.code,'A'+h.key);const m=await h2.ctl('room');
    assert.equal(m.reattached,true);assert.equal(m.code,h.code);assert.equal(m.key,undefined,'key is not re-sent');assert.equal(m.cap,2);
    assert.equal(await h2.wait(x=>x[0]==='J'),'J'+w.conn);await c.ctl('host-up');
  }finally{await stop(r);}
});
test('closing: host X closes the room for everyone; old code then answers room-closed (not invalid) for guests and host key',async()=>{
  const r=await relay();try{
    const h=await host(r);await setCap(r,h,3);const a=await client(r,h.code),b=await client(r,h.code);await a.ctl('welcome');await b.ctl('welcome');
    h.send('X');for(const x of [a,b,h]){assert.equal((await x.ctl('room-closed')).reason,'host');assert.equal((await x.waitClose()).code,4001);}
    assert.equal(r.rooms.size,0);
    const late=await client(r,h.code);assert.equal((await late.ctl('error')).code,'room-closed');assert.equal((await late.waitClose()).code,4004);
    const lh=await reattach(r,h.code,'A'+h.key);assert.equal((await lh.ctl('error')).code,'room-closed');
  }finally{await stop(r);}
});
test('lifetime: host grace expiry closes an orphaned room (host-timeout); room TTL closes a live room (ttl); reattach inside grace keeps it',async()=>{
  const r=await relay({MP1_HOST_GRACE_MS:'250',MP1_ROOM_TTL_MS:'900'});try{
    const h=await host(r);const c=await client(r,h.code);await c.ctl('welcome');h.end();await c.ctl('host-left');
    assert.equal((await c.ctl('room-closed',1500)).reason,'host-timeout');
    const k=await host(r);const g=await client(r,k.code);await g.ctl('welcome');k.end();await g.ctl('host-left');await sleep(100);
    const k2=await reattach(r,k.code,'A'+k.key);await k2.ctl('room');await sleep(300);assert.equal(r.rooms.has(k.code),true,'reattach cancelled the grace timer');
    assert.equal((await g.ctl('room-closed',1500)).reason,'ttl');
  }finally{await stop(r);}
});
test('liveness: a half-open phone connection (no data, no FIN) is dropped by ping timeout; a TCP half-close is noticed at once',async()=>{
  const r=await relay({MP1_PING_MS:'100'});try{
    const h=await host(r);h.send('C{"cap":2}');const keep=setInterval(()=>h.send('C{"cap":2}'),60);
    const silent=await client(r,h.code);const w=await silent.ctl('welcome');
    const t0=Date.now();assert.equal(await h.wait(m=>m==='L'+w.conn,2000),'L'+w.conn);assert.ok(Date.now()-t0>=200,'not before 2.5 ping periods');
    assert.equal(r.stats.denied.timeout,1);assert.ok(r.rooms.get(h.code).host,'host that keeps sending stays connected');
    const g=await client(r,h.code);await g.ctl('welcome');clearInterval(keep);h.sock.end();assert.equal((await g.ctl('host-left',300)).t,'host-left');
  }finally{await stop(r);}
});
test('kick: host K disconnects only the named guest (4003) with a bounded reason',async()=>{
  const r=await relay();try{
    const h=await host(r);await setCap(r,h,2);const a=await client(r,h.code),b=await client(r,h.code);const wa=await a.ctl('welcome');await b.ctl('welcome');
    h.send('K'+wa.conn+'\n'+'x'.repeat(200)+'<b>');const k=await a.ctl('kicked');assert.equal(k.reason,'x'.repeat(40));assert.deepEqual(await a.waitClose(),{code:4003,reason:'x'.repeat(40)},'reason is also in the close frame (survives a lost control frame)');
    assert.equal(await h.wait(m=>m==='L'+wa.conn),'L'+wa.conn);await sleep(20);assert.equal(b.closed,null);
  }finally{await stop(r);}
});
test('limits: oversized guest/host frames refused and not forwarded; message flood dropped then closed (4008); unmasked frame closed',async()=>{
  const r=await relay();try{
    const h=await host(r);await setCap(r,h,3);const c=await client(r,h.code);const w=await c.ctl('welcome');h.msgs.length=0;
    c.send('x'.repeat(relayMod.LIMITS.clientMsg+1));assert.equal((await c.ctl('error')).code,'too-big');await sleep(30);assert.equal(h.msgs.filter(m=>m[0]==='F').length,0);
    h.send('T'+w.conn+'\n'+'y'.repeat(relayMod.LIMITS.hostMsg));assert.equal((await h.ctl('error')).code,'too-big');
    const f=await client(r,h.code);const wf=await f.ctl('welcome');h.msgs.length=0;
    for(let i=0;i<300;i++)f.send('{"n":'+i+'}');
    assert.equal((await f.waitClose(3000)).code,4008);await sleep(50);
    const fwd=h.msgs.filter(m=>m.startsWith('F'+wf.conn)).length;assert.ok(fwd>=relayMod.LIMITS.clientBurst-1&&fwd<=relayMod.LIMITS.clientBurst+5,'forwarded '+fwd);
    assert.ok(r.stats.dropped>100&&r.stats.closedByLimit===1);
    const u=await client(r,h.code);await u.ctl('welcome');u.sock.write(Buffer.from([0x81,2,0x68,0x69]));assert.equal((await u.waitClose()).code,1002);
  }finally{await stop(r);}
});
test('origin and request checks: foreign Origin 403, same-host Origin ok, MP1_ORIGINS allowlist, bad path/role 400, per-IP connection cap 429',async()=>{
  const r=await relay();try{
    assert.equal((await ws(r.port,'role=host',{origin:'https://evil.example'})).status,403);
    assert.equal((await ws(r.port,'role=host',{origin:'http://127.0.0.1:'+r.port})).status,101);
    assert.equal((await ws(r.port,'role=admin')).status,400);
    const bad=await new Promise(res=>{const s=net.connect(r.port,'127.0.0.1',()=>s.write('GET /mp/ws?role=host HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: a\r\n\r\n'));
      s.on('data',d=>{res(d.toString().split(' ')[1]);s.destroy();});});assert.equal(bad,'400');
    const open=[];for(let i=0;i<relayMod.LIMITS.perIpConns-1;i++)open.push(await ws(r.port,'role=host'));
    assert.equal((await ws(r.port,'role=host')).status,429);open.forEach(x=>x.end());
  }finally{await stop(r);}
  const a=await relay({MP1_ORIGINS:'https://stars.example, https://b.example'});try{
    assert.equal((await ws(a.port,'role=host',{origin:'https://b.example'})).status,101);
    assert.equal((await ws(a.port,'role=host',{origin:'http://127.0.0.1:'+a.port})).status,403,'with an allowlist, same-host is not implied');
  }finally{await stop(a);}
});
test('abuse: join guessing rate-limited per IP (30/min), room cap → server-full',async()=>{
  const r=await relay({MP1_MAX_ROOMS:'2'});try{
    for(let i=0;i<relayMod.LIMITS.joinPerMin;i++){const c=await client(r,'GUESS'+i);assert.equal((await c.ctl('error')).code,'invalid-code');await c.waitClose();}
    const c=await client(r,'GUESSXX');assert.equal((await c.ctl('error')).code,'rate-limited');
    assert.equal(r.stats.denied['join-rate'],1);
    await host(r);await host(r);const x=await ws(r.port,'role=host');assert.equal((await x.ctl('error')).code,'server-full');
  }finally{await stop(r);}
});
test('behind a trusted proxy (MP1_TRUST_PROXY=1) per-IP limits use the last X-Forwarded-For hop; without it the header is ignored',async()=>{
  const p=await relay({MP1_TRUST_PROXY:'1'});try{
    const open=[];for(let i=0;i<relayMod.LIMITS.perIpConns;i++)open.push(await ws(p.port,'role=host',{xff:'198.51.100.7'}));
    assert.equal((await ws(p.port,'role=host',{xff:'198.51.100.7'})).status,429);
    assert.equal((await ws(p.port,'role=host',{xff:'198.51.100.7, 203.0.113.9'})).status,101,'a different phone behind the same proxy is not blocked');
    assert.equal((await ws(p.port,'role=host',{xff:'203.0.113.9, 198.51.100.7'})).status,429,'a spoofed first hop does not escape the limit');open.forEach(x=>x.end());
  }finally{await stop(p);}
  const d=await relay();try{const open=[];for(let i=0;i<relayMod.LIMITS.perIpConns;i++)open.push(await ws(d.port,'role=host',{xff:'10.0.0.'+i}));
    assert.equal((await ws(d.port,'role=host',{xff:'10.9.9.9'})).status,429,'header ignored unless the proxy is trusted');open.forEach(x=>x.end());}finally{await stop(d);}
});
test('TLS mode: HTTPS page and WSS room with a certificate (self-signed, test-only); plain HTTP refused on the TLS port',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mp1tls-')),cert=path.join(dir,'c.pem'),key=path.join(dir,'k.pem');
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'],{stdio:'ignore'});
  const ca=fs.readFileSync(cert);const r=await relay({MP1_TLS_CERT:cert,MP1_TLS_KEY:key});try{
    assert.ok(r.server instanceof https.Server);
    const p=await get(r.port,'/',{secure:true,ca});assert.equal(p.status,200);assert.match(p.body.toString(),/mp1-host\.js/);
    const h=await ws(r.port,'role=host',{secure:true,ca});const m=await h.ctl('room');assert.match(m.code,/^[A-Z2-9]{8}$/);
    const c=await ws(r.port,'role=client&code='+m.code,{secure:true,ca});await c.ctl('welcome');
    c.send('{"v":1}');assert.match(await h.wait(x=>x[0]==='F'),/\{"v":1\}$/);
    await assert.rejects(get(r.port,'/'));
  }finally{await stop(r);fs.rmSync(dir,{recursive:true,force:true});}
});

(async()=>{
  const leaked=[];
  for(const [n,f] of tests){const mark=logs.length;let err=null;try{await f();}catch(e){err=e;}
    leaked.push(...logs.splice(mark));            // anything printed while a case ran came from the relay
    if(err){fail++;console.log('✗ '+n+' — '+err.stack);}else{pass++;console.log('✓ '+n);}}
  logs.length=0;
  if(leaked.length){fail++;console.log('✗ relay printed during the cases: '+leaked.length+' lines');}
  else{pass++;console.log('✓ relay logs nothing (no room codes, host keys or tokens) while serving all of the above');}
  console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
})();
