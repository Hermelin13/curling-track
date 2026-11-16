# Architektura a předání vývojáři

## Tok aplikace

`index.html` → `css/app.css` + `js/rules-data.js` → `js/app.js`.

`app.js` zachovává původní IIFE a delegované DOM události. Není zaveden framework, balíčkovač ani modulový systém; tím zůstává možné otevřít aplikaci jako lokální HTML soubor. Velká data pravidel jsou oddělena od kódu, který s nimi pracuje.

### Mapování částí

| Kde hledat | Klíčové funkce / symboly |
|---|---|
| Formáty, skóre a datový model | `FORMATS`, `newStone`, `newEnd`, `newGame`, `normalize`, `teamOf`, `hammerFor`, `stateAt`, `autoScore` |
| Aplikační stav | `games`, `curId`, `curEnd`, `curStone`, `tab`, `FM` |
| Změny a undo | `touch`, `doUndo`, `undoStack` |
| Lokální ukládání | `loadLocal`, `scheduleSave`, `doSave`, `saveLocal`, `flushSaves`, `restoreFrom` |
| UI | `render`, `renderBoard`, `renderEndbar`, `renderBody`, `renderWork`, delegovaný `data-act` handler |
| Pravidla | `js/rules-data.js`: `window.CURLING_RULEBOOK`; `js/app.js`: `rulesHTML`, `filterRules` |
| Styly a témata | `css/app.css`, CSS proměnné `:root`, `data-theme` |

## Datový model a kompatibilita

Zápas je JSON dokument; `data/priklad-zapasu.json` obsahuje reálný příklad. `data/priklad-zalohy.txt` obsahuje obálku `{app, v, saved, games}`. Po načtení starších dat vždy zavolejte `normalize()`.

Souřadnice mají jednotky metry a střed tee `(0,0)`; kladná osa y směřuje k hog line. Při rozšíření modelu zachovejte existující hodnoty, identifikátory i historické zálohy.

## Napojení na API a uživatelské účty (zatím neimplementováno)

1. Při inicializaci načtěte lokální cache přes `loadLocal()`; poté načtěte zápasy přihlášeného uživatele z API, proveďte `normalize()` a sloučení podle `id`/`updated`.
2. `touch()` musí dál zapisovat lokálně. `scheduleSave()` / `doSave()` doplňte o trvalou frontu změn (např. `localStorage` či IndexedDB) a `PUT /games/:id`.
3. Po změně připojení odešlete čekající změny; `flushSaves()` musí bezpečně uložit neodeslané operace lokálně i při zavření stránky.
4. V `case 'delyes'` přidejte frontovanou operaci odstranění na serveru, ideálně soft delete. V `restoreFrom()` zařaďte importované zápasy k synchronizaci.
5. Nezobrazujte „Uloženo na serveru“ před potvrzením serverem. Rozlišujte „Uloženo lokálně“, „Čeká na synchronizaci“ a „Synchronizováno“.
6. Autentizaci a autorizaci vynucujte **na serveru / v RLS**, nikoli jen v klientu. Řešte členství v týmu, role, GDPR, souhlas se zpracováním osobních údajů a mazání dat.

Doporučený serverový model tabulek a rozpis klíčů `localStorage` jsou v `PREDANI.md`. Tento balíček neobsahuje backend a nesimuluje úspěšné uložení na server.

## CSS – migrační poznámka

Kód CSS byl bezpečně přemístěn do jediného souboru a historické vrstvy ponechány ve stejném pořadí. Některé selektory se stále přepisují kvůli postupnému vývoji designu. Jejich automatické sloučení bez vizuálních regresních testů by mohlo změnit zobrazení, zejména na mobilu a v tmavém režimu. Při další úpravě konsolidujte postupně po jednotlivých komponentách.

## Ověření před produkcí

Spusťte statický test a Playwright smoke test, následně ručně otestujte Safari iOS, Chrome Android, desktop, tmavý režim, offline start, zálohu a import. Samostatně vyzkoušejte klasický curling, triples a mixed doubles. API a databáze vyžadují vlastní integrační testy.
