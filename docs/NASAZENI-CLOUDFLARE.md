# Checklist nasazení Cloudflare Pages

- [ ] V GitHub repozitáři je kořenová složka s `public/index.html`.
- [ ] Cloudflare Pages používá `main`, build command `exit 0` a output `public`.
- [ ] Na `*.pages.dev` se otevře hlavní obrazovka aplikace.
- [ ] Kontrola Network: `css/app.css`, `js/rules-data.js` a `js/app.js` mají HTTP 200.
- [ ] V konzoli prohlížeče nejsou chyby JavaScriptu.
- [ ] V mobilním prohlížeči se stránka správně přizpůsobuje.
- [ ] Je vyzkoušená záloha a obnova; data jsou dosud jen v daném prohlížeči.

## Bezpečnostní upozornění

Web bez autentizace je veřejný. `public/_headers` přidává pouze základní ochranné HTTP hlavičky. Neřeší přihlášení, oprávnění ani ochranu zápasových dat na serveru. Na D1 napojit až v samostatném kroku.
