'use strict';
/* SAHA-GÜVENCE.1 Faz D — olay / anomali kalan denetimleri. STARS_ROOT=<kök> eski sürüm.
   D1 MP lobi: host'un kurulum ekranındaki "Rastgele Hikâye Olayları" (CFG.randomEvents) mp-core generate yolunda G.cfg'ye taşınır;
      kapalıyken rastgele hikâye olayı doğmaz, bilim anomalileri ayrı ayardır (Normal'de anomali sistemleri sürer); MP paketi kaydı → yükleme ayarı korur.
   D2 TÜMÜNÜ KENARA AL karar bekleyen olayları sonuçlandırmaz; Save8 → yükleme sonrası kayıt yerinde (yeniden açılabilir).
   D3 MP akıllı duraklatma: kenara alınan karar kartının belirteci kalıcı kilit üretmez (açık hız komutu belirteci görür; varsayılan karar sınırı 1×). */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function mpHost(extra){const h=runtime({root:ROOT});let n=0;h.sb.out=[];h.sb.rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);
  h.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));h.run(fs.readFileSync(path.join(ROOT,'research/mp6/mirror.js'),'utf8'));
  /* mp1-host.js generate ile aynı: host CFG'si (kurulum ekranı) varsayılan, lobi ayarları üstüne */
  h.run(`resetSetupNaming();${extra||''}var MP=StarsMP.createHost({roomId:'sg1d',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(set){const {host:_h,...rest}=set,{aiRivals:_r,tension:_t,anomalies:_a,...defaults}=CFG;setupGame({...defaults,...rest});G.autoSave=false;return {ok:true}}}});
    MP.installGuards();MP.setCapacity(2);MP.configure({size:'orta',aiCount:5,seed:22});MP.onMessage('B',JSON.stringify({v:1,type:'hello',name:'B'}));MP.onMessage('B',JSON.stringify({v:1,type:'claim',empire:1}));MP.onMessage('B',JSON.stringify({v:1,type:'ready',value:true}));
    if(!MP.start().ok)throw Error('start');`);return h;}
const STEP=`var __m=n=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+n&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};`;

test('D1 MP: host CFG.randomEvents=false → G.cfg.randomEvents false; 24 ayda rastgele hikâye olayı yok; anomali sistemleri (Normal) yerinde; paket kaydı → yükleme ayarı korur',()=>{
  const h=mpHost('CFG.randomEvents=false;');h.run(STEP+`var evs=0;const __ev=UI.event;UI.event=function(){evs++;return __ev.apply(this,arguments);};var __me=typeof maybeEvent==='function'?maybeEvent:null;`);
  const r0=J(h,`{re:G.cfg.randomEvents,anom:G.sys.filter(s=>s.anom).length,me:__me?__me():'yok'}`);
  assert.equal(r0.re,false,'G.cfg.randomEvents');assert.ok(r0.anom>0,'Normal anomali sistemleri sürer (ayrı ayar)');assert.ok(r0.me===undefined||r0.me===null,'maybeEvent kapalı (dönüş yok)');
  h.run('__m(24)');const r1=J(h,`{evs,chain:(G.chainQueue||[]).length}`);assert.equal(r1.evs,0,'rastgele hikâye olayı penceresi açılmadı');
  const snap=J(h,'MP.snapshot()');assert.equal(snap.ok,true);const g=runtime({root:ROOT});g.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));g.sb.pk=JSON.stringify(snap.pkg);
  assert.equal(J(g,`(()=>{const p=JSON.parse(pk);StarsMP.loadWorld(p);return G.cfg.randomEvents;})()`),false,'yüklemede ayar korunur');});

test('D1b karşı kontrol: randomEvents açık + BİLİM ANOMALİLERİ Kapalı → anomali sistemi yok, hikâye olayları açık (iki ayar bağımsız)',()=>{
  const h=mpHost('CFG.randomEvents=true;');const before=J(h,'{re:G.cfg.randomEvents!==false}');
  const h2=runtime({root:ROOT});h2.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5,anomalies:'kapali',randomEvents:true});setupGame({...CFG});`);
  const r=J(h2,`{re:G.cfg.randomEvents!==false,anom:G.sys.filter(s=>s.anom&&!G.emps.some(e=>e.home===s.id&&e.origin==='kalinti')).length}`);
  assert.equal(before.re,true);assert.equal(r.re,true,'hikâye olayları açık');assert.equal(r.anom,0,'anomali kapalı');});

test('D2 TÜMÜNÜ KENARA AL: karar bekleyen iki olay sonuçlanmaz; Save8 → yükleme sonrası iki kayıt hâlâ yerinde, karar verilmemiş',()=>{
  const h=runtime({root:ROOT});h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;AUTO_EVENT=false;
    var evs=EVENTS.filter(e=>e.ch&&e.ch.length>1&&!e.chain).slice(0,2);for(const e of evs){UI.event(e);UI.closeModal();}UI.drawInbox();var res0=JSON.stringify(G.p.res);`);
  const a=J(h,`(()=>{const n0=G.inbox.filter(n=>n.kind==='event').length;UI.noteStashAll();return {n0,vis:G.inbox.filter(n=>!n.hidden).length,ev:G.inbox.filter(n=>n.kind==='event').length,res:JSON.stringify(G.p.res)===res0};})()`);
  assert.ok(a.n0>=2,'iki olay kartı');assert.equal(a.vis,0,'görünür kart yok');assert.equal(a.ev,a.n0,'olay kayıtları silinmedi');assert.equal(a.res,true,'ödül / karar uygulanmadı');
  const s=h.run('serialize()');const g=runtime({root:ROOT});g.sb.s=s;assert.equal(g.run('deserialize(s)'),true);
  const b=J(g,`{ev:G.inbox.filter(n=>n.kind==='event').length}`);assert.equal(b.ev,a.n0,'yüklemeden sonra kararlar hâlâ bekliyor (☰ / kart olarak yeniden açılabilir)');});

test('D3 akıllı duraklatma: kenara alınan karar kartı (G.inbox\'ta gizli) belirteci kalıcı kilit değildir — açık hız komutu görür; varsayılan karar sınırı 1×',()=>{
  const h=runtime({root:ROOT});h.run(fs.readFileSync(path.join(ROOT,'research/mp63/client/mp63-pause.js'),'utf8'));
  const r=J(h,`(()=>{const P=StarsPause.create({want:2});const inbox=new Set([7]);P.decPending(7,0);P.reconcile(u=>inbox.has(u),false);const held=P.effective();
    const c=P.command(2);const after=P.effective();const Q=StarsPause.create({want:2});Q.decPending(8,1);Q.reconcile(u=>true,false);return {held,acked:c.acked,after,deflt:Q.effective()};})()`);
  assert.equal(r.held,0,'"karar gelince duraklat" tercihinde bekler');assert.equal(r.acked,1,'Oynat komutu gizli kararı görüldü sayar');assert.equal(r.after,2,'kilit yok');assert.equal(r.deflt,1,'varsayılan: en düşük etkin hız, duraklatma değil');});

console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
