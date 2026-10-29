'use strict';
/* STARS MP.0 — YALNIZ GELİŞTİRME AMAÇLI yerel HTTP + WebSocket relay.
   Üretim LAN/online hizmeti DEĞİLDİR: TLS yok, kimlik doğrulama yok,
   relay trafiği düz metin görür. Harici bağımlılık yok (RFC 6455 çekirdeği).

   HTTP:
     /                → depo kökünden statik dosya (dizin dışına çıkış engelli)
     /mp/host         → index.html + MP host betikleri (çalışma ağacındaki
                        runtime dosyaları DEĞİŞMEZ; enjeksiyon yalnız yanıtta)
     /mp/client       → research/mp0/client/index.html (motor yüklemez)
     /mp/stats        → relay sayaçları (JSON, yalnız geliştirme)
   WebSocket:  /mp?room=<oda>&role=host|client

   Çerçeveleme (relay ↔ uç):
     istemci → relay : ham metin (relay olduğu gibi host'a iletir)
     relay → host    : "J<conn>" katıldı · "L<conn>" ayrıldı · "F<conn>\n<metin>" mesaj
     host → relay    : "T<conn>\n<metin>" tek alıcı · "K<conn>\n<neden>" bağlantıyı kes
     relay → istemci : "H<metin>" host verisi · "R<json>" relay denetim mesajı
   İstemci başka bir bağlantıya yazamaz; gönderici kimliğini relay damgalar. */
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(process.env.STARS_GAME_ROOT||path.join(__dirname,'../../..'));
const PORT=+(process.env.MP_PORT||0);
/* Varsayılan yalnız yerel makine. MP_BIND=0.0.0.0 aynı ağdaki cihazlara açar (TLS/kimlik doğrulama YOK —
   yalnız güvenilir geliştirme ağı). Android tarayıcı/PWA bu sunucunun yerini alamaz: tarayıcı dinleme soketi açamaz. */
const BIND=process.env.MP_BIND||'127.0.0.1';
const MAX_PAYLOAD=1<<20;          // 1 MiB
const MAX_CLIENT_MSG=8192;        // istemci → host komut paketi tavanı
const DELAY=+(process.env.MP_DELAY_MS||0);
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.sav':'application/json'};
const rooms=new Map();             // roomId → {host:conn|null, clients:Map(id→conn), created}
const stats={connections:0,framesIn:0,framesOut:0,bytesIn:0,bytesOut:0,rejected:0,byConn:{}};
let nextConn=1;

function hostPage(){
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const inject='<script src="/research/mp0/mp-core.js"></script><script src="/research/mp0/mp-host.js"></script>';
  if(!html.includes('</body>'))throw Error('index.html </body> yok');
  return html.replace(/<head>/i,'<head><base href="/">').replace('</body>',inject+'</body>');
}
function serveStatic(req,res){
  const url=new URL(req.url,'http://localhost'),n=decodeURIComponent(url.pathname);
  if(n==='/mp/host'){res.writeHead(200,{'Content-Type':TYPES['.html'],'Cache-Control':'no-store'});return res.end(hostPage());}
  if(n==='/mp/client'){res.writeHead(302,{Location:'/research/mp0/client/index.html'+url.search});return res.end();}
  if(n==='/mp/stats'){res.writeHead(200,{'Content-Type':TYPES['.json']});return res.end(JSON.stringify({...stats,rooms:[...rooms].map(([id,r])=>({id,host:!!r.host,clients:r.clients.size}))}));}
  const f=path.resolve(ROOT,'.'+(n==='/'?'/index.html':n));
  if(f!==ROOT&&!f.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);return res.end();}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(b);});
}

