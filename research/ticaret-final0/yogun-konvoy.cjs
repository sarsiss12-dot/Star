// node yogun-konvoy.cjs <kökA> <kökB> <500 sistem kayıt.save>   — TİCARET-FİNAL.0 Faz F
// Codex research/ticaret-kok-neden0/browser-load.cjs yük fikstürünün Node sürümü: 500 sistemlik düz koridor (499 sıçrama, her 3. sistemde liman,
// ara limanlar 3. devlette, iki taşıyıcıya izinli), aynı sözleşmenin konvoyundan 0/1/8/32/64 kopya. Her örnek aynı Save8'den 60 yarım günlük
// Commerce.tick; ABBA; gerçek saat (yalnız tick döngüsü; kayıt açma hariç). Kollar arası eşdeğerlik: her ölçekte son Save8 SHA-256 ve RNG iki kolda aynı olmalı.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [ra,rb,save]=process.argv.slice(2);const N=+(process.env.N||12),SCALES=[0,1,8,32,64];const now=()=>Number(process.hrtime.bigint())/1e6;
function arm(root){const h=runtime({root:path.resolve(root)});h.sb.S=fs.readFileSync(save,'utf8');h.sb.__rt=now;
 h.run(`var INPUTS=(()=>{if(!deserialize(S))throw Error('Save8');G.speed=0;G.autoSave=false;
  const [a,b,d]=G.emps,normal=[a,b,d];for(const e of normal){e.dead=e.wild=e.crisisSide=false;e.civics=[];e.war={};e.pact={};e.embargo={};e.intel={};e.contact={};e.colonies=[];e.mizac=e._pers='yayilmaci';for(const o of normal){e.contact[o.id]=true;e.intel[o.id]=3;}}
  a.pact[b.id]=b.pact[a.id]=true;d.portTransit={0:G.day+360,1:G.day+360};G.feds=[];G.council=null;G.fleets=[];G.raids={};G.commerce=Commerce.empty();
  const end=G.sys.length-1,template=JSON.parse(JSON.stringify(G.sys.flatMap(s=>s.planets).find(p=>p.col).col));
  for(const s of G.sys){s.cr=0;s.owner=-1;s.lanes=[s.id-1,s.id+1].filter(n=>n>=0&&n<=end);s.x=s.id*25;s.y=10;s.seen=s.surv=[0,1,2];for(const p of s.planets){p.owner=-1;p.col=null;}
   if(s.id%3===0||s.id===end){const owner=s.id===0?a:s.id===end?b:d,p=s.planets[0];p.col=JSON.parse(JSON.stringify(template));p.col.b.liman=1;p.col.pop=100;p.owner=owner.id;owner.colonies.push({s:s.id,p:p.i});s.owner=owner.id;}}
  const n={from:0,to:1,give:[{t:'freight',r:'min',v:2,source:0,target:end,months:12,every:90}],want:[{t:'freight',r:'ene',v:2,source:end,target:0,months:12,every:90}]};
  a.res.min=b.res.ene=1000;if(!executeDeal(n))throw Error('imza');G.day+=2;Commerce.tick(2);Commerce.cancel(1,a);
  const convoy=JSON.parse(JSON.stringify(G.commerce.convoys[0])),contract=JSON.parse(JSON.stringify(G.commerce.contracts[0]));const out={};
  for(const scale of [${SCALES}]){G.commerce.convoys=[];G.commerce.contracts=[];G.commerce.stats={};
   for(let i=1;i<=scale;i++){const l=JSON.parse(JSON.stringify(convoy)),c=JSON.parse(JSON.stringify(contract));l.id=l.contract=c.id=i;G.commerce.convoys.push(l);G.commerce.contracts.push(c);}
   G.commerce.nextConvoy=G.commerce.nextContract=scale+1;out[scale]=serialize();}
  return out;})();var __run=n=>{if(!deserialize(INPUTS[n]))throw Error('girdi');const t=__rt();for(let i=0;i<60;i++){G.day+=.5;Commerce.tick(.5);}return __rt()-t;};`);return h;}
const H=[arm(ra),arm(rb)],R=H.map(()=>Object.fromEntries(SCALES.map(n=>[n,[]]))),proof=H.map(()=>({}));
for(let rep=0;rep<N;rep++)for(const n of (rep%2?[...SCALES].reverse():SCALES))for(const a of (rep%2?[1,0]:[0,1])){R[a][n].push(+H[a].run(`__run(${n})`));
 if(!proof[a][n])proof[a][n]=crypto.createHash('sha256').update(H[a].run('serialize()')+'|'+H[a].run('RND_STATE')).digest('hex').slice(0,16);}
const med=xs=>[...xs].sort((x,y)=>x-y)[xs.length>>1],p95=xs=>[...xs].sort((x,y)=>x-y)[Math.min(xs.length-1,Math.floor(xs.length*.95))];
const rows=SCALES.map(n=>({n,A:{med:+med(R[0][n]).toFixed(2),p95:+p95(R[0][n]).toFixed(2)},B:{med:+med(R[1][n]).toFixed(2),p95:+p95(R[1][n]).toFixed(2)},esit:proof[0][n]===proof[1][n],proof:proof[0][n]}));
for(const r of rows)r.dMed=r.A.med?+((r.B.med/r.A.med-1)*100).toFixed(1):null;
console.log(JSON.stringify(rows));if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify({ra,rb,N,rows},null,1));
