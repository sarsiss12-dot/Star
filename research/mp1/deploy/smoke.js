'use strict';
/* STARS MP.1 relay dağıtım smoke testi.
   Kullanım: node research/mp1/deploy/smoke.js https://stars.ornek-alan.tr [--ca sertifika.pem] [--http-redirect]
   Yalnız okuma + kısa ömürlü bir test odası açar ve kapatır; hız sınırlarını zorlamaz.
   Doğrular: /healthz, HSTS, oyun sayfası + MP betikleri, runtime baytları = RELEASE-MANIFEST,
   misafir sayfası CSP, WSS ile oda kurma/katılma/iletme, anahtarın URL'de olmaması,
   yanlış host anahtarı ve yabancı Origin reddi, oda kapatma, (isteğe bağlı) http→https. */
const fs=require('fs'),path=require('path'),http=require('http'),https=require('https'),crypto=require('crypto');
const {connect}=require('./ws-client.js');
const ROOT=path.resolve(__dirname,'../../..');
async function main(argv){
  const base=new URL(argv[0]||'');const ca=argv.includes('--ca')?fs.readFileSync(argv[argv.indexOf('--ca')+1]):undefined;
  const origin=base.origin,secure=base.protocol==='https:',wsBase=(secure?'wss://':'ws://')+base.host+'/mp1/ws?';
  const res=[];const check=async(name,fn)=>{try{const d=await fn();res.push({name,ok:true,d});console.log('PASS '+name+(d?' — '+d:''));}catch(e){res.push({name,ok:false,e:e.message});console.log('FAIL '+name+' — '+e.message);}};
  const get=(p,u=base)=>new Promise((ok,no)=>{const U=new URL(p,u);(U.protocol==='https:'?https:http).get(U,{ca,servername:U.hostname},r=>{const b=[];r.on('data',d=>b.push(d));r.on('end',()=>ok({status:r.statusCode,h:r.headers,body:Buffer.concat(b)}));}).on('error',no);});
  const must=(c,m)=>{if(!c)throw Error(m);};
  await check('sağlık uç noktası /healthz',async()=>{const r=await get('/healthz');must(r.status===200&&r.body.toString()==='{"ok":true}','yanıt '+r.status+' '+r.body);});
  await check('oyun sayfası: MP betikleri, güvenlik başlıkları'+(secure?', HSTS':''),async()=>{const r=await get('/');must(r.status===200,'durum '+r.status);
    must(/mp1-host\.js/.test(r.body),'MP katmanı yok');must(r.h['x-content-type-options']==='nosniff','nosniff yok');if(secure)must(/max-age=\d+/.test(r.h['strict-transport-security']||''),'HSTS yok');});
  await check('runtime dosyaları RELEASE-MANIFEST ile bayt bayt aynı (index.html hariç, enjekte)',async()=>{const m=JSON.parse(fs.readFileSync(path.join(ROOT,'RELEASE-MANIFEST.json')));let n=0;
    for(const [f,h] of Object.entries(m.files)){if(f==='index.html')continue;const r=await get('/'+f);must(r.status===200,f+' '+r.status);must(crypto.createHash('sha256').update(r.body).digest('hex')===(h.sha256||h),f+' farklı');n++;}return n+' dosya, build '+m.build;});
  await check('misafir sayfası /mp/join ve sıkı CSP',async()=>{const r=await get('/mp/join?code=ABCD-EFGH');must(r.status===200,'durum '+r.status);must(/connect-src 'self'/.test(r.h['content-security-policy']||''),'CSP');});
  await check('geliştirme uç noktaları kapalı (/mp/stats 404)',async()=>{const r=await get('/mp/stats');must(r.status===404,'durum '+r.status);});
  if(argv.includes('--http-redirect'))await check('http → https yönlendirmesi',async()=>{const u=new URL(base);u.protocol='http:';u.port='';const r=await get('/mp/join?code=X',u);
    must([301,308].includes(r.status)&&String(r.h.location).startsWith('https://'),'durum '+r.status+' '+r.h.location);});
  let host,key,code;
  await check((secure?'WSS':'WS')+' oda kurma (host)',async()=>{const t0=Date.now();host=await connect(wsBase+'role=host',{origin,ca});must(host.status===101,'el sıkışma '+host.status);
    const m=await host.ctl('room');code=m.code;key=m.key;must(/^[A-Z2-9]{8}$/.test(code)&&key&&key.length>=32,'oda');return (Date.now()-t0)+' ms';});
  let guest,conn;
  await check('misafir koda katılır, mesajlar iki yönde iletilir',async()=>{host.send('C{"cap":1}');const t0=Date.now();guest=await connect(wsBase+'role=client&code='+code.slice(0,4)+'-'+code.slice(4),{origin,ca});
    const w=await guest.ctl('welcome');conn=w.conn;await host.wait(x=>x==='J'+conn);guest.send('{"v":1,"type":"ping","t":1}');await host.wait(x=>x==='F'+conn+'\n{"v":1,"type":"ping","t":1}');
    host.send('T'+conn+'\n{"ok":1}');await guest.wait(x=>x==='H{"ok":1}');must(!guest.msgs.join().includes(key),'anahtar misafirde');return 'katılım+gidiş-dönüş '+(Date.now()-t0)+' ms';});
  await check('yanlış host anahtarı reddedilir (kod tek başına yetmez)',async()=>{const x=await connect(wsBase+'role=host&code='+code,{origin,ca});x.send('Ayanlis');must((await x.ctl('error')).code==='bad-host-key','kabul edildi');x.end();});
  await check('yabancı Origin reddedilir (403)',async()=>{const x=await connect(wsBase+'role=client&code='+code,{origin:'https://kotu.example',ca});must(x.status===403,'durum '+x.status);x.end();});
  await check('oda kapatma: misafir room-closed alır, eski kod "room-closed" der',async()=>{host.send('X');must((await guest.ctl('room-closed')).t==='room-closed','');const x=await connect(wsBase+'role=client&code='+code,{origin,ca});
    must((await x.ctl('error')).code==='room-closed','eski kod');x.end();});
  for(const c of [host,guest])c&&c.end();
  const fail=res.filter(r=>!r.ok).length;console.log((fail?'SMOKE FAIL':'SMOKE PASS')+' '+(res.length-fail)+'/'+res.length);return {ok:!fail,res};
}
module.exports={main};
if(require.main===module)main(process.argv.slice(2)).then(r=>process.exit(r.ok?0:1),e=>{console.error(e.message);process.exit(2);});
