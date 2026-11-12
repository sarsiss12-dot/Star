const path=require('path'),fs=require('fs');
const root=path.resolve(process.argv[2]),file=process.argv[3];
const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const h=runtime({root});h.sb.__s=fs.readFileSync(file,'utf8');
let r;try{r=h.run('(()=>{try{const r=deserialize(__s);return JSON.stringify({r,err:typeof UI!=="undefined"&&UI.loadError||null,day:typeof G!=="undefined"&&G?G.day:null,sys:G&&G.sys&&G.sys.length,emps:G&&G.emps&&G.emps.length});}catch(e){return "THROW "+e.stack}})()');}catch(e){r='OUTER '+e.stack;}
console.log(String(r).slice(0,3000));
