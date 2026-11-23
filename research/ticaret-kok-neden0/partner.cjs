'use strict';
const {cargoWorld}=require('../../tests/helpers/96a-fixture');
const assert=require('node:assert/strict'),fs=require('node:fs');
const h=cargoWorld();
h.run(`var partnerProbe=(()=>{
const a=G.emps[2],b=G.emps[1],owner=G.emps[3];
for(const id of [0,3]){G.sys[id].planets[0].col=null;G.sys[id].planets[0].owner=-1;}
G.p.colonies=[];b.colonies=[];
port(a,0);port(b,4);port(b,9);port(owner,3);
link(3,4);link(0,9);
for(const id of [0,1,2,3,4])G.sys[id].x=90*id;
G.sys[9].x=1000;
for(const e of [a,b,owner])e.mizac=e._pers='yayilmaci';
a.pact[b.id]=b.pact[a.id]=true;
owner.portTransit={[a.id]:G.day+360};
a.inc={min:100,ene:-5};b.inc={ene:100,min:-5};
a.res.min=b.res.ene=500;a.res.ene=b.res.min=30;
const A=Commerce.aiBalance(a),B=Commerce.aiBalance(b);
const preferred=Commerce.aiPorts(a,b,{routes:96});
const alternate={source:0,target:9,distance:1000};
function tryPort(ports){
 const deal=Commerce.aiTerms(a,b,A,B,ports);
 if(!deal)throw Error('Terimler oluşmadı');
 const quote=dealQuote(deal);
 return {ports,deal,ok:quote.ok,reasons:quote.reasons,
  reply:aiRespond(b,deal).v};
}
const initial=[a.res.ene,b.res.min],rng=RND_STATE;
const choice=tryPort(preferred),fallback=tryPort(alternate);
if(fallback.ok){executeDeal(fallback.deal);advanceCargo(2);Commerce.cancel(1,a);for(let i=0;i<90;i++)advanceCargo(1);}
return {choice,fallback,initial,after:[a.res.ene,b.res.min],rngBefore:rng,rngAfter:RND_STATE,convoys:G.commerce.convoys.map(v=>[v.id,v.status,v.delivered,v.receipt])};
})();`);
const result=JSON.parse(h.run('JSON.stringify(partnerProbe)'));
assert.equal(result.choice.ports.target,4);
assert.equal(result.choice.ok,false);
assert.equal(result.fallback.ok,true);
assert.equal(result.fallback.reply,'kabul');
assert(result.after.every((stock,i)=>stock>result.initial[i]));
assert(result.convoys.length===2&&result.convoys.every(v=>v[1]==='delivered'&&v[0]===v[3]));
fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');
