# listengenerator

Passwortgeschützte Webanwendung zur Verwaltung von Wunschlisten.  
Läuft als PHP-App auf einem Webspace, die fertigen Listen sind autarke statische HTML-Seiten.

## Voraussetzungen

- PHP 8.3+ (mit cURL, mbstring, openssl)
- Node.js 22+ (nur lokal für das Frontend)

## Lokale Entwicklung

```bash
./createEnv.sh     # .env einmalig einrichten
./start.sh         # PHP (Port 8088) + Vite (Port 5173) starten
# → http://localhost:5173
```

## Deployment

```bash
./deploy.sh        # Frontend bauen + per SCP auf den Server deployen
```

`listen/` auf dem Server wird dabei **nicht** angefasst (Laufzeitdaten).  
`.env` muss einmalig manuell auf dem Server liegen.

## Projektstruktur

```
api/          PHP-Endpunkte (auth, lists, meta, images, deploy)
lib/          PHP-Bibliotheken (jwt, auth, csv, build, meta, image, ssrf)
frontend/     React + Vite (Quellcode)
public/       Vite Build-Output (wird deployed)
template/     HTML-Template für die statischen Listen
listen/       Laufzeitdaten: {name}/links.csv, img/, index.html
```

## API-Übersicht

| Endpunkt | Methode | Funktion |
|---|---|---|
| `/api/auth` | POST | Login → JWT (8h gültig) |
| `/api/lists/:name` | GET / PUT | Liste laden / speichern |
| `/api/meta` | POST | OpenGraph-Metadaten abrufen |
| `/api/images/:name` | POST | Bild hochladen oder von URL laden |
| `/api/deploy/:name` | POST | `listen/{name}/index.html` bauen |

## .env

```bash
./createEnv.sh   # erzeugt PASSWORD_HASH (bcrypt) und JWT_SECRET (256 Bit hex)
```