/* ---------- RFC 6455 asgari çekirdek: metin, ping/pong, kapanış ---------- */
function encode(text,opcode=1){
  const body=Buffer.isBuffer(text)?text:Buffer.from(text,'utf8'),len=body.length;
  let head;
  if(len<126)head=Buffer.from([0x80|opcode,len]);
  else if(len<65536){head=Buffer.alloc(4);head[0]=0x80|opcode;head[1]=126;head.writeUInt16BE(len,2);}
  else{head=Buffer.alloc(10);head[0]=0x80|opcode;head[1]=127;head.writeBigUInt64BE(BigInt(len),2);}
  return Buffer.concat([head,body]);
}
function attach(socket,onText,onClose){
  let buf=Buffer.alloc(0),closed=false;
  const conn={socket,send(text){if(closed)return;const fr=encode(text);stats.framesOut++;stats.bytesOut+=fr.length;
      const s=stats.byConn[conn.id]||(stats.byConn[conn.id]={in:0,out:0,framesIn:0,framesOut:0});s.out+=fr.length;s.framesOut++;
      if(DELAY)setTimeout(()=>{if(!closed)socket.write(fr);},DELAY);else socket.write(fr);},
    close(code=1000,reason=''){if(closed)return;const b=Buffer.alloc(2+Buffer.byteLength(reason));b.writeUInt16BE(code,0);b.write(reason,2);
      try{socket.write(encode(b,8));}catch{}closed=true;socket.end();onClose();}};
  socket.on('data',chunk=>{
    buf=Buffer.concat([buf,chunk]);
    while(buf.length>=2){
      const fin=buf[0]&0x80,op=buf[0]&0x0f,masked=buf[1]&0x80;let len=buf[1]&0x7f,off=2;
      if(len===126){if(buf.length<4)return;len=buf.readUInt16BE(2);off=4;}
      else if(len===127){if(buf.length<10)return;const big=buf.readBigUInt64BE(2);if(big>BigInt(MAX_PAYLOAD)){stats.rejected++;return conn.close(1009,'too big');}len=Number(big);off=10;}
      if(len>MAX_PAYLOAD){stats.rejected++;return conn.close(1009,'too big');}
      if(!masked){stats.rejected++;return conn.close(1002,'unmasked');}   // istemci çerçeveleri maskeli olmalı
      if(buf.length<off+4+len)return;
      const mask=buf.slice(off,off+4),data=Buffer.from(buf.slice(off+4,off+4+len));
      for(let i=0;i<data.length;i++)data[i]^=mask[i&3];
      buf=buf.slice(off+4+len);
      if(!fin){stats.rejected++;return conn.close(1003,'fragmentation unsupported');}
      if(op===8){closed=true;socket.end();onClose();return;}
      if(op===9){socket.write(encode(data,10));continue;}
      if(op===10)continue;
      if(op!==1){stats.rejected++;return conn.close(1003,'text only');}
      stats.framesIn++;stats.bytesIn+=len;const s=stats.byConn[conn.id]||(stats.byConn[conn.id]={in:0,out:0,framesIn:0,framesOut:0});s.in+=len;s.framesIn++;
      onText(data.toString('utf8'));
    }
  });
  socket.on('close',()=>{if(!closed){closed=true;onClose();}});
  socket.on('error',()=>{if(!closed){closed=true;onClose();}});
  return conn;
}

function upgrade(req,socket){
  const url=new URL(req.url,'http://localhost');
  const room=url.searchParams.get('room')||'',role=url.searchParams.get('role');
  const key=req.headers['sec-websocket-key'];
  if(url.pathname!=='/mp'||!/^[a-z0-9-]{1,32}$/.test(room)||!['host','client'].includes(role)||!key){socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');return socket.destroy();}
  const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
  const id='c'+(nextConn++)+'-'+crypto.randomBytes(4).toString('hex');stats.connections++;
  const r=rooms.get(room)||{host:null,clients:new Map(),created:Date.now()};rooms.set(room,r);
  let conn;
  if(role==='host'){
    if(r.host){socket.write(encode('R'+JSON.stringify({t:'error',code:'host-exists'})));return socket.end();}
    conn=attach(socket,text=>{
      const kind=text[0],nl=text.indexOf('\n');
      const target=nl>0?text.slice(1,nl):text.slice(1),body=nl>0?text.slice(nl+1):'';
      const c=r.clients.get(target);
      if(kind==='T'){if(c)c.send('H'+body);}
      else if(kind==='K'){if(c){c.send('R'+JSON.stringify({t:'kicked',reason:body.slice(0,80)}));c.close(4000,'kicked');}}
    },()=>{if(r.host===conn){r.host=null;for(const c of r.clients.values())c.send('R'+JSON.stringify({t:'host-left'}));}});
    conn.id=id;r.host=conn;
    conn.send('R'+JSON.stringify({t:'welcome',conn:id,room,role}));
    for(const cid of r.clients.keys())conn.send('J'+cid);
    for(const c of r.clients.values())c.send('R'+JSON.stringify({t:'host-up'}));
  }else{
    conn=attach(socket,text=>{
      if(text.length>MAX_CLIENT_MSG){stats.rejected++;return conn.send('R'+JSON.stringify({t:'error',code:'too-big'}));}
      if(!r.host)return conn.send('R'+JSON.stringify({t:'error',code:'no-host'}));
      r.host.send('F'+id+'\n'+text);
    },()=>{r.clients.delete(id);if(r.host)r.host.send('L'+id);});
    conn.id=id;r.clients.set(id,conn);
    conn.send('R'+JSON.stringify({t:'welcome',conn:id,room,role,host:!!r.host}));
    if(r.host)r.host.send('J'+id);
  }
}

function start(port=PORT){
  const server=http.createServer(serveStatic);
  server.on('upgrade',upgrade);
  return new Promise(res=>server.listen(port,BIND,()=>res(server)));
}
module.exports={start,stats,rooms,encode,attach};
if(require.main===module)start().then(s=>console.log('STARS MP.0 dev relay http://'+BIND+':'+s.address().port+' (yalnız geliştirme)'));
