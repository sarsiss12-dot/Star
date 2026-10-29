'use strict';
// 96H.11: per-colony output under each focus (shadow colony, read-only, no RNG), monthly.
// usage: [RELOAD_AT=60] node foc11.js <gameRoot> <save> <months> <out.json>
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const [root,saveFile,monthsArg,out]=process.argv.slice(2);
const {runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const h=runtime({root:path.resolve(root)});
h.sb.raw11=fs.readFileSync(saveFile,'utf8');if(!h.run('deserialize(raw11)'))throw Error('load failed');h.run('delete raw11');
h.run(`function isAI(e){return e&&e.ai&&!e.wild&&!e.crisisSide&&e.id!==0;}
const R11=['ene','min','ala','yiy','tuk','ara','etk'];
function fsnap(){const rng=RND_STATE,out=[];for(const e of G.emps.filter(x=>isAI(x)&&!x.dead)){const prof=aiProfile(e);
 for(const c of e.colonies){const sys=G.sys[c.s],pl=sys.planets[c.p];if(!pl.col||pl.owner!==e.id)continue;const alt={};
  for(const k of ['-','yonetim','sanayi','arastir','tarim','garnizon']){const r=colonyOutput(e,sys,{...pl,col:{...pl.col,f:k==='-'?undefined:k}});alt[k]=Object.fromEntries(R11.map(x=>[x,+((r.o[x]||0)-(r.use[x]||0)).toFixed(3)]));}
  out.push({e:e.id,s:sys.id,p:pl.i,home:e.home===sys.id,f:pl.col.f||'-',fcd:pl.col.fcd||0,auto:pl.col.auto,pop:+pl.col.pop.toFixed(2),b:{...pl.col.b},dep:pl.dep||null,t:pl.t,alt,
   T:18+prof.sci*22,inc:Object.fromEntries(R11.map(x=>[x,+(e.inc[x]||0).toFixed(2)])),crisis:e.crisis||null,one:hasCivic(e,'oneparty')});}}
 if(rng!==RND_STATE)throw Error('rng');return out;}`);
const months=+monthsArg,rows=[];
for(let m=0;m<months;m++){h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');
 if(process.env.RELOAD_AT&&Math.round(h.run('G.day')/30)===+process.env.RELOAD_AT&&!h.run('deserialize(serialize())'))throw Error('reload failed');
 rows.push({m:m+1,cols:JSON.parse(h.run('JSON.stringify(fsnap())'))});}
const save=h.run('serialize()');const H=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.writeFileSync(out,JSON.stringify({finalSaveSHA:H(save),rows}));console.log(out);
