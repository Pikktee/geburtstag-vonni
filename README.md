# Vonni Geburtstags-Gutschein 🎁🐨

Interaktiver, ironisch-sketchy Geburtstags-Gutschein mit 3D-Hintergrund, Konfetti, Feuerwerk und Überraschungstrip-Flow.

## Setup

```bash
npm install
npm run generate   # Bilder (FAL) + Audio (ElevenLabs) – benötigt .env
npm run dev
```

## .env

```
FAL_KEY=...
ELEVEN_LABS_KEY=...
```

## Flow

1. Sketchy „Gewinn"-Overlay starten
2. Geburtstagsgruß + Annahme/ Ablehnung
3. Bestätigung + Kalender (unverbindliche Terminanfrage)
4. Hinweis auf Organisator-Bestätigung

Assets werden in `public/assets/` gecacht und beim erneuten `generate` übersprungen.
