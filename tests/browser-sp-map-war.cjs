'use strict';

const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(process.env.STARS_ROOT || path.join(__dirname, '..'));
const server = createServer((req, res) => {
  const route = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (route === '/' ? '/index.html' : route));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    const ext = path.extname(file);
    res.setHeader('Content-Type', ext === '.js' ? 'text/javascript' : ext === '.html' ? 'text/html' : 'application/json');
    res.end(data);
  });
});

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    executablePath: process.env.STARS_CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.evaluate(() => {
      setupGame({ ...CFG, seed: 22, size: 'orta', aiCount: 5 });
      G.autoSave = false;
      $('title').classList.add('hidden');
      enterGame(true);
      LOOP.on = false;
      UI.setSpeed(0);
      UI.closeModal();
      View.selSys = G.sys[G.p.home];
      UI.tab('sistem');
      UI.refresh();
      const planet=View.selSys.planets[0];
      const canvas=document.createElement('canvas');
      canvas.className='pspr';canvas.width=canvas.height=26;
      canvas.dataset.t=planet.t;canvas.dataset.s=planet.seed;
      $('game').append(canvas);UI.paintSprites();
    });
    const orb=page.locator('#panel .pOrb').first();
    await orb.waitFor();
    assert.notEqual(await orb.evaluate(c=>getComputedStyle(c).backgroundColor),'rgba(0, 0, 0, 0)');
    const thumb = page.locator('#game canvas.pspr').first();
    await thumb.waitFor();
    const alpha = c => c.getContext('2d').getImageData(c.width/2|0,c.height/2|0,1,1).data[3];
    assert(await thumb.evaluate(alpha) > 0);
    await page.evaluate(() => {
      const c = document.querySelector('#game canvas.pspr');
      const sprite = ART.planet(c.dataset.t, +c.dataset.s, 26);
      window.oldPlanetSprite = sprite;
      sprite.getContext('2d').clearRect(0,0,sprite.width,sprite.height);
      c.getContext('2d').clearRect(0,0,c.width,c.height);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => {
      const c = document.querySelector('#game canvas.pspr');
      if (!c) return false;
      const sprite = ART.planet(c.dataset.t, +c.dataset.s, 26);
      return sprite !== window.oldPlanetSprite && c.getContext('2d').getImageData(c.width/2|0,c.height/2|0,1,1).data[3] > 0;
    }, null, {timeout: 5000});
    console.log('PASS boş kaynak sprite ve gezegen tuvali görünürlük dönüşünde yeniden çizildi');

    const draws = await page.evaluate(() => {
      const known=View.territoryRegions().find(r=>r.owner===G.p.id);
      const fake={save(){},restore(){},drawImage(){this.count++;},count:0};
      View.drawTerritoryEmblems(fake,[known]);
      return fake.count;
    });
    assert(draws > 0);
    const front = await page.evaluate(() => {
      G.warLedger=warLedgerEmpty();G.settlements=settlementEmpty();G.feds=[];G.council=null;
      for(const e of G.emps){
        e.war={};e.ally={};e.civics=[];e.mizac='yayilmaci';e._pers='yayilmaci';
        e.overlord=null;e.dead=false;e.wg={};e.res.etk=1000;
        for(const o of G.emps)e.contact[o.id]=true;
      }
      for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=G.emps.map(e=>e.id);}
      const [p,t,m]=[G.p,G.emps[2],G.emps[3]];
      const land=G.sys.filter(s=>s.planets.length&&!s.planets.some(p=>p.col)).slice(0,4);
      declareWar(p,t);
      executeDeal({from:m.id,to:p.id,give:[{t:'warOn',target:t.id}],want:[]});
      land.forEach((s,i)=>{s.owner=t.id;captureSystem(s,i<2?p.id:m.id);});
      const record=warLedgerFind(p.id,t.id);
      makePeace(p,t);
      window.testLand=land;
      WarCenterUI.open();
      return record.id;
    });
    await page.locator('#modal [data-a="warCenterTab"][data-x="past"]').tap();
    await page.locator('#modal [data-a="warCenterDetail"][data-x="'+front+'"]').tap();
    await page.locator('#modal [data-a="shareOpen"]').tap();
    const recipient=page.locator('#modal [data-share-recipient]').first();
    const first=await recipient.inputValue();
    const other=await recipient.locator('option').evaluateAll((options,current)=>options.find(o=>o.value!==current).value,first);
    await recipient.selectOption(other);
    assert.equal(await recipient.inputValue(),other);
    assert.deepEqual(await page.evaluate(()=>window.testLand.map(s=>s.owner)),[0,0,3,3]);
    console.log('PASS geçmiş savaş, paylaşım kısayolu, alıcı değişikliği ve mutasyonsuz taslak');
    await page.evaluate(() => UI.closeModal());
    await page.evaluate(() => UI.saveMenu());
    const opacity=page.locator('#territoryEmblemOpacity');
    await opacity.focus();
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#territoryEmblemOpacityValue').textContent(),'Kapalı');
    await page.waitForFunction(() => localStorage.getItem('stars:territoryEmblemOpacity')==='0');
    await page.reload();
    await page.waitForFunction(() => UI.territoryEmblemOpacity===0);
    console.log('PASS harita arması çiziliyor, %0 ve cihaz tercihi çalışıyor');

    await page.evaluate(() => {
      $('title').classList.add('hidden');
      $('menu').classList.remove('hidden');
      SETUP_STEP='galaksi';
      CFG.aiCount=8;
      safeRenderSetup();
    });
    /* BETA-RIVAL-BLOCS.0: sayı kutuları (klavye) yerine Az/Orta/Çok + −/+ — aynı amaç: sabit 3 rakip doktrin. */
    await page.locator('#rivalPresets [data-x="orta"]').tap();
    for (let i=0;i<12;i++){
      const r=await page.evaluate(()=>CFG.aiRivals);
      if (r.min===3&&r.max===3) break;
      const x=r.min<3?'min:1':r.min>3?'min:-1':r.max>3?'max:-1':'max:1';
      await page.locator(`.rivalSect [data-x="${x}"]`).tap();
    }
    assert.deepEqual(await page.evaluate(()=>CFG.aiRivals),{min:3,max:3});
    await page.locator('[data-a="start"]').tap();
    assert.equal(await page.evaluate(() => G.emps.filter(e=>e.ai&&!e.wild&&RIVAL_PERSONAS.includes(personaKey(e))).length),3);
    assert.deepEqual(errors,[]);
    console.log('PASS mobil pregame sabit rakip sayısı gerçek kurulumda uygulanıyor');
    await context.close();
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(error=>{ console.error(error);server.close();process.exitCode=1; });
