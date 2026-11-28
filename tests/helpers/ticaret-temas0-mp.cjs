'use strict';

const assert=require('node:assert/strict');

module.exports=async ({test,pg,metrics,wait,tap,settle,cmd})=>{
  const H=pg.H,B=pg.B;
  const b=await B.evaluate(()=>MP1Join.empireId);
  const c=await pg.C.evaluate(()=>MP1Join.empireId);
  const probe=metrics.contactSensors={};
  await test('CT1 AI sensör teklifi misafirin gerçek onayını bekler',async()=>{
    probe.fixture=await H.evaluate(({b,c})=>{
      const a=G.emps.find(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide&&!isPurifier(e));
      const guest=G.emps[b],outsider=G.emps[c];
      if(!a||!guest||!outsider)throw Error('Üç taraf gerekli');
      const system=G.sys.find(s=>s.owner<0&&!humanVisionContext(guest).visible.has(s.id)&&
        !humanVisionContext(outsider).visible.has(s.id));
      if(!system)throw Error('Yeni gözlem alanı gerekli');
      for(const e of G.emps)if(e.ai)e._pactCd=(G.memAge||0)+120;
      a._pactCd=0;
      a.contact={[b]:true};guest.contact[a.id]=true;
      a.rel[b]=guest.rel[a.id]=65;
      a.ally[b]=guest.ally[a.id]=false;
      if(a.visionFrom)delete a.visionFrom[b];
      if(guest.visionFrom)delete guest.visionFrom[a.id];
      if(a.shareVis)delete a.shareVis[b];
      if(guest.shareVis)delete guest.shareVis[a.id];
      a.war[b]=guest.war[a.id]=false;
      a.res.etk=1000;guest.res.etk=1000;
      newFleet(a,system.id,[{c:'bil'}],'Sensör kabulü');
      aiIntelPactTick();
      MP1Host.host.publish();
      const offer=MP1Host.host.dip.offers.find(o=>o.from===a.id&&o.to===b&&o.status==='pending'&&o.want.some(i=>i.t==='intel'));
      return {id:offer?.id,a:a.id,system:system.id};
    },{b,c});
    assert(probe.fixture.id,'AI teklifi bekliyor');
    await settle('temas-onay-once');
    const actual=await H.evaluate(({a,system,b,c})=>{
      return {has:!!G.emps[b].visionFrom?.[a],etk:G.emps[a].res.etk,
        bVisible:StarsMirror.build(b).mpVisible.includes(system),
        cVisible:StarsMirror.build(c).mpVisible.includes(system)};
    },{...probe.fixture,b,c});
    assert.deepEqual(actual,{has:false,etk:1000,bVisible:false,cVisible:false});
    const wrong=await cmd('C',{kind:'respond',offer:probe.fixture.id,action:'accept'});
    assert.notEqual(wrong.status,'ok');
    probe.before=actual;
  });
  await test('CT2 Misafir kabulü iki yönü ve yalnız yetkili görüşü açar',async()=>{
    const {id,a,system}=probe.fixture;
    await wait(B,id=>{
      MP71Dip.tick();
      return DiplomaticInbox.state().records.some(r=>r.mp===id&&r.status==='pending');
    },id);
    await B.evaluate(id=>ArchiveUI.record(DiplomaticInbox.state().records.find(r=>r.mp===id).id),id);
    await tap(B,'#inboxYes');
    await wait(H,id=>MP1Host.host.dip.offers.some(o=>o.id===id&&o.status==='accepted'),id);
    await settle('temas-onay-sonra');
    const after=await H.evaluate(({a,b,c,system})=>{
      return {received:!!G.emps[b].visionFrom?.[a],given:!!G.emps[a].visionFrom?.[b],
        etk:G.emps[a].res.etk,bVisible:StarsMirror.build(b).mpVisible.includes(system),
        cVisible:StarsMirror.build(c).mpVisible.includes(system)};
    },{a,b,c,system});
    assert.deepEqual(after,{received:true,given:true,etk:955,bVisible:true,cVisible:false});
    assert.equal(await B.evaluate(system=>pVis(G.sys[system]),system),true);
    const repeat=await cmd('B',{kind:'respond',offer:id,action:'accept'});
    assert.notEqual(repeat.status,'ok');
    assert.equal(await H.evaluate(a=>G.emps[a].res.etk,a),955);
    probe.after=after;
  });
};
