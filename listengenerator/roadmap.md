# 🗺️ Roadmap: listengenerator

Eine leichtgewichtige serverseitige Webanwendung zur Erzeugung und Verwaltung von Wunschlisten.

---

## 🎯 Projektziele & Vision

### Problem
Der aktuelle Workflow ist mühsam:
- **Variante A** (direkt): Link suchen → CSV bei GitHub manuell bearbeiten → Commit
- **Variante B** (lokal): Link suchen → `php -S localhost:8088` starten → CSV importieren → Metadaten laden → CSV + Bilder exportieren → Commit & Push

Beides erfordert entweder Git-Kenntnisse oder einen lokalen PHP-Server – und funktioniert nur am Heimrechner.

### Vision
Eine passwortgeschützte Webanwendung, die **von überall im Browser** erreichbar ist und den kompletten Workflow abdeckt:

- 🔗 URL eingeben → Titel & Bild werden **serverseitig** automatisch geladen
- ✏️ Liste bearbeiten (Titel, Kommentar, Reihenfolge, "Gekauft"-Status)
- 🖼️ Bilder werden **auf dem Server** gespeichert
- 🚀 Mit einem Klick die **statische HTML-Ausgabe** erzeugen und deployen
- 🔒 Geschützt durch Authentifizierung – kein unberechtigter Zugriff

### Nicht-Ziele (bewusste Abgrenzung)
- ❌ Kein komplexes Mehrnutzer-System mit Rollen/Rechten
- ❌ Keine Datenbank (CSV als Quelldatenformat reicht)
- ❌ Keine native App
- ❌ Kein SSH / kein externes Deploy-Skript – der Server baut alles selbst

---

## 🛠️ Technologie-Entscheidung

### Empfehlung: **PHP** ✅

Node.js steht auf dem Server nicht zur Verfügung. PHP ist die natürliche Wahl:

| Kriterium | PHP | Node.js/Express |
|---|---|---|
| Auf Server verfügbar | ✅ Webspace (Ionos/Plesk) bringt PHP immer mit | ❌ nicht vorhanden |
| Bereits im Projekt | ✅ `proxy.php`, `imageProxy.php` vorhanden | ⚠️ nur `package.json` |
| Kein Daemon nötig | ✅ läuft als FastCGI/mod_php direkt im Webspace | ❌ braucht pm2/systemd |
| File-System-Zugriff | ✅ `file_get_contents`, `file_put_contents` | — |
| OpenGraph-Scraping | ✅ cURL bereits in `proxy.php` implementiert | — |
| Lernkurve | ✅ Code aus `opengraph/` direkt wiederverwendbar | — |
| Deploy-Integration | ✅ Build-Logik direkt in PHP (`str_replace` ins Template) | — |

**Begründung**: PHP ist auf dem Shared-Webspace (`access895651998.webspace-data.io`) bereits aktiv – das Deploy-Ziel ist ein klassischer Webspace (Ionos). Ein PHP-Skript wird einfach per `scp`/`git push` hochgeladen und läuft sofort, ohne Prozess-Management. Der OpenGraph-Scraping-Code aus `proxy.php` und `imageProxy.php` kann direkt wiederverwendet werden. Eingesetzt wird **PHP 8.3** (Latest).

> **Hinweis zum lokalen Entwickeln**: Das bestehende `opengraph/`-Tool bleibt erhalten und kann weiterhin mit `php -S localhost:8088` lokal genutzt werden.

### Projektstruktur (geplant)

