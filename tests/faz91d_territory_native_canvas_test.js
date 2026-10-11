'use strict';
// Real production draw and Skia pixels. Geometry is controlled; not Android/DOM layout proof.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
const root=process.env.STARS_TEST_ROOT||path.resolve(__dirname,'..');
let passed=0,failed=0;
function check(name,fn){try{fn();passed++;console.log('  ✓ '+name);}catch(e){failed++;console.log('  ✗ '+name+' — '+e.message);}}
const data=(h,expr)=>JSON.parse(h.run('JSON.stringify('+expr+')'));
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function rect(x,y,w,h){return {x,y,w,h,left:x,top:y,width:w,height:h,right:x+w,bottom:y+h};}
function make(dpr=1){
  const h=runtime({root,native:true,width:1000,height:600,dpr});
  h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
  for(const id of ['topbar','tools','sidebar','timepod','seltag'])h.doc.getElementById(id).getBoundingClientRect=()=>rect(0,0,0,0);
  h.doc.getElementById('topbar').getBoundingClientRect=()=>rect(0,0,1000,45);
  h.doc.getElementById('tools').getBoundingClientRect=()=>rect(0,50,55,350);
  h.doc.getElementById('timepod').getBoundingClientRect=()=>rect(0,555,280,45);
  h.run(`
    globalThis.__col=JSON.parse(JSON.stringify(G.sys.flatMap(s=>s.planets).find(p=>p.col).col));
    globalThis.__fleets=G.fleets;G.fleets=[];G.fx=[];View.sel=null;View.selSys=null;View._pan=null;
    for(const e of G.emps)if(!e.wild&&!e.crisisSide)e.dead=false;
    G.emps[1].name='Kuzey Birliği';G.emps[2].name='Güney Birliği';
    G.emps[2].race=G.emps[1].race;G.emps[4].name='GİZLİ_KİMLİK';G.emps[3].name='GÖRÜNMEZ_DEVLET';
    G.p.contact={1:true,2:true,3:true};G.p.shareVis={};
    for(const s of G.sys){s.seen=[];s.surv=[];s.owner=-1;s._reach=120;s.lanes=[];
      for(const p of s.planets){p.col=null;p.owner=-1;}}
    View.cam={x:3000,y:3000,z:1};
    const specs=[[230,170,1],[330,200,1],[700,320,1],[650,130,2],
      [850,500,3],[250,440,0],[120,200,1],[840,360,4],[850,455,4]];
    specs.forEach(([x,y,o],i)=>{const s=G.sys[i];s.x=3000+x-500;s.y=3000+y-300;
      s.owner=o;s.name='Sistem '+i;if(i!==4&&i!==6)s.seen=[0];});
    G.sys[0].lanes=[1];G.sys[1].lanes=[0];G.sys[7].lanes=[8];G.sys[8].lanes=[7];
    G.vis=new Set(G.sys.filter(s=>s.seen.includes(0)).map(s=>s.id));
    MAP_MODE='siyasi';RADAR_ON=false;LOGI_ON=false;View.bcache=null;
  `);
  const ctx=h.elements.get('map').getContext('2d'),fill=ctx.fillText;
  h.texts=[];ctx.fillText=function(t,...args){h.texts.push(String(t));return fill.call(this,t,...args);};
  h.draw=()=>{h.texts.length=0;h.run('View.draw(1000)');};
  h.draw();return h;
}
function labels(h){return data(h,'View._territoryLabels||[]');}
function artifact(h,name){if(process.env.STARS_ARTIFACTS){fs.mkdirSync(process.env.STARS_ARTIFACTS,{recursive:true});
  fs.writeFileSync(path.join(process.env.STARS_ARTIFACTS,name),h.elements.get('map').toBuffer('image/png'));}}
