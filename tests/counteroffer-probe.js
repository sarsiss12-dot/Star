'use strict';
const path=require('path'),fs=require('fs');const {runtime}=require('./helpers/runtime');
function probe(root=path.resolve(__dirname,'..')){
 const h=runtime({root});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`var P=G.emps[1],T=G.emps[3];
 for(const e of [P,T]){e.dead=false;e.civics=[];e.mizac=e._pers=e.persLock='tuccar';e.ethics={mil:0,aut:0,mat:0,ahl:0};
 e.contact[P.id]=e.contact[T.id]=true;e.rel[P.id]=e.rel[T.id]=40;e.mem={};e.pact={};e.ally={};e.nap={};e.war={};e.techs={};e._prof=null;
 for(const r of ['min','ene','ala','tuk','yiy','etk'])e.res[r]=10000;recalcMods(e);}
 P.res.min=1;P.res.ene=P.res.ala=P.res.tuk=0;
 var list=Object.keys(TECHS).map(id=>({id,value:itemValue(T,{t:'tech',id},P)})).filter(x=>x.value>0).sort((a,b)=>a.value-b.value);
 P.techs=Object.fromEntries(list.map(x=>[x.id,true]));
 var offer={from:P.id,to:T.id,give:[{t:'res',r:'min',v:1}],want:[{t:'res',r:'ene',v:10}]};
 var noResource=aiRespond(T,offer);var noResourceValue=(noResource.add||[]).reduce((s,it)=>s+itemValue(T,it,P),0);P.res.ala=1000;var withResource=aiRespond(T,offer);
 var costly={t:'tech',id:list.at(-1).id};var costlyRecipientValue=itemValue(T,costly,P),costlyOwnerValue=itemValue(P,costly,T);
 var original=aiRespond;aiRespond=()=>({v:'karsi',add:[costly],why:'enjekte edilmiş alıcı talebi'});
 var costlyResult=aiNegotiate(P,T,[{t:'pact'}],[]);aiRespond=original;
 `);
 return h.run(`({noResource:{decision:noResource.v,extra:noResource.add,value:noResourceValue},
 withResource:{decision:withResource.v,extra:withResource.add},costlyOwnerValue,costlyRecipientValue,costlyResult})`);
}
if(require.main===module){const r=probe(path.resolve(process.argv[2]||path.join(__dirname,'..')));const json=JSON.stringify(r,null,2)+'\n';if(process.argv[3])fs.writeFileSync(process.argv[3],json);else console.log(json);}
module.exports={probe};
