'use strict';
const path=require('path'),fs=require('fs');const [rootArg,file]=process.argv.slice(2),root=path.resolve(rootArg);
const {runtime}=require(path.join(root,'tests/helpers/runtime'));const h=runtime({root});
h.run(fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8'));h.run(fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'));
h.sb.__t=fs.readFileSync(file,'utf8');
console.log(h.run(`JSON.stringify((()=>{const v=StarsMP.validatePackage(__t);const q=typeof inspectSaveText==='function'?inspectSaveText(__t):null;return {validatePackage:v.ok?'ok':v.why,detail:v.detail||null,inspectSaveText:q&&{ok:q.ok,year:q.year,name:q.name},probe:StarsMP.probeSaveText?StarsMP.probeSaveText(__t):undefined};})())`));
