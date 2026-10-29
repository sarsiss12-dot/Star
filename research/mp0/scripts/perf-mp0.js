'use strict';
/* MP.0 kapasite ölçümü (Node vm, gerçek motor). 45/60/100 sistem, host + 1 ya da
   3 uzak insan devleti, 24 ay. Ölçülen: aylık simülasyon (monthTick dahil 60
   yarım günlük adım), oyuncu başına filtreli görünüm + delta süresi ve boyutu,
   snapshot boyutu, tam Save8 boyutu. Kullanım: node perf-mp0.js [out.json] */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..');
const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const rows=[];
for(const [size,humans] of [['orta',1],['buyuk',1],['ulu',1],['ulu',3]]){
  const h=runtime({root});h.sb.__r=n=>crypto.randomBytes(n).toString('hex');h.sb.__o=[];h.run(CORE);
  h.run(`setupGame({...CFG,seed:11,size:'${size}'});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;
    var MP=StarsMP.createHost({roomId:'perf',random:__r,send:(c,t)=>__o.push(t.length)});MP.installGuards();
    var cand=G.emps.filter(e=>e.id!==0&&!e.wild&&!e.crisisSide&&!e.dead).slice(0,${humans});
    cand.forEach((e,i)=>{MP.onMessage('c'+i,JSON.stringify({v:1,type:'hello',name:'P'+i}));const pid=[...MP.state.players.values()].find(p=>p.conn==='c'+i).playerId;MP.assign(pid,e.id);});`);
  const snap=h.sb.__o.slice();h.sb.__o.length=0;
  const r=JSON.parse(h.run(`(()=>{const sim=[],pub=[];
    for(let m=0;m<24;m++){const t=Date.now();for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick();}
      sim.push(Date.now()-t);const u=Date.now();MP.publish();pub.push(Date.now()-u);}
    return JSON.stringify({systems:G.sys.length,empires:G.emps.length,humans:cand.length,sim,pub,save:serialize().length});})()`));
  const deltas=h.sb.__o.filter(n=>n>0);
  const avg=a=>Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10;
  rows.push({size,systems:r.systems,empires:r.empires,remoteHumans:r.humans,monthSimMsAvg:avg(r.sim),monthSimMsMax:Math.max(...r.sim),
    publishMsAvg:avg(r.pub),publishMsMax:Math.max(...r.pub),snapshotBytesAvg:avg(snap.filter(n=>n>1000)),deltaBytesAvg:avg(deltas),deltaBytesMax:Math.max(...deltas),
    saveBytes:r.save,monthlyBytesPerPlayer:avg(deltas)});
  console.log(JSON.stringify(rows.at(-1)));
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({engine:'Node '+process.version+' vm (gerçek runtime)',seed:11,months:24,rows},null,1));
