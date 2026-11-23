// node kontrollu-liman.cjs <kök> — TİCARET-AI.1 kontrollü liman yatırımı vakaları (aynı fikstür her kökte). a=2 liman 10, b=3 liman 16;
// hat 10-11-…-16 (6 sıçrama, aradaki limansız → mevcut rota yok). a'nın 14'te limansız kolonisi var (16'ya 2 sıçrama): oraya liman yapılırsa koridor açılır.
const path=require('path');const {fresh}=require(path.resolve(__dirname,'../../tests/helpers/dispatch-fixture'));const {setup}=require(path.resolve(__dirname,'../../tests/helpers/96a-fixture'));
const root=path.resolve(process.argv[2]);
function world(O={}){const h=fresh(0,root);h.run(setup);h.sb.OPT=JSON.stringify(O);h.run(`(function(){const O=JSON.parse(OPT);
  for(const e of G.emps){e.contact={};e.intel={};e.res.etk=300;}
  const ids=[2,3,4,0];for(const x of ids)for(const y of ids)if(x!==y){G.emps[x].contact[y]=true;G.emps[x].rel=G.emps[x].rel||{};G.emps[x].rel[y]=60;(G.emps[x].intel||={})[y]=3;(G.emps[x].mem||={})[y]=[{v:60,d:G.day,k:'t'}];}
  for(const s of G.sys)if(s.id>=10&&s.id<=16)s.lanes=[];for(let i=10;i<16;i++)link(i,i+1);
  port(G.emps[2],10);port(G.emps[3],16);const cs=O.far?11:14;port(G.emps[2],cs);G.sys[cs].planets[0].col.b.liman=0;G.emps[2].home=10;
  for(const id of [10,16,cs]){const c=G.sys[id].planets[0].col;c.pop=O.pop??120;c.q=[];}
  const a=G.emps[2],b=G.emps[3];a.ai=b.ai=true;a.pact[3]=b.pact[2]=true;
  for(const e of [a,b])for(const k of ['min','ene','ala','tuk','yiy'])e.res[k]=O.stock??600;
  a.res.min=O.aMin??20;a.inc={min:O.aNet??-4,ene:12,yiy:1,ala:1,tuk:1};a.res.ene=600;b.res.min=600;b.inc={min:12,ene:-4,yiy:1,ala:1,tuk:1};b.res.ene=20;
  if(O.shortage)a.shortage=true;Commerce.state();})()`);return h;}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const run=O=>{const h=world(O);return J(h,`(()=>{const a=G.emps[2],b=G.emps[3],C=Commerce;const A=C.aiBalance(a),B=C.aiBalance(b);const cs=${O.far?11:14};
  const before=C.route(a,b,10,16,{avoidObserved:true}),hyp=C.route(a,b,cs,16,{avoidObserved:true});const notes=[];const n0=AIDiagnostics.note;AIDiagnostics.note=function(c){notes.push(c);return n0.apply(this,arguments);};
  let terms=null,ratio=null;if(hyp){const p=G.sys[cs].planets[0],cost=buildingOrderCost(a,p,'liman'),d=hyp.slice(1).reduce((n,id,i)=>n+dist(G.sys[hyp[i]],G.sys[id]),0);terms=C.aiTerms(a,b,A,B,{source:cs,target:16,distance:d});
   if(terms&&cost){const v=C.aiValue(a,{from:3,to:2,give:terms.want,want:terms.give}).net,pr=Object.entries(cost).reduce((s,[r,x])=>s+itemValue(a,{t:'res',r,v:x},b),0);ratio=Math.round(v/pr*100)/100;}}
  const r=C.aiPortInvestment(a,b,A,B,{routes:96});AIDiagnostics.note=n0;
  return {before:!!before,hyp:!!hyp,terms:!!terms,ratio,invested:!!r,queued:(G.sys[cs].planets[0].col.q||[]).map(q=>q.key),notes:notes.filter(c=>/trade|invest/.test(c))};})()`);};
const out={D1a_acikKaynakYetmez:run({}),D1_tekLimanKoridor:run({aMin:300}),D3_koridorAcmaz:run({far:true,aMin:300}),D4_kriz:run({shortage:true,aMin:300}),D5_acikYok:run({aNet:2,aMin:600})};
{const h=world({aMin:300});out.D9_tekrar=J(h,`(()=>{const a=G.emps[2],b=G.emps[3],C=Commerce;const r1=C.aiPortInvestment(a,b,C.aiBalance(a),C.aiBalance(b),{routes:96});const r2=C.aiPortInvestment(a,b,C.aiBalance(a),C.aiBalance(b),{routes:96});
  return {r1:!!r1,r2:!!r2,queued:G.sys[14].planets[0].col.q.filter(q=>q.key==='liman').length};})()`);}
console.log(JSON.stringify(out));
