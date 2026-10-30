'use strict';
/* MP.4: çok oyunculu kayıt/yükleme — host'un gerçek STARS motorunda (Node vm), kaydeden ve yükleyen İKİ AYRI vm bağlamı
   (yeni süreç gibi: ortak global yok). Save8 değişmez; paket = Save8 + oturum + MP.3 teklif deposu + SHA-256 bütünlük.
   Dünya: seed 22, orta, 5 AI; misafir B = devlet 3, C = devlet 5 (AI: 1, 2, 4).
   FİKSTÜR (açıkça): siyasi başlangıç — temas, Etki/kaynak, C'ye ek filo (himaye için güç oranı), AI 1 başkanlığında
   {1, 2, B} federasyonu. Sonraki her adım ağ komutu ya da motorun kendi işlevidir. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();MP.observeHumans();}}}';
const B=3,C=5,CONN={[B]:'cB',[C]:'cC'};
const POLITICS=`
  for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala'])e.res[k]=Math.max(e.res[k],2000);}
  for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=60;}
  newFleet(G.emps[5],G.emps[5].home,Array.from({length:12},()=>({c:'kor'})));
  var F={id:100,name:'MP4 Test Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:1,founder:1,members:[1,2,3],laws:{},fund:{ala:0,ene:0},treasury:0,
    founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
  G.feds=[F];G.fedUid=100;for(const a of F.members)for(const b of F.members)if(a!==b)G.emps[a].ally[b]=true;fedNormalize(F);for(const id of [0,1,2,3,4,5]){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}`;   // güç önbelleği: yeni filo hemen sayılsın
function rnd(n0){let n=n0;return k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);}
function hostWorld(){
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.run(CORE);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'r4',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(3);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cB',${B}],['cC',${C}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={cB:0,cC:0};step(30);${POLITICS};MP.publish();`);
  return h;
}
/* Yeni "süreç": yeni vm, motor + çekirdek; kayıt metnini doğrular, dünyayı yükler, devam lobisini kurar. */
function loadWorld(text,o={}){
  const h=runtime({root});h.sb.__rand=rnd(10000);h.sb.__out=[];h.sb.__text=text;h.run(CORE);
  const r=JSON.parse(h.run(`${STEP};var seq={};var V=StarsMP.validatePackage(__text);var LW=V.ok?StarsMP.loadWorld(V.pkg):null;
    var MP=V.ok&&LW.ok?StarsMP.createHost({roomId:'r4b',random:__rand,send:(c,t)=>__out.push([c,t]),kick(c,why){__out.push([c,JSON.stringify({type:'kicked',why})]);},lobby:{generate(){return {ok:false};}},resume:V.pkg}):null;
    if(MP)MP.installGuards();JSON.stringify({ok:V.ok&&LW.ok,why:V.why||(LW&&LW.why)})`));
  return {h,...r};
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function msg(h,conn,obj){const n=h.sb.__out.length;h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify(obj))})`);return h.sb.__out.slice(n).filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));}
function cmd(h,conn,c,extra={}){const s=h.run(`seq[${JSON.stringify(conn)}]=Math.max(seq[${JSON.stringify(conn)}]||0,${extra.minSeq||0})+1`);delete extra.minSeq;
  return msg(h,conn,{v:1,type:'cmd',seq:s,cid:'m4'+conn+String(s).padStart(6,'0')+String(Math.random()).slice(2,6),cmd:c,...extra}).find(m=>m.type==='result');}
const st=h=>({save:h.run('serialize()'),rng:h.run('RND_STATE')});
const lastAssign=(h,conn)=>h.sb.__out.filter(([c,t])=>c===conn&&t.includes('"type":"assign"')).map(([,t])=>JSON.parse(t)).at(-1);
const token=h=>J(h,'fedVoteToken(F.vote)');
/* ortak senaryo: kayıttan önce gerçek komutlar ve bekleyen diplomasi */
function scenario(){
  const h=hostWorld();
  // gerçek komutlar: inşa + filo hareketi
  const col=J(h,`(()=>{const c=G.emps[${B}].colonies[0];return c&&{s:c.s,p:c.p};})()`);
  if(col)cmd(h,'cB',{kind:'build',sys:col.s,planet:col.p,key:'santral'});
  const mv=J(h,`(()=>{const e=G.emps[${C}];for(const f of G.fleets.filter(f=>f.e===${C}&&!f.mv&&f.ships.length))for(const s of G.sys){if(s.id===f.sys)continue;const p=findPath(f.sys,s.id,e);if(p&&p.length>=1&&p.length<=3&&pathAllowed(e,f,p,f.sys))return {f:f.id,t:s.id};}return null;})()`);
  if(mv)cmd(h,'cC',{kind:'move',fleet:mv.f,to:mv.t});
  // MP.3: B → C teklif (250 Maden / 100 Alaşım), C karşı teklif (60 Alaşım) → B'nin kararı bekleniyor; ayrıca C'ye bekleyen ikinci teklif
  const o1=cmd(h,'cB',{kind:'offer',to:C,give:[{t:'res',r:'min',v:250}],want:[{t:'res',r:'ala',v:100}]}).extra.offer;
  const o2=cmd(h,'cC',{kind:'counter',offer:o1,give:[{t:'res',r:'ala',v:60}],want:[{t:'res',r:'min',v:250}]}).extra.offer;
  const o3=cmd(h,'cB',{kind:'offer',to:C,give:[{t:'res',r:'ene',v:40}],want:[{t:'res',r:'yiy',v:5}]}).extra.offer;
  // MP.3.1: AI başkanın yasa önerisi → B'nin oyu bekliyor
  h.run(`(()=>{const k=[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)].find(k=>canFedLaw(G.emps[1],k,false).ok);proposeFedLaw(G.emps[1],k);MP.publish();})()`);
  // MP.3.1: B, C'den himaye ister; C karşı teklif verir → B'nin kararı bekleniyor
  const terms={tax:{ene:.2,min:.2,ala:.2,yiy:0,tuk:0},science:0,defense:true,war:'none',autonomy:'consent',duration:0,renegotiate:24,sensors:false};
  const vo=cmd(h,'cB',{kind:'vassalOffer',to:C,mode:'seek',type:'haracguzar',terms});
  const q=J(h,`G.emps[${B}].vassalTalk??null`);if(!q)throw Error('vassal offer: '+JSON.stringify(vo)+' '+J(h,`canSeekProtection(G.emps[${B}],G.emps[${C}]).why||''`));const vc=q?cmd(h,'cC',{kind:'vassalReply',sub:B,id:q.id,round:1,action:'counter',terms:{...terms,tax:{ene:.1,min:.1,ala:.1,yiy:0,tuk:0}}}):null;
  h.run('MP.publish()');
  return {h,o1,o2,o3,vo,vc,q,terms};
}
function resign(h,pkg){const body={...pkg};delete body.integrity;const h8=J(h,`StarsMP.sha256(${JSON.stringify(pkg.save8)})`);body.save8=h8;
  return {...pkg,integrity:{alg:'SHA-256',save8:h8,body:J(h,`StarsMP.sha256(StarsMP.canon(${JSON.stringify(body)}))`)}};}

let SC=null;const sc=()=>SC||(SC=scenario());

test('senaryo hazır: gerçek komutlar, bekleyen MP.3 karşı teklifi, insan oyu bekleyen federasyon gündemi ve vasallık karşı teklifi',()=>{
  const {h,o1,o2,o3,q,vc}=sc();
  assert.deepEqual(J(h,`[MP.dip.offers.find(r=>r.id===${o1}).status,MP.dip.offers.find(r=>r.id===${o2}).status,MP.dip.offers.find(r=>r.id===${o2}).round,MP.dip.offers.find(r=>r.id===${o3}).status]`),['countered','pending',2,'pending']);
  assert.equal(J(h,'!!F.vote&&fedVoteCounts(F).waiting.includes(3)&&!F.vote.yes.includes(3)&&!F.vote.no.includes(3)'),true);
  assert(q&&vc&&vc.status==='ok',JSON.stringify(vc));assert.deepEqual(J(h,`[G.emps[${B}].vassalTalk.to,G.emps[${B}].vassalTalk.round]`),[B,2]);
});
test('kayıt: paket Save8 + oturum + teklif deposu; jeton YOK (yalnız tuzlu SHA-256 özeti); kayıt almak Save8 ve RNG\'yi değiştirmez; yarım işlem sırasında kayıt reddedilir',()=>{
  const {h}=sc();const s0=st(h);const r=J(h,'MP.snapshot({name:"Test galaksisi"})');assert.equal(r.ok,true);assert.deepEqual(st(h),s0,'snapshot is read-only');
  const pkg=r.pkg,text=JSON.stringify(pkg);
  assert.deepEqual(Object.keys(pkg).sort(),['build','createdAt','diplomacy','display','format','integrity','mpVersion','save8','saveId','session'].sort());
  assert.equal(pkg.format,'stars-mp-save');assert.equal(pkg.mpVersion,4);assert.equal(pkg.build,J(h,'BUILD_ID'));assert.equal(pkg.save8,s0.save,'save8 = engine serialize()');
  for(const [c] of [['cB'],['cC']]){const tok=lastAssign(h,c).token;assert(!text.includes(tok),'token not in the file');}
  const gs=pkg.session.players.filter(p=>p.playerId!=='host');assert.deepEqual(gs.map(p=>p.empireId).sort(),[B,C]);
  for(const p of gs){assert.match(p.auth.salt,/^[a-f0-9]{32}$/);assert.match(p.auth.hash,/^[a-f0-9]{64}$/);}
  assert.equal(pkg.diplomacy.offers.length,J(h,'MP.dip.offers.length'));assert.equal(pkg.integrity.alg,'SHA-256');
  assert.equal(J(h,`StarsMP.validatePackage(${JSON.stringify(text)}).ok`),true);
  h.run('G._sideBuf=[]');assert.equal(J(h,'MP.snapshot({}).why'),'busy');h.run('delete G._sideBuf');
});
test('yükleme yeni süreçte: aynı galaksi, devam lobisi; B ve C cihazlarındaki jetonla AYNI devlete (3 ve 5) döner, jeton yenilenir; host başlatana kadar oyun ilerlemez',()=>{
  const {h}=sc();const text=JSON.stringify(J(h,'MP.snapshot({})').pkg);const save=h.run('serialize()'),rng=h.run('RND_STATE');
  const tB=lastAssign(h,'cB').token,tC=lastAssign(h,'cC').token,sid=lastAssign(h,'cB').saveId;
  const y=loadWorld(text);assert.equal(y.ok,true,y.why);const g=y.h;
  /* motorun kendi yüklemesi türetilmiş ekonomiyi ve önbellekleri yeniden hesaplar (tek oyunculu yükleme ile aynı):
       yüklenen dünya = kaydın motorca yüklenmiş hâli (üçüncü, temiz bağlamda deserialize) */
    const n=runtime({root});n.sb.__t=save;n.run('deserialize(__t)');
    assert.equal(g.run('serialize()'),n.run('serialize()'),'loaded world = engine load of the saved Save8');assert.equal(g.run('RND_STATE'),rng,'RNG restored, not consumed');
  assert.equal(J(g,'MP.lobby.phase'),'resume');assert.deepEqual(J(g,'[...MP.state.slots.entries()].sort()'),[[0,'host'],[B,J(h,`MP.state.slots.get(${B})`)],[C,J(h,`MP.state.slots.get(${C})`)]].sort());
  assert.deepEqual(J(g,`[G.emps[${B}].ai,G.emps[${C}].ai]`),[false,false],'waiting human empires are not AI-run');
  // B: jetonsuz bağlanır → ziyaretçi + "resume" isteği; cihazındaki jetonla yeniden selamlar
  let m=msg(g,'nB',{v:1,type:'hello',name:'Bora'});assert.equal(m.find(x=>x.type==='assign').empireId,null);assert.equal(m.find(x=>x.type==='resume').saveId,sid);
  m=msg(g,'nB',{v:1,type:'hello',name:'Bora',token:tB});const a=m.find(x=>x.type==='assign');assert.equal(a.empireId,B);assert.notEqual(a.token,tB,'token rotated');assert.equal(a.saveId,sid);
  assert.equal(J(g,`MP.state.players.size`),3,'visitor record replaced by the verified seat');
  m=msg(g,'nC',{v:1,type:'hello',name:'Cem',token:tC});assert.equal(m.find(x=>x.type==='assign').empireId,C);
  const d0=J(g,'G.day');g.run('MP.publish()');assert.equal(J(g,'G.day'),d0,'no hidden time advance');
  assert.equal(J(g,'MP.lobby.phase'),'resume');assert.equal(J(g,'MP.resumeStart().ok'),true);assert.equal(J(g,'MP.lobby.phase'),'ingame');
  assert(g.sb.__out.some(([c,t])=>c==='nB'&&t.includes('"type":"snapshot"')),'B receives its view');
});
test('kimlik güvenliği: uydurma jeton, başka kaydın jetonu, eski (yenilenmiş) jeton ve jetonsuz kişi devleti alamaz; ziyaretçi talep/komut yapamaz ve devamda çıkarılır; host yalnız bağlı olmayan koltuk için onaylı kurtarma yapabilir',()=>{
  const {h}=sc();const text=JSON.stringify(J(h,'MP.snapshot({})').pkg);const tB=lastAssign(h,'cB').token,tC=lastAssign(h,'cC').token;
  const y=loadWorld(text),g=y.h;
  for(const [conn,tok] of [['x1','0123456789abcdef0123456789abcdef'],['x2',crypto.randomBytes(16).toString('hex')]]){
    const m=msg(g,conn,{v:1,type:'hello',name:'Hırsız',token:tok});assert.equal(m.find(x=>x.type==='assign').empireId,null);}
  assert.equal(msg(g,'x1',{v:1,type:'claim',empire:B}).find(x=>x.type==='lresult').code,'phase');
  assert.equal(cmd(g,'x1',{kind:'fedLeave'}).code,'not-started','no commands before the host continues');
  // B gerçek jetonla döner; sonra eski jeton artık geçmez
  msg(g,'nB',{v:1,type:'hello',name:'Bora',token:tB});assert.equal(msg(g,'x3',{v:1,type:'hello',name:'Kopya',token:tB}).find(x=>x.type==='assign').empireId,null,'rotated: old token dead');
  // host kurtarma: çevrimiçi koltuk alınamaz; bağlı olmayan C koltuğu ziyaretçiye ancak host açık işlemiyle
  const v1=J(g,`[...MP.state.players.values()].find(p=>p.conn==='x1').playerId`),pB=J(g,`MP.state.slots.get(${B})`),pC=J(g,`MP.state.slots.get(${C})`);
  assert.equal(J(g,`MP.recoverSeat(${JSON.stringify(v1)},${JSON.stringify(pB)}).why`),'seat-online');
  assert.equal(J(g,`MP.recoverSeat(${JSON.stringify(v1)},'host').why`),'seat');
  assert.equal(J(g,`MP.recoverSeat(${JSON.stringify(v1)},${JSON.stringify(pC)}).ok`),true);assert.equal(lastAssign(g,'x1').empireId,C);
  assert.equal(msg(g,'nC',{v:1,type:'hello',name:'Cem',token:tC}).find(x=>x.type==='assign').empireId,null,'after recovery the old C token is no longer valid');
  assert.equal(J(g,'MP.resumeStart().ok'),true);
  assert(g.sb.__out.some(([c,t])=>['x2','x3','nC'].includes(c)&&t.includes('game-started')),'unverified visitors removed at continue');
  assert.equal(msg(g,'x9',{v:1,type:'hello',name:'Geç'}).find(x=>x.type==='error').code,'game-started');
});
test('DEVAM ET sonrası geç dönüş: C bağlanmadan oyun sürer (devleti AI\'ya geçmez); jetonsuz yabancıya yalnız kayıt kimliği sorulur, oyuncu kaydı açılmaz; uydurma jeton reddedilir; C cihazındaki jetonla kendi devletine döner',()=>{
  const {h}=sc();const text=JSON.stringify(J(h,'MP.snapshot({})').pkg);const tB=lastAssign(h,'cB').token,tC=lastAssign(h,'cC').token;
  const y=loadWorld(text),g=y.h;msg(g,'nB',{v:1,type:'hello',name:'Bora',token:tB});assert.equal(J(g,'MP.resumeStart().ok'),true);
  g.run('step(20);MP.publish()');assert.equal(J(g,`G.emps[${C}].ai`),false,'waiting seat is not handed to the AI');
  const n0=J(g,'MP.state.players.size'),saveId=J(g,'MP.state.saveId');
  const r1=msg(g,'x7',{v:1,type:'hello',name:'Yabancı'});assert.deepEqual(r1.map(x=>x.type),['resume']);assert.equal(r1[0].saveId,saveId);
  assert.equal(J(g,'MP.state.players.size'),n0,'no player record for an unverified connection');
  assert.equal(msg(g,'x7',{v:1,type:'hello',name:'Yabancı',token:crypto.randomBytes(16).toString('hex')}).find(x=>x.type==='error').code,'game-started');
  assert.equal(cmd(g,'x7',{kind:'fedLeave'}).code,'not-joined','unbound connection cannot command');
  assert.deepEqual(msg(g,'nC',{v:1,type:'hello',name:'Cem'}).map(x=>x.type),['resume']);
  const back=msg(g,'nC',{v:1,type:'hello',name:'Cem',token:tC});assert.equal(back.find(x=>x.type==='assign').empireId,C);assert(back.some(x=>x.type==='snapshot'),'view published on return');
  assert.notEqual(back.find(x=>x.type==='assign').token,tC,'token rotated');
  assert.equal(msg(g,'x8',{v:1,type:'hello',name:'Geç'}).find(x=>x.type==='error').code,'game-started','no waiting seat → plain refusal');
});
test('MP.3 teklif kalıcılığı: karşı teklif turu, kimlik, süre ve geçmiş yüklenir; B karşı teklifi kabul eder → kaynaklar tam bir kez; eski tur ve ikinci kabul reddedilir; sıra/komut tekrarı geçmez',()=>{
  const {h,o1,o2,o3}=sc();const text=JSON.stringify(J(h,'MP.snapshot({})').pkg);const tB=lastAssign(h,'cB').token,tC=lastAssign(h,'cC').token,lsB=lastAssign(h,'cB').lastSeq;
  const g=loadWorld(text).h;msg(g,'nB',{v:1,type:'hello',name:'Bora',token:tB});msg(g,'nC',{v:1,type:'hello',name:'Cem',token:tC});g.run('MP.resumeStart()');
  assert.deepEqual(J(g,'MP.dip.offers.map(r=>[r.id,r.status,r.round,r.prev])'),J(h,'MP.dip.offers.map(r=>[r.id,r.status,r.round,r.prev])'));assert.equal(J(g,'MP.dip.next'),J(h,'MP.dip.next'));
  const v=JSON.parse(g.sb.__out.filter(([c,t])=>c==='nB'&&t.includes('"type":"snapshot"')).at(-1)[1]).view;
  assert(v.dip.offers.some(o=>o.id===o2&&o.status==='pending'&&o.round===2&&o.prev===o1),'B sees the counter after load');
  const seqB=J(g,`MP.state.players.get(MP.state.slots.get(${B})).lastSeq`);assert(seqB>=1,'lastSeq restored');
  assert.equal(msg(g,'nB',{v:1,type:'cmd',seq:1,cid:'replay0000001',cmd:{kind:'respond',offer:o2,action:'accept'}}).find(x=>x.type==='result').code,'stale-seq','old sequence number refused');
  const rB=J(g,`G.emps[${B}].res`),rC=J(g,`G.emps[${C}].res`);
  const acc=cmd(g,'nB',{kind:'respond',offer:o2,action:'accept'},{minSeq:seqB});assert.equal(acc.status,'ok',JSON.stringify(acc));
  const aB=J(g,`G.emps[${B}].res`),aC=J(g,`G.emps[${C}].res`);
  assert.deepEqual([aB.min-rB.min,aB.ala-rB.ala,aC.min-rC.min,aC.ala-rC.ala].map(x=>Math.round(x*1000)/1000),[-250,60,250,-60],'exactly once');
  g.run(`seq.nB=${seqB+5};seq.nC=50`);assert.equal(cmd(g,'nB',{kind:'respond',offer:o2,action:'accept'}).code,'rules:closed');
  assert.equal(cmd(g,'nC',{kind:'respond',offer:o1,action:'accept'}).code,'rules:closed','old round not acceptable');
  assert.equal(cmd(g,'nC',{kind:'respond',offer:o3,action:'accept'}).status,'ok','second pending offer still works after load');
  // süre: oyun zamanıyla dolar (yükleme sonrası da)
  const k=loadWorld(text).h;k.run('MP.resumeStart();G.day=MP.dip.offers.find(r=>r.status==="pending").expires+1;MP.publish()');
  assert.equal(J(k,'MP.dip.offers.filter(r=>r.status==="pending").length'),0);
});
test('federasyon: yükleme sonrası B\'nin bekleyen oyu AI tarafından verilmez; B kendi oyunu verir; korumalar YENİ host örneğine bağlı (aynı sayfada ikinci host dahil)',()=>{
  const {h}=sc();const text=JSON.stringify(J(h,'MP.snapshot({})').pkg);const tB=lastAssign(h,'cB').token;
  const g=loadWorld(text).h;msg(g,'nB',{v:1,type:'hello',name:'Bora',token:tB});g.run('MP.resumeStart();step(40);MP.publish()');
  assert.equal(J(g,'!!fedOf(100).vote&&fedVoteCounts(fedOf(100)).waiting.includes(3)'),true,'still waiting for B after 40 days');
  assert.equal(J(g,'fedOf(100).vote.yes.includes(3)||fedOf(100).vote.no.includes(3)'),false);
  assert.equal(J(g,'__mpHumanVoter(3)'),true);g.run('seq.nB=100');
  assert.equal(cmd(g,'nB',{kind:'fedVote',fed:100,token:J(g,'fedVoteToken(fedOf(100).vote)'),yes:true}).status,'ok');
  assert.equal(J(g,'fedOf(100).lastVote.yesMembers.includes(3)'),true);
  // aynı sayfada (aynı vm) ikinci host: korumalar yeni host'un oyuncu tablosuna yönelir
  const k=loadWorld(text).h;assert.equal(J(k,'__mpHumanVoter(3)'),true);
  k.run(`var MP2=StarsMP.createHost({roomId:'zz',random:__rand,send(){},hostEmpireId:3});MP2.installGuards();`);   // aynı sayfada ikinci host (devlet 3 onun kendi devleti)
  assert.equal(J(k,'__mpHumanVoter(3)'),false,'dispatches to the active host');k.run('MP.installGuards()');assert.equal(J(k,'__mpHumanVoter(3)'),true);
});
test('vasallık: bekleyen karşı teklif yüklenir; B kabul eder → gerçek sözleşme; sonraki ay vergi motorla akar; eski tur reddedilir',()=>{
  const {h,q}=sc();const text=JSON.stringify(J(h,'MP.snapshot({})').pkg);const tB=lastAssign(h,'cB').token,tC=lastAssign(h,'cC').token;
  const g=loadWorld(text).h;msg(g,'nB',{v:1,type:'hello',name:'Bora',token:tB});msg(g,'nC',{v:1,type:'hello',name:'Cem',token:tC});g.run('MP.resumeStart();seq.nB=100;seq.nC=100');
  assert.deepEqual(J(g,`[G.emps[${B}].vassalTalk.to,G.emps[${B}].vassalTalk.round,G.emps[${B}].vassalTalk.status]`),[B,2,'pending']);
  assert.equal(cmd(g,'nB',{kind:'vassalReply',sub:B,id:q.id,round:1,action:'accept'}).code,'rules:stale');
  assert.equal(cmd(g,'nC',{kind:'vassalReply',sub:B,id:q.id,round:2,action:'accept'}).code,'rules:not-recipient');
  assert.equal(cmd(g,'nB',{kind:'vassalReply',sub:B,id:q.id,round:2,action:'accept'}).status,'ok');
  assert.deepEqual(J(g,`[G.emps[${B}].overlord,G.emps[${B}].vassalContract.terms.tax.ene]`),[C,.1]);
  const paid0=J(g,`G.emps[${B}].vassalPaidMonth??null`);g.run('step(31)');assert.notEqual(J(g,`G.emps[${B}].vassalPaidMonth??null`),paid0,'tribute processed');
});
test('Save8 ve RNG eşitliği: kayıttan devam = kapanmadan devam (aynı komutlar, 60 gün). Motorun yükleme normalleştirmesi uygulanan kontrolle Save8 bayt bayt aynı; hiç yüklenmemiş dünyayla RNG aynı ve oyun durumu önbellek alanları dışında aynı',()=>{
  const strip=t=>JSON.stringify(JSON.parse(t,(k,v)=>k[0]==='_'?undefined:v));
  function run(){const sc0=scenario(),{h,o2,q}=sc0;const text=JSON.stringify(J(h,'MP.snapshot({})').pkg);const tB=lastAssign(h,'cB').token,tC=lastAssign(h,'cC').token;
    const g=loadWorld(text).h;msg(g,'cB',{v:1,type:'hello',name:'Bora',token:tB});msg(g,'cC',{v:1,type:'hello',name:'Cem',token:tC});g.run('MP.resumeStart()');
    g.run(`seq.cB=${J(h,'seq.cB')};seq.cC=${J(h,'seq.cC')}`);return {h,g,o2,q};}
  const play=(x,o2,q)=>{assert.equal(cmd(x,'cB',{kind:'respond',offer:o2,action:'accept'}).status,'ok');assert.equal(cmd(x,'cB',{kind:'fedVote',fed:100,token:J(x,'fedVoteToken(fedOf(100).vote)'),yes:false}).status,'ok');
    assert.equal(cmd(x,'cB',{kind:'vassalReply',sub:B,id:q.id,round:2,action:'accept'}).status,'ok');x.run('for(let i=0;i<60;i++){step(1);MP.publish();}');};
  // 1) kontrol: host kaydeder ve kapatmadan devam eder; motorun yükleme normalleştirmesi (deserialize(serialize())) yerinde uygulanır
  {const {h,g,o2,q}=run();h.run('deserialize(serialize())');play(h,o2,q);play(g,o2,q);
    assert.equal(g.run('RND_STATE'),h.run('RND_STATE'),'RNG');assert.equal(g.run('serialize()'),h.run('serialize()'),'Save8 byte-identical');}
  // 2) hiç yüklenmemiş dünya: RNG aynı; Save8, "_" önekli motor önbellekleri dışında karşılaştırılır (fark raporlanır)
  {const {h,g,o2,q}=run();play(h,o2,q);play(g,o2,q);assert.equal(g.run('RND_STATE'),h.run('RND_STATE'),'RNG');
    const a=JSON.parse(strip(h.run('serialize()'))),b=JSON.parse(strip(g.run('serialize()')));const d=[];
    (function walk(x,y,p){if(d.length>5||JSON.stringify(x)===JSON.stringify(y))return;if(x&&y&&typeof x==='object'&&typeof y==='object'){for(const k of new Set([...Object.keys(x),...Object.keys(y)]))walk(x[k],y[k],p+'/'+k);return;}d.push(p);})(a,b,'');
    console.log('   kesintisiz vs yüklenmiş (önbellek dışı farklar): '+(d.length?d.join(', '):'yok'));
    assert(d.every(p=>/\/mapHabitats\/\d+\/at$/.test(p)),'only habitat observation stamps may differ: '+d.join(', '));}
});
test('bozuk/sahte kayıt güvenle reddedilir: JSON, alan, biçim, sürüm, build, boyut, Save8 bozulması, bütünlük, Save sürümü, oyuncu eşlemesi, host, jeton özeti, teklif, tur, miktar; yükleme hatası önceki dünyayı korur',()=>{
  const {h}=sc();const pkg=J(h,'MP.snapshot({})').pkg,text=JSON.stringify(pkg);const V=t=>J(h,`StarsMP.validatePackage(${JSON.stringify(typeof t==='string'?t:JSON.stringify(t))}).why||'ok'`);
  const clone=()=>JSON.parse(text),sig=p=>resign(h,p);
  assert.equal(V(text),'ok');assert.equal(V('{bozuk'),'json');assert.equal(V('[]'),'json');
  let p=clone();delete p.display;assert.equal(V(p),'fields');
  p=clone();p.format='x';assert.equal(V(p),'format');p=clone();p.mpVersion=3;assert.equal(V(p),'version');p=clone();p.build='96h9';assert.equal(V(p),'build');
  assert.equal(J(h,`StarsMP.validatePackage(${JSON.stringify(text)},{build:'96h11'}).why`),'build');
  assert.equal(J(h,`StarsMP.validatePackage("x".repeat(32000001)).why`),'too-big');
  p=clone();p.save8=p.save8.replace('"day":','"day":1');assert.equal(V(p),'integrity-save8','tampered Save8');
  p=clone();p.display.name='değişti';assert.equal(V(p),'integrity-body','tampered body');
  p=clone();p.save8='{bozuk';assert.equal(V(sig(p)),'save8-json');
  p=clone();const d=JSON.parse(p.save8);d.v=7;p.save8=JSON.stringify(d);assert.equal(V(sig(p)),'save-version');
  const gi=p=>p.session.players.findIndex(x=>x.playerId!=='host');
  p=clone();p.session.players[gi(p)].empireId=p.session.players.find((x,i)=>i!==gi(p)&&x.playerId!=='host').empireId;assert.equal(V(sig(p)),'dup-empire');
  p=clone();p.session.players.push({...p.session.players[gi(p)],empireId:2});assert.equal(V(sig(p)),'dup-player');
  p=clone();p.session.players[gi(p)].empireId=99;assert.equal(V(sig(p)),'bad-empire');
  p=clone();p.session.players[gi(p)].empireId=0;assert.equal(V(sig(p)),'dup-empire','guest on the host empire');
  p=clone();p.session.players.find(x=>x.playerId==='host').auth={salt:'0'.repeat(32),hash:'0'.repeat(64)};assert.equal(V(sig(p)),'host','fake host identity');
  p=clone();p.session.players.find(x=>x.playerId==='host').playerId='p-000000000000';assert.equal(V(sig(p)),'host');
  p=clone();delete p.session.players[gi(p)].auth;assert.equal(V(sig(p)),'auth','missing token digest');
  p=clone();p.session.players[gi(p)].auth.hash='zz';assert.equal(V(sig(p)),'auth');
  p=clone();p.diplomacy.offers[0].give=[{t:'res',r:'min',v:-5}];assert.equal(V(sig(p)),'amount');
  p=clone();p.diplomacy.offers[0].give=[{t:'hack',x:{}}];assert.equal(V(sig(p)),'items');
  p=clone();const c2=p.diplomacy.offers.find(r=>r.round===2);c2.round=3;assert.equal(V(sig(p)),'round');
  p=clone();p.diplomacy.offers[0].id=999999;assert.equal(V(sig(p)),'offers');
  // oturumdaki insan devleti yüklenen dünyada AI ise: yükleme reddedilir, önceki dünya korunur
  const k=hostWorld();const before=k.run('serialize()'),rng=k.run('RND_STATE');p=clone();const dd=JSON.parse(p.save8);dd.emps[B].ai=true;p.save8=JSON.stringify(dd);
  k.sb.__t=JSON.stringify(sig(p));assert.equal(J(k,'StarsMP.loadWorld(StarsMP.validatePackage(__t).pkg).why'),'slot-state');
  const n=runtime({root});n.sb.__t=before;n.run('deserialize(__t)');const norm=n.run('serialize()');   // motorun yüklemesi önbellekleri yeniden hesaplar
  assert.equal(k.run('serialize()'),norm,'previous world restored (engine load of the previous Save8)');assert.equal(k.run('RND_STATE'),rng);
  // engine reddi (bozuk Save8 içeriği) önceki dünyayı korur
  p=clone();const de=JSON.parse(p.save8);de.sys='bozuk';p.save8=JSON.stringify(de);k.sb.__t=JSON.stringify(sig(p));
  assert.equal(J(k,'StarsMP.loadWorld(StarsMP.validatePackage(__t).pkg).why'),'save8-apply');assert.equal(k.run('serialize()'),norm,'engine rolled its own load back');
});
test('eski MP.0 meta (mpMeta:1) güvenle yükseltilir: FNV eşleşmesi zorunlu, açık jetonlar tuzlu özete çevrilir, teklif deposu boş; uyumsuz eski kayıt açık gerekçeyle reddedilir',()=>{
  const {h}=sc();const save=h.run('serialize()');const m=J(h,`MP.meta(serialize())`);const tB=lastAssign(h,'cB').token;
  h.sb.__m=m;h.sb.__s=save;const up=J(h,'StarsMP.upgradeLegacy(__m,__s,{random:__rand,now:()=>1})');assert.equal(up.ok,true,up.why);
  assert(!JSON.stringify(up.pkg).includes(tB),'legacy token not carried in clear');assert.equal(up.pkg.diplomacy.offers.length,0);
  assert.equal(J(h,'StarsMP.upgradeLegacy(__m,__s+" ",{random:__rand}).why'),'legacy-hash');assert.equal(J(h,`StarsMP.validatePackage(${JSON.stringify(JSON.stringify(m))}).why`),'legacy');
  const g=loadWorld(JSON.stringify(up.pkg)).h;assert.equal(msg(g,'nB',{v:1,type:'hello',name:'Bora',token:tB}).find(x=>x.type==='assign').empireId,B,'legacy player returns to the same empire');
});
test('SHA-256 standart test vektörleri (FIPS 180-4) ve Node crypto ile aynı',()=>{
  const h=runtime({root});h.run(CORE);
  for(const s of ['','abc','abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq','ğüşıöç İstanbul 🚀 '+'z'.repeat(5000)])
    assert.equal(J(h,`StarsMP.sha256(${JSON.stringify(s)})`),crypto.createHash('sha256').update(s,'utf8').digest('hex'));
  assert.equal(J(h,'StarsMP.sha256("abc")'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('performans: 45 / 60 / 100 sistemde kayıt alma, doğrulama ve yükleme süresi, paket boyutu',()=>{
  const out={};
  for(const [size,ai] of [['orta',5],['buyuk',7],['ulu',11]]){
    const h=runtime({root});h.sb.__rand=rnd(5);h.run(CORE);
    h.run(`setupGame({...CFG,size:${JSON.stringify(size)},aiCount:${ai},seed:42});G.autoSave=false;var MP=StarsMP.createHost({roomId:'p',random:__rand,send(){}});MP.installGuards();`);
    const r=J(h,`(()=>{let t=Date.now();const s=MP.snapshot({});const snap=Date.now()-t;const text=JSON.stringify(s.pkg);t=Date.now();const v=StarsMP.validatePackage(text);const val=Date.now()-t;
      t=Date.now();const l=StarsMP.loadWorld(v.pkg);const load=Date.now()-t;return {systems:G.sys.length,bytes:text.length,save8:s.pkg.save8.length,snapMs:Math.round(snap),validateMs:Math.round(val),loadMs:Math.round(load),ok:v.ok&&l.ok};})()`);
    assert.equal(r.ok,true);out[r.systems]=r;assert(r.bytes<MAXB(r.systems),'size');
  }
  console.log('   '+Object.values(out).map(r=>r.systems+' sistem: '+Math.round(r.bytes/1024)+' KB, kayıt '+r.snapMs+' ms, doğrulama '+r.validateMs+' ms, yükleme '+r.loadMs+' ms').join(' · '));
  function MAXB(){return 32e6;}
});
end();
