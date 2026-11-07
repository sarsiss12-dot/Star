'use strict';
// Pin the presentation-only delta against the MP.8.8 canonical runtime, not a normalized Save8.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'..'),sha=s=>crypto.createHash('sha256').update(s).digest('hex'),read=f=>require('./helpers/beta-p01-preservation.cjs').stripReviewedP01(f,fs.readFileSync(path.join(root,f),'utf8'));
let ui=read('ui.js').replace(/    \/\* MP\.8\.9: local presentation controls;[\s\S]*?    \/\* END MP\.8\.9 SAVE CONTROLS \*\/\n/,'').replace(/\n\/\* MP\.8\.9: device-local UI scale\.[\s\S]*?\/\* END MP\.8\.9 UI SCALE \*\/\n/,'');
ui=ui.replace("      // MP.8.9: DOM rectangles are screen CSS pixels; fixed flyouts inherit the tools' local zoom.\n      const zoom = this.getUIScale ? this.getUIScale().effective / 100 : 1;\n",'');
assert.equal(ui.split("Math.max(1, vx + vw - margin - left) / zoom + 'px'").length,2);ui=ui.replace("Math.max(1, vx + vw - margin - left) / zoom + 'px'","Math.max(1, vx + vw - margin - left) + 'px'");
assert.equal(ui.split("const width = menu.offsetWidth * zoom;").length,2);ui=ui.replace("const width = menu.offsetWidth * zoom;","const width = menu.offsetWidth;");
assert.equal(ui.split("Math.max(1, bottom - top) / zoom + 'px'").length,2);ui=ui.replace("Math.max(1, bottom - top) / zoom + 'px'","Math.max(1, bottom - top) + 'px'");
assert.equal(ui.split("const height = menu.offsetHeight * zoom;").length,2);ui=ui.replace("const height = menu.offsetHeight * zoom;","const height = menu.offsetHeight;");
assert.equal(ui.split("menu.style.left = left / zoom + 'px';").length,2);ui=ui.replace("menu.style.left = left / zoom + 'px';","menu.style.left = left + 'px';");
assert.equal(ui.split("bottom - height)) / zoom + 'px';").length,2);ui=ui.replace("bottom - height)) / zoom + 'px';","bottom - height)) + 'px';");
assert.equal(sha(ui),'1c746c4503f94a36e66c288cfc8715fd095fd3011fbc0f849bacabc752999f0f','only reviewed UI additions and flyout unit conversion');
assert.equal(sha(read('index.html').replace(/\/\* MP\.8\.9: bounded UI scale;[\s\S]*?\/\* END MP\.8\.9 UI SCALE CSS \*\/\n/,'')),'c859ad7204a3dac2df210f63eb7eb577a193812370ba3b39d7e42be06f72e427','existing layout preserved');
assert.equal(sha(read('main.js').replace("const BUILD_ID = '96h10p6';","const BUILD_ID = '96h10p5';")),'312d9fdd9f9e3c0fd8638b2fdc0d980828e4880a5be74316c1cca1ac532e32ef','Save8 / simulation unchanged');
const original=JSON.parse(require('child_process').execFileSync('git',['show','8ce738b42636cd792a8d552230ca8194a4da053f:RELEASE-MANIFEST.json'],{cwd:root}));
for(const [file,hash] of Object.entries(original.files))if(!['ui.js','index.html','main.js','sw.js'].includes(file))assert.equal(sha(read(file)),hash,file+' unchanged');
console.log('PASS exact reviewed P0.1 delta reversed; MP89 UI/layout and untouched engine/map source pins preserved');
