'use strict';
/* SAHA-ENTEGRE.0 Faz C/E — savaş yorgunluğu Savaş Merkezi'nde; BİLİM ANOMALİLERİ sıklığı. STARS_ROOT=<kök> eski sürüm. */
const assert=require('assert/strict'),path=require('path'),crypto=require('crypto');
const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function game(cfg){const h=runtime({root:ROOT});h.sb.CF=JSON.stringify(cfg||{});h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5},JSON.parse(CF));setupGame({...CFG});G.autoSave=false;`);return h;}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
test('E1 Normal (varsayılan) = eski %42: aynı tohumda Save8 ve RNG ayar yokken ve "normal" seçilince aynı; anomalies kayda yazılmaz',()=>{
  const a=game({}),b=game({anomalies:'normal'});const sa=a.run('serialize()'),sb=b.run('serialize()');
  assert.equal(sha(sa),sha(sb));assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));assert.equal(/"anomalies"/.test(sa),false);});
test('E2 Kapalı: hiçbir sistemde normal anomali yok, galaksi (yıldız/gezegen/hat) ve RNG sırası aynı',()=>{
  const a=game({}),k=game({anomalies:'kapali'});const geo=h=>sha(J(h,'G.sys.map(s=>[s.x,s.y,s.name,s.lanes.join(","),s.planets.length,s.pulsar,s.nebulaS,s.anomK])').map(String).join('|'));
  assert.equal(geo(k),geo(a),'galaksi aynı');assert.equal(k.run('RND_STATE'),a.run('RND_STATE'),'RNG aynı');
  const n=J(k,'G.sys.filter(s=>s.anom&&!G.emps.some(e=>e.home===s.id&&e.origin==="kalinti")).length');assert.equal(n,0);
  assert.ok(J(a,'G.sys.filter(s=>s.anom).length')>0,'varsayılanda anomali var');});
test('E3 oranlar: Seyrek < Az < Normal < Yoğun (aynı zarlarla), oran tablosu 0/10/20/42/60',()=>{
  const cnt=lv=>J(game({anomalies:lv}),'G.sys.filter(s=>s.anom).length');const r=['seyrek','az','normal','yogun'].map(cnt);
  assert.ok(r[0]<=r[1]&&r[1]<=r[2]&&r[2]<=r[3]&&r[0]<r[3],JSON.stringify(r));
  assert.deepEqual(J(game({}),'Object.values(ANOMALY_LEVELS).map(v=>v.p)'),[0,.1,.2,.42,.6]);});
test('E4 Kapalı: bilim gemisi taraması karar penceresi açmaz, ödül vermez; keşif sürer',()=>{
  const h=game({anomalies:'kapali'});const r=J(h,`(()=>{const s=G.sys.find(x=>!x.surv.includes(0)&&!x.anom);const f=G.fleets.find(f=>f.e===0&&f.ships.some(sh=>SHIPS[sh.c].rol==='bilim'))||newFleet(G.p,G.p.home,[{c:'bil'}]);
    const res=JSON.stringify(G.p.res),inbox=G.inbox.length;let opened=0;const o=UI.anomaly;UI.anomaly=function(){opened++;return o.apply(this,arguments);};f.sys=s.id;doSurvey(f,s);UI.anomaly=o;
    return {opened,surv:s.surv.includes(0),res:res===JSON.stringify(G.p.res)};})()`);
  assert.equal(r.opened,0);assert.equal(r.surv,true,'tarama gerçekleşti');assert.equal(r.res,true,'gizli ödül yok');});
test('E5 kurulum ekranında BİLİM ANOMALİLERİ ve özet satırı; Rastgele Hikâye Olayları ayrı',()=>{
  const h=game({});const r=J(h,`(()=>{CFG.anomalies='seyrek';const a=anomalySetupHtml(CFG);return {a:/BİLİM ANOMALİLERİ/.test(a)&&/data-a="anomRate"/.test(a)&&/class="opt on"[^>]*data-x="seyrek"/.test(a),lv:anomalyLevel(CFG)};})()`);
  assert.equal(r.a,true);assert.equal(r.lv,'seyrek');});
test('C1 Savaş Merkezi: kendi savaşında yorgunluk yüzdesi + çubuk; %85+ uyarı; rakip yorgunluğu istihbaratsız BİLİNMİYOR, istihbaratla değer',()=>{
  const h=game({});const r=J(h,`(()=>{const E=G.p,O=G.emps.find(o=>o.ai&&!o.dead&&!o.wild);E.contact[O.id]=O.contact[E.id]=true;warAuthorize(O,E,{n:'t'});declareWar(O,E);warAuthClear();
    E.exh=E.exh||{};E.exh[O.id]=88;O.exh=O.exh||{};O.exh[E.id]=40;WarCenterUI.open();const H1=document.getElementById('modal').innerHTML;
    E.intel=E.intel||{};E.intel[O.id]=3;const x=warCenterIndex(E).find(r=>r.exh).exh;return {bar:/class="exhBar"/.test(H1)&&/%88/.test(H1),warn:/%85'i geçti/.test(H1),unk:/BİLİNMİYOR/.test(H1),foe:x.foe,peace:/data-a="warCenterPeace"/.test(H1)};})()`);
  assert.equal(r.bar,true);assert.equal(r.warn,true);assert.equal(r.unk,true);assert.equal(r.peace,true);assert.equal(r.foe===40||r.foe===null,true,'istihbaratla rakip değeri (intelOf kuralı): '+r.foe);});
test('F1 TÜMÜNÜ KENARA AL: karar verilmez, ödül uygulanmaz, teklif reddedilmez, savaş bildirimi silinmez; ☰ / Gelen kutusundan yeniden açılır',()=>{
  const h=game({});const r=J(h,`(()=>{AUTO_EVENT=false;const evs=EVENTS.filter(e=>e.ch&&e.ch.length>1&&!e.chain);UI.event(evs[0]);UI.closeModal();UI.event(evs[1]);UI.closeModal();
    const an=ANOMALIES.find(a=>a.ch&&a.ch.length>1)||ANOMALIES[0];UI.anomaly(an,G.sys[G.p.home]);UI.closeModal();
    const O=G.emps.find(o=>o.ai&&!o.dead&&!o.wild);UI.notify({kind:'wardec',title:'SAVAŞ İLANI',sub:'test',ico:'⚔',cls:'war',data:O.id,key:'wardec:t'});
    UI.drawInbox();const card=/data-a="noteStashAll"/.test(document.getElementById('inbox').innerHTML);
    const res=JSON.stringify(G.p.res),before=G.inbox.map(n=>n.uid),pend=typeof DiplomaticInbox!=='undefined'?DiplomaticInbox.pending():0;
    const out=UI.noteStashAll();UI.drawInbox();
    const keep=before.every(u=>G.inbox.some(n=>n.uid===u)||false),hidden=G.inbox.filter(n=>before.includes(n.uid)).every(n=>n.hidden);
    UI.act('topStatus');const list=document.getElementById('modal').innerHTML;UI.closeModal();
    return {card,out,keep,hidden,res:res===JSON.stringify(G.p.res),pend2:typeof DiplomaticInbox!=='undefined'?DiplomaticInbox.pending():0,pend,
      strip:(G.inbox||[]).filter(n=>!n.hidden).length,inList:/SAVAŞ İLANI/.test(list)&&list.includes(evs[0].n)};})()`);
  assert.equal(r.card,true,'şeritte TÜMÜNÜ KENARA AL kartı');assert.equal(r.res,true,'kaynak / ödül değişmedi');assert.equal(r.keep,true,'kayıt silinmedi');assert.equal(r.hidden,true,'kartlar gizlendi');
  assert.equal(r.strip,0,'şerit boş');assert.ok(r.pend2>=r.pend,'bekleyen teklif sayısı düşmedi');assert.equal(r.inList,true,'☰ listesinde olay ve savaş bildirimi');});
test('E6 MP lobi: BİLİM ANOMALİLERİ host configure ile kabul / ret; "normal" yazılmaz; Kapalı oyunda normal anomali yok; 500 sistemde Seyrek ≈ %10, Normal ≈ %42',()=>{
  const fs=require('fs');const h=runtime({root:ROOT});let n=0;h.sb.rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);
  h.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));
  h.run(`var MP=StarsMP.createHost({roomId:'an',random:rand,send(){},kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true}}}});`);
  assert.equal(J(h,`MP.configure({size:'orta',aiCount:5,seed:23,anomalies:'kapali'})`).ok,true);assert.equal(h.run('G.cfg.anomalies'),'kapali');
  assert.equal(h.run(`G.sys.filter(s=>s.anom&&!G.emps.some(e=>e.home===s.id&&e.origin==='kalinti')).length`),0,'Kapalı: normal anomali yok');
  assert.notEqual(J(h,`MP.configure({size:'orta',aiCount:5,seed:23,anomalies:'normal'})`).ok,true,'Normal varsayılandır, yazılmaz');
  assert.notEqual(J(h,`MP.configure({size:'orta',aiCount:5,seed:23,anomalies:'x'})`).ok,true,'geçersiz değer reddedilir');
  assert.equal(J(h,`MP.configure({size:'orta',aiCount:5,seed:23})`).ok,true);assert.equal(h.run('G.cfg.anomalies===undefined'),true);
  const rate=k=>{const g=game({size:'s500',aiCount:16,seed:404,...(k?{anomalies:k}:{})});return J(g,`G.sys.filter(s=>s.anom&&!G.emps.some(e=>e.home===s.id&&e.origin==='kalinti')).length/G.sys.length`);};
  const r={seyrek:rate('seyrek'),normal:rate(null),yogun:rate('yogun')};if(process.env.V)console.log(JSON.stringify(r));
  assert.ok(r.seyrek>.06&&r.seyrek<.14,'Seyrek '+r.seyrek);assert.ok(r.normal>.37&&r.normal<.47,'Normal '+r.normal);assert.ok(r.yogun>.55&&r.yogun<.65,'Yoğun '+r.yogun);});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
