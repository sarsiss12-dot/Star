'use strict';
/* MP.6.1 — ortak oyun hızı, gerçek STARS filo/koloni düğmelerinin host komutları ve ayna dünyanın yeni yetkili bölümleri.
   Host'un gerçek STARS motoru (Node vm), seed 22, orta, 5 AI; uzak insanlar A=1, B=3, C=4 (C, A ve B ile temassız; MP.3.1 fikstürü).
   Kanıtlanan:
   - hız: tek yetkili host; değişiklik herkese 'speed' iletisiyle; ad alıcının bakışından (temas → devlet adı, yoksa lobi adı);
     aynı hız 'same' (bildirim yok); oyuncu başına spam koruması; host'un kendi düğmesi (local) ve iç duraklatması (speedSync);
     dönen oyuncu güncel hızı bildirimsiz alır; host duraklatmasında komut reddi; RNG tüketmez.
   - filo/koloni: her komut yalnız kendi devletinde; ağdan = doğrudan motor (Save8 + RNG, motor işlevi olanlarda);
     başkasının filosu 'not-owner'; reddedilen komut dünyayı değiştirmez; motorun "oyuncu" bildirimi host günlüğüne değil
     o oyuncunun kendi listesine gider.
   - ayna: vasal / senyör misafir için yeniden numaralandırılmış vasallık kayıtları motorun kendi deserialize'ından geçer;
     federasyon oylaması yalnız üyeye, davet yalnız davet edilene; gerçek gelen kutusu kayıtları misafirde oluşur;
     ekonomi geçmişi yalnız kendi satırı. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();MP.observeHumans();}}}';
const A=1,B=3,C=4,CONN={[A]:'cA',[B]:'cB',[C]:'cC'};
const POLITICS=`
  for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala','tuk','yiy'])e.res[k]=Math.max(e.res[k],2000);}
  const pairs=[[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,5],[2,3],[2,5],[3,5],[4,5],[2,4]];   // C(4) A ve B ile temassız
  for(const [a,b] of pairs){G.emps[a].contact[b]=G.emps[b].contact[a]=true;G.emps[a].rel[b]=G.emps[b].rel[a]=60;}
  var F={id:100,name:'MP61 Test Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:5,founder:5,members:[5,2,3],laws:{},fund:{ala:0,ene:0},treasury:0,
    founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
  G.feds=[F];G.fedUid=100;for(const a of F.members)for(const b of F.members)if(a!==b)G.emps[a].ally[b]=true;fedNormalize(F);
  for(const id of F.members)recalcMods(G.emps[id]);`;
function world(){
  const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);h.sb.__out=[];h.sb.__hs=[];h.sb.__now=1e6;
  h.run(MIR);h.run(CORE);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'r61',random:__rand,now:()=>__now,send:(c,t)=>__out.push([c,t]),kick(){},onSpeed:i=>__hs.push(i),
      lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}],['cC',${C}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c==='cB'?'Bora':c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};${POLITICS};MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function cmd(h,who,c,extra={}){const conn=CONN[who],n=h.sb.__out.length,s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid:'m61'+conn+String(s).padStart(5,'0'),cmd:c,...extra}))})`);
  return h.sb.__out.slice(n).filter(([cc])=>cc===conn).map(([,t])=>JSON.parse(t)).find(m=>m.type==='result');}
const msgs=(h,conn,type)=>h.sb.__out.filter(([c])=>c===conn).map(([,t])=>JSON.parse(t)).filter(m=>m.type===type);
const st=h=>({save:h.run('serialize()'),rng:h.run('RND_STATE')});
function guest(text){const g=runtime({root});g.sb.__t=text;assert.equal(g.run('deserialize(__t)'),true,'engine deserialize accepts the mirror');return g;}
const mirror=(h,me)=>h.run(`JSON.stringify(StarsMirror.build(${me},{cosmeticSeed:7}))`);

test('ortak hız: misafirin hız komutu host hızını değiştirir ve HERKESE yayınlanır; ad alıcının bakışından (temas → devlet adı, yoksa lobi adı); kendine "self"; host da aynı bildirimi alır; RNG tüketmez',()=>{
  const h=world();const r0=h.run('RND_STATE');
  assert.equal(cmd(h,B,{kind:'speed',value:2}).status,'ok');assert.equal(J(h,'G.speed'),2);
  const nB=J(h,'G.emps[3].name');
  const [a]=msgs(h,'cA','speed').slice(-1),[b]=msgs(h,'cB','speed').slice(-1),[c]=msgs(h,'cC','speed').slice(-1);
  assert.deepEqual([a.spd,a.who,a.self,a.auto],[2,nB,0,0],'A has contact with B → empire name');
  assert.deepEqual([b.spd,b.self],[2,1],'B sees its own change as self');
  assert.deepEqual([c.spd,c.who],[2,'Bora'],'C has no contact with B → lobby name, empire name not leaked');
  assert(!JSON.stringify(msgs(h,'cC','speed')).includes(nB),'uncontacted empire name never sent to C');
  const hs=h.sb.__hs.at(-1);assert.deepEqual([hs.spd,hs.who,hs.self,hs.auto],[2,nB,false,false],'host sees the same notice');
  assert.equal(h.run('RND_STATE'),r0,'speed changes consume no RNG');
});
test('ortak hız: aynı hız "same" ile reddedilir ve bildirim üretmez; oyuncu başına spam koruması (en az 700 ms, 20 s\'de en çok 8); başka oyuncu etkilenmez',()=>{
  const h=world();assert.equal(cmd(h,B,{kind:'speed',value:2}).status,'ok');const n=msgs(h,'cA','speed').length;
  assert.equal(cmd(h,A,{kind:'speed',value:2}).code,'rules:same');assert.equal(msgs(h,'cA','speed').length,n,'no notice for the same speed');
  assert.equal(cmd(h,B,{kind:'speed',value:3}).code,'rules:rate-limited','too soon for the same player');
  assert.equal(cmd(h,A,{kind:'speed',value:3}).status,'ok','another player is not limited');assert.equal(J(h,'G.speed'),3);
  let ok=1;for(let i=0;i<12;i++){h.run('__now+=800');if(cmd(h,B,{kind:'speed',value:i%2?1:4}).status==='ok')ok++;}
  assert.equal(ok,8,'at most 8 changes per 20 s window');
  h.run('__now+=21000');assert.equal(cmd(h,B,{kind:'speed',value:J(h,'G.speed')===1?2:1}).status,'ok','window slides');
  assert.equal(cmd(h,B,{kind:'speed',value:9}).code,'bad-params');assert.equal(cmd(h,B,{kind:'speed',value:2,who:'x'}).code,'bad-params');
});
test('ortak hız: host\'un kendi düğmesi (local) aynı yoldan; host\'un iç duraklatması (speedSync) "auto" + neden; değişmeyince yayın yok; dönen oyuncu güncel hızı bildirimsiz alır; duraklatılmış oturumda komut reddi',()=>{
  const h=world();h.run('MP.speedSync()');
  const x=J(h,`MP.local({kind:'speed',value:4})`);assert.equal(x.ok,true);assert.equal(J(h,'G.speed'),4);
  const c=msgs(h,'cC','speed').at(-1);assert.deepEqual([c.spd,c.who],[4,J(h,'G.emps[0].name')],'C has contact with the host empire');
  h.run('G.speed=0');assert.equal(J(h,`MP.speedSync('window')`),true);const w=msgs(h,'cA','speed').at(-1);assert.deepEqual([w.spd,w.auto,w.reason],[0,1,'window']);
  const n=msgs(h,'cA','speed').length;assert.equal(J(h,`MP.speedSync('window')`),false);assert.equal(msgs(h,'cA','speed').length,n,'unchanged → no broadcast');
  const tok=msgs(h,'cB','assign')[0].token;h.run(`MP.onMessage('cB2',JSON.stringify({v:1,type:'hello',name:'Bora',token:'${tok}'}))`);
  const r=msgs(h,'cB2','speed');assert.equal(r.length,1);assert.deepEqual([r[0].spd,r[0].silent],[0,1],'reconnect → current speed, silent');
  h.run('MP.setPaused(true,"host")');CONN[B]='cB2';try{assert.equal(cmd(h,B,{kind:'speed',value:2}).code,'paused');}finally{CONN[B]='cB';}
});
test('filo: duruş / böl / tür ayır / birleştir / dur / otomatik keşif yalnız kendi filosunda; başkasının filosu "not-owner"; reddedilen komut dünyayı değiştirmez',()=>{
  const h=world();const fleets=()=>J(h,'G.fleets.filter(f=>f.e===3).map(f=>[f.id,f.ships.map(s=>s.c).join(",")])');
  const war=J(h,'G.fleets.find(f=>f.e===3&&f.ships.some(s=>s.c==="kor")).id'),sci=J(h,'G.fleets.find(f=>f.e===3&&f.ships.some(s=>s.c==="bil")).id');
  const foreign=J(h,'G.fleets.find(f=>f.e===4&&f.ships.length).id');const s0=st(h);
  for(const k of ['stance','stop','merge','split','explore'])assert.equal(cmd(h,B,{kind:k,fleet:foreign}).code,'not-owner',k);
  assert.equal(cmd(h,B,{kind:'splitType',fleet:foreign,cls:'kor',all:false}).code,'not-owner');assert.deepEqual(st(h),s0,'rejections change nothing');
  const s1=J(h,`G.fleets.find(f=>f.id===${war}).stance`);assert.equal(cmd(h,B,{kind:'stance',fleet:war}).status,'ok');assert.notEqual(J(h,`G.fleets.find(f=>f.id===${war}).stance`),s1);
  const n0=fleets().length;assert.equal(cmd(h,B,{kind:'split',fleet:war}).status,'ok');assert.equal(fleets().length,n0+1);
  assert.equal(cmd(h,B,{kind:'merge',fleet:war}).status,'ok');assert.equal(fleets().length,n0);assert.equal(cmd(h,B,{kind:'merge',fleet:war}).code,'rules:none');
  assert.equal(cmd(h,B,{kind:'splitType',fleet:war,cls:'kor',all:false}).status,'ok');assert.equal(fleets().length,n0+1);
  assert.equal(cmd(h,B,{kind:'splitType',fleet:war,cls:'kru',all:true}).code,'rules:none');
  assert.equal(cmd(h,B,{kind:'explore',fleet:war}).code,'rules:role');
  const au=J(h,`G.fleets.find(f=>f.id===${sci}).auto`);assert.equal(cmd(h,B,{kind:'explore',fleet:sci}).status,'ok');assert.equal(J(h,`G.fleets.find(f=>f.id===${sci}).auto`),!au);
  assert.equal(cmd(h,B,{kind:'exploreAll'}).status,'ok');
  const to=J(h,`G.sys[G.emps[3].home].lanes[0]`);assert.equal(cmd(h,B,{kind:'move',fleet:war,to}).status,'ok');assert(J(h,`G.fleets.find(f=>f.id===${war}).path.length`)>0);
  assert.equal(cmd(h,B,{kind:'stop',fleet:war}).status,'ok');assert.deepEqual(J(h,`[G.fleets.find(f=>f.id===${war}).path.length,G.fleets.find(f=>f.id===${war}).ord]`),[0,null]);
});
test('koloni / tersane: gemi üretimi, yıkım, iptal, odak — ağdan = doğrudan motor (queueShip / queueDemolish / cancelBuild / setFocus; Save8 + RNG); başkasının sistemi reddedilir',()=>{
  const a=world(),b=world();const home=J(a,'G.emps[3].home');
  assert.equal(cmd(a,B,{kind:'ship',sys:J(a,'G.emps[4].home'),key:'kor'}).code,'not-owner');
  assert.equal(cmd(a,B,{kind:'ship',sys:home,key:'kor'}).status,'ok');b.run(`if(!queueShip(G.emps[3],G.sys[${home}],'kor'))throw Error('engine')`);
  assert.equal(J(a,`G.sys[${home}].queue.length`),J(b,`G.sys[${home}].queue.length`));
  const pl=J(a,`G.sys[${home}].planets.find(p=>p.owner===3&&p.col).i`),bk=J(a,`Object.keys(G.sys[${home}].planets.find(p=>p.i===${pl}).col.b).find(k=>k!=='santral'&&G.sys[${home}].planets.find(p=>p.i===${pl}).col.b[k]>0)`);
  assert.equal(cmd(a,B,{kind:'demolish',sys:home,planet:pl,key:bk}).status,'ok');b.run(`if(!queueDemolish(G.emps[3],G.sys[${home}],G.sys[${home}].planets.find(p=>p.i===${pl}),${JSON.stringify(bk)}))throw Error('engine')`);
  const qi=J(a,`G.sys[${home}].planets.find(p=>p.i===${pl}).col.q.length-1`);
  assert.equal(cmd(a,B,{kind:'cancel',sys:home,planet:pl,index:qi}).status,'ok');b.run(`cancelBuild(G.emps[3],G.sys[${home}],G.sys[${home}].planets.find(p=>p.i===${pl}),${qi})`);
  const fk=J(a,`Object.keys(FOCUS).find(k=>k!==G.sys[${home}].planets.find(p=>p.i===${pl}).col.f)`);
  assert.equal(cmd(a,B,{kind:'focus',sys:home,planet:pl,key:fk}).status,'ok');b.run(`setFocus(G.emps[3],G.sys[${home}],G.sys[${home}].planets.find(p=>p.i===${pl}),${JSON.stringify(fk)})`);
  const x=st(a),y=st(b);assert.equal(x.rng,y.rng,'RNG');assert.equal(x.save,y.save,'MP == engine (Save8)');
  const none=J(a,`Object.keys(BUILDINGS).find(k=>!(G.sys[${home}].planets.find(p=>p.i===${pl}).col.b[k]>0))`);
  assert.equal(cmd(a,B,{kind:'demolish',sys:home,planet:pl,key:none}).code,'rules:none','nothing to demolish → rejected');
});
test('kolonileştir: tek oyunculu düğmenin mantığı (oradaki koloni gemisi; hedef kilidi; tek gemi harcanır); yalnız kendi gemisiyle; "Koloni kuruldu" bildirimi host günlüğüne değil oyuncunun kendi listesine',()=>{
  const h=world();
  const t=J(h,`(()=>{const e=G.emps[3];for(const s of G.sys)if(s.surv.includes(3))for(const p of s.planets)if(canColonize(e,s,p))return [s.id,p.i];return null;})()`);
  assert(t,'fixture: a colonizable planet exists for B');const [sid,pid]=t;
  const kol=J(h,'G.fleets.find(f=>f.e===3&&f.ships.some(s=>s.c==="kol")).id'),kB=()=>J(h,`G.fleets.find(f=>f.id===${kol})`);
  const b0=kB();cmd(h,C,{kind:'colonize',sys:sid,planet:pid,fleet:kol});assert.deepEqual(kB(),b0,'C naming B\'s colony ship never moves or spends it');
  h.run(`{const f=G.fleets.find(f=>f.id===${kol});f.sys=${sid};f.x=G.sys[${sid}].x;f.y=G.sys[${sid}].y;f.path=[];f.mv=null;}`);   // gemi hedefte
  const log0=J(h,'G.log.length');
  assert.equal(cmd(h,B,{kind:'colonize',sys:sid,planet:pid}).status,'ok');
  assert.equal(J(h,`G.sys[${sid}].planets.find(p=>p.i===${pid}).owner`),3);assert.equal(J(h,`G.fleets.some(f=>f.id===${kol}&&f.ships.some(s=>s.c==="kol"))`),false,'one colony ship spent');
  assert(!J(h,`G.log.slice(${log0}).map(x=>x.m)`).some(m=>/Koloni kuruldu/.test(m)),'not in the host log');
  h.run('MP.publish()');const v=msgs(h,'cB','snapshot').concat(msgs(h,'cB','delta'));
  assert(JSON.stringify(v).includes('Koloni kuruldu'),'in the player\'s own notes');
  assert.equal(cmd(h,B,{kind:'colonize',sys:sid,planet:pid}).code,'no-colony-ship');
});
test('ayna: vasal ve senyör misafir — vasallık sözleşmesi ve müzakere yeniden numaralandırılır, motorun deserialize\'ı (restoreVassalContracts) kabul eder; müzakere yalnız taraflara; gerçek gelen kutusunda "vassal" kaydı',()=>{
  const h=world();h.run(`if(!subjugate(G.emps[5],G.emps[3],'haracguzar'))throw Error('subjugate')`);
  const g3=guest(mirror(h,3));assert.deepEqual(J(g3,'[G.p.overlord,G.p.vassalContract.sub,G.p.vassalContract.lord]'),[5,0,5]);
  const g5=guest(mirror(h,5));assert.deepEqual(J(g5,'[G.emps[3].overlord,G.emps[3].vassalContract.sub,G.emps[3].vassalContract.lord]'),[0,3,0]);
  /* müzakere: motorun kurallarına uyan ilk insan–X çifti (talep ya da himaye); taraf olan insan misafirin aynasında, olmayanda yok */
  const h2=world();const p=J(h2,`(()=>{for(const sub of [1,4])for(const lord of [0,2,5]){if(!G.emps[sub].contact[lord])continue;const r=vassalOffer(G.emps[sub],G.emps[lord],'seek','bekci',null);if(r.ok)return [sub,lord];}
    for(const lord of [1,4])for(const sub of [2,5]){if(!G.emps[lord].contact[sub])continue;const r=vassalOffer(G.emps[lord],G.emps[sub],'demand','haracguzar',null);if(r.ok)return [sub,lord];}return null;})()`);
  assert(p,'fixture: a legal vassal negotiation with a human party');const [sub,lord]=p,human=[1,4].includes(sub)?sub:lord,other=human===1?4:1;
  const m=JSON.parse(mirror(h2,human)),loc=id=>id===human?0:id===0?human:id;const q=m.emps[loc(sub)].vassalTalk;
  assert.deepEqual([q.sub,q.lord],[loc(sub),loc(lord)],'renumbered');
  const gH=guest(JSON.stringify(m));assert.equal(J(gH,`G.emps[${loc(sub)}].vassalTalk.id`),J(h2,`G.emps[${sub}].vassalTalk.id`));
  assert(J(gH,'DiplomaticInbox.state().records.filter(r=>r.kind==="vassal").length')>=1,'real STARS inbox gets the vassal record');
  const mo=JSON.parse(mirror(h2,other));assert.equal(mo.emps[other===sub?0:sub===0?other:sub].vassalTalk,undefined,'not a party → no negotiation');
});
test('ayna: federasyon oylaması yalnız üyeye (oy kimliği host\'unkiyle aynı → gerçek gelen kutusu kaydı); davet yalnız davet edilene; AI değerlendirmeleri girmez',()=>{
  const h=world();const k=J(h,`[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)].find(k=>canFedLaw(G.emps[5],k,false).ok)`);h.run(`proposeFedLaw(G.emps[5],${JSON.stringify(k)})`);
  h.run(`F.invites[${A}]={expires:G.day+200,by:5,terms:fedCharterKey(F)}`);
  const tok=J(h,'fedVoteToken(F.vote)');
  const mB=JSON.parse(mirror(h,B)),fB=mB.world.feds.find(f=>f.id===100);assert.equal(fB.vote.id,J(h,'F.vote.id'));assert.equal(fB.vote.assessments,undefined);assert.equal(fB.vote.reasons,undefined);
  const gB=guest(JSON.stringify(mB));assert.deepEqual(J(gB,'DiplomaticInbox.state().records.filter(r=>r.kind==="fedvote").map(r=>r.token)'),[tok]);
  const mA=JSON.parse(mirror(h,A)),fA=mA.world.feds.find(f=>f.id===100);assert.equal(fA.vote,null,'non-member: no vote');assert.deepEqual(Object.keys(fA.invites),['0'],'only own invite');
  const gA=guest(JSON.stringify(mA));assert.equal(J(gA,'DiplomaticInbox.state().records.filter(r=>r.kind==="invite").length'),1);
  const mC=JSON.parse(mirror(h,C)),fC=mC.world.feds.find(f=>f.id===100);assert.deepEqual([fC.vote,Object.keys(fC.invites).length],[null,0]);
});
test('ayna: ekonomi geçmişi yalnız misafirin kendi satırı (devlet 0); motorun EconomyLedger.restore\'u kabul eder; host Save8/RNG değişmez',()=>{
  const h=world();h.run('step(40)');const s0=st(h);const m=JSON.parse(mirror(h,B));assert.deepEqual(st(h),s0,'mirror is pure');
  assert.deepEqual(Object.keys(m.economyHistory.empires),['0']);
  const row=J(h,'G.economyHistory.empires[3]');assert.deepEqual(m.economyHistory.empires[0].balance,row.balance);assert(m.economyHistory.empires[0].events.length<=40);
  const g=guest(JSON.stringify(m));assert.deepEqual(J(g,'G.economyHistory.empires[0].months.length'),row.months.length);
});
end();
