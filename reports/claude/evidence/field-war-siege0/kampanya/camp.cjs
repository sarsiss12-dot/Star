// FIELD-WAR-SIEGE.0 kampanya: aynı tohum, kontrol (03a3aa4) / aday; yalnız AI (oyuncu devleti de AI'ya devredilmez — tek oyunculu varsayılan akış, oyuncu emir vermez).
const {runtime}=require(require('path').resolve(__dirname,'../../../../../tests/helpers/runtime'));const [root,seed,months]=[process.argv[2],+process.argv[3],+process.argv[4]];
const h=runtime({root});
h.run(`setupGame({...CFG,seed:${seed},size:'orta',aiCount:10});G.autoSave=false;
 globalThis.__cap=0;globalThis.__flip=[];const _c=captureSystem;captureSystem=function(s,by,cause){__cap++;return _c.apply(this,arguments);};
 function month(n=1){for(let i=0;i<n*60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}`);
const rows=[];const t0=Date.now();
for(let m=1;m<=months;m++){h.run('month(1)');if(m%24===0||m===months){rows.push(JSON.parse(h.run(`JSON.stringify((()=>{const fr=G.warLedger.fronts;const er={};for(const f of fr)if(f.ended!==null){const k=String(f.endReason||'').split('|')[0];er[k]=(er[k]||0)+1;}
 return {m:${m},alive:G.emps.filter(e=>!e.dead&&!e.wild).length,fronts:fr.length,open:fr.filter(f=>f.ended===null).length,endReasons:er,captures:__cap,stuckSiege:G.sys.reduce((n,s)=>n+s.planets.filter(p=>p.col&&(p.col.siege||0)>0&&!G.fleets.some(f=>f.sys===s.id&&!f.mv&&f.ships.length&&f.e!==p.owner&&isArmed(f)&&G.emps[f.e]&&(G.emps[f.e].war[p.owner]||G.emps[f.e].wild))).length,0),
 rng:typeof G.rng==='number'?G.rng:(G.seedState||null)};})())`)));}}
console.log(JSON.stringify({root:root.includes('base')?'kontrol':'aday',seed,ms:Date.now()-t0,rows}));
