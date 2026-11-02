'use strict';
/* MP.7.3 — Galaktik Konsey, siyasi entrikalar ve yıkıcı savaş host'un GERÇEK motorunda (Node vm).
   Dünya: seed 22, orta, 5 AI, misafir A=1, B=3 (mp3/mp71/mp72 testleriyle aynı). Konsey motorun kendi yoluyla (kongre, COUNCIL_FOUND_TURN)
   kurulur; insan devletler motor kuralıyla kurucu üyedir. Sınanan: AI insan adına gündem / sponsor / oy üretmez; insan oyu yalnız kendi
   komutuyla; oylama bütün insan üyeler oy verince (ya da 24 ay sınırında) kapanır; yinelenen / yetkisiz / eski oy; rüşvet-şantaj insan
   hedefe yapılmaz; daimi hükümdarlık insan üye varken talep edilemez; entrikalar aktörün kendi devletinde; uzak insan yokken Save8/RNG aynı. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();if(typeof MP!=="undefined"&&MP.observeHumans)MP.observeHumans();}}}';
const A=1,B=3,CONN={[A]:'cA',[B]:'cB'};
let cache=null;
/* konsey + açık oylama olan dünya (kongreyle kurulur); her test kendi kopyasını alır (Save8 → yeni host) */
function world(){
  const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);h.sb.__out=[];
  h.run(CORE);h.run(MIR);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'r73',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},hostNotify(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(3);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};
    step(180);
    /* fikstür: insanlar ve AI'lar arasında temas (oynanmayan insanların keşfi yavaş); konsey ve oylama motorun KENDİ işlevleriyle */
    for(const a of G.emps)for(const b of G.emps)if(a!==b&&!a.wild&&!b.wild){a.contact[b.id]=true;}
    if(!foundCouncilByConvention())throw Error('council');startCouncilVote();if(!(G.council.vote&&!G.council.vote.done))throw Error('vote');
    for(const e of [0,${A},${B}])for(const r of ['min','ene','etk','ala'])G.emps[e].res[r]=Math.max(G.emps[e].res[r],3000);MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function cmd(h,who,c){const conn=CONN[who],n=h.sb.__out.length,s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid:'m73'+conn+String(s).padStart(5,'0'),cmd:c}))})`);
  return h.sb.__out.slice(n).filter(([cc])=>cc===conn).map(([,t])=>JSON.parse(t)).find(m=>m.type==='result');}
const code=r=>r.status==='ok'?'ok':r.code;
const tok=h=>J(h,`G.council.vote.key+':'+(G.council.vote.target===null||G.council.vote.target===undefined?'':G.council.vote.target)`);
function lastView(h,who){const conn=CONN[who];let v=null,base=null;for(const [c,t] of h.sb.__out){if(c!==conn)continue;const m=JSON.parse(t);
  if(m.type==='snapshot'){v=JSON.parse(JSON.stringify(m.view));base=m.rev;}else if(m.type==='delta'&&v&&m.base===base){const o=m.ops||{};
    for(const [s,u] of Object.entries(o.up||{}))Object.assign(v[s],u);for(const [s,r] of Object.entries(o.rm||{}))for(const k of r)delete v[s][k];for(const [s,x] of Object.entries(o.set||{}))v[s]=x;base=m.rev;}}return v;}

test('konsey motorun kendi yoluyla kurulur; açık oylamada AI uzak insan adına sponsor / oy / gündem destekçisi YAZMAZ',()=>{
  const h=world();const c=J(h,'G.council');
  assert(c&&c.vote&&!c.vote.done,'council vote open');assert(c.members.includes(A)&&c.members.includes(B),'humans are members (engine convention)');
  for(const id of [A,B]){assert(!c.vote.yes.includes(id)&&!c.vote.no.includes(id),'no AI vote for human '+id);assert.notEqual(c.vote.sponsor,id,'human not auto-sponsor');
    for(const a of c.agenda||[]){assert(!a.backers.includes(id),'no AI backing for human');assert.notEqual(a.by,id);}}
  h.run('MP.publish()');assert(lastView(h,A).log.some(x=>/KONSEY OYLAMASI/.test(x.m)),'A notified');
});
test('insan oyları: A ve B kendi komutuyla oy verir; host (devlet 0) de oy verene kadar oylama açık kalır; son insan oyuyla motorun finishCouncilVote\'u kapatır',()=>{
  const h=world(),t=tok(h),host0=J(h,'G.council.members.includes(0)');
  assert.equal(code(cmd(h,A,{kind:'councilVote',token:t,yes:true})),'ok');assert.equal(J(h,'G.council.vote.done'),false,'still open (B, host)');
  assert(J(h,`G.council.vote.yes.includes(${A})`));
  assert.equal(code(cmd(h,B,{kind:'councilVote',token:t,yes:false})),'ok');assert(J(h,`G.council.vote.no.includes(${B})`));
  if(host0){assert.equal(J(h,'G.council.vote&&G.council.vote.done'),false,'waits for the host vote');
    h.run('G.council.vote.yes.push(0);finishCouncilVote();');}   // tek oyunculu cncYes düğmesinin işlemi
  assert.equal(J(h,'!G.council.vote||G.council.vote.done'),true,'closed after all humans voted');
});
test('oy yetkisi: yinelenen oy "voted", eski belirteç "stale", üye olmayan "yok", oylama yokken "no-vote"; reddedilen oy dünyayı değiştirmez',()=>{
  const h=world(),t=tok(h);
  assert.equal(code(cmd(h,A,{kind:'councilVote',token:t,yes:true})),'ok');
  const s0=h.run('JSON.stringify(G.council.vote)');
  assert.equal(code(cmd(h,A,{kind:'councilVote',token:t,yes:false})),'rules:voted');
  assert.equal(code(cmd(h,B,{kind:'councilVote',token:'zzz:',yes:true})),'rules:stale');
  assert.equal(code(cmd(h,B,{kind:'councilVote',token:t,yes:'evet'})),'bad-params');
  assert.equal(h.run('JSON.stringify(G.council.vote)'),s0);
  h.run(`G.council.members=G.council.members.filter(m=>m!==${B})`);assert.equal(code(cmd(h,B,{kind:'councilVote',token:t,yes:true})),'no-council');
});
test('zaman aşımı: insan hiç oy vermezse motorun 24 ay sınırında oylama kapanır (sonsuz bekleme yok)',()=>{
  const h=world();h.run('for(let i=0;i<26&&G.council.vote&&!G.council.vote.done;i++)step(30);');
  assert.equal(J(h,'!G.council.vote||G.council.vote.done'),true);
});
test('tasarı: A kendi tasarısını sunar (proposeBill; kampanya sponsoru A); açık oylama varken motorun gerekçesi; rüşvet / şantaj insan üyeye reddedilir, AI üyeye motor kuralı',()=>{
  const h=world();assert.equal(code(cmd(h,A,{kind:'bill',key:'bilim',target:null})),'rules:council','vote open → engine reason');
  h.run('G.council.vote.done=true;G.council.vote=null;G.council.campaign=null;');
  const r=cmd(h,A,{kind:'bill',key:'bilim',target:null});assert.equal(code(r),'ok',JSON.stringify(r));
  assert.deepEqual(J(h,'[G.council.campaign.key,G.council.campaign.sponsor]'),['bilim',A]);
  assert.equal(code(cmd(h,A,{kind:'bribe',target:B,yon:'no'})),'rules:human');assert.equal(code(cmd(h,A,{kind:'blackmail',target:0,yon:'no'})),'rules:human');
  const ai=J(h,`G.council.members.find(m=>G.emps[m].ai)`),m0=J(h,`[G.emps[${A}].res.min,G.emps[${ai}].res.min]`);
  assert.equal(code(cmd(h,A,{kind:'bribe',target:ai,yon:'yes'})),'ok');const m1=J(h,`[G.emps[${A}].res.min,G.emps[${ai}].res.min]`);
  assert.deepEqual([Math.round(m0[0]-m1[0]),Math.round(m1[1]-m0[1])],[200,200]);
  assert.equal(code(cmd(h,A,{kind:'bribe',target:ai,yon:'yes'})),'rules:engine','second bribe on the same member refused by the engine');
  const bm=cmd(h,A,{kind:'blackmail',target:ai,yon:'yes'});assert(['ok','rules:engine'].includes(code(bm)),JSON.stringify(bm));
  /* host'un kendi STARS arayüzünden insana rüşvet de reddedilir */
  assert.equal(J(h,`bribeVote(G.p,G.emps[${B}],200,'yes').ok`),false);
});
test('daimi hükümdarlık: başka insan üye varken talep edilemez (üyelerin oyu motorda zarla); host\'un arayüzü de; veto / taht / reform motorun kendi gerekçesiyle',()=>{
  const h=world();assert.equal(code(cmd(h,A,{kind:'permanent'})),'rules:human');
  assert.equal(J(h,'claimPermanent(G.p).ok'),false);assert.match(J(h,'claimPermanent(G.p).why'),/zarla/);
  const law=J(h,'Object.keys(RESOLUTIONS)[0]');const v=cmd(h,A,{kind:'veto',law});assert.equal(v.code,'rules:engine');
  assert.equal(code(cmd(h,A,{kind:'veto',law:'zzz'})),'bad-params');
  const th=cmd(h,A,{kind:'throne',sys:J(h,`G.emps[${A}].home`)});assert.equal(th.code,'rules:engine');
  const rf=cmd(h,A,{kind:'reform',axis:'mil',dir:1});assert(['ok','rules:engine'].includes(code(rf)),JSON.stringify(rf));
  assert.equal(code(cmd(h,A,{kind:'reform',axis:'zzz',dir:1})),'bad-params');
});
test('ayna gizliliği: misafir konseyi kimlikleri π ile görür; rüşvetin yönü/gücü ve şantajın yönü gitmez; host\'un konsey dışı verisi yok',()=>{
  const h=world();h.run('G.council.vote.done=true;G.council.vote=null;G.council.campaign=null;');assert.equal(code(cmd(h,A,{kind:'bill',key:'bilim',target:null})),'ok');
  const ai=J(h,`G.council.members.find(m=>G.emps[m].ai)`);assert.equal(code(cmd(h,A,{kind:'bribe',target:ai,yon:'no'})),'ok');
  const m=J(h,`StarsMirror.build(${B},{cosmeticSeed:1}).world.council`),pi=x=>x===B?0:x===0?B:x;
  assert.deepEqual(m.members.slice().sort(),J(h,'G.council.members').map(pi).sort());assert.equal(m.campaign.sponsor,pi(A));
  assert.deepEqual(m.campaign.bribed,{[pi(ai)]:1},'only the lock, no direction / strength');assert.equal(J(h,`G.council.campaign.bribed[${ai}]<0`),true,'host has the real (negative) value');
});
test('entrikalar aktörün kendi devletinde: fısıltı A\'nın günlüğüne (host\'unkine değil), bağımsızlık savaşı vasal değilse reddedilir, fon / Panoptikon / lider şantajı motorun gerekçesi; görünmeyen hedef "yok"',()=>{
  const h=world();const [a,b]=J(h,`G.emps.filter(e=>e.ai&&!e.dead&&G.emps[${A}].contact[e.id]).slice(0,2).map(e=>e.id)`);
  if(a!==undefined&&b!==undefined){const w0=J(h,`[(G.emps[${A}].whisperLog||[]).length,(G.p.whisperLog||[]).length]`);const r=cmd(h,A,{kind:'whisper',a,b,blame:null});
    if(code(r)==='ok'){assert.deepEqual(J(h,`[(G.emps[${A}].whisperLog||[]).length,(G.p.whisperLog||[]).length]`),[w0[0]+1,w0[1]],'logged for A, not the host');}
    else assert.equal(r.code,'rules:engine',JSON.stringify(r));}
  assert.equal(code(cmd(h,A,{kind:'revolt'})),'rules:not-vassal');
  for(const c of [{kind:'fundSep',target:B},{kind:'panopt',from:0,to:J(h,`G.emps[${A}].home`)},{kind:'bmLeader',target:B,leader:1}])assert.equal(cmd(h,A,c).code,'rules:engine',JSON.stringify(c));
  const unseen=J(h,`G.sys.find(s=>!s.seen.includes(${A}))?.id??null`);if(unseen!==null)assert.equal(code(cmd(h,A,{kind:'panopt',from:0,to:unseen})),'no-target');
});
test('yıkıcı savaş: yutma / Kolossus yalnız motor koşuluyla; host\'un filosu not-owner, Kolossus olmayan filo reddedilir; reddedilen işlem dünyayı değiştirmez',()=>{
  const h=world();const s0=h.run('serialize()');const home=J(h,`G.emps[${B}].home`),pl=J(h,`G.sys[${B===3?'G.emps[3].home':0}].planets[0].i`);
  const d=cmd(h,A,{kind:'devour',sys:home,planet:pl});assert(['rules:engine','no-target'].includes(code(d)),JSON.stringify(d));
  const hf=J(h,'G.fleets.find(f=>f.e===0&&f.ships.length).id'),af=J(h,`G.fleets.find(f=>f.e===${A}&&f.ships.length).id`);
  assert.equal(code(cmd(h,A,{kind:'colFire',fleet:hf,mod:'catlat'})),'not-owner');assert.equal(code(cmd(h,A,{kind:'colFire',fleet:af,mod:'catlat'})),'rules:war');
  assert.equal(code(cmd(h,A,{kind:'colFire',fleet:af,mod:'nuke'})),'bad-params');assert.equal(h.run('serialize()'),s0);
});
test('yutma: Yıldız Yiyen devlet kendi yörüngesindeki kolonisiz gezegeni tüketir (motorun devourPlanet\'i, kazanç aktöre); aynı komut ikinci kez yıkım yapmaz (motor reddeder, dünya değişmez)',()=>{
  const h=world();
  const t=J(h,`(()=>{const e=G.emps[${A}];e.civics=[...(e.civics||[]),'yildiz_yiyen'];const sys=G.sys[e.home];const pl=sys.planets.find(p=>!p.col&&p.devoured===undefined&&!p.shattered&&p.t!=='enkaz');
    if(!G.fleets.some(f=>f.e===e.id&&f.sys===sys.id&&!f.mv&&f.ships.length)){const f=G.fleets.find(f=>f.e===e.id&&f.ships.length);f.sys=sys.id;f.mv=null;f.path=[];f.combat=null;f.retreating=false;}
    return pl?{sys:sys.id,planet:pl.i,min:e.res.min}:null;})()`);
  assert(t,'fixture planet');const r=cmd(h,A,{kind:'devour',sys:t.sys,planet:t.planet});assert.equal(r.status,'ok',JSON.stringify(r));
  assert.equal(J(h,`G.sys[${t.sys}].planets.find(p=>p.i===${t.planet}).devoured`),true);assert(J(h,`G.emps[${A}].res.min`)>t.min,'gain to the actor');
  const s1=h.run('serialize()'),r2=cmd(h,A,{kind:'devour',sys:t.sys,planet:t.planet});assert.equal(r2.code,'rules:engine',JSON.stringify(r2));assert.equal(h.run('serialize()'),s1,'no second destruction');
  assert.equal(code(cmd(h,B,{kind:'devour',sys:t.sys,planet:t.planet})),code(cmd(h,B,{kind:'devour',sys:t.sys,planet:t.planet})));   // başka devlet de aynı ret (tekrar dokunma dahil)
});
test('konsey eşdeğerliği: uzak insan yokken yamalı konsey motoru (gündem, kampanya, oylama, otomatik katılım) 25 yıl tek oyunculuyla aynı: Save8 ve RNG birebir',()=>{
  const mk=guard=>{const h=runtime({root});h.run(CORE);h.run(`${STEP}setupGame({...CFG,size:'orta',aiCount:5,seed:22});G.autoSave=false;${guard?"var MP=StarsMP.createHost({roomId:'q',random:()=>'ab',send(){},kick(){}});MP.installGuards();":''}`);return h;};
  const a=mk(true),b=mk(false);a.run('step(9000)');b.run('step(9000)');
  assert(J(a,'!!G.council'),'council formed during the run');assert.equal(a.run('serialize()'),b.run('serialize()'));assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
});
end();
