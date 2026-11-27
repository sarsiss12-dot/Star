'use strict';

const path=require('node:path'),assert=require('node:assert/strict');
const {runtime}=require('../../tests/helpers/runtime');
const [control,candidate]=process.argv.slice(2);
if(!control||!candidate)throw Error('Kullanım: node deal-shape.cjs KONTROL ADAY');
const cases={
  nullOffer:'null',
  wrongGive:`{from:0,to:1,give:'bozuk',want:null}`,
  wrongWant:`{from:0,to:1,give:[{t:'res',r:'min',v:1}],want:'bozuk'}`,
  nullItem:`{from:0,to:1,give:[null],want:[]}`,
};

function replay(root){
  const rows={};
  for(const [key,source] of Object.entries(cases)){
    const h=runtime({root:path.resolve(root)});
    h.loadSave(path.join(__dirname,'../../tests/fixtures/stars-2210-06.sav.json'));
    h.run(`var A=G.p,B=G.emps[1];A.contact[1]=B.contact[0]=true;
      for(const e of [A,B]){e.civics=[];e.mizac=e._pers='yayilmaci';}
      A.res.min=1000;A.res.etk=1000;`);
    const save=h.run('serialize()'),rng=h.run('RND_STATE'),stock=h.run('A.res.min');
    const quote=h.run(`dealQuote(${source}).ok`);
    let result;
    try{result=h.run(`executeDeal(${source})`);}catch(e){result=e.name+': '+e.message;}
    rows[key]={quote,result,saveEqual:h.run('serialize()')===save,rngEqual:h.run('RND_STATE')===rng,minerals:h.run('A.res.min')-stock};
  }
  return rows;
}

const before=replay(control),after=replay(candidate);
console.log(JSON.stringify({before,after},null,2));
assert(before.wrongWant.result===true&&before.wrongWant.minerals===-1&&!before.wrongWant.saveEqual);
for(const [key,value] of Object.entries(after))assert.deepEqual(value,{quote:false,result:false,saveEqual:true,rngEqual:true,minerals:0},key);
