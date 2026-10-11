'use strict';
// Real production panel HTML and native Canvas pixels. Geometry/events below
// are explicit fixtures, NOT a browser layout engine or physical touch test.
const assert=require('assert/strict'), fs=require('fs'), path=require('path');
const {runtime}=require('./helpers/runtime');
const root=process.env.STARS_UI_ROOT || path.resolve(__dirname,'..');
const save=process.env.STARS_SAVE || path.join(__dirname,'fixtures/stars-2210-06.sav.json');
let pass=0,fail=0;
function check(name,fn){try{fn();pass++;console.log('  ✓ '+name);}catch(e){fail++;console.log('  ✗ '+name+' — '+e.message);}}
const rect=(x,y,w,h)=>({x,y,left:x,top:y,right:x+w,bottom:y+h,width:w,height:h});
function make(){const h=runtime({root,native:true});h.loadSave(save);return h;}

// Materialize actual <canvas> tags from production panel HTML. No production
// painter, panel builder, portrait generator or leader assignment is stubbed.
function panelDOM(h){
  const groups=new Map();
  function parse(html){return [...html.matchAll(/<canvas\b([^>]*)>[\s\S]*?<\/canvas>/g)].map(m=>{
    const cv=h.doc.createElement('canvas');
    for(const a of m[1].matchAll(/([\w-]+)="([^"]*)"/g)){
      const [,k,v]=a;
      if(k==='class'){cv.className=v;cv.classList.add(...v.split(/\s+/));}
      else if(k==='width'||k==='height')cv[k]=+v;
      else if(k.startsWith('data-'))cv.dataset[k.slice(5)]=v;
      else if(k==='id')cv.id=v;
    }
    return cv;
  });}
  for(const id of ['panel','diploPane']){
    const el=h.doc.getElementById(id);let html='';
    Object.defineProperty(el,'innerHTML',{get:()=>html,set:v=>{html=String(v);groups.set(id,parse(html));}});
  }
  h.doc.querySelectorAll=sel=>{
    const list=[...groups.values()].flat();
    const c=sel.match(/^canvas\.([\w-]+)$/),d=sel.match(/^canvas\[data-([\w-]+)\]$/);
    if(c)return list.filter(cv=>cv.classList.contains(c[1]));
    if(d)return list.filter(cv=>cv.dataset[d[1]]!==undefined);
    return sel==='#empPortrait'?list.filter(cv=>cv.id==='empPortrait'):[];
  };
  return id=>(groups.get(id)||[]).filter(c=>c.classList.contains('ldrPort'));
}
function pixels(cv){return Buffer.from(cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data);}
function visible(cv){const p=pixels(cv);let colored=0;for(let i=0;i<p.length;i+=4)
  if(p[i+3]>0&&(p[i]>30||p[i+1]>30||p[i+2]>30))colored++;return colored;}
