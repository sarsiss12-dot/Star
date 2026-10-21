'use strict';
// Production scripts load AFTER the event/DOM host. Native mode uses actual
// Skia Canvas pixels; this host does not simulate a browser compositor or GPU.
const fs = require('fs'), path = require('path'), vm = require('vm');
function runtime({root = path.resolve(__dirname, '../..'), native = false,
                  local = new Map(), width = 900, height = 420, dpr = 1} = {}) {
  let createCanvas;
  if (native) {
    const mod = require.resolve('@napi-rs/canvas', {
      paths: [root, path.resolve(__dirname,'..'), process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)
    });
    createCanvas = require(mod).createCanvas;
  }
  const elements = new Map(), timers = new Map(), raf = new Map();
  const canvases = [], downloads = [], messages = [];
  let timerId = 0, clock = 1000;
  function eventTarget(o = {}) {
    o.listeners = new Map();
    o.addEventListener = (type, fn) => {
      const list = o.listeners.get(type) || [];
      if (!list.includes(fn)) list.push(fn);
      o.listeners.set(type, list);
    };
    o.removeEventListener = (type, fn) => o.listeners.set(type,
      (o.listeners.get(type) || []).filter(f => f !== fn));
    o.emit = (type, e = {}) => {
      for (const f of [...(o.listeners.get(type) || [])])
        f({type, target:o, preventDefault(){}, ...e});
    };
    return o;
  }
  function mockContext(canvas) {
    const state = {canvas, globalAlpha:1, globalCompositeOperation:'source-over'};
    for (const key of ['fill','stroke','beginPath','arc','moveTo','lineTo',
      'fillRect','fillText','strokeText','save','restore','setLineDash',
      'drawImage','closePath','clearRect','translate','rotate','scale','ellipse',
      'rect','strokeRect','quadraticCurveTo','bezierCurveTo','clip','arcTo',
      'setTransform','resetTransform','putImageData']) state[key] = () => {};
    state.getTransform = () => ({a:1,b:0,c:0,d:1,e:0,f:0});
    state.measureText = text => ({width:String(text).length * 7});
    state.createRadialGradient = state.createLinearGradient = () => ({addColorStop(){}});
    state.createImageData = (w,h) => ({data:new Uint8ClampedArray(w*h*4),width:w,height:h});
    state.getImageData = () => ({data:new Uint8ClampedArray([5,7,15,255])});
    return state;
  }
  function element(tag = 'div') {
    const o = eventTarget(tag === 'canvas' && native ? createCanvas(width,height) : {});
    const classes = new Set(), attributes = new Map();
    Object.assign(o, {tagName:tag.toUpperCase(), id:'', className:'', style:{}, dataset:{},
      innerHTML:'', textContent:'', scrollTop:0, children:[], parentNode:null,
      clientWidth:width, clientHeight:height, offsetWidth:width, offsetHeight:height,
      classList:{add(...names){names.forEach(n=>classes.add(n));},
        remove(...names){names.forEach(n=>classes.delete(n));},
        contains:n=>classes.has(n),toggle(n,v){
          v = v === undefined ? !classes.has(n) : v;
          if(v) classes.add(n); else classes.delete(n); return v;
        }},
      appendChild(child){if(child.parentNode) child.parentNode.removeChild(child);
        this.children.push(child);child.parentNode=this;return child;},
      removeChild(child){const i=this.children.indexOf(child);if(i<0) throw Error('child missing');
        this.children.splice(i,1);child.parentNode=null;return child;},
      replaceChild(next,old){const i=this.children.indexOf(old);if(i<0) throw Error('child missing');
        this.children[i]=next;next.parentNode=this;old.parentNode=null;
        if(old.id) elements.set(old.id,next);return old;},
      remove(){if(this.parentNode)this.parentNode.removeChild(this);},
      setAttribute(k,v){attributes.set(k,String(v));},getAttribute:k=>attributes.get(k)||null,
      querySelector:()=>null,querySelectorAll:()=>[],closest:()=>null,
      getBoundingClientRect:()=>({left:0,top:0,right:width,bottom:height,width,height}),
      focus(){},click(){if(tag==='a') downloads.push({name:this.download,url:this.href});}
    });
    if(tag === 'canvas') {
      const captured = new Set();
      o.setPointerCapture = id => captured.add(id);
      o.releasePointerCapture = id => captured.delete(id);
      o.hasPointerCapture = id => captured.has(id);
      if(!native) {o.width=width;o.height=height;const ctx=mockContext(o);o.getContext=()=>ctx;}
      canvases.push(o);
    }
    return o;
  }
  const body=element('body');
  function get(id){if(!elements.has(id)){const e=element(['map','menuStars','empPortrait'].includes(id)?'canvas':'div');
    e.id=id;elements.set(id,e);body.appendChild(e);}return elements.get(id);}
  get('map'); get('game').classList.add('hidden');
  const doc=eventTarget({getElementById:get,createElement:element,querySelector:()=>null,
    querySelectorAll:()=>[],body,documentElement:element('html'),hidden:false,
    visibilityState:'visible',fullscreenElement:null});
  const win=eventTarget({innerWidth:width,innerHeight:height,devicePixelRatio:dpr,
    location:{protocol:'https:',href:'https://stars.test/'},matchMedia:()=>({matches:false}),
    localStorage:{getItem:k=>local.has(k)?local.get(k):null,
      setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k)},
    getComputedStyle:e=>({display:'block',visibility:'visible',opacity:'1',...e.style})});
  const sb={console:{log(){},warn(...a){messages.push(a.map(String).join(' '));},error(){}},
    document:doc,window:win,navigator:{userAgent:'STARS test host',standalone:false},
    localStorage:win.localStorage,Math,Date,JSON,Set,Map,Promise,Error,Array,Object,
    String,Number,Boolean,RegExp,Uint8ClampedArray,Float32Array,Int32Array,Proxy,Reflect,
    Symbol,parseInt,parseFloat,isFinite,isNaN,Blob,
    URL:{createObjectURL:()=> 'blob:stars-test',revokeObjectURL(){}},
    performance:{now:()=>++clock},
    setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;},
    clearTimeout:id=>timers.delete(id),setInterval:()=>0,clearInterval(){},
    requestAnimationFrame:fn=>{const id=++timerId;raf.set(id,fn);return id;},
    cancelAnimationFrame:id=>raf.delete(id)};
  sb.globalThis=sb;
  const context=vm.createContext(sb);
  for(const file of ['main.js','map.js','combat.js','ai.js','diplomacy.js',
                    'economy.js','commerce.js','news.js','inbox.js','construction.js','ui.js','archive-ui.js','commerce-ui.js','economic-ledger.js','economy-ui.js','audio.js'])
    if(!['commerce.js','commerce-ui.js','economic-ledger.js','economy-ui.js','news.js','inbox.js','construction.js','archive-ui.js'].includes(file)||fs.existsSync(path.join(root,file)))
      vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  return {sb,doc,win,elements,canvases,timers,raf,downloads,messages,local,
    advance(ms){clock+=ms;},
    run(code){return vm.runInContext(code,context);},
    flushTimers(limit=50){let n=0;while(timers.size){if(++n>limit)throw Error('timer loop');
      const [id,job]=timers.entries().next().value;timers.delete(id);job.fn();}},
    loadSave(file){sb.__save=fs.readFileSync(file,'utf8');
      this.run('deserialize(__save); delete __save; View.init(); View.fit(); G.speed=0;');
      get('game').classList.remove('hidden');timers.clear();}
  };
}
module.exports={runtime};
