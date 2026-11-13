'use strict';
/* MP-P0-DESYNC2 — bağlantı kaybında GEÇİCİ AI KORUMASI (oda seçeneği, varsayılan kapalı). Host'un gerçek motoru Node vm'de; MP.7 tasarım
   kipi (host = 0, misafirler 1, 2), orta galaksi, 5 AI, seed 22. Saat (opts.now) test tarafından ilerletilir; nabız (pulse) her 2 sn.
   FİKSTÜR (açıkça): misafir 1 ile bir AI devleti savaşta; AI'nın güçlendirilmiş savaş filosu misafir 1'in ana sistemindedir; misafir 1'e
   ana sisteme komşu bir dost sistem verilir (güvenli geri çekilme hedefi). Oyun hızı 1 (akıyor) ya da 0 (duraklatılmış). */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIRROR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
function rnd(n0){let n=n0;return k=>crypto.createHash('sha256').update('gd:'+(n++)).digest('hex').slice(0,k*2);}
const DRAFT=(name,mizac)=>({name,race:'klan',mizac,physio:'avian',look:'surungen',origin:'standart',sigil:'simetrik',ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],traits:[]});
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const take=(h,conn)=>{const o=h.sb.__out.filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));h.sb.__out=h.sb.__out.filter(([c])=>c!==conn);return o;};
function cmd(h,conn,c){h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);const s=h.run(`seq[${JSON.stringify(conn)}]`),cid='gd'+conn+String(s).padStart(6,'0');
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s+1000,cid,cmd:c}))})`);
  return h.sb.__out.filter(([k])=>k===conn).map(([,t])=>JSON.parse(t)).filter(m=>m.type==='result'&&m.cid===cid).at(-1);}
function world(guard,o={}){
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.sb.__T=1e6;h.run(MIRROR);h.run(CORE);
  h.sb.__D=DRAFT('Kızıl Muhafız','militarist');h.sb.__G=[DRAFT('Saf Akıl Ağı','teknokrasi'),DRAFT('Yeşil Birlik','tuccar')];
  h.run(`var MP=StarsMP.createHost({roomId:'gd',random:__rand,now:()=>__T,send:(c,t)=>__out.push([c,t]),kick(){},mirrorMs:0,lobby:{design:true,hostDraft:()=>__D,generate(s){const{host,...rest}=s;setupGame({...CFG,...__D,...rest});G.autoSave=false;return{ok:true};}}});
    MP.installGuards();MP.setCapacity(3);var __cfg=MP.configure({size:'orta',aiCount:5,seed:22});var __g=MP.setGuard(${!!guard});
    __G.forEach((d,i)=>{const c='g'+i;MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:'G'+i}));MP.onMessage(c,JSON.stringify({v:1,type:'draft',rev:1,draft:d}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));});
    var __st=MP.start();__G.forEach((d,i)=>MP.onMessage('g'+i,JSON.stringify({v:1,type:'ui',mode:'stars'})));var seq={};G.speed=1;`);
  assert.deepEqual(J(h,'[__cfg,__g,__st]'),[{ok:true},{ok:true},{ok:true}]);
  /* tehdit fikstürü: devlet 1 ↔ AI savaşta; AI'nın en güçlü savaş filosu (gemileri 6 kat) devlet 1'in ana sisteminde; ana sisteme komşu bir dost sistem */
  h.sb.__fx=J(h,`(()=>{const e=G.emps[1],home=G.sys[e.home],ai=G.emps.find(x=>x.ai&&!x.dead&&!x.wild&&!x.crisisSide&&x.id>2);e.war[ai.id]=true;ai.war[e.id]=true;e.contact[ai.id]=true;ai.contact[e.id]=true;
    const af=G.fleets.filter(f=>f.e===ai.id&&isArmed(f)&&f.ships.length).sort((a,b)=>fleetPower(b)-fleetPower(a))[0];const base=af.ships.slice();for(let i=0;i<5;i++)for(const sh of base)af.ships.push(JSON.parse(JSON.stringify(sh)));
    af.sys=home.id;af.mv=null;af.path=[];af.x=home.x;af.y=home.y;
    /* güvenli dost sistem: komşu boş sistemde motorun kendi doColonize'ıyla koloni (sahiplik gerçek döngüde de kalır) */
    const safe=home.lanes.map(i=>G.sys[i]).find(s=>s.owner<0&&s.planets.some(p=>!(p.owner>=0)&&!p.col))||home.lanes.map(i=>G.sys[i]).find(s=>s.planets.some(p=>!(p.owner>=0)&&!p.col));doColonize(e,safe,safe.planets.find(p=>!(p.owner>=0)&&!p.col));
    const mine=G.fleets.filter(f=>f.e===e.id&&f.sys===home.id&&!f.mv&&f.ships.length);
    return {e:e.id,ai:ai.id,home:home.id,safe:safe.id,enemy:af.id,mine:mine.map(f=>f.id),free:mine.filter(f=>!f.path.length&&!f.ord&&!f.explore&&!f.auto).map(f=>f.id),tasked:mine.filter(f=>f.path.length||f.ord||f.explore||f.auto).map(f=>f.id),enemyPow:fleetPower(af),minePow:mine.filter(isArmed).reduce((a,f)=>a+fleetPower(f),0)};})()`);
  h.run('MP.publish()');take(h,'g0');take(h,'g1');
  return h;
}
const tick=(h,sec,spd=1)=>{for(let t=0;t<sec;t+=2){h.run(`G.speed=${spd};__T+=2000;MP.pulse()`);}};
const st=(h,conn)=>J(h,`MP.guardState([...MP.state.players.values()].find(p=>p.empireId===${conn==='g0'?1:2}).playerId)`);
const journalGuard=h=>J(h,`MP.state.journal.filter(r=>String(r.playerId).startsWith('guard:')).map(r=>({kind:r.cmd.kind,fleet:r.cmd.fleet,to:r.cmd.to,emp:r.empireId}))`);
const tokenOf=(h,e)=>J(h,`[...MP.state.players.values()].find(p=>p.empireId===${e}).token`);
const reconnect=(h,conn,e)=>{h.run(`MP.onMessage(${JSON.stringify(conn)},JSON.stringify({v:1,type:'hello',name:'G',token:${JSON.stringify(tokenOf(h,e))}}));MP.onMessage(${JSON.stringify(conn)},JSON.stringify({v:1,type:'ui',mode:'stars'}))`);};
const synced=(h,conn,m)=>h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'synced',...m}))})`);

