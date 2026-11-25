const fs=require("fs"),dir=process.argv[2];
function load(f){return fs.existsSync(f)?JSON.parse(fs.readFileSync(f)):null;}
function tbl(pre,seeds,arms,M){const keys=["cols","power","ships","wildLoss","contact","contact0","born","surv","largest","indep","nests","dead"];
 const agg={};for(const s of seeds){for(const a of arms){const r=load(`${dir}/${pre}-${s}-${a}.json`);if(!r)continue;const z=r.snap.find(x=>x.m===M)||r.snap.at(-1);
  const row={};for(const k of keys)row[k]=typeof z[k]==="number"?+(+z[k]).toFixed(3):z[k];row.leave=(r.leaveWhy||[]).length;row.ref=r.ev.memberReformProposal||0;row.found=r.ev.found;row.join=r.ev.join;row.jp=r.joint.plans;
  (agg[s]=agg[s]||{})[a]=row;}}
 return agg;}
for(const [pre,seeds,M,arms] of [["s5",[11,23,404],120,["p55","plasebo600","plasebo300","plasebo900","plasebo1500","candP","candF","cand"]],["u9",[11,23,99,404],120,["p55","plasebo300","plasebo900","plasebo1500","candP","cand"]],["u9",[11,23,99,404],240,["p55","plasebo300","plasebo900","plasebo1500","candP","cand"]]]){
 const A=tbl(pre,seeds,arms,M);console.log("=====",pre,"ay",M);
 for(const k of ["cols","power","ships","wildLoss","contact0","contact","born","surv","largest","indep","leave","ref"]){
  const line=[k.padEnd(9)];for(const s of seeds){const R=A[s];const pl=arms.filter(a=>a.startsWith("p")).map(a=>R[a]&&R[a][k]).filter(v=>v!==undefined);
   const lo=Math.min(...pl),hi=Math.max(...pl);const c=R.cand?R.cand[k]:"-",p=R.candP?R.candP[k]:"-";
   const flag=v=>typeof v!=="number"?"":v<lo?"↓":v>hi?"↑":"";line.push(`${s}:[${lo},${hi}] P=${p}${flag(p)} C=${c}${flag(c)}`);}
  console.log(line.join(" | "));}}
