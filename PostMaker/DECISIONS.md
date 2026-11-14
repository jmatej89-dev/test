# Rozhodnutí

Zapsaná rozhodnutí, která zadání nechalo otevřená nebo kde jsem se od něj vědomě odchýlil.

## Technologie
- **Expo SDK 58** (aktuální). Verze balíčků přes `npx expo install` (offline režim, protože Expo API bylo za proxy nedostupné).
- **Gesture Handler 3** – použito nové hooks API (`usePanGesture`, `usePinchGesture`…).
- **Perzistence: AsyncStorage** místo MMKV – MMKV není v Expo Go a appka má jít spustit bez Macu přes Expo Go. Data jsou malá (JSON projektů), fotky leží jako soubory v `Documents/photos`.
- **Montserrat** z `@expo-google-fonts/montserrat` (licence OFL v `assets/fonts/OFL.txt`), do Skia načtený přes `useFonts` z RN Skia. Přes `expo-font` se nenačítá – UI používá systémové písmo (SF Pro), Montserrat jen ve slajdech.
- **Slider, bottom sheet** jsou vlastní komponenty (Reanimated + Gesture Handler), aby nebyla potřeba další nativní závislost mimo Expo Go.
- **Uložení do Fotek**: nové API `expo-media-library` (`Asset.create`, jen zápis – `requestPermissionsAsync(true)`).
- **Web** existuje jen jako vývojový náhled UI (CanvasKit se načte před aplikací v `index.js`). Cílová platforma je iOS.

## Renderer a layout
- Jeden renderer (`drawSlide`) kreslí do libovolného Skia plátna: náhled (SkPicture zmenšená), export (offscreen 2160×2700, scale 2) a golden testy (CanvasKit v Node). WYSIWYG je tak zaručené konstrukcí.
- Text se měří přes Skia Paragraph (shaping, kerning, ligatury) – stejné jako při kreslení. Zalamování dělá vlastní layout (kvůli tvrdým mezerám, sirotkům a auto-fitu); každý řádek se kreslí jako jednořádkový odstavec.
- **Účaří**: `baseline = top + 0.76·fs`, viditelný spodek = `baseline + 0.22·fs`. Limit 1235 px se kontroluje proti viditelnému spodku.
- **„›››“** na (68, H−108) = horní hrana řádku (jako v grafických nástrojích) → účaří 1304, stejné jako vodoznak.
- **Titulek**: bílé řádky, pak azurové řádky (azurová část začíná na novém řádku, bez mezery navíc). Zalamování titulku je vyvážené (minimum raggedness), aby řádky byly podobně dlouhé.
- **Sirotci**: pořadí oprav je (b) přebalancování se stejným počtem řádků → (c) tvrdá mezera mezi poslední dvě slova; (a) menší písmo řeší auto-fit tím, že preferuje největší velikost *bez* sirotka. (b) před (a) proto, že zachovává větší písmo.
- **Citace – výběr hlavičky**: pro každou výšku 547 → 500 → 450 → 420 se najde největší písmo bez sirotka; první kombinace s písmem ≥ 48 px vyhrává, jinak ta s největším písmem.
- **Velikost jména/role**: jméno `max(26, round(0.45·fs))` SemiBold azurová, role o 4 px menší (min 22) Regular bílá 60 %.
- **Fade**: smoothstep aproximovaný 17 zastávkami gradientu (žádné pásy). „Vypnutý“ fade = krátký měkký okraj (8 % hlavičky), nikdy ostrý řez. Intenzita 0,4–1,5× délky.
- **Uvozovky u citací** doplní layout automaticky („ … “), pokud v textu nejsou.
- **Tvrdé mezery** automaticky: jednopísmenné předložky/spojky, `70 000`, `9,8 milionu`, `22. 7.`, `50 %`, před pomlčkou a po běžných zkratkách (`tzv.`, `MUDr.`…).
- **Nízké rozlišení**: šířka < 1080 px nebo efektivní zvětšení výřezu > 1,33×.

## UX
- **Zvýraznění** dvěma způsoby: výběr v textovém poli → plovoucí glass tlačítko „Zvýraznit“ nad klávesnicí (InputAccessoryView), a v nástroji Zvýraznění klepání na slova (u titulku klepnutí na slovo, kterým začíná azurová část). Výběr se vždy rozšíří na celá slova.
- **Undo/redo**: tlačítka v horní liště a tah třemi prsty po náhledu (← zpět, → znovu). Rychlé psaní se slučuje do jednoho kroku. **Zatřesení (shake) není implementované** – vyžadovalo by `expo-sensors` a koliduje se systémovým „Zatřesením zpět“ v textových polích.
- **Pásek slajdů**: klepnutí = výběr, podržet a táhnout = přesun, podržet a pustit = menu (Duplikovat / Změnit typ / Smazat).
- **Sdílení**: iOS share sheet z `expo-sharing` umí jeden soubor, proto „Sdílet“ postupně nabízí slajd 1/N, 2/N… Pro carousel na Instagram je nejrychlejší „Uložit do Fotek“ (uloží se v pořadí).
- **Export** a **Popisek** jsou ve spodní části (dosah palce): exportní kulaté glass tlačítko vedle lišty nástrojů (vzor iOS 26 tab bar + akce), popisek vedle pásku miniatur.
- **„Vložit celý příspěvek“** navíc: blok začínající uvozovkami se stane citací (další řádky = jméno, role). Pokud v textu není `---`, oddělují se bloky prázdným řádkem.
- Kontrola hlásí i informativní body (rizikové slovo na slajdu, vulgarita, citace bez zvýraznění, první slajd není titulní), ty nejsou započítané do čísla na štítu.

## Výchozí seznam rizikových výrazů
Kořeny slov (porovnání bez diakritiky na začátek slova) → návrh náhrady:
`vrah → pachatel`, `vražd → zločin`, `zabít → připravit o život`, `zabil → připravil o život`, `zabij → útočí na`,
`sebevražd → s*bevražda`, `znásiln → sexuální útok`, `terorist → útočník`, `mrtv → bez života`, `zbraň → zbr*ň`,
`drog → dr*gy`, `nacist → n*cista`. Seznam je upravitelný v Nastavení.

## Co nešlo ověřit v tomto prostředí
- Běh na fyzickém iPhonu (vývoj probíhal na Linuxu bez simulátoru). Ověřeno: iOS JS bundle se sestaví (`expo export --platform ios`), testy renderu běží na stejném Skia kódu, UI prošlo kontrolou ve webovém náhledu v rozměru iPhonu. Liquid Glass, haptika, InputAccessoryView, ukládání do Fotek a share sheet jsou nativní iOS funkce, které je potřeba vyzkoušet v telefonu.