```
listengenerator/
├── roadmap.md
├── index.php              # SPA-Einstiegspunkt (liefert Frontend aus)
├── api/
│   ├── auth.php           # POST /api/auth            (Login → JWT)
│   ├── lists.php          # GET/PUT /api/lists/:name  (CSV lesen/schreiben)
│   ├── meta.php           # POST /api/meta            (OpenGraph-Scraper)
│   ├── images.php         # POST /api/images/:name    (Bild-Upload)
│   └── deploy.php         # POST /api/deploy/:name    (Build → listen/:name/)
├── lib/
│   ├── auth.php           # JWT-Prüfung bei jedem Request (Signatur + exp)
│   ├── jwt.php            # JWT erzeugen & verifizieren (HMAC-SHA256, kein externe Lib)
│   ├── csv.php            # CSV lesen/schreiben
│   ├── meta.php           # OpenGraph-Scraping (cURL, basierend auf proxy.php)
│   ├── ssrf.php           # SSRF-Schutz (IP-Blocklist)
│   ├── image.php          # Bild-Download & -Speicherung
│   └── build.php          # Template-Injection → index.html erzeugen
├── frontend/              # React + Vite (Quellcode, nicht deployed)
│   ├── src/
│   │   ├── App.tsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
├── public/                # Vite Build-Output (wird mit deployed)
│   ├── index.html
│   ├── assets/
│   └── ...
├── listen/                # Ausgabe-Verzeichnis (öffentlich erreichbar)
│   ├── artur/             # ← autarker Unterordner, eigenständig aufrufbar
│   │   ├── index.html     #   wird von deploy.php erzeugt
│   │   ├── links.csv      #   Quelldaten (nur im Webspace, nicht in Git)
│   │   └── img/           #   Bilder (nur im Webspace, nicht in Git)
│   └── robin/             # ← autarker Unterordner, eigenständig aufrufbar
│       ├── index.html
│       ├── links.csv
│       └── img/
├── template/              # Eingabe-Template (aus bestehendem template/ übernommen)
│   └── index.html
├── .env.example           # PASSWORD_HASH, JWT_SECRET
└── .htaccess              # URL-Rewriting für saubere API-Pfade
```

---

## 🏗️ Architektur-Überblick

```
Browser (SPA / React)
     │  HTTPS
     ▼
┌──────────────────────────────────────────────┐
│   PHP auf Webspace (FastCGI / mod_php)        │
│                                              │
│  POST /api/auth          ──► bcrypt + JWT    │
│  POST /api/meta          ──► Extern: Shop-URLs (Amazon, Thalia…)
│  GET  /api/lists/:name                       │
│  PUT  /api/lists/:name                       │
│  POST /api/deploy/:name  ──► In-Process Build │
│                              (lib/build.php) │
│  Datei-System (nur Webspace, nicht in Git):  │
│    listen/artur/links.csv                    │
│    listen/artur/img/                         │
│    listen/artur/index.html  ← Build-Output   │
│    listen/robin/  …                          │
└──────────────────────────────────────────────┘
         │
         ├── listen/artur/   ← autarker Unterordner
         │   Eigene index.html + img/, kein PHP,
         │   eigenständig über eigene URL aufrufbar
         └── listen/robin/   ← autarker Unterordner
```

### Datenpfad (typischer Request)

1. **Nutzer gibt URL ein** → `POST /api/meta?url=…`
2. Server ruft URL ab, parst OpenGraph-Tags (Titel, Bild-URL)
3. Server lädt Bild herunter → speichert in `listen/artur/img/`
4. API-Antwort mit Metadaten → Frontend erstellt neue Karte
5. Nutzer klickt „Speichern" → `PUT /api/lists/artur` schreibt `listen/artur/links.csv`
6. Nutzer klickt „Deploy" → `POST /api/deploy/artur` → `lib/build.php` injiziert CSV ins Template → schreibt `listen/artur/index.html`

---

## 📋 Phasen & Meilensteine

---

### 🥇 Phase 1: MVP (Kernfunktionalität)

**Ziel**: Die manuelle CSV-Bearbeitung vollständig ersetzen.

#### Features

| Feature | Beschreibung |
|---|---|
| 🔒 **Authentifizierung** | Einfaches Bearer-Token (`.env`), schützt alle API-Endpunkte und das Frontend |
| 📄 **Liste laden** | `GET /api/lists/:name` – liest `{name}/links.csv` und gibt JSON zurück |
| 💾 **Liste speichern** | `PUT /api/lists/:name` – schreibt JSON als CSV zurück |
| 🔗 **Metadaten abrufen** | `POST /api/meta` – serverseitiger OpenGraph-Scraper mit SSRF-Schutz |
| 🖼️ **Bild speichern** | Bild-URL wird serverseitig heruntergeladen und in `img/` gespeichert |
| ✏️ **Frontend (SPA)** | Port des bestehenden `opengraph/`-Frontends auf die neue API (kein PHP-Proxy mehr) |
| 🚀 **Deploy / Build** | `POST /api/deploy/:name` – `lib/build.php` injiziert CSV ins Template, schreibt `listen/{name}/index.html` |

