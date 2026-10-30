'use strict';
/* MP.5 — internete açık relay'in güvenlik ve dayanıklılık vakaları (gerçek TCP soketleri, ayrı relay süreci dahil).
   Kanıtlanan ve düzeltilen: (1) tek bozuk HTTP/WebSocket isteği relay sürecini düşürüyordu (3 yol), (2) kapanan bağlantıların
   sayaçları sınırsız birikiyordu, (3) oda kodu tahmini yalnız dakikalık sınırla yavaşlıyordu, (4) istemci çerçevesi 1 MiB'a kadar
   tamponlanıyordu, (5) ağ değiştiren host'un ölü eski bağlantısı yoklama süresi dolana kadar yeniden bağlanmayı engelliyordu.
   Bu test yerel makinededir; gerçek internet testi DEĞİLDİR. */
const fs=require('fs'),path=require('path'),os=require('os'),net=require('net'),tls=require('tls'),http=require('http'),https=require('https'),
  crypto=require('crypto'),assert=require('assert/strict'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..');
const relayMod=require('../research/mp1/server/relay.js'),devRelay=require('../research/mp0/server/dev-relay.js');
let pass=0,fail=0;const tests=[];
const test=(n,f)=>tests.push([n,f]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const logs=[];for(const k of ['log','error','warn','info'])console[k]=((o)=>(...a)=>{logs.push(a.join(' '));o(...a);})(console[k]);
async function relay(env={}){const r=relayMod.create({MP1_PORT:'0',MP1_CREATES_PER_MIN:'1000',...env});const s=await r.start();r.server=s;r.port=s.address().port;return r;}
function stop(r){return new Promise(res=>{for(const x of r.rooms.values())for(const c of [x.host,...x.clients.values()])c?.socket.destroy();r.server.close(()=>res());r.server.closeAllConnections?.();});}
/* Minimal RFC 6455 client: masked text frames out, unmasked frames in. */
function ws(port,query,{origin,host,secure,ca,xff,hdr}={}){
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
      'Sec-WebSocket-Version: 13\r\nSec-WebSocket-Key: '+key+'\r\n'+(origin?'Origin: '+origin+'\r\n':'')+(xff?'X-Forwarded-For: '+xff+'\r\n':'')+(hdr?Object.entries(hdr).map(([k,v])=>k+': '+v+'\r\n').join(''):'')+'\r\n'));
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

/* ham TCP: yanıtı ya da kapanışı bekle */
function rawReq(port,text,ms=800){return new Promise(r=>{let d='';const c=net.connect(port,'127.0.0.1',()=>c.write(text));c.on('data',x=>{d+=x;});c.on('error',()=>{});c.on('close',()=>r(d));setTimeout(()=>{c.destroy();},ms);});}
const health=port=>new Promise(r=>http.get({host:'127.0.0.1',port,path:'/healthz'},x=>{x.resume();r(x.statusCode);}).on('error',()=>r(0)));
const CRASH={
  'bozuk %-kodlama (GET)':'GET /%E0%A4%A HTTP/1.1\r\nHost: x\r\n\r\n',
  'geçersiz URL (GET)':'GET //a:99999/x HTTP/1.1\r\nHost: x\r\n\r\n',
  'geçersiz URL (WebSocket)':'GET //a:99999/mp1/ws?role=client HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n',
  'bozuk %-kodlama (WebSocket)':'GET /mp1/%E0%A4%A?role=client HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n'};

test('çökme: bozuk istekler AYRI relay sürecini düşürmez; açık oda ve bağlı misafir etkilenmez; hata sayılır, ayrıntı günlüğe yazılmaz',async()=>{
  const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
  const env={...process.env};for(const k of Object.keys(env))if(k.startsWith('MP1_'))delete env[k];
  const p=spawn(process.execPath,[path.join(root,'research/mp1/server/relay.js')],{env:{...env,MP1_PORT:String(port),MP1_CREATES_PER_MIN:'100'},stdio:['ignore','pipe','pipe']});
  let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);
  try{for(let i=0;i<50&&!/relay http/.test(out);i++)await sleep(50);
    const h=await ws(port,'role=host');const m=await h.ctl('room');h.send('C'+JSON.stringify({cap:2}));await sleep(50);
    const g=await ws(port,'role=client&code='+m.code);await g.ctl('welcome');
    for(const [n,t] of Object.entries(CRASH)){await rawReq(port,t);await sleep(100);assert.equal(p.exitCode,null,'process alive after: '+n);assert.equal(await health(port),200,n);}
    g.send(JSON.stringify({v:1,type:'ping',t:1}));const f=await h.wait(x=>x[0]==='F');assert(f.includes('"ping"'),'room still relays');
    assert(!out.includes(m.code)&&!out.includes(m.key),'no code/key in output');assert.equal(out.trim().split('\n').length,1,'only the start line: '+out);
  }finally{p.kill();}
});
test('çerçeve sınırı rol başına: misafir 32 KiB üstü çerçeveyi gönderemez (1009, tamponlanmaz); host büyük anlık görüntü gönderebilir',async()=>{
  const r=await relay();try{
    const h=await host(r);await setCap(r,h,2);const g=await client(r,h.code);await g.ctl('welcome');
    g.send('x'.repeat(40000));const c=await g.waitClose();assert.equal(c.code,1009);
    const g2=await client(r,h.code);const cid=(await g2.ctl('welcome')).conn;
    const big='{"v":1,"type":"snapshot","pad":"'+'y'.repeat(200000)+'"}';h.send('T'+cid+'\n'+big);
    const got=await g2.wait(x=>x[0]==='H'&&x.length>200000);assert.equal(got.length,big.length+1);
  }finally{await stop(r);}
});
test('tahmin sınırı: bir IP 10 dakikada 60 yanlış kod/anahtar denemesinden sonra el sıkışmada 429; doğru kod da o IP için kapanır; vekil arkasında başka telefon etkilenmez; kapanmış gerçek oda kodu tahmin sayılmaz',async()=>{
  const r=await relay({MP1_TRUST_PROXY:'1'});const jr=relayMod.LIMITS.joinPerMin;relayMod.LIMITS.joinPerMin=1e6;   // dakikalık katılım sınırı ayrı testte (mp1_relay_test); burada yalnız tahmin sınırı
  try{
    const h=await host(r);await setCap(r,h,3);
    const closed=await host(r);const cc=closed.code;closed.send('X');await closed.waitClose();
    const ip='198.51.100.20';
    for(let i=0;i<5;i++){const c=await ws(r.port,'role=client&code='+cc,{xff:ip});assert.equal((await c.ctl('error')).code,'room-closed');c.end();}
    for(let i=0;i<relayMod.LIMITS.badPer10Min-1;i++){const c=await ws(r.port,'role=client&code=ZZZZ'+String(i).padStart(4,'2'),{xff:ip});assert.equal(c.status,101);assert.equal((await c.ctl('error')).code,'invalid-code');c.end();}
    const k=await ws(r.port,'role=host&code='+h.code,{xff:ip});k.send('A'+'0'.repeat(32));assert.equal((await k.ctl('error')).code,'bad-host-key');k.end();   // yanlış host anahtarı da tahmindir
    assert.equal((await ws(r.port,'role=client&code=ZZZZ9999',{xff:ip})).status,429);
    assert.equal((await ws(r.port,'role=client&code='+h.code,{xff:ip})).status,429,'the guessing IP is blocked even with a real code');
    const ok=await ws(r.port,'role=client&code='+h.code,{xff:ip+', 203.0.113.50'});assert.equal(ok.status,101);await ok.ctl('welcome');
    assert(r.stats.denied['guess-limit']>=2);
  }finally{relayMod.LIMITS.joinPerMin=jr;await stop(r);}
});
test('MP1_IP_HEADER: CDN önlü platformda istemci IP\'si ayrı başlıktan okunur (aynı kenar IP\'sindeki farklı telefonlar birbirini engellemez); güvenilen vekil yokken başlık yok sayılır',async()=>{
  const edge='203.0.113.77',n=relayMod.LIMITS.perIpConns;
  const r=await relay({MP1_TRUST_PROXY:'1',MP1_IP_HEADER:'CF-Connecting-IP'});try{
    const open=[];for(let i=0;i<n;i++)open.push(await ws(r.port,'role=host',{xff:edge,hdr:{'CF-Connecting-IP':'198.51.100.1'}}));
    assert.equal((await ws(r.port,'role=host',{xff:edge,hdr:{'CF-Connecting-IP':'198.51.100.1'}})).status,429,'same phone limited');
    assert.equal((await ws(r.port,'role=host',{xff:edge,hdr:{'CF-Connecting-IP':'198.51.100.2'}})).status,101,'another phone behind the same edge passes');
    for(const c of open)c.end();
  }finally{await stop(r);}
  const q=await relay({MP1_IP_HEADER:'cf-connecting-ip'});try{
    const open=[];for(let i=0;i<n;i++)open.push(await ws(q.port,'role=host',{hdr:{'CF-Connecting-IP':'10.0.0.'+i}}));
    assert.equal((await ws(q.port,'role=host',{hdr:{'CF-Connecting-IP':'10.9.9.9'}})).status,429,'header ignored without a trusted proxy (spoofable)');
    for(const c of open)c.end();
  }finally{await stop(q);}
});
test('kaba kuvvet hesabı: 31^8 kod uzayı, IP başı 60 deneme / 10 dk → 200 oda açıkken bir IP\'nin günlük isabet olasılığı < 1e-5',()=>{
  const space=relayMod.ALPHABET.length**relayMod.CODE_LEN,perDay=relayMod.LIMITS.badPer10Min*6*24,p=1-Math.pow(1-200/space,perDay);
  assert.equal(relayMod.ALPHABET.length,31);assert.equal(relayMod.CODE_LEN,8);assert(p<1e-5,String(p));
  console.log('   kod uzayı '+space.toExponential(2)+'; IP başı günde en çok '+perDay+' deneme; 200 açık odada günlük isabet olasılığı '+p.toExponential(2));
});
test('toplam bağlantı sınırı (MP1_MAX_CONNS): dolunca yeni el sıkışma 503; bağlantı kapanınca yer açılır',async()=>{
  const r=await relay({MP1_MAX_CONNS:'3'});try{
    const a=await host(r),b=await host(r),c=await host(r);assert.equal((await ws(r.port,'role=host')).status,503);
    a.end();for(let i=0;i<100&&r.stats.conns>2;i++)await sleep(10);const d=await host(r);assert(d.code);void b;void c;
  }finally{await stop(r);}
});
test('bellek: kapanan bağlantıların sayaçları silinir (uzun süre açık relay\'de birikmez); kapanmış kod belleği sınırlı',async()=>{
  const r=await relay();try{
    const before=Object.keys(devRelay.stats.byConn).length;
    const h=await host(r);await setCap(r,h,7);
    for(let i=0;i<25;i++){const g=await client(r,h.code);await g.ctl('welcome');g.send(JSON.stringify({v:1,type:'ping',t:i}));await sleep(2);g.end();}
    for(let i=0;i<100&&r.rooms.get(h.code).clients.size;i++)await sleep(10);await sleep(50);
    assert(Object.keys(devRelay.stats.byConn).length<=before+1,'only the live host remains: '+(Object.keys(devRelay.stats.byConn).length-before));
    const m=relayMod.LIMITS.maxTomb;assert(m>=10000&&m<=1e6);
  }finally{await stop(r);}
});
test('host ağ değişimi: sessiz kalan (ölü) eski host bağlantısının yerine doğru anahtarlı yeni bağlantı geçer; canlı host\'un yerine geçilemez (host-exists); yanlış anahtar hiçbir zaman geçemez',async()=>{
  const r=await relay({MP1_PING_MS:'400'});try{
    const h=await host(r);await setCap(r,h,2);const g=await client(r,h.code);await g.ctl('welcome');
    // canlı host: yoklamaya yanıt veren gerçek bağlantı gibi davranmak için düzenli veri gönderir
    const keep=setInterval(()=>h.send('C'+JSON.stringify({cap:2})),100);
    await sleep(1200);const dup=await reattach(r,h.code,'A'+h.key);assert.equal((await dup.ctl('error')).code,'host-exists');clearInterval(keep);
    // ölü host: hiç veri göndermez (ağ değişti, FIN gelmedi). Yoklama aralığı + 5 s sınırı testte kısaltılamaz; yoklama zaman aşımı (2,5×) daha önce düşürmesin diye bekleme kısa tutulur
    const r2=await relay({MP1_PING_MS:'60000'});try{
      const h2=await host(r2);await setCap(r2,h2,2);const g2=await client(r2,h2.code);await g2.ctl('welcome');
      r2.rooms.get(h2.code).host.lastIn=Date.now()-70000;   // son veri 70 s önce (yoklama 60 s + 5 s sınırını aşar)
      const bad=await reattach(r2,h2.code,'A'+'x'.repeat(32));assert.equal((await bad.ctl('error')).code,'bad-host-key');
      assert.equal(r2.rooms.get(h2.code).host.id!==undefined,true,'wrong key never replaces');
      const nh=await reattach(r2,h2.code,'A'+h2.key);const m=await nh.ctl('room');assert.equal(m.reattached,true);
      assert.equal((await h2.waitClose()).code,4009,'old dead host closed with replaced');
      g2.send(JSON.stringify({v:1,type:'ping',t:5}));assert((await nh.wait(x=>x[0]==='F')).includes('"ping"'),'guest traffic reaches the new host');
      assert.equal(r2.stats.denied['host-replaced'],1);
    }finally{await stop(r2);}
  }finally{await stop(r);}
});
test('misafir ağ değişimi: oda doluyken sessiz kalmış (ölü) eski misafir soketi çıkarılır ve yeniden bağlanan telefon girer; canlı misafir asla çıkarılmaz',async()=>{
  const r=await relay();try{
    const h=await host(r);await setCap(r,h,2);const a=await client(r,h.code);await a.ctl('welcome');const b=await client(r,h.code);await b.ctl('welcome');
    const c=await client(r,h.code);assert.equal((await c.ctl('error')).code,'room-full','both live → full');
    const room=r.rooms.get(h.code),ida=[...room.clients.keys()][0];room.clients.get(ida).lastIn=Date.now()-r.cfg.ping-6000;   // a'dan bir yoklama aralığından uzun süredir veri yok
    const d=await client(r,h.code);const w=await d.ctl('welcome');assert.equal((await a.waitClose()).code,4009,'stale socket closed');
    assert(!room.clients.has(ida)&&room.clients.has(w.conn)&&room.clients.size===2);assert((await h.wait(x=>x==='L'+ida)),'host told the old socket left');
    assert.equal(r.stats.denied['client-stale'],1);
    /* varsayılan 25 s yoklamada, host bağlıyken misafir eşiği 12 s (sayfa 3 s'de bir ping atar): 11 s sessiz → çıkarılmaz, 13 s → çıkarılır */
    const idb=[...room.clients.keys()].find(k=>k!==w.conn);room.clients.get(idb).lastIn=Date.now()-11000;room.clients.get(w.conn).lastIn=Date.now();
    const e=await client(r,h.code);assert.equal((await e.ctl('error')).code,'room-full','11 s silence is not stale');
    room.clients.get(idb).lastIn=Date.now()-13000;const f=await client(r,h.code);await f.ctl('welcome');assert.equal((await b.waitClose()).code,4009);
  }finally{await stop(r);}
});
test('sızıntı: relay günlüğe hiçbir şey yazmaz; oda kodu yalnız davet URL\'sinde, host anahtarı ve oyuncu jetonu hiçbir URL\'de yok (ilk çerçeve / H içerikleri)',async()=>{
  const join=fs.readFileSync(path.join(root,'research/mp1/client/join.js'),'utf8'),hostjs=fs.readFileSync(path.join(root,'research/mp1/client/mp1-host.js'),'utf8');
  const urls=src=>[...src.matchAll(/new WebSocket\(([^;]*)\)/g),...src.matchAll(/wsUrl\(([^)]*)\)/g)].map(m=>m[1]);
  for(const u of urls(join))assert(!/token|key|name/i.test(u),'guest ws URL: '+u);assert.match(join,/\/mp1\/ws\?role=client&code='\+code\);/);
  for(const u of urls(hostjs))assert(!/API\.key|token/.test(u),'host ws URL: '+u);
  assert.match(hostjs,/ws\.onopen=\(\)=>ws\.send\('A'\+API\.key\)/);
});

(async()=>{
  const leaked=[];
  for(const [n,f] of tests){const mark=logs.length;let err=null;try{await f();}catch(e){err=e;}
    const L=logs.splice(mark).filter(l=>!l.startsWith('   '));leaked.push(...L);
    if(err){fail++;console.log('✗ '+n+' — '+err.stack);}else{pass++;console.log('✓ '+n);}}
  logs.length=0;
  if(leaked.length){fail++;console.log('✗ relay printed during the cases: '+leaked.length+' lines');}else{pass++;console.log('✓ relay logs nothing while serving all of the above');}
  console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
})();
