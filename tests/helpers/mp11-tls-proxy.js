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
function startProxy({target,cert,key,port=0}){
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
      up.pipe(sock);sock.pipe(up);});
    up.on('data',d=>{bytes+=d.length;});sock.on('data',d=>{bytes+=d.length;});
    sockets.add(up);up.on('close',()=>{sockets.delete(up);sock.destroy();});sock.on('close',()=>up.destroy());up.on('error',()=>sock.destroy());sock.on('error',()=>up.destroy());
  });
  return new Promise(res=>server.listen(port,'127.0.0.1',()=>res({server,port:server.address().port,bytes:()=>bytes,
    close(){for(const s of sockets)s.destroy();return new Promise(r=>server.close(()=>r()));}})));
}
module.exports={selfSigned,startProxy};