#### API-Endpunkte (MVP)

```
POST   /api/auth                 { "password": "...", "list": "artur" } → { "token": "eyJ..." }
GET    /api/lists/:name          Gibt alle Listeneinträge als JSON zurück
PUT    /api/lists/:name          Überschreibt listen/{name}/links.csv
POST   /api/meta                 { "url": "..." } → { title, imageUrl, imagePath }
POST   /api/images/:name         Bild-Upload → speichert in listen/{name}/img/
POST   /api/deploy/:name         Build: Template + CSV → listen/{name}/index.html
GET    /listen/:name/…           Statisches Serving (index.html, img/, links.csv)
```

#### Akzeptanzkriterien
- [ ] Login-Schutz (Token im `Authorization`-Header)
- [ ] Liste laden, Karte hinzufügen (mit URL → automatische Metadaten), speichern
- [ ] Karte bearbeiten (Titel, Kommentar, Reihenfolge, Gekauft)
- [ ] Karte löschen
- [ ] Deploy startet und die statische Seite ist danach aktualisiert

---

### 🥈 Phase 2: UX-Verbesserungen & Robustheit

**Ziel**: Komfortabler und zuverlässiger im Alltag.

#### Features

| Feature | Beschreibung |
|---|---|
| 🔄 **Auto-Save / Dirty-State** | Änderungen automatisch speichern oder deutlich anzeigen (unsaved badge) |
| 🖼️ **Bild-Upload** | Eigenes Bild hochladen (statt URL-Scraping) – `POST /api/images/:name` |
| 🔄 **Metadaten aktualisieren** | Einzelne Karte neu scrapen (🔄-Button) |
| 📱 **Responsive Design** | Mobile-optimiertes UI |
| ⚡ **Deploy-Status** | Fortschrittsanzeige während Deploy, Erfolgs-/Fehler-Meldung |
| 🗑️ **Bild-Cleanup** | Beim Löschen einer Karte: zugehöriges Bild aus `img/` entfernen |
| 📋 **Listen-Auswahl** | Wechsel zwischen `artur` und `robin` im Frontend |
| 🛡️ **Fehlerbehandlung** | Graceful Error-Handling bei Scraping-Fehlern (Bot-Protection etc.) |

---

### 🥉 Phase 3: Erweiterte Features

**Ziel**: Langfristige Wartbarkeit und Komfort-Funktionen.

#### Features

| Feature                   | Beschreibung                                                                                                   |
|---------------------------|----------------------------------------------------------------------------------------------------------------|
| 📦 **Neue Liste anlegen** | `POST /api/lists` – legt neues Nutzerverzeichnis an                                                            |
| 🗄️ **Archiv-Funktion**   | Abgeschlossene Listen ins `archiv/`-Verzeichnis verschieben                                                    |
| 🔑 **Reservieren**        | Weiterer Status neben „Gekauft". Eigenes Token je Liste erlaubt die Reservierung durch ansonsten anonyme Nutzer |
| 💾 **Git-Backup**         | Laufzeitdaten (CSV + Bilder) per SCP vom Server auf den Dev-Rechner holen und dort per `git add/commit/push` ins Repository sichern – kein Git auf dem Server nötig |

---

## 🔒 Sicherheitskonzept

### Authentifizierung

**Vertrauensmodell**: Alle Token-Träger sind bekannte Personen (Familienkreis) – kein Rollen- oder Rechtekonzept nötig. Wer das Passwort kennt, darf alles.

**Konzept**: Passwort-Login → kurzlebiger JWT – das Passwort kommt einmalig per HTTPS an, danach läuft alles über einen signierten Token ohne weiteren Passwort-Kontakt.

