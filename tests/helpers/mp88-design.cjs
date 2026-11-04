'use strict';
const assert=require('assert/strict');
async function arm(page){await page.evaluate(()=>{const audit=window.__design88={clicks:0,opens:0,unexpected:0},open=MP7Setup.open;MP7Setup.open=function(o){if(o.role==='guest'){if(MP7Setup.active)audit.unexpected++;else audit.opens++;}return open.apply(this,arguments);};document.addEventListener('click',e=>{if(e.target.closest('[data-j="editMe"]')){if(e.isTrusted)audit.clicks++;else audit.unexpected++;}},true);});}
async function enter(page,tap){
 const state=()=>page.evaluate(()=>({audit:__design88,active:MP7Setup.active,role:MP7Setup.role,screen:MP1Join.screen,path:location.pathname,head:!!document.getElementById('mp7Head'),menu:!document.getElementById('menu').classList.contains('hidden')}));
 const before=await state();assert.equal(before.path,'/mp/play');assert.equal(before.screen,'lobby');
 if(!before.active)await tap(); // No catch-to-PASS: a real action error always propagates.
 await page.waitForFunction(()=>MP7Setup.active&&document.getElementById('mp7Head')&&!document.getElementById('menu').classList.contains('hidden'));
 const after=await state();assert.equal(after.role,'guest');assert.equal(after.audit.clicks,1,'one trusted design click');assert.equal(after.audit.opens,1,'one actual setup open');assert.equal(after.audit.unexpected,0);assert(after.head&&after.menu);return {fromBurst:before.active,...after};
}
module.exports={arm,enter};
