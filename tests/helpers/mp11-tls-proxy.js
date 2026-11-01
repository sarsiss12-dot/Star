'use strict';
/* MP.1.1 test yardımcısı: platform/Caddy benzeri TLS sonlandıran ters vekil.
   HTTPS ve WSS'yi karşılar, relay'e düz HTTP ile iletir ve X-Forwarded-For /
   X-Forwarded-Proto ekler (gelen değerin sonuna, gerçek vekiller gibi).
   Yalnız test içindir; kendinden imzalı sertifika üretir (openssl). */
const fs=require('fs'),os=require('os'),path=require('path'),http=require('http'),https=require('https'),net=require('net'),{execFileSync}=require('child_process');
function selfSigned(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mp11tls-')),cert=path.join(dir,'cert.pem'),key=path.join(dir,'key.pem');
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost',
    '-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'],{stdio:'ignore'});
  return {dir,cert,key,ca:fs.readFileSync(cert),cleanup(){fs.rmSync(dir,{recursive:true,force:true});}};
}
/* MP.7: RFC 6455 aracı (vekil) mesajları parçalayabilir (5.4: "an intermediary MAY change the fragmentation of a message").
   fragment=N verilirse istemci → relay yönündeki N bayttan büyük metin çerçeveleri parçalara bölünür (ilk op=1 FIN=0, sonra op=0
   devam çerçeveleri, son FIN=1) ve parçaların arasına boş bir kontrol çerçevesi (pong) eklenir (RFC: kontrol çerçeveleri parçalı
   mesajın ortasına girebilir). Yalnız test içindir; gerçek bulut vekillerinin davranışını taklit eder, iddia etmez. */
function fragmenter(N,counter){
  let buf=Buffer.alloc(0);
  const frame=(fin,op,payload)=>{const mask=Buffer.from([0x11,0x22,0x33,0x44]),len=payload.length;let head;
    if(len<126)head=Buffer.from([(fin?0x80:0)|op,0x80|len]);else if(len<65536){head=Buffer.alloc(4);head[0]=(fin?0x80:0)|op;head[1]=0x80|126;head.writeUInt16BE(len,2);}
    else{head=Buffer.alloc(10);head[0]=(fin?0x80:0)|op;head[1]=0x80|127;head.writeBigUInt64BE(BigInt(len),2);}
    const body=Buffer.from(payload);for(let i=0;i<body.length;i++)body[i]^=mask[i&3];return Buffer.concat([head,mask,body]);};
  return chunk=>{buf=Buffer.concat([buf,chunk]);const outs=[];
    for(;;){if(buf.length<2)break;const b0=buf[0],fin=b0&0x80,op=b0&0x0f,masked=buf[1]&0x80;let len=buf[1]&0x7f,off=2;
      if(len===126){if(buf.length<4)break;len=buf.readUInt16BE(2);off=4;}else if(len===127){if(buf.length<10)break;len=Number(buf.readBigUInt64BE(2));off=10;}
      const mlen=masked?4:0;if(buf.length<off+mlen+len)break;
      const raw=buf.slice(0,off+mlen+len);
      if(op===1&&fin&&masked&&len>N){const mask=buf.slice(off,off+4),data=Buffer.from(buf.slice(off+4,off+4+len));for(let i=0;i<data.length;i++)data[i]^=mask[i&3];
        counter.split++;for(let i=0;i<data.length;i+=N){const last=i+N>=data.length;outs.push(frame(last,i===0?1:0,data.slice(i,i+N)));if(!last)outs.push(frame(true,10,Buffer.alloc(0)));}}
      else outs.push(raw);
      buf=buf.slice(off+mlen+len);}
    return outs.length?Buffer.concat(outs):null;};
}
function startProxy({target,cert,key,port=0,fragment=0}){
  const frag={split:0};
  const sockets=new Set();let bytes=0;
  const fwd=(h,remote)=>({...h,'x-forwarded-for':(h['x-forwarded-for']?h['x-forwarded-for']+', ':'')+remote,'x-forwarded-proto':'https'});
  const server=https.createServer({cert:fs.readFileSync(cert),key:fs.readFileSync(key)},(req,res)=>{
    const p=http.request({host:'127.0.0.1',port:target,path:req.url,method:req.method,headers:fwd(req.headers,req.socket.remoteAddress)},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
    p.on('error',()=>{res.writeHead(502);res.end();});req.pipe(p);
  });
  server.on('connection',s=>{sockets.add(s);s.on('close',()=>sockets.delete(s));});
  server.on('upgrade',(req,sock,head)=>{
    const up=net.connect(target,'127.0.0.1',()=>{
      const h=fwd(req.headers,req.socket.remoteAddress);
      up.write(req.method+' '+req.url+' HTTP/1.1\r\n'+Object.entries(h).map(([k,v])=>k+': '+v+'\r\n').join('')+'\r\n');if(head&&head.length)up.write(head);
      up.pipe(sock);if(fragment){const f=fragmenter(fragment,frag);sock.on('data',d=>{const o=f(d);if(o)up.write(o);});}else sock.pipe(up);});
    up.on('data',d=>{bytes+=d.length;});sock.on('data',d=>{bytes+=d.length;});
    sockets.add(up);up.on('close',()=>{sockets.delete(up);sock.destroy();});sock.on('close',()=>up.destroy());up.on('error',()=>sock.destroy());sock.on('error',()=>up.destroy());
  });
  return new Promise(res=>server.listen(port,'127.0.0.1',()=>res({server,port:server.address().port,bytes:()=>bytes,frag,
    close(){for(const s of sockets)s.destroy();return new Promise(r=>server.close(()=>r()));}})));
}
module.exports={selfSigned,startProxy};
