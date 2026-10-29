'use strict';
/* MP.1: lobby state machine, presence, seats and actor separation on the real
   STARS engine (Node vm). research/mp0/mp-core.js is an isolated prototype, not
   a runtime file; single-player Save8/RNG behaviour must be unchanged. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();if(globalThis.MP&&MP.__obs)MP.observeHumans();if(globalThis.MP&&MP.__pub)MP.publish();}}}';
function lobbyWorld(){
  const h=runtime({root});h.sb.__rand=n=>crypto.randomBytes(n).toString('hex');h.sb.__out=[];h.sb.__kick=[];h.sb.__lob=[];
  h.run(CORE);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'r1',random:__rand,send:(c,t)=>__out.push([c,t]),kick:(c,w)=>__kick.push([c,w]),onLobby:L=>__lob.push(L),
      lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});MP.installGuards();`);
  return h;
}
const json=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function msgs(h,conn,from=0){return h.sb.__out.slice(from).filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));}
function send(h,conn,obj){const n=h.sb.__out.length;h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify(obj))})`);return msgs(h,conn,n);}
const hello=(h,conn,name,token)=>send(h,conn,{v:1,type:'hello',name,...(token?{token}:{})});
const lastLobby=(h,conn)=>msgs(h,conn).filter(m=>m.type==='lobby').at(-1);
const SETTINGS={size:'orta',aiCount:5,seed:11};

/* isHumanActor ve actorVision'ın 5 seed × 120 aylık eşdeğerlik kanıtı: tests/mp1_actor_vision_test.js + mp1_actor_vision_b_test.js (ortak simülasyon; run-all süre sınırı). */
test('lobby host with no remote human is a no-op: same Save8 as the plain engine after 120 days (observeHumans + publish each month)',()=>{
  const a=runtime({root});a.run(`setupGame({...CFG,...${JSON.stringify(SETTINGS)}});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;${STEP};step(120)`);
  const b=lobbyWorld();b.run(`MP.configure(${JSON.stringify(SETTINGS)});MP.__obs=true;MP.__pub=true;step(120)`);
  assert.equal(b.run('serialize()'),a.run('serialize()'));
});
test('state machine: created → waiting → ready → starting → ingame; start is applied once; commands only in game',()=>{
  const h=lobbyWorld();
  assert.equal(json(h,'MP.lobbyView()').phase,'created');
  assert.equal(json(h,'MP.start()').why,'no-galaxy');
  assert.equal(json(h,`MP.configure(${JSON.stringify(SETTINGS)})`).ok,true);assert.equal(json(h,'MP.lobbyView()').phase,'waiting');
  const a=hello(h,'c1','Ayşe').find(m=>m.type==='assign');
  assert.equal(json(h,'MP.start()').why,'guest-no-empire');
  assert.equal(send(h,'c1',{v:1,type:'ready',value:true}).find(m=>m.type==='lresult').code,'no-claim');
  assert.equal(send(h,'c1',{v:1,type:'claim',empire:3}).find(m=>m.type==='lresult').ok,true);
  assert.equal(json(h,'MP.start()').why,'guest-not-ready');
  assert.equal(send(h,'c1',{v:1,type:'cmd',seq:1,cid:'s0000001',cmd:{kind:'focus',sys:0,planet:0,key:'sanayi'}}).find(m=>m.type==='result').code,'not-started');
  send(h,'c1',{v:1,type:'ready',value:true});assert.equal(lastLobby(h,'c1').phase,'ready');
  const save=h.run('serialize()');
  assert.equal(json(h,'MP.start()').ok,true);
  const twice=json(h,'MP.start()');assert.equal(twice.why,'already-started');
  assert.equal(h.run('MP.state.journal.filter(j=>j.assign).length'),1);
  assert.equal(lastLobby(h,'c1').phase,'ingame');assert.equal(h.run('G.emps[3].ai'),false);
  assert(msgs(h,'c1').some(m=>m.type==='snapshot'&&m.you.empireId===3));
  const c=json(h,'(()=>{const x=G.emps[3].colonies[0];return {s:x.s,p:x.p}})()');
  assert.equal(send(h,'c1',{v:1,type:'cmd',seq:2,cid:'s0000002',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}}).find(m=>m.type==='result').status,'ok');
  assert(a.playerId&&save.length>0);
});
test('ready is idempotent, belongs to the sender only, and resets when the empire or the galaxy changes',()=>{
  const h=lobbyWorld();h.run(`MP.configure(${JSON.stringify(SETTINGS)});MP.setCapacity(3)`);
  hello(h,'c1','A');hello(h,'c2','B');
  send(h,'c1',{v:1,type:'claim',empire:2});send(h,'c1',{v:1,type:'ready',value:true});
  const rev=h.run('MP.lobby.rev');send(h,'c1',{v:1,type:'ready',value:true});
  assert.equal(h.run('MP.lobby.rev'),rev,'second identical ready changes nothing');
  const pl=n=>lastLobby(h,'c2').players.find(p=>p.name===n);
  assert.equal(pl('A').ready,true);assert.equal(pl('B').ready,false);
  // B cannot claim A's empire and nothing in the packet can address A's seat
  assert.equal(send(h,'c2',{v:1,type:'claim',empire:2}).find(m=>m.type==='lresult').code,'taken');
  assert.equal(send(h,'c2',{v:1,type:'ready',value:true,seat:1}).find(m=>m.type==='error').code,'bad-ready');
  assert.equal(pl('A').ready,true);
  send(h,'c1',{v:1,type:'claim',empire:4});assert.equal(pl('A').ready,false,'empire change resets ready');
  send(h,'c1',{v:1,type:'ready',value:true});
  h.run(`MP.configure({size:'orta',aiCount:5,seed:23})`);
  assert.equal(pl('A').ready,false);assert.equal(pl('A').claim,null,'galaxy change resets claims');
  for(const bad of [0,6,99,-1,'3',1.5])assert.notEqual(send(h,'c1',{v:1,type:'claim',empire:bad}).find(m=>m.type==='lresult').ok,true,String(bad));
  assert.equal(send(h,'c1',{v:1,type:'claim',empire:0}).find(m=>m.type==='lresult').code,'host-empire');
});
test('host-only operations cannot be reached from the network; capacity, game-started, kick and close are enforced',()=>{
  const h=lobbyWorld();h.run(`MP.configure(${JSON.stringify(SETTINGS)})`);
  for(const type of ['configure','start','kick','close','setCapacity','claimFor','assign'])assert.equal(send(h,'c9',{v:1,type})[0].code,'bad-message',type);
  const a=hello(h,'c1','A').find(m=>m.type==='assign');
  assert.equal(hello(h,'c2','B')[0].code,'room-full');assert.equal(JSON.stringify(h.sb.__kick.at(-1)),'["c2","room-full"]');
  assert.equal(json(h,'MP.setCapacity(1)').why,'bad-capacity');assert.equal(json(h,'MP.setCapacity(4)').ok,true);
  const b=hello(h,'c2','B').find(m=>m.type==='assign');
  assert.equal(json(h,`MP.kick(${JSON.stringify(b.playerId)})`).ok,true);
  assert.equal(hello(h,'c3','B',b.token)[0].code,'kicked','a kicked token cannot return');
  send(h,'c1',{v:1,type:'claim',empire:3});send(h,'c1',{v:1,type:'ready',value:true});h.run('MP.start()');
  assert.equal(hello(h,'c4','Late')[0].code,'game-started');
  const again=hello(h,'c5','A',a.token).find(m=>m.type==='assign');assert.equal(again.empireId,3,'reconnect keeps the seat in game');
  h.run('MP.close()');assert.equal(hello(h,'c6','A',a.token)[0].code,'room-closed');
});
test('presence: tab changes are broadcast, invalid tabs refused, rate limited, and never touch Save8 or RNG',()=>{
  const h=lobbyWorld();h.run(`MP.configure(${JSON.stringify(SETTINGS)});MP.setCapacity(3)`);hello(h,'c1','A');hello(h,'c2','B');
  const save=h.run('serialize()'),rng=h.run('RND_STATE');
  for(const t of ['doktrin','gorunus','fizyoloji','etik','civic','koken','galaksi','lobi'])send(h,'c1',{v:1,type:'presence',tab:t});
  send(h,'c1',{v:1,type:'presence',tab:'doktrin'});
  assert.equal(lastLobby(h,'c2').players.find(p=>p.name==='A').tab,'doktrin');
  assert.equal(send(h,'c1',{v:1,type:'presence',tab:'<img src=x>'}).find(m=>m.type==='lresult').code,'bad-tab');
  h.run('MP.setHostTab("galaksi")');assert.equal(lastLobby(h,'c1').players.find(p=>p.host).tab,'galaksi');
  let limited=false;for(let i=0;i<40;i++){const r=send(h,'c2',{v:1,type:'presence',tab:i%2?'etik':'civic'}).find(m=>m.type==='lresult');if(r&&r.code==='rate-limited')limited=true;}
  assert(limited);assert.equal(h.run('serialize()'),save);assert.equal(h.run('RND_STATE'),rng);
});
test('lobby packets carry only public pregame data: no tokens, no player ids, no positions or economies; prep card only for the own claim',()=>{
  const h=lobbyWorld();h.run(`MP.configure(${JSON.stringify(SETTINGS)});MP.setCapacity(3)`);
  const a=hello(h,'c1','A<script>').find(m=>m.type==='assign'),b=hello(h,'c2','B').find(m=>m.type==='assign');
  send(h,'c1',{v:1,type:'claim',empire:3});
  const pk=h.sb.__out.filter(([c])=>c==='c2').map(([,t])=>t).filter(t=>JSON.parse(t).type==='lobby');
  for(const t of pk){assert(!t.includes(a.token)&&!t.includes(a.playerId),'player A secrets');assert(!/"(home|res|inc|techs|colonies|x|y|sys|aiStrategy|token|playerId)":/.test(t),t.slice(0,200));}
  const L=JSON.parse(pk.at(-1));assert.equal(L.mine,null,'B has no claim, no prep card');
  assert.equal(L.players.find(p=>p.seat===1).name,'Ascript','names are sanitized');
  const La=lastLobby(h,'c1');assert.equal(La.mine.empire,3);assert(La.mine.doktrin&&La.mine.fizyoloji);
  assert(La.empires.every(e=>Object.keys(e).sort().join()==='col,doc,id,n,race,seat'));
  assert(b.token!==a.token);
  for(const t of pk)assert.equal(JSON.parse(t).settings.seed,undefined,'the seed would rebuild the whole galaxy offline');
  assert.equal(json(h,'MP.lobbyView().settings.seed'),11,'host keeps its own seed');
  send(h,'c2',{v:1,type:'claim',empire:4});send(h,'c1',{v:1,type:'ready',value:true});send(h,'c2',{v:1,type:'ready',value:true});
  assert.equal(h.run('MP.start().ok'),true);
  const Lg=lastLobby(h,'c2');assert.deepEqual(Lg.empires.map(e=>e.id).sort(),[3,4],'after the start only human empires stay in the lobby list');
  const ai=json(h,'G.emps.filter(e=>e.ai&&!e.wild).map(e=>e.name)');
  for(const t of h.sb.__out.slice(-6).filter(([c])=>c==='c2').map(([,t])=>t).filter(t=>JSON.parse(t).type==='lobby'))for(const n of ai)assert(!t.includes(JSON.stringify(n)),n);
});
test('remote human gets its own exploration memory; AI never plays or negotiates for it; others are unaffected',()=>{
  const h=lobbyWorld();h.run(`MP.configure(${JSON.stringify(SETTINGS)})`);hello(h,'c1','A');
  send(h,'c1',{v:1,type:'claim',empire:3});send(h,'c1',{v:1,type:'ready',value:true});h.run('MP.start();MP.__obs=true;MP.__pub=true');
  const seen0=json(h,'G.sys.filter(s=>s.seen.includes(3)).map(s=>s.id)');
  h.run('var turns=[];const at=aiTurn;aiTurn=function(e){turns.push(e.id);return at.apply(this,arguments)};');
  // move a science fleet of empire 3 three jumps out and back: systems seen on the way are remembered
  h.run(`(()=>{const f=G.fleets.find(f=>f.e===3&&f.ships.some(s=>s.c==='bil'));if(!f)throw Error('no science fleet');
    const far=G.sys.filter(s=>!s.seen.includes(3)).sort((a,b)=>Math.hypot(a.x-G.sys[f.sys].x,a.y-G.sys[f.sys].y)-Math.hypot(b.x-G.sys[f.sys].x,b.y-G.sys[f.sys].y))[0];orderMove(f,far.id);})()`);
  h.run('step(360)');
  const seen1=json(h,'G.sys.filter(s=>s.seen.includes(3)).map(s=>s.id)');
  assert(seen1.length>seen0.length,JSON.stringify([seen0,seen1]));
  const now=json(h,'[...StarsMP.actorVision(G.emps[3])]');const remembered=seen1.filter(id=>!now.includes(id));
  const v=json(h,'MP.viewFor(G.emps[3])');
  for(const id of seen1)assert.equal(v.sys[id].k,1,'remembered system stays known');
  for(const id of remembered)assert.equal(v.sys[id].vis,undefined,'remembered but not visible: no live owner');
  assert(!json(h,'turns').includes(3));
  assert.equal(json(h,'aiNegotiate(G.emps[2],G.emps[3],[],[{t:"nap"}],true)').uygulandi,false);
  assert.notEqual(json(h,'aiRespond(G.emps[4],{from:2,to:4,give:[],want:[{t:"nap"}]})').v,'bekle');
  assert.equal(json(h,'G.sys.filter(s=>s.seen.includes(0)).length')>0,true);
});
end();
