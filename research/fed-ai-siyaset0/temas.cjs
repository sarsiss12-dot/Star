// node temas.cjs <kök> <tohum> <ay> <çıkış.json>   [CAMP_SIZE=ulu CAMP_AI=9 · CHECK="60,120,240"]
// FED-AI-SİYASET.0 Faz D: diplomatik temas tanısı. Dünyaya yazmaz, RNG çekmez (yalnız okuma; explorationContext / explorationBlock salt).
// Her kontrol ayında her AI çifti (a,b) için: temas var mı; yoksa NEDEN sınıfı:
//   gemi-yok        a'nın bilim (keşif) filosu yok
//   sinir-gorunur   b'nin sahip olduğu bir sistem a'nın sensör menzilinde (visible) — sınır görülüyor ama hiçbir filo girmedi
//   bilinen-sistem  b'nin sistemi a'nın "known" kümesinde (daha önce keşfedilmiş, o zaman sahipsizdi ya da görülüyor) ama temas yok
//   ikmal-engeli    b'nin sistemi a'nın keşif sınırında (frontier) ama silahsız keşif gemisi ikmal tabanı yüzünden giremiyor
//   sinirda         b'nin sistemi frontier'da, engel yok (yakında temas beklenir)
//   uzak            b'nin toprağı a'nın bilgisinin dışında; en kısa hat mesafesi (sıçrama) raporlanır
//   kopuk           hat grafiğinde yol yok
// Ayrıca a'nın keşif filolarının durumları (travel/complete/supply/route/threat/pirate) ve keşfedilen (surv) sistem oranı.
const fs=require('fs'),path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
h.sb.SIZE=process.env.CAMP_SIZE||'ulu';h.sb.AIS=+(process.env.CAMP_AI||9);h.sb.TEN=process.env.CAMP_TENSION||null;
const CHECK=(process.env.CHECK||'60,120,240').split(',').map(Number);
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:SIZE,aiCount:AIS});if(TEN)CFG.tension=TEN;setupGame({...CFG});G.autoSave=false;
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}};
function hops(fromSet,toSet){const d=new Map();const q=[];for(const id of fromSet){d.set(id,0);q.push(id);}for(let i=0;i<q.length;i++){const u=q[i];if(toSet.has(u))return d.get(u);for(const v of G.sys[u].lanes)if(!d.has(v)){d.set(v,d.get(u)+1);q.push(v);}}return -1;}
function diag(){const ais=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide);const owned=new Map(ais.map(e=>[e.id,new Set(G.sys.filter(s=>s.owner===e.id).map(s=>s.id))]));
 const rows=[],cls={},per=[];
 for(const a of ais){const ctx=explorationContext(a),sci=G.fleets.filter(f=>f.e===a.id&&scienceExplorer(f)),st={};for(const f of sci){const k=f.explore?f.explore.status:'yok';st[k]=(st[k]||0)+1;}
  const probe=sci[0]||{e:a.id,ships:[{c:'bil'}],sys:a.home,mv:null,path:[]};
  const surv=G.sys.filter(s=>s.surv.includes(a.id)).length/G.sys.length;let cnt=0;
  for(const b of ais){if(a===b)continue;const ob=owned.get(b.id);if(a.contact[b.id]){cnt++;continue;}
   let c;if(!sci.length)c='gemi-yok';
   else if([...ob].some(id=>ctx.visible.has(id)))c='sinir-gorunur';
   else if([...ob].some(id=>ctx.known.has(id)))c='bilinen-sistem';
   else{const fr=[...ob].filter(id=>ctx.frontier.has(id));if(fr.length){const rs=fr.map(id=>explorationBlock(a,probe,id,ctx));c=rs.includes('')?'sinirda':rs.includes('supply')?'ikmal-engeli':'sinir-'+rs[0];}else c='uzak';}
   const hp=hops(owned.get(a.id).size?owned.get(a.id):new Set([a.home]),ob);if(hp<0)c='kopuk';
   cls[c]=(cls[c]||0)+1;rows.push({a:a.id,b:b.id,c,hops:hp});}
  per.push({id:a.id,p:personaKey(a),contacts:cnt,sci:sci.length,status:st,surv:+surv.toFixed(3),sys:owned.get(a.id).size,fed:findFed(a)?findFed(a).id:null});}
 const pairs=ais.length*(ais.length-1),contact=pairs-rows.length;
 const hopHist={};for(const r of rows)if(r.c==='uzak'){const k=r.hops>=8?'8+':String(r.hops);hopHist[k]=(hopHist[k]||0)+1;}
 return {month:Math.floor(G.day/30),pairs,contact,contactShare:+(contact/pairs).toFixed(3),cls,hopHist,per};}
var OUT=[];`);
const t0=Date.now();for(let m=1;m<=+months;m++){h.run('__m()');if(CHECK.includes(m))h.run('OUT.push(diag())');}
const r=JSON.parse(h.run('JSON.stringify(OUT)'));fs.writeFileSync(out,JSON.stringify(r));
for(const x of r)console.log(path.basename(out),'ay',x.month,'temas',x.contact+'/'+x.pairs,'('+x.contactShare+')',JSON.stringify(x.cls),'uzak-sıçrama',JSON.stringify(x.hopHist),'sec',Math.round((Date.now()-t0)/1000));