function expectedLeader(h,cv){h.sb.__cv= cv;
  return h.run(`(()=>{const d=__cv.dataset,c=document.createElement('canvas');
    c.width=__cv.width;c.height=__cv.height;const g=c.getContext('2d');
    const s=ART.leaderPortrait({seed:+d.ldr,look:d.lk,col:d.col,rank:+d.rank,scale:3});
    const z=Math.min(c.width/s.width,c.height/s.height)*.92;
    g.imageSmoothingEnabled=false;
    g.drawImage(s,(c.width-s.width*z)/2,(c.height-s.height*z)/2,s.width*z,s.height*z);
    return c;})()`);
}
try{
  const h=make(),leaders=panelDOM(h);
  h.run(`globalThis.colony=G.p.colonies[0];View.selSys=G.sys[colony.s];View.sel=null;
    globalThis.hired=recruitLeader(G.p,'vali');
    if(!hired.ok)throw Error(hired.why);
    UI.act('ldrAssign',hired.leader.id+':vali:'+colony.s+':'+colony.p);`);
  let governor=leaders('panel')[0];
  check('Actual governor assignment produces a panel portrait',()=>assert.ok(governor));
  check('Governor portrait has real colored pixels immediately',()=>assert.ok(visible(governor)>100));
  check('Governor pixels match its own seed/look/rank',()=>assert.ok(pixels(governor).equals(pixels(expectedLeader(h,governor)))));
  const world=h.run('serialize()'),rng=h.run('RND_STATE');
  let draws=0;const ctx=governor.getContext('2d'),draw=ctx.drawImage;
  ctx.drawImage=function(...args){draws++;return draw.apply(this,args);};
  h.run('UI.paintSprites();UI.paintSprites();');
  check('Completed governor portrait is not redrawn every frame',()=>assert.equal(draws,0));
  ctx.drawImage=draw;
  h.run("UI.openGlobal('ldr')");h.flushTimers();
  const listed=leaders('diploPane')[0];
  check('Leaders list uses the same leader generator, not a race portrait',()=>assert.ok(pixels(listed).equals(pixels(expectedLeader(h,listed)))));
  check('Opening leaders cannot overwrite the governor portrait',()=>assert.ok(pixels(governor).equals(pixels(expectedLeader(h,governor)))));
  governor.width=governor.width;
  check('Native reset really clears the governor pixel buffer',()=>assert.equal(visible(governor),0));
  h.run('repaintPortraits()');
  check('Recovery repaints the governor as well as the leaders list',()=>assert.ok(visible(governor)>100&&visible(listed)>100));
  h.run('UI.refresh()');governor=leaders('panel')[0];
  check('New panel DOM is painted immediately after refresh',()=>assert.ok(visible(governor)>100));
  const g=governor.getContext('2d'),originalDraw=g.drawImage;
  delete governor.dataset.done;g.drawImage=()=>{throw Error('portrait draw failure');};
  h.run('UI.paintSprites()');
  check('Failed drawing does not mark the portrait complete',()=>assert.equal(governor.dataset.done,undefined));
  check('Portrait failure is diagnosed without crashing panel painting',()=>assert.ok(h.run("DIAG.some(d=>d.tur==='portrait'&&d.m.includes('portrait draw failure'))")));
  g.drawImage=originalDraw;h.run('UI.paintSprites()');
  check('Portrait can be retried after a drawing failure',()=>assert.equal(governor.dataset.done,'1'));
  delete governor.dataset.done;const get=governor.getContext;
  governor.getContext=()=>null;h.run('UI.paintSprites()');
  check('Missing context leaves the portrait eligible for retry',()=>assert.equal(governor.dataset.done,undefined));
  governor.getContext=get;h.run('UI.paintSprites()');
  check('Restored portrait context draws successfully',()=>assert.ok(visible(governor)>100));
  governor.dataset.rank='4';h.run('UI.paintSprites()');
  check('Rank change refreshes an existing canvas',()=>assert.ok(pixels(governor).equals(pixels(expectedLeader(h,governor)))));
  check('Portrait drawing does not change the saved world or RNG',()=>{assert.equal(h.run('serialize()'),world);assert.equal(h.run('RND_STATE'),rng);});
  if(process.env.STARS_ARTIFACTS){fs.mkdirSync(process.env.STARS_ARTIFACTS,{recursive:true});
    fs.writeFileSync(path.join(process.env.STARS_ARTIFACTS,'governor-native.png'),governor.toBuffer('image/png'));}
  h.run("UI.act('ldrUnassign',String(hired.leader.id))");
  check('Removing a governor removes its portrait slot',()=>assert.equal(leaders('panel').length,0));
  h.run(`G.p.res.etk+=60;globalThis.adm=recruitLeader(G.p,'amiral');
    View.sel=G.fleets.find(f=>f.e===0);UI.cur='filo';
    UI.act('ldrAssign',adm.leader.id+':amiral:'+View.sel.id);`);
  check('Admiral panel also receives a real leader portrait',()=>assert.ok(leaders('panel').some(c=>visible(c)>100)));
}catch(e){fail++;console.error(e.stack);}

