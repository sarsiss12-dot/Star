// node alt-yuk.cjs <kökA> <kökB>  — alternatif liman yolu gerçekten çalışırken maliyet (tests/ticaret_gecerli_hat0_test.js G1 fikstürü):
// her örnek aynı fikstürde aiPorts + aiTerms + dealQuote (+ adayda aiAltPorts) karar zinciri; ABBA, gerçek saat, çağrı başına µs.
const path=require('path');const {fresh}=require(path.resolve(__dirname,'../../tests/helpers/dispatch-fixture'));const {setup}=require(path.resolve(__dirname,'../../tests/helpers/96a-fixture'));
const now=()=>Number(process.hrtime.bigint())/1e6;
function world(root){const h=fresh(0,path.resolve(root));h.run(setup);h.run(`(function(){const I=G.emps[1],P=G.emps[2],own=G.emps[3];
 for(const id of [0,3]){G.sys[id].planets[0].col=null;G.sys[id].planets[0].owner=-1;G.sys[id].owner=-1;}for(const e of G.emps){e.colonies=[];e.contact={};}
 port(P,0);port(I,4);port(I,9);port(own,3);link(3,4);link(0,9);for(const id of [0,1,2,3,4])G.sys[id].x=90*id;G.sys[9].x=1000;
 for(const e of [I,P,own]){e.mizac=e._pers='yayilmaci';for(const o of [I,P,own])if(o!==e){e.contact[o.id]=true;(e.intel||={})[o.id]=3;e.rel[o.id]=60;(e.mem||={})[o.id]=[{v:60,d:G.day,k:'t'}];}}
 I.pact[P.id]=P.pact[I.id]=true;own.portTransit={[I.id]:G.day+360};I.inc={min:100,ene:-5,yiy:1,ala:1,tuk:1};P.inc={ene:100,min:-5,yiy:1,ala:1,tuk:1};I.res.min=500;P.res.ene=500;I.res.ene=30;P.res.min=30;
 I.ai=P.ai=own.ai=true;Commerce.state();})();
 var __step=()=>{const C=Commerce,a=G.emps[1],b=G.emps[2],A=C.aiBalance(a),B=C.aiBalance(b),budget={routes:96};let ports=C.aiPorts(a,b,budget),n=C.aiTerms(a,b,A,B,ports),q=dealQuote(n);
  if(!q.ok&&C.aiAltPorts){const alt=C.aiAltPorts(a,b,A,B,ports,budget);if(alt){q=alt.quote;}}return q.ok;};`);h.sb.__now=now;return h;}
const H=process.argv.slice(2).map(world),R=H.map(()=>[]),ok=H.map(h=>h.run('__step()'));const K=200;
for(let i=0;i<40;i++)for(const a of (i%2?[1,0]:[0,1])){const t=now();H[a].run(`for(let k=0;k<${K};k++)__step()`);R[a].push((now()-t)/K*1000);}
const med=xs=>[...xs].sort((a,b)=>a-b)[xs.length>>1];
console.log(JSON.stringify({ok,usPerDecision:R.map(r=>+med(r).toFixed(1)),p95:R.map(r=>+[...r].sort((a,b)=>a-b)[Math.floor(r.length*.95)].toFixed(1))}));
