'use strict';
const assert=require('assert/strict');
module.exports=async(p,mobile)=>{
 const before=await p.evaluate(()=>({save:serialize(),rng:RND_STATE,cam:{...View.cam}})),rows=[];
 for(const value of mobile?[100]:[80,100,125]){
  await p.selectOption('#uiScaleSelect',String(value));
  const row=await p.evaluate(()=>{const box=document.querySelector('#modal .mbox').getBoundingClientRect(),button=document.querySelector('#modal [data-a="closem"]'),r=button.getBoundingClientRect(),map=document.getElementById('map').getBoundingClientRect();return {scale:UI.getUIScale(),viewport:[innerWidth,innerHeight],canvas:[map.x,map.y,map.width,map.height],modal:[box.x,box.y,box.width,box.height],hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-a="closem"]')===button};});
  assert.equal(row.scale.effective,value);assert(row.hit,'real close button and hit box coincide');assert.deepEqual(row.canvas,[0,0,...row.viewport]);assert(row.modal[0]>=-1&&row.modal[1]>=-1&&row.modal[0]+row.modal[2]<=row.viewport[0]+1&&row.modal[1]+row.modal[3]<=row.viewport[1]+1);assert.deepEqual(await p.evaluate(()=>({save:serialize(),rng:RND_STATE,cam:{...View.cam}})),before,'UI scale preserves full Save8/RNG/camera');rows.push(row);
 }
 if(mobile)assert(await p.locator('[data-a="uiScaleUp"]').isDisabled());
 await p.selectOption('#uiScaleSelect','100');return rows;
};
