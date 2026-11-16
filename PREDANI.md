# Curling-track – předání k nasazení

Trenérský zápisník pro curling (CB BUTCHERS). Zapisuje polohy a hodnocení kamenů po endech, taktiku endů a hodnocení zápasu. Počítá statistiky hráčů, ran a celé sezóny. Funguje na PC, tabletu i mobilu.

Tento dokument je pro vývojáře, který aplikaci napojí na databázi a uživatelské účty.

## Obsah balíčku

| Soubor | Co to je |
|---|---|
| `index.html` | HTML kostra a odkazy na samostatné styly a skripty (bez build kroku). |
| `css/app.css` | Styly a vložená offline písma Oswald a Inter. |
| `js/app.js` | Herní logika, ukládání, vykreslování a události. |
| `js/rules-data.js` | Česky psaný rejstřík pravidel, oddělený od logiky. |
| `README.md`, `docs/ARCHITEKTURA.md` | Spuštění, orientace pro programátora, postup integrace. |
| `PREDANI.md` | Tento dokument. |
| `licence/` | Licence vložených písem Oswald a Inter (SIL Open Font License 1.1). Při šíření je přikládejte. |

## Spuštění

Stačí otevřít `index.html` v prohlížeči, nebo ho vystavit na libovolném statickém hostingu. Pro vývoj můžete použít třeba `npx serve .` a otevřít `http://localhost:3000`.

Testovací skripty a ukázková data jsou k dispozici pouze v původní kompletní verzi projektu. Tato odlehčená verze je určena pro běh a údržbu aplikace.

## Jak je aplikace postavená

- `index.html` načítá `css/app.css`, `js/rules-data.js`, `js/app.js`. `app.js` používá IIFE, žádný framework. Podrobná mapa kódu: `docs/ARCHITEKTURA.md`.
- **Stav:**
  - `games` je objekt `{id: zápas}`.
  - `curId` je otevřený zápas, `curEnd` a `curStone` jsou aktuální end a kámen.
  - `tab` je aktivní záložka.
  - `FM` je aktuální formát hry, nastavuje ho `useFmt(g)`.
- **Vykreslování:** funkce `render()`, `renderBoard()`, `renderEndbar()`, `renderWork()` a `renderBody()` skládají HTML řetězce. Kliknutí obsluhuje jeden delegovaný handler na `data-act`, pole formulářů jeden handler `input`/`change` podle `id`.
- **Každá změna dat** volá `touch()`. Ta:
  - vytvoří krok pro Zpět,
  - doplní návrh rány a automatické skóre endu,
  - naplánuje uložení přes `scheduleSave(id)`, které ukládá s 0,6 s zpožděním.
- Vzhled je nyní v `css/app.css`. Barvy jsou v CSS proměnných; historické vrstvy kaskády zůstávají ve stejném pořadí pro zachování vzhledu. Poznámka ke konsolidaci je v `docs/ARCHITEKTURA.md`.

## Kde se napojit na databázi

Všechno ukládání je soustředěné v několika funkcích. Zbytek aplikace s úložištěm nepracuje přímo.

| Funkce / místo | Co dělá teď | Co udělat s databází |
|---|---|---|
| `loadLocal()` | Při startu načte `localStorage["curl.games"]` do `games` (každý zápas projde `normalize()`). | Načíst zápasy přihlášeného uživatele z API a každý projít `normalize()`. |
| `doSave(id)` | Po 0,6 s od poslední změny zavolá `saveLocal()`. | Odeslat zápas `games[id]` na server (upsert podle `id`). |
| `saveLocal()` | Uloží všechny zápasy do `localStorage`. | Ponechat jako lokální mezipaměť pro offline. |
| `flushSaves()` | Při zavření stránky nebo přechodu do pozadí uloží hned. | Odeslat čekající změny, např. přes `navigator.sendBeacon`, a nechat je ve frontě pro příští start. |
| `case 'delyes'` | Smaže zápas `delete games[id]`. | Smazat na serveru (doporučeno měkké smazání `deleted_at`). |
| `restoreFrom(text)` | Import zálohy (soubor nebo vložený text). | Funguje jako převod dat ze starých záloh do účtu: importované zápasy se uloží na server. |
| `case 'newgame'`, `case 'loadsample'` | Vytvoří zápas (`newGame()`, `sampleGame()`). | Beze změny; uloží se přes `touch()`/`scheduleSave()`. Ukázkový zápas má `sample: true` a do Sezóny se nepočítá. |

