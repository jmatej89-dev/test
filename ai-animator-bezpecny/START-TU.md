# AI Animátor – začni tu

Z jedného nápadu spraví Claude hotové 3D animované video: napíše scenár, v Blenderi postaví 3D svet, rozanimuje ho, pridá hlas, titulky, zvuky a celé to zostrihá.

## Inštalácia (raz, ~10 minút)
1. Otvor **Claude Code** (desktop appka → záložka Code) v priečinku, kde máš stiahnutý ZIP.
2. Vlož prompt zo súboru `PROMPT-INSTALACIA.txt`. Claude všetko nainštaluje sám (Blender, ffmpeg, Python) a vyrenderuje ukážku.

## Ako spraviť video
Otvor nový chat v priečinku `Dokumenty/ai-animator` a napíš:

```
/animacia prečo lietadlá na mape nelietajú rovno
```

Claude ti ukáže skript, ty povieš „ok“ (alebo čo zmeniť), a o pár minút máš `projekty/<nazov>/hotove.mp4`.

## Hlas
- **Najlepšie:** nahraj skript na mobil a pošli Claudovi cestu k súboru.
- **AI hlas:** ElevenLabs (od ~5 $/mes.) – kľúč pošli Claudovi, uloží ho do `.env`.
- **Zadarmo:** Piper – po česky znie dobre, po slovensky len na skúšku.

## Čo vie
- Vysvetľovačky „ako sa z jamy na dvore stane kryt“, otázky „prečo…?“, príbehy na pokračovanie, krátke podobenstvá, interaktívne série (mestečko, kde každý follower dostane domček).
- Mapy a glóbus (trasy, mestá, prechod mapa ↔ glóbus), postavičky, stavby, príroda, výbuchy, dym.
- Titulky (po slove alebo karaoke), pojmy ako pečiatky, zvukové efekty, hudba (tvoja), hlasitosť pre sociálne siete.

Potrebuješ: Windows 10/11 alebo Mac, Claude Pro (Claude Code), ~3 GB miesta. Grafická karta pomôže, ale nie je nutná.

---
AI Animátor je zadarmo od @risokrr. Chceš, aby ti Claude strihal aj videá, kde rozprávaš do kamery (titulky, animácie, zvuky)? Pozri **AI Strihač**: https://risokr.netlify.app/?s=animator