```
Setup (einmalig, auf dem Server):
  php -r "echo password_hash('meinPasswort', PASSWORD_BCRYPT);"
  → Hash in .env eintragen als PASSWORD_HASH=$2y$10$...

Laufzeit – Schritt 1: Login
  Nutzer gibt Passwort ein (Eingabefeld im Frontend)
       │
       ▼  Klartext-Passwort via HTTPS  [kein Client-Hashing]
  POST /api/auth  { "password": "meinPasswort" }
       │
       ▼  password_verify($password, $_ENV['ARTUR_PASSWORD_HASH'])  [bcrypt]
  ✅ korrekt → JWT erzeugen & zurückschicken
  ❌ falsch  → 401

Laufzeit – Schritt 2: JWT erzeugen
  Payload: { "exp": now + 8h, "list": "artur" }
  Signatur: HMAC-SHA256(header.payload, JWT_SECRET aus .env)
  → Token: eyJ....eyJ....abc123  [kein Bezug zum Passwort]

Laufzeit – Schritt 3: Folge-Requests
  Frontend schickt: Authorization: Bearer eyJ....
       │
       ▼  Signatur prüfen + exp > now()  [lib/auth.php]
  ✅ gültig → Request erlaubt
  ❌ abgelaufen / ungültig → 401 → Frontend zeigt Login-Maske
```

**Token-Eigenschaften:**
- Gültigkeitsdauer: **8 Stunden** ab Login
- Kein Server-State nötig (JWT ist selbst-validierend)
- Token erneuert sich **nicht** automatisch bei jedem Request – nach Ablauf einmalig neu einloggen
- Kein Logout vor Ablauf möglich (akzeptabel für Familienkreis)
- Frontend speichert JWT im `sessionStorage` → Tab schließen = Token weg, Reload = Token bleibt

**.env-Beispiel:**
```
PASSWORD_HASH=$2y$10$...bcrypt-hash...
JWT_SECRET=ein-langer-zufaelliger-string
```

**Neuer API-Endpunkt:**
```
POST /api/auth    { "password": "...", "list": "artur" }
                  → { "token": "eyJ..." }   (gültig 8h)
```

- Ein gemeinsames Passwort für alle Listen – wer eingeloggt ist, darf auf alle Listen zugreifen
- Der `list`-Claim im JWT-Payload bestimmt, welche Liste im Frontend aktiv ist
- `JWT_SECRET` ist listenübergreifend
- Token-Rotation: neues Passwort → neuen bcrypt-Hash → `.env` updaten
- Voraussetzung: **HTTPS** – auf dem Webspace bereits vorhanden ✅

### SSRF-Schutz (serverseitiger Metadaten-Proxy)

Das ist der kritischste Unterschied zur bestehenden `proxy.php`. Eine **Allowlist** für Shops ist **nicht nötig** – da alle Token-Träger vertrauenswürdig sind, schützt die Blocklist nur noch vor dem Szenario, dass ein Nutzer gutgläubig einem manipulierten Link folgt. Jede beliebige Shop-URL kann ohne Vorarbeit eingegeben werden.

```php
// lib/ssrf.php – Blocklist interner Adressen
function isBlockedIp(string $ip): bool {
    $blocked = [
        '/^127\./',           // Loopback
        '/^10\./',            // RFC 1918
        '/^192\.168\./',      // RFC 1918
        '/^172\.(1[6-9]|2\d|3[01])\./',  // RFC 1918
        '/^169\.254\./',      // Link-local
        '/^::1$/',            // IPv6 Loopback
    ];
    foreach ($blocked as $pattern) {
        if (preg_match($pattern, $ip)) return true;
    }
    return false;
}
```

- DNS-Auflösung vor Anfrage prüfen (verhindert Redirect auf interne IP)
- Erlaubte Protokolle: nur `http:` und `https:`
- Maximale Weiterleitungen: 3
- Timeout: 10 Sekunden

### Input-Validierung
- URL-Format: `filter_var($url, FILTER_VALIDATE_URL)` + Protokoll-Check
- Dateinamen: `preg_replace('/[^a-z0-9\-]/', '', ...)` (kein Path-Traversal)
- CSV-Inhalte: Semikolons in Feldern escapen/quoten

---