**Ostatní klíče v `localStorage`** jsou jen preference zařízení a můžou zůstat lokální:
- `curl.cur`: naposledy otevřený zápas,
- `curl.theme`: světlý nebo tmavý režim,
- `curl.lastBackup`: čas poslední zálohy, slouží pro připomínku.

**Stav uložení** se zobrazuje přes `setStatus(text)`. Teď ukazuje texty „Ukládám…“ a „Uloženo v tomto prohlížeči“. Při napojení je změňte na stav serveru, například „Uloženo“ nebo „Offline, uloží se po připojení“.

**Offline je nutnost.** Na zimních stadionech bývá slabý signál. Doporučený postup: vždy uložit lokálně, na server odesílat z fronty a při připojení frontu dorovnat. Konflikt dvou zařízení stačí řešit podle `updated` (vyhrává novější), případně zamknout zápas na jednoho zapisovatele.

## Datový model zápasu

Viz `data/priklad-zapasu.json`. Zápas je jeden JSON dokument. Doporučujeme ho tak i uložit (sloupec typu JSON/JSONB) a vedle mít jen pár sloupců pro vyhledávání.

```
{
  id, format: "classic" | "triples" | "md",
  event, date: "YYYY-MM-DD",
  us:   { name, color: "red"|"yellow", players: [4× jméno], alts: [2× jméno], coach },
  them: { name, players, alts, coach },          // barva soupeře = opačná
  hammerStart: "us" | "them",                   // kdo má výhodu v 1. endu
  subs: { us: null | {end, pos, in}, them: … }, // jedno střídání na tým
  ends: [ {
    score: { us, them },                        // null = nezapsáno
    autoScored?: true,                          // skóre doplnila aplikace
    tactic: { rating 0–5, goal, met: "ano"|"částečně"|"ne"|"", note },
    pp, mdFirst,                                // jen mixed doubles
    stones: [ {                                 // 16 (classic), 12 (triples, md)
      x, y,              // poloha v metrech (viz souřadnice), null = nezakresleno
      out: false | "hog" | "through" | "out" | "rule",
      rating: 100|75|50|25|0|"",               // hodnocení hodu
      shot, shotAuto?, shotManual?,              // rána; návrh od aplikace / ruční volba
      turn: "In"|"Out"|"", pname, note,
      moves: [ {by, x, y} ],                    // kámen posunutý kamenem č. `by`
      removedBy: null | k,                      // vyřazen kamenem č. k
      rule?: {type, applied, undo, kept}        // uplatněné pravidlo FGZ / no-tick
    } ]
  } ],
  summary: { tactic, exec, mental, worked, improve, conclusion },
  sample, created, updated                      // časy v ms
}
```

- **Souřadnice:** střed domu (tee) je `0,0`, jednotky jsou metry. Záporné `y` je za tee line směrem k back line, kladné `y` směrem k hog line (6,401 m). Konstanty jsou na začátku skriptu (`R12`, `R4`, `HOG`, `HALFW`…).
- **Pořadí kamenů:** kámen s indexem `k` patří týmu s výhodou, pokud je `k` liché (`teamOf()`). Výhoda v endu se počítá z `hammerStart` a skóre předchozích endů (`hammerFor()`).
- **Poloha kamene po libovolném hodu:** `stateAt(end, k)`.
- **Formáty a jejich pravidla** (počet hráčů, kamenů, endů, pravidlo pěti kamenů, no-tick, mixed doubles) jsou v objektu `FORMATS`.
- **`normalize()`** doplní chybějící pole a převede starší data. Volejte ji vždy na data ze serveru, aplikace se pak nerozbije ani se staršími zápisy.

### Návrh tabulek

