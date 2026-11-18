'use strict';
// A1–A3: bağımsız inceleme fikstürü, yeni adayın her durumda tek ücret garantisini doğrular.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {performance}=require('node:perf_hooks');
const {world,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
const {runtime}=require('./helpers/runtime');

function setupYard(h,empire=1){
  h.run(`var E=G.emps[${empire}],SY=G.sys[E.home];
    for(const k in E.res)E.res[k]=100000;
    SY.planets.find(p=>p.col&&p.owner===E.id).col.b.tersane=1;
    SY.queue=[];`);
  return {kind:'ship',sys:h.run('SY.id'),key:'kor'};
}

function message(h,actor,body){
  const start=h.sb.out.length;
  h.sb.frame=JSON.stringify({v:1,...body});
  h.run(`MP.onMessage(${JSON.stringify(actor)},frame)`);
  return h.sb.out.slice(start).filter(([to])=>to===actor).map(([,s])=>JSON.parse(s));
}

const cmd=(seq,cid,body)=>({type:'cmd',seq,cid,cmd:body});
const result=(h,frame,actor='B')=>message(h,actor,frame).find(x=>x.type==='result');
const state=h=>J(h,'({orders:SY.queue.length,resources:E.res})');
function settled(h,frame){
  const before=state(h);
  assert.equal(result(h,frame).status,'ok');
  const after=state(h);
  assert.equal(after.orders,before.orders+1);
  const cost=J(h,`shipCost(E,${JSON.stringify(frame.cmd.key)})`);
  for(const [r,amount] of Object.entries(cost))assert.equal(before.resources[r]-after.resources[r],amount);
  return after;
}
function regain(h,pkg){
  const b=runtime();
  b.sb.pkg=pkg;
  b.sb.token=h.run('[...MP.state.players.values()].find(p=>p.empireId===1).token');
  b.sb.out=[];
  b.sb.rand=k=>'ab'.repeat(k);
  b.run(fs.readFileSync('research/mp0/mp-core.js','utf8'));
  b.run(fs.readFileSync('research/mp6/mirror.js','utf8'));
  assert.equal(b.run('StarsMP.validatePackage(pkg).ok'),true);
  b.run(`if(!StarsMP.loadWorld(pkg).ok)throw Error('load');
    var MP=StarsMP.createHost({roomId:'new-room',random:rand,send:(c,t)=>out.push([c,t]),lobby:{generate(){return {ok:false}}},resume:pkg});
    MP.installGuards();
    MP.onMessage('B',JSON.stringify({v:1,type:'hello',name:'B',token}));
    if(!MP.resumeStart().ok)throw Error('resume');
    var E=G.emps[1],SY=G.sys[E.home];`);
  assert.equal(b.run("MP.state.players.get(MP.state.conns.get('B')).empireId"),1);
  return b;
}
let passes=0;
function report(name,data){passes++;console.log('PASS '+name+' '+JSON.stringify(data));}
function unchanged(h,frame,after){
  assert.equal(result(h,frame).code,'command-unconfirmed');
  assert.deepEqual(state(h),after);
}

for(const modern of [false,true]){
  const label=modern?'güncel kimlik':'eski kimlik';
  const h=world();
  const first=cmd(1,modern?'j1_1_fixture001':'audit_ship_0001',setupYard(h));
  const after=settled(h,first);
  assert.equal(result(h,{...first,seq:2}).dup,1);
  assert.deepEqual(state(h),after);
  report('A1 '+label,{orders:1,additionalCharge:0});

  for(let i=2;i<=129;i++)assert.equal(result(h,cmd(i,'audit_read_'+i,{kind:'warCenterRead',front:0})).status,'ok');
  assert.equal(h.run("MP.state.players.get(MP.state.conns.get('B')).results.size"),128);
  unchanged(h,{...first,seq:130},after);
  report('A2 '+label,{orders:1,additionalCharge:0,reads:128});

  const b=regain(h,J(h,'MP.snapshot({}).pkg'));
  unchanged(b,{...first,seq:130},after);
  if(modern)unchanged(b,first,after);
  settled(b,cmd(130,'j1_130_fixture02',first.cmd));
  report('A3 '+label,{ordersAfterRetry:1,additionalCharge:0,ordersAfterNewCommand:2});
}

{
  const h=world();const first=cmd(1,'audit_old_01',setupYard(h));const after=settled(h,first);
  const realP40=process.env.STARS_P40_PACKAGE;
  const pkg=realP40?JSON.parse(fs.readFileSync(realP40,'utf8')):J(h,'MP.snapshot({}).pkg');
  if(!realP40){
    pkg.build='96h10p40';
    for(const p of pkg.session.players)delete p.legacyCommands;
    h.sb.oldPkg=pkg;
    pkg.integrity.body=h.run(`(()=>{const {integrity,...body}=oldPkg;return StarsMP.sha256(StarsMP.canon({...body,save8:integrity.save8}));})()`);
  }
  const b=regain(h,pkg);
  unchanged(b,{...first,seq:2},after);
  settled(b,cmd(2,'j1_2_current001',first.cmd));
  report('P40 eski kayıt',{source:realP40?'gerçek p40 paketi':'p40 şema fikstürü',ordersAfterRetry:1,ordersAfterNewCommand:2});
}

{
  const h=world("saveId:'s-0000000000000001',");const b=world("saveId:'s-0000000000000002',");
  const cid='j1_1_context001';
  settled(h,cmd(1,cid,setupYard(h)));
  settled(b,cmd(1,cid,setupYard(b)));
  const c=setupYard(h,3);
  assert.equal(result(h,cmd(1,cid,c),'C').status,'ok');
  assert.equal(state(h).orders,1);
  report('Oyuncu ve kayıt kapsamı',{sameText:3,accepted:3});
}

{
  const h=world();const ship=setupYard(h);
  for(let i=1;i<=512;i++){
    // Geçerli komut türüyle eski kimlik bütçesini doldur; maliyetli iş üretme.
    assert.equal(result(h,cmd(i,'audit_bound_'+i,{kind:'ship',sys:ship.sys,key:'invalid'})).status,'rejected');
  }
  unchanged(h,cmd(513,'audit_bound_513',ship),state(h));
  settled(h,cmd(513,'j1_513_current01',ship));
  assert.equal(h.run("MP.state.players.get(MP.state.conns.get('B')).legacyCommands.size"),512);
  report('Sınırlı geçmiş',{legacyLimit:512,currentOrders:1});
}

{
  const h=world();setupYard(h);
  const event=J(h,"enqueueDecision(E,'anomaly','a1',E.home)");
  const first=cmd(1,'j1_1_event0001',{kind:'eventChoice',id:event.id,choice:0});
  const before=h.run('E.res.ara');
  assert.equal(result(h,first).status,'ok');
  assert.equal(h.run('E.res.ara')-before,180);
  const b=regain(h,J(h,'MP.snapshot({}).pkg'));
  unchanged(b,{...first,seq:2},state(h));
  report('Karar ödülü yeni host',{reward:180,additionalReward:0});
}

{
  const h=world();setupYard(h);
  h.run(`G.day=900;G.council=null;
    for(const e of G.emps){e.mizac='militarist';e.civics=[];e.factions=null;e.nap={};}
    fedFoundPropose(G.p,'bilimsel','equal',[1,3]);fedFoundReply(G.emps[1],1,true);
    fedFoundReply(G.emps[3],1,true);if(!fedFoundFinish(G.p,1).ok)throw Error('found');
    var F=G.feds[0],law=Object.keys(FED_LAWS).find(k=>!F.laws[k]);
    if(!proposeFedLaw(G.p,law).ok)throw Error('active vote');`);
  const vote=J(h,"({kind:'fedVote',fed:F.id,token:fedVoteToken(F.vote),yes:true})");
  const first=cmd(1,'j1_1_vote00001',vote);
  assert.equal(result(h,first).status,'ok');
  const before=J(h,'F.vote.yes');
  assert.equal(before.filter(i=>i===1).length,1);
  const b=regain(h,J(h,'MP.snapshot({}).pkg'));
  unchanged(b,{...first,seq:2},state(h));
  assert.deepEqual(J(b,'G.feds[0].vote.yes'),before);
  report('Federasyon oyu yeni host',{votesByPlayer:1});
}

{
  const h=world();setupYard(h);
  h.run('G.emps[3].res.min=20000;G.emps[3].res.ene=20000;');
  const before=J(h,'[E.res.min,E.res.ene]');
  const offer={kind:'offer',to:1,give:[{t:'res',r:'min',v:100}],want:[{t:'res',r:'ene',v:50}]};
  assert.equal(result(h,cmd(1,'j1_1_offer0001',offer),'C').status,'ok');
  const accept={kind:'respond',offer:h.run('MP.dip.offers.at(-1).id'),action:'accept'};
  const first=cmd(1,'j1_1_accept001',accept);
  assert.equal(result(h,first).status,'ok');
  assert.deepEqual(J(h,'[E.res.min,E.res.ene]'),[before[0]+100,before[1]-50]);
  const b=regain(h,J(h,'MP.snapshot({}).pkg'));
  unchanged(b,{...first,seq:2},state(h));
  assert.equal(b.run('MP.dip.offers.at(-1).status'),'accepted');
  report('Anlaşma kabulü yeni host',{mineralReceived:100,energyPaid:50,additionalTransfer:0});
}

async function guestFlow(){
  const h=world();const ship=setupYard(h);const guest=runtime({width:800,height:360});
  const script=f=>guest.run(fs.readFileSync(f,'utf8'));
  guest.sb.URLSearchParams=URLSearchParams;
  guest.sb.location=guest.sb.window.location;
  guest.sb.location.search='';
  guest.sb.history={pushState(){},replaceState(){}};
  guest.sb.localStorage=guest.sb.window.localStorage;
  guest.sb.addEventListener=guest.sb.window.addEventListener.bind(guest.sb.window);
  guest.sb.innerWidth=800;guest.sb.innerHeight=360;
  guest.sb.fetch=async()=>({text:async()=>fs.readFileSync('ui.js','utf8')});
  let clock=Date.now();
  const tick=[];
  guest.sb.Date=class extends Date{static now(){return clock;}};
  guest.sb.setInterval=(fn,ms)=>{if(ms===1000)tick.push(fn);return tick.length;};
  guest.run("Object.defineProperty(window,'queueShip',{get:()=>queueShip,set:f=>{queueShip=f;}})");
  script('research/mp1/client/view.js');
  guest.sb.window.MP1View=guest.sb.MP1View;
  script('research/mp6/mirror.js');
  script('research/mp6/client/guest-stars.js');
  guest.sb.MP6Stars=guest.sb.window.MP6Stars;
  script('research/mp1/client/join.js');
  const transport=[];
  guest.sb.transport=transport;
  guest.sb.assign=J(h,`(()=>{const p=MP.state.players.get(MP.state.conns.get('B'));return {saveId:MP.state.saveId,playerId:p.playerId,empireId:p.empireId};})()`);
  guest.run(`var Client=window.MP1Join;
    Object.assign(Client,assign,{hostOnline:true,screen:'game',assigned:true,ws:{readyState:1,send:s=>transport.push(s)}});
    Client.game.view={dip:{offers:[],contacts:[],sq:[]}};
    MP6Stars.attach(Client);`);
  let mirrorRev=0;
  async function installMirror(){
    if(mirrorRev){
      guest.sb.ops=J(h,'StarsMirror.diff(previousWorld,StarsMirror.build(1))');
    }else{
      h.run('var previousWorld=StarsMirror.build(1)');
      guest.sb.full=J(h,'previousWorld');
    }
    guest.sb.rev=++mirrorRev;
    if(mirrorRev===1)guest.run("MP6Stars.onMessage({type:'mirror',full,rev})");
    else guest.run("MP6Stars.onMessage({type:'mirrorDelta',base:rev-1,ops,rev})");
    for(let i=0;i<30&&guest.run('MP6Stars.S.appliedRev!==rev');i++){
      const id=guest.run('MP6Stars.S.timer');
      const timer=guest.timers.get(id);
      if(timer){guest.advance(4000);guest.timers.delete(id);timer.fn();}
      await new Promise(setImmediate);
    }
    assert.equal(guest.run('MP6Stars.S.appliedRev'),mirrorRev,'misafir aynayı kurdu');
  }
  await installMirror();
  guest.sb.ship=ship;
  const rows=()=>guest.run(`View.selSys=G.sys[ship.sys];(UI.p_sistem().match(/data-a="shipCancel"/g)||[]).length`);
  const frames=()=>transport.map(JSON.parse).filter(m=>m.type==='cmd'&&m.cmd.kind==='ship');
  const before=state(h),y0=rows();
  assert.equal(y0,0);
  const start=performance.now();
  guest.run("UI.act('ship',ship.sys+':'+ship.key)");
  const first=frames()[0];assert(first,'tersane düğmesinin eylemi gerçek istemciye ulaşır');
  const hostResult=result(h,first);
  const tAck=performance.now()-start;
  assert.equal(hostResult.status,'ok');
  assert.equal(state(h).orders,before.orders+1);
  const tQueue=performance.now()-start;
  // İlk sonuç istemciye verilmez. Normal tersane yolu bir kez gönderir.
  await installMirror();
  assert.equal(rows(),1);
  const tYard=performance.now()-start;
  const pendingBefore=J(guest,'[...MP6Stars.S.pend]');
  clock+=61000;
  for(const fn of tick)fn();
  assert(guest.doc.getElementById('alerts').children.some(el=>el.textContent.includes('sonucu doğrulanamadı')),
    JSON.stringify({tickCount:tick.length,pendingBefore,pendingAfter:J(guest,'[...MP6Stars.S.pend]'),clock}));
  assert.equal(frames().length,1);
  const after=state(h);
  const cost=J(h,'shipCost(E,"kor")');
  for(const [r,amount] of Object.entries(cost))assert.equal(before.resources[r]-after.resources[r],amount);
  assert.equal(guest.run('Client.cmd(ship,"bilinmeyen-kimlik").why'),'command-unconfirmed');
  assert.equal(frames().length,1);
  assert.equal(guest.run('Client.cmd(ship,Client.pending.cid).ok'),true);
  assert.deepEqual(frames(),[first,first]);
  const retryAck=result(h,frames()[1]);
  assert.equal(retryAck.dup,1);
  guest.sb.retryAck=retryAck;
  guest.run("Client.results.push(retryAck);MP6Stars.update('')");
  assert.deepEqual(state(h),after);
  assert.equal(rows(),1);
  report('J3/J4 yerel VM',{hostResultMs:+tAck.toFixed(2),hostQueueMs:+tQueue.toFixed(2),guestYardHtmlMs:+tYard.toFixed(2),orders:1,guestRows:1,cost,automaticRetries:0,explicitRetrySameCidAndSeq:true});
}

guestFlow().then(()=>console.log('GEÇEN: '+passes+' KALAN: 0')).catch(e=>{console.error(e.stack);process.exitCode=1;});
