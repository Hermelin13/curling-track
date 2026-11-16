/** Statická kontrola balíčku a kompatibility dat bez externích závislostí. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const html = read('index.html');
assert.match(html, /href="css\/app\.css"/);
assert.match(html, /src="js\/rules-data\.js" defer/);
assert.match(html, /src="js\/app\.js" defer/);
assert.ok(html.indexOf('rules-data.js') < html.indexOf('js/app.js'), 'pravidla se musí načítat jako první');
assert.doesNotMatch(html, /<script>\s*\(function\(\)/);

const app = read('js/app.js');
for (const name of ['normalize', 'loadLocal', 'scheduleSave', 'doSave', 'saveLocal', 'flushSaves', 'restoreFrom']) {
  assert.ok(new RegExp(`\\b${name}\\b`).test(app), `chybí ${name}`);
}
const context = { window: {} };
vm.runInNewContext(read('js/rules-data.js'), context);
const book = context.window.CURLING_RULEBOOK;
for (const part of ['R', 'C', 'T']) assert.ok(Array.isArray(book[part]) && book[part].length > 0);
const game = JSON.parse(read('data/priklad-zapasu.json'));
const backup = JSON.parse(read('data/priklad-zalohy.txt'));
assert.ok(game.id && Array.isArray(game.ends));
assert.equal(backup.app, 'curlingovy-zapisnik');
assert.ok(backup.games[game.id]);
assert.equal(backup.games[game.id].id, game.id);
assert.match(read('css/app.css'), /font-family:'Oswald'/);
console.log('OK: HTML, skripty, pravidla, lokální ukládání a ukázková data.');
