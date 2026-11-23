const fs=require('fs'),path=require('path');const {runtime}=require(require('path').resolve(__dirname,'../../tests/helpers/runtime'));
for(const root of process.argv.slice(3)){const h=runtime({root:path.resolve(root)});h.sb.S=fs.readFileSync(process.argv[2],'utf8');
 console.log(path.basename(root),h.run(`(()=>{deserialize(S);G.autoSave=false;const C={alt:0,altOk:0,terms:0,ports:0,alts:0,quote:0};
  const w=(k,f)=>{const o=Commerce[k];if(!o)return;Commerce[k]=function(){const r=o.apply(this,arguments);f(r);return r;};};
  w('aiAltPorts',r=>{C.alt++;if(r)C.altOk++;});w('aiTerms',()=>C.terms++);w('aiPorts',r=>{C.ports++;if(r?.alts)C.alts+=r.alts.length;});
  const dq=dealQuote;dealQuote=function(){C.quote++;return dq.apply(this,arguments);};
  const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}
  return JSON.stringify(C);})()`));}
