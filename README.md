# Curling-track – trenérský zápisník

Statická aplikace pro CB BUTCHERS. Zapisuje průběh curlingového zápasu, kameny, úspěšnost ran, sestavy a taktiku. Má také statistiky a přehled sezóny.

**Stav:** funkční frontend s lokálním ukládáním. **Není zde backend, autentizace ani cloudová synchronizace.** Pro nasazení s účty a databází je potřeba doprogramovat server podle `PREDANI.md`.

## Rychlý start

Otevřete `index.html` přímo v prohlížeči. Není potřeba `npm install`, build ani připojení k internetu. Pro vývoj se pohodlněji používá lokální HTTP server:

```bash
python3 -m http.server 8080
# otevřete http://localhost:8080
```

## Struktura

```text
curling-track/
├── index.html             # struktura stránky, theme bootstrap, načtení skriptů
├── css/app.css            # všechny styly + vestavěná offline písma
├── js/rules-data.js       # česky sepsaný rejstřík pravidel
├── js/app.js              # stav, datový model, logika, vykreslení, události
├── data/
│   ├── priklad-zapasu.json
│   └── priklad-zalohy.txt
├── testy/
│   ├── smoke.test.js      # Playwright: notebook a mobil
│   └── structure.test.js  # rychlá kontrola souborů a příkladů bez závislostí
├── docs/ARCHITEKTURA.md  # orientace v kódu a napojení API
├── licence/              # SIL OFL licence Oswald a Inter
├── PREDANI.md            # předání a původní požadavky k nasazení
└── package.json
```

**Pořadí skriptů je důležité:** `rules-data.js` načte globální `window.CURLING_RULEBOOK`, na který následně odkazuje `app.js`. Oba skripty jsou `defer`.

## Testy

Rychlý test bez instalace závislostí:

```bash
node testy/structure.test.js
```

Test uživatelského rozhraní v Playwrightu:

```bash
npm install
npx playwright install chromium
npm run test:e2e
# nebo APP_URL=http://localhost:8080/ npm run test:e2e
```

## Ukládání a bezpečnost dat

Zápasy se ukládají výhradně do `localStorage` pod `curl.games`. Záloha se stahuje jako textový soubor a lze ji znovu importovat. **Po každém zápase stáhněte zálohu; data jsou vázaná na daný prohlížeč.** Při napojení serveru musí zůstat zachovaná lokální offline cache.

Na databázové rozhraní a pravidla přístupu odkazuje `docs/ARCHITEKTURA.md`. Bez připojeného API nelze data sdílet mezi uživateli nebo zařízeními.

## Licence a autorství

© 2026 tým CB BUTCHERS. Všechna práva vyhrazena; používání a šíření aplikace podléhá souhlasu týmu CB BUTCHERS. Vložená písma mají samostatné licence SIL Open Font License 1.1 v `licence/`.
