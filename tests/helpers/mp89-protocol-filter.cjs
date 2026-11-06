'use strict';
// Optional DEBUG=pw:protocol capture: persist only touch-command metadata/responses. Drop other protocol payloads.
const fs=require('fs'),path=require('path');const target=process.env.MP89_PROTOCOL;
if(!target)throw Error('MP89_PROTOCOL output required');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,'');
const original=process.stderr.write.bind(process.stderr),pending=new Map();
process.stderr.write=function(chunk,...args){const s=String(chunk);if(!s.includes('pw:protocol'))return original(chunk,...args);
 for(const line of s.split('\n')){const start=line.indexOf('{');if(start<0)continue;const clean=line.slice(start).replace(/\x1b\[[0-9;]*m/g,'').trim();let m;try{m=JSON.parse(clean);}catch{continue;}
  const key=m.sessionId+':'+m.id;
  if(m.method==='Input.dispatchTouchEvent'){pending.set(key,m.method);fs.appendFileSync(target,JSON.stringify({at:Date.now(),direction:'send',id:m.id,session:m.sessionId,type:m.params?.type,points:m.params?.touchPoints})+'\n');}
  else if(pending.has(key)){pending.delete(key);fs.appendFileSync(target,JSON.stringify({at:Date.now(),direction:'response',id:m.id,session:m.sessionId,error:m.error||null})+'\n');}
 }
 const cb=args.find(x=>typeof x==='function');if(cb)cb();return true;
};
