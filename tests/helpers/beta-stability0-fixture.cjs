'use strict';
exports.prepare=function(actor=1){
 G.autoSave=false;const e=G.emps[actor],s=G.sys[e.home];s.planets.find(p=>p.col).col.b.tersane=1;
 e.res.ala=e.res.min=e.res.ene=e.res.etk=100000;
 const a=newFleet(e,s.id,[{c:'kor',h:1}],'Kurtarma Ana'),b=newFleet(e,s.id,[{c:'kor',h:1}],'Kurtarma Hedef');
 if(!queueFleetShip(e,s,'kor',a)||!queueFleetShip(e,s,'kor',a))throw Error('real paid queue failed');
 const qs=s.queue.filter(q=>q.delivery?.fleet===a.id);if(qs.length!==2)throw Error('two paid jobs');
 for(let i=0;i<27;i++){const f=newFleet(e,s.id,[{c:'kru',h:1}],'Gerçek Mevcut Takviye '+i);f.shipment={fleet:a.id,state:'ready',attempts:0,next:0};f.joinFleet=a.id;}
 // Controlled real combat terminal path. Do not resurrect the target.
 applyDamage(e,[a],100000,G.emps[actor===0?1:0]);stepFleets(.001);
 return {actor,sys:s.id,lost:a.id,target:b.id,paid:qs.map(q=>({...q.paid})),orderCount:2,shipCount:27};
};
