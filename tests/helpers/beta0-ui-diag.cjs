'use strict';
const fs=require('fs'),path=require('path');
module.exports=async(p,out,label)=>{
 const file=path.join(out,label+'-events.jsonl'),write=row=>fs.appendFileSync(file,JSON.stringify({nodeAt:Date.now(),...row})+'\n');
 await p.exposeBinding('__beta0emit',(_,row)=>write(row));
 p.on('crash',()=>write({kind:'page-crash'}));p.on('pageerror',e=>write({kind:'pageerror',message:e.message}));p.on('framenavigated',f=>{if(f===p.mainFrame())write({kind:'navigation',path:new URL(f.url()).pathname})});
 const heartbeat=setInterval(()=>write({kind:'node-heartbeat'}),1000);heartbeat.unref();p.once('close',()=>clearInterval(heartbeat));
 await p.addInitScript(()=>{const ids=new WeakMap();let serial=0,frames=0,last='';
  const el=e=>{if(!e?.getBoundingClientRect)return null;if(!ids.has(e))ids.set(e,++serial);const r=e.getBoundingClientRect();return {node:ids.get(e),id:e.id,tag:e.tagName,action:e.dataset?.a||e.dataset?.m||e.dataset?.j,connected:e.isConnected,rect:[r.x,r.y,r.width,r.height]};};
  const send=(kind,event)=>{try{const modal=document.getElementById('modal'),select=document.getElementById('uiScaleSelect'),create=document.querySelector('[data-m="create"]'),target=event?.target,r=target?.getBoundingClientRect?.();__beta0emit({kind,t:performance.now(),origin:performance.timeOrigin,path:location.pathname,ready:document.readyState,viewport:[innerWidth,innerHeight,devicePixelRatio],scroll:[scrollX,scrollY,document.getElementById('mp1')?.scrollTop],focused:el(document.activeElement),target:el(target),hit:r&&el(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),trusted:event?.isTrusted,xy:event&&[event.clientX,event.clientY],modalHead:modal?.querySelector('.mhd')?.textContent,modalClass:modal?.className,select:el(select),create:el(create),screen:window.MP1Host?.screen,animations:document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().activeDuration)&&a.playState==='running').slice(0,8).map(a=>({time:a.currentTime,target:el(a.effect.target)}))}).catch(()=>{});}catch{}}
  for(const k of ['pointerdown','pointerup','touchstart','touchend','click','focusin','focusout','scroll','popstate','hashchange','keydown'])addEventListener(k,e=>send(k,e),true);
  addEventListener('DOMContentLoaded',()=>{send('dom-ready');new MutationObserver(()=>{const m=document.getElementById('modal'),key=(m?.className||'')+'|'+(m?.querySelector('.mhd')?.textContent||'')+'|'+!!document.getElementById('uiScaleSelect')+'|'+window.MP1Host?.screen;if(key!==last){last=key;send('dom-state');}}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});});
  const frame=()=>{if(frames++<12||frames%30===0)send('frame');requestAnimationFrame(frame)};requestAnimationFrame(frame);
 });
};
