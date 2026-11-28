'use strict';

const assert = require('node:assert/strict');

module.exports = async ({test, pg, metrics, wait, tap, settle, cmd}) => {
  const H = pg.H, B = pg.B, C = pg.C;
  const b = await B.evaluate(() => MP1Join.empireId);
  const c = await C.evaluate(() => MP1Join.empireId);
  const rows = metrics.tradeFinal = {};
  const stocks = ids => H.evaluate(ids => ids.map(id => G.emps[id].res.ene), ids);
  const interact = async (page, target, amount, physical=false) => {
    await page.evaluate(({target,amount}) => {
      UI.closeModal();
      const to = typeof MP1Join !== 'undefined' && MP1Join.empireId && target === 0
        ? MP1Join.empireId : target;
      UI.forgetDeal(to);
      UI.openDeal(to);
      UI.deal.give.push({t:'res',r:'ene',v:amount});
      UI.drawDeal();
    },{target,amount});
    if(physical)await tap(page,'[data-a="dealCargoMode"][data-x="on"]');
    await tap(page,'[data-a="dealSend"]');
  };
  const pending = (from,to,amount,type="res") => H.waitForFunction(({from,to,amount,type}) =>
    MP1Host.host.dip.offers.find(o=>o.from===from&&o.to===to&&o.status==='pending'&&
      o.give.some(i=>i.t===type&&i.r==='ene'&&i.v===amount))?.id,
    {from,to,amount,type},{timeout:20000,polling:200}).then(h=>h.jsonValue());
  const accept = async (page,id) => {
    if(page===H){
      await H.evaluate(()=>{UI.closeModal();MP71Dip.sync();});
      await wait(H,id=>G.inbox.some(n=>n.key==='mp71:'+id),id);
      const uid=await H.evaluate(id=>G.inbox.find(n=>n.key==='mp71:'+id).uid,id);
      await tap(H,'[data-a="openNote"][data-x="'+uid+'"]');
    }else{
      await wait(page,id=>{
        MP71Dip.tick();
        return DiplomaticInbox.state().records.some(r=>r.mp===id&&r.status==='pending');
      },id);
      await page.evaluate(id=>ArchiveUI.record(DiplomaticInbox.state().records.find(r=>r.mp===id).id),id);
    }
    await tap(page,'#inboxYes');
    await wait(H,id=>MP1Host.host.dip.offers.some(o=>o.id===id&&o.status==='accepted'),id);
  };
  async function confirm(from,to,send,receive,amount,label,outsider){
    const before=await stocks([from,to]);
    await interact(send,to,amount);
    const id=await pending(from,to,amount);
    const unauthorized = outsider ? await cmd(outsider,{kind:'respond',offer:id,action:'accept'}) : null;
    if(unauthorized)assert.notEqual(unauthorized.status,'ok','Teklifin alıcısı olmayan misafir onaylayamaz');
    assert.deepEqual(await stocks([from,to]),before,'Onay öncesi hareket yok');
    await accept(receive,id);
    await settle(label);
    const after=await stocks([from,to]);
    assert.deepEqual(after,[before[0]-amount,before[1]+amount]);
    rows[label]={from,to,id,amount,before,after,unauthorized};
  }
  await test('A5 host → B kaynak teklifi, B karttan kabul, tek aktarım',async()=>{
    await confirm(0,b,H,B,23,'host-b','C');
  });
  await test('A6 B → C kaynak teklifi, C karttan kabul, tek aktarım',async()=>{
    await confirm(b,c,B,C,31,'b-c');
  });
  await test('A7 insan ↔ AI, AI kaynağı karttan kabul edilince aktarılır',async()=>{
    const x=await H.evaluate(()=>{
      const e=G.emps.find(e=>e.id>2&&e.ai&&!e.dead&&!e.wild&&!e.crisisSide);
      if(!e)throw Error('AI bulunamadı');
      G.p.contact[e.id]=e.contact[0]=true;
      G.p.war[e.id]=e.war[0]=false;
      G.p.rel[e.id]=e.rel[0]=90;
      e.res.ene=500;
      MP1Host.host.publish();
      return e.id;
    });
    const before=await stocks([0,x]);
    await interact(H,x,20);
    await wait(H,({x,before})=>G.p.res.ene===before[0]-20&&G.emps[x].res.ene===before[1]+20,{x,before});
    const accepted=await stocks([0,x]);
    const rec=await H.evaluate(x=>{
      if(!UI.aiOffer({from:x,to:0,give:[{t:'res',r:'ene',v:17}],want:[]}))throw Error('AI kartı gönderilemedi');
      return G.inbox.find(n=>n.kind==='aideal'&&n.data?.from===x&&n.data?.give?.some(i=>i.r==='ene'&&i.v===17))?.uid;
    },x);
    assert(rec,'AI teklif kartı');
    assert.deepEqual(await stocks([0,x]),accepted,'AI imza öncesi kaynak uygulamadı');
    await tap(H,'[data-a="openNote"][data-x="'+rec+'"]');
    await tap(H,'#inboxYes');
    await wait(H,({x,accepted})=>G.p.res.ene===accepted[0]+17&&G.emps[x].res.ene===accepted[1]-17,{x,accepted});
    rows['ai-host']={x,before,accepted,after:await stocks([0,x])};
  });
  if(process.env.MP8_TRADE_FLEET==='1')await test('A8 yük, filo emri ve ayna aynı galaksi ilerlemesinde',async()=>{
    await H.evaluate(b=>{
      const book=window.tradeFleetBook=[];
      const dispatch=Commerce.dispatch, finish=Commerce.finish;
      Commerce.dispatch=function(contract){
        const balance=G.emps[b].res.ene;
        const done=dispatch.call(this,contract);
        if(done&&contract.legs.some(l=>l.e===b&&l.to===0&&l.r==='ene')){
          book.push({kind:'load',day:G.day,amount:balance-G.emps[b].res.ene});
        }
        return done;
      };
      Commerce.finish=function(v,state,reason){
        const balance=G.p.res.ene;
        const done=finish.call(this,v,state,reason);
        if(done&&v.e===b&&v.to===0&&v.r==='ene'){
          book.push({kind:state,day:G.day,amount:G.p.res.ene-balance,receipt:v.receipt});
        }
        return done;
      };
    },b);
    await interact(B,0,12,true);
    const id=await pending(b,0,12,'cargo');
    await accept(H,id);
    const fleet=await B.evaluate(()=>{
      const f=G.fleets.find(f=>f.e===0&&f.sys>=0&&!f.mv&&f.ships.length&&G.sys[f.sys].lanes.length);
      return f?{id:f.id,from:f.sys,to:G.sys[f.sys].lanes[0]}:null;
    });
    assert(fleet,'Misafir başlangıç filosu');
    const move=await cmd('B',{kind:'move',fleet:fleet.id,to:fleet.to});
    assert.equal(move.status,'ok',JSON.stringify(move));
    const start=await H.evaluate(()=>G.day);
    let moving=null, delivered=null;
    for(let i=0;i<60&&!delivered;i++){
      await H.evaluate(()=>MP1Host.advance(1));
      const sample=await H.evaluate(({b,fleet})=>{
        const ship=G.fleets.find(f=>f.id===fleet.id);
        const v=G.commerce.convoys.find(v=>v.e===b&&v.to===0&&v.r==='ene');
        return {day:G.day,shipMoved:!!ship&&(!!ship.mv||ship.sys!==fleet.from),cargo:v&&{id:v.id,state:v.status,delivered:v.delivered}};
      },{b,fleet});
      if(sample.cargo&&sample.cargo.state==='moving'&&sample.shipMoved)moving=sample;
      if(sample.cargo?.state==='delivered')delivered=sample;
    }
    assert(moving,'Yoldaki yükle aynı ilerlemede filo hareketi');
    assert(delivered&&delivered.day>start);
    await H.evaluate(()=>MP1Host.advance(5));
    const book=await H.evaluate(()=>tradeFleetBook);
    assert.deepEqual(book.map(x=>[x.kind,x.amount]),[['load',12],['delivered',12]]);
    assert.equal(book[1].receipt,delivered.cargo.id);
    await settle('ticaret-ve-filo');
    await wait(B,id=>G.commerce.convoys.some(v=>v.id===id&&v.status==='delivered'),delivered.cargo.id);
    assert.equal(await C.evaluate(id=>G.commerce?.convoys.some(v=>v.id===id)||false,delivered.cargo.id),false);
    rows['fleet-active']={start,book,move,moving,delivered};
  });
};
