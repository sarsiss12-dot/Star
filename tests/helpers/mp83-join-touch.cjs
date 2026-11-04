'use strict';
const assert=require('assert/strict');
// Odak sonrası scrollIntoView KATIL'ı kaydırabilir: her gerçek dokunuş güncel düğmeye gider.
async function joinBurst(page,count,tapAt){
  // Wait for the existing clamped input-centering outcome before taking the FIRST coordinate.
  // A new point per tap cannot protect the gap between the bbox RPC and pointerdown.
  await page.waitForFunction(()=>{const input=document.activeElement,app=document.getElementById('mp6App');if(!input?.matches?.('input')||!app)return true;const r=input.getBoundingClientRect(),a=app.getBoundingClientRect();const target=Math.max(0,Math.min(app.scrollHeight-app.clientHeight,app.scrollTop+r.y+r.height/2-(a.y+a.height/2)));return Math.abs(app.scrollTop-target)<1.25;},undefined,{timeout:8000});
  let last;
  for(let i=0;i<count;i++){
    const point=await page.evaluate(()=>{
      const go=document.querySelector('[data-j="go"]');if(!go)return {gone:true,screen:window.MP1Join&&MP1Join.screen};
      const r=go.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
      return {x,y,hit:document.elementFromPoint(x,y)?.closest('[data-j]')===go};
    });
    // Lobi ilk dokunuşta gelirse kalan gerçek dokunuşları son noktada sürdür:
    // ürünün hayalet dokunma koruması ve toplam çift/üç dokunma kapsamı korunur.
    if(point.gone)assert(last&&point.screen==='lobby','KATIL yalnız lobiye geçişte kalkabilir');
    else{assert(point.hit,'KATIL merkezi görünür dokunma hedefi olmalı: '+JSON.stringify(point));last=point;}
    await tapAt(page,last.x,last.y);await page.waitForTimeout(25);
    // Controlled replay of MP87's recorded early-lobby + 40px scroll geometry. Never enabled in normal tests.
    if(process.env.MP88_LOBBY_REPLAY==='1'&&count>1&&i===0){await page.waitForFunction(()=>window.MP1Join&&MP1Join.screen==='lobby'&&document.getElementById('jEditMe'));await page.evaluate(()=>document.getElementById('mp6App').scrollTop=40);}
  }
}
module.exports={joinBurst};
