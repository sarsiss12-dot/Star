'use strict';
/* MP.6.4 — geç oyun AI maliyetinin hangi işlevlerde toplandığı (yalnız tanı). Aynı tohum (ulu, 11 AI, seed 22), sensör paylaşımı
   kapalı; 180. aya kadar simülasyon, sonra 6 ay V8 CPU profili (node:inspector). Çıktı: kendi süresine göre en ağır işlevler.
   Kullanım: node research/mp64/perf/profile-ai.cjs [months=180] [profileMonths=6] > out.json */
const path=require('path'),fs=require('fs'),inspector=require('inspector'),{performance}=require('perf_hooks');
const root=path.resolve(__dirname,'../../..');const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const [months='180',pm='6']=process.argv.slice(2);
const h=runtime({root});h.sb.performance=performance;
h.run(`setupGame({...CFG,size:'ulu',aiCount:11,seed:22});G.autoSave=false;
  function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();break;}}}`);
for(let m=0;m<+months;m++)h.run('__step()');
const s=new inspector.Session();s.connect();
const post=(m,p)=>new Promise((res,rej)=>s.post(m,p||{},(e,r)=>e?rej(e):res(r)));
(async()=>{await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:200});await post('Profiler.start');
  const t0=performance.now();for(let m=0;m<+pm;m++)h.run('__step()');const wall=performance.now()-t0;
  const {profile}=await post('Profiler.stop');
  const dt=profile.timeDeltas,byNode=new Map();profile.samples.forEach((id,i)=>byNode.set(id,(byNode.get(id)||0)+(dt[i]||0)));
  const self=new Map(),total=new Map(),parent=new Map();for(const n of profile.nodes)for(const c of n.children||[])parent.set(c,n.id);
  const node=new Map(profile.nodes.map(n=>[n.id,n]));const key=n=>(n.callFrame.functionName||'(anon)')+' '+path.basename(n.callFrame.url||'')+':'+(n.callFrame.lineNumber+1);
  for(const [id,us] of byNode){const n=node.get(id);self.set(key(n),(self.get(key(n))||0)+us);const seen=new Set();for(let x=id;x!==undefined;x=parent.get(x)){const k=key(node.get(x));if(seen.has(k))continue;seen.add(k);total.set(k,(total.get(k)||0)+us);}}
  const top=(m,n)=>[...m].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,us])=>({fn:k,ms:+(us/1000).toFixed(1),pct:+(us/1000/wall*100).toFixed(1)}));
  process.stdout.write(JSON.stringify({months:+months,profileMonths:+pm,wallMs:+wall.toFixed(0),msPerMonth:+(wall/+pm).toFixed(0),
    state:JSON.parse(h.run('JSON.stringify({alive:G.emps.filter(e=>!e.dead&&!e.wild).length,fleets:G.fleets.filter(f=>f.ships.length).length,ships:G.fleets.reduce((n,f)=>n+f.ships.length,0),wars:G.emps.reduce((n,e)=>n+Object.values(e.war||{}).filter(Boolean).length,0)/2,fronts:(G.warLedger&&G.warLedger.fronts||[]).length})')),
    topSelf:top(self,25),topTotal:top(total,30).filter(x=>!/\(root\)|\(program\)|runInContext|^\(anon\) :0/.test(x.fn))},null,1)+'\n');
  s.disconnect();})();
