'use strict';
// Lossless Node-side action diagnostics; the original action/error are unchanged.
process.env.MP88_DIAG='1';
require('./mp83-input-trace.cjs');
const fs=require('fs'),path=require('path'),{chromium}=require('../node_modules/playwright');
const output=process.env.STARS_TRACE+'.actions.jsonl';fs.writeFileSync(output,'');let patched=false,seq=0;
const write=r=>fs.appendFileSync(output,JSON.stringify(r)+'\n');
async function sample(page,selector){try{return await page.evaluate(selector=>{const e=document.querySelector(selector.replace(/ >> nth=0$/, '')),r=e?.getBoundingClientRect();return {path:location.pathname,element:window.__mp83Describe?.(e),hit:r&&window.__mp83Describe?.(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),audit:window.__design88,setup:window.MP7Setup?.active,screen:window.MP1Join?.screen};},selector);}catch(e){return {diagnosticError:String(e)};}}
const launch=chromium.launch.bind(chromium);chromium.launch=async(...args)=>{const browser=await launch(...args),newContext=browser.newContext.bind(browser);browser.newContext=async(...args)=>{const c=await newContext(...args);c.on('page',page=>{if(patched)return;patched=true;const proto=Object.getPrototypeOf(page.locator('body')),tap=proto.tap;proto.tap=async function(...args){const id=++seq,page=this.page(),selector=this._selector,before=await sample(page,selector),start=Date.now();write({id,event:'tap-before',selector,before});try{const r=await tap.apply(this,args);write({id,event:'tap-after',selector,ms:Date.now()-start,after:await sample(page,selector)});return r;}catch(e){write({id,event:'tap-error',selector,ms:Date.now()-start,name:e.name,message:e.message,stack:e.stack,before,after:await sample(page,selector)});throw e;}};});return c;};return browser;};
