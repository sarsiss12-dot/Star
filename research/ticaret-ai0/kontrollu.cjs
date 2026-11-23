// node kontrollu.cjs <kök>  — TİCARET-AI.0 kontrollü vakalar (aynı fikstür kontrol p50 ve aday kökünde).
// a=2 (liman 10, mineral açığı, enerji fazlası), b=3 (liman 16, mineral fazlası, enerji açığı), sahip o=4 (liman 13). Hat 10-11-…-16:
// 10 → 16 altı sıçrama; ≤3 sıçrama kuralıyla yalnız 13'teki liman ara durak olursa rota var (iki yön).
const path=require('path');const {fresh}=require(path.resolve(__dirname,'../../tests/helpers/dispatch-fixture'));const {setup}=require(path.resolve(__dirname,'../../tests/helpers/96a-fixture'));
const root=path.resolve(process.argv[2]);
function world(opts={}){const h=fresh(0,root);h.run(setup);h.sb.OPT=JSON.stringify(opts);h.run(`(function(){const O=JSON.parse(OPT);
  for(const e of G.emps){e.contact={};e.intel={};e.res.etk=300;}
  const ids=[2,3,4,0];for(const x of ids)for(const y of ids)if(x!==y){G.emps[x].contact[y]=true;G.emps[x].rel=G.emps[x].rel||{};G.emps[x].rel[y]=O.rel??60;(G.emps[x].intel||={})[y]=3;(G.emps[x].mem||={})[y]=[{v:O.trust??60,d:G.day,k:"ticaret-ai0"}];}
  for(const s of G.sys)if(s.id>=10&&s.id<=16)s.lanes=[];for(let i=10;i<16;i++)link(i,i+1);
  port(G.emps[2],10);port(G.emps[3],16);if(!O.noRelay)port(G.emps[O.owner??4],13);
  for(const id of [10,16,13])G.sys[id].planets[0].col&&(G.sys[id].planets[0].col.pop=120);
  const a=G.emps[2],b=G.emps[3];a.ai=b.ai=true;G.emps[4].ai=true;
  a.res.ala=200;b.res.ala=200;a.res.min=20;a.inc={min:-4,ene:12,yiy:1,ala:1,tuk:1};a.res.ene=600;b.res.min=600;b.inc={min:12,ene:-4,yiy:1,ala:1,tuk:1};b.res.ene=20;
  a.pact[3]=b.pact[2]=true;
  if(O.bRight)(G.emps[O.owner??4].portTransit||={})[3]=G.day+360;
  Commerce.state();})()`);return h;}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const call=h=>J(h,`(()=>{const a=G.emps[2],b=G.emps[3],o=G.emps[4],e0=[a.res.etk,b.res.etk,o.res.etk];const A=Commerce.aiBalance(a),B=Commerce.aiBalance(b),bud={routes:96};
  const r=Commerce.aiTransitRequest(a,b,A,B,bud);return {r:!!r,used:96-bud.routes,aRight:o.portTransit?.[2]>G.day,bRight:o.portTransit?.[3]>G.day,
   etk:[a.res.etk-e0[0],b.res.etk-e0[1],o.res.etk-e0[2]].map(Math.round),inbox:(G.inbox||[]).length,fwd:!!Commerce.route(a,b,10,16),back:!!Commerce.route(b,a,16,10)};})()`);
const out={};
out.K1_ikiYon=call(world());
{const h=world();const first=call(h);h.run('G.day+=30');const again=call(h);
 h.run('G.day+=1;Commerce.state().aiAt={};');h.run('Commerce.aiOpportunityTick()');
 out.K2_sonrakiAySozlesme={first,again,contracts:J(h,`Commerce.state().contracts.map(c=>({a:c.a,b:c.b,legs:c.legs.map(l=>[l.e,l.r,l.v])}))`)};}
out.K3_bZatenIzinli=call(world({bRight:true}));
out.K4_rolesiz=call(world({noRelay:true}));
out.K5_insanSahip=call(world({owner:0}));
out.K6_dusukIliski=call(world({rel:-80}));
console.log(JSON.stringify(out));
