'use strict';
/* MP-P0 — misafir donması / etkisiz emir / "Kayıt bozuk" (gerçek Render kullanıcı raporu, 12 Kasım 2026).
   Host'un gerçek STARS motoru Node vm'de; MP.7 tasarım kipi (host = devlet 0, misafirler 1..k), orta galaksi, 5 AI, seed 22.
   A) Yayın zinciri hata yalıtımı: bir misafirin aynası / bir süpürme istisna atınca ÖTEKİ misafir dünya almaya devam eder, komut ACK'i
      gider, hata sayılır, arıza kalkınca arızalı misafire TAM ayna gider. (Düzeltmeden önce: publish() istisna atar, kimseye dünya gitmez.)
   B) Nabız (pulse): yalnız sayaçlar; misafir eksik aynayı (mrev) ve host yayın hatasını (mfail) bununla görür.
   C) Düz Save8 türleri: misafir aynası / host MP kaydı / tek oyunculu kayıt ayrı nedenle reddedilir ("fields" değil).
   D) Host'un oyun içi Save8'i → devam paketi → yeni vm'de yükleme → devam lobisi → ziyaretçi → host koltuğa atar → aynı gün, aynı devlet;
      misafir aynası hiçbir yoldan host kaydına dönüşmez; koltuk kimliği kendiliğinden eşleşmez (güvenlik gevşemez). */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIRROR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();MP.observeHumans();}}}';
function rnd(n0){let n=n0;return k=>crypto.createHash('sha256').update('p0:'+(n++)).digest('hex').slice(0,k*2);}
const DRAFT=(name,mizac)=>({name,race:'klan',mizac,physio:'avian',look:'surungen',origin:'standart',sigil:'simetrik',ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],traits:[]});
function world(guests=2){
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.run(MIRROR);h.run(CORE);
  h.sb.__D=DRAFT('Kızıl Muhafız','militarist');h.sb.__G=[DRAFT('Saf Akıl Ağı','teknokrasi'),DRAFT('Yeşil Birlik','tuccar')].slice(0,guests);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'p0',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},mirrorMs:0,lobby:{design:true,hostDraft:()=>__D,generate(s){const{host,...rest}=s;setupGame({...CFG,...__D,...rest});G.autoSave=false;return{ok:true};}}});
    MP.installGuards();MP.setCapacity(${guests+1});var __cfg=MP.configure({size:'orta',aiCount:5,seed:22});
    __G.forEach((d,i)=>{const c='g'+i;MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:'G'+i}));MP.onMessage(c,JSON.stringify({v:1,type:'draft',rev:1,draft:d}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));});
    var __st=MP.start();__G.forEach((d,i)=>MP.onMessage('g'+i,JSON.stringify({v:1,type:'ui',mode:'stars'})));var seq={};`);
  assert.deepEqual(JSON.parse(h.run('JSON.stringify([__cfg,__st])')),[{ok:true},{ok:true}]);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const take=(h,conn)=>{const o=h.sb.__out.filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));h.sb.__out=h.sb.__out.filter(([c])=>c!==conn);return o;};
function cmd(h,conn,c){h.run(`seq.${conn}=(seq.${conn}||0)+1`);const s=h.run('seq.'+conn),cid='p0cmd'+conn+String(s).padStart(5,'0');
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid,cmd:c}))})`);
  return h.sb.__out.filter(([k])=>k===conn).map(([,t])=>JSON.parse(t)).filter(m=>m.type==='result'&&m.cid===cid).at(-1);}
const shipCmd=h=>J(h,`(()=>{const e=G.emps[1],s=G.sys[e.home];return {kind:'ship',sys:s.id,key:'kor'};})()`);

