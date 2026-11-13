'use strict';

const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(process.env.STARS_ROOT || path.join(__dirname, '..'));
const server = createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end();
    const mime = { '.js': 'text/javascript', '.html': 'text/html' };
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/json');
    res.end(data);
  });
});

function setup() {
  setupGame({ ...CFG, seed: 22, size: 'orta', aiCount: 5 });
  G.autoSave = false;
  $('title').classList.add('hidden');
  enterGame(true);
  LOOP.on = false;
  UI.setSpeed(0);
  UI.closeModal();
  UI.tab('sistem');
  UI.refresh();
}

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    executablePath: process.env.STARS_CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    for (const [width, height, mobile] of [[640, 360, true], [800, 360, true], [915, 412, true], [1280, 720, false]]) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
      try {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('http://127.0.0.1:' + server.address().port);
        await page.evaluate(setup);
        await page.evaluate(() => {
          const start = G.sys[G.p.home];
          const military = G.fleets.find(f => f.e === G.p.id && f.sys === start.id && isArmed(f));
          if (!military) throw new Error('Başlangıç savaş filosu bulunamadı');
          View.sel = military;
          UI.tab('filo');
          View.cam.x = start.x;
          View.cam.y = start.y;
          UI.refresh();
        });
        const bar = page.locator('#seltag');
        const route = bar.locator('[data-a="route"]');
        const touch = element => mobile ? element.tap() : element.click();
        const layout = () => bar.evaluate(el => {
          const parent = el.getBoundingClientRect();
          const buttons = [...el.querySelectorAll('button')].map(b => b.getBoundingClientRect());
          const sidebar = $('sidebar');
          const right = sidebar.classList.contains('off') ? innerWidth : sidebar.getBoundingClientRect().left;
          return {
            count: buttons.length,
            fits: parent.right <= right + 1 && buttons.every(b => b.left >= parent.left && b.right <= parent.right && b.height >= 44),
            singleRow: new Set(buttons.map(b => b.top)).size === 1,
          };
        });
        assert.deepEqual(await layout(), { count: 3, fits: true, singleRow: true }, 'açık panel');
        await touch(page.locator('#sbToggle'));
        await page.waitForFunction(() => $('sidebar').classList.contains('off'));
        assert.deepEqual(await layout(), { count: 3, fits: true, singleRow: true }, 'kapalı panel');

        const target = await page.evaluate(() => {
          const fleet = View.sel;
          const source = G.sys[fleet.sys];
          const target = source.lanes.map(id => G.sys[id]).find(s => pSeen(s) && findPathAllowed(G.p, fleet, source.id, s.id)?.length);
          if (!target) throw new Error('Geçilebilir komşu bulunamadı');
          View.cam.x = target.x;
          View.cam.y = target.y;
          View.aimFleet = G.fleets.find(f => f.e === G.p.id && f.id !== fleet.id)?.id;
          if (View.aimFleet === undefined) throw new Error('İkinci filo bulunamadı');
          const secondary = G.fleets.find(f => f.id === View.aimFleet);
          window.hudRouteFixture = { fleet, target, secondary, initialPath: secondary.path.slice() };
          document.addEventListener('click', event => {
            if (event.target.closest('#seltag [data-a="route"]')) {
              window.hudRouteClick = { trusted: event.isTrusted, label: event.target.textContent, route: View.route };
            }
          });
          return { ...View.w2s(target.x, target.y), id: target.id };
        });
        await touch(route);
        assert.deepEqual(await page.evaluate(() => window.hudRouteClick), { trusted: true, label: 'HEDEF SEÇ', route: true });
        assert.deepEqual(await layout(), { count: 3, fits: true, singleRow: true }, 'hedef seçme çubuğu');
        assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, target), 'map');
        if (mobile) await page.touchscreen.tap(target.x, target.y);
        else await page.mouse.click(target.x, target.y);
        const order = await page.evaluate(() => {
          const { fleet, secondary, initialPath } = window.hudRouteFixture;
          return { target: fleet.path.at(-1), secondary: secondary.path, initialPath, button: $('seltag').querySelector('[data-a="route"]').textContent };
        });
        assert.equal(order.target, target.id);
        assert.deepEqual(order.secondary, order.initialPath);
        assert.equal(order.button, '+DURAK');

        await page.evaluate(() => {
          $('alerts').replaceChildren();
          UI.alert('Geçici bildirim '.repeat(12));
          UI.notify({ kind: 'test', title: 'Olay kartı', sub: 'Öncelikli karar', ico: '✉' });
        });
        await page.locator('#inbox .nCard').first().waitFor();
        const layer = await page.evaluate(() => {
          const inbox = $('inbox'), alerts = $('alerts');
          const a = alerts.getBoundingClientRect(), b = inbox.querySelector('.nCard').getBoundingClientRect();
          return {
            overlap: Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top),
            above: Number(getComputedStyle(inbox).zIndex) > Number(getComputedStyle(alerts).zIndex),
          };
        });
        assert.deepEqual(layer, { overlap: true, above: true }, 'çakışan olay kartı geçici bildirimlerin üzerinde');
        await page.evaluate(() => UI.saveMenu());
        const range = page.locator('#alertOpacity');
        const save = await page.evaluate(() => serialize());
        await range.focus();
        await page.keyboard.press('Home');
        assert.equal(await page.locator('#alertOpacityValue').textContent(), '%25');
        assert.equal(await page.locator('#alerts').evaluate(el => getComputedStyle(el).opacity), '0.25');
        assert.equal(await page.locator('#inbox').evaluate(el => getComputedStyle(el).opacity), '1');
        assert.equal(await page.evaluate(() => serialize()), save, 'arayüz tercihi Save8 içeriğini etkilemez');
        await page.reload();
        await page.evaluate(setup);
        await page.waitForFunction(() => getComputedStyle($('alerts')).opacity === '0.25');
        assert.deepEqual(errors, []);
        console.log('PASS ' + width + '×' + height + ' · çubuk / ilk rota emri / olay önceliği / opaklık');
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
