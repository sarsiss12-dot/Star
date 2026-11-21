'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{runtime}=require('../../tests/helpers/runtime');
const file=path.join(process.env.STARS_WORK||'/tmp/stars-pressure','medium-99/48.save');
const h=runtime({processGlobal:true});h.sb.input=fs.readFileSync(file,'utf8');
h.run(fs.readFileSync(path.resolve(__dirname,'../mp0/mp-core.js'),'utf8'));
h.run("deserialize(input);const auditHost=StarsMP.createHost({roomId:'research',send(){},random:()=> 'x'});auditHost.installGuards()");
const after=h.run('serialize()'),before=h.sb.input,counts={},examples=[];
function diff(a,b,k){
  if(a===b)return;
  if(a&&b&&typeof a==='object'&&typeof b==='object'){
    for(const field of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[field],b[field],k+'.'+field);
    return;
  }
  const norm=k.replace(/\.\d+(?=\.|$)/g,'.*');
  counts[norm]=(counts[norm]||0)+1;
  if(examples.length<20)examples.push(k);
}
diff(JSON.parse(before),JSON.parse(after),'save');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
fs.writeFileSync(path.join(__dirname,'raw','reload-diff.json'),JSON.stringify({before:sha(before),after:sha(after),counts,examples},null,2)+'\n');
