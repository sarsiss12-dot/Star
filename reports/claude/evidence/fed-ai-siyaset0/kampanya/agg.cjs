const fs=require("fs");const cells=[];const CAND=process.argv[2]||"candV";
const add=(dir,pre,s,M,pls,cand0)=>{const P=pls.map(a=>`${dir}/${pre}-${s}-${a}.json`).filter(f=>fs.existsSync(f)).map(f=>JSON.parse(fs.readFileSync(f)).snap.find(x=>x.m===M));const cand=CAND;const cf=`${dir}/${pre}-${s}-${cand}.json`;if(!fs.existsSync(cf)||P.length<2)return;
 const CR=JSON.parse(fs.readFileSync(cf));cells.push({id:pre+"-"+s+"-m"+M,P,C:CR.snap.find(x=>x.m===M),R:CR});};
for(const s of [11,23,404])add("b7","s5",s,120,["p55","plasebo600","plasebo300","plasebo900","plasebo1500"],"candV");
for(const s of [11,23,99,404])add("b7","u9",s,240,["p55","plasebo300","plasebo900","plasebo1500"],"candV");
for(const s of [11,23,99,404])add("b9","c9",s,240,["p55","plasebo300","plasebo900"],"candV");
for(const s of [11,404])for(const r of ["raz","rcok"])add("b9",r,s,240,["p55","plasebo"],"candV");
for(const k of ["cols","power","ships","surv","contact0","largest","indep","dead"]){
 const dc=[],dp=[];for(const c of cells){const v=c.P.map(x=>+x[k]);const m=v.reduce((a,b)=>a+b,0)/v.length;const abs=["largest","contact0","surv","dead","indep"].includes(k);const sc=abs?1:(m||1);
  dc.push((+c.C[k]-m)/sc);for(const x of v){const o=v.filter(y=>y!==x);const mo=o.length?o.reduce((a,b)=>a+b,0)/o.length:m;dp.push((x-mo)/(abs?1:(mo||1)));}}
 const mean=a=>a.reduce((x,y)=>x+y,0)/a.length,sd=a=>{const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)));};
 const pct=["cols","power","ships"].includes(k);const f=x=>pct?(x*100).toFixed(1)+"%":x.toFixed(3);
 console.log(k.padEnd(9),"hücre",cells.length,"aday ort sapma",f(mean(dc)),"(neg hücre",dc.filter(x=>x<0).length+"/"+dc.length+")","| plasebo LOO ort",f(mean(dp)),"sd",f(sd(dp)),"| aday sd",f(sd(dc)),"| t≈",(mean(dc)/(sd(dp)/Math.sqrt(dc.length))).toFixed(2));}

const L=cells.map(c=>(c.R.leaveWhy||[]).length),Rf=cells.map(c=>c.R.ev.memberReformProposal||0),rep=cells.map(c=>{const n={};for(const x of c.R.leaveWhy||[])n[x.e]=(n[x.e]||0)+1;return Math.max(0,...Object.values(n));});
console.log("ayrılma toplam",L.reduce((a,b)=>a+b,0),"/",cells.length,"kampanya · reform önergesi",Rf.reduce((a,b)=>a+b,0),"· aynı AI'ın en çok ayrılışı",Math.max(...rep),JSON.stringify(cells.map((c,i)=>c.id+":"+L[i]+"/"+rep[i])));
