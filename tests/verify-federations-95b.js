'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{campaign}=require('./measure-federations-95b');
const dir=path.join(__dirname,'fed-95b/continuity');fs.mkdirSync(dir,{recursive:true});
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function run(name,options){const capture=path.join(dir,name+'.sav.json');const r=campaign(path.resolve(__dirname,'..'),11,120,{...options,capture});const save=JSON.parse(fs.readFileSync(capture));fs.unlinkSync(capture);return {report:{rng:r.rng,saveHash:r.saveHash,ms:r.ms},save};}
const one=run('one',{}),two=run('two',{}),reload=run('reload',{reloadAt:60}),bare=run('bare',{observe:false});
function diffs(a,b,p='',out=[]){if(JSON.stringify(a)===JSON.stringify(b))return out;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))diffs(a[k],b[k],p+'/'+k,out);}else out.push({path:p,a,b});return out;}
const differences=diffs(one.save,reload.save),bareDiffs=diffs(one.save,bare.save);
const cacheFields=new Set(['_supAt','_gateAt','_prof','_powAt','_powC','_trAt','_trCache']);
const gameplay=differences.filter(x=>!/^\/emps\/\d+\//.test(x.path)||!cacheFields.has(x.path.split('/')[3]));
const bareGameplay=bareDiffs.filter(x=>!/^\/emps\/\d+\//.test(x.path)||!cacheFields.has(x.path.split('/')[3]));
const result={seed:11,months:120,reloadAt:60,runs:{one:one.report,two:two.report,reload:reload.report,bare:bare.report},repeatEqual:one.report.saveHash===two.report.saveHash,rngEqual:[two,reload,bare].every(x=>x.report.rng===one.report.rng),reloadGameplayEqual:gameplay.length===0,observerGameplayEqual:bareGameplay.length===0,reloadDifferences:differences,observerDifferences:bareDiffs};
fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({repeat:result.repeatEqual,rng:result.rngEqual,reload:result.reloadGameplayEqual,observer:result.observerGameplayEqual,differences:gameplay.slice(0,10)}));process.exitCode=result.repeatEqual&&result.rngEqual&&result.reloadGameplayEqual&&result.observerGameplayEqual?0:1;