## 🗄️ Datenhaltung

### Entscheidung: CSV beibehalten (im MVP)

**Begründung:**
- ✅ Versionierbar in Git (diff-lesbar)
- ✅ Kein Migrations-Aufwand
- ✅ Leicht zu sichern (einfache Textdateien)
- ✅ `lib/build.php` liest die CSV direkt und injiziert sie ins Template

**CSV-Format bleibt unverändert:**
```
{Nr};{URL};{Titel};{Bilddateiname};{Kommentar};{Gekauft}
1;https://thalia.de/...;LEGO Set;1-lego-set.webp;Wunsch;false
```

**Phase 3 (optional):** Migration zu SQLite falls Volltextsuche, Statistiken oder mehrere gleichzeitige Schreiber benötigt werden.

### Datei-Layout

```
listengenerator/          ← PHP-App (nicht öffentlich zugänglich, außer listen/)
├── listen/
│   ├── artur/
│   │   ├── links.csv     ← Laufzeitdaten (nur Webspace, nicht in Git)
│   │   ├── img/          ← Laufzeitdaten (nur Webspace, nicht in Git)
│   │   └── index.html    ← Build-Output (von lib/build.php erzeugt)
│   └── robin/
│       ├── links.csv
│       ├── img/
│       └── index.html
├── template/
│   └── index.html        ← unverändertes Template (aus bestehendem template/)
├── frontend/             ← React-Quellcode (in Git)
├── public/               ← Vite Build-Output (in Git)
├── api/
└── lib/
    └── build.php         ← liest links.csv, injiziert in template/index.html
```

> **Phase 3**: Laufzeitdaten (CSV + Bilder) werden per SCP vom Server auf den Dev-Rechner gezogen und dort per `git commit/push` ins Repository gesichert – kein Git auf dem Server nötig.

---

## 🚀 Deployment-Überlegungen

### Konzept: alles auf dem Webspace, kein externes Skript

Die PHP-App läuft direkt auf dem Webspace (`access895651998.webspace-data.io`). Kein SSH, kein `deploy.sh`, kein externer Prozess – alles passiert in PHP selbst:

| Schritt | Wer | Wie |
|---|---|---|
| CSV speichern | `api/lists.php` | `file_put_contents(listen/{name}/links.csv)` |
| Bild speichern | `api/images.php` | `move_uploaded_file()` / cURL-Download nach `listen/{name}/img/` |
| Build triggern | `api/deploy.php` | Ruft `lib/build.php` auf |
| HTML erzeugen | `lib/build.php` | Liest `template/index.html`, ersetzt `%title` und `//startData…//endData` per `str_replace` / `preg_replace`, schreibt `listen/{name}/index.html` |
| Statisches Serving | Apache/PHP | `listen/{name}/` ist öffentlich erreichbar |

### `lib/build.php` – Kern der Deploy-Logik

```php
// lib/build.php
function buildList(string $name, string $title): void {
    $csvPath      = __DIR__ . "/../listen/{$name}/links.csv";
    $templatePath = __DIR__ . "/../template/index.html";
    $outputPath   = __DIR__ . "/../listen/{$name}/index.html";

    $csv      = file_get_contents($csvPath);
    $template = file_get_contents($templatePath);

    // Titel ersetzen
    $html = str_replace('%title', htmlspecialchars($title), $template);

    // CSV zwischen Markern injizieren (wie deploy.sh es per sed macht)
    $html = preg_replace(
        '/\/\/startData.*\/\/endData/s',
        "//startData\n`{$csv}`\n//endData",
        $html
    );

    file_put_contents($outputPath, $html);
}
```

### Deployment der PHP-App selbst

Deployed wird **vom Entwicklungsrechner per SCP**. Kein `git` auf dem Server.

**Wichtig**: `listen/` enthält die Laufzeitdaten (CSV, Bilder, erzeugte `index.html`) und darf beim Deploy **niemals gelöscht** werden.

#### Deploy-Strategie