function menuHost(w,hgt){
  const h=make(),el=id=>h.doc.getElementById(id);
  h.win.innerWidth=w;h.win.innerHeight=hgt;
  const vv=h.doc.createElement('div');Object.assign(vv,{width:w,height:hgt,offsetLeft:0,offsetTop:0});h.win.visualViewport=vv;
  h.run('UI.boot()');
  el('topbar').getBoundingClientRect=()=>rect(0,0,w,34);
  el('timepod').getBoundingClientRect=()=>rect(6,vv.offsetTop+vv.height-44,280,38);
  el('seltag').classList.add('hidden');
  const heads={};
  for(const [id,group,y,natural] of [['outMap','grpMap',200,264],['outEmp','grpEmp',236,286]]){
    const menu=el(id),head=h.doc.createElement('button');heads[id]=head;
    head.getBoundingClientRect=()=>rect(6,Math.min(y,vv.height-76)+vv.offsetTop,32,32);
    el(group).querySelector=s=>s==='.grpHead'?head:null;
    menu.parentElement=el(group);
    Object.defineProperty(menu,'offsetHeight',{get:()=>Math.min(natural,parseFloat(menu.style.maxHeight)||Infinity)});
    Object.defineProperty(menu,'offsetWidth',{get:()=>Math.min(160,parseFloat(menu.style.maxWidth)||Infinity)});
    menu.getBoundingClientRect=()=>rect(parseFloat(menu.style.left)||0,parseFloat(menu.style.top)||0,menu.offsetWidth,menu.offsetHeight);
    menu.scrollHeight=natural;
  }
  return {h,el,vv,heads};
}
try{
  for(const [w,hgt] of [[900,420],[900,300],[740,280],[640,240],[320,640]]){
    const {h,el}=menuHost(w,hgt);
    for(const [kind,id] of [['map','outMap'],['emp','outEmp']]){
      h.run(`UI.act('grpTog','${kind}')`);
      check(`Menu ${kind} stays between bars at ${w}x${hgt}`,()=>{
        const b=el(id).getBoundingClientRect();
        assert.ok(b.top>=42);assert.ok(b.bottom<=hgt-52);
        assert.ok(b.left>=44&&b.right<=w-8);
      });
      check(`Only requested menu ${kind} is open at ${w}x${hgt}`,()=>{
        assert.ok(el(id).classList.contains('open'));
        assert.equal(el(id==='outMap'?'outEmp':'outMap').classList.contains('open'),false);
      });
    }
    if(hgt<=300)check(`Tall menu has a constrained scroll region at height ${hgt}`,()=>{
      assert.ok(el('outEmp').offsetHeight<el('outEmp').scrollHeight);
      assert.ok(el('outEmp').offsetHeight>100);
    });
  }
  const {h,el,vv,heads}=menuHost(900,420);
  h.run("UI.act('grpTog','map')");
  const state=h.run('serialize()'),rng=h.run('RND_STATE'),cam=h.run('JSON.stringify(View.cam)');
  Object.assign(vv,{height:300,offsetTop:12});vv.emit('resize');
  check('Open menu moves when browser viewport height changes',()=>assert.ok(el('outMap').getBoundingClientRect().bottom<=260));
  Object.assign(vv,{height:420,offsetTop:0});vv.emit('resize');
  const before=el('outMap').getBoundingClientRect().top;
  heads.outMap.getBoundingClientRect=()=>rect(6,65,32,32);el('tools').emit('scroll');
  check('Open menu follows its anchor when toolbar scrolls',()=>assert.ok(el('outMap').getBoundingClientRect().top<before));
  check('Menu layout leaves map camera, save and RNG untouched',()=>{
    assert.equal(h.run('serialize()'),state);assert.equal(h.run('RND_STATE'),rng);assert.equal(h.run('JSON.stringify(View.cam)'),cam);
  });
  h.run('UI.boot();UI.boot();');
  check('Repeated boot does not duplicate menu layout listeners',()=>{
    assert.equal(h.run("RESIZE_ABONE.filter(a=>a.ad==='tool-menus').length"),1);
    assert.equal((vv.listeners.get('resize')||[]).length,1);
    assert.equal((el('tools').listeners.get('scroll')||[]).length,1);
  });
  h.run("UI.act('grpTog','map')");
  if(!el('outMap').classList.contains('open'))h.run("UI.act('grpTog','map')");
  const mode=h.run('MAP_MODE'),radar=h.run('RADAR_ON');
  h.run("UI.act('logiToggle')");
  check('Logistics toggle keeps menu open, main mode and radar unchanged',()=>{
    assert.ok(el('outMap').classList.contains('open'));assert.equal(h.run('MAP_MODE'),mode);assert.equal(h.run('RADAR_ON'),radar);
  });
  h.run("UI.act('mapMode','diplomasi')");
  check('Choosing a main mode closes the menu and keeps logistics enabled',()=>{
    assert.equal(el('outMap').classList.contains('open'),false);assert.equal(h.run('LOGI_ON'),true);
  });
  const css=fs.readFileSync(path.join(root,'index.html'),'utf8');
  check('Menu CSS allows scrolling without shrinking touch targets',()=>{
    assert.match(css,/\.grpOut\{[^}]*overflow-y:auto[\s\S]*?touch-action:pan-y/);
    assert.match(css,/\.grpOut \.tool\{[^}]*flex:0 0 auto/);
    assert.doesNotMatch(css,/\.grpOut::-webkit-scrollbar\{display:none/);
  });
}catch(e){fail++;console.error(e.stack);}
console.log(`\nGEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
