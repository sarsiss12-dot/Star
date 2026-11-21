'use strict';
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib');
const {runtime}=require('../../tests/helpers/runtime');
const h=runtime({processGlobal:true}), observations=[];
h.run(fs.readFileSync(path.join(__dirname,'forecast-engine.js'),'utf8'));
for(const name of ['natural-11','medium-99','natural-404']){
  const rows=JSON.parse(z.gunzipSync(fs.readFileSync(path.join(__dirname,'raw',name+'.json.gz'))));
  for(let month=6;month+6<rows.length;month+=6){
    h.sb.input=fs.readFileSync(path.join(process.env.STARS_WORK||'/tmp/stars-pressure',name,month+'.save'),'utf8');
    h.run('deserialize(input)');
    for(const horizon of [6,12,24]){
      if(month+horizon>=rows.length)continue;
      const forecasts=h.run('G.emps.filter(e=>e.ai&&!e.wild&&!e.dead&&!e.crisisSide).map(e=>predict(e,'+horizon+'))');
      for(const f of forecasts){
        const actual=rows[month+horizon].states.find(e=>e.id===f.id);if(!actual)continue;
        const window=rows.slice(month+1,month+horizon+1).map(row=>row.states.find(e=>e.id===f.id)).filter(Boolean);
        const first={};
        for(const r of Object.keys(f.sums))first[r]=window.findIndex(s=>s.net[r]<0&&s.stock[r]<-3*s.net[r])+1;
        observations.push({name,month,...f,actual:actual.stock,actualPop:actual.pop,first});
      }
    }
  }
}
fs.writeFileSync(path.join(__dirname,'raw','forecast.json.gz'),z.gzipSync(JSON.stringify(observations)+'\n'));
