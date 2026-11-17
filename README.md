## Režim zapisování (novinka)

V záložce **Endy a kameny** klikněte nahoře na **Režim zapisování**. Led zůstane
trvale **vlevo**, editace hodu (rotace, typ rány, umístění, hodnocení) **vpravo**.
Tlačítka **Výsledek endu** a **Cíl endu** zobrazí příslušný formulář v pravém
panelu, aniž by se skryl led. Tlačítko **Zobrazit skóre a menu** zpřístupní
horní lištu; stejným tlačítkem ji opět skryjete. **Ukončit režim** vrátí
původní zobrazení. Na malých displejích se posouvá pouze obsah editoru,
ne celá stránka. Nedochází ke změně datového formátu ani ukládání.

# Curling-track – webová verze pro Cloudflare Pages

Tato verze je **připravená k publikaci na Cloudflare Pages**. Nevyžaduje framework ani kompilaci.

> **Pozor:** V této fázi jde pouze o zpřístupnění webu na internetu. Není připojená databáze ani přihlášení. Zápasy se **stále ukládají do localStorage v prohlížeči**, nikoli na Cloudflare. Nezadávejte do veřejně dostupné stránky citlivá data; dokud nemáte účty a zabezpečení, web je veřejný. Stáhněte si zálohy starších zápasů před přechodem na databázi.

## Jak publikovat přes Cloudflare Pages (doporučeno: GitHub)

1. Nahrajte **celou složku projektu** do svého GitHub repozitáře (včetně `public/` a dokumentace).
2. V Cloudflare dashboardu otevřete **Workers & Pages → Create application → Pages → Connect to Git**.
3. Vyberte repozitář, produkční větev `main` a nastavte:
   - **Framework preset:** None / žádný
   - **Root directory:** kořen repozitáře
   - **Build command:** `exit 0` (bez skutečného buildu)
   - **Build output directory:** `public`
4. Klikněte **Save and Deploy**. Vznikne veřejná adresa `https://<nazev-projektu>.pages.dev`.
5. Další změny ve větvi `main` se budou automaticky nasazovat.

Vlastní doména: v projektu Cloudflare Pages otevřete **Custom domains** a postupujte podle průvodce.

**Alternativa bez GitHubu:** Při vytvoření *nového* projektu Pages zvolte **Direct Upload** a přetáhněte obsah složky `public/` nebo ZIP vytvořený jen z této složky. Tento způsob neaktivuje automatické nasazování z GitHubu. Režim Git / Direct Upload nejde u již vytvořeného projektu jednoduše přepnout.

## Lokální spuštění

```bash
cd public
python3 -m http.server 8080
# http://localhost:8080
```

## Struktura

```text
curling-track-cloudflare/
├── public/                 # jediná složka publikovaná na webu
│   ├── index.html
│   ├── css/app.css
│   ├── js/app.js
│   ├── js/rules-data.js
│   └── _headers            # základní HTTP bezpečnostní hlavičky
├── docs/ARCHITEKTURA.md
├── licence/                # licence k vloženým písmům
├── PREDANI.md              # původní technické předání
├── .gitignore
└── README.md
```

Pořadí skriptů zachováno: `rules-data.js` → `app.js`. Žádné odkazy na externí soubory nejsou potřeba. Soukromé materiály a licence nejsou v adresáři `public/`, takže se na web nevystavují.

## Další krok (zatím NENÍ součástí tohoto projektu)

Přidat přihlášení a serverové API (Cloudflare Workers/Pages Functions + Cloudflare D1) s oddělením zápasů podle týmů, migrací stávajících záloh a vypnutím ukládání zápasů do `localStorage`. Samotné nasazení Pages toto **neřeší**.

## Odkazy

- Cloudflare Pages Git: https://developers.cloudflare.com/pages/get-started/git-integration/
- Cloudflare Pages statická HTML: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- Direct Upload: https://developers.cloudflare.com/pages/get-started/direct-upload/

© 2026 CB BUTCHERS. Všechna práva vyhrazena. Licence vložených písem najdete v `licence/`.
