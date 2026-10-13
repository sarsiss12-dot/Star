'use strict';
const fs=require('fs'),path=require('path');const {fresh}=require('./helpers/dispatch-fixture');
function probe(root,seed){
 const h=fresh(1,path.resolve(root));h.sb.probeSeed=seed;
 h.run(`for(const c of ['kol','kol','kol','kol','bil','bil','ord','ord','ord','ord','ord','ord'])newFleet(E,0,[{c}]);
 // The geometry fixture keeps old save income; give this production opportunity
 // an explicit sustainable economy so it tests dispatch, not the deficit gate.
 E.inc.ene=1000;E.inc.ala=100;E.crisis=false;
 delete E.techs.m_yildiz;E.ai=true;rndSeed(probeSeed);
 var before=JSON.parse(JSON.stringify(E.res));aiTurn(E);
 var spent={};for(const r in E.res)spent[r]=before[r]-E.res[r];`);
 return JSON.parse(h.run('JSON.stringify({seed:probeSeed,queued:Y.queue.length,classes:Y.queue.map(q=>q.cls),targeted:Y.queue.filter(q=>q.delivery&&q.delivery.fleet!==undefined).length,spent,rng:RND_STATE})'));
}
module.exports={probe};
if(require.main===module){
 const data={method:'Three independent prepared-world aiTurn production opportunities; civilian needs met, normal military production gate used. No campaign or extra tick. Full-turn resource delta and final RNG compared.',runs:[11,99,404].map(s=>probe(process.argv[2]||path.join(__dirname,'..'),s))};
 const txt=JSON.stringify(data,null,2)+'\n';if(process.argv[3])fs.writeFileSync(process.argv[3],txt);else console.log(txt);
}
