'use strict';
// Tanı preload'u: ürün/test akışını değiştirmez; Node tarafında gezinmeden bağımsız JSONL tutar.
const fs=require('fs'),path=require('path'),{chromium}=require('../node_modules/playwright');
const output=process.env.STARS_TRACE;
if(!output)throw Error('STARS_TRACE mutlak JSONL yolu gerekli');
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,'');
let seq=0,pages=0;
const write=(page,type,data)=>fs.appendFileSync(output,JSON.stringify({seq:++seq,page,type,...data})+'\n');
const pathname=u=>{try{return new URL(u).pathname;}catch{return String(u);}};
const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{
 const browser=await launch(...args),newContext=browser.newContext.bind(browser);
 browser.newContext=async(...args)=>{
  const context=await newContext(...args),ids=new WeakMap();
  await context.exposeBinding('__mp83trace',({page},data)=>write(ids.get(page),'dom',data));
  await context.addInitScript(mp88=>{
   const elements=new WeakMap();let nextElement=0;
   const describe=el=>{if(!el||!el.getBoundingClientRect)return null;const r=el.getBoundingClientRect();if(!elements.has(el))elements.set(el,++nextElement);return {node:elements.get(el),connected:el.isConnected,tag:el.tagName,id:el.id,j:el.dataset&&el.dataset.j,href:el.getAttribute('href')?.split('?')[0],rect:[r.x,r.y,r.width,r.height]};};
   const send=(event,e)=>{const touch=e&&e.changedTouches&&e.changedTouches[0],x=touch?touch.clientX:e&&e.clientX,y=touch?touch.clientY:e&&e.clientY;
    window.__mp83trace({event,at:performance.now(),path:location.pathname,scroll:[scrollX,scrollY],appScroll:document.getElementById('mp6App')?.scrollTop,focus:describe(document.activeElement),
     target:describe(e&&e.target),hit:Number.isFinite(x)&&Number.isFinite(y)?describe(document.elementFromPoint(x,y)):null,x,y,
     go:describe(document.querySelector('[data-j="go"]')),back:describe(document.querySelector('[data-j="home"]')),edit:describe(document.getElementById('jEditMe')),
     screen:window.MP1Join&&MP1Join.screen,setup:window.MP7Setup&&MP7Setup.active,trusted:e&&e.isTrusted}).catch(()=>{});};
   window.__mp83Describe=describe;
   for(const type of ['pointerdown','pointerup','touchstart','touchend','click','focusin','focusout','scroll','beforeunload','pagehide','popstate'])addEventListener(type,e=>{send(type,e);if(['pointerdown','pointerup','click'].includes(type))queueMicrotask(()=>send(type+':after',e));},true);
   if(mp88){
    for(const k of ['pushState','replaceState','back','forward','go']){const f=history[k];history[k]=function(...args){window.__mp83trace({event:'history:'+k,at:performance.now(),path:location.pathname,state:args[0]&&typeof args[0]==='object'?{mp1:args[0].mp1,mp7:args[0].mp7}:null,stack:new Error().stack}).catch(()=>{});return f.apply(this,args);};}
    const scroll=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(...args){window.__mp83trace({event:'scrollIntoView',at:performance.now(),path:location.pathname,target:describe(this),stack:new Error().stack}).catch(()=>{});return scroll.apply(this,args);};
   }
   let edit;new MutationObserver(()=>{const next=document.getElementById('jEditMe');if(next!==edit){edit=next;send('edit-replaced');}}).observe(document,{subtree:true,childList:true});
   addEventListener('error',e=>{window.__mp83trace({event:'error',message:e.message||'resource-error',path:location.pathname,resource:e.target&&e.target.src?new URL(e.target.src).pathname:null}).catch(()=>{});},true);
  },process.env.MP88_DIAG==='1');
  context.on('page',async page=>{
   const id=++pages;ids.set(page,id);
   page.on('framenavigated',f=>{if(f===page.mainFrame())write(id,'nav',{path:pathname(f.url())});});
   page.on('pageerror',e=>write(id,'pageerror',{message:e.message}));
   page.on('requestfailed',r=>write(id,'requestfailed',{path:pathname(r.url()),error:r.failure()?.errorText}));
   page.on('response',r=>{if(r.status()>=400)write(id,'http-error',{path:pathname(r.url()),status:r.status()});});
   const session=await context.newCDPSession(page);await session.send('Page.enable');
   session.on('Page.frameRequestedNavigation',e=>write(id,'navigation-request',{reason:e.reason,path:pathname(e.url),disposition:e.disposition}));
  });
  const newCDPSession=context.newCDPSession.bind(context);
  context.newCDPSession=async page=>{
   const session=await newCDPSession(page),send=session.send.bind(session);
   session.send=async(method,params)=>{
    if(method==='Input.dispatchTouchEvent')write(ids.get(page),'dispatch-before',{method,...params,snapshot:await page.evaluate(points=>{const p=points[0];const el=p&&document.elementFromPoint(p.x,p.y);const g=document.querySelector('[data-j=go]'),r=g&&g.getBoundingClientRect();return {path:location.pathname,hit:el&&{id:el.id,j:el.dataset.j,href:el.getAttribute('href')?.split('?')[0]},go:r&&[r.x,r.y,r.width,r.height],appScroll:document.getElementById('mp6App')?.scrollTop,focus:document.activeElement?.id};},params.touchPoints)});
    const result=await send(method,params);
    if(method==='Input.dispatchTouchEvent')write(ids.get(page),'dispatch-after',{method,...params});
    return result;
   };return session;
  };
  return context;
 };return browser;
};
