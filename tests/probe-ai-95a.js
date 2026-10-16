'use strict';
const {fresh}=require('./helpers/dispatch-fixture'),path=require('path');
const root=path.resolve(process.argv[2]||'.'),h=fresh(1,root);
h.run(`G.feds=[];G.council=null;G.fleets=[];E.contact[O.id]=true;E.intel={};E.war[O.id]=O.war[E.id]=true;G.sys[40].seen=[];G.sys[40].surv=[];
 var foe=newFleet(O,40,[{c:'kor'}]);var low=warAppetite(E,O).ratio;var t1=threatAt(E,40);for(var i=0;i<20;i++)foe.ships.push({c:'zir',h:1});O._powAt=-1;var high=warAppetite(E,O).ratio,t2=threatAt(E,40);
 var sy=G.sys[0];sy.owner=E.id;sy.built={};sy.work=[];E.res.min=E.res.ene=E.res.ala=10000;var f=newFleet(E,0,[{c:'ins'}]);var first=startStruct(E,sy,'bilim_ist',f),again=startStruct(E,sy,'bilim_ist',f);`);
console.log(JSON.stringify({root,hiddenFleetMutation:JSON.parse(h.run('JSON.stringify({ratioBefore:low,ratioAfter:high,threatBefore:t1,threatAfter:t2})')),sameBuilderSameJob:JSON.parse(h.run('JSON.stringify({first,again,pending:sy.work.length})'))},null,2));
