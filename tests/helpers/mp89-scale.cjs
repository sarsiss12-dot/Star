'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{createHash}=require('crypto');
module.exports=async function scales(p,out,tag,reload){
 const rows=[];const click=sel=>p.locator(sel).first().click({timeout:8000});
 const close=()=>p.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();UI.closeDiplo?.();document.getElementById('diploPane').classList.remove('show');});
 for(const value of [80,100,125]){
  await close();await p.evaluate(()=>UI.saveMenu());await p.locator('#uiScaleSelect').selectOption(String(value));
  await p.waitForFunction(v=>UI.getUIScale().effective===v,value);

  await click('#modal .mhd [data-a="closem"]');
  // A real pointer hits the unscaled Canvas at a projected system/fleet coordinate.
  const picks=[];
  for(const kind of ['system','fleet']){
   const target=await p.evaluate(kind=>{
    const x=kind==='system'?G.sys.find(s=>pSeen(s)&&!G.fleets.some(f=>f.ships.length&&Math.hypot(f.x-s.x,f.y-s.y)*View.cam.z<70)):G.fleets.find(f=>f.e===G.p.id&&f.ships.length);
    if(!x)throw Error('no isolated '+kind);
    View.cam.x=x.x;View.cam.y=x.y;View.sel=null;View._lastTap=0;View.draw();
    const pos=View.w2s(x.x,x.y),el=document.elementFromPoint(pos.x,pos.y);
    window.__scaleInputs=[];
    if(!window.__scaleInputBound){window.__scaleInputBound=true;for(const k of ['pointerdown','pointerup','click'])addEventListener(k,e=>__scaleInputs.push({kind:k,t:performance.now(),target:e.target.id,x:e.clientX,y:e.clientY,trusted:e.isTrusted}),true);}
    return {...pos,id:x.id,hit:el?.id,expected:kind==='system'?View.hit(pos).s?.id:View.hit(pos).f?.id,camera:{...View.cam}};
   },kind);
   assert.equal(target.hit,'map','visible target is the Canvas');assert.equal(target.expected,target.id,'projected target resolves correctly before input');
   await p.mouse.click(target.x,target.y);await p.waitForTimeout(350);
   const events=await p.evaluate(()=>__scaleInputs);fs.writeFileSync(path.join(out,tag+'-scale'+value+'-'+kind+'-input.json'),JSON.stringify({target,events},null,2));
   const selected=await p.evaluate(kind=>kind==='system'?View.selSys?.id:View.sel?.id,kind);assert.equal(selected,target.id,kind+' real map hit');picks.push({kind,id:selected});
  }
  await click('[data-a="grpTog"][data-x="map"]');
  fs.writeFileSync(path.join(out,tag+'-scale'+value+'-transition-start.json'),JSON.stringify(await p.evaluate(()=>{const el=document.getElementById('outMap'),s=getComputedStyle(el);return {className:el.className,opacity:s.opacity,transform:s.transform,animations:el.getAnimations().map(a=>({state:a.playState,time:a.currentTime}))};}),null,2));
  await p.waitForFunction(()=>{const el=document.getElementById('outMap'),s=getComputedStyle(el);return el.classList.contains('open')&&s.opacity==='1'&&new DOMMatrix(s.transform).isIdentity;},undefined,{timeout:8000});
  const flyout=await p.evaluate(()=>{const r=document.getElementById('outMap').getBoundingClientRect(),b=document.querySelector('#grpMap .grpHead').getBoundingClientRect();const el=document.getElementById('outMap'),style=getComputedStyle(el);return {className:el.className,opacity:style.opacity,transform:style.transform,rect:[r.x,r.y,r.width,r.height],button:[b.x,b.y,b.width,b.height],viewport:[innerWidth,innerHeight]};});
  fs.writeFileSync(path.join(out,tag+'-scale'+value+'-flyout.json'),JSON.stringify(flyout,null,2));
  assert(Math.abs(flyout.rect[0]-(flyout.button[0]+flyout.button[2]+6))<2,'flyout uses actual screen coordinates');
  assert(flyout.rect[1]>=0&&flyout.rect[1]+flyout.rect[3]<=flyout.viewport[1]+1,'flyout fits');
  await click('[data-a="grpTog"][data-x="map"]');
  await p.evaluate(()=>UI.openDiplo());await p.screenshot({path:path.join(out,tag+'-scale'+value+'-diplo.png')});
  await click('#diploPane .dpHd [data-a="closeDiplo"]');assert(!await p.locator('#diploPane').evaluate(e=>e.classList.contains('show')));await p.locator('#sbToggle').click({timeout:8000});
  const panel=await p.evaluate(()=>({sidebar:document.getElementById('sidebar').className,sel:View.sel?.id,sys:View.selSys?.id,camera:{...View.cam}}));
  await p.evaluate(()=>UI.saveMenu());
  const before=await p.evaluate(()=>({camera:{...View.cam},rng:RND_STATE,save:serialize()}));
  const geometry=await p.evaluate(()=>{const r=document.querySelector('#modal .mbox').getBoundingClientRect(),c=document.getElementById('map').getBoundingClientRect();return {modal:[r.x,r.y,r.width,r.height],canvas:[c.x,c.y,c.width,c.height],viewport:[innerWidth,innerHeight],effective:UI.getUIScale(),overflow:document.documentElement.scrollWidth>innerWidth};});
  fs.writeFileSync(path.join(out,tag+'-scale'+value+'-geometry.json'),JSON.stringify(geometry,null,2));
  assert(geometry.modal[0]>=-1&&geometry.modal[1]>=-1&&geometry.modal[0]+geometry.modal[2]<=geometry.viewport[0]+1&&geometry.modal[1]+geometry.modal[3]<=geometry.viewport[1]+1,'modal fits');assert(!geometry.overflow);assert.deepEqual(geometry.canvas,[0,0,...geometry.viewport]);
  await p.screenshot({path:path.join(out,tag+'-scale'+value+'-settings.png')});
  const steps=value===80?[['uiScaleUp',90],['uiScaleDown',80]]:value===125?[['uiScaleDown',120],['uiScaleUp',125]]:[['uiScaleUp',110],['uiScaleUp',120],['uiScaleDown',110],['uiScaleDown',100],['uiScaleDown',90],['uiScaleUp',100]];
  for(const [action,expected]of steps){await click('[data-a="'+action+'"]');assert.equal(await p.evaluate(()=>UI.getUIScale().effective),expected,'real +/- control');}
  await click('[data-a="uiScaleReset"]');assert.equal(await p.evaluate(()=>UI.getUIScale().effective),100);
  await p.locator('#uiScaleSelect').selectOption(String(value));
  const after=await p.evaluate(()=>({camera:{...View.cam},rng:RND_STATE,save:serialize()}));
  if(JSON.stringify(before)!==JSON.stringify(after))fs.writeFileSync(path.join(out,tag+'-scale'+value+'-state-diff.json'),JSON.stringify({before,after}));
  assert.deepEqual(after,before,'scale alone preserves camera / Save8 / RNG');
  assert.deepEqual(await p.evaluate(()=>({sidebar:document.getElementById('sidebar').className,sel:View.sel?.id,sys:View.selSys?.id,camera:{...View.cam}})),panel,'panel/selection preserved');
  await click('#modal .mhd [data-a="closem"]');
  await p.waitForFunction(v=>localStorage.getItem('stars:uiScale')===String(v),value);
  await reload();await p.evaluate(()=>UI.uiScaleReady);assert.equal(await p.evaluate(()=>UI.getUIScale().effective),value,'reload preference');
  rows.push({value,picks,geometry,saveRngCameraUnchanged:true,saveSha256:createHash('sha256').update(after.save).digest('hex'),rng:after.rng,camera:after.camera,reload:true});fs.writeFileSync(path.join(out,tag+'-scales.json'),JSON.stringify(rows,null,2));
 }
 return rows;
};
