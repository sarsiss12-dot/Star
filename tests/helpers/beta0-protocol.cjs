'use strict';
const fs=require('fs'),file=process.env.BETA0_PROTOCOL,pending=new Map(),original=process.stderr.write.bind(process.stderr);if(!file)throw Error('BETA0_PROTOCOL required');
process.stderr.write=function(chunk,...args){const s=String(chunk);if(!s.includes('pw:protocol'))return original(chunk,...args);for(const line of s.split('\n')){const at=line.indexOf('{');if(at<0)continue;let m;try{m=JSON.parse(line.slice(at).replace(/\x1b\[[0-9;]*m/g,'').trim())}catch{continue}const key=m.sessionId+':'+m.id;
 if(m.method&&/^(Input\.|Runtime\.|DOM\.|Page\.)/.test(m.method)){pending.set(key,m.method);const v={at:Date.now(),direction:'send',id:m.id,session:m.sessionId,method:m.method};if(m.method.startsWith('Input.'))Object.assign(v,{type:m.params?.type,x:m.params?.x,y:m.params?.y,button:m.params?.button});fs.appendFileSync(file,JSON.stringify(v)+'\n');}
 else if(pending.has(key)){const method=pending.get(key);pending.delete(key);fs.appendFileSync(file,JSON.stringify({at:Date.now(),direction:'response',id:m.id,session:m.sessionId,method,error:m.error||null})+'\n');}
 }const cb=args.find(v=>typeof v==='function');if(cb)cb();return true;};
