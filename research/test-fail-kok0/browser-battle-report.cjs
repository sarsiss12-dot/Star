'use strict';

const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
const {fresh}=require('../../tests/helpers/combat-feedback-fixture');
const [control,candidate]=process.argv.slice(2).map(x=>path.resolve(x));
if(!control||!candidate)throw Error('Kullanım: browser-battle-report.cjs KONTROL ADAY');

function fixture(root){
  const h=fresh(root,['muh'],['kor']);
  h.run('S.seen=[0];S.surv=[0];S.cr=1;SHIPS.muh.dmg=100000;combatTick(.1)');
  assert(h.run('battleReportViewKey(S)'));
  return {raw:h.run('serialize()'),id:h.run('S.id')};
}

async function verify(browser,root,input){
  const relay=require(path.join(root,'research/mp1/server/relay.js')).create({MP1_PORT:'0'});
  const server=await relay.start();
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    const before=await page.evaluate(({raw,id})=>{
      if(!deserialize(raw))throw Error('Muharebe kaydı yüklenemedi');
      G.autoSave=false;$('title').classList.add('hidden');enterGame(true);LOOP.on=false;UI.setSpeed(0);UI.closeModal();
      View.selSys=G.sys[id];UI.tab('sistem');UI.refresh();
      window.dismissInput={id,key:battleReportViewKey(G.sys[id])};
      return {report:JSON.stringify(G.sys[id].battleReport),fleet:JSON.stringify(G.fleets),rng:RND_STATE};
    },input);
    const close=page.locator('[data-a="dismissBattleReport"]').first();
    const key=await close.getAttribute('data-report');
    assert.equal(key,await page.evaluate(()=>dismissInput.key));
    await close.tap();
    const after=await page.evaluate(()=>{
      const {id,key}=dismissInput;
      const report=JSON.stringify(G.sys[id].battleReport),fleet=JSON.stringify(G.fleets),rng=RND_STATE;
      const hidden=G.dismissedBattleReports[id]===key;
      if(!deserialize(serialize()))throw Error('Dokunma sonrası kayıt yüklenemedi');
      return {hidden,retained:G.dismissedBattleReports[id]===key,report,fleet,rng};
    });
    assert.deepEqual({report:after.report,fleet:after.fleet,rng:after.rng},before);
    assert.deepEqual(errors,[]);
    return {key,hidden:after.hidden,retained:after.retained,unchangedResult:true,unchangedFleets:true,unchangedRng:true};
  }finally{await context.close();relay.shutdown('test');}
}

(async()=>{
  const input=fixture(control);
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const p57=await verify(browser,control,input),fixed=await verify(browser,candidate,input);
    console.log(JSON.stringify({p57,fixed},null,2));
    assert.deepEqual([p57.hidden,p57.retained,fixed.hidden,fixed.retained],[false,false,true,true]);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
