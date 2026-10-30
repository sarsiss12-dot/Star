'use strict';
/* ═══ STARS MP.1 — oda relay'i (internete açılabilecek biçimde sertleştirilmiş taslak) ═══
   Telefon A oda açar → güvenli oda kodu + yalnız host'a verilen host anahtarı.
   Telefon B kodla katılır. Relay oyun durumunu görmez/yorumlamaz; yalnız odaya
   göre yönlendirir, gönderici kimliğini damgalar ve sınırları uygular.

   DAĞITIM DURUMU: bu dosya hiçbir sunucuya yüklenmedi. TLS ya önündeki bir
   ters vekil/platform (HTTPS→WSS) ya da MP1_TLS_CERT/MP1_TLS_KEY ile sağlanmalı.
   TLS olmadan internete açılmamalıdır.

   ÜRETİM KİPİ (MP.1.1): MP1_BIND döngü (loopback) dışındaysa relay ancak şu koşullarla açılır:
   TLS (MP1_TLS_CERT/KEY) ya da güvenilen TLS vekili (MP1_TRUST_PROXY=1), https:// kökenli
   MP1_ORIGINS ve kapalı MP1_DEV. Aksi halde başlamayı reddeder. Bu kipte TLS'siz istek
   (vekilin X-Forwarded-Proto'su https değilse) GET için https'e 308 ile yönlendirilir,
   WebSocket için 403 alır; yanıtlara HSTS eklenir. /healthz her zaman açıktır (gövde: {"ok":true}).

   Ortam: MP1_PORT (yoksa PORT), MP1_BIND (vars. 127.0.0.1), MP1_ORIGINS (virgüllü izinli Origin
   listesi; boşsa yalnız Host ile aynı köken ya da Origin'siz yerel araç),
   MP1_DEV=1 (/mp/stats açık), MP1_TLS_CERT/MP1_TLS_KEY, MP1_ROOM_TTL_MS,
   MP1_HOST_GRACE_MS, MP1_MAX_ROOMS, MP1_AUTH_MS (host anahtar çerçevesi süresi), MP1_TRUST_PROXY=1 (yalnız güvenilen
   TLS vekilinin arkasında: istemci IP'si X-Forwarded-For'un son girdisinden), MP1_PING_MS (canlılık yoklaması), MP1_CREATES_PER_MIN (IP başı oda açma, vars. 10), MP_DELAY_MS (test gecikmesi).

   Uç noktalar
     GET /, /index.html  → oyun sayfası + MP.1 katmanı (runtime dosyaları değişmez)
     GET /mp/join        → motor yüklemeyen katılım sayfası
     GET izinli statik    → 19 runtime dosyası ve MP betikleri (başka hiçbir şey)
     WS  /mp1/ws?role=host                     → yeni oda (R {t:'room',code,key})
     WS  /mp1/ws?role=host&code=…              → host yeniden bağlanır; İLK çerçeve "A<anahtar>" olmalı
                                                 (anahtar URL'de taşınmaz: vekil/CDN erişim günlüklerine düşmesin)
     WS  /mp1/ws?role=client&code=…            → misafir katılır
   Çerçeveleme MP.0 ile aynı (J/L/F/T/K/H/R); host ayrıca "C{json}" (kapasite)
   ve "X" (odayı kapat) gönderir. */
