// node wset.cjs <kök> <save> <ay>: düzenli ticaret anlaşmalarında (freight/portTransit/pact) gerçek yazma kümesi
const fs=require('fs'),path=require('path');const {runtime}=require('/home/user/Star/tests/helpers/runtime');
const [root,save,months]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');
h.run(`G.autoSave=false;var WS={deals:0,other:0,paths:{},fresh:0};
var pathOf=(()=>{return function(target){const seen=new Set(),q=[];for(const k of DEAL_TX_ROOTS){const v=G[k];if(v&&typeof v==='object')q.push([v,k]);}
  while(q.length){const [o,p]=q.shift();if(o===target)return p;if(seen.has(o))continue;seen.add(o);if(p.split('.').length>6)continue;
   for(const k of Object.keys(o)){const v=o[k];if(v&&typeof v==='object'&&!seen.has(v))q.push([v,p+'.'+(Array.isArray(o)&&p==='emps'?k:k)]);}}return '?';};})();
var regular=o=>{const it=(o.give||[]).concat(o.want||[]);return it.length&&it.every(i=>['freight','portTransit','pact'].includes(i.t));};
var __ex=executeDeal;executeDeal=function(o){if(!regular(o)){WS.other++;return __ex.apply(this,arguments);}
  const vals=[];for(const k of DEAL_TX_ROOTS){const d=Object.getOwnPropertyDescriptor(G,k);if(d&&'value' in d)vals.push(d.value);}
  const before=txCaptureGraph(vals),objs=new Set(before.map(r=>r.obj));const prim={};for(const k of DEAL_TX_ROOTS){const v=G[k];if(!(v&&typeof v==='object'))prim[k]=v;}
  const r=__ex.apply(this,arguments);WS.deals++;
  const changed=[];for(const rec of before){const o=rec.obj;const keys=Reflect.ownKeys(o);let ch=keys.length!==rec.keys.length;
    if(!ch)for(let i=0;i<rec.keys.length;i++){const k=rec.keys[i],d=rec.props[i],now=Object.getOwnPropertyDescriptor(o,k);if(!now||('value' in d)&&!Object.is(d.value,now.value)){ch=true;break;}}
    if(rec.map&&!ch){ch=rec.map.length!==o.size;}if(rec.set&&!ch){ch=rec.set.length!==o.size;}
    if(ch)changed.push(o);}
  for(const k of DEAL_TX_ROOTS){const v=G[k];if(!(v&&typeof v==='object')&&!Object.is(prim[k],v))WS.paths['G.'+k+' (ilkel)']=(WS.paths['G.'+k+' (ilkel)']||0)+1;}
  for(const o of changed){let p=pathOf(o);const a=G.emps[o_from]&&0;p=p.replace(/^emps\\.(\\d+)/,(m,id)=>+id===arguments[0].from?'emps[a]':+id===arguments[0].to?'emps[b]':'emps[DİĞER '+id+']').replace(/^p(\\.|$)/,'p$1');
    const key=p.split('.').slice(0,3).join('.');WS.paths[key]=(WS.paths[key]||0)+1;}
  WS.last={from:o.from,to:o.to,items:(o.give||[]).concat(o.want||[]).map(i=>i.t),ok:r};return r;};
var o_from=0;
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}};`);
for(let m=0;m<+months;m++)h.run('__m()');
console.log(path.basename(save),h.run('JSON.stringify(WS)'));
