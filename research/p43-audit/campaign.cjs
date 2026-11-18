'use strict';
// Half-day order from tests/beta-scale0-campaign.cjs and research/perf1/scripts/gen-saves.cjs.
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),crypto=require('node:crypto');
const {runtime}=require('../../tests/helpers/runtime');
const [n,ai,seed,target]=process.argv.slice(2,6).map(Number), fixture=process.argv[6];
const name=fixture||[n,ai,seed].join('-'),dir=process.env.CHECKPOINT_DIR||'/tmp/stars-p43';
const h=runtime(),months=[],checks=[];fs.mkdirSync(dir,{recursive:true});
if(fixture){h.sb.txt=fs.readFileSync(path.join(__dirname,'../../tests/fixtures/96h9',fixture),'utf8');if(!h.run('deserialize(txt)'))throw Error('load');}
else{h.run(`setupGame({...CFG,size:setupSizeKey(${n}),aiCount:${ai},seed:${seed}});if(G.sys.length!==${n}||G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).length!==${ai})throw Error('scenario');`);}
h.run(`G.autoSave=false;var events=[],legs=new Map();
function note(k,e,x){events.push({k,d:G.day,e:e?.id,...x});}
function watch(k,after){const fn=globalThis[k];globalThis[k]=function(...a){const r=fn.apply(this,a);after(r,...a);return r;};}
watch('aiPlanEvent',(r,e,k,x)=>{if(e?.ai&&!e.wild&&!e.crisisSide)note(k,e,{obj:e.aiStrategy?.objective?.kind,...x});});
watch('aiMove',(r,e,f,to)=>{if(!r||!f.path.length||!isArmed(f)||e.wild||e.crisisSide)return;const old=legs.get(f.id);if(old?.to===to)return;
 if(old)note('leg-end',e,{...old,end:'retasked'});const x={actor:e.id,f:f.id,from:f.sys,to,start:G.day,ships:f.ships.length,hops:f.path.length,war:!!e.war[G.sys[to].owner],phase:e.aiCampaign?.phase,target:e.aiCampaign?.target};
 legs.set(f.id,x);note('leg',e,x);});
watch('aiNegotiate',(r,e,o,g,w)=>{if(e.ai)note('deal',e,{other:o.id,g:g.map(x=>x.t),w:w.map(x=>x.t),result:r?.karar,applied:!!r?.uygulandi});});
watch('makePeace',(r,e,o,reason)=>{if(r)note('peace',e,{other:o.id,reason});});
watch('subjugate',(r,e,o,type,terms,source)=>{if(o.overlord===e.id)note('vassal',e,{other:o.id,type,source});});
watch('vassalOffer',(r,e,o,mode,type)=>note('vassal-offer',e,{other:o.id,mode,type,ok:r?.ok}));
watch('warLedgerGround',(r,a,b,lost,reduced)=>note('ground',G.emps[a],{b,lost,reduced}));
const units=e=>G.fleets.filter(f=>f.e===e.id).reduce((n,f)=>n+f.ships.length,0);
const dis=aiDisbandTick;aiDisbandTick=function(){const prev=G.emps.map(e=>({units:units(e),stock:e.res.ene,net:e.inc.ene}));const r=dis.apply(this,arguments);
 for(const e of G.emps){const x=prev[e.id],drop=x.units-units(e);if(drop>0)note('disband',e,{...x,drop});}return r;};
const build=colonyBuildTick;colonyBuildTick=function(dt){const done=[];for(const e of G.emps)if(!e.dead&&!e.wild)for(const c of e.colonies){const p=G.sys[c.s]?.planets[c.p],q=p?.col?.q?.[0];
 if(q&&q.left<=dt)done.push({e,c,p,q,count:p.col.b[q.key]||0});}
 const r=build.apply(this,arguments);for(const {e,c,p,q,count}of done){const diff=(p.col.b[q.key]||0)-count;note(diff>0?'built':diff<0?'removed':'build-refund',e,{system:c.s,planet:c.p,key:q.key,paid:q.paid,refund:q.refund});}return r;};
function advance(){for(let i=0;i<60&&!G.over;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
 for(const [id,x] of legs){const f=G.fleets.find(f=>f.id===id);if(!f||f.sys===x.to&&!f.mv){note('leg-end',G.emps[x.actor],{...x,end:f?'arrived':'lost-or-merged'});legs.delete(id);}}
 if(Math.floor(G.day/30)>m)monthTick();}}
function observe(){const siege=[];for(const f of G.fleets){const a=G.emps[f.e],s=G.sys[f.sys];if(!a||a.wild||a.crisisSide||f.mv||!s||!isArmed(f))continue;
 for(const p of s.planets)if(p.col&&a.war[p.owner]&&!siege.some(x=>x.s===s.id&&x.p===p.i&&x.atk===a.id)){siege.push({s:s.id,p:p.i,atk:a.id,def:p.owner,status:siegeStatus(s,p,a.id)?.code,shield:p.col.shield,gar:p.col.garrison,progress:p.col.siege});}}
 return {day:G.day,over:!!G.over,siege,feds:G.feds.map(f=>[f.id,f.type,f.members.slice()]),emps:G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).map(e=>({
 id:e.id,dead:e.dead,doc:researchDoctrine(e),res:e.res,inc:e.inc,ships:units(e),tech:Object.keys(e.techs).length,colonies:e.colonies.length,campaign:e.aiCampaign,
 obj:e.aiStrategy?.objective?.kind,lord:e.overlord,allies:Object.keys(e.ally||{}).filter(k=>e.ally[k]),crisis:e.crisis}))};}`);
function flush(){const data={name,n,ai,seed,target,checks,months,...JSON.parse(h.run('JSON.stringify({events,fronts:G.warLedger.fronts})'))};
 const dest=path.join(__dirname,'raw',name+'.json.gz');fs.writeFileSync(dest+'.tmp',z.gzipSync(JSON.stringify(data)));fs.renameSync(dest+'.tmp',dest);}
function save(m){const str=h.run('serialize()');fs.writeFileSync(path.join(dir,name+'-m'+m+'.save'),str);checks.push({month:m,sha256:crypto.createHash('sha256').update(str).digest('hex'),rng:h.run('RND_STATE')});}
for(let m=0;m<=target;m++){
 if(m)h.run('advance()');months.push(JSON.parse(h.run('JSON.stringify(observe())')));
 if(m===0||[3,30,60,120,180,240].includes(m)||m===target||h.run('!!G.over')){save(m);flush();console.log(name,m,months.at(-1).over);}
 if(h.run('!!G.over'))break;}