const http=require('http'),https=require('https'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {attach,encode}=require('../../mp0/server/dev-relay.js');
const ROOT=path.resolve(process.env.STARS_GAME_ROOT||path.join(__dirname,'../../..'));
const ALPHABET='ABCDEFGHJKMNPQRSTUVWXYZ23456789';               // 31 sembol, karışan 0/O/1/I/L yok
const CODE_LEN=8;                                               // 31^8 ≈ 8,5·10^11 (≈39,6 bit)
const LIMITS={clientMsg:8192,hostMsg:262144,clientRate:20,clientBurst:40,hostRate:200,hostBurst:400,maxDrops:100,
  perIpConns:16,joinPerMin:30,createPerMin:10,maxGuests:7};
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css; charset=utf-8'};
const SEC={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Cache-Control':'no-store'};

function create(env=process.env){
  const cfg={port:+(env.MP1_PORT||env.PORT||0),bind:env.MP1_BIND||'127.0.0.1',origins:(env.MP1_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean),
    dev:env.MP1_DEV==='1',ttl:+(env.MP1_ROOM_TTL_MS||12*3600e3),grace:+(env.MP1_HOST_GRACE_MS||10*60e3),maxRooms:+(env.MP1_MAX_ROOMS||200),
    cert:env.MP1_TLS_CERT,key:env.MP1_TLS_KEY,ping:+(env.MP1_PING_MS||25e3),auth:+(env.MP1_AUTH_MS||5000),trustProxy:env.MP1_TRUST_PROXY==='1',creates:+(env.MP1_CREATES_PER_MIN||LIMITS.createPerMin)};
  cfg.public=!['127.0.0.1','::1','localhost'].includes(cfg.bind);
  cfg.tls=!!(cfg.cert&&cfg.key);
  const rooms=new Map(),tomb=new Map(),ips=new Map();
  const stats={rooms:0,joins:0,denied:{},dropped:0,closedByLimit:0,msgs:0,bytes:0};
  const deny=k=>{stats.denied[k]=(stats.denied[k]||0)+1;};
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'RELEASE-MANIFEST.json'),'utf8'));
  const ALLOW=new Set([...Object.keys(manifest.files),'research/mp0/mp-core.js',
    'research/mp1/client/mp1.css','research/mp1/client/mp1-host.js','research/mp1/client/join.js','research/mp1/client/view.js',
    'research/mp2/client/guest-game.js','research/mp2/client/mp2.css',   // MP.2 misafir haritası
    'research/mp3/client/dip-ui.js','research/mp3/client/mp3.css',       // MP.3 diplomasi ekranı (misafir sekmesi + host paneli)
    'research/mp31/client/pol-ui.js','research/mp31/client/mp31.css']);  // MP.3.1 federasyon ve vasallık bölümleri
  function page(){
    const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');if(!html.includes('</body>'))throw Error('index.html');
    return html.replace('</body>','<link rel="stylesheet" href="/research/mp1/client/mp1.css"><link rel="stylesheet" href="/research/mp3/client/mp3.css"><link rel="stylesheet" href="/research/mp31/client/mp31.css"><script src="/research/mp0/mp-core.js"></script><script src="/research/mp1/client/view.js"></script><script src="/research/mp3/client/dip-ui.js"></script><script src="/research/mp31/client/pol-ui.js"></script><script src="/research/mp1/client/mp1-host.js"></script></body>');
  }
  function newCode(){for(;;){let c='';for(let i=0;i<CODE_LEN;i++)c+=ALPHABET[crypto.randomInt(ALPHABET.length)];if(!rooms.has(c)&&!tomb.has(c))return c;}}
  const norm=c=>typeof c==='string'?c.toUpperCase().replace(/[^A-Z0-9]/g,''):'';
  const keyHash=k=>crypto.createHash('sha256').update(String(k)).digest();
  function closeRoom(r,reason){
    if(r.closed)return;r.closed=true;clearTimeout(r.graceT);clearTimeout(r.ttlT);rooms.delete(r.code);tomb.set(r.code,Date.now());
    for(const c of r.clients.values()){c.send('R'+JSON.stringify({t:'room-closed',reason}));c.close(4001,'room-closed');}
    if(r.host){r.host.send('R'+JSON.stringify({t:'room-closed',reason}));r.host.close(4001,'room-closed');}
  }
  setInterval(()=>{const t=Date.now();for(const [c,at] of tomb)if(t-at>cfg.ttl)tomb.delete(c);for(const [ip,x] of ips)if(!x.conns&&t-x.at>60e3)ips.delete(ip);},60e3).unref();
  function bucket(rate,burst){let tokens=burst,last=Date.now();return ()=>{const t=Date.now();tokens=Math.min(burst,tokens+(t-last)/1000*rate);last=t;if(tokens<1)return false;tokens--;return true;};}
  /* Vekil arkasında bütün telefonlar vekilin IP'sini taşır; IP başı sınırlar ancak vekilin eklediği son girdiyle anlamlıdır. */
  function ipOf(req){const x=cfg.trustProxy&&req.headers['x-forwarded-for'];if(x){const l=String(x).split(',').pop().trim();if(l)return l;}return req.socket.remoteAddress||'?';}
  function originOk(req){
    const o=req.headers.origin;if(!o)return true;                // tarayıcı dışı araç (test/izleme)
    if(cfg.origins.length)return cfg.origins.includes(o);
    try{return new URL(o).host===req.headers.host;}catch{return false;}
  }
  /* İstek TLS ile mi geldi: doğrudan TLS ya da güvenilen vekilin son X-Forwarded-Proto girdisi. */
  function secure(req){if(cfg.tls)return true;if(!cfg.trustProxy)return false;const x=String(req.headers['x-forwarded-proto']||'').split(',').pop().trim();return x==='https';}
  const mustTls=req=>cfg.public&&!secure(req);
  function problems(){
    if(!cfg.public)return [];
    const p=[];
    if(!cfg.tls&&!cfg.trustProxy)p.push('TLS yok: MP1_TLS_CERT/MP1_TLS_KEY ya da güvenilen TLS vekili için MP1_TRUST_PROXY=1 gerekli');
    if(!cfg.origins.length)p.push('MP1_ORIGINS boş: oyunun https:// adresi yazılmalı');
    if(cfg.origins.some(o=>!/^https:\/\/[^/]+$/.test(o)))p.push('MP1_ORIGINS yalnız https://alan biçiminde olmalı');
    if(cfg.dev)p.push('MP1_DEV=1 üretimde kapalı olmalı (/mp/stats)');
    return p;
  }
  function serve(req,res){
    const url=new URL(req.url,'http://x'),n=decodeURIComponent(url.pathname);
    if(n==='/healthz'){res.writeHead(200,{...SEC,'Content-Type':TYPES['.json']});return res.end('{"ok":true}');}
    if(mustTls(req)){
      if(req.method==='GET'&&req.headers.host&&/^[A-Za-z0-9.:\[\]-]+$/.test(req.headers.host)){res.writeHead(308,{...SEC,Location:'https://'+req.headers.host+url.pathname+url.search});return res.end();}
      deny('insecure');res.writeHead(403,SEC);return res.end();
    }
    if(cfg.public)res.setHeader('Strict-Transport-Security','max-age=31536000');
    if(req.method!=='GET'){res.writeHead(405,SEC);return res.end();}
    if(n==='/'||n==='/index.html'){res.writeHead(200,{...SEC,'Content-Type':TYPES['.html']});return res.end(page());}
    if(n==='/mp/join'){res.writeHead(200,{...SEC,'Content-Type':TYPES['.html'],'Content-Security-Policy':"default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'"});
      return res.end(fs.readFileSync(path.join(ROOT,'research/mp1/client/join.html')));}
    if(n==='/mp/stats'&&cfg.dev){res.writeHead(200,{...SEC,'Content-Type':TYPES['.json']});return res.end(JSON.stringify({...stats,rooms:rooms.size}));}
    const rel=n.replace(/^\/+/,'');
    if(!ALLOW.has(rel)){res.writeHead(404,SEC);return res.end();}
    fs.readFile(path.join(ROOT,rel),(e,b)=>{if(e){res.writeHead(404,SEC);return res.end();}
      res.writeHead(200,{...SEC,'Content-Type':TYPES[path.extname(rel)]||'application/octet-stream'});res.end(b);});
  }
  function reject(socket,status){socket.write('HTTP/1.1 '+status+'\r\nConnection: close\r\n\r\n');socket.destroy();}
  function upgrade(req,socket){
    const url=new URL(req.url,'http://x'),role=url.searchParams.get('role'),key=req.headers['sec-websocket-key'],ip=ipOf(req);
    if(url.pathname!=='/mp1/ws'||!['host','client'].includes(role)||!key){deny('bad-request');return reject(socket,'400 Bad Request');}
    if(mustTls(req)){deny('insecure');return reject(socket,'403 Forbidden');}
    if(!originOk(req)){deny('origin');return reject(socket,'403 Forbidden');}
    const I=ips.get(ip)||{conns:0,joins:[],at:Date.now()};ips.set(ip,I);
    if(I.conns>=LIMITS.perIpConns){deny('ip-conns');return reject(socket,'429 Too Many Requests');}
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+
      crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')+'\r\n\r\n');
    I.conns++;I.at=Date.now();
    const id='c'+crypto.randomBytes(6).toString('hex');
    const rl=role==='host'?bucket(LIMITS.hostRate,LIMITS.hostBurst):bucket(LIMITS.clientRate,LIMITS.clientBurst),max=role==='host'?LIMITS.hostMsg:LIMITS.clientMsg;
    let room=null,drops=0,conn,dead=false,lastIn=Date.now(),pending=null,authT=null;
    /* Telefon ağdan düşünce FIN gelmeyebilir; yarı açık bağlantıyı ping ile yakala. Karşı taraf kapattıysa (FIN) hemen bırak. */
    socket.on('data',()=>{lastIn=Date.now();});socket.on('end',()=>socket.destroy());
    const live=setInterval(()=>{if(Date.now()-lastIn>cfg.ping*2.5){deny('timeout');socket.destroy();}else socket.write(encode(Buffer.alloc(0),9));},cfg.ping);live.unref?.();
    const ctl=obj=>conn.send('R'+JSON.stringify(obj));
    const end=(code,reason)=>{dead=true;ctl({t:'error',code:reason});conn.close(code,reason);};
    function guard(text){
      stats.msgs++;stats.bytes+=text.length;
      if(text.length>max){deny('too-big');ctl({t:'error',code:'too-big'});return false;}
      if(!rl()){stats.dropped++;if(++drops>LIMITS.maxDrops){stats.closedByLimit++;end(4008,'rate-limited');}else ctl({t:'error',code:'rate-limited'});return false;}
      return true;
    }
    conn=attach(socket,text=>{
      if(pending&&!dead){const r=pending;pending=null;clearTimeout(authT);hostAuth(r,text);return;}
      if(dead||!room||room.closed)return;
      if(!guard(text))return;
      if(role==='client'){if(!room.host)return ctl({t:'error',code:'no-host'});room.host.send('F'+id+'\n'+text);return;}
      const k=text[0],nl=text.indexOf('\n'),target=nl>0?text.slice(1,nl):text.slice(1),body=nl>0?text.slice(nl+1):'';
      if(k==='T'){const c=room.clients.get(target);if(c)c.send('H'+body);}
      else if(k==='K'){const c=room.clients.get(target),why=body.replace(/[^a-z-]/g,'').slice(0,40)||'kicked';if(c){c.send('R'+JSON.stringify({t:'kicked',reason:why}));c.close(4003,why);}}
      else if(k==='C'){try{const m=JSON.parse(text.slice(1));if(Number.isInteger(m.cap)&&m.cap>=1&&m.cap<=LIMITS.maxGuests)room.cap=m.cap;}catch{}}
      else if(k==='X')closeRoom(room,'host');
    },()=>{
      dead=true;clearInterval(live);clearTimeout(authT);I.conns=Math.max(0,I.conns-1);
      if(!room)return;
      if(role==='host'){if(room.host===conn){room.host=null;if(!room.closed){for(const c of room.clients.values())c.send('R'+JSON.stringify({t:'host-left'}));
        room.graceT=setTimeout(()=>closeRoom(room,'host-timeout'),cfg.grace);room.graceT.unref?.();}}}
      else{room.clients.delete(id);if(room.host)room.host.send('L'+id);}
    });
    function hostAuth(r,text){
      if(text.length>512||text[0]!=='A'||!crypto.timingSafeEqual(keyHash(text.slice(1)),r.keyHash)){deny('host-key');return end(4003,'bad-host-key');}
      if(r.closed){deny('host-unknown');return end(4004,'room-closed');}
      if(r.host){deny('host-exists');return end(4009,'host-exists');}
      room=r;clearTimeout(r.graceT);r.host=conn;ctl({t:'room',code:r.code,reattached:true,cap:r.cap});
      for(const cid of r.clients.keys())conn.send('J'+cid);for(const c of r.clients.values())c.send('R'+JSON.stringify({t:'host-up'}));
    }
    conn.id=id;
    if(role==='host'){
      const code=norm(url.searchParams.get('code'));
      if(code){                                                   // yeniden bağlanma: kod tek başına yetmez, anahtar ilk çerçevede
        const r=rooms.get(code);
        if(!r||r.closed){deny('host-unknown');return end(4004,tomb.has(code)?'room-closed':'invalid-code');}
        pending=r;authT=setTimeout(()=>{if(pending){pending=null;deny('host-key');end(4003,'bad-host-key');}},cfg.auth);
      }else{
        const t=Date.now();I.creates=(I.creates||[]).filter(x=>t-x<60e3);
        if(I.creates.length>=cfg.creates){deny('create-rate');return end(4029,'rate-limited');}
        I.creates.push(t);
        if(rooms.size>=cfg.maxRooms){deny('max-rooms');return end(4029,'server-full');}
        const c=newCode(),hk=crypto.randomBytes(24).toString('base64url');
        room={code:c,keyHash:keyHash(hk),host:conn,clients:new Map(),cap:1,created:Date.now(),closed:false};
        room.ttlT=setTimeout(()=>closeRoom(room,'ttl'),cfg.ttl);room.ttlT.unref?.();
        rooms.set(c,room);stats.rooms++;ctl({t:'room',code:c,key:hk,cap:room.cap});
      }
    }else{
      const t=Date.now();I.joins=I.joins.filter(x=>t-x<60e3);
      if(I.joins.length>=LIMITS.joinPerMin){deny('join-rate');return end(4029,'rate-limited');}
      I.joins.push(t);
      const code=norm(url.searchParams.get('code')),r=rooms.get(code);
      if(!r||r.closed){deny('invalid-code');return end(4004,tomb.has(code)?'room-closed':'invalid-code');}
      if(r.clients.size>=r.cap){deny('room-full');return end(4005,'room-full');}
      room=r;r.clients.set(id,conn);stats.joins++;
      ctl({t:'welcome',conn:id,host:!!r.host});
      if(r.host)r.host.send('J'+id);
    }
  }
  let server=null;
  function start(){
    const p=problems();if(p.length)return Promise.reject(Object.assign(Error('Relay herkese açık başlatılamaz: '+p.join('; ')),{problems:p}));
    server=cfg.tls?https.createServer({cert:fs.readFileSync(cfg.cert),key:fs.readFileSync(cfg.key)},serve):http.createServer(serve);
    server.on('upgrade',upgrade);
    return new Promise(res=>server.listen(cfg.port,cfg.bind,()=>res(server)));
  }
  /* Platform yeniden başlatması (SIGTERM): odaları nedenle kapat, yeni bağlantı alma. */
  function shutdown(reason='server-restart'){for(const r of [...rooms.values()])closeRoom(r,reason);if(server)server.close();}
  return {start,shutdown,problems,rooms,stats,cfg,LIMITS,ALPHABET,CODE_LEN};
}
module.exports={create,ALPHABET,CODE_LEN,LIMITS};
if(require.main===module){
  const r=create();
  r.start().then(s=>{
    console.log('STARS MP.1 relay '+(s instanceof https.Server?'https':'http')+'://'+s.address().address+':'+s.address().port+(r.cfg.public?' (herkese açık kip: TLS '+(r.cfg.tls?'doğrudan':'vekilde')+', izinli köken '+r.cfg.origins.length+')':' (yalnız yerel)'));
    for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>{r.shutdown();setTimeout(()=>process.exit(0),300).unref();});
  },e=>{console.error(e.message);process.exit(1);});
}