test('A1 bir misafirin aynası kurulamıyor: öteki misafir dünya almaya devam eder, emir ACK\'i ve etkisi gider, hata sayılır; arıza kalkınca TAM ayna',()=>{
  const h=world(2);take(h,'g0');take(h,'g1');
  /* arıza: yalnız devlet 2'nin (g1) aynası istisna atar — gerçekte belirli bir dünya durumunda bir oyuncunun görünümü bozulabilir */
  h.run(`var __build=StarsMirror.build,__bad=true;StarsMirror.build=function(id){if(__bad&&id===2)throw Error('ayna arızası');return __build.apply(this,arguments);};`);
  assert.doesNotThrow(()=>h.run('step(3);MP.publish()'),'publish bir oyuncunun aynası yüzünden istisna atmamalı');
  const a=take(h,'g0'),b=take(h,'g1');
  assert(a.some(m=>m.type==='mirrorDelta'||m.type==='mirror'),'sağlam misafir (g0) ayna almaya devam eder');
  assert(!b.some(m=>m.type==='mirrorDelta'||m.type==='mirror'),'arızalı misafire (g1) ayna gidemez');
  assert(b.some(m=>m.type==='delta'||m.type==='snapshot'),'arızalı misafirin MP.2 görünümü (ayrı aşama) yine gider');
  const st=J(h,'({n:MP.stats.publishErrors|0,e:MP.stats.lastPublishError})');assert(st.n>=1);assert.equal(st.e.stage,'mirror');assert.equal(st.e.msg,'ayna arızası');assert.equal(st.e.seat,2);
  /* sağlam misafirin emri: host kabul eder, etkisi kendi aynasına yansır */
  const c=shipCmd(h),q0=J(h,`(G.sys[${c.sys}].queue||[]).length`),r=cmd(h,'g0',c);assert.equal(r.status,'ok');
  assert.equal(J(h,`(G.sys[${c.sys}].queue||[]).length`),q0+1,'tam bir kez uygulandı');
  assert(take(h,'g0').some(m=>m.type==='mirrorDelta'&&JSON.stringify(m.ops).includes('"q"')),'tersane sırası sağlam misafirin aynasına yansıdı');
  /* nabız: arızalı misafir kendi durumunu görür */
  h.run('MP.pulse()');const pb=take(h,'g1').find(m=>m.type==='pulse'),pa=take(h,'g0').find(m=>m.type==='pulse');
  assert.equal(pb.mfail,1);assert(pb.perr>=1);assert.equal(pa.mfail,undefined,'sağlam misafirde ayna hatası işareti yok');
  /* arıza kalkar: arızalı misafire TAM ayna (fark değil) gider */
  h.run('__bad=false;step(1);MP.publish()');const b2=take(h,'g1');
  assert(b2.some(m=>m.type==='mirror'&&m.full&&m.full.v===8),'arıza sonrası tam ayna');h.run('MP.pulse()');assert.equal(take(h,'g1').find(m=>m.type==='pulse').mfail,undefined);
});
test('A2 bir süpürme (savaş bildirimi taraması) istisna atıyor: yayın sürer, bütün misafirler dünya alır, aşama adı kaydedilir',()=>{
  const h=world(2);take(h,'g0');take(h,'g1');
  /* warSweep motorun knownWarPairs işlevini kullanır; yalnız o aşamayı bozan arıza */
  h.run(`var __kw=knownWarPairs,__n=0;knownWarPairs=function(){if(__n++<1)throw Error('süpürme arızası');return __kw.apply(this,arguments);};`);
  assert.doesNotThrow(()=>h.run('step(2);MP.publish()'));
  for(const c of ['g0','g1'])assert(take(h,c).some(m=>m.type==='mirrorDelta'||m.type==='mirror'||m.type==='delta'),c+' dünya aldı');
  const e=J(h,'MP.stats.lastPublishError');assert(e&&typeof e.stage==='string'&&e.stage.length>0);
  assert(!/token|jeton/i.test(JSON.stringify(e)));assert.deepEqual(Object.keys(e).filter(k=>!['stage','msg','day','at','seat'].includes(k)),[]);
});
test('B nabız yalnız sayaç taşır: dünya revizyonu, o oyuncunun ayna revizyonu, tam gün, hız, hata sayısı; host\'a ve koltuksuz bağlantıya gitmez',()=>{
  const h=world(2);h.run('step(2);MP.publish()');take(h,'g0');take(h,'g1');
  assert.equal(J(h,'MP.pulse()'),2);const p0=take(h,'g0').filter(m=>m.type==='pulse'),p1=take(h,'g1').filter(m=>m.type==='pulse');assert.equal(p0.length,1);assert.equal(p1.length,1);
  assert.deepEqual(Object.keys(p0[0]).sort(),['day','mrev','perr','rev','spd','type','v']);
  const s=J(h,`({rev:MP.state.worldRevision,day:Math.floor(G.day),m:[...MP.state.players.values()].filter(p=>p.playerId!=='host').map(p=>p.mirrorRev)})`);
  assert.equal(p0[0].rev,s.rev);assert.equal(p0[0].day,s.day);assert.equal(p0[0].mrev,s.m[0]);assert.equal(p1[0].mrev,s.m[1]);assert.equal(p0[0].perr,0);
  /* eksik ayna senaryosu: misafir bir farkı kaçırırsa nabızdaki mrev elindekinden büyüktür → resync TAM ayna getirir */
  h.run('step(1);MP.publish()');const lost=take(h,'g0').filter(m=>m.type==='mirrorDelta');assert(lost.length>=1);h.run('MP.pulse()');
  const pu=take(h,'g0').find(m=>m.type==='pulse');assert(pu.mrev>p0[0].mrev,'host daha yeni ayna gönderdiğini bildirir');
  h.run(`MP.onMessage('g0',JSON.stringify({v:1,type:'resync'}))`);const full=take(h,'g0').find(m=>m.type==='mirror');assert(full&&full.rev>pu.mrev-1&&full.full.day===J(h,'G.day'));
});

