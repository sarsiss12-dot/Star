const fs=require('fs'),path=require('path'),{performance}=require('perf_hooks'),{P,make,cfg}=require('./host'),records=JSON.parse(fs.readFileSync(path.join(P,'evidence/SHIP-FIXTURES.json'))).filter(x=>x.id===1),rows=[];
for(const f of records)for(const version of ['control','candidate']){
 const raw=fs.readFileSync(f.file,'utf8'),values=[],heap=[];
 for(let n=0;n<7;n++){global.gc?.();const h=make(version,cfg(f.seed),raw);h.sb.id7=f.id;h.run('var e7=G.emps[id7]');const before=process.memoryUsage().heapUsed,t=performance.now();h.run('aiTurn(e7)');values.push(performance.now()-t);heap.push(process.memoryUsage().heapUsed-before);}
 values.sort((a,b)=>a-b);heap.sort((a,b)=>a-b);rows.push({seed:f.seed,version,n:7,medianMs:values[3],maxMs:values[6],medianHeapDeltaBytes:heap[3],maxHeapDeltaBytes:heap[6],context:'Node VM, one real AI turn from same live-entry Save; excludes VM/setup; GC before each; not physical mobile benchmark'});
}
fs.writeFileSync(path.join(P,'evidence/PERFORMANCE.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
