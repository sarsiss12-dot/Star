'use strict';
/* MP.2: misafirin gerçek filo hareketi ve araştırma hedefi — host'un gerçek STARS motorunda (Node vm).
   - "move" = orderMove, "research" = researchTarget, "researchMode" = setResearchMode;
   - ağ komutu ile aynı motor çağrısının doğrudan yapılması aynı Save8'i verir;
   - reddedilen her komut Save8'i ve RNG'yi değiştirmez;
   - misafir görünümü: kendi filo rotası/gücü, kendi bilim durumu; temas yoksa yabancı kimlik maskeli;
   - uzak insanın araştırma bildirimi host günlüğüne değil kendi listesine düşer. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();MP.observeHumans();}}}';
const GUEST=3;
/* Gerçek lobi akışı: seed 11, orta, 5 AI; misafir devlet 3'ü alır ve oyun başlar. Belirlenimci (rastgelelik yalnız jetonlarda). */
function world(){
  const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);h.sb.__out=[];
  h.run(CORE);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'r2',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.configure({size:'orta',aiCount:5,seed:11});
    MP.onMessage('c1',JSON.stringify({v:1,type:'hello',name:'Ayşe'}));MP.onMessage('c1',JSON.stringify({v:1,type:'claim',empire:${GUEST}}));
    MP.onMessage('c1',JSON.stringify({v:1,type:'ready',value:true}));if(!MP.start().ok)throw Error('start');var seq=0;`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function cmd(h,c,extra={}){const n=h.sb.__out.length,s=h.run('++seq');
  h.run(`MP.onMessage('c1',${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid:'mp2c'+String(s).padStart(6,'0'),cmd:c,...extra}))})`);
  return h.sb.__out.slice(n).map(([,t])=>JSON.parse(t)).find(m=>m.type==='result');}
const state=h=>({save:h.run('serialize()'),rng:h.run('RND_STATE')});
function view(h){const v={};let base=null;for(const [c,t] of h.sb.__out){if(c!=='c1')continue;const m=JSON.parse(t);
  if(m.type==='snapshot'){Object.assign(v,JSON.parse(JSON.stringify(m.view)));base=m.rev;}
  else if(m.type==='delta'&&base!==null&&m.base===base){const o=m.ops||{};for(const [s,u] of Object.entries(o.up||{}))Object.assign(v[s],u);
    for(const [s,r] of Object.entries(o.rm||{}))for(const k of r)delete v[s][k];for(const [s,x] of Object.entries(o.set||{}))v[s]=x;base=m.rev;}}
  return v;}
const warFleet=h=>J(h,`G.fleets.find(f=>f.e===${GUEST}&&f.ships.some(s=>SHIPS[s.c].dmg>0)).id`);
const sciFleet=h=>J(h,`G.fleets.find(f=>f.e===${GUEST}&&f.ships.every(s=>!(SHIPS[s.c].dmg>0))&&fleetHasRole(f,'bilim')).id`);
const freeTarget=(h,f)=>J(h,`(()=>{const f=G.fleets.find(x=>x.id===${f}),e=G.emps[${GUEST}];for(const s of G.sys){if(s.id===f.sys)continue;const p=findPath(f.sys,s.id,e);if(p&&p.length>=2&&p.length<=4&&pathAllowed(e,f,p,f.sys))return s.id;}})()`);

test('guest fleet move runs the real orderMove: same Save8 as calling the engine directly, and the fleet arrives in game time',()=>{
  const a=world(),b=world();const f=warFleet(a),to=freeTarget(a,f);assert(Number.isInteger(to));
  const r=cmd(a,{kind:'move',fleet:f,to});assert.equal(r.status,'ok',JSON.stringify(r));
  b.run(`(()=>{const f=G.fleets.find(x=>x.id===${f});if(!orderMove(f,${to},false))throw Error('engine');f.ord=null;})()`);
  assert.equal(a.run('serialize()'),b.run('serialize()'),'network command == direct engine call');
  const p=J(a,`G.fleets.find(x=>x.id===${f}).path`);assert.equal(p.at(-1),to);
  const v=view(a);assert.deepEqual(v.fleets[f].pa,p);assert.equal(v.fleets[f].to,to);assert.match(v.fleets[f].st,/YOLDA/);
  let days=0;while(J(a,`G.fleets.find(x=>x.id===${f}).sys`)!==to&&days<120){a.run('step(5);MP.publish()');b.run('step(5)');days+=5;}
  assert.equal(J(a,`G.fleets.find(x=>x.id===${f}).sys`),to,'arrived');assert.equal(a.run('serialize()'),b.run('serialize()'),'and the worlds stay identical while moving');
  assert.equal(view(a).fleets[f].s,to,'guest view follows the canonical position');
  assert.equal(J(a,'MP.state.journal.filter(j=>j.cmd&&j.cmd.kind==="move").length'),1);
});
test('move rules from the engine: closed borders (passage) for warships but not for science ships; unreachable, same system, foreign and missing fleets refused without any side effect',()=>{
  const h=world(),f=warFleet(h),sf=sciFleet(h),home4=J(h,'G.emps[4].home');
  assert.equal(J(h,`canEnter(G.emps[${GUEST}],G.sys[${home4}])`),false);
  let s0=state(h);
  for(const [c,code] of [[{kind:'move',fleet:f,to:home4},'rules:passage'],[{kind:'move',fleet:f,to:J(h,`G.fleets.find(x=>x.id===${f}).sys`)},'rules:same'],
    [{kind:'move',fleet:J(h,'G.fleets.find(f=>f.e===4).id'),to:home4},'not-owner'],[{kind:'move',fleet:999999,to:home4},'not-owner'],
    [{kind:'move',fleet:f,to:-1},'bad-params'],[{kind:'move',fleet:f,to:9999},'bad-params'],[{kind:'move',fleet:'1',to:home4},'bad-params'],
    [{kind:'move',fleet:f,to:home4,path:[1,2]},'bad-params']]){
    const r=cmd(h,c);assert.equal(r.code,code,JSON.stringify(c));assert.deepEqual(state(h),s0,'no side effect: '+code);}
  assert.equal(cmd(h,{kind:'move',fleet:f,to:home4},{empire:4}).code,'forged-empire');assert.deepEqual(state(h),s0);
  // gerçek kural: sivil bilim gemisi aynı kapalı sınırdan geçer
  assert.equal(cmd(h,{kind:'move',fleet:sf,to:home4}).status,'ok');assert.equal(J(h,`G.fleets.find(x=>x.id===${sf}).path`).at(-1),home4);
  // ulaşılamayan hedef: test kurgusunda hedefin bütün şeritleri kesilir
  const iso=J(h,`(()=>{const f=G.fleets.find(x=>x.id===${f});for(const s of G.sys)if(s.id!==f.sys&&s.owner<0&&!G.fleets.some(q=>q.sys===s.id))return s.id;})()`);
  h.run(`for(const l of G.sys[${iso}].lanes)G.sys[l].lanes=G.sys[l].lanes.filter(x=>x!==${iso});G.sys[${iso}].lanes=[];`);
  s0=state(h);assert.equal(cmd(h,{kind:'move',fleet:f,to:iso}).code,'rules:no-route');assert.deepEqual(state(h),s0);
});
test('duplicate and stale move commands never apply twice; paused host refuses',()=>{
  const h=world(),f=warFleet(h),to=freeTarget(h,f);
  const s=h.run('++seq'),m={v:1,type:'cmd',seq:s,cid:'dupmove01',cmd:{kind:'move',fleet:f,to}};
  h.run(`MP.onMessage('c1',${JSON.stringify(JSON.stringify(m))})`);const after=state(h);
  for(let i=0;i<3;i++)h.run(`MP.onMessage('c1',${JSON.stringify(JSON.stringify(m))})`);assert.deepEqual(state(h),after,'duplicate cid applied once');
  h.run(`MP.onMessage('c1',${JSON.stringify(JSON.stringify({...m,cid:'stalemove1'}))})`);assert.deepEqual(state(h),after,'old seq refused');
  assert.equal(J(h,'MP.stats.duplicate'),3);assert.equal(J(h,'MP.stats.stale'),1);
  h.run('MP.setPaused(true,"host-background")');assert.equal(cmd(h,{kind:'move',fleet:f,to:J(h,`G.emps[${GUEST}].home`)}).code,'paused');assert.deepEqual(state(h).save,after.save);
});
test('guest research target runs the real researchTarget: same Save8 as the direct engine call; progress and completion happen in game time',()=>{
  const a=world(),b=world();
  // en ucuz hazır teknoloji, elle kipte (bütün araştırma geliri tek dala) — tamamlanmayı makul sürede görmek için
  const tech=J(a,`Object.keys(TECHS).filter(id=>researchReady(G.emps[${GUEST}],id)&&!Object.values(G.emps[${GUEST}].rq).includes(id)).sort((x,y)=>techCost(G.emps[${GUEST}],x)-techCost(G.emps[${GUEST}],y))[0]`);assert(tech);
  assert.equal(cmd(a,{kind:'researchMode',mode:'manual'}).status,'ok');assert.equal(J(b,`setResearchMode(G.emps[${GUEST}],'manual')`),true);
  const r=cmd(a,{kind:'research',tech});assert.equal(r.status,'ok',JSON.stringify(r));
  assert.equal(J(b,`researchTarget(G.emps[${GUEST}],${JSON.stringify(tech)},'toggle').ok`),true);
  assert.equal(a.run('serialize()'),b.run('serialize()'));
  const br=J(a,`TECHS[${JSON.stringify(tech)}].b`);assert.equal(J(a,`G.emps[${GUEST}].rq[${JSON.stringify(br)}]`),tech,'the target becomes the active research of its branch');
  let v=view(a);assert.deepEqual(v.sci.targets,[tech]);assert.equal(v.sci.rq[br],tech);assert.equal(v.tech[tech].s,'r');
  const p0=v.sci.rp[br];a.run('step(31);MP.publish()');b.run('step(31)');v=view(a);assert(v.sci.rp[br]>p0||v.tech[tech].s==='d','progress '+p0+' → '+v.sci.rp[br]);
  let m=0;while(!J(a,`!!G.emps[${GUEST}].techs[${JSON.stringify(tech)}]`)&&m<120){a.run('step(30);MP.publish()');b.run('step(30)');m++;}
  assert.equal(J(a,`!!G.emps[${GUEST}].techs[${JSON.stringify(tech)}]`),true,'completed after '+m+' more months');
  assert.equal(a.run('serialize()'),b.run('serialize()'),'identical worlds after completion');
  v=view(a);assert.equal(v.tech[tech].s,'d');assert(!v.sci.targets.includes(tech));
  const tn=J(a,`TECHS[${JSON.stringify(tech)}].n`);
  assert(v.log.some(x=>x.m.includes(tn)),'completion notice goes to the guest');
  assert(!J(a,'G.log.map(x=>x.m)').some(m=>m.includes('Araştırma tamamlandı — '+tn)&&J(a,`!G.emps[0].techs[${JSON.stringify(tech)}]`)),'not to the host log');
});
test('research rules from the engine: access-locked, completed, invalid, bad position and same mode refused without side effects; mode and removal work',()=>{
  const h=world();h.run(`grantResearchTech(G.emps[${GUEST}],'m_robot','legacy')`);   // kurgu: tamamlanmış bir teknoloji
  const locked=J(h,`Object.keys(TECHS).find(id=>!researchAccess(G.emps[${GUEST}],id).ok)`),done='m_robot';
  const s0=state(h);
  for(const [c,code] of [[{kind:'research',tech:locked},'rules:access'],[{kind:'research',tech:done},'rules:done'],[{kind:'research',tech:'yok_boyle'},'bad-params'],
    [{kind:'research',tech:'f_reaktor',action:'move',position:0},'rules:bad-position'],[{kind:'research',tech:'f_reaktor',action:'drop'},'bad-params'],
    [{kind:'researchMode',mode:'semi'},'rules:same'],[{kind:'researchMode',mode:'god'},'bad-params']]){
    const r=cmd(h,c);assert.equal(r.code,code,JSON.stringify(c));assert.deepEqual(state(h),s0,'no side effect: '+code);}
  assert.equal(view(h).tech[locked].s,'x');assert(view(h).tech[locked].w);
  assert.equal(cmd(h,{kind:'research',tech:'f_reaktor'}).status,'ok');assert.equal(cmd(h,{kind:'research',tech:'t_tarim'}).status,'ok');
  assert.equal(cmd(h,{kind:'research',tech:'t_tarim',action:'move',position:0}).status,'ok');assert.deepEqual(J(h,`G.emps[${GUEST}].research.targets`),['t_tarim','f_reaktor']);
  assert.equal(cmd(h,{kind:'research',tech:'t_tarim'}).status,'ok');assert.deepEqual(J(h,`G.emps[${GUEST}].research.targets`),['f_reaktor']);
  assert.equal(cmd(h,{kind:'researchMode',mode:'manual'}).status,'ok');assert.equal(J(h,`researchMode(G.emps[${GUEST}])`),'manual');
  assert.equal(view(h).sci.mode,'manual');
  // AI devletinin araştırması komutla değiştirilemez: komut her zaman bağlantının kendi devletine uygulanır
  assert.equal(cmd(h,{kind:'research',tech:'f_reaktor'},{empire:1}).code,'forged-empire');
});
test('guest view privacy: own fleets carry route/power, foreign fleets only id/empire/system/count; uncontacted empires are masked; no foreign research or economy',()=>{
  const h=world(),f=warFleet(h);
  // test kurgusu: misafir filosu temas kurulmamış devlet 4'ün başkentinde
  h.run(`(()=>{const f=G.fleets.find(x=>x.id===${f}),s=G.sys[G.emps[4].home];f.sys=s.id;f.x=s.x;f.y=s.y;f.path=[];f.mv=null;G.emps[${GUEST}].contact[4]=false;})();MP.observeHumans();MP.publish()`);
  const v=view(h),home4=J(h,'G.emps[4].home');
  assert.equal(v.sys[home4].o,-2,'owner id of an uncontacted empire is masked');
  const foreign=Object.values(v.fleets).filter(x=>!x.own);assert(foreign.length>0);
  for(const x of foreign){assert(Object.keys(x).every(k=>['id','e','s','n'].includes(k)),JSON.stringify(x));if(J(h,`G.fleets.find(q=>q.id===${x.id}).e`)===4)assert.equal(x.e,null);}
  const own=v.fleets[f];for(const k of ['nm','pa','mv','pw','st','au','sh'])assert(k in own,k);
  // oyun öncesi lobi devlet listesi tasarım gereği adları içerir (MP.1); oyun içi paketler taranır
  const pk=h.sb.__out.filter(([c,t])=>c==='c1'&&!(JSON.parse(t).type==='lobby'&&['waiting','ready'].includes(JSON.parse(t).phase))).map(([,t])=>t).join('\n');
  const otherNames=J(h,`G.emps.filter(o=>o.id!==${GUEST}&&!G.emps[${GUEST}].contact[o.id]).map(o=>o.name)`);
  for(const n of otherNames)assert(!pk.includes(JSON.stringify(n)),'uncontacted empire name leaked: '+n);
  // "1. Filo" gibi genel adlar kendi filolarında da var; yalnız kendi filolarında olmayan yabancı adlar taranır
  for(const n of J(h,`(()=>{const own=new Set(G.fleets.filter(q=>q.e===${GUEST}).map(q=>q.name));return G.fleets.filter(q=>q.e!==${GUEST}&&q.name&&!own.has(q.name)).map(q=>q.name);})()`))assert(!pk.includes(JSON.stringify(n)),'foreign fleet name leaked: '+n);
  assert(!/"(techs|aiStrategy|aiIntel|spy|spies|intel|journal|seen|surv|bank|history|token)":/.test(pk.replace(/"type":"assign"[^\n]*/g,'')),'internal field');
  assert.equal(Object.keys(v.tech).length,J(h,'Object.keys(TECHS).length'));
  const snap=h.sb.__out.filter(([c,t])=>c==='c1'&&JSON.parse(t).type==='snapshot').map(([,t])=>t.length);const save=h.run('serialize()').length;
  assert(Math.max(...snap)<save/3,'snapshot '+Math.max(...snap)+' vs Save8 '+save+' (oyun başı Save8 küçük; tam dünya değil)');
});
test('single player is untouched: lobby host with no remote human and the guards installed keeps Save8 identical to the plain engine over 120 days (research tick wrapper inert)',()=>{
  const a=runtime({root});a.run(`setupGame({...CFG,size:'orta',aiCount:5,seed:11});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;${STEP.replace('MP.observeHumans();','')};step(120)`);
  const b=runtime({root});b.sb.__r=n=>'ab'.repeat(n);b.run(CORE);
  b.run(`${STEP.replace('MP.observeHumans();','')};var MP=StarsMP.createHost({roomId:'x',random:__r,send(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.configure({size:'orta',aiCount:5,seed:11});step(120)`);
  assert.equal(b.run('serialize()'),a.run('serialize()'));assert.equal(b.run('RND_STATE'),a.run('RND_STATE'));
});
end();
