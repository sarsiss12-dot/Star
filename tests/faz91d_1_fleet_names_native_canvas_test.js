'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
let pass=0,fail=0;
async function check(n,fn){try{await fn();pass++;console.log('  ✓ '+n);}catch(e){fail++;console.log('  ✗ '+n+' — '+e.stack);}}
const data=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
function make(dpr=1,local=new Map()){
  const h=runtime({native:true,width:1000,height:600,dpr,local});
  h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
  for(const id of ['topbar','tools','sidebar','timepod','seltag'])h.doc.getElementById(id).getBoundingClientRect=()=>({left:0,top:0,width:0,height:0});
  h.run(`View._pan=null;View.sel=null;View.selSys=null;View.cam={x:3000,y:3000,z:1};
    G.fx=[];globalThis.__base=JSON.parse(JSON.stringify(G.fleets.find(f=>f.e===0)));
    G.fleets=[];G.p.contact={1:true};G.p.shareVis={};G.emps[1].name='Mavi Birlik';G.emps[2].name='GİZLİ DEVLET';
    for(const s of G.sys){s.x=100;s.y=100;s.seen=[];s.surv=[];s.owner=-1;}
    G.sys[0].x=2650;G.sys[0].y=2800;G.sys[1].x=3350;G.sys[1].y=2800;
    G.sys[0].seen=[0];G.sys[1].seen=[0];G.vis=new Set([0,1]);
    for(let i=0;i<3;i++){const f=JSON.parse(JSON.stringify(__base));f.id=900+i;f.e=i;
      f.sys=-1;f.x=2700+i*300;f.y=2980;f.mv={from:0,to:1,t:.3};G.fleets.push(f);}
    RADAR_ON=false;LOGI_ON=false;MAP_MODE='siyasi';View.draw(1000);`);
  h.draw=()=>h.run('View.draw(1000)');return h;
}
const labels=h=>data(h,'View._fleetOwnerLabels');
(async()=>{
const h=make();
await check('Default off, real menu exposes an independent toggle',()=>{
  assert.equal(h.run('FLEET_NAMES_ON'),false);assert.deepEqual(labels(h),[]);
  h.run('UI._booted=false;UI.boot()');assert.match(h.doc.getElementById('tools').innerHTML,/data-a="fleetNamesToggle"/);
});
await check('Real UI action turns on state names without changing mode or layers',()=>{
  h.run("UI.act('fleetNamesToggle')");h.draw();assert.equal(h.run('FLEET_NAMES_ON'),true);
  assert.equal(h.run('MAP_MODE'), 'siyasi');assert.equal(h.run('RADAR_ON||LOGI_ON'),false);
  assert.equal(h.doc.getElementById('fleetNamesBtn').getAttribute('aria-pressed'),'true');
  assert.equal(labels(h).length,3);assert.ok(labels(h).some(l=>l.name==='Mavi Birlik'));
});
await check('No-contact fleet has neutral identity; hidden fleet has no label',()=>{
  assert.ok(labels(h).some(l=>l.emp===2&&l.name==='Bilinmeyen devlet'));
  assert.ok(!labels(h).some(l=>l.name==='GİZLİ DEVLET'));
  h.run('G.vis=new Set()');h.draw();assert.deepEqual(labels(h).map(l=>l.emp),[0]);
  h.run('G.vis=new Set([0,1])');
});
await check('Fleet moves 50 world units, its actual label moves 50 CSS pixels',()=>{
  h.draw();const old=labels(h).find(l=>l.emp===1);h.run('G.fleets[1].x+=50');h.draw();
  const next=labels(h).find(l=>l.emp===1);assert.equal(next.x-old.x,50);assert.equal(next.y,old.y);
});
await check('Pan transforms both ship and owner text together',()=>{
  const old=labels(h).find(l=>l.emp===1);h.run('View.cam.x+=35');h.draw();
  assert.equal(labels(h).find(l=>l.emp===1).x-old.x,-35);
});
await check('Same-day contact immediately reveals fleet owner',()=>{
  h.run('G.p.contact[2]=true');h.draw();assert.ok(labels(h).some(l=>l.name==='GİZLİ DEVLET'));
});
await check('Visible pirates are recognisable without a diplomatic contact',()=>{
  h.run('G.fleets[2].e=G.emps.find(e=>e.wild).id');h.draw();assert.ok(labels(h).some(l=>l.name==='Korsanlar'));
});
await check('Native Canvas name box really contains text pixels',()=>{
  const l=labels(h).find(l=>l.emp===1),g=h.elements.get('map').getContext('2d');assert.ok(l);
  const p=g.getImageData(Math.ceil(l.x+7),Math.ceil(l.y+2),Math.floor(l.w-10),15).data;
  let n=0;for(let i=0;i<p.length;i+=4)if(p[i]+p[i+1]+p[i+2]>230)n++;assert.ok(n>15);
});
if(process.env.STARS_ARTIFACTS){fs.mkdirSync(process.env.STARS_ARTIFACTS,{recursive:true});
  fs.writeFileSync(path.join(process.env.STARS_ARTIFACTS,'fleet-owners-native.png'),h.elements.get('map').toBuffer('image/png'));}
await check('Toggle off removes all owner labels next frame',()=>{
  h.run("UI.act('fleetNamesToggle')");h.draw();assert.deepEqual(labels(h),[]);
  assert.equal(h.doc.getElementById('fleetNamesBtn').getAttribute('aria-pressed'),'false');
});
for(const mode of ['siyasi','diplomasi','savas'])for(const radar of [false,true])for(const logi of [false,true]){
  await check(`Independent in ${mode} radar=${radar} logistics=${logi}`,()=>{
    h.sb.__mode=mode;h.sb.__radar=radar;h.sb.__logi=logi;
    h.run("UI.act('mapMode',__mode);RADAR_ON=__radar;LOGI_ON=__logi;FLEET_NAMES_ON=false;UI.act('fleetNamesToggle')");h.draw();
    assert.equal(h.run('MAP_MODE'),mode);assert.equal(h.run('RADAR_ON'),radar);assert.equal(h.run('LOGI_ON'),logi);
    assert.ok(labels(h).some(l=>l.emp===1));
  });
}
await check('Mode changes keep owner-label preference enabled',()=>{h.run("UI.act('mapMode','siyasi')");assert.equal(h.run('FLEET_NAMES_ON'),true);});
await check('Preference survives a fresh session without being put into the game save',async()=>{
  await h.run("storeSet('yh_fleetnames','on')");const fresh=make(1,h.local);
  await fresh.run('loadFleetNamesPref()');assert.equal(fresh.run('FLEET_NAMES_ON'),true);
  assert.doesNotMatch(fresh.run('serialize()'),/FLEET_NAMES|yh_fleetnames/);
});
await check('Delayed preference read cannot undo a newer click',async()=>{
  const fresh=make();fresh.run("globalThis.__get=storeGet;storeGet=()=>new Promise(r=>globalThis.__resolve=r)");
  const pending=fresh.run('loadFleetNamesPref()');fresh.run("UI.act('fleetNamesToggle');__resolve('off')");await pending;
  assert.equal(fresh.run('FLEET_NAMES_ON'),true);fresh.run('storeGet=__get');
});
await check('Layer toggle and repeated drawing preserve save and RNG',()=>{
  h.draw();const before=h.run('serialize()'),rng=h.run('RND_STATE');
  h.run("UI.act('fleetNamesToggle');UI.act('fleetNamesToggle')");for(let i=0;i<5;i++)h.draw();
  assert.equal(h.run('serialize()'),before);assert.equal(h.run('RND_STATE'),rng);
});
await check('Surface rebuild keeps preference and redraws names',()=>{
  assert.equal(h.run("rebuildCanvasSurface('fleet-names-test')"),true);h.draw();
  assert.equal(h.run('FLEET_NAMES_ON'),true);assert.ok(labels(h).length);
});
await check('Load keeps preference while labels use new fleet objects',()=>{
  assert.equal(h.run('globalThis.__s=serialize();globalThis.__oldFleet=G.fleets[0];deserialize(__s)'),true);
  assert.equal(h.run('G.fleets[0]===__oldFleet'),false);h.draw();assert.equal(h.run('FLEET_NAMES_ON'),true);
  assert.ok(labels(h).length);
  assert.ok(labels(h).every(l=>l.ids.every(id=>h.run('G.fleets.some(f=>f.id==='+id+')'))));
});
await check('Stationary stack shows one owner label for its real fleet row; tap still selects',()=>{
  const stack=make();stack.run('FLEET_NAMES_ON=true;G.fleets[2].e=1;for(const f of G.fleets){f.mv=null;f.sys=0;f.x=G.sys[0].x;f.y=G.sys[0].y;}');stack.draw();
  const row=data(stack,'View.rowHits.find(r=>r.emp===1)');assert.ok(row);
  const l=labels(stack).filter(l=>l.emp===1);assert.equal(l.length,1);assert.equal(l[0].ids.length,2);
  stack.advance(500);const cv=stack.elements.get('map');cv.emit('pointerdown',{pointerId:1,clientX:row.x+row.w/2,clientY:row.y+row.h/2});
  cv.emit('pointerup',{pointerId:1,clientX:row.x+row.w/2,clientY:row.y+row.h/2});assert.equal(stack.run('View.sel.e'),1);assert.equal(stack.run('View._gest.pts.size'),0);
});
await check('DPR2 uses the same CSS positions',()=>{
  const a=make(),b=make(2);a.run('FLEET_NAMES_ON=true');b.run('FLEET_NAMES_ON=true');a.draw();b.draw();assert.deepEqual(labels(a),labels(b));
});
console.log(`\nGEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
})();