const h=make();
check('Historical source lock still detects changes to tap, recovery and fleet drawing',()=>{
  const {isMapInfrastructurePreserved:locked}=require('./helpers/map-preservation');
  const source=fs.readFileSync(path.join(root,'map.js'),'utf8');assert.equal(locked(source),true);
  for(const needle of ['tap(screenPos){','invalidateRenderCaches(reason){','drawFleet(g, f, p, t){']){
    assert.ok(source.includes(needle));assert.equal(locked(source.replace(needle,needle+'/* mutation */')),false);
  }
});
check('Separated same-owner pieces each draw their actual state name',()=>assert.equal(h.texts.filter(t=>t==='Kuzey Birliği').length,2));
check('Singleton state uses its own name, even with the same race as its neighbour',()=>assert.ok(h.texts.includes('Güney Birliği')));
check('No contact: real drawing does not disclose state identity',()=>{assert.ok(!h.texts.includes('GİZLİ_KİMLİK'));assert.ok(h.texts.includes('Bilinmeyen devlet'));});
check('Unseen states never receive labels',()=>assert.ok(!h.texts.includes('GÖRÜNMEZ_DEVLET')));
check('All region anchors are actual visible systems of that owner',()=>{
  const ls=labels(h).filter(l=>l.kind==='region');assert.equal(ls.length,5);
  for(const l of ls){h.sb.__id=l.anchor;assert.equal(h.run('G.sys[__id].owner'),l.owner);assert.equal(h.run('pSeen(G.sys[__id])'),true);}
});
check('Native label boxes avoid stars, system names, one another, and HUD',()=>{
  const ls=labels(h);assert.equal(ls.length,5);
  const blocks=data(h,'View._mapLabelBlocks').concat([rect(0,0,1000,45),rect(0,50,55,350),rect(0,555,280,45)]);
  for(let i=0;i<ls.length;i++){
    assert.ok(ls[i].x>=6&&ls[i].y>=6&&ls[i].x+ls[i].w<=994&&ls[i].y+ls[i].h<=594);
    for(const b of blocks.concat(ls.slice(0,i)))assert.ok(!overlaps(ls[i],b));
  }
});
check('Native text generates real pixels in the name box',()=>{
  const l=labels(h).find(l=>l.owner===1);assert.ok(l);
  const p=h.elements.get('map').getContext('2d').getImageData(Math.ceil(l.x+8),Math.ceil(l.y+3),Math.floor(l.w-12),Math.floor(l.h-6)).data;
  let bright=0;for(let i=0;i<p.length;i+=4)if(p[i]+p[i+1]+p[i+2]>230)bright++;
  assert.ok(bright>15);
});
artifact(h,'territory-fragments-native.png');
check('Hidden bridge does not join the two known fragments',()=>{
  h.run('G.sys[0].lanes.push(6);G.sys[2].lanes=[6];G.sys[6].lanes=[0,2]');h.draw();
  assert.equal(h.run('View.territoryRegions().filter(r=>r.owner===1).length'),2);
});
check('Discovering bridge joins components immediately without a day tick',()=>{
  const day=h.run('G.day');h.run('G.sys[6].seen=[0]');h.draw();
  assert.equal(h.run('View.territoryRegions().filter(r=>r.owner===1).length'),1);assert.equal(h.run('G.day'),day);
});
check('Contact reveals the proper name on the same day',()=>{h.run('G.p.contact[4]=true');h.draw();assert.ok(h.texts.includes('GİZLİ_KİMLİK'));});
check('Ownership change and rename invalidate labels on the same day',()=>{
  const day=h.run('G.day');h.run("G.sys[2].owner=2;G.emps[2].name='Yeni Güney'");h.draw();
  const l=labels(h).find(l=>l.anchor===2);assert.ok(l);assert.equal(l.owner,2);assert.equal(l.name,'Yeni Güney');assert.equal(h.run('G.day'),day);
});
check('Loading an equivalent new system graph rebinds cached region references',()=>{
  h.run('globalThis.__oldSys=G.sys;G.sys=JSON.parse(JSON.stringify(G.sys))');h.draw();
  assert.equal(h.run('View.territoryRegions().every(r=>r.systems.every(s=>s===G.sys[s.id]))'),true);
  assert.equal(h.run('View.territoryRegions().some(r=>r.systems.some(s=>s===__oldSys[s.id]))'),false);
});
check('Offscreen territory centre does not suppress the on-screen piece',()=>{
  h.run('G.sys[0].x=1000;G.sys[1].x=1100;G.sys[6].x=1200;G.sys[2].owner=1;View.cam.z=1.9');h.draw();
  assert.ok(labels(h).some(l=>l.owner===1&&l.anchor===2));
});
const edge=make();
check('Near left and right viewport edges, singleton names stay visible',()=>{
  edge.run('G.sys[3].x=3000+975-500;G.sys[3].y=3000+260-300;G.sys[5].x=3000+70-500;G.sys[5].y=3000+485-300');edge.draw();
  assert.ok(labels(edge).some(l=>l.anchor===3));assert.ok(labels(edge).some(l=>l.anchor===5));
});
check('Sidebar is a real obstruction; selected region label moves into free space',()=>{
  edge.doc.getElementById('sidebar').getBoundingClientRect=()=>rect(760,45,240,555);
  edge.run('View.selSys=G.sys[2];G.sys[2].x=3200');edge.draw();
  const ls=labels(edge);assert.ok(ls.some(l=>l.anchor===2));for(const l of ls)assert.ok(!overlaps(l,rect(760,45,240,555)));
});
const mixed=make();
mixed.run('G.sys[0].surv=[0];G.sys[0].planets[0].col=JSON.parse(JSON.stringify(__col));G.sys[0].planets[0].owner=2;View.selSys=G.sys[0]');mixed.draw();
check('Surveyed colony with different owner draws a mixed-sovereignty marker',()=>assert.ok(mixed.texts.includes('KARMA HÂKİMİYET')));
check('System panel distinguishes system control from colony ownership',()=>{
  const html=mixed.run('UI.p_sistem()');assert.match(html,/Sistem hâkimiyeti/);assert.match(html,/KARMA HÂKİMİYET/);
  assert.match(html,/Koloni sahibi:.*Güney Birliği/);assert.equal(mixed.run('G.sys[0].owner'),1);assert.equal(mixed.run('G.sys[0].planets[0].owner'),2);
});
artifact(mixed,'territory-mixed-native.png');
check('Unsurveyed colonies do not disclose mixed ownership',()=>{
  mixed.run('G.sys[0].surv=[]');mixed.draw();assert.ok(!mixed.texts.includes('KARMA HÂKİMİYET'));
  assert.doesNotMatch(mixed.run('UI.p_sistem()'),/KARMA HÂKİMİYET|Koloni sahibi/);
});
check('Unknown colony owner uses neutral identity and names are HTML-escaped',()=>{
  mixed.run("G.sys[0].surv=[0];G.sys[0].planets[0].owner=4;G.emps[1].name='<b>Kuzey</b>'");
  const html=mixed.run('UI.p_sistem()');assert.match(html,/Koloni sahibi:.*Bilinmeyen devlet/);assert.doesNotMatch(html,/GİZLİ_KİMLİK/);
  assert.match(html,/&lt;b&gt;Kuzey&lt;\/b&gt;/);assert.doesNotMatch(html,/<b>Kuzey<\/b>/);
});
check('Repeated label planning/drawing preserves save and RNG',()=>{
  mixed.draw();const before=mixed.run('serialize()'),rng=mixed.run('RND_STATE');
  for(let i=0;i<10;i++)mixed.draw();assert.equal(mixed.run('serialize()'),before);assert.equal(mixed.run('RND_STATE'),rng);
});
const input=make();
check('Real pointer tap still opens a system below the new labels',()=>{
  input.advance(500);const cv=input.elements.get('map');
  cv.emit('pointerdown',{pointerId:1,clientX:650,clientY:130});cv.emit('pointerup',{pointerId:1,clientX:650,clientY:130});
  assert.equal(input.run('View.selSys.id'),3);assert.equal(input.run('View._gest.pts.size'),0);
});
check('Fleet hit rows keep priority, labels avoid them, real tap selects that fleet',()=>{
  input.run('G.fleets=__fleets.filter(f=>f.e===0).slice(0,2);for(const f of G.fleets){f.sys=0;f.mv=null;f.x=G.sys[0].x;f.y=G.sys[0].y;}View.sel=null;View.selSys=null');input.draw();
  const rows=data(input,'View.rowHits');assert.ok(rows.length);
  for(const l of labels(input))for(const r of rows)assert.ok(!overlaps(l,r));
  const r=rows[0],cv=input.elements.get('map');input.advance(500);
  cv.emit('pointerdown',{pointerId:2,clientX:r.x+r.w/2,clientY:r.y+r.h/2});cv.emit('pointerup',{pointerId:2,clientX:r.x+r.w/2,clientY:r.y+r.h/2});
  assert.equal(input.run('View.sel.id===G.fleets[0].id'),true);assert.equal(input.run('View._gest.pts.size'),0);
});
check('DPR 2 gives the same CSS label positions and still renders native pixels',()=>{
  const a=make(),b=make(2);assert.deepEqual(labels(a),labels(b));
  const l=labels(b)[0];assert.ok(l);const p=b.elements.get('map').getContext('2d').getImageData(Math.ceil(l.x*2),Math.ceil(l.y*2),1,1).data;assert.equal(p[3],255);
});
for(const mode of ['siyasi','diplomasi','savas'])for(const radar of [false,true])for(const logi of [false,true]){
  check(`Owner names persist in ${mode}, radar=${radar}, logistics=${logi}`,()=>{
    input.sb.__mode=mode;input.sb.__radar=radar;input.sb.__logi=logi;
    input.run('MAP_MODE=__mode;RADAR_ON=__radar;LOGI_ON=__logi');input.draw();
    assert.ok(input.texts.includes('Kuzey Birliği'));assert.ok(input.texts.includes('Güney Birliği'));
    assert.equal(input.run('MAP_MODE'),mode);assert.equal(input.run('RADAR_ON'),radar);assert.equal(input.run('LOGI_ON'),logi);
  });
}
check('Far zoom never labels entirely unseen empires',()=>{
  const far=make();far.run('View.cam.z=.04;G.sys[9].owner=3;G.sys[9].lanes=[4];G.sys[4].lanes=[9]');far.draw();
  assert.ok(!far.texts.includes('GÖRÜNMEZ_DEVLET'));
});
check('Shared discovery shows location without granting third-party diplomatic identity',()=>{
  const shared=make();shared.run('G.sys[7].seen=[1];G.sys[8].seen=[1];G.p.shareVis={1:true}');shared.draw();
  assert.ok(labels(shared).some(l=>l.owner===4&&l.name==='Bilinmeyen devlet'));
  shared.run('G.p.shareVis={}');shared.draw();assert.ok(!labels(shared).some(l=>l.owner===4));
});
check('Crowded viewport gives selected region first choice without label overlaps',()=>{
  const crowded=make();crowded.run(`for(let i=0;i<6;i++){G.sys[i].x=3000+i*4;G.sys[i].y=3000+i*3;
    G.sys[i].seen=[0];G.sys[i].lanes=[];}View.selSys=G.sys[3]`);crowded.draw();
  const ls=labels(crowded);assert.ok(ls.some(l=>l.anchor===3));
  for(let i=0;i<ls.length;i++)for(const b of ls.slice(0,i))assert.ok(!overlaps(ls[i],b));
});
check('Real old player save still draws at far, medium and near zoom without changing data',()=>{
  const real=runtime({root,native:true,width:1000,height:600});
  real.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
  for(const id of ['topbar','tools','sidebar','timepod','seltag'])real.doc.getElementById(id).getBoundingClientRect=()=>rect(0,0,0,0);
  real.run('View.draw(1000)');const before=real.run('serialize()'),rng=real.run('RND_STATE');
  for(const zoom of [.04,.4,1.9]){real.sb.__zoom=zoom;real.run('View.cam.z=__zoom;View.draw(1000)');
    assert.equal(real.run('View._drawStage'),'tamam');assert.ok(labels(real).length);
    assert.equal(real.run('serialize()'),before);assert.equal(real.run('RND_STATE'),rng);
  }
  real.run('View.cam.z=.4;View.draw(1000)');artifact(real,'territory-real-save-native.png');
});
console.log(`\nGEÇEN: ${passed} KALAN: ${failed}`);process.exitCode=failed?1:0;
