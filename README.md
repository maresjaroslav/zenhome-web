# ZENHOME — statický web

Nová statická verze webu ZENHOME určená pro GitHub Pages. Web nepoužívá
SITE123 ani žádný framework a lze ho otevřít z libovolného jednoduchého HTTP
serveru.

## Lokální spuštění

```bash
python3 -m http.server 8080
```

Poté otevřete `http://localhost:8080`.

## Kontrola před publikováním

Po prvním `npm install` lze spustit automatické testy hlavní stránky,
mobilního menu, recenzí a galerie:

```bash
npm test
```

## Struktura

- `index.html` — hlavní stránka
- `galerie.html` — filtrovatelná galerie 295 fotografií
- `principy.html` — přehled článků
- `principy/` — jednotlivé články
- `404.html` — vlastní chybová stránka
- `assets/gallery/` — lokálně uložené optimalizované fotografie
- `data/gallery.json` — editovatelná metadata galerie
- `tools/import_site123.py` — opakovatelný import z původního webu

## Publikování

Repozitář je připravený pro GitHub Pages z kořene větve `main`. Soubor
`CNAME` se přidá až při domluveném přepnutí domény `zenhome.cz`; současný web
se tímto projektem automaticky nemění.

Kontaktní formulář v první verzi připraví zprávu v e-mailovém programu
návštěvníka. Před ostrým spuštěním lze napojit vlastní formulářovou službu.
