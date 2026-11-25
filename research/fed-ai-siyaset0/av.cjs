// node av.cjs <kök> <tohum> <ay> <çıkış.json>   [CAMP_SIZE · CAMP_AI]
// FED-AI-SİYASET.0 Faz D: ödül avının bedeli. Yabani taraf (korsan yuvası / kalıntı muhafızı / canavar) ile AI devlet arasındaki biten muharebeler:
// sayı, AI'ın kazandığı, AI gemi kaybı, yabani gemi kaybı; ay ay yuva/kalıntı sayısı ve AI toplam gemi / filo gücü. Dünyaya yazmaz, RNG çekmez.
const fs=require('fs'),path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
h.sb.SIZE=process.env.CAMP_SIZE||'ulu';h.sb.AIS=+(process.env.CAMP_AI||9);
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:SIZE,aiCount:AIS});setupGame({...CFG});G.autoSave=false;
var A={battles:0,aiWin:0,aiLoss:0,wildLoss:0,byYear:{},snap:[]};
{const f=battleReportFinish;battleReportFinish=function(r,winner){if(!r.done){const ea=G.emps[r.a],eb=G.emps[r.b];
  const ai=ea&&!ea.wild&&ea.ai?0:eb&&!eb.wild&&eb.ai?1:-1,wild=ai===0?eb:ai===1?ea:null;
  if(ai>=0&&wild&&wild.wild){A.battles++;if(winner===(ai===0?r.a:r.b))A.aiWin++;A.aiLoss+=r.loss[ai];A.wildLoss+=r.loss[1-ai];const y=Math.floor(G.day/360);const o=A.byYear[y]||(A.byYear[y]={b:0,l:0});o.b++;o.l+=r.loss[ai];}}
  return f.apply(this,arguments);};}
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}
 const mm=Math.floor(G.day/30);if(mm%12===0){const ais=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide);
  A.snap.push({m:mm,nests:(G.nests||[]).filter(id=>G.sys[id]&&G.sys[id].nest).length,ruins:G.sys.filter(s=>s.ruin&&s.ruin.hp>0).length,
   ships:G.fleets.filter(f=>ais.some(e=>e.id===f.e)).reduce((n,f)=>n+f.ships.length,0),power:Math.round(ais.reduce((n,e)=>n+totalPower(e),0)),
   ala:Math.round(ais.reduce((n,e)=>n+(e.res.ala||0),0))});}};`);
const t0=Date.now();for(let m=1;m<=+months;m++)h.run('__m()');
const r=JSON.parse(h.run('JSON.stringify(A)'));r.sec=Math.round((Date.now()-t0)/1000);fs.writeFileSync(out,JSON.stringify(r));
console.log(path.basename(out),JSON.stringify({battles:r.battles,aiWin:r.aiWin,aiLoss:r.aiLoss,wildLoss:r.wildLoss,last:r.snap.at(-1),sec:r.sec}));
