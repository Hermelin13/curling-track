# Dokumentace projektu curling-track

> **Poznamka k teto verzi:** Publikovany web je ve slozce `public/` (`public/index.html`, `public/js/`, `public/css/`). Nazvy souboru nize jsou relativni ke slozce `public/`. Serverova databaze zatim neni zapojena.

## Kontext a rozsah

Aplikace je klientska (HTML/CSS/JS), bez frameworku, bez build systemu a bez backendu v tomto balicku.

- Data zapasu se ukladaji lokalne v prohlizeci.
- Cloudova databaze zatim neni aktivni.
- Repozitar obsahuje `wrangler.jsonc` pro Workers assets a Preview.
- Pokud uz existuje vlastni Wrangler konfigurace, slucte nastaveni (nepouzivejte dva konfiguracni soubory).

## Architektura aplikace

### Tok aplikace

`index.html` -> `css/app.css` + `js/rules-data.js` -> `js/app.js`

`app.js` zachovava puvodni IIFE a delegovane DOM udalosti. Neni zaveden framework, balickovac ani modulovy system, takze je stale mozne otevrit aplikaci jako lokalni HTML soubor.

### Mapovani casti

| Kde hledat | Klicove funkce / symboly |
|---|---|
| Formaty, skore a datovy model | `FORMATS`, `newStone`, `newEnd`, `newGame`, `normalize`, `teamOf`, `hammerFor`, `stateAt`, `autoScore` |
| Aplikacni stav | `games`, `curId`, `curEnd`, `curStone`, `tab`, `FM` |
| Zmeny a undo | `touch`, `doUndo`, `undoStack` |
| Lokalni ukladani | `loadLocal`, `scheduleSave`, `doSave`, `saveLocal`, `flushSaves`, `restoreFrom` |
| UI | `render`, `renderBoard`, `renderEndbar`, `renderBody`, `renderWork`, delegovany `data-act` handler |
| Pravidla | `js/rules-data.js`: `window.CURLING_RULEBOOK`; `js/app.js`: `rulesHTML`, `filterRules` |
| Styly a temata | `css/app.css`, CSS promenne `:root`, `data-theme` |

### Datovy model a kompatibilita

Zapas je JSON dokument. Import/export zalohy pouziva obalku `{app, v, saved, games}`. Po nacteni starsich dat vzdy zavolejte `normalize()`.

Souradnice maji jednotky metry a stred tee `(0,0)`; kladna osa y smeruje k hog line. Pri rozsirovani modelu zachovejte existujici hodnoty, identifikatory i historicke zalohy.

## Rezim zapisovani

### Pouziti

V bezne aplikaci otevrete **Endy a kameny** a kliknete na **Rezim zapisovani** v horni liste.

- **Vlevo:** led s kameny, prepinac Umistit / Posunout / Vyradit a Zpet.
- **Vpravo:** vyber hrace, rotace, rana, kde kamen skoncil, hodnoceni.
- **Vysledek endu** otevre formular vysledku ve vysouvacim pravem panelu; led zustava na miste.
- **Cil endu** otevre formular taktiky stejnym zpusobem.
- **Zobrazit skore a menu** rozbali horni cast stranky; tlacitko lze pouzit i ke skryti.
- **Ukoncit rezim** obnovi standardni rozlozeni vcetne vsech sekci.

Na velkych obrazovkach se led a editor zobrazuji ve dvou sloupcich. Na uzkych displejich se oba sloupce zachovavaji a ovladace se zmensi; pri nedostatku vysky lze posouvat obsah editoru, nikoli celou stranku.

### Technicky

- JavaScript: `public/js/app.js`, `focusMode`, `focusHeaderOpen`, `focusDrawer`, `syncFocusLayout()`.
- CSS: posledni sekce `public/css/app.css` pod komentarem `REZIM ZAPISOVANI`.
- Rezim meni pouze vykresleni; herni model, `touch()`, undo, formaty hry a `localStorage` zustaly beze zmeny.
- Prepnuti rezimu neprenasi data na server.

## Nasazeni Cloudflare Pages

### Checklist

- [ ] V GitHub repozitari je korenova slozka s `public/index.html`.
- [ ] Cloudflare Pages pouziva branch `main`, build command `exit 0` a output `public`.
- [ ] Na `*.pages.dev` se otevre hlavni obrazovka aplikace.
- [ ] V Network maji `css/app.css`, `js/rules-data.js` a `js/app.js` HTTP 200.
- [ ] V konzoli prohlizece nejsou chyby JavaScriptu.
- [ ] V mobilnim prohlizeci se stranka spravne prizpusobuje.
- [ ] Je vyzkousena zaloha a obnova; data jsou dosud jen v danem prohlizeci.

### Bezpecnostni upozorneni

Web bez autentizace je verejny. `public/_headers` pridava jen zakladni ochranne HTTP hlavicky. Neresi prihlaseni, opravneni ani ochranu zapasovych dat na serveru. Na D1 napojit az v samostatnem kroku.

## Rozsireni: API a uzivatelske ucty (zatim neimplementovano)

1. Pri inicializaci nactete lokalni cache pres `loadLocal()`; pak nactete zapasy prihlaseneho uzivatele z API, provedte `normalize()` a slouceni podle `id`/`updated`.
2. `touch()` musi dal zapisovat lokalne. `scheduleSave()` / `doSave()` doplnte o trvalou frontu zmen a `PUT /games/:id`.
3. Po obnove pripojeni odeslete cekajici zmeny; `flushSaves()` musi bezpecne ulozit neodeslane operace lokalne i pri zavreni stranky.
4. V `case 'delyes'` pridejte frontovanou operaci odstraneni na serveru (idealne soft delete). V `restoreFrom()` zaradte importovane zapasy k synchronizaci.
5. Nezobrazujte „Ulozeno na serveru“ pred potvrzenim serverem. Rozlisujte „Ulozeno lokalne“, „Ceka na synchronizaci“ a „Synchronizovano“.
6. Autentizaci a autorizaci vynucujte na serveru / v RLS, ne jen v klientu.

## CSS migracni poznamka

CSS bylo presunuto do jednoho souboru, historicke vrstvy zustaly ve stejnem poradi. Nektere selektory se stale prepisuji kvuli postupnemu vyvoji designu. Automaticke slouceni bez vizualnich regresnich testu muze zmenit zobrazeni, hlavne na mobilu a v tmavem rezimu.

## Overeni pred produkci

V plnem balicku spustte staticky test a Playwright smoke test. V odlehcene verzi rucne otestujte Safari iOS, Chrome Android, desktop, tmavy rezim, offline start, zalohu a import. Samostatne vyzkousejte klasicky curling, triples a mixed doubles. API a databaze vyzaduji vlastni integracni testy.

