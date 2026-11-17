/*
 * Stručné české popisy pravidel curlingu (nezávazné shrnutí).
 * Úplné znění je dostupné přes odkazy na oficiální dokumenty v aplikaci.
 * Načítá se PŘED app.js; samotná herní logika zde není.
 */
window.CURLING_RULEBOOK = {
  "R": [
    {
      "id": "R1",
      "t": "Hrací plocha",
      "en": "Sheet",
      "p": [
        {
          "l": "a",
          "x": "Plocha je dlouhá nejméně 45,720 m a široká nejvýše 4,750 m, měřeno od vnitřních hran. Ve stávajících halách stačí nejméně 44,501 m a 4,420 m.",
          "s": []
        },
        {
          "l": "b",
          "x": "Na každém konci plochy jsou vyznačené čáry:",
          "s": [
            {
              "l": "I",
              "x": "Tee line je široká nejvýše 13 mm a její střed je 17,375 m od středu plochy.",
              "s": []
            },
            {
              "l": "II",
              "x": "Back line je široká nejvýše 13 mm a její vnější hrana je 1,829 m od středu tee.",
              "s": []
            },
            {
              "l": "III",
              "x": "Hog line je široká 102 mm a její vnitřní hrana je 6,401 m od středu tee.",
              "s": []
            },
            {
              "l": "IV",
              "x": "Středová čára je široká nejvýše 13 mm, spojuje obě tee a pokračuje 3,658 m za každé tee.",
              "s": []
            },
            {
              "l": "V",
              "x": "Hack line je dlouhá 457 mm, široká nejvýše 13 mm a leží rovnoběžně s tee line na koncích středové čáry.",
              "s": []
            },
            {
              "l": "VI",
              "x": "Courtesy line je dlouhá 152 mm, široká nejvýše 13 mm a leží 1,219 m vně každé hog line, rovnoběžně s ní.",
              "s": []
            }
          ]
        },
        {
          "l": "c",
          "x": "Na soutěžích vozíčkářů jsou na každém konci navíc dvě vlněné čáry rovnoběžné se středovou čárou, s vnějšími hranami 457 mm od ní.",
          "s": []
        },
        {
          "l": "d",
          "x": "Kolem tee jsou čtyři soustředné kruhy o poloměru 1,829 m, 1,219 m, 610 mm a nejvnitřnější nejméně 152 mm.",
          "s": []
        },
        {
          "l": "e",
          "x": "Na hack line jsou dva hacky s vnitřními hranami 76 mm od středové čáry. Každý je široký nejvýše 152 mm, vyčnívá nejvýše 203 mm a je zapuštěný nejvýše 38 mm.",
          "s": []
        }
      ]
    },
    {
      "id": "R2",
      "t": "Kameny",
      "en": "Stones",
      "p": [
        {
          "l": "a",
          "x": "Kámen má obvod nejvýše 914 mm, výšku nejméně 114 mm a hmotnost 17,24–19,96 kg včetně rukojeti a šroubu.",
          "s": []
        },
        {
          "l": "b",
          "x": "Každý tým hraje s 8 kameny se stejnou barvou rukojeti a viditelným označením. Poškozený kámen se nahradí; když náhradní není, hází se znovu již odehraný kámen.",
          "s": []
        },
        {
          "l": "c",
          "x": "Rozbitý kámen se umístí podle dohody v duchu curlingu. Bez dohody se end hraje znovu.",
          "s": []
        },
        {
          "l": "d",
          "x": "Kámen, který se převrátí nebo zůstane ležet na boku či vzhůru nohama, se okamžitě odstraní.",
          "s": []
        },
        {
          "l": "e",
          "x": "Když se při odehrání oddělí rukojeť, hráč může nechat hru běžet, nebo po vrácení posunutých kamenů hodit znovu.",
          "s": []
        },
        {
          "l": "f",
          "x": "Kámen, který se celý nezastaví za hog line na hrací straně, se odstraní, pokud nenarazil do jiného kamene.",
          "s": []
        },
        {
          "l": "g",
          "x": "Kámen, který celý přejede back line na hrací straně, se okamžitě odstraní.",
          "s": []
        },
        {
          "l": "h",
          "x": "Kámen, který se dotkne přepážky nebo postranní čáry, se okamžitě odstraní a nesmí vjet na sousední plochu.",
          "s": []
        },
        {
          "l": "i",
          "x": "Dokud se nezastaví poslední kámen endu, posuzují se kameny jen pohledem. Výjimkou je ověření, zda je kámen ve hře, a před 2. až 5. kamenem i to, zda leží ve free guard zone nebo v no-tick zóně.",
          "s": []
        },
        {
          "l": "j",
          "x": "Týmy nesmí své kameny upravovat ani na ně či nad ně nic pokládat.",
          "s": []
        }
      ]
    },
    {
      "id": "R3",
      "t": "Týmy",
      "en": "Teams",
      "p": [
        {
          "l": "a",
          "x": "Tým tvoří 4 hráči, může mít náhradníka a doprovod. Každý hráč hází v endu 2 kameny po sobě, střídavě se soupeřem.",
          "s": []
        },
        {
          "l": "b",
          "x": "Pořadí hráčů a role skipa a vice-skipa tým oznámí před zápasem a dodrží je. Úmyslná změna znamená kontumaci, kromě změny při nástupu náhradníka.",
          "s": []
        },
        {
          "l": "c",
          "x": "Když hráč nemůže pokračovat, tým může:",
          "s": [
            {
              "l": "I",
              "x": "hned nasadit náhradníka. Vystřídaný hráč se už nesmí vrátit a od dalšího endu lze změnit pořadí,",
              "s": []
            },
            {
              "l": "II",
              "x": "hrát ve třech v tomto a v následujícím celém endu a pak opět ve čtyřech, jinak kontumace. Každý tým smí mít v zápase jen jednu takovou absenci.",
              "s": []
            }
          ]
        },
        {
          "l": "d",
          "x": "Tým nesmí hrát s méně než 3 hráči a všichni musí v každém endu odehrát všechny své kameny.",
          "s": []
        },
        {
          "l": "e",
          "x": "Kde jsou náhradníci povoleni, lze přihlásit a použít jen jednoho. Porušení znamená kontumaci.",
          "s": []
        },
        {
          "l": "f",
          "x": "Když hráč nemůže odehrát svůj druhý kámen a není vystřídán, hodí ho:",
          "s": [
            {
              "l": "I",
              "x": "za prvního hráče druhý hráč,",
              "s": []
            },
            {
              "l": "II",
              "x": "za druhého hráče první hráč,",
              "s": []
            },
            {
              "l": "III",
              "x": "za třetího hráče druhý hráč,",
              "s": []
            },
            {
              "l": "IV",
              "x": "za čtvrtého hráče třetí hráč.",
              "s": []
            }
          ]
        },
        {
          "l": "g",
          "x": "Když hráč nemůže odehrát ani jeden kámen a není vystřídán, kameny se rozdělí takto:",
          "s": [
            {
              "l": "I",
              "x": "za prvního hráče: druhý hráč hodí 3 kameny, třetí 3 a čtvrtý poslední 2,",
              "s": []
            },
            {
              "l": "II",
              "x": "za druhého hráče: první hodí 3, třetí 3 a čtvrtý poslední 2,",
              "s": []
            },
            {
              "l": "III",
              "x": "za třetího hráče: první hodí jeho první kámen, druhý jeho druhý kámen a čtvrtý poslední 2,",
              "s": []
            },
            {
              "l": "IV",
              "x": "za čtvrtého hráče: druhý hodí jeho první kámen a třetí jeho druhý kámen.",
              "s": []
            }
          ]
        }
      ]
    },
    {
      "id": "R4",
      "t": "Postavení hráčů",
      "en": "Position of Players",
      "p": [
        {
          "l": "a",
          "x": "Tým, který nehází:",
          "s": [
            {
              "l": "I",
              "x": "Hráči stojí v klidu u postranních čar mezi courtesy lines. Výjimky:",
              "s": [
                {
                  "l": "1",
                  "x": "dva hráči smí stát za back line na hrací straně, pokud neruší skipa nebo vice-skipa soupeře,",
                  "s": []
                },
                {
                  "l": "2",
                  "x": "hráč, který hází další, smí stát vedle plochy za hackem na straně odehrání.",
                  "s": []
                }
              ]
            },
            {
              "l": "II",
              "x": "Hráči nesmí překážet, rozptylovat ani zastrašovat hráče, který hází. Když se to stane, nebo ho vyruší vnější vliv, může nechat hru běžet, nebo po vrácení posunutých kamenů hodit znovu.",
              "s": []
            }
          ]
        },
        {
          "l": "b",
          "x": "Tým, který hází:",
          "s": [
            {
              "l": "I",
              "x": "Dům řídí skip. Když hází skip nebo chybí, řídí ho vice-skip.",
              "s": []
            },
            {
              "l": "II",
              "x": "Kdo řídí dům, stojí na hrací straně uvnitř hog line a alespoň jednou nohou nebo kolem na ledu.",
              "s": []
            },
            {
              "l": "III",
              "x": "Když skip ani vice-skip nejsou na hrací ploše a jsou na řadě, smí dům pro tento kámen řídit kterýkoli hráč na ledě.",
              "s": []
            },
            {
              "l": "IV",
              "x": "Při nesprávném postavení se odehraný kámen odstraní a tým, který pravidlo neporušil, vrátí posunuté kameny.",
              "s": []
            }
          ]
        }
      ]
    },
    {
      "id": "R5",
      "t": "Odehrání kamene",
      "en": "Delivery",
      "p": [
        {
          "l": "a",
          "x": "O prvním kameni 1. endu rozhoduje los, pokud to není určeno předem nebo Last Stone Draw. V dalších endech hází první tým, který naposledy skóroval.",
          "s": []
        },
        {
          "l": "b",
          "x": "Tým, který hází první kámen 1. endu, si volí barvu rukojetí, pokud není určena předem.",
          "s": []
        },
        {
          "l": "c",
          "x": "Praváci hází z levého hacku, leváci z pravého. Kámen hozený ze špatného hacku se odstraní a posunuté kameny se vrátí.",
          "s": []
        },
        {
          "l": "d",
          "x": "Kámen se odehrává za rukojeť. Dotyk žuly po tee line na straně odehrání se posuzuje jako dotyk jedoucího kamene a kámen se odstraní.",
          "s": []
        },
        {
          "l": "e",
          "x": "Kámen musí být puštěn dřív, než dojede k hog line na straně odehrání, jinak se okamžitě odstraní.",
          "s": []
        },
        {
          "l": "f",
          "x": "Když se kámen s porušením hog line hned neodstraní a narazí do jiného kamene, odstraní se a posunuté kameny se vrátí.",
          "s": []
        },
        {
          "l": "g",
          "x": "Kámen je ve hře, jakmile dojede k tee line na straně odehrání (u vozíčkářů k hog line). Do té doby ho lze vrátit a hodit znovu. Za odehraný se považuje u hog line.",
          "s": []
        },
        {
          "l": "h",
          "x": "Hráči musí být na řadě připraveni a nesmí zbytečně zdržovat.",
          "s": []
        },
        {
          "l": "i",
          "x": "Kámen hozený ze sady soupeře se nechá zastavit a pak se nahradí kamenem týmu, který hodil.",
          "s": []
        },
        {
          "l": "j",
          "x": "Kámen hozený mimo pořadí platí. Hráč, který vynechal, hodí v endu poslední kámen týmu; když chybu nejde přiřadit, hodí ho hráč, který hází první.",
          "s": []
        },
        {
          "l": "k",
          "x": "Když tým hodí v endu příliš mnoho kamenů, end pokračuje a poslednímu hráči se kameny uberou. Způsobil-li chybu poslední hráč, jeho poslední kámen se odstraní a posunuté kameny se vrátí.",
          "s": []
        },
        {
          "l": "l",
          "x": "Když tým hodí v endu dva kameny po sobě:",
          "s": [
            {
              "l": "I",
              "x": "druhý kámen se odstraní, posunuté kameny se vrátí a hráč ho hodí jako poslední kámen týmu,",
              "s": []
            },
            {
              "l": "II",
              "x": "zjistí-li se to až po dalším kameni, end se hraje znovu.",
              "s": []
            }
          ]
        },
        {
          "l": "m",
          "x": "Když první kámen endu hodí nesprávný tým:",
          "s": [
            {
              "l": "I",
              "x": "zjistí-li se to po prvním kameni, end se hraje znovu,",
              "s": []
            },
            {
              "l": "II",
              "x": "zjistí-li se to až po druhém kameni, hra pokračuje.",
              "s": []
            }
          ]
        }
      ]
    },
    {
      "id": "R6",
      "t": "Free guard zone (FGZ)",
      "en": "Free Guard Zone",
      "p": [
        {
          "l": "a",
          "x": "Free guard zone je oblast na hrací straně mezi tee line a hog line bez domu. Pravidlo upřesňuje i kameny ve hře, které se k hog line dostanou po nárazu do kamene ve free guard zone.",
          "s": []
        },
        {
          "l": "b",
          "x": "Před odehráním 6. kamene endu: když odehraný kámen přímo nebo nepřímo vyřadí ze hry kámen soupeře, který ležel ve free guard zone, odehraný kámen se odstraní a posunuté kameny se vrátí na původní místo.",
          "s": []
        }
      ]
    },
    {
      "id": "R7",
      "t": "No-tick",
      "en": "No-Tick Shot",
      "p": [
        {
          "l": "a",
          "x": "Před odehráním 6. kamene endu: když odehraný kámen posune kámen soupeře, který leží ve free guard zone a dotýká se středové čáry, mimo středovou čáru nebo mimo free guard zone, tým, který pravidlo neporušil, si vybere:",
          "s": [
            {
              "l": "I",
              "x": "odstranit odehraný kámen a vrátit posunuté kameny, nebo",
              "s": []
            },
            {
              "l": "II",
              "x": "nechat všechny kameny tam, kde se zastavily.",
              "s": []
            }
          ]
        },
        {
          "l": "b",
          "x": "Když je takový kámen posunut až mimo hru, platí R6(b).",
          "s": []
        },
        {
          "l": "c",
          "x": "Pravidlo neplatí pro curling vozíčkářů ani pro mixed doubles.",
          "s": []
        }
      ]
    },
    {
      "id": "R8",
      "t": "Zametání",
      "en": "Sweeping",
      "p": [
        {
          "l": "a",
          "x": "Zametat se smí kterýmkoli směrem a nemusí se pokrýt celá šířka kamene. Hlava kartáče se nesmí zvednout před jedoucím kamenem, před kamenem se nesmí nechat nečistoty a zametání musí skončit stranou od kamene. Za porušení vlastním zametáním dá rozhodčí nejdřív napomenutí, při dalších:",
          "s": [
            {
              "l": "I",
              "x": "při Last Stone Draw se zapíše maximální vzdálenost,",
              "s": []
            },
            {
              "l": "II",
              "x": "v zápase si soupeř vybere, zda kámen nechá, nebo ho odstraní a vrátí posunuté kameny.",
              "s": []
            }
          ]
        },
        {
          "l": "b",
          "x": "Stojící kámen se smí zametat, až když ho jiný kámen uvede do pohybu. Pak ho smí zametat kterýkoli hráč jeho týmu před tee line na hrací straně.",
          "s": []
        },
        {
          "l": "c",
          "x": "Před dalším odehráním smí všichni hráči očistit led.",
          "s": []
        },
        {
          "l": "d",
          "x": "Kámen ve hře smí zametat kterýkoli člen týmu, který hází, před tee line na hrací straně.",
          "s": []
        },
        {
          "l": "e",
          "x": "Kámen soupeře smí tým zametat jen za tee line na hrací straně a až poté, co k ní kámen dojede.",
          "s": []
        },
        {
          "l": "f",
          "x": "Za tee line na hrací straně smí zametat vždy jen jeden hráč z každého týmu: z týmu, který hází, kdokoli, z týmu, který nehází, jen skip nebo vice-skip.",
          "s": []
        },
        {
          "l": "g",
          "x": "Za tee line má tým přednost při zametání vlastního kamene, ale nesmí soupeři bránit. Při porušení bodů (b) až (g) si tým, který pravidlo neporušil, vybere, zda nechá hru běžet, nebo kameny umístí tam, kde by se zastavily.",
          "s": []
        }
      ]
    },
    {
      "id": "R9",
      "t": "Dotčené jedoucí kameny",
      "en": "Touched Moving Stones",
      "p": [
        {
          "l": "a",
          "x": "Mezi tee line na straně odehrání a hog line na hrací straně:",
          "s": [
            {
              "l": "I",
              "x": "Kámen, kterého se dotkne vlastní tým nebo jeho vybavení, tento tým okamžitě odstraní. Dvojí dotyk rukojeti před hog line na straně odehrání porušením není.",
              "s": []
            },
            {
              "l": "II",
              "x": "Kámen, kterého se dotkne soupeř, jeho vybavení nebo vnější vliv:",
              "s": [
                {
                  "l": "1",
                  "x": "je-li to odehraný kámen, hází se znovu,",
                  "s": []
                },
                {
                  "l": "2",
                  "x": "jinak se umístí tam, kde by se podle jeho týmu rozumně zastavil.",
                  "s": []
                }
              ]
            }
          ]
        },
        {
          "l": "b",
          "x": "Za hog line na hrací straně:",
          "s": [
            {
              "l": "I",
              "x": "Dotkne-li se kamene vlastní tým, po zastavení všech kamenů si soupeř vybere: (1) odstranit dotčený kámen a vrátit posunuté kameny, (2) nechat kameny tak, jak jsou, nebo (3) umístit kameny tam, kde by se rozumně zastavily.",
              "s": []
            },
            {
              "l": "II",
              "x": "Dotkne-li se kamene soupeř, po zastavení všech kamenů je tým, který pravidlo neporušil, umístí tam, kde by se rozumně zastavily.",
              "s": []
            },
            {
              "l": "III",
              "x": "Dotkne-li se kamene vnější vliv, kameny se umístí tam, kde by se zastavily. Bez dohody se po vrácení kamenů hází znovu, a když se týmy neshodnou ani na polohách, end se hraje znovu.",
              "s": []
            }
          ]
        },
        {
          "l": "c",
          "x": "Při Last Stone Draw:",
          "s": [
            {
              "l": "I",
              "x": "dotkne-li se kamene tým, který hází, kámen se odstraní a zapíše se 1,996 m,",
              "s": []
            },
            {
              "l": "II",
              "x": "dotkne-li se ho druhý tým, hází se znovu,",
              "s": []
            },
            {
              "l": "III",
              "x": "dotkne-li se ho vnější vliv, hází se znovu.",
              "s": []
            }
          ]
        },
        {
          "l": "d",
          "x": "Kámen zasažený kamenem odraženým od přepážky umístí tým, který nehází, tam, kde by se rozumně zastavil.",
          "s": []
        }
      ]
    },
    {
      "id": "R10",
      "t": "Posunuté stojící kameny",
      "en": "Displaced Stationary Stones",
      "p": [
        {
          "l": "a",
          "x": "Stojící kámen, který by neovlivnil jedoucí kámen a posune ho hráč nebo vybavení, vrátí na místo tým, který pravidlo neporušil.",
          "s": []
        },
        {
          "l": "b",
          "x": "Posune-li takový kámen vnější vliv, vrátí se na místo podle dohody týmů.",
          "s": []
        },
        {
          "l": "c",
          "x": "Stojící kámen, který by ovlivnil jedoucí kámen a posune ho hráč nebo vybavení: všechny kameny se nechají zastavit a tým, který pravidlo neporušil, si vybere:",
          "s": [
            {
              "l": "I",
              "x": "nechat všechny kameny tam, kde se zastavily,",
              "s": []
            },
            {
              "l": "II",
              "x": "odstranit ovlivněný kámen a vrátit kameny posunuté po porušení,",
              "s": []
            },
            {
              "l": "III",
              "x": "umístit všechny kameny tam, kde by se podle něj zastavily.",
              "s": []
            }
          ]
        },
        {
          "l": "d",
          "x": "Posune-li takový kámen vnější vliv, kameny se umístí tam, kde by se zastavily. Bez dohody se po vrácení kamenů hází znovu, a když se týmy neshodnou ani na polohách, end se hraje znovu.",
          "s": []
        },
        {
          "l": "e",
          "x": "Když kameny posune přepážka, vrátí je tým, který nehází.",
          "s": []
        },
        {
          "l": "f",
          "x": "Kámen Last Stone Draw posunutý před dokončením měření:",
          "s": [
            {
              "l": "I",
              "x": "posune-li ho tým, který hází, kámen se odstraní a zapíše se 1,996 m,",
              "s": []
            },
            {
              "l": "II",
              "x": "posune-li ho druhý tým, vrátí ho na místo tým, který hází,",
              "s": []
            },
            {
              "l": "III",
              "x": "posune-li ho vnější vliv, vrátí ho na místo tým, který hází.",
              "s": []
            }
          ]
        }
      ]
    },
    {
      "id": "R11",
      "t": "Vybavení",
      "en": "Equipment",
      "p": [
        {
          "l": "a",
          "x": "Vybavení ani otisky rukou či těla nesmí poškodit led. Za první případ je napomenutí a oprava, za druhý druhé napomenutí a oprava, za třetí oprava a vyloučení.",
          "s": []
        },
        {
          "l": "b",
          "x": "Na ledě nesmí zůstat vybavení bez dozoru.",
          "s": []
        },
        {
          "l": "c",
          "x": "Zakázaná je elektronická komunikace, zařízení měnící hlas a zařízení, která dávají hráčům informace o hrací ploše. Povolené jsou jen stopky měřící čas. Píšťalky a signalizační pomůcky jen ze zdravotních důvodů s písemným souhlasem World Curling.",
          "s": []
        },
        {
          "l": "d",
          "x": "Při elektronickém hlídání hog line:",
          "s": [
            {
              "l": "I",
              "x": "rukojeť musí být při odehrání aktivovaná, jinak jde o porušení hog line,",
              "s": []
            },
            {
              "l": "II",
              "x": "na ruce, kterou hráč hází, nesmí mít rukavici. Porušení: kámen se odstraní a posunuté kameny se vrátí.",
              "s": []
            }
          ]
        },
        {
          "l": "e",
          "x": "Delivery stick (tyč na odehrání):",
          "s": [
            {
              "l": "I",
              "x": "je zakázaná na soutěžích World Curling a jejich kvalifikacích, kromě soutěží vozíčkářů,",
              "s": []
            },
            {
              "l": "II",
              "x": "kdo ji použije, musí ji použít na všechny své kameny v zápase,",
              "s": []
            },
            {
              "l": "III",
              "x": "smí sloužit jen jako prodloužení paže nebo ruky, bez mechanické výhody,",
              "s": []
            },
            {
              "l": "IV",
              "x": "musí odpovídat pravidlům World Curling pro vozíčkáře,",
              "s": []
            },
            {
              "l": "V",
              "x": "rekreační použití mimo vozíčkáře řeší samostatný dokument World Curling.",
              "s": []
            }
          ]
        }
      ]
    },
    {
      "id": "R12",
      "t": "Počítání bodů a výsledek",
      "en": "Scoring",
      "p": [
        {
          "l": "a",
          "x": "O zápase rozhoduje většina bodů po plánovaných endech, vzdání, nebo to, že soupeř už nemůže početně dohnat, pokud je odehrán minimální počet endů. Vyřazený tým smí dohrát rozehraný end, nový se nezačíná; při vyřazení v posledním endu hra končí. Při rovnosti se hrají extra endy a vyhrává tým, který v nich první skóruje.",
          "s": []
        },
        {
          "l": "b",
          "x": "Tým získá bod za každý svůj kámen v domě nebo dotýkající se domu, který je blíž tee než kterýkoli kámen soupeře.",
          "s": []
        },
        {
          "l": "c",
          "x": "Skóre odsouhlasí skipové nebo vice-skipové, kteří řídí dům. Posune-li se rozhodující kámen před odsouhlasením, dostane tým, který pravidlo neporušil, výhodu případného měření.",
          "s": []
        },
        {
          "l": "d",
          "x": "Když nestačí pohled, měří se měřidlem od tee k nejbližší části kamene. Přihlížet smí jeden hráč z každého týmu.",
          "s": []
        },
        {
          "l": "e",
          "x": "Když jsou kameny příliš blízko pro měřidlo, rozhoduje se pohledem.",
          "s": []
        },
        {
          "l": "f",
          "x": "Když jsou kameny i po měření stejně daleko:",
          "s": [
            {
              "l": "I",
              "x": "rozhoduje-li to o tom, kdo skóruje, end je blank,",
              "s": []
            },
            {
              "l": "II",
              "x": "rozhoduje-li to o dalších bodech, počítají se jen bližší kameny.",
              "s": []
            }
          ]
        },
        {
          "l": "g",
          "x": "Posune-li vnější vliv bodující kameny před odsouhlasením skóre:",
          "s": [
            {
              "l": "I",
              "x": "rozhodovaly-li o tom, kdo skóruje, end se hraje znovu,",
              "s": []
            },
            {
              "l": "II",
              "x": "měl-li už tým body jisté a šlo o další body, může end hrát znovu, nebo si body ponechat.",
              "s": []
            }
          ]
        },
        {
          "l": "h",
          "x": "V posledním endu, pokud měření neovlivní výsledek zápasu, se po posunutí vnějším vlivem end neopakuje a skóre určí hlavní rozhodčí.",
          "s": []
        },
        {
          "l": "i",
          "x": "Vzdát smí tým, jen když je na řadě s házením. Skóre endu se zapíše takto:",
          "s": [
            {
              "l": "I",
              "x": "mají-li oba týmy ještě kameny, zapíše se do tabulky X,",
              "s": []
            },
            {
              "l": "II",
              "x": "odehrál-li všechny kameny jen jeden tým:",
              "s": [
                {
                  "l": "1",
                  "x": "má-li bodující kameny tento tým, body nezíská a zapíše se X, pokud body nejsou potřeba k určení výsledku,",
                  "s": []
                },
                {
                  "l": "2",
                  "x": "má-li bodující kameny druhý tým, body se mu přičtou,",
                  "s": []
                },
                {
                  "l": "3",
                  "x": "nemá-li bodující kameny nikdo, zapíše se X.",
                  "s": []
                }
              ]
            }
          ]
        },
        {
          "l": "j",
          "x": "Kontumace se zapisuje jako výhra a prohra (W–L).",
          "s": []
        },
        {
          "l": "k",
          "x": "Pozdní příchod týmu:",
          "s": [
            {
              "l": "0:00–0:59",
              "x": "bez trestu, poslední kámen 1. endu určí Last Stone Draw nebo los, skóre 0:0,",
              "s": []
            },
            {
              "l": "1:00–14:59",
              "x": "(mixed doubles 1:00–9:59): opozdilý tým ztrácí výhodu posledního kamene a jeden end se počítá za odehraný se skóre 1:0 pro soupeře. Jsou-li pozdě oba, počítá se jeden end se skóre 0:0,",
              "s": []
            },
            {
              "l": "15:00–29:59",
              "x": "(mixed doubles 10:00–19:59): dva endy se počítají za odehrané se skóre 2:0 pro soupeře. Jsou-li pozdě oba, dva endy se skóre 0:0,",
              "s": []
            },
            {
              "l": "30:00+",
              "x": "(mixed doubles od 20:00): opozdilý tým prohrává kontumačně. Jsou-li pozdě oba, prohrávají oba,",
              "s": []
            },
            {
              "l": "kombinace",
              "x": "jeden tým 1:00–14:59 a druhý 15:00–29:59 pozdě: počítají se dva endy a tým s menším zpožděním dostane poslední kámen a jeden bod.",
              "s": []
            }
          ]
        }
      ]
    },
    {
      "id": "R13",
      "t": "Přerušený zápas",
      "en": "Interrupted Games",
      "p": [
        {
          "l": "—",
          "x": "Zápas pokračuje tam, kde se přerušil. Když se kvůli údržbě ledu musí kameny odstranit (po dohodě hlavního technika ledu, hlavního rozhodčího a technického delegáta), end se hraje znovu.",
          "s": []
        }
      ]
    },
    {
      "id": "R14",
      "t": "Curling vozíčkářů",
      "en": "Wheelchair Curling",
      "p": [
        {
          "l": "a",
          "x": "Kámen se odehrává ze stojícího vozíku.",
          "s": []
        },
        {
          "l": "b",
          "x": "Mezi hackem a horním okrajem domu začíná kámen na středové čáře, mezi horním okrajem domu a hog line musí celý ležet mezi vlněnými čarami. Žádná část těla se nesmí dotknout ledu, kola musí být v kontaktu s ledem. Hází se paží nebo rukou, nebo delivery stick podle pravidel, a kámen se pustí před hog line na straně odehrání.",
          "s": []
        },
        {
          "l": "c",
          "x": "Hráči, kteří nehází, stojí za back line na straně odehrání. Kteříkoli dva smí stát za back line na hrací straně, pokud neruší skipa soupeře.",
          "s": []
        },
        {
          "l": "d",
          "x": "Zametání není povoleno.",
          "s": []
        },
        {
          "l": "e",
          "x": "Při porušení bodu (b) nebo (d) se kámen odstraní a posunuté kameny se vrátí.",
          "s": []
        },
        {
          "l": "f",
          "x": "Složení týmu a střídání: na ledě hrají vždy 4 hráči obou pohlaví, jinak kontumace.",
          "s": [
            {
              "l": "I",
              "x": "Hráč, který odejde kvůli nemoci, zranění nebo jiným vážným okolnostem (ne po vyloučení), se smí vrátit, pokud odehraje všechny své kameny.",
              "s": []
            },
            {
              "l": "II",
              "x": "Jsou-li v endu ještě potřeba jeho kameny, musí hned nastoupit náhradník požadovaného pohlaví, jinak kontumace. Od dalšího endu lze změnit pořadí a vystřídaný hráč se nesmí vrátit.",
              "s": []
            },
            {
              "l": "III",
              "x": "Odehrál-li odcházející hráč už oba kameny, musí náhradník nastoupit od dalšího endu, se stejným omezením návratu.",
              "s": []
            }
          ]
        },
        {
          "l": "g",
          "x": "Všechny zápasy se hrají na 8 endů.",
          "s": []
        }
      ]
    },
    {
      "id": "R15",
      "t": "Mixed doubles vozíčkářů",
      "en": "Wheelchair Mixed Doubles Curling",
      "p": [
        {
          "l": "a",
          "x": "Platí R14 kromě bodu (f): tým tvoří jeden muž a jedna žena, bez náhradníků, se dvěma členy doprovodu. Když oba hráči nejsou přítomni celý zápas, tým prohrává kontumačně.",
          "s": []
        },
        {
          "l": "b",
          "x": "Hraje se podle pravidel mixed doubles (R17) kromě R17(l), protože zametání není nikdy povoleno.",
          "s": []
        },
        {
          "l": "c",
          "x": "Elektrický vozík je zakázaný, pokud ho hráč nepoužívá k běžnému pohybu.",
          "s": []
        }
      ]
    },
    {
      "id": "R16",
      "t": "Mixed",
      "en": "Mixed Curling",
      "p": [
        {
          "l": "a",
          "x": "Tým tvoří dva muži a dvě ženy, kteří hází střídavě (muž, žena, muž, žena, nebo naopak). Náhradníci nejsou povoleni, doprovod smí mít 2 členy.",
          "s": []
        },
        {
          "l": "b",
          "x": "Tým, který nemá celý zápas 4 hráče, prohrává kontumačně. Když jeden hráč nemůže v endu hrát, smí tým hrát ve třech v tomto a následujícím celém endu; hráč se smí vrátit jen na začátku endu a za něj se hodí nejvýše 4 kameny podle R3(f) nebo (g). Po dvou endech musí opět házet 4 hráči, jinak kontumace. Každý tým smí mít v zápase jen jednu absenci.",
          "s": []
        },
        {
          "l": "c",
          "x": "Pořadí hráčů musí dodržet střídání mužů a žen a v případě potřeby se musí změnit.",
          "s": []
        },
        {
          "l": "d",
          "x": "Skipem a vice-skipem může být kdokoli, ale musí to být muž a žena.",
          "s": []
        },
        {
          "l": "e",
          "x": "Všechny zápasy mixed se hrají na 8 endů.",
          "s": []
        }
      ]
    },
    {
      "id": "R17",
      "t": "Mixed doubles",
      "en": "Mixed Doubles Curling",
      "p": [
        {
          "l": "a",
          "x": "Tým tvoří jeden muž a jedna žena, bez náhradníků, s doprovodem nejvýše 2 členů. Když oba hráči nejsou přítomni celý zápas, tým prohrává kontumačně.",
          "s": []
        },
        {
          "l": "b",
          "x": "Body se počítají jako v běžném curlingu a počítají se i umístěné kameny.",
          "s": []
        },
        {
          "l": "c",
          "x": "Zápas se hraje na 8 endů.",
          "s": []
        },
        {
          "l": "d",
          "x": "Každý tým odehraje v endu 5 kamenů. Kdo hází první kámen týmu, hází i poslední; spoluhráč hází 2., 3. a 4. kámen. Kdo hází první, se může mezi endy měnit.",
          "s": []
        },
        {
          "l": "e",
          "x": "Před odehráním 4. kamene endu: když odehraný kámen přímo nebo nepřímo vyřadí ze hry kterýkoli dříve odehraný nebo umístěný kámen, odehraný kámen se odstraní a tým, který pravidlo neporušil, vrátí posunuté kameny.",
          "s": []
        },
        {
          "l": "f",
          "x": "Před každým endem jeden tým postaví svůj umístěný kámen na pozici A nebo B a soupeř dostane druhou pozici:",
          "s": [
            {
              "l": "I",
              "x": "Pozice A: kámen leží na středové čáře těsně před nebo za jedním ze čtyř bodů ve vzdálenosti 1,372 m, 1,981 m, 2,591 m nebo 3,200 m od horního okraje domu. Bod určí hlavní rozhodčí s hlavním technikem ledu pro každou plochu před rozcvičením a platí celý zápas. Bez rozhodčích ho určí týmy podle stavu ledu.",
              "s": []
            },
            {
              "l": "II",
              "x": "Pozice B: kámen leží na středové čáře a jeho zadní hrana je zarovnaná se zadní hranou kruhu 4 ft.",
              "s": []
            },
            {
              "l": "III",
              "x": "Power play: jednou za zápas smí tým, který rozhoduje o umístění, postavit kameny ke straně. Kámen v domě se dotýká tee line v místě, kde se stýkají kruhy 8 ft a 12 ft, a stráž stojí ve stejné vzdálenosti jako středová stráž. V extra endu power play použít nelze.",
              "s": []
            }
          ]
        },
        {
          "l": "g",
          "x": "O umístění rozhoduje:",
          "s": [
            {
              "l": "I",
              "x": "v 1. endu tým s lepším Last Stone Draw,",
              "s": []
            },
            {
              "l": "II",
              "x": "v dalších endech tým, který v předchozím endu neskóroval,",
              "s": []
            },
            {
              "l": "III",
              "x": "když nikdo neskóroval, rozhoduje pro další end tým, který v endu házel první. Po blank endu kvůli stejné vzdálenosti při měření rozhoduje dál stejný tým.",
              "s": []
            }
          ]
        },
        {
          "l": "h",
          "x": "Chybné postavení umístěných kamenů:",
          "s": [
            {
              "l": "I",
              "x": "zjistí-li se po prvním kameni, end se hraje znovu,",
              "s": []
            },
            {
              "l": "II",
              "x": "zjistí-li se až po druhém kameni, hra pokračuje.",
              "s": []
            }
          ]
        },
        {
          "l": "i",
          "x": "Tým s kamenem na pozici A hází první, tým s kamenem na pozici B hází druhý.",
          "s": []
        },
        {
          "l": "j",
          "x": "Když tým hodí označený umístěný kámen, odstraní se jeho naposledy odehraný kámen, jakmile se to zjistí. Opakování ve stejné soutěži znamená kontumaci.",
          "s": []
        },
        {
          "l": "k",
          "x": "Umístění si každý tým zajišťuje sám; zdržení spustí jeho čas, a zdržují-li oba, spustí se čas týmu, který má začínat. Power play se musí ohlásit do konce 60sekundové přestávky, nebo po 4½ minutách přestávky v polovině zápasu (6½ minuty u vozíčkářů), jinak se spustí čas týmu, který ho ohlašuje.",
          "s": []
        },
        {
          "l": "l",
          "x": "Hráč, který nehází, smí být při odehrání kdekoli na ledě. Po odehrání smí jeden nebo oba hráči zametat svůj kámen i jiné kameny svého týmu uvedené do pohybu, kdekoli před tee line na hrací straně, i při Last Stone Draw.",
          "s": []
        },
        {
          "l": "m",
          "x": "Při porušení pravidel odehrání se kámen odstraní a posunuté kameny se vrátí. Zjistí-li se to až po dalším kameni, hra pokračuje, ale hráč, který hází první kámen, smí v endu hodit nejvýše 2 kameny.",
          "s": []
        },
        {
          "l": "n",
          "x": "Opakovaný end se hraje se stejnými volbami jako původní, včetně umístění kamenů a pořadí hráčů.",
          "s": []
        }
      ]
    },
    {
      "id": "R18",
      "t": "Zakázané látky",
      "en": "Prohibited Substances",
      "p": [
        {
          "l": "—",
          "x": "Látky zvyšující výkon jsou zakázané, pokud hráč nemá terapeutickou výjimku, a to i při neúmyslném užití. Porušení znamená diskvalifikaci, oznámení národnímu svazu a případně další zákaz činnosti.",
          "s": []
        }
      ]
    },
    {
      "id": "R19",
      "t": "Nevhodné chování",
      "en": "Inappropriate Behaviour",
      "p": [
        {
          "l": "—",
          "x": "Nevhodné chování, urážlivé výrazy, ničení vybavení a úmyslné poškození čehokoli jsou zakázané pro všechny členy týmu a mohou vést k zastavení činnosti.",
          "s": []
        }
      ]
    }
  ],
  "C": [
    {
      "id": "C1",
      "t": "Obecně",
      "en": "General",
      "p": [
        {
          "l": "a",
          "x": "Hraje se podle aktuálních pravidel World Curling; případné úpravy se vysvětlí na Team Meetingu.",
          "s": []
        },
        {
          "l": "b",
          "x": "World Curling může vyřadit tým nebo národní svaz z akce, pokud by jeho účast vážně poškodila akci nebo bezpečnost.",
          "s": []
        },
        {
          "l": "c",
          "x": "Termíny soutěží určuje World Curling.",
          "s": []
        },
        {
          "l": "d",
          "x": "Hrací rozpis a program akce určuje World Curling.",
          "s": []
        },
        {
          "l": "e",
          "x": "Kouření, i elektronických cigaret, je v soutěžním prostoru zakázáno.",
          "s": []
        },
        {
          "l": "f",
          "x": "Platí antidopingová pravidla odpovídající požadavkům WADA, zveřejněná na webu World Curling.",
          "s": []
        },
        {
          "l": "g",
          "x": "Odchylka od doporučených rozměrů plochy potřebuje souhlas World Curling.",
          "s": []
        },
        {
          "l": "h",
          "x": "Zlaté, stříbrné a bronzové medaile získají první tři týmy: 5 hráčů (2 v mixed doubles, 4 v mixed) a trenér, pokud se účastní a plní své povinnosti. Na olympijských a paralympijských hrách dostávají medaile jen hráči.",
          "s": []
        }
      ]
    },
    {
      "id": "C2",
      "t": "Přihlášené týmy",
      "en": "Participating Teams",
      "p": [
        {
          "l": "a",
          "x": "Týmy nominuje národní svaz.",
          "s": []
        },
        {
          "l": "b",
          "x": "Když nominovaný tým nemůže nebo nechce hrát, svaz určí náhradní tým.",
          "s": []
        },
        {
          "l": "c",
          "x": "Hráči a doprovod se přihlašují nejméně 14 dní před soutěží; změny lze oznámit do začátku Team Meetingu.",
          "s": []
        },
        {
          "l": "d",
          "x": "Každý hráč musí být řádným členem svého svazu.",
          "s": []
        },
        {
          "l": "e",
          "x": "Svaz, který se z akce odhlásí nebo nenastoupí, sestupuje v další sezóně o jednu divizi.",
          "s": []
        },
        {
          "l": "f",
          "x": "Do původní sestavy smí být zapsaní jen členové přítomní na začátku akce; výjimku v mimořádných případech povolí tříčlenná komise.",
          "s": []
        },
        {
          "l": "g",
          "x": "Každá osoba smí být uvedena jen jednou, buď jako hráč, nebo jako člen doprovodu.",
          "s": []
        },
        {
          "l": "h",
          "x": "Na Team Meetingu musí být alespoň jeden člen týmu, jinak tým ztrácí výhodu posledního kamene v prvním zápase. Na schůzkách před play-off musí být 1–2 členové.",
          "s": []
        },
        {
          "l": "i",
          "x": "Pořadí hráčů, skip, vice-skip, náhradník a trenér se zapisují do formuláře původní sestavy; sestava na zápas se odevzdává 45 minut před začátkem.",
          "s": []
        },
        {
          "l": "j",
          "x": "Tým musí každý zápas začít se 4 hráči (v mixed doubles se 2), jinak kontumace. Začátek ve třech může v mimořádných případech povolit tříčlenná komise.",
          "s": []
        },
        {
          "l": "k",
          "x": "Členové doprovodu smí potichu komunikovat zvenku hrací plochy, pokud to hala dovoluje, a nesmí rušit soupeře. Smí být na rozcvičeních a sledovat přenos svého zápasu jen bez zvuku. Porušení vede k vykázání viníka, pak celého doprovodu.",
          "s": []
        }
      ]
    },
    {
      "id": "C3",
      "t": "Oblečení a vybavení",
      "en": "Uniforms / Equipment",
      "p": [
        {
          "l": "a",
          "x": "Členové týmu nosí na hrací ploše stejné oblečení a obuv, barevně odpovídající světlým nebo tmavým rukojetím, schválené podle pravidel World Curling.",
          "s": []
        },
        {
          "l": "b",
          "x": "Reklama na oblečení a vybavení je povolená podle pravidel World Curling.",
          "s": []
        },
        {
          "l": "c",
          "x": "Člen týmu v nevhodném oblečení nesmí na hrací plochu.",
          "s": []
        },
        {
          "l": "d",
          "x": "Stužky, pásky a podobné symboly jsou na hrací ploše zakázané.",
          "s": []
        },
        {
          "l": "e",
          "x": "Každý hráč nahlásí na začátku zápasu jeden schválený kartáč a smí používat jen ten. Zametání cizím kartáčem: vlastní kámen se odstraní, kámen soupeře se vrátí.",
          "s": []
        },
        {
          "l": "f",
          "x": "Hlavu kartáče lze během zápasu vyměnit jen se svolením hlavního rozhodčího; neschválená výměna znamená kontumaci.",
          "s": []
        },
        {
          "l": "g",
          "x": "Po nástupu náhradníka musí hráči ponechat hlavy kartáčů své pozice; nový kartáč nebo přeskupení znamená kontumaci.",
          "s": []
        },
        {
          "l": "h",
          "x": "Vybavení na hrací ploše musí odpovídat pravidlům World Curling pro soutěžní vybavení.",
          "s": []
        },
        {
          "l": "i",
          "x": "Nevyhovující vybavení: poprvé diskvalifikace hráče a kontumace, podruhé diskvalifikace týmu a zákaz soutěží World Curling pro všechny hráče na 12 měsíců.",
          "s": []
        },
        {
          "l": "j",
          "x": "Vybavení vozíčkářů řídí pravidla World Curling pro vozíčkáře.",
          "s": []
        }
      ]
    },
    {
      "id": "C4",
      "t": "Rozcvičení před zápasem",
      "en": "Pre-Game Practice",
      "p": [
        {
          "l": "a",
          "x": "Před každým zápasem má každý tým rozcvičení na ploše, kde hraje.",
          "s": []
        },
        {
          "l": "b",
          "x": "Rozcvičení trvá 7 minut v mixed doubles a 9 minut v ostatních soutěžích.",
          "s": []
        },
        {
          "l": "c",
          "x": "Pořadí rozcvičení v základní části se určí předem tak, aby každý tým šel stejně často první i druhý.",
          "s": []
        },
        {
          "l": "d",
          "x": "V play-off s předem určeným posledním kamenem 1. endu se rozcvičuje první tým, který má poslední kámen.",
          "s": []
        },
        {
          "l": "e",
          "x": "Hlavní technik ledu může po rozcvičení led vyčistit a znovu pokropit.",
          "s": []
        }
      ]
    },
    {
      "id": "C5",
      "t": "Délka zápasů",
      "en": "Length of Games",
      "p": [
        {
          "l": "a",
          "x": "V soutěžích na 10 endů musí být v play-off odehráno nejméně 8 endů, v ostatních zápasech nejméně 6.",
          "s": []
        },
        {
          "l": "b",
          "x": "V soutěžích na 8 endů musí být odehráno nejméně 6 endů.",
          "s": []
        }
      ]
    },
    {
      "id": "C6",
      "t": "Čas zápasu",
      "en": "Game Timing",
      "p": [
        {
          "l": "a",
          "x": "Každý tým má čas na rozmyšlení, viditelný po celý zápas:",
          "s": [
            {
              "l": "I",
              "x": "38 minut v zápase na 10 endů,",
              "s": []
            },
            {
              "l": "II",
              "x": "30 minut na 8 endů,",
              "s": []
            },
            {
              "l": "III",
              "x": "38 minut u vozíčkářů,",
              "s": []
            },
            {
              "l": "IV",
              "x": "26 minut v mixed doubles vozíčkářů,",
              "s": []
            },
            {
              "l": "V",
              "x": "22 minut v mixed doubles.",
              "s": []
            }
          ]
        },
        {
          "l": "b",
          "x": "Při opožděném začátku se za každý započtený end odečte:",
          "s": [
            {
              "l": "I",
              "x": "3 min 45 s (zápasy na 10 a 8 endů),",
              "s": []
            },
            {
              "l": "II",
              "x": "4 min 45 s (vozíčkáři),",
              "s": []
            },
            {
              "l": "III",
              "x": "3 min 15 s (mixed doubles vozíčkářů),",
              "s": []
            },
            {
              "l": "IV",
              "x": "2 min 45 s (mixed doubles).",
              "s": []
            }
          ]
        },
        {
          "l": "c",
          "x": "Na extra end se čas nastaví na:",
          "s": [
            {
              "l": "I",
              "x": "4 min 30 s (zápasy na 10 a 8 endů),",
              "s": []
            },
            {
              "l": "II",
              "x": "6 min (vozíčkáři),",
              "s": []
            },
            {
              "l": "III",
              "x": "4 min (mixed doubles vozíčkářů),",
              "s": []
            },
            {
              "l": "IV",
              "x": "3 min (mixed doubles).",
              "s": []
            }
          ]
        },
        {
          "l": "d",
          "x": "Zápas i každý end začínají po skončení přestávky. Čas týmu, který hází, se spustí jen tehdy, když zdržuje; jinak se nejdřív spustí čas týmu s druhým kamenem.",
          "s": []
        },
        {
          "l": "e",
          "x": "Čas týmu, který nehází, se spustí, až se všechny kameny zastaví nebo přejedou back line, posunuté kameny se vrátí a dům je předán.",
          "s": []
        },
        {
          "l": "f",
          "x": "Čas týmu se zastaví, když jeho kámen dojede k tee line (u vozíčkářů k hog line).",
          "s": []
        },
        {
          "l": "g",
          "x": "Tým smí házet, jen když jeho čas běží nebo má běžet.",
          "s": []
        },
        {
          "l": "h",
          "x": "Když se kvůli vnějšímu vlivu musí kameny přemístit, oba časy se zastaví.",
          "s": []
        },
        {
          "l": "i",
          "x": "Když zasáhne rozhodčí, oba časy se zastaví.",
          "s": []
        },
        {
          "l": "j",
          "x": "Mezi endy neběží žádný čas. Přestávka trvá 1 minutu (v mixed doubles o 30 s déle, když hráči staví kameny), přestávka v polovině zápasu 5 minut (7 minut v mixed doubles vozíčkářů).",
          "s": []
        },
        {
          "l": "k",
          "x": "Zda se čas na opakované odehrání odečte týmu, rozhodne rozhodčí.",
          "s": []
        },
        {
          "l": "l",
          "x": "Opakovaný end začíná s časy, které byly na konci předchozího endu.",
          "s": []
        },
        {
          "l": "m",
          "x": "Po napomenutí za zbytečné zdržování se kámen, který do 45 sekund nedojede k tee line (u vozíčkářů k hog line), odstraní.",
          "s": []
        },
        {
          "l": "n",
          "x": "Tým musí svou část zápasu odehrát v čase, jinak prohrává kontumačně. Kámen, který dojede k tee line (u vozíčkářů k hog line) před vypršením času, platí.",
          "s": []
        },
        {
          "l": "o",
          "x": "Běžel-li kvůli chybě nesprávný čas, postiženému týmu se vrátí dvojnásobek odsouhlasené doby.",
          "s": []
        },
        {
          "l": "p",
          "x": "Neběžel-li čas týmu kvůli chybě, nic se mu neodečte a příslušná doba se přičte soupeři.",
          "s": []
        },
        {
          "l": "q",
          "x": "Běžel-li čas týmu kvůli chybě déle, odsouhlasená doba se mu vrátí.",
          "s": []
        }
      ]
    },
    {
      "id": "C7",
      "t": "Time-outy",
      "en": "Team Time-Outs / Technical Time-Outs",
      "p": [
        {
          "l": "a",
          "x": "Týmové time-outy jsou povolené na všech akcích World Curling, s časomírou i bez ní.",
          "s": []
        },
        {
          "l": "b",
          "x": "Každý tým má v zápase jeden time-out na 60 sekund a jeden navíc v každém extra endu.",
          "s": []
        },
        {
          "l": "c",
          "x": "Postup při týmovém time-outu:",
          "s": [
            {
              "l": "I",
              "x": "vyhlásit ho smí jen hráč na ledě,",
              "s": []
            },
            {
              "l": "II",
              "x": "jen když běží čas jeho týmu, znamením „T“ rukama,",
              "s": []
            },
            {
              "l": "III",
              "x": "trvá dobu přesunu určenou hlavním rozhodčím plus 60 sekund,",
              "s": []
            },
            {
              "l": "IV",
              "x": "za týmem smí přijít jen jeden člen doprovodu (případně tlumočník), určenou cestou a bez vstupu na hrací led,",
              "s": []
            },
            {
              "l": "V",
              "x": "10 sekund před koncem je tým upozorněn,",
              "s": []
            },
            {
              "l": "VI",
              "x": "po skončení time-outu musí doprovod okamžitě přestat a odejít.",
              "s": []
            }
          ]
        },
        {
          "l": "d",
          "x": "Technický time-out (kvůli rozhodnutí, zranění nebo mimořádným okolnostem) zastaví časy; účastní se jen hráči na ledě, pokud hlavní rozhodčí nepozve další.",
          "s": []
        }
      ]
    },
    {
      "id": "C8",
      "t": "Přidělení kamenů a Last Stone Draw",
      "en": "Stone Assignment / Last Stone Draw",
      "p": [
        {
          "l": "a",
          "x": "V základní části hraje tým uvedený v rozpisu první s tmavými rukojeťmi, druhý se světlými.",
          "s": []
        },
        {
          "l": "b",
          "x": "Last Stone Draw: po rozcvičení se hodí dva kameny na tee na domácí straně, jeden po směru a jeden proti směru hodinových ručiček, každý nejvýše za 60 sekund. Předčasný, opožděný kámen nebo kámen se špatnou rotací se zapíše jako 1,996 m.",
          "s": []
        },
        {
          "l": "c",
          "x": "Měření:",
          "s": [
            {
              "l": "I",
              "x": "měří se od tee k nejbližší části kamene a zobrazí se ke středu kamene v centimetrech,",
              "s": []
            },
            {
              "l": "II",
              "x": "oficiální poloměr kamene je 142 mm,",
              "s": []
            },
            {
              "l": "III",
              "x": "k naměřené hodnotě se přičte poloměr; kámen mimo dům se zapíše jako 1,996 m (1,854 m + 142 mm),",
              "s": []
            },
            {
              "l": "IV",
              "x": "kámen zakrývající tee se měří ze dvou otvorů na okraji kruhu 4 ft, 610 mm od středu a 90° od sebe.",
              "s": []
            }
          ]
        },
        {
          "l": "d",
          "x": "Minimální počet LSD na hráče závisí na počtu zápasů základní části, například při 4–6 zápasech 2 kameny na hráče (1 po směru a 1 proti směru). Nesplněné minimum se zapíše jako 1,996 m.",
          "s": []
        },
        {
          "l": "e",
          "x": "V mixed doubles hází každý hráč stejný počet LSD po směru i proti směru; při lichém počtu zápasů je povolena jedna odchylka na hráče.",
          "s": []
        },
        {
          "l": "f",
          "x": "V jedné skupině si barvu kamenů a poslední kámen 1. endu volí tým s lepší bilancí, při shodě výše umístěný tým.",
          "s": []
        },
        {
          "l": "g",
          "x": "Mezi skupinami v play-off volí výše umístěný tým; při stejném umístění rozhoduje nižší DSC.",
          "s": []
        },
        {
          "l": "h",
          "x": "Ve dvoukolové skupině volí tým s lepší bilancí, při shodě tým, který vyhrál oba vzájemné zápasy, a při remíze vzájemných zápasů nižší DSC.",
          "s": []
        }
      ]
    },
    {
      "id": "C9",
      "t": "Pořadí týmů a Draw Shot Challenge",
      "en": "Team Ranking Procedure / Draw Shot Challenge",
      "p": [
        {
          "l": "a",
          "x": "Týmy se stejnou bilancí mají stejné pořadí a uvádějí se abecedně podle třípísmenného kódu.",
          "s": []
        },
        {
          "l": "b",
          "x": "Pořadí v základní části se určuje postupně podle:",
          "s": [
            {
              "l": "I",
              "x": "bilance výher a proher,",
              "s": []
            },
            {
              "l": "II",
              "x": "vzájemného zápasu dvou týmů se shodou,",
              "s": []
            },
            {
              "l": "III",
              "x": "zápasů mezi třemi a více týmy se shodou,",
              "s": []
            },
            {
              "l": "IV",
              "x": "DSC u zbývajících shod.",
              "s": []
            }
          ]
        },
        {
          "l": "c",
          "x": "Při spojeném pořadí skupin se týmy na stejném místě porovnají podle DSC.",
          "s": []
        },
        {
          "l": "d",
          "x": "Konečné pořadí:",
          "s": [
            {
              "l": "I",
              "x": "bez play-off podle (b), případně (c),",
              "s": []
            },
            {
              "l": "II",
              "x": "s play-off podle systému play-off a bodů d(III), d(IV) a (c),",
              "s": []
            },
            {
              "l": "III",
              "x": "bez kvalifikačních bodů jsou týmy vyřazené ve stejném kole na stejném místě,",
              "s": []
            },
            {
              "l": "IV",
              "x": "s kvalifikačními body si týmy ze stejné skupiny ponechají pořadí ze základní části, týmy z různých skupin hrají zápasy o umístění.",
              "s": []
            }
          ]
        },
        {
          "l": "e",
          "x": "Týmy, které nenastoupí, nedohrají nebo jsou diskvalifikované (DNS, DNF, DSQ, DQB), se řadí podle zvláštních pravidel: DNF si ponechá odehrané výsledky a další zápasy prohrává kontumačně, DNS, DSQ a DQB jsou na konci pořadí a nezískávají body.",
          "s": []
        },
        {
          "l": "f",
          "x": "Draw Shot Challenge (DSC) je průměr LSD týmu ze základní části bez nejhorších výsledků:",
          "s": [
            {
              "l": "I",
              "x": "nižší DSC je lepší; při shodě rozhoduje nejlepší nestejný LSD, pak umístění svazu ve světovém žebříčku,",
              "s": []
            },
            {
              "l": "II",
              "x": "při 11 a méně kamenech se vyřadí jeden nejhorší výsledek, při více než 11 dva,",
              "s": []
            },
            {
              "l": "III",
              "x": "při nestejně velkých skupinách se použije jen stejný počet prvních zápasů.",
              "s": []
            }
          ]
        }
      ]
    },
    {
      "id": "C10",
      "t": "Rozhodčí",
      "en": "Umpires",
      "p": [
        {
          "l": "a",
          "x": "World Curling jmenuje pro každou soutěž hlavního rozhodčího a jeho zástupce.",
          "s": []
        },
        {
          "l": "b",
          "x": "Rozhodčí rozhodne každý spor mezi týmy, i když na něj pravidla přímo nepamatují.",
          "s": []
        },
        {
          "l": "c",
          "x": "Rozhodčí může kdykoli zasáhnout do umístění kamenů, chování a dodržování pravidel.",
          "s": []
        },
        {
          "l": "d",
          "x": "Hlavní rozhodčí může s oprávněním zasáhnout do kteréhokoli zápasu.",
          "s": []
        },
        {
          "l": "e",
          "x": "Rozhodčí může zápas z jakéhokoli důvodu pozdržet a určí, na jak dlouho.",
          "s": []
        },
        {
          "l": "f",
          "x": "O všech otázkách pravidel rozhodují rozhodčí; rozhodnutí hlavního rozhodčího po odvolání je konečné.",
          "s": []
        },
        {
          "l": "g",
          "x": "Hlavní rozhodčí může vyloučit člena týmu za nepřijatelné chování nebo výrazy; tým vyloučeného hráče prohrává kontumačně a náhradník ho nesmí nahradit.",
          "s": []
        },
        {
          "l": "h",
          "x": "Hlavní rozhodčí může řídícímu orgánu doporučit diskvalifikaci nebo zastavení činnosti hráče či člena doprovodu.",
          "s": []
        }
      ]
    }
  ],
  "T": [
    {
      "id": "T",
      "t": "Triples (Curling Canada)",
      "en": "Triples",
      "p": [
        {
          "l": "1",
          "x": "Tým tvoří 3 hráči a každý hází v endu 2 kameny, tedy 6 kamenů na tým.",
          "s": []
        },
        {
          "l": "2",
          "x": "Zápas má 6 endů ve třech setech po dvou endech. Hráči se po každém setu posouvají na pozicích Lead, Middle a Skip, takže každý hraje každou pozici.",
          "s": []
        },
        {
          "l": "3",
          "x": "Pokud není uvedeno jinak, platí pravidla Curling Canada, včetně pravidla pěti kamenů (free guard zone) a no-tick.",
          "s": []
        }
      ]
    }
  ]
};
