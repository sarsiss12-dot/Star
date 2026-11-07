'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const relayMod=require('../research/mp1/server/relay'),out=process.env.STARS_OUTPUT||'/tmp/stars-beta-p01/panels';fs.mkdirSync(out,{recursive:true});
const save=fs.readFileSync(path.join(__dirname,'fixtures/stars-2210-06.sav.json'),'utf8');let relay,b,p;const results=[];
(async()=>{try{
 relay=relayMod.create({MP1_PORT:'0',MP1_BIND:'127.0.0.1',MP1_DEV:'1'});const s=await relay.start();b=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});p=await b.newPage({viewport:{width:960,height:540},isMobile:true,hasTouch:true});
 p.on('pageerror',e=>fs.appendFileSync(path.join(out,'pageerrors.log'),e.stack+'\n'));await p.goto('http://127.0.0.1:'+s.address().port);await p.waitForFunction(()=>typeof UI!=='undefined'&&typeof deserialize==='function');
 await p.evaluate(s=>{deserialize(s);$('title').classList.add('hidden');enterGame(true);LOOP.on=false;G.autoSave=false;UI.setSpeed(0);UI.closeModal();UI.modalPrevSpeed=0;G.cfg.council='acik';G.council=null;},save);
 if(process.env.BETA_P01_NEWS==='1'){const data=await require(process.env.BETA02_NEWS?'./helpers/beta-p02-news.cjs':'./helpers/beta-p01-news.cjs')(p,out);results.push({name:'#34 SP gerçek haber dokunması',status:'PASS',data});}else{
 const before=await require('./helpers/beta-p01-panels.cjs')(p,out,'sp-before-council');results.push({name:'#1 SP Konsey kurulmadan önce',status:'PASS',data:before});
 await p.evaluate(()=>{G.council={name:'P0.1 Denetim Konseyi',founder:0,members:[0,1],laws:{},targeted:{},treasury:0,president:0,termStart:G.day,terms:{0:1},voteIn:12,vote:null,dead:false};});
 const data=await require('./helpers/beta-p01-panels.cjs')(p,out,'sp');results.push({name:'#1 SP panel sahipliği',status:'PASS',data});
 await p.evaluate(()=>{const s=serialize();if(!deserialize(s))throw Error('Save8 reload failed');UI.closeModal();});
 const loaded=await require('./helpers/beta-p01-panels.cjs')(p,out,'sp-reloaded');results.push({name:'#1 SP Save8 yükleme sonrası',status:'PASS',data:loaded});
 }
 }catch(e){results.push({name:'#1 SP panel sahipliği',status:'FAIL',error:e.stack});if(p){await p.screenshot({path:path.join(out,'failure.png')});fs.writeFileSync(path.join(out,'failure-dom.json'),JSON.stringify(await p.evaluate(()=>({key:$('diploPane')._surfaceKey,html:$('diploPane').innerHTML.slice(0,3500)})),null,2));}console.error(e.stack)}finally{await b?.close();relay?.shutdown();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));const fail=results.filter(x=>x.status==='FAIL').length;console.log('GEÇEN: '+(results.length-fail)+' KALAN: '+fail);process.exitCode=fail?1:0}})();
