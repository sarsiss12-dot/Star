const path=require('path'),fs=require('fs'),{performance}=require('perf_hooks');
const {runtime}=require('/home/user/Star/tests/helpers/runtime');const h=runtime({root:'/home/user/Star'});h.sb.performance=performance;h.sb.__save=fs.readFileSync(process.argv[2],'utf8');h.run('deserialize(__save)');
h.run(`function txCaptureGraph2(values, opaque){
  const seen = new Set(), records = [], pending = values.slice();
  const enqueue = value => { if (value && typeof value === 'object') pending.push(value); };
  while (pending.length){
    const obj = pending.pop();
    if (!obj || typeof obj !== 'object' || seen.has(obj) || (opaque && opaque.has(obj))) continue;
    seen.add(obj);
    const keys = Reflect.ownKeys(obj), props = [];
    const rec = {obj, keys, props, proto:Object.getPrototypeOf(obj)};
    if (obj instanceof Map){
      rec.map = Array.from(obj.entries());
      for (const [k,v] of rec.map){ enqueue(k); enqueue(v); }
    } else if (obj instanceof Set){
      rec.set = Array.from(obj.values()); for (const v of rec.set) enqueue(v);
    } else if (obj instanceof Date) rec.date = obj.getTime();
    else if (obj instanceof ArrayBuffer) rec.bytes = new Uint8Array(obj).slice();
    else if (ArrayBuffer.isView(obj)) enqueue(obj.buffer);
    else if (obj instanceof WeakMap || obj instanceof WeakSet)
      throw new Error('x');
    const all = Object.getOwnPropertyDescriptors(obj);
    for (const k of keys){
      const d = all[k]; props.push(d);
      if ('value' in d) enqueue(d.value);
    }
    records.push(rec);
  }
  return records;
}
function __vals(){const v=[];for(const key of DEAL_TX_ROOTS){const d=Object.getOwnPropertyDescriptor(G,key);if(d&&'value' in d)v.push(d.value);}return v;}
function __same(a,b){if(a.length!==b.length)return 'len';for(let i=0;i<a.length;i++){const x=a[i],y=b[i];if(x.obj!==y.obj||x.keys.length!==y.keys.length||x.proto!==y.proto)return 'rec'+i;for(let j=0;j<x.keys.length;j++){if(x.keys[j]!==y.keys[j])return 'key';const p=x.props[j],q=y.props[j];for(const f of ['value','get','set','writable','enumerable','configurable'])if(!Object.is(p[f],q[f])||(f in p)!==(f in q))return 'desc';}}return 'same';}`);
console.log(h.run('__same(txCaptureGraph(__vals()),txCaptureGraph2(__vals()))'),h.run('txCaptureGraph(__vals()).length'));
for(const n of ['txCaptureGraph','txCaptureGraph2','txCaptureGraph','txCaptureGraph2']){const t=performance.now();h.run(`for(let i=0;i<10;i++)${n}(__vals())`);console.log(n,((performance.now()-t)/10).toFixed(1),'ms');}
