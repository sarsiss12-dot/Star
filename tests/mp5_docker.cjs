'use strict';
/* MP.5 — dağıtım imajının (research/mp1/deploy/Dockerfile) gerçek konteynerde doğrulanması.
   Docker daemon gerekir; yoksa bütün vakalar NOT RUN yazılır (PASS sayılmaz). Taban imaj docker.io'dan çekilemezse
   (anonim çekme sınırı) aynı resmî imaj mirror.gcr.io / public.ecr.aws yansısından çekilip node:22-alpine olarak etiketlenir.
   Konteyner önünde test için yerel TLS vekili (tests/helpers/mp11-tls-proxy.js): platformun TLS sonlandırmasının benzeri.
   Bu GERÇEK İNTERNET DAĞITIMI DEĞİLDİR. Çıktı: $STARS_OUTPUT/mp5-docker.json */
const fs=require('fs'),path=require('path'),net=require('net'),http=require('http'),tls=require('tls'),crypto=require('crypto'),assert=require('assert/strict'),
  {execFileSync,execSync}=require('child_process');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp5'));fs.mkdirSync(out,{recursive:true});
const {selfSigned,startProxy}=require('./helpers/mp11-tls-proxy.js');
const IMG='stars-relay:mp5-test',results=[],metrics={};let pass=0,fail=0,notRun=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const dk=(...a)=>execFileSync('docker',a,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const dkTry=(...a)=>{try{return {ok:true,out:dk(...a)};}catch(e){return {ok:false,out:String(e.stdout||'')+String(e.stderr||'')};}};
async function test(name,fn){const t0=Date.now();try{await fn();pass++;results.push({name,status:'PASS',ms:Date.now()-t0});console.log('✓ '+name);}
  catch(e){fail++;results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1500)});console.log('✗ '+name+' — '+(e&&e.stack||e));}}
const freePort=()=>new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const get=(port,p,headers={})=>new Promise((res,rej)=>http.get({host:'127.0.0.1',port,path:p,headers},x=>{const b=[];x.on('data',d=>b.push(d));x.on('end',()=>res({status:x.statusCode,headers:x.headers,body:Buffer.concat(b)}));}).on('error',rej));
async function healthy(port,ms=15000){const t0=Date.now();for(;;){try{if((await get(port,'/healthz')).status===200)return Date.now()-t0;}catch{}if(Date.now()-t0>ms)throw Error('no health');await sleep(50);}}
/* WSS istemcisi (RFC 6455, maskeli çerçeve) — TLS vekili üzerinden */
function wss(port,query,ca,origin,hdr={}){return new Promise((resolve,reject)=>{const s=tls.connect({port,host:'127.0.0.1',ca,servername:'localhost'}),key=crypto.randomBytes(16).toString('base64');
  const c={msgs:[],closed:null,status:null,send(t){const b=Buffer.from(t),m=crypto.randomBytes(4);const h=b.length<126?Buffer.from([0x81,0x80|b.length]):Buffer.from([0x81,0x80|126,b.length>>8,b.length&255]);
      const d=Buffer.from(b);for(let i=0;i<d.length;i++)d[i]^=m[i&3];s.write(Buffer.concat([h,m,d]));},end(){s.destroy();},
    async wait(pred,ms=3000){const t0=Date.now();for(;;){const i=c.msgs.findIndex(pred);if(i>=0)return c.msgs.splice(i,1)[0];if(Date.now()-t0>ms)throw Error('timeout '+JSON.stringify(c.msgs)+' '+JSON.stringify(c.closed));await sleep(5);}},
    ctl(t,ms){return c.wait(m=>m[0]==='R'&&JSON.parse(m.slice(1)).t===t,ms).then(m=>JSON.parse(m.slice(1)));}};
  let buf=Buffer.alloc(0),up=false;
  s.on('secureConnect',()=>s.write('GET /mp1/ws?'+query+' HTTP/1.1\r\nHost: localhost:'+port+'\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: '+key+'\r\nOrigin: '+origin+'\r\n'+Object.entries(hdr).map(([k,v])=>k+': '+v+'\r\n').join('')+'\r\n'));
  s.on('data',ch=>{buf=Buffer.concat([buf,ch]);if(!up){const i=buf.indexOf('\r\n\r\n');if(i<0)return;c.status=+buf.slice(0,i).toString().split(' ')[1];buf=buf.slice(i+4);up=true;resolve(c);}
    while(buf.length>=2){const op=buf[0]&15;let len=buf[1]&127,off=2;if(len===126){if(buf.length<4)return;len=buf.readUInt16BE(2);off=4;}else if(len===127){if(buf.length<10)return;len=Number(buf.readBigUInt64BE(2));off=10;}
      if(buf.length<off+len)return;const d=buf.slice(off,off+len);buf=buf.slice(off+len);if(op===1)c.msgs.push(d.toString());else if(op===8)c.closed={code:d.readUInt16BE(0),reason:d.slice(2).toString()};}});
  s.on('close',()=>{if(!c.closed)c.closed={code:1006};});s.on('error',e=>{if(!up)reject(e);});});}
