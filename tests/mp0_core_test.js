'use strict';
/* MP.0: host-authoritative core on the real STARS engine (Node vm, seed 11).
   The isolated prototype (research/mp0/mp-core.js) is not a runtime file; these
   tests prove it only reads the canonical world, applies commands through the
   real game rules atomically, never consumes gameplay RNG, filters each
   player's view and leaves single-player Save8 behaviour untouched. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const P2=3;   // seed11 empire 3: AI, no Panoptikon, 2 of 45 systems known at start
function world({mp=true,seed=11,size}={}){
  const h=runtime({root});h.sb.__rand=n=>crypto.randomBytes(n).toString('hex');h.sb.__out=[];h.sb.__kick=[];
  h.run(CORE);
  h.run(`setupGame({...CFG,seed:${seed}${size?",size:'"+size+"'":''}});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;
    function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();if(globalThis.MP&&MP.__pub)MP.publish();}}}
    function save(){return serialize();}`);
  if(mp)h.run(`var MP=StarsMP.createHost({roomId:'t',random:__rand,send:(c,t)=>__out.push([c,t]),kick:(c,w)=>__kick.push([c,w])});MP.installGuards();`);
  return h;
}
const json=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function join(h,conn='c1',name='Ayşe'){h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'hello',name}))})`);return JSON.parse(h.sb.__out.filter(([c])=>c===conn).map(([,t])=>t).find(t=>JSON.parse(t).type==='assign'));}
function send(h,conn,obj){const n=h.sb.__out.length;h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(typeof obj==='string'?obj:JSON.stringify(obj))})`);return h.sb.__out.slice(n).filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));}
const res=(h,conn,obj)=>send(h,conn,obj).find(m=>m.type==='result'||m.type==='error');
function home(h,id){return json(h,`(()=>{const e=G.emps[${id}],c=e.colonies[0];return {s:c.s,p:c.p}})()`);}

test('views and publishing are read-only: Save8 bytes and RNG unchanged',()=>{
  const h=world();const a=join(h);h.run(`MP.assign(${JSON.stringify(a.playerId)},${P2})`);h.run('step(40)');
  const before=h.run('save()'),rng=h.run('RND_STATE');
  h.run('for(let i=0;i<5;i++){MP.publish();MP.viewFor(G.emps[0]);MP.viewFor(G.emps[3]);}');
  assert.equal(h.run('save()'),before);assert.equal(h.run('RND_STATE'),rng);
});
test('MP host with no human player is a no-op: same Save8 as the plain engine after 120 days',()=>{
  const a=world({mp:false});a.run('step(120)');
  const b=world();b.run('MP.__pub=true;step(120)');
  assert.equal(b.run('save()'),a.run('save()'));
});
test('network command path equals direct engine call: identical Save8 after 120 days (with rejected, duplicate and stale traffic)',()=>{
  const runA=world(),pa=join(runA);runA.run(`MP.assign(${JSON.stringify(pa.playerId)},${P2})`);
  const c=home(runA,P2);
  runA.run(`step(45);{const e=G.emps[3],s=G.sys[${c.s}],pl=s.planets.find(p=>p.i===${c.p});if(!queueBuilding(e,s,pl,'santral'))throw Error('direct')};step(75)`);
  const runB=world(),pb=join(runB);runB.run(`MP.assign(${JSON.stringify(pb.playerId)},${P2});MP.__pub=true`);
  runB.run('step(45)');const h0=home(runB,0);
  const bad=[{v:1,type:'cmd',seq:1,cid:'x0000001',cmd:{kind:'build',sys:h0.s,planet:h0.p,key:'santral'}},
    {v:1,type:'cmd',seq:2,cid:'x0000002',empire:0,cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}},
    {v:1,type:'cmd',seq:3,cid:'x0000003',cmd:{kind:'declareWar',target:0}}];
  for(const m of bad)assert.equal(res(runB,'c1',m).status,'rejected');
  const ok={v:1,type:'cmd',seq:4,cid:'x0000004',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}};
  assert.equal(res(runB,'c1',ok).status,'ok');
  assert.equal(res(runB,'c1',ok).dup,1);                                           // tekrar
  assert.equal(res(runB,'c1',{...ok,cid:'x0000005',seq:3}).code,'stale-seq');      // eski sıra
  runB.run('step(75)');
  assert.equal(runB.run('save()'),runA.run('save()'));
});
test('router: unknown types, versions, malformed JSON, extra keys and prototype keys are refused without state change',()=>{
  const h=world(),a=join(h);h.run(`MP.assign(${JSON.stringify(a.playerId)},${P2})`);const c=home(h,P2),before=h.run('save()');
  const codes=[send(h,'c1','{bad json')[0].code,send(h,'c1',{v:2,type:'hello',name:'x'})[0].code,send(h,'c1',{v:1,type:'eval',code:'G.p=null'})[0].code,
    send(h,'c1',{v:1,type:'constructor'})[0].code,send(h,'c1',{v:1,type:'__proto__'})[0].code,send(h,'c1',{v:1,type:'cmd',seq:1,cid:'y0000001',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'},extra:1})[0].code,
    send(h,'c1','x'.repeat(5000))[0].code];
  assert.deepEqual(codes,['bad-json','bad-message','bad-message','bad-message','bad-message','bad-cmd','too-big']);
  const kinds=['__proto__','constructor','toString','queueBuilding','eval'].map((k,i)=>res(h,'c1',{v:1,type:'cmd',seq:10+i,cid:'k000000'+i,cmd:{kind:k}}).code);
  assert.deepEqual(kinds,Array(5).fill('unknown-kind'));
  const keys=['__proto__','constructor','hasOwnProperty','../x',"santral'"].map((k,i)=>res(h,'c1',{v:1,type:'cmd',seq:20+i,cid:'b000000'+i,cmd:{kind:'build',sys:c.s,planet:c.p,key:k}}).code);
  assert.deepEqual(keys,Array(5).fill('bad-params'));
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:30,cid:'p0000001',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral',owner:0}}).code,'bad-params');
  assert.equal(h.run('save()'),before);assert.equal(h.run('Object.prototype.polluted'),undefined);
});
test('authorization: identity comes from the bound connection, not from the packet',()=>{
  const h=world(),c=home(h,P2),h0=home(h,0);
  assert.equal(res(h,'cX',{v:1,type:'cmd',seq:1,cid:'n0000001',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}}).code,'not-joined');
  const a=join(h);
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:1,cid:'n0000002',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}}).code,'no-empire');
  h.run(`MP.assign(${JSON.stringify(a.playerId)},${P2})`);
  const before=h.run('save()');
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:2,cid:'n0000003',cmd:{kind:'build',sys:h0.s,planet:h0.p,key:'santral'}}).code,'not-owner');
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:3,cid:'n0000004',empire:0,cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}}).code,'forged-empire');
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:4,cid:'n0000005',cmd:{kind:'build',sys:9999,planet:0,key:'santral'}}).code,'bad-target');
  assert.equal(h.run('save()'),before);
  // a second connection cannot take over the player's slot without its token
  const b=join(h,'c2','Mallory');assert.notEqual(b.playerId,a.playerId);assert.equal(b.empireId,null);
  assert.equal(h.run(`MP.assign(${JSON.stringify(b.playerId)},${P2}).why`),'taken');
  assert.equal(h.run(`MP.assign(${JSON.stringify(b.playerId)},0).why`),'host-empire');
  assert.equal(res(h,'c2',{v:1,type:'cmd',seq:1,cid:'n0000006',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}}).code,'no-empire');
  // reconnect with the real token rebinds the same player and kicks the stale connection
  const again=send(h,'c3',{v:1,type:'hello',name:'Ayşe',token:a.token}).find(m=>m.type==='assign');
  assert.equal(again.playerId,a.playerId);assert.equal(again.empireId,P2);assert.equal(JSON.stringify(h.sb.__kick.at(-1)),'["c1","replaced"]');
});
test('duplicate and stale commands: a command id applies exactly once; resources and queue change once',()=>{
  const h=world(),a=join(h);h.run(`MP.assign(${JSON.stringify(a.playerId)},${P2})`);const c=home(h,P2);
  const m={v:1,type:'cmd',seq:1,cid:'d0000001',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}};
  const r0=json(h,`[G.emps[3].res.min,(G.sys[${c.s}].planets.find(p=>p.i===${c.p}).col.q||[]).length]`);
  const r1=res(h,'c1',m),r2=res(h,'c1',m),r3=res(h,'c1',{...m,seq:7});
  assert.equal(r1.status,'ok');assert.equal(r2.dup,1);assert.equal(r3.dup,1);
  const r=json(h,`[G.emps[3].res.min,(G.sys[${c.s}].planets.find(p=>p.i===${c.p}).col.q||[]).length]`);
  assert.deepEqual(r,[r0[0]-json(h,'buildingCost(G.emps[3],"santral").min'),r0[1]+1]);
  assert.equal(res(h,'c1',{...m,cid:'d0000002'}).code,'stale-seq');
  assert.equal(json(h,'MP.stats').applied,1);
});
test('atomic commands: a rule failure or an exception inside the engine leaves no partial change',()=>{
  const h=world(),a=join(h);h.run(`MP.assign(${JSON.stringify(a.playerId)},${P2})`);const c=home(h,P2);
  const tech=json(h,'Object.keys(BUILDINGS).find(k=>BUILDINGS[k].tech&&!G.emps[3].techs[BUILDINGS[k].tech])');
  const before=h.run('save()');
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:1,cid:'a0000001',cmd:{kind:'build',sys:c.s,planet:c.p,key:tech}}).code,'rules:tech');
  h.run('G.emps[3].res.min=10');const poor=h.run('save()');
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:2,cid:'a0000002',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}}).code,'rules:resources');
  assert.equal(h.run('save()'),poor);h.run('G.emps[3].res.min=400');assert.equal(h.run('save()'),before);
  // the engine call mutates, then fails: txRestoreGraph rolls it back
  h.run('var qb=queueBuilding;queueBuilding=function(e,s,p,k){e.res.min-=50;(p.col.q||(p.col.q=[])).push({key:k});throw Error("mid-apply")}');
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:3,cid:'a0000003',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}}).code,'error');
  assert.equal(h.run('save()'),before);
  h.run('queueBuilding=function(e,s,p,k){e.res.min-=50;return false}');
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:4,cid:'a0000004',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}}).code,'rules');
  assert.equal(h.run('save()'),before);h.run('queueBuilding=qb');
  // focus and cancel use the real setFocus / cancelBuild rules (cooldown, refund)
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:5,cid:'a0000005',cmd:{kind:'focus',sys:c.s,planet:c.p,key:'sanayi'}}).status,'ok');
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:6,cid:'a0000006',cmd:{kind:'focus',sys:c.s,planet:c.p,key:'arastir'}}).code,'rules:cooldown');
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:7,cid:'a0000007',cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}}).status,'ok');
  assert.equal(res(h,'c1',{v:1,type:'cmd',seq:8,cid:'a0000008',cmd:{kind:'cancel',sys:c.s,planet:c.p,index:0}}).status,'ok');
  assert.equal(h.run('G.emps[3].res.min'),400);
});
test('AI never decides for a remote human: negotiation and responses are blocked, AI-AI unchanged',()=>{
  const h=world(),a=join(h);h.run(`MP.assign(${JSON.stringify(a.playerId)},${P2})`);
  const before=h.run('save()');
  const r=json(h,`aiNegotiate(G.emps[2],G.emps[3],[],[{t:'nap'}],true)`),s=json(h,`aiRespond(G.emps[3],{from:2,to:3,give:[],want:[]})`);
  assert.equal(r.uygulandi,false);assert.equal(s.v,'bekle');assert.equal(h.run('save()'),before);assert.equal(json(h,'MP.stats').blockedAI,2);
  assert.notEqual(json(h,`aiRespond(G.emps[4],{from:2,to:4,give:[],want:[{t:'nap'}]})`).v,'bekle');
  // the human empire leaves the AI loops and inherits no AI automation
  assert.equal(h.run('G.emps[3].ai'),false);assert(h.run('G.emps[3].colonies.every(c=>G.sys[c.s].planets[c.p].col.auto===false)'));
  h.run('var turns=[];const at=aiTurn;aiTurn=function(e){turns.push(e.id);return at.apply(this,arguments)};step(90)');
  assert(!json(h,'turns').includes(3));assert(json(h,'turns').includes(2));
});
test('ownership: one empire per player, one player per empire; release returns the empire to the AI with its automation',()=>{
  const h=world(),a=join(h),b=join(h,'c2','Bora');h.run('step(40)');
  const auto=h.run('JSON.stringify(G.emps[3].colonies.map(c=>G.sys[c.s].planets[c.p].col.auto))');
  assert.equal(h.run(`MP.assign(${JSON.stringify(a.playerId)},${P2}).ok`),true);
  assert.equal(h.run(`MP.assign(${JSON.stringify(a.playerId)},4).why`),'player-has-empire');
  assert.equal(h.run(`MP.assign(${JSON.stringify(b.playerId)},${P2}).why`),'taken');
  assert.equal(h.run(`(()=>{const w=G.emps.find(e=>e.wild);return w?MP.assign(${JSON.stringify(b.playerId)},w.id).why:'empire'})()`),'empire');
  assert.equal(h.run(`MP.assign(${JSON.stringify(b.playerId)},4).ok`),true);
  h.run(`MP.release(${P2},true)`);
  assert.equal(h.run('G.emps[3].ai'),true);assert.equal(h.run('JSON.stringify(G.emps[3].colonies.map(c=>G.sys[c.s].planets[c.p].col.auto))'),auto);assert(auto.includes('true'));
});
test('filtering: the client view carries only what the empire knows; unknown names, foreign economies and hidden fleets are absent',()=>{
  const h=world(),a=join(h);h.run(`MP.assign(${JSON.stringify(a.playerId)},${P2})`);h.run('MP.__pub=true;step(60)');
  const truth=json(h,`(()=>{const e=G.emps[3],x=explorationContext(e);return {known:[...x.known],visible:[...x.visible],
    unknownNames:G.sys.filter(s=>!x.known.has(s.id)).map(s=>s.name),hiddenFleets:G.fleets.filter(f=>f.e!==3&&f.ships.length&&!(f.sys>=0?x.visible.has(f.sys):f.mv&&(x.visible.has(f.mv.from)||x.visible.has(f.mv.to)))).map(f=>f.id),
    others:G.emps.filter(o=>o.id!==3).map(o=>({id:o.id,res:o.res,contact:!!e.contact[o.id]}))}})()`);
  const packets=h.sb.__out.filter(([c])=>c==='c1').map(([,t])=>t);
  assert(truth.known.length<45&&truth.unknownNames.length>30,JSON.stringify(truth.known));
  for(const t of packets){
    for(const n of truth.unknownNames)assert(!t.includes(JSON.stringify(n)),'unknown system name leaked: '+n);
    assert(!/"aiStrategy"|"aiIntel"|"aiCampaign"|"spy"|"token":"[a-f0-9]{32}".*"token"/.test(t));
  }
  const v=json(h,'MP.viewFor(G.emps[3])');
  for(const s of Object.values(v.sys))if(!truth.known.includes(s.i))assert.deepEqual(Object.keys(s).sort(),['i','x','y']);
  for(const f of Object.values(v.fleets))if(!f.own)assert(!truth.hiddenFleets.includes(f.id)&&Object.keys(f).every(k=>['id','e','s','n'].includes(k)));
  for(const e of Object.values(v.emps))assert(Object.keys(e).every(k=>['id','n','col','war','rel'].includes(k))&&truth.others.find(o=>o.id===e.id).contact);
  assert(!JSON.stringify(v).includes('"fl":')&&JSON.stringify(v).length<JSON.parse(JSON.stringify(h.run('save()').length))/5);
});
test('session metadata is separate from Save8, bound to it, and restores the same player-empire slots',()=>{
  const h=world(),a=join(h);h.run(`MP.assign(${JSON.stringify(a.playerId)},${P2})`);h.run('step(30)');
  const saveText=h.run('save()'),meta=json(h,`MP.meta(${JSON.stringify(saveText)})`);
  assert.equal(JSON.parse(saveText).v,8);assert(!saveText.includes(a.token)&&!saveText.includes('mpMeta'));
  assert.equal(meta.mpMeta,1);assert.equal(meta.saveVersion,8);assert(meta.players.some(p=>p.playerId===a.playerId&&p.empireId===P2));
  const g=world();assert.equal(g.run(`deserialize(${JSON.stringify(saveText)})`),true);
  assert.equal(json(g,`MP.restore(${JSON.stringify(meta)},${JSON.stringify(saveText+' ')})`).why,'save-mismatch');
  g.run('G.emps[3].ai=true');assert.equal(json(g,`MP.restore(${JSON.stringify(meta)},serialize())`).why,'save-mismatch');
  // a save whose human slot was handed back to the AI cannot be resumed as human
  assert.equal(json(g,`(()=>{const t=serialize(),m=${JSON.stringify(meta)};m.saveHash=StarsMP.fnv(t);return MP.restore(m,t)})()`).why,'slot-state');
  assert.equal(g.run(`deserialize(${JSON.stringify(saveText)})`),true);
  assert.equal(json(g,`MP.restore(${JSON.stringify(meta)},${JSON.stringify(saveText)})`).ok,true);
  const back=send(g,'c9',{v:1,type:'hello',name:'Ayşe',token:a.token});
  assert.equal(back.find(m=>m.type==='assign').empireId,P2);assert.equal(back.find(m=>m.type==='snapshot').you.empireId,P2);
  // single-player Save8 path: the MP save reloads through the unchanged deserialize/serialize fixed point
  assert(g.run('var a=serialize(),ok=deserialize(a),b=serialize();ok&&a===b'));
});
end();
