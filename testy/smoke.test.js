// Základní test hlavních funkcí Curling-track (Playwright).
// Spuštění:  npm i -D playwright && npx playwright install chromium
//            APP_URL=http://localhost:8080/ node testy/smoke.test.js
// Bez APP_URL se otevře index.html ze složky o úroveň výš.
const {chromium, devices} = require('playwright');
const path = require('path');
const URL = process.env.APP_URL || 'file://' + path.resolve(__dirname, '..', 'index.html');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  OK   ' : '  CHYBA ') + msg); if (!cond) fails++; };

(async () => {
  const b = await chromium.launch();

  // --- notebook ---
  const p = await (await b.newContext({viewport: {width: 1366, height: 900}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL);
  console.log('Notebook');
  await p.click('[data-act="loadsample"]');
  ok(await p.textContent('.board .sc') !== null, 'ukázkový zápas se načte a zobrazí skóre');

  await p.click('[data-act="newgame"]');
  // klepnutí do plochy na souřadnice v metrech (střed domu = 0,0; kladné y = směrem k hog line)
  const place = async (x, y) => {
    const r = await p.evaluate(() => { const s = document.querySelector('#sheet'); const vb = s.viewBox.baseVal, bb = s.getBoundingClientRect();
      return {vb: [vb.x, vb.y, vb.width, vb.height], w: bb.width, h: bb.height}; });
    const [vx, vy, vw, vh] = r.vb;
    await p.locator('#sheet').click({position: {x: (x - vx) / vw * r.w, y: (y - vy) / vh * r.h}}); await p.waitForTimeout(100);
  };
  await place(0, 3.0);
  ok(await p.evaluate(() => !!document.querySelector('#sheet .drg[data-k="0"]')), 'klepnutím do plochy se umístí kámen');
  ok((await p.textContent('#ed-panel .chip.on') || '').includes('Guard'), 'návrh rány: kámen v guard zone = Guard');

  await p.click('#ed-panel .rates [data-v="75"]');
  ok(await p.evaluate(() => document.querySelector('#ed-panel .edhead .big').textContent.includes('2')), 'po hodnocení se editor posune na další kámen');

  await p.keyboard.press('Control+z');
  ok((await p.textContent('#status')).includes('zpět'), 'Ctrl+Z vrátí poslední změnu');

  await p.reload();  // stránka musí uložit i změnu těsně před zavřením
  ok(await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('curl.games') || '{}')).length >= 2), 'zápasy přežijí obnovení stránky');

  for (const t of ['stats', 'order', 'summary', 'season', 'help', 'rules']) {
    await p.click(`.tab[data-v="${t}"]`);
  }
  ok(errs.length === 0, 'žádné chyby JavaScriptu na notebooku' + (errs.length ? ': ' + errs.join(' | ') : ''));
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'stránka nepřetéká do strany');

  // --- mobil ---
  console.log('Mobil');
  const m = await (await b.newContext({...devices['iPhone 13']})).newPage();
  const merrs = []; m.on('pageerror', e => merrs.push(e.message));
  await m.goto(URL);
  await m.tap('[data-act="loadsample"]'); await m.tap('.endchip[data-v="1"]');
  ok(await m.isVisible('#mbar'), 'spodní lišta s hodnocením je vidět');
  ok(await m.isVisible('.zoombtn'), 'lupa pro přiblížení kruhů je vidět');
  await m.tap('.zoombtn');
  ok((await m.getAttribute('#sheet', 'viewBox')).endsWith('4.55'), 'lupa přiblíží kruhy');
  ok(merrs.length === 0, 'žádné chyby JavaScriptu na mobilu');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobil nepřetéká do strany');

  await b.close();
  console.log(fails ? `\n${fails} chyb` : '\nVše v pořádku');
  process.exit(fails ? 1 : 0);
})();
