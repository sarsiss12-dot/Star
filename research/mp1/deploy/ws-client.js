'use strict';
/* Bağımlılıksız asgari WebSocket istemcisi (RFC 6455): smoke testi ve otomatik testler için.
   Origin ve X-Forwarded-* başlıkları elle verilebilir; TLS'de ca/servername desteklenir. */
const net=require('net'),tls=require('tls'),crypto=require('crypto');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function connect(u,{origin,ca,headers={},timeout=10000}={}){
  const url=new URL(u),secure=url.protocol==='wss:',port=+url.port||(secure?443:80);
  return new Promise((resolve,reject)=>{
    const sock=secure?tls.connect({host:url.hostname,port,ca,servername:url.hostname}):net.connect(port,url.hostname);
    const key=crypto.randomBytes(16).toString('base64'),t=setTimeout(()=>{sock.destroy();reject(Error('bağlantı zaman aşımı'));},timeout);
    const c={msgs:[],closed:null,status:null,sock,
      send(text){const b=Buffer.from(text,'utf8'),m=crypto.randomBytes(4);let h;
        if(b.length<126)h=Buffer.from([0x81,0x80|b.length]);else if(b.length<65536){h=Buffer.alloc(4);h[0]=0x81;h[1]=0x80|126;h.writeUInt16BE(b.length,2);}
        else{h=Buffer.alloc(10);h[0]=0x81;h[1]=0x80|127;h.writeBigUInt64BE(BigInt(b.length),2);}
        const d=Buffer.from(b);for(let i=0;i<d.length;i++)d[i]^=m[i&3];sock.write(Buffer.concat([h,m,d]));},
      end(){sock.destroy();},
      async wait(pred,ms=5000){const t0=Date.now();for(;;){const i=c.msgs.findIndex(pred);if(i>=0)return c.msgs.splice(i,1)[0];
        if(Date.now()-t0>ms)throw Error('beklenen mesaj gelmedi; son: '+JSON.stringify(c.msgs.slice(-3))+' kapanış '+JSON.stringify(c.closed));await sleep(5);}},
      async waitClose(ms=5000){const t0=Date.now();while(!c.closed){if(Date.now()-t0>ms)throw Error('kapanmadı');await sleep(5);}return c.closed;},
      ctl(tp,ms){return c.wait(m=>m[0]==='R'&&JSON.parse(m.slice(1)).t===tp,ms).then(m=>JSON.parse(m.slice(1)));}};
    let buf=Buffer.alloc(0),up=false;
    sock.on(secure?'secureConnect':'connect',()=>sock.write('GET '+url.pathname+url.search+' HTTP/1.1\r\nHost: '+url.host+'\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n'+
      'Sec-WebSocket-Version: 13\r\nSec-WebSocket-Key: '+key+'\r\n'+(origin?'Origin: '+origin+'\r\n':'')+Object.entries(headers).map(([k,v])=>k+': '+v+'\r\n').join('')+'\r\n'));
    sock.on('data',ch=>{buf=Buffer.concat([buf,ch]);
      if(!up){const i=buf.indexOf('\r\n\r\n');if(i<0)return;const head=buf.slice(0,i).toString();buf=buf.slice(i+4);c.status=+head.split(' ')[1];clearTimeout(t);
        if(c.status!==101)return resolve(c);
        const acc=(head.match(/sec-websocket-accept: *(.*)/i)||[])[1];
        if(acc!==crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')){sock.destroy();return reject(Error('geçersiz el sıkışma'));}
        up=true;resolve(c);}
      while(buf.length>=2){const op=buf[0]&15;let len=buf[1]&127,off=2;
        if(len===126){if(buf.length<4)return;len=buf.readUInt16BE(2);off=4;}else if(len===127){if(buf.length<10)return;len=Number(buf.readBigUInt64BE(2));off=10;}
        if(buf.length<off+len)return;const d=buf.slice(off,off+len);buf=buf.slice(off+len);
        if(op===1)c.msgs.push(d.toString('utf8'));else if(op===8)c.closed={code:d.length>=2?d.readUInt16BE(0):0,reason:d.slice(2).toString()};}});
    sock.on('close',()=>{if(!c.closed)c.closed={code:1006,reason:''};});
    sock.on('error',e=>{if(!up&&c.status==null){clearTimeout(t);reject(e);}});
  });
}
module.exports={connect,sleep};
