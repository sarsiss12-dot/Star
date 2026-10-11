'use strict';
// Characterization only: these observations document unresolved behavior, not acceptance criteria.
const {fresh}=require('./helpers/dispatch-fixture');
const out={};
{
 const h=fresh();h.run(`G.sys[1].built.tersane=1;setRally(E,G.sys[1],4);
 View.rallyFor=A.id;View.rowHits=[];View.route=false;View._lastTap=-9999;
 View.cam={x:G.sys[5].x,y:G.sys[5].y,z:1};View.tap(View.w2s(G.sys[5].x,G.sys[5].y));
 var nf=newFleet(E,1,[{c:'kor'}]);var dispatched=dispatchBuiltFleet(E,nf,G.sys[1].rally[0]);`);
 out.fleetRally={chosen:h.run('A.rallyAt'),overwrittenYard:h.run('JSON.stringify(G.sys[1].rally[0])'),mainFleetAt:h.run('A.sys'),actualDestination:h.run('nf.path[nf.path.length-1]'),status:h.run('dispatched')};
}
{
 const h=fresh();h.run(`var nf=newFleet(E,1,[{c:'kor'}]);nf.joinFleet=A.id;G.sys[1].lanes=[];G.sys[2].lanes=[];followRallyFleet(nf)`);
 out.blockedDelivery={targetRetained:h.run('nf.joinFleet!==undefined'),shipsPreserved:h.run('nf.ships.length'),message:h.run('G.log.slice(-1)[0].m')};
}
{
 const h=fresh();h.run(`A.capTarget=3;reinforceFleet(E,A);var pending=pendingFleetShips(E,A);`);
 out.pending={actualShips:h.run('A.ships.length'),queued:h.run('pending'),uiMissingFormula:h.run('A.capTarget-A.ships.length'),engineMissing:h.run('A.capTarget-A.ships.length-pendingFleetShips(E,A)')};
}
{
 const h=fresh();h.run(`A.ships=[{c:'muh'},{c:'muh'},{c:'kor'}];A.capTarget=4;delete E.techs.m_muhrip;var r=reinforceFleet(E,A)`);
 out.lockedClass={ok:h.run('r.ok'),reason:h.run('r.why'),queue:h.run('Y.queue.length'),stock:h.run('E.res.ala')};
}
console.log(JSON.stringify(out,null,2));
