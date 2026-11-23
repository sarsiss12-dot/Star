'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {cargoWorld}=require('../../tests/helpers/96a-fixture');
const [out]=process.argv.slice(2);
const h=cargoWorld();
h.run(`for(let i=0;i<=3;i++)G.sys[i].x=i*900;
 G.p.res.min=160;G.p.res.ene=70;G.emps[1].res.min=70;G.emps[1].res.ene=160;
 G.p.inc={ene:-10,min:18};G.emps[1].inc={min:-10,ene:18};
 G.p.rel[1]=G.emps[1].rel[0]=80;`);
const start=h.run('serialize()'),rng=h.run('RND_STATE');
h.sb.initial=start;
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function compare(reserve){
const arms={};h.sb.reserve=reserve;
for(const mode of ['H0','H4','H8','noTrade','revoked']){
 h.sb.mode=mode;
 arms[mode]=JSON.parse(h.run(`JSON.stringify((()=>{
  if(!deserialize(initial))throw Error('Save8');Commerce.speed=mode==='H4'?36:18;
  const a=G.p,b=G.emps[1];a.res.ene=b.res.min=reserve;
  const r0=[a.res.min,b.res.ene],day=G.day,clocks=[],points=[];
  const kind=mode==='H8'?'res':'cargo';
  const n={from:a.id,to:b.id,give:[{t:kind,r:'min',v:35}],want:[{t:kind,r:'ene',v:35}]};
  function see(){
   for(const v of G.commerce.convoys)if(!clocks.some(x=>x[0]===v.id&&x[1]===v.status))clocks.push([v.id,v.status,G.day-day,v.amount,v.receipt]);
  }
  const ok=mode==='noTrade'?null:executeDeal(n);
  const after=[a.res.ene,b.res.min],afterSign=[a.res.min,b.res.ene];
  let depletion=0;
  for(let i=1;i<=360;i++){
   if(i===20&&mode==='revoked'){G.sys[2].cr=1;}
   G.day+=1;Commerce.tick(1);see();
   // Common shadow consumption, same 10/month for both arms. The engine alone provides cargo credit.
   if(i%30===0){
    const relief=[a.res.ene,b.res.min];points.push([i,...relief]);
    for(const x of relief)depletion+=Math.max(0,10-x);
    a.res.ene=Math.max(0,a.res.ene-10);b.res.min=Math.max(0,b.res.min-10);
   }
  }
  const stock=[a.res.min,b.res.ene],stats=G.commerce.stats;return {ok,days:360,after,afterSign,stock,r0,depletion,clocks,points,stats,rng:RND_STATE};
 })())`));
 if(mode!=='noTrade')assert(arms[mode].ok,mode);
 assert.equal(arms[mode].rng,rng,mode+' RNG');
}
assert.deepEqual(arms.H0.after,[reserve,reserve]);assert.deepEqual(arms.H4.after,[reserve,reserve]);
assert.deepEqual(arms.H8.after,[reserve+35,reserve+35]);assert.deepEqual(arms.H0.afterSign,[160,160]);
assert.deepEqual(arms.H0.stock,[125,125]);assert.deepEqual(arms.revoked.stock,[125,125]);
assert.equal(arms.H0.clocks.filter(x=>x[1]==='delivered').length,2);
assert.equal(arms.revoked.clocks.filter(x=>x[1]==='destroyed').length,2);
return arms;
}
fs.writeFileSync(out,JSON.stringify({start:sha(start),rng,arms:compare(70),stressed:compare(25)},null,2)+'\n');
