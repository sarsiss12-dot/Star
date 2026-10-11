'use strict';
const assert=require('assert/strict'), path=require('path');
const {runtime}=require('./helpers/runtime');
const save=process.env.STARS_SAVE || path.join(__dirname,'fixtures/stars-2210-06.sav.json');
let passed=0,failed=0;
function check(name,fn){try{fn();passed++;console.log('  ✓ '+name);}catch(e){failed++;console.log('  ✗ '+name+' — '+e.message);}}
const json=(h,code)=>JSON.parse(h.run('JSON.stringify('+code+')'));
function make(options){const h=runtime(options);h.loadSave(save);h.run('View.draw(1000)');return h;}
(async()=>{
  const h=make();
  let complete, copied;
  h.sb.navigator.clipboard={writeText:txt=>{copied=txt;return new Promise(r=>complete=r);}};
  const logsBefore=h.run('G.log.length');
  const pending=h.run("UI.act('diagCopy')");
  check('Clipboard pending: no success notice before completion',()=>assert.equal(h.run('G.log.length'),logsBefore));
  check('Clipboard pending: no fallback download',()=>assert.equal(h.downloads.length,0));
  check('Clipboard pending: duplicate tap is coalesced',()=>assert.equal(h.run("UI.act('diagCopy')"),undefined));
  complete();
  check('Clipboard completion is awaited',()=>assert.equal(typeof pending.then,'function'));
  const success=await pending;
  check('Clipboard resolved: success and busy flag released',()=>{assert.equal(success,true);assert.equal(h.run('UI._diagCopyBusy'),false);});
  check('Export includes raw pixel samples and viewport details',()=>{assert.match(copied,/rgba/);assert.match(copied,/viewport=/);});
  h.sb.navigator.clipboard.writeText=()=>Promise.reject(new Error('clipboard denied'));
  const fallback=await h.run("UI.act('diagCopy')");
  check('Clipboard rejected: actual download fallback starts once',()=>{assert.equal(fallback,true);assert.equal(h.downloads.length,1);assert.equal(h.downloads[0].name,'stars-tani.txt');});
  h.sb.navigator.clipboard=undefined;
  await h.run("UI.act('diagCopy')");
  check('Clipboard absent: download works',()=>assert.equal(h.downloads.length,2));
  h.sb.URL.createObjectURL=()=>{throw Error('download unavailable');};
  const unavailable=await h.run("UI.act('diagCopy')");
  check('Both export routes failed: false and retry remains possible',()=>{assert.equal(unavailable,false);assert.equal(h.run('UI._diagCopyBusy'),false);});

  const storage=make();
  await storage.run("storeSet('yildiz:save','GAME_SAVE_SENTINEL')");
  storage.run("ilkHataKaydet(renderReport('first',{why:'specific error'},true))");
  await Promise.resolve();
  check('Diagnostic persistence leaves MEM_SAVE untouched',()=>assert.equal(storage.run('MEM_SAVE'),'GAME_SAVE_SENTINEL'));
  check('Diagnostic persistence leaves disk game save untouched',()=>assert.equal(storage.local.get('yildiz:save'),'GAME_SAVE_SENTINEL'));
  check('First failure stored under its own key',()=>assert.equal(JSON.parse(storage.local.get('yh_lastfail')).sebep,'first'));
  const savedFirst=json(storage,'ILK_HATA');
  storage.run("ilkHataKaydet(renderReport('second')); for(let i=0;i<50;i++) logDiag('test',i)");
  check('Retries and log rotation preserve the original first failure',()=>assert.deepEqual(json(storage,'ILK_HATA'),savedFirst));
  const fresh=runtime({local:storage.local});
  await fresh.run('loadLastRenderFailure()');
  check('New session loads previous failure',()=>assert.equal(fresh.run('ONCEKI_HATA.sebep'),'first'));
  check('Previous session does not consume current first-failure slot',()=>assert.equal(fresh.run('ILK_HATA'),null));
  fresh.run("ilkHataKaydet(renderReport('current'))");
  check('New session can record a new first failure',()=>assert.equal(fresh.run('ILK_HATA.sebep'),'current'));
  const invalid=runtime({local:new Map([['yh_lastfail','{bad']])});
  await invalid.run('loadLastRenderFailure()');
  check('Malformed diagnostic record is ignored',()=>assert.equal(invalid.run('ONCEKI_HATA'),null));
  const offline=make();
  offline.win.localStorage.setItem=()=>{throw Error('storage blocked');};
  offline.run("_localOK=null;MEM_SAVE='OFFLINE_GAME';ilkHataKaydet(renderReport('offline'))");
  await offline.run('loadLastRenderFailure()');
  check('No persistent storage: diagnostic does not overwrite/read game fallback',()=>{
    assert.equal(offline.run('MEM_SAVE'),'OFFLINE_GAME');assert.equal(offline.run('ONCEKI_HATA'),null);
  });
  await offline.run("storeSet('yh_radar','on');storeSet('yh_logi','off');storeSet('yh_audio','off')");
  check('Offline preferences cannot overwrite the game save fallback',()=>assert.equal(offline.run('MEM_SAVE'),'OFFLINE_GAME'));
  const prefValues=await offline.run("Promise.all([storeGet('yh_radar'),storeGet('yh_logi'),storeGet('yh_audio'),storeGet('yh_unknown'),storeGet('yildiz:save')])");
  check('Offline preference values are isolated by key',()=>assert.deepEqual(Array.from(prefValues),['on','off','off',null,'OFFLINE_GAME']));
  const late=make();let readDone;
  late.win.storage={get:()=>new Promise(resolve=>readDone=resolve),set:()=>Promise.resolve()};
  const loading=late.run('loadLastRenderFailure()');
  late.run("ilkHataKaydet(renderReport('live-first'))");
  readDone({value:JSON.stringify(savedFirst)});await loading;
  check('Late previous-session read cannot overwrite live first failure',()=>{assert.equal(late.run('ILK_HATA.sebep'),'live-first');assert.equal(late.run('ONCEKI_HATA.sebep'),'first');});
  late.run("globalThis.mutable={why:'original'};ILK_HATA=null;ilkHataKaydet(renderReport('immutable',mutable));mutable.why='changed'");
  check('First report is a value snapshot, not a shared object',()=>assert.equal(late.run('ILK_HATA.ek.why'),'original'));
  check('Nested error text survives export',()=>assert.match(late.run('renderReportText(ILK_HATA)'),/"why":"original"/));

  const pure=make({dpr:2});
  const before=pure.run('serialize()'), rng=pure.run('RND_STATE');
  for(let i=0;i<20;i++) pure.run("renderReport('manual',null,true)");
  check('Detailed reports preserve serialized world',()=>assert.equal(pure.run('serialize()'),before));
  check('Detailed reports consume no RNG',()=>assert.equal(pure.run('RND_STATE'),rng));
  const report=json(pure,"renderReport('dpr',null,true)");
  check('DPR 2: samples carry CSS and backing pixel positions',()=>{
    assert.ok(report.health.samples.length>0);
    for(const s of report.health.samples){assert.equal(s.px,Math.round(s.css.x*2));assert.equal(s.py,Math.round(s.css.y*2));assert.equal(s.rgba.length,4);}
  });
  check('All six transform components are reported',()=>assert.equal(report.tf.split(',').length,6));
  const c=pure.run('View.g');let reads=0;const get=c.getImageData;
  c.getImageData=function(...args){reads++;return get.apply(this,args);};
  pure.run('View.draw(1001);View.draw(1002);View.draw(1003)');
  check('Normal drawing does not read pixels',()=>assert.equal(reads,0));
  pure.run('View.resize()');
  check('Resize after drawing is distinguishable',()=>assert.equal(pure.run("renderReport('r').resizeAfterDraw"),true));

  const events=make();
  events.doc.emit('fullscreenchange');
  check('Fullscreen uses scheduled recovery, no immediate canvas reset',()=>{
    assert.equal(events.run('OLAY_IZI.at(-1).a'),'fullscreen');
    assert.equal(events.timers.size,1);
  });
  events.win.emit('pageshow');
  check('Pageshow writes its own event',()=>assert.equal(events.run('OLAY_IZI.at(-1).a'),'pageshow'));
  events.win.emit('orientationchange');
  check('Orientation does not fabricate a pageshow event',()=>assert.equal(events.run('OLAY_IZI.at(-1).a'),'orient'));
  events.flushTimers();
  check('Lifecycle recovery ends with drawing completed',()=>assert.equal(events.run('View._drawStage'),'tamam'));

  const err=make(); const g=err.run('View.g'), fillText=g.fillText;
  g.fillText=function(...args){if(err.run('View._drawStage')==='sistemler')throw Error('SYSTEM_DRAW_ERROR');return fillText.apply(this,args);};
  err.run('frame(2000)');
  check('Real draw failure: specific system stage preserved',()=>assert.equal(err.run('ILK_HATA.stage'),'sistemler'));
  check('Real draw failure: original error and stack captured',()=>{
    assert.match(err.run('ILK_HATA.drawError.message'),/SYSTEM_DRAW_ERROR/);
    assert.match(err.run('ILK_HATA.drawError.stack'),/map.js/);
  });
  check('Failed draw does not reuse old completion time',()=>assert.equal(err.run('ILK_HATA.drawEnd'),0));
  err.run('frame(2001);frame(2002);frame(2003)');
  check('Four map errors schedule canonical recovery',()=>assert.ok(err.run("_recSebep.includes('frame-error')")));
  g.fillText=fillText; err.flushTimers();
  check('Recovery preserves original error even after successful redraw',()=>{assert.equal(err.run('View._drawStage'),'tamam');assert.match(err.run('ILK_HATA.drawError.message'),/SYSTEM_DRAW_ERROR/);});

  console.log(`\nGEÇEN: ${passed} KALAN: ${failed}`);process.exitCode=failed?1:0;
})().catch(e=>{console.error(e);process.exitCode=1;});
