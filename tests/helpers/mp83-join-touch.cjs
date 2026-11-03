'use strict';
const assert=require('assert/strict');
// Odak sonrası scrollIntoView KATIL'ı kaydırabilir: her gerçek dokunuş güncel düğmeye gider.
async function joinBurst(page,count,tapAt){
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
  }
}
module.exports={joinBurst};
