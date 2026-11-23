// Aynı Save8 ayında değişen işlevlerin çağrı sayısı / rota araması (deterministik; zaman değil)
const fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require(require('path').resolve(__dirname,'../../tests/helpers/runtime'));
for(const root of process.argv.slice(3)){const h=runtime({root:path.resolve(root)});h.sb.S=fs.readFileSync(process.argv[2],'utf8');
 const r=JSON.parse(h.run(`(()=>{if(!deserialize(S))throw Error('yükleme');G.autoSave=false;const C={tr:0,trRoute:0,route:0,inv:0};let inTr=false;
  const rt=Commerce.route;Commerce.route=function(){C.route++;if(inTr)C.trRoute++;return rt.apply(this,arguments);};
  const t=Commerce.aiTransitRequest;Commerce.aiTransitRequest=function(){C.tr++;inTr=true;try{return t.apply(this,arguments);}finally{inTr=false;}};
  const pi=Commerce.aiPortInvestment;Commerce.aiPortInvestment=function(){C.inv++;return pi.apply(this,arguments);};
  const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}
  return JSON.stringify({...C,day:G.day,rng:RND_STATE});})()`));
 r.sha=crypto.createHash('sha256').update(h.run('serialize()')).digest('hex').slice(0,16);console.log(path.basename(path.resolve(root)),JSON.stringify(r));}