```sql
create table games (
  id          text primary key,            -- id z aplikace
  owner_id    uuid not null,               -- uživatel (účet)
  team_id     uuid null,                   -- volitelně: sdílení v týmu
  team_name   text, opponent text, game_date date, format text,
  data        jsonb not null,              -- celý objekt zápasu
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz null
);
create index on games (owner_id, game_date desc);
-- volitelně týmy: teams(id, name), team_members(team_id, user_id, role: 'coach'|'player'|'viewer')
```

Přístup: uživatel vidí a mění jen své zápasy, případně zápasy svého týmu podle role. Hlídat to musí server nebo pravidla databáze (např. Row Level Security v PostgreSQL), nestačí to jen v aplikaci.

## Mimo claude.ai

Aplikace teď běží i jako stránka na claude.ai. Ta z bezpečnostních důvodů nesmí volat cizí servery, takže **verzi s databází je nutné provozovat na vlastní doméně**.

- **Stahování souborů:** kód s `window.claude` (funkce `saveFile`) se mimo claude.ai sám vypne a použije běžné stahování. Nic není potřeba měnit.
- **Písma:** Oswald a Inter jsou vložená přímo v `css/app.css` (`@font-face` s `data:` WOFF2, jen latinka s češtinou, celkem asi 55 kB, licence SIL OFL 1.1). Aplikace nestahuje nic z internetu, takže online i offline vypadá stejně. Ikony jsou vložené jako SVG. Písma zůstávají vložená v CSS, aby fungovala i při otevření souboru bez připojení. Pokud je někdy přesunete do `.woff2`, zajistěte offline cache.
- **Instalace na plochu:** na vlastní doméně jde aplikaci udělat instalovatelnou (PWA: manifest + service worker) a zpřístupnit offline.

## Co je v aplikaci

- **Zápis kamenů:**
  - klepnutím nebo přetažením do plochy, posun a vyřazení dřívějších kamenů,
  - hodnocení 100–0 %, rána, rotace, poznámka,
  - automatický návrh rány podle výsledku hodu,
  - Zpět a Ctrl+Z.
- **Pravidla:**
  - kontrola pravidla pěti kamenů, no-tick a mixed doubles,
  - záložka Pravidla s vlastním českým shrnutím a odkazy na oficiální PDF WCF (úplné znění pravidel kvůli autorským právům v aplikaci není).
- **Formáty a sestavy:** klasicky (4 hráči a 2 náhradníci), triples, mixed doubles, jedno střídání.
- **Vyhodnocení:**
  - automatické skóre endu,
  - průběh skóre, mapa poloh kamenů,
  - statistiky hráčů a ran, Sezóna,
  - textové shrnutí pro tým.
- **Ovládání a vzhled:**
  - mobil: spodní navigace (Endy, Hráči, Pořadí, Hodnocení, Více), spodní lišta pro hodnocení, swipe mezi kameny, lupa pro přiblížení kruhů, při změně záložky skok na začátek stránky,
  - sada čárových ikon (inline SVG, objekt `IC` a funkce `icon()`), úvodní obrazovka při spuštění,
  - světlý a tmavý režim,
  - záloha a obnova přes textový soubor.

## Doporučení před ostrým spuštěním

- [x] Rozdělit `index.html`, `css/app.css`, `js/app.js` a `js/rules-data.js`; zachovat kompatibilitu.
- [ ] Postupně konsolidovat historické CSS vrstvy až po vizuálních regresních testech.
- [ ] Ukládání na server s offline frontou a zobrazením stavu synchronizace.
- [ ] Účty, týmy a role; převod dat ze záloh (`restoreFrom`).
- [ ] GDPR: zásady ochrany osobních údajů, export a smazání účtu, u hráčů do 18 let souhlas rodičů.
- [ ] Vzhled:
  - akce a vybrané stavy mají teď stejnou modrou, rozlišit je,
  - efekty při najetí zapnout jen na zařízeních s myší (`@media (hover:hover)`),
  - nižší hlavička na mobilu.
- [ ] Otestovat na skutečných zařízeních: iPhone, iPad (Safari), Android, Windows, Mac.
- [ ] Zálohy databáze, sledování chyb (např. Sentry), testovací prostředí.

## Autorství

© 2026 tým CB BUTCHERS. Tým si vyhrazuje výhradní právo rozhodovat o používání a šíření aplikace.
