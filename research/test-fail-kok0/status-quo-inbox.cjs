'use strict';

const assert=require('node:assert/strict');
const {world}=require('../../tests/helpers/95e-fixture');

function pending(){
  const h=world();
  h.run(`var A=G.p,B=G.emps[1];A.war[1]=B.war[0]=true;warLedgerOpen(0,1);A.exh={1:99};B.exh={0:99};
    UI.notify({kind:'sqOffer',data:1,key:'sq:1',title:'Statüko barışı'});
    var r=DiplomaticInbox.state().records.find(x=>x.kind==='sqOffer'),id=r.id,raw=serialize();`);
  assert(h.run('deserialize(raw)'));
  h.run(`A=G.p;B=G.emps[1];ArchiveUI.act('diplomaticRecord',String(id));
    var calls=0,actual=statusQuoPeace;statusQuoPeace=function(...args){calls++;return actual(...args);};
    var economy=()=>JSON.stringify([A.res,B.res,G.sys.map(s=>[s.owner,s.planets.map(p=>p.owner)])]),before=economy(),rng=RND_STATE;`);
  assert(h.run('document.getElementById("modal").innerHTML.includes(\'data-a="inboxYes"\')'));
  return h;
}

const accepted=pending();
accepted.run('var twice=UI._hooks.inboxYes;twice();twice();');
assert.equal(accepted.run('calls'),1);
assert(accepted.run('!A.war[1]&&!B.war[0]&&DiplomaticInbox.get(id).status==="accepted"'));

const rejected=pending();
rejected.run('var twice=UI._hooks.inboxNo;twice();twice();');
assert.equal(rejected.run('calls'),0);
assert(rejected.run('A.war[1]&&B.war[0]&&DiplomaticInbox.get(id).status==="rejected"&&before===economy()&&rng===RND_STATE'));

const stale=pending();
stale.run('G.day=DiplomaticInbox.get(id).expires;var beforeWar=!!A.war[1];UI._hooks.inboxYes();');
assert.equal(stale.run('calls'),0);
assert(stale.run('beforeWar&&A.war[1]'));

console.log(JSON.stringify({savedPendingReopened:true,acceptedCalls:1,rejectedCalls:0,expiredCalls:0,
  rejectionEconomyUnchanged:true,rejectionRngUnchanged:true},null,2));