const logs=n=>execSync('docker logs '+n+' 2>&1',{encoding:'utf8'});   // console.error → stderr
const memMB=name=>{const m=dk('stats','--no-stream','--format','{{.MemUsage}}',name).split('/')[0].trim();const v=parseFloat(m);return /GiB/.test(m)?v*1024:/KiB/.test(m)?v/1024:v;};

(async()=>{
  const info=dkTry('info','--format','{{.ServerVersion}}');
  if(!info.ok){console.log('NOT RUN: Docker daemon yok ('+info.out.split('\n')[0]+')');fs.writeFileSync(path.join(out,'mp5-docker.json'),JSON.stringify({status:'NOT RUN',why:info.out.slice(0,300)},null,1));
    console.log('GEÇEN: 0 KALAN: 0 (NOT RUN)');process.exit(0);}
  metrics.docker=info.out;
  if(!dkTry('image','inspect','node:22-alpine').ok&&!dkTry('pull','-q','node:22-alpine').ok){
    for(const m of ['mirror.gcr.io/library/node:22-alpine','public.ecr.aws/docker/library/node:22-alpine'])if(dkTry('pull','-q',m).ok){dk('tag',m,'node:22-alpine');metrics.baseFrom=m;break;}}
  const tlsKey=selfSigned();const names=[];const run=(n,args)=>{names.push(n);dkTry('rm','-f',n);return dkTry('run','-d','--name',n,...args,IMG);};
  try{
    await test('imaj derlenir: yalnız 19 runtime + manifest + MP istemci/sunucu dosyaları; test, ZIP, .git, gizli anahtar yok; node kullanıcısı',async()=>{
      const t0=Date.now();dk('build','-q','-f','research/mp1/deploy/Dockerfile','-t',IMG,root);metrics.buildMs=Date.now()-t0;
      const files=dk('run','--rm','--entrypoint','sh',IMG,'-c','cd /app && find . -type f | sort').split('\n').map(f=>f.replace(/^\.\//,''));
      const man=JSON.parse(fs.readFileSync(path.join(root,'RELEASE-MANIFEST.json')));for(const f of Object.keys(man.files))assert(files.includes(f),f);
      assert.equal(files.filter(f=>!f.startsWith('research/')).length,20);assert(files.every(f=>/^research\/mp(0|1|2|3|31|4|6|61|63)\//.test(f)||!f.includes('/')),files.join());
      assert(!files.some(f=>/test|\.zip$|\.pem$|\.env$|node_modules|\.git/.test(f)));
      for(const f of Object.keys(man.files))assert.equal(dk('run','--rm','--entrypoint','sha256sum',IMG,'/app/'+f).split(' ')[0],man.files[f].sha256??man.files[f],'byte-identical '+f);
      assert.equal(dk('run','--rm','--entrypoint','id',IMG,'-un'),'node');metrics.imageFiles=files.length;metrics.imageSize=dk('image','inspect',IMG,'--format','{{.Size}}');
    });
    await test('yanlış yapılandırma: MP1_ORIGINS yok / http:// / MP1_DEV=1 → konteyner gerekçeyle çıkar (kod 1); güvensiz relay başlamaz',async()=>{
      for(const [n,env,re] of [['mp5-bad1',[],/MP1_ORIGINS boş/],['mp5-bad2',['-e','MP1_ORIGINS=http://stars.example'],/https:\/\/alan/],['mp5-bad3',['-e','MP1_ORIGINS=https://stars.example','-e','MP1_DEV=1'],/MP1_DEV=1/]]){
        run(n,env);for(let i=0;i<100&&dk('inspect',n,'--format','{{.State.Running}}')==='true';i++)await sleep(50);
        assert.equal(dk('inspect',n,'--format','{{.State.ExitCode}}'),'1',n);assert.match(logs(n),re,n);}
    });
    const port=await freePort(),pport=await freePort(),origin='https://localhost:'+pport;let px;
    await test('doğru yapılandırma: sağlık 200; TLS\'siz GET 308 → https; vekilden https ile 200 + HSTS; /mp/stats ve izin listesi dışı 404; Docker HEALTHCHECK "healthy"',async()=>{
      const t0=Date.now();const r=run('mp5-relay',['-p','127.0.0.1:'+port+':8080','-e','MP1_ORIGINS='+origin]);assert(r.ok,r.out);metrics.coldStartMs=await healthy(port)+(Date.now()-t0-0);
      const plain=await get(port,'/',{host:'localhost:'+pport});assert.equal(plain.status,308);assert.equal(plain.headers.location,origin+'/');
      const sec=await get(port,'/',{host:'localhost:'+pport,'x-forwarded-proto':'https'});assert.equal(sec.status,200);assert.match(sec.headers['strict-transport-security'],/max-age=/);
      assert.match(sec.body.toString(),/research\/mp4\/client\/mp4-save\.js/);
      for(const p of ['/mp/stats','/tests/run-all.js','/.git/config','/research/mp1/server/relay.js'])assert.equal((await get(port,p,{'x-forwarded-proto':'https'})).status,404,p);
      let h='';for(let i=0;i<90&&h!=='healthy';i++){h=dk('inspect','mp5-relay','--format','{{.State.Health.Status}}');if(h!=='healthy')await sleep(500);}metrics.healthcheck=h;assert.equal(h,'healthy');
    });
    await test('WSS (TLS vekili → konteyner): oda açılır, misafir katılır, ileti iki yönde; bozuk istekler konteyneri düşürmez',async()=>{
      px=await startProxy({target:port,cert:tlsKey.cert,key:tlsKey.key,port:pport});
      const t0=Date.now();const h=await wss(pport,'role=host',tlsKey.ca,origin);assert.equal(h.status,101);const m=await h.ctl('room');metrics.wssRoomMs=Date.now()-t0;
      h.send('C'+JSON.stringify({cap:2}));await sleep(100);
      const t1=Date.now();const g=await wss(pport,'role=client&code='+m.code,tlsKey.ca,origin);const w=await g.ctl('welcome');metrics.wssJoinMs=Date.now()-t1;
      const t2=Date.now();g.send('{"v":1,"type":"ping","t":1}');await h.wait(x=>x[0]==='F'&&x.includes('"ping"'));h.send('T'+w.conn+'\n{"v":1,"type":"pong","t":1}');await g.wait(x=>x[0]==='H');metrics.wssRoundTripMs=Date.now()-t2;
      for(const t of ['GET /%E0%A4%A HTTP/1.1\r\nHost: x\r\n\r\n','GET //a:99999/x HTTP/1.1\r\nHost: x\r\n\r\n'])await new Promise(r=>{const c=net.connect(port,'127.0.0.1',()=>c.write(t));c.on('data',()=>{});c.on('error',()=>{});c.on('close',r);setTimeout(()=>c.destroy(),500);});
      await healthy(port,3000);assert.equal(dk('inspect','mp5-relay','--format','{{.State.Running}}'),'true');
      g.send('{"v":1,"type":"ping","t":2}');await h.wait(x=>x[0]==='F'&&x.includes('"t":2'));
      metrics.logsAfterSession=logs('mp5-relay').trim().split('\n');assert.equal(metrics.logsAfterSession.length,1,'only the start line');
      assert(!metrics.logsAfterSession.join().includes(m.code)&&!metrics.logsAfterSession.join().includes(m.key));
      globalThis.__live={h,g,code:m.code};
    });
    await test('bellek: boşta ve 50 oda × (host + 2 misafir) = 150 WSS bağlantısıyla konteyner belleği',async()=>{
      /* ayrı konteyner: her telefon ayrı IP (MP1_IP_HEADER ile; aynı makineden 150 farklı istemci) — IP başı sınırlar gerçek kullanımdaki gibi */
      const mport=await freePort(),mpp=await freePort(),mo='https://localhost:'+mpp;run('mp5-mem',['-p','127.0.0.1:'+mport+':8080','-e','MP1_ORIGINS='+mo,'-e','MP1_IP_HEADER=x-test-client-ip']);await healthy(mport);
      const mpx=await startProxy({target:mport,cert:tlsKey.cert,key:tlsKey.key,port:mpp});let ipn=0;const ip=()=>({'x-test-client-ip':'10.1.'+(ipn>>8)+'.'+(ipn++&255)});
      metrics.memIdleMB=memMB('mp5-mem');const conns=[];let joined=0;
      for(let i=0;i<50;i++){const h=await wss(mpp,'role=host',tlsKey.ca,mo,ip());const m=await h.ctl('room');h.send('C'+JSON.stringify({cap:2}));conns.push(h);await sleep(20);
        for(let k=0;k<2;k++){const g=await wss(mpp,'role=client&code='+m.code,tlsKey.ca,mo,ip());await g.ctl('welcome');joined++;conns.push(g);}}
      await sleep(1500);metrics.mem50RoomsMB=memMB('mp5-mem');metrics.mem50RoomsConns=conns.length;assert.equal(joined,100);
      for(const c of conns)c.end();await sleep(800);metrics.memAfterMB=memMB('mp5-mem');await mpx.close();
      assert(metrics.mem50RoomsMB<200,'mem '+metrics.mem50RoomsMB);
    });
    await test('yeniden başlatma: docker restart → misafir ve host "server-restart" nedeniyle kapanış alır; konteyner temiz çıkar; sağlık geri gelir; eski oda kodu artık yok',async()=>{
      const {h,g,code}=globalThis.__live;const t0=Date.now();dk('restart','-t','10','mp5-relay');metrics.restartMs=Date.now()-t0;
      const rc=await g.ctl('room-closed');assert.equal(rc.reason,'server-restart');assert.equal((await h.ctl('room-closed')).reason,'server-restart');
      metrics.healthBackMs=await healthy(port);
      const again=await wss(pport,'role=client&code='+code,tlsKey.ca,origin);assert.equal((await again.ctl('error')).code,'invalid-code');
      const t1=Date.now();dk('stop','-t','10','mp5-relay');metrics.stopMs=Date.now()-t1;assert.equal(dk('inspect','mp5-relay','--format','{{.State.ExitCode}}'),'0');
    });
    if(px)await px.close();
  }finally{for(const n of names)dkTry('rm','-f',n);tlsKey.cleanup();}
  fs.writeFileSync(path.join(out,'mp5-docker.json'),JSON.stringify({note:'Yerel Docker konteyneri + yerel TLS vekili. Gerçek internet dağıtımı DEĞİL.',results,metrics},null,1));
  console.log(JSON.stringify(metrics));console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
})();
