const fs=require('fs'),{runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const [root,save,months]=process.argv.slice(2);const h=runtime({root});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');
h.run(`var K9=[];function tr9(){return new Map(G.fleets.filter(f=>f.ships.length&&isTransport(f)&&G.emps[f.e]?.ai).map(f=>[f.id,{e:f.e,sys:f.sys,to:f.mv?f.mv.to:null,n:f.ships.length,g:Math.round(groundPower(f))}]));}
function wrap9(name){const o=globalThis[name];if(typeof o!=='function')return;globalThis[name]=function(){const b=tr9();const r=o.apply(this,arguments);const a=tr9();for(const [id,x] of b){const y=a.get(id);if(!y||y.n<x.n){const at=x.sys>=0?x.sys:x.to;const s=G.sys[at];K9.push({day:G.day,step:name,id,e:x.e,lostShips:x.n-(y?y.n:0),gone:!y,sys:x.sys,to:x.to,owner:s?s.owner:null,enemyFleets:s?G.fleets.filter(f=>f.sys===at&&f.ships.length&&isArmed(f)&&G.emps[x.e].war[f.e]).length:null,ownArmed:s?G.fleets.filter(f=>f.sys===at&&f.e===x.e&&isArmed(f)).length:null,sysDef:s?Math.round(sysDefense(s)):null});}}return r;};}
['combatTick','attritionTick','invasionTick','aiArmyTick','stepFleets','monthTick','economyTick','dailyTick'].forEach(wrap9);`);
for(let m=0;m<+months;m++){h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');if(m===59)h.run('deserialize(serialize())');}
const K=JSON.parse(h.run('JSON.stringify(K9)'));
// innermost step only: keep the first-wrapped specific step per (day,id)
const best=new Map();const prio=['combatTick','attritionTick','invasionTick','aiArmyTick','stepFleets','economyTick','monthTick','dailyTick'];
for(const k of K){const key=k.day+':'+k.id;const o=best.get(key);if(!o||prio.indexOf(k.step)<prio.indexOf(o.step))best.set(key,k);}
const agg={};for(const k of best.values()){const t=k.step+(k.gone?':gone':':damaged');agg[t]=(agg[t]||0)+1;}
console.log(JSON.stringify(agg));for(const k of [...best.values()].filter(k=>k.gone).slice(0,14))console.log(JSON.stringify(k));
