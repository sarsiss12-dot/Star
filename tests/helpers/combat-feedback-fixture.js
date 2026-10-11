'use strict';
const path=require('path');
const {runtime}=require('./runtime');
function fresh(root=path.resolve(__dirname,'../..'), aShips=['kor','kor','kor'], bShips=['kor','kor','kor']){
  const h=runtime({root});
  h.loadSave(path.join(__dirname,'../fixtures/stars-2210-06.sav.json'));
  h.sb.__a=aShips;h.sb.__b=bShips;
  h.run(`
    G.fleets=[];G.log=[];G.inbox=[];G.p=G.emps[0];
    var E=G.emps[0],O=G.emps[1],S=G.sys[0];
    for(const e of G.emps){e.dead=false;e.wild=false;e.crisisSide=false;e.war={};e.ally={};e.civics=[];delete e._salvage;recalcMods(e);}
    E.war[O.id]=true;O.war[E.id]=true;
    for(const s of G.sys){s.owner=-1;s.built={};s.def=0;s.cr=0;delete s.battleReport;
      for(const p of s.planets){p.col=null;p.owner=-1;p.shield=0;}}
    S.lanes=[1];G.sys[1].lanes=[0];G.sys[1].owner=E.id;
    var A=newFleet(E,S.id,__a.map(c=>({c})), 'Oyuncu Filosu');
    var B=newFleet(O,S.id,__b.map(c=>({c})), 'Düşman Filosu');
    delete __a;delete __b;
  `);
  return h;
}
module.exports={fresh};
