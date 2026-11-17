# Režim zapisování

## Použití

V běžné aplikaci otevřete **Endy a kameny** a klikněte na **Režim zapisování** v horní liště.

- **Vlevo:** led s kameny, přepínač Umístit / Posunout / Vyřadit a Zpět.
- **Vpravo:** výběr hráče, rotace, rána, kde kámen skončil, hodnocení.
- **Výsledek endu** otevře formulář výsledku ve vysouvacím pravém panelu; led zůstává na místě.
- **Cíl endu** otevře formulář taktiky stejným způsobem.
- **Zobrazit skóre a menu** rozbalí horní část stránky; tlačítko lze použít i ke skrytí.
- **Ukončit režim** obnoví standardní rozložení včetně všech sekcí.

Na velkých obrazovkách se led a editor zobrazují ve dvou sloupcích. Na úzkých displejích se oba sloupce zachovávají a jednotlivé ovladače se zmenší; při nedostatku výšky lze posouvat obsah editoru, **nikoli celou stránku**. Tím se led během zápisu neztrácí.

## Technicky

- JavaScript: `public/js/app.js`, `focusMode`, `focusHeaderOpen`, `focusDrawer`, `syncFocusLayout()`.
- CSS: poslední sekce `public/css/app.css` pod komentářem `REŽIM ZAPISOVÁNÍ`.
- Režim mění pouze vykreslení; herní model, `touch()`, undo, formáty hry a `localStorage` zůstaly beze změny.
- Aplikace dosud **nemá cloudovou databázi**. Přepnutí režimu nepřenáší data na server.
- V repozitáři je `wrangler.jsonc` pro Workers assets a Preview. Pokud již existuje vlastní Wrangler konfigurace, slučte nastavení (nepoužívejte dva soubory konfigurace).