test('G0 fikstür: tehdit gerçekten var (düşman gücü > kendi gücü), güvenli dost sistem komşu',()=>{
  const h=world(true),fx=h.sb.__fx;assert(fx.enemyPow>fx.minePow,'düşman üstün: '+JSON.stringify(fx));assert(fx.mine.length>=1);assert.notEqual(fx.safe,fx.home);
});
test('G1 seçenek KAPALI: 60 sn kopma + akan oyun → koruma yok, AI emri yok, kimseye koruma iletisi yok (P26 davranışı)',()=>{
  const h=world(false);h.run(`MP.onLeave('g0')`);tick(h,60);
  assert.equal(st(h,'g0').active,false);assert.deepEqual(journalGuard(h),[]);
  assert(!take(h,'g1').some(m=>m.type==='guardNote'||m.type==='guard'));assert.equal(J(h,'MP.lobbyView().guard===true'),false,'lobide seçenek kapalı');
});
test('G2 seçenek AÇIK, kısa sorun: 20 sn kopma → dönüş; 20 sn "dünya güncel değil" → düzelme: koruma başlamaz (sayaç sıfırlanır)',()=>{
  const h=world(true);h.run(`MP.onLeave('g0')`);tick(h,20);assert.equal(st(h,'g0').active,false);assert(st(h,'g0').wait>=16000&&st(h,'g0').wait<=20000);
  reconnect(h,'g0b',1);tick(h,2);assert.equal(st(h,'g0').wait,0,'dönünce sayaç sıfır');tick(h,40);assert.equal(st(h,'g0').active,false);
  synced(h,'g0b',{rev:1,full:false,stale:true});for(let i=0;i<5;i++){tick(h,4);synced(h,'g0b',{rev:1,full:false,stale:true});}assert.equal(st(h,'g0').active,false);
  synced(h,'g0b',{rev:2,full:false,stale:false});tick(h,30);assert.equal(st(h,'g0').active,false,'düzelme sayacı sıfırlar');assert.deepEqual(journalGuard(h),[]);
});
test('G3 duraklatma sayacı ilerletmez: 90 sn kopma hız 0 → koruma yok; hız 1\'de 30 sn → yalnız etkilenen devlet korumaya geçer, öteki misafir oynar',()=>{
  const h=world(true);h.run(`MP.onLeave('g0')`);tick(h,90,0);assert.equal(st(h,'g0').active,false);assert.equal(st(h,'g0').wait,0);
  h.run(`MP.setPaused(true,'host')`);tick(h,40,1);assert.equal(st(h,'g0').active,false,'host duraklatması da sayılmaz');h.run(`MP.setPaused(false)`);
  tick(h,28);assert.equal(st(h,'g0').active,false);tick(h,4);const s=st(h,'g0');assert.equal(s.active,true);assert.equal(s.reason,'offline');
  assert.equal(st(h,'g1').active,false,'öteki misafir korumada değil');
  const notes=take(h,'g1');assert(notes.some(m=>m.type==='guardNote'&&m.on===true),'odaya durum bildirimi');
  assert.equal(J(h,`MP.lobbyView().players.filter(p=>p.guarded).length`),1);
  const c=J(h,`(()=>{const e=G.emps[2],s=G.sys[e.home];for(const k of Object.keys(e.res))e.res[k]=Math.max(e.res[k],2000);return {kind:'ship',sys:s.id,key:'kor'};})()`);
  assert.equal(cmd(h,'g1',c).status,'ok','öteki misafirin emri işlenir');
});
test('G4 koruma: yalnız tehdit altındaki filo mevcut move yoluyla güvenli dost sisteme çekilir; harcama / üretim / savaş / diplomasi yok',()=>{
  const h=world(true),fx=h.sb.__fx;const before=J(h,`(()=>{const e=G.emps[1];return {res:{...e.res},q:G.sys.filter(s=>s.owner===1).map(s=>(s.queue||[]).length),war:Object.keys(e.war).filter(k=>e.war[k]).sort(),ally:JSON.stringify(e.ally||{}),ai:e.ai,offers:MP.dip.offers.length,feds:(G.feds||[]).length};})()`);
  h.run(`MP.onLeave('g0')`);tick(h,34);assert.equal(st(h,'g0').active,true);   // 30. sn'deki nabızda başlar, ilk geri çekilme bir sonraki nabızda
  const jg=journalGuard(h);assert(jg.length>=1,'geri çekilme emri verildi');assert(jg.every(r=>r.kind==='move'&&r.emp===1&&fx.mine.includes(r.fleet)),JSON.stringify(jg));
  assert(jg.every(r=>r.to!==fx.home),'tehditli sisteme değil');
  const paths=J(h,`${JSON.stringify(fx.free)}.map(id=>{const f=G.fleets.find(x=>x.id===id);return f?(f.path.at(-1)??(f.mv?f.mv.to:f.sys)):null;})`);
  assert(fx.free.length>=1&&paths.every(t=>t!==fx.home),'emri olmayan kendi filoları tehditten uzaklaşıyor: '+JSON.stringify(paths));
  assert(jg.every(r=>!fx.tasked.includes(r.fleet)),'oyuncunun görevli filosuna (keşif / rota) dokunulmaz: '+JSON.stringify({jg,tasked:fx.tasked}));
  tick(h,10);assert.equal(journalGuard(h).length,jg.length,'sürmekte olan geri çekilme yinelenmez');
  const after=J(h,`(()=>{const e=G.emps[1];return {res:{...e.res},q:G.sys.filter(s=>s.owner===1).map(s=>(s.queue||[]).length),war:Object.keys(e.war).filter(k=>e.war[k]).sort(),ally:JSON.stringify(e.ally||{}),ai:e.ai,offers:MP.dip.offers.length,feds:(G.feds||[]).length};})()`);
  assert.deepEqual(after,before,'kaynak, kuyruk, savaş, ittifak, AI bayrağı, teklif, federasyon değişmedi');
  assert.equal(J(h,`[...MP.state.players.values()].find(p=>p.empireId===1).empireId`),1,'koltuk ve devlet oyuncuda');
});
test('G5 iade: eski oturum bildirimi / eski revizyon / "güncel değil" iade etmez; bu bağlantının TAM aynası uygulanınca iade; ilk insan emri tam bir kez; AI yeni emir vermez; özet gider',()=>{
  const h=world(true);h.run(`MP.onLeave('g0')`);tick(h,34);assert.equal(st(h,'g0').active,true);const n0=journalGuard(h).length;
  reconnect(h,'g0b',1);const first=take(h,'g0b'),full=first.filter(m=>m.type==='mirror').at(-1);assert(full,'dönüşte TAM ayna');
  assert(first.every(m=>m.type!=='guard'||m.on!==false),'bağlanmak tek başına iade etmez');
  const shipC=J(h,`(()=>{const e=G.emps[1],s=G.sys[e.home];for(const k of Object.keys(e.res))e.res[k]=Math.max(e.res[k],3000);return {kind:'ship',sys:s.id,key:'kor'};})()`),q0=J(h,`(G.sys[${shipC.sys}].queue||[]).length`);
  assert.equal(cmd(h,'g0b',shipC).code,'guard-active','koruma sürerken insan emri reddedilir');
  assert.equal(cmd(h,'g0b',{kind:'internalQuote',sys:shipC.sys,planet:0,policy:'relief'}).status,'ok','salt okuma serbest');
  synced(h,'g0',{rev:full.rev,full:true,stale:false});assert.equal(st(h,'g0').active,true,'eski bağlantının bildirimi yok sayılır');
  synced(h,'g0b',{rev:full.rev-1,full:true,stale:false});assert.equal(st(h,'g0').active,true,'eski revizyon iade etmez');
  synced(h,'g0b',{rev:full.rev,full:true,stale:true});assert.equal(st(h,'g0').active,true,'"güncel değil" iade etmez');
  h.run('__T+=6000;MP.publish()');take(h,'g0b');synced(h,'g0b',{rev:full.rev+1,full:false,stale:false});assert.equal(st(h,'g0').active,true,'fark üstünden kurulan dünya iade etmez');
  const re=take(h,'g0b').filter(m=>m.type==='mirror').at(-1);assert(re,'host bu bağlantıya yeniden TAM ayna gönderdi');
  synced(h,'g0b',{rev:re.rev,full:true,stale:false});const s=st(h,'g0');assert.equal(s.active,false,'iade');assert(s.last&&s.last.actions.length>=1);
  const back=take(h,'g0b').find(m=>m.type==='guard'&&m.on===false);assert(back&&back.actions.length>=1&&back.orders>=1,'dönen oyuncuya özet');
  assert.deepEqual(Object.keys(back.actions[0]).sort(),['day','fleet','from','to']);
  const r=cmd(h,'g0b',shipC);assert.equal(r.status,'ok');assert.equal(J(h,`(G.sys[${shipC.sys}].queue||[]).length`),q0+1,'tam bir kez');
  const dup=h.run(`MP.onMessage('g0b',${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:999999,cid:r.cid,cmd:shipC}))})`);assert.equal(J(h,`(G.sys[${shipC.sys}].queue||[]).length`),q0+1,'aynı cid ikinci kez uygulanmaz');
  const n1=journalGuard(h).length;tick(h,20);assert.equal(journalGuard(h).length,n1,'iade sonrası AI emir vermez');assert(n1>=n0);
  synced(h,'g0b',{rev:re.rev,full:true,stale:false});assert.equal(st(h,'g0').active,false);
});
test('G6 tekrarlı kopma: iadeden sonra yeni kopmada sayaç sıfırdan; kayıttan devam: seçenek pakette korunur, zamanlayıcı/eski bildirim taşınmaz; eski paket kapalı başlar',()=>{
  const h=world(true);h.run(`MP.onLeave('g0')`);tick(h,32);reconnect(h,'g0b',1);const full=take(h,'g0b').filter(m=>m.type==='mirror').at(-1);synced(h,'g0b',{rev:full.rev,full:true,stale:false});assert.equal(st(h,'g0').active,false);
  h.run(`MP.onLeave('g0b')`);tick(h,20);assert.equal(st(h,'g0').active,false,'yeni kopma: sayaç sıfırdan');tick(h,12);assert.equal(st(h,'g0').active,true);
  const pkg=JSON.parse(h.run('JSON.stringify(MP.snapshot({}).pkg)'));assert.equal(pkg.session.settings.aiGuard,true);assert.equal(pkg.mpVersion,4);assert.equal(JSON.parse(pkg.save8).v,8);
  const r=runtime({root});r.sb.__rand=rnd(77);r.sb.__out=[];r.sb.__T=5e6;r.run(MIRROR);r.run(CORE);r.sb.__p=JSON.stringify(pkg);
  r.run(`var V=StarsMP.validatePackage(__p);var LW=StarsMP.loadWorld(V.pkg);var MP=StarsMP.createHost({roomId:'gd2',random:__rand,now:()=>__T,send:(c,t)=>__out.push([c,t]),kick(){},mirrorMs:0,lobby:{design:true,hostDraft:()=>null,generate(){return {ok:false};}},resume:V.pkg});MP.installGuards();`);
  assert.deepEqual(J(r,'[V.ok,LW.ok,MP.lobbyView().guard,MP.lobby.guard]'),[true,true,true,true]);
  assert.deepEqual(J(r,`[...MP.state.players.values()].filter(p=>p.playerId!=='host').map(p=>[p.empireId,!!p.guard,p.guardWait|0,!!p.sync])`),[[1,false,0,false],[2,false,0,false]],'koruma durumu / sayaç / eski bildirim pakete girmez');
  /* eski (p26) biçimli paket: aiGuard yok → kapalı; yanlış değer reddedilir */
  const old=JSON.parse(JSON.stringify(pkg));delete old.session.settings.aiGuard;const s8=old.save8;const bodyOf=x=>{const {save8,integrity,...b}=x;return b;};
  const fix=x=>{const b=bodyOf(x);x.integrity={alg:'SHA-256',save8:J(r,`StarsMP.sha256(${JSON.stringify(s8)})`),body:''};x.integrity.body=J(r,`StarsMP.sha256(StarsMP.canon(${JSON.stringify({...b,save8:x.integrity.save8})}))`);return JSON.stringify(x);};
  r.sb.__o=fix(old);assert.deepEqual(J(r,`(()=>{const V=StarsMP.validatePackage(__o);if(!V.ok)return V.why;const L=StarsMP.loadWorld(V.pkg);const M=StarsMP.createHost({roomId:'gd3',random:__rand,now:()=>__T,send(){},kick(){},lobby:{design:true,hostDraft:()=>null,generate(){return {ok:false};}},resume:V.pkg});return [L.ok,!!M.lobby.guard];})()`),[true,false]);
  const bad=JSON.parse(JSON.stringify(pkg));bad.session.settings.aiGuard=false;r.sb.__b=fix(bad);assert.equal(J(r,'StarsMP.validatePackage(__b).ok'),false);
  /* devam: oyun başlayınca dönmeyen koltuk sayaçla yeniden değerlendirilir */
  r.run(`MP.resumeStart();G.speed=1;`);for(let i=0;i<16;i++)r.run('__T+=2000;MP.pulse()');
  assert.equal(J(r,`MP.guardState([...MP.state.players.values()].find(p=>p.empireId===1).playerId).active`),true,'devamda dönmeyen oyuncu 30 sn sonra korunur');
});
end();