```bash
# 1. Alles auf dem Server löschen – AUSSER listen/
ssh u106909590@access895651998.webspace-data.io \
  "find ~/listengenerator/ -mindepth 1 -not -path '*/listen*' -delete"

# 2. Neuen Stand hochladen (ohne frontend/src – nur Build-Output)
scp -r api/ lib/ template/ public/ index.php .htaccess \
  u106909590@access895651998.webspace-data.io:~/listengenerator/
```

#### Was deployed wird / was nicht

| Pfad | Deployed? | Grund |
|---|---|---|
| `api/` | ✅ | PHP-Backend |
| `lib/` | ✅ | PHP-Bibliotheken |
| `template/` | ✅ | Build-Template |
| `public/` | ✅ | React/Vite Build-Output |
| `index.php`, `.htaccess` | ✅ | Einstiegspunkt + Routing |
| `frontend/` | ❌ | React-Quellcode, nur lokal |
| `roadmap.md` | ❌ | Nur Dokumentation |
| `.env` | ❌ | Liegt manuell auf dem Server, nie im Git |
| `listen/` | ❌ 🔒 | Laufzeitdaten – bleibt auf dem Server erhalten |

#### Deploy-Skript (`deploy.sh` im `listengenerator/`-Ordner)

```bash
#!/bin/bash
SERVER="u106909590@access895651998.webspace-data.io"
REMOTE="~/listengenerator"

echo "🧹 Aufräumen (listen/ bleibt erhalten)..."
ssh $SERVER "find $REMOTE -mindepth 1 -not -path '$REMOTE/listen*' -delete"

echo "🚀 Deploye..."
scp -r api/ lib/ template/ public/ index.php .htaccess $SERVER:$REMOTE/

echo "✅ Fertig"
```

> **Hinweis**: `.env` liegt einmalig manuell auf dem Server und wird nie überschrieben – `find ... -delete` lässt sie ebenfalls in Ruhe, solange sie nicht im Deploy-Verzeichnis liegt (z.B. ein Verzeichnis höher: `~/.env` oder `~/listengenerator/.env` explizit ausschließen falls nötig).

---

## ❓ Offene Fragen / Entscheidungspunkte

| # | Frage | Optionen | Tendenz |
|---|---|---|---|
| 1 | **Wo liegt die PHP-App?** | Eigener Webspace-Ordner vs. Unterordner der statischen Seiten | ✅ Eigener Ordner unter der öffentlichen URL – statische Listen sind autarke Unterordner (eigene `index.html` + `img/`, keine Abhängigkeit zur PHP-App) |
| 2 | **Authentifizierung** | Bearer-Token vs. HTTP-Basic-Auth | ✅ Passwort → bcrypt-Prüfung → JWT (HMAC-SHA256, 8h Ablauf, kein Server-State) |
| 3 | **Build-Logik** | In-Process `lib/build.php` vs. externes Skript | ✅ In-Process (kein shell_exec nötig) |
| 4 | **Frontend-Framework** | Vanilla JS (wie opengraph/) vs. React/Vue | ✅ React (mit Vite als Build-Tool, Build-Output wird mit deployed) |
| 5 | **Bilder & Listen-Daten** | Im Webspace vs. in Git | ✅ Laufzeitdaten (CSV, Bilder) nur im Webspace – Git enthält nur Code. Erweiterung Phase 3: Backup der Listen (CSV + Bilder) ins Git |
| 6 | **Multi-Liste** | Artur + Robin im selben Token vs. getrennt | ✅ Ein gemeinsames Passwort für alle Listen |
| 7 | **HTTPS** | Webspace bringt Let's Encrypt mit | ✅ automatisch vorhanden |
| 8 | **PHP-Version** | PHP 8.1+ vs. älter | ✅ Latest PHP (aktuell 8.3) |

---

## 📅 Zeitplan (grobe Schätzung)

| Phase | Aufwand | Abhängigkeit |
|---|---|---|
| Phase 1: MVP | ~4–6 Stunden | PHP auf Webspace verfügbar (✅ bereits der Fall) |
| Phase 2: UX | ~3–4 Stunden | Phase 1 abgeschlossen |
| Phase 3: Erweiterungen | ~6–10 Stunden | Phase 2 abgeschlossen |

---

*Erstellt: März 2026 | Projekt: linkList*