/* ---- kayıt ---- */
function saves(){
  const h=world(1);h.run('step(45);MP.publish()');
  const host8=h.run('serialize()'),pkg=h.run('JSON.stringify(MP.snapshot({}).pkg)');
  const mirror=h.run(`JSON.stringify([...MP.state.players.values()].find(p=>p.playerId!=='host').lastMirror)`);
  /* misafirin oyun içi kaydı: ayna, misafirin kendi motorunda deserialize → serialize (gerçek dosyanın üretildiği yol) */
  const g=runtime({root});g.sb.__m=mirror;assert.equal(g.run('deserialize(__m)'),true);const guest8=g.run('serialize()');
  const sp=runtime({root});sp.run('setupGame({...CFG,size:"orta",aiCount:5,seed:22});G.autoSave=false;');const single8=sp.run('serialize()');
  return {h,host8,pkg,guest8,single8,day:J(h,'G.day'),rng:h.run('String(RND_STATE)')};
}
const S=saves();
const fresh=()=>{const h=runtime({root});h.sb.__rand=rnd(5000);h.sb.__out=[];h.run(MIRROR);h.run(CORE);return h;};
test('C düz Save8 "bozuk" değildir: misafir aynası / host kaydı / tek oyunculu kayıt ayrı nedenle ayırt edilir; gerçek MP paketi geçerli kalır',()=>{
  const h=fresh();h.sb.__g=S.guest8;h.sb.__h=S.host8;h.sb.__s=S.single8;h.sb.__p=S.pkg;
  assert.equal(h.run('StarsMP.validatePackage(__g).why'),'save8-guest');
  assert.equal(h.run('StarsMP.validatePackage(__h).why'),'save8-host');
  assert.equal(h.run('StarsMP.validatePackage(__s).why'),'save8-single');
  assert.equal(h.run('StarsMP.validatePackage(__p).ok'),true);
  assert.equal(h.run('StarsMP.validatePackage("{\\"a\\":1}").why'),'fields','gerçekten eksik paket yine fields');
  assert.equal(h.run('StarsMP.validatePackage("{").why'),'json');
  /* misafir aynası hiçbir yoldan host paketine dönüşmez; tek oyunculu kayıt da */
  assert.deepEqual(J(h,'StarsMP.packageFromSave8(__g,{random:__rand})'),{ok:false,why:'save8-guest'});
  assert.deepEqual(J(h,'StarsMP.packageFromSave8(__s,{random:__rand})'),{ok:false,why:'save8-single'});
  /* aynanın işaretleri kazınsa bile (settlements.__mp yok) öteki devletlerin boş kaynağı / ai:true'su onu ele verir */
  h.run('var __d=JSON.parse(__g);delete __d.settlements;delete __d.mpVisible;__d.rs=12345;var __g2=JSON.stringify(__d);');
  assert.equal(h.run('StarsMP.save8Kind(JSON.parse(__g2))'),'guest');assert.equal(J(h,'StarsMP.packageFromSave8(__g2,{random:__rand})').ok,false);
});
test('D host\'un oyun içi Save8\'i → devam paketi: dünya baytı baytına aynı; yeni vm\'de devam lobisi; ziyaretçi kendiliğinden koltuk alamaz, host atar; aynı gün ve devlet',()=>{
  const h=fresh();h.sb.__h=S.host8;
  const r=J(h,`(()=>{const w=StarsMP.packageFromSave8(__h,{random:__rand,now:()=>1700000000000});globalThis.__w=w;return {ok:w.ok,why:w.why,imp:w.imported,same:w.ok&&w.pkg.save8===__h,players:w.ok&&w.pkg.session.players.map(p=>[p.playerId==='host'?'host':'guest',p.empireId,!!p.auth]),disp:w.ok&&w.pkg.display.humans.length,settings:w.ok&&w.pkg.session.settings};})()`);
  assert.equal(r.ok,true,r.why);assert.equal(r.imp,'save8-host');assert.equal(r.same,true,'Save8 değişmeden pakete girer');
  assert.deepEqual(r.players,[['host',0,false],['guest',1,true]]);assert.equal(r.disp,2);assert.deepEqual(r.settings,{size:'orta',aiCount:5,shape:'sarmal'});
  /* paket metni (dosya / IndexedDB yolu) yeniden doğrulanır ve yüklenir */
  h.run(`${STEP};var seq={};var __t=JSON.stringify(__w.pkg);var V=StarsMP.validatePackage(__t);var LW=V.ok?StarsMP.loadWorld(V.pkg):null;
    var MP=V.ok&&LW.ok?StarsMP.createHost({roomId:'p0b',random:__rand,send:(c,t)=>__out.push([c,t]),kick(c,why){__out.push([c,JSON.stringify({type:'kicked',why})]);},lobby:{design:true,hostDraft:()=>null,generate(){return {ok:false};}},resume:V.pkg}):null;if(MP)MP.installGuards();`);
  assert.deepEqual(J(h,'({v:V.ok,l:LW&&LW.ok,why:V.why||(LW&&LW.why)||null})'),{v:true,l:true,why:null});
  assert.equal(J(h,'G.day'),S.day);assert.equal(h.run('String(RND_STATE)'),S.rng,'RNG durumu aynı');{const ctl=runtime({root});ctl.sb.__h=S.host8;assert.equal(ctl.run('deserialize(__h)'),true);
    assert.equal(h.run('serialize()'),ctl.run('serialize()'),'paketle yüklenen dünya = aynı Save8\'in motorun kendi yüklemesi (bayt bayt)');}
  assert.equal(J(h,'MP.lobby.phase'),'resume');
  /* arkadaş yeni kodla, eski cihaz jetonuyla bağlanır: kimlik eşleşmez → ziyaretçi (koltuk alamaz, komut veremez) */
  h.run(`MP.onMessage('n0',JSON.stringify({v:1,type:'hello',name:'Bora',token:'${'ab'.repeat(16)}'}))`);
  const v=J(h,`(()=>{const ps=[...MP.state.players.values()];const vis=ps.find(p=>p.conn==='n0');return {visitor:!!vis.visitor,emp:vis.empireId,seat:ps.find(p=>p.empireId===1&&p.playerId!=='host').playerId,vpid:vis.playerId};})()`);
  assert.equal(v.visitor,true);assert.equal(v.emp,null,'ziyaretçiye devlet atanmaz');
  const rej=cmd(h,'n0',{kind:'researchMode',mode:'auto'});assert.notEqual(rej&&rej.status,'ok','ziyaretçi komut veremez');
  /* host tanıdığı oyuncuyu bağlı olmayan koltuğa atar (mevcut KİMLİĞİ KURTAR) */
  assert.equal(J(h,`MP.recoverSeat(${JSON.stringify(v.vpid)},${JSON.stringify(v.seat)})`).ok,true);
  assert.equal(J(h,`[...MP.state.players.values()].find(p=>p.conn==='n0').empireId`),1,'kendi devletine döndü');
  assert.equal(J(h,'MP.resumeStart()').ok,true);assert.equal(J(h,'MP.lobby.phase'),'ingame');
  h.run(`MP.onMessage('n0',JSON.stringify({v:1,type:'ui',mode:'stars'}))`);const full=take(h,'n0').filter(m=>m.type==='mirror').at(-1);
  assert(full&&full.full.day===S.day,'misafir aynı günden sürdürür');assert.equal(full.full.emps[0].name,'Saf Akıl Ağı','misafirin aynası kendi devleti');
  const c=shipCmd(h),q0=J(h,`(G.sys[${c.sys}].queue||[]).length`);h.run('seq.n0=0');assert.equal(cmd(h,'n0',c).status,'ok');assert.equal(J(h,`(G.sys[${c.sys}].queue||[]).length`),q0+1);
  h.run('step(31);MP.publish()');assert(J(h,'G.day')>S.day+30,'oyun aynı durumdan ilerler');
});
test('D2 gerçek MP paketi (ÇOK OYUNCULU → OYUNU KAYDET) aynı dünyada: kimlik özeti korunur, misafir kendi jetonuyla kendiliğinden döner',()=>{
  const h=fresh();h.sb.__p=S.pkg;
  h.run(`var V=StarsMP.validatePackage(__p);var LW=StarsMP.loadWorld(V.pkg);var MP=StarsMP.createHost({roomId:'p0c',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{design:true,hostDraft:()=>null,generate(){return {ok:false};}},resume:V.pkg});MP.installGuards();`);
  assert.equal(J(h,'V.ok&&LW.ok'),true);assert.equal(J(h,'G.day'),S.day);
  const tok=J(S.h,`[...MP.state.players.values()].find(p=>p.playerId!=='host').token`);
  h.run(`MP.onMessage('n0',JSON.stringify({v:1,type:'hello',name:'Bora',token:${JSON.stringify(tok)}}))`);
  assert.equal(J(h,`[...MP.state.players.values()].find(p=>p.conn==='n0').empireId`),1);
});
end();
