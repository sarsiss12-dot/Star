'use strict';
const {runtime}=require('../../tests/helpers/runtime'),fs=require('node:fs'),path=require('node:path');
const h=runtime();
h.run(fs.readFileSync(path.resolve(__dirname,'../../research/mp0/mp-core.js'),'utf8'));
h.sb.rand=n=>'ab'.repeat(n);
const results=JSON.parse(h.run(`JSON.stringify((()=>{
 const host=StarsMP.createHost({roomId:'test',random:rand,send(){},kick(){},lobby:{mode:'design',generate(s){setupGame({...CFG,...s});return {ok:true};}}});
 const settings={size:setupSizeKey(100),aiCount:9,seed:11},natural=host.configure(settings);
 const medium=host.configure({...settings,aiRivals:rivalPreset('orta',9)});
 const storm=host.configure({...settings,tension:'calkantili'});
 return {natural,medium,storm,final:host.lobbyView().settings};
})())`));
fs.writeFileSync(path.join(__dirname,'raw','mp-current.json'),JSON.stringify(results,null,1));
