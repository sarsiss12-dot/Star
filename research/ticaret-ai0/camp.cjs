// node camp.cjs <kök> <tohum> <ay> <çıkış.json>   [PLACEBO_DAY=<gün>: o günden sonraki ilk ay başında tek rnd() — kaotik plasebo bandı]
// TİCARET-AI.0 Faz F doğal kampanya: 100 sistem (ulu) / 9 AI. Ay ay Save8 SHA-256 (ilk ayrışma), AI başına kıtlık / ekonomi, ticaret olayları.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
h.sb.PL=process.env.PLACEBO_DAY?+process.env.PLACEBO_DAY:null;h.sb.SIZE=process.env.CAMP_SIZE||'ulu';h.sb.AIS=+(process.env.CAMP_AI||9);
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:SIZE,aiCount:AIS});setupGame({...CFG});G.autoSave=false;
var C={codes:{},transit:[],deals:[],used:{},signed:0,months:[],emp:{}};
var __n=AIDiagnostics.note;AIDiagnostics.note=function(code,a,b,why){if(/^trade-|^invest:liman/.test(code))C.codes[code]=(C.codes[code]||0)+1;
  if(/^trade-transit-(granted|refused|pending)/.test(code))C.transit.push({d:Math.floor(G.day),code,a:a&&a.id,o:b&&b.id,why});return __n.apply(this,arguments);};
var __ex=executeDeal;executeDeal=function(o){const r=__ex.apply(this,arguments);if(r&&(o.give||[]).concat(o.want||[]).some(i=>i.t==='freight')){C.signed++;C.deals.push([Math.floor(G.day),o.from,o.to]);for(const i of (o.give||[]).concat(o.want||[]))if(i.t==='freight'){C.used[i.source]=1;C.used[i.target]=1;}}return r;};
C.alt={calls:0,ok:0};if(Commerce.aiAltPorts){const ap=Commerce.aiAltPorts;Commerce.aiAltPorts=function(){C.alt.calls++;const r=ap.apply(this,arguments);if(r)C.alt.ok++;return r;};}
if(PL!==null){const mt=monthTick;monthTick=function(){if(G.day>=PL&&!globalThis.__pl){globalThis.__pl=true;rnd();}return mt.apply(this,arguments);};}
const BASE={ene:80,min:60,yiy:40,ala:60,tuk:40};
function tick(){for(const e of G.emps){if(!e.ai||e.wild||e.crisisSide)continue;const r=C.emp[e.id]||={short:0,crit:0,tuk:0,months:0};if(e.dead)continue;r.months++;if(e.shortage)r.tuk++;
  for(const k of Object.keys(BASE)){const inc=e.inc?.[k]||0,st=e.res[k]||0;if(st<BASE[k]&&inc<0)r.short++;if(inc<0&&st< -inc*3)r.crit++;}}}
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}tick();};
function fin(){const em=G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).map(e=>({id:e.id,dead:!!e.dead,col:e.colonies.length,sys:G.sys.filter(s=>s.owner===e.id).length,techs:Object.keys(e.techs||{}).length,
  res:Object.fromEntries(Object.keys(BASE).map(k=>[k,Math.round(e.res[k]||0)])),inc:Object.fromEntries(Object.keys(BASE).map(k=>[k,Math.round((e.inc?.[k]||0)*10)/10])),pt:Object.keys(e.portTransit||{}).filter(k=>e.portTransit[k]>G.day).map(Number),
  ports:tradeHubs(e).length,...C.emp[e.id]}));const cm=G.commerce||{contracts:[],convoys:[]};
 const hubs=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide).flatMap(e=>tradeHubs(e));
 return {hubs:hubs.length,hubsUsed:hubs.filter(id=>C.used[id]).length,delivAmt:Math.round(cm.convoys.filter(v=>v.status==='delivered').reduce((n,v)=>n+(v.loaded||0),0)),em,deliv:cm.convoys.filter(v=>v.status==='delivered').length,lost:cm.convoys.filter(v=>['lost','destroyed'].includes(v.status)).length,open:cm.contracts.filter(c=>!Commerce.closed(c)).length};}`);
const sha=()=>crypto.createHash('sha256').update(h.run('serialize()')).digest('hex').slice(0,16);
const t0=Date.now(),hashes=[];for(let m=1;m<=+months;m++){h.run('__m()');hashes.push(sha());}
const r=JSON.parse(h.run('JSON.stringify({alt:C.alt,codes:C.codes,transit:C.transit,deals:C.deals,signed:C.signed,fin:fin()})'));r.hashes=hashes;r.rng=h.run('RND_STATE');r.sec=Math.round((Date.now()-t0)/1000);
fs.writeFileSync(out,JSON.stringify(r));
const tot=r.fin.em.reduce((o,e)=>{o.short+=e.short;o.crit+=e.crit;o.col+=e.col;o.dead+=e.dead?1:0;return o;},{short:0,crit:0,col:0,dead:0});
console.log(path.basename(out),JSON.stringify({tot,transit:r.transit.length,signed:r.signed,deliv:r.fin.deliv,sec:r.sec,last:hashes.at(-1)}));
