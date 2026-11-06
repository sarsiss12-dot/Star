'use strict';
const fs=require('fs'),path=require('path');let seq=0;
module.exports=async function arm(page,out){
 const id=++seq,file=path.join(out,'menu-'+id+'.jsonl');fs.writeFileSync(file,'');
 await page.exposeBinding('__menu89',(_,row)=>fs.appendFileSync(file,JSON.stringify(row)+'\n'));
 await page.evaluate(()=>{let n=0,active=true;const ids=new WeakMap();let serial=0;
  const el=e=>{if(!e?.getBoundingClientRect)return null;if(!ids.has(e))ids.set(e,++serial);const r=e.getBoundingClientRect();return {node:ids.get(e),id:e.id,tag:e.tagName,action:e.dataset?.m||e.dataset?.a||e.dataset?.j,text:e.tagName==='BUTTON'?e.textContent.trim().slice(0,80):undefined,connected:e.isConnected,rect:[r.x,r.y,r.width,r.height]};};
  const snap=(kind,e)=>{const b=document.getElementById('mp1Btn'),r=b?.getBoundingClientRect();window.__menu89({kind,t:performance.now(),ready:document.readyState,visibility:document.visibilityState,path:location.pathname,screen:window.MP1Host?.screen,button:el(b),hit:r&&el(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),target:el(e?.target),trusted:e?.isTrusted,xy:e&&[e.clientX,e.clientY],animations:document.getAnimations().filter(a=>a.effect?.target===b||a.effect?.target?.contains?.(b)).map(a=>({state:a.playState,time:a.currentTime,name:a.animationName}))}).catch(()=>{});};
  const raf=()=>{if(!active)return;if(n++<8||n%10===0)snap('frame');requestAnimationFrame(raf);};requestAnimationFrame(raf);
  for(const k of ['pointerdown','pointerup','touchstart','touchend','click','beforeunload'])addEventListener(k,e=>{if(active)snap(k,e);},true);
  window.__menu89finish=()=>{snap('finish');active=false;};snap('arm');
 });
 return async error=>{await page.evaluate(()=>__menu89finish()).catch(()=>{});if(error){fs.writeFileSync(path.join(out,'menu-'+id+'-error.json'),JSON.stringify({name:error.name,message:error.message,stack:error.stack},null,2));await page.screenshot({path:path.join(out,'menu-'+id+'-failure.png')}).catch(()=>{});}};
};
