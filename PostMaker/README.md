# Post Maker

iPhone appka pro rychlou výrobu Instagram carouselů 4:5 (titulní, textové a citační slajdy) a popisku
ve fixním formátu. Všechno běží lokálně v telefonu – žádný backend, účty ani analytika.

Expo SDK 58 · React Native 0.88 · TypeScript (strict) · Expo Router · React Native Skia · Reanimated 4 · Gesture Handler 3.

## Spuštění na iPhonu (bez Macu)

### A) Expo Go (nejrychlejší)
1. Do iPhonu nainstaluj **Expo Go** z App Store (verze pro SDK 58).
2. Na počítači (Windows/Linux/Mac, Node 20+):
   ```bash
   cd PostMaker
   npm install
   npx expo start
   ```
3. Naskenuj QR kód Fotoaparátem iPhonu → otevře se v Expo Go.
   Telefon i počítač musí být ve stejné Wi-Fi (jinak `npx expo start --tunnel`).

Všechny použité knihovny jsou součástí Expo Go (Skia, Reanimated, Gesture Handler, Glass Effect, Blur,
Image Picker, Media Library, Sharing, Clipboard, File System, Haptics).

### B) Vlastní instalace (EAS development build)
Pro appku s vlastní ikonou na ploše, bez Expo Go:
```bash
npm install -g eas-cli
eas login
eas build --profile development --platform ios   # build běží v cloudu, Mac není potřeba
```
EAS se zeptá na Apple Developer účet a zaregistruje iPhone (stačí otevřít odkaz v telefonu).
Pak `npx expo start --dev-client` a otevřít appku.

## Vývoj

```bash
npm run lint        # ESLint (expo config)
npm run typecheck   # tsc --noEmit
npm test            # unit testy layoutu + golden testy renderu (Skia/CanvasKit v Node)
npm run test:update-golden   # po záměrné změně vzhledu přegeneruje referenční PNG
npm run web         # náhled UI v prohlížeči (jen pro vývoj; iOS je cílová platforma)
```

## Struktura

| Cesta | Obsah |
|---|---|
| `src/brand.ts` | barvy, font, všechny konstanty layoutu na jednom místě |
| `src/text/` | markup `{zvýraznění}` / `~`, česká typografie (tvrdé mezery, uvozovky), vulgarity, rizikové výrazy |
| `src/layout/` | čisté funkce: zalamování, sirotci, auto-fit, rozložení 3 typů slajdů |
| `src/render/` | jediný Skia renderer pro náhled, export i testy |
| `src/features/` | editor, popisek, export, kontrola, vložení celého příspěvku, projekty, nastavení |
| `src/store/` | stav (zustand + AsyncStorage, autosave, undo/redo), ukládání fotek |
| `src/app/` | obrazovky (Expo Router) |

Rozhodnutí a odchylky od zadání: [`DECISIONS.md`](DECISIONS.md).
