'use strict';
// This uses native Skia Canvas 2D and real production draw/tap functions.
// Event order is controlled by the test host: NOT a browser/Android test.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
const save=process.env.STARS_SAVE || path.join(__dirname,'fixtures/stars-2210-06.sav.json');
let passed=0,failed=0;
function check(name,fn){try{fn();passed++;console.log('  ✓ '+name);}catch(e){failed++;console.log('  ✗ '+name+' — '+e.message);}}
const data=(h,expr)=>JSON.parse(h.run('JSON.stringify('+expr+')'));
function make(dpr=1){const h=runtime({native:true,dpr});h.loadSave(save);h.run('View.draw(1000)');return h;}
const counts=cv=>Object.fromEntries(['pointerdown','pointermove','pointerup','pointercancel',
  'lostpointercapture','wheel','contextlost','contextrestored'].map(k=>[k,(cv.listeners.get(k)||[]).length]));
const cvOf=h=>h.elements.get('map');
function pan(h){const cv=cvOf(h);h.run('View.cam.x=3000;View.cam.y=3000;View.cam.z=1;View._pan=null');
  cv.emit('pointerdown',{pointerId:21,clientX:300,clientY:200});
  cv.emit('pointermove',{pointerId:21,clientX:340,clientY:200});
  cv.emit('pointerup',{pointerId:21,clientX:340,clientY:200});
  assert.equal(h.run('View.cam.x'),2960);assert.equal(h.run('View.cam.z'),1);
  assert.equal(h.run('View._gest.pts.size'),0);
}
function tap(h){h.advance(500);h.run('View.fit();View.sel=null;View.route=false;View.draw(1000)');
  const row=h.run('View.rowHits.find(r=>r.filolar.some(f=>f.e===0))');
  assert.ok(row,'production draw must produce a player fleet row');
  h.sb.__tabs=[];
  h.run("globalThis.__realTab=UI.tab;UI.tab=function(k){__tabs.push(k);return __realTab.call(this,k)}");
  try{
    const cv=cvOf(h),x=row.x+row.w/2,y=row.y+row.h/2;
    cv.emit('pointerdown',{pointerId:31,clientX:x,clientY:y});
    cv.emit('pointerup',{pointerId:31,clientX:x,clientY:y});
    assert.ok(h.run('View.sel && View.sel.e===0'));
    assert.deepEqual(Array.from(h.sb.__tabs),['filo']);
    assert.equal(h.run('View._gest.pts.size'),0);
  }finally{h.run('UI.tab=__realTab;delete __realTab;delete __tabs');}
}
function pinch(h){const cv=cvOf(h);h.run('View.cam.x=3000;View.cam.y=3000;View.cam.z=.5');
  cv.emit('pointerdown',{pointerId:41,clientX:300,clientY:200});
  cv.emit('pointerdown',{pointerId:42,clientX:400,clientY:200});
  cv.emit('pointermove',{pointerId:42,clientX:450,clientY:200});
  assert.equal(h.run('View.cam.z'),.75);
  cv.emit('pointerup',{pointerId:42,clientX:450,clientY:200});
  const before=h.run('View.cam.x');
  cv.emit('pointermove',{pointerId:41,clientX:330,clientY:200});
  assert.ok(Math.abs(h.run('View.cam.x')-(before-40))<1e-8);
  assert.equal(h.run('View.cam.z'),.75);
  cv.emit('pointerup',{pointerId:41,clientX:330,clientY:200});
  assert.equal(h.run('View._gest.pts.size'),0);
}
try {
  const h=make(2);
  for(const mode of ['siyasi','diplomasi','savas']) for(const radar of [false,true]) for(const logi of [false,true]){
    h.sb.__mode=mode;h.sb.__radar=radar;h.sb.__logi=logi;
    h.run("UI.act('mapMode',__mode); if(RADAR_ON!==__radar)UI.act('radarTog');if(LOGI_ON!==__logi)UI.act('logiToggle');View.draw(1000)");
    check(`Native pixels: ${mode}, radar=${radar}, logistics=${logi}`,()=>{
      const report=data(h,"renderReport('native',null,true)");
      assert.equal(report.stage,'tamam');assert.equal(report.health.ok,true);
      assert.equal(report.mode,mode);assert.equal(report.radar,radar);assert.equal(report.logistics,logi);
      for(const s of report.health.samples)assert.equal(s.rgba[3],255);
      const cv=cvOf(h),pixels=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
      let nonBackground=0;
      for(let i=0;i<pixels.length;i+=4){assert.equal(pixels[i+3],255);if(pixels[i]>15||pixels[i+1]>15||pixels[i+2]>20)nonBackground++;}
      assert.ok(nonBackground>1000,'real stars, lanes and labels must produce pixels');
    });
  }
  if(process.env.STARS_ARTIFACTS){fs.mkdirSync(process.env.STARS_ARTIFACTS,{recursive:true});
    h.run("UI.act('mapMode','siyasi');RADAR_ON=true;LOGI_ON=true;View.sel=G.fleets.find(f=>f.e===0);View.draw(1000)");
    fs.writeFileSync(path.join(process.env.STARS_ARTIFACTS,'map-native-dpr2.png'),cvOf(h).toBuffer('image/png'));
  }
  check('Real save: 6881 world and every system reachable at all supported zooms',()=>{
    assert.equal(h.run('G.W'),6881);assert.equal(h.run('G.H'),6881);
    for(const zoom of [.035,.3,1,1.9]){
      h.sb.__z=zoom;
      assert.equal(h.run('G.sys.filter(s=>{View.cam={x:s.x,y:s.y,z:__z};View.clampCam();return View.cam.x!==s.x||View.cam.y!==s.y}).length'),0);
    }
  });
  const continuity=make();
  const before=continuity.run('serialize()'),rng=continuity.run('RND_STATE');
  continuity.doc.emit('fullscreenchange');
  check('Fullscreen event does not erase existing pixels before recovery',()=>assert.equal(continuity.run('View.g.getImageData(450,210,1,1).data[3]'),255));
  continuity.flushTimers();
  check('Fullscreen recovery draws real pixels and preserves the save/RNG',()=>{
    assert.equal(continuity.run('View.g.getImageData(450,210,1,1).data[3]'),255);
    assert.equal(continuity.run('serialize()'),before);assert.equal(continuity.run('RND_STATE'),rng);
  });
  const cv=cvOf(continuity);const drawN=continuity.run('View._drawN');
  cv.width=cv.width; // genuine Canvas reset: clears real native pixel buffer
  check('Native canvas reset really produces transparent pixels',()=>assert.equal(continuity.run('View.g.getImageData(450,210,1,1).data[3]'),0));
  const getContext=cv.getContext;
  cv.getContext=()=>null; // simulate existing-surface context acquisition failure
  continuity.run("UI.act('mapFix')");continuity.flushTimers();
  cv.getContext=getContext;
  check('Manual recovery replaces unavailable surface and restores real pixels',()=>{
    assert.notEqual(cvOf(continuity),cv);
    assert.equal(continuity.run('View.cv===View.g.canvas'),true);
    assert.equal(continuity.run('View.g.getImageData(450,210,1,1).data[3]'),255);
    assert.ok(continuity.run('View._drawN')>drawN);
  });
  check('Before-recovery report retains original transparent samples',()=>assert.ok(continuity.run('ILK_HATA.health.samples.every(s=>s.rgba[3]===0)')));
  check('Retired native surface has zero event listeners',()=>assert.equal(Object.values(counts(cv)).reduce((a,b)=>a+b,0),0));
  check('Native replacement: real fleet tap selects exactly once',()=>tap(continuity));
  check('Native replacement: 40px pan is exactly 40 world units',()=>pan(continuity));
  check('Native replacement: pinch and following one-finger pan work',()=>pinch(continuity));

  const mixed=make();
  const create=mixed.doc.createElement;
  let successes=0,failures=0;
  for(let i=0;i<10;i++){
    const old=cvOf(mixed), callbacks=[...(old.listeners.get('pointerdown')||[])];
    const failing=i%3===0;
    if(failing) mixed.doc.createElement=tag=>{
      const next=create(tag);
      if(tag==='canvas') next.getContext('2d').setTransform=()=>{throw Error('new surface preparation error');};
      return next;
    };
    const result=mixed.run("rebuildCanvasSurface('native-mixed')");
    mixed.doc.createElement=create;
    check(`Mixed surface ${i}: expected outcome and references`,()=>{
      assert.equal(result,!failing);
      assert.equal(mixed.run('View.cv===View.g.canvas'),true);
      assert.equal(mixed.run('View.cv===document.getElementById("map")'),true);
      for(const n of Object.values(counts(cvOf(mixed))))assert.equal(n,1);
    });
    if(result)successes++;else failures++;
    mixed.run('View.resetGesture()');
    for(const cb of callbacks)cb({pointerId:99,clientX:300,clientY:200,preventDefault(){}});
    check(`Mixed surface ${i}: retired callback stays inert`,()=>assert.equal(mixed.run('View._gest.pts.size'),0));
    check(`Mixed surface ${i}: real tap`,()=>tap(mixed));
    check(`Mixed surface ${i}: pan/pinch after rollback or replacement`,()=>{pan(mixed);pinch(mixed);});
  }
  check('Mixed native sequence covered both outcomes',()=>{assert.equal(successes,6);assert.equal(failures,4);});
  const partial=make();const old=cvOf(partial),createPartial=partial.doc.createElement;
  partial.doc.createElement=tag=>{const e=createPartial(tag);if(tag==='canvas'){
    const add=e.addEventListener;let n=0;
    e.addEventListener=(...args)=>{add(...args);if(++n===3)throw Error('partial bind');};
  }return e;};
  check('Partial listener installation rolls back to coherent old surface',()=>{
    assert.equal(partial.run("rebuildCanvasSurface('partial-bind')"),false);
    assert.equal(cvOf(partial),old);for(const n of Object.values(counts(old)))assert.equal(n,1);
  });
  partial.doc.createElement=createPartial;
  check('Partial-bind rollback: tap/pan/pinch remain usable',()=>{tap(partial);pan(partial);pinch(partial);});
  const resize=make();const original=cvOf(resize);
  resize.run("View.g.setTransform=()=>{throw Error('existing context resize')}");
  resize.run("runRecovery('native-resize',0)");
  check('Existing resize error reaches a new native drawing surface',()=>{
    assert.notEqual(cvOf(resize),original);assert.equal(resize.run('View._drawStage'),'tamam');
    assert.equal(resize.run('View.g.getImageData(450,210,1,1).data[3]'),255);
    assert.equal(resize.run('_recCalisiyor'),false);
    assert.match(resize.run('ILK_HATA.ek.why'),/existing context resize/);
  });
}catch(e){failed++;console.error(e.stack);}
console.log(`\nGEÇEN: ${passed} KALAN: ${failed}`);process.exitCode=failed?1:0;
