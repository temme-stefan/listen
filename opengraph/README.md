# Link List Creator

Ein webbasiertes Tool zum Erstellen und Verwalten von Link-Listen mit automatischem Abruf von Open Graph Metadaten.

---

## ⚠️ **WICHTIGE SICHERHEITSWARNUNG**

**🔒 NUR FÜR LOKALE VERWENDUNG!**

Diese Anwendung enthält einen **ungesicherten PHP-Proxy** (`proxy.php`) und ist **NICHT für öffentliche Deployments** geeignet.

**NICHT deployen auf:**
- ❌ Öffentlichen Webservern
- ❌ Shared Hosting
- ❌ Cloud-Diensten (AWS, Azure, etc.)
- ❌ VPS mit öffentlicher IP

**Sicherheitsrisiken bei öffentlichem Deployment:**
- 🚨 **Open Proxy / SSRF-Schwachstelle**: Jeder kann beliebige URLs abrufen
- 🚨 **DDoS-Amplifikation**: Server kann für Angriffe missbraucht werden
- 🚨 **Keine Authentifizierung**: Ungeschützter Zugriff
- 🚨 **Keine Rate-Limits**: Ressourcen-Erschöpfung möglich
- 🚨 **SSL-Verification deaktiviert**: Unsichere Verbindungen

**✅ Nur verwenden:**
- Mit `php -S localhost:8088` (lokaler Server)
- In geschützten, privaten Netzwerken
- Für persönliche, nicht-öffentliche Nutzung

---

## 🎯 Hauptfunktionen

- ✅ **Automatischer Metadaten-Abruf**: Titel und Bilder werden automatisch von URLs geladen
- ✅ **Editierbare Karten**: Jede URL wird als editierbare Karte dargestellt
- ✅ **CSV-Import & Export**: Importiere bestehende Listen, exportiere im Format `artur/links.csv`
- ✅ **Bilder-Export**: Lädt alle Produktbilder herunter und packt sie als ZIP
- ✅ **Bild-Upload**: Eigene Bilder hochladen oder Produktbilder ersetzen
- ✅ **Manuelle Karten**: Einträge ohne URL erstellen (z.B. für selbstgemachte Geschenke)
- ✅ **Aktualisieren**: Metadaten von URLs neu laden
- ✅ **Sortierung**: Karten per Pfeiltasten nach oben/unten verschieben
- ✅ **Rein clientseitig**: Keine Datenbank, alles im Browser (außer Metadaten-Proxy)

## ⚡ Schnellstart (3 Schritte)

### 1. Server starten

```bash
cd /home/temme/Projekte/Privat/linkList/opengraph
./start.sh
```

Oder manuell:
```bash
php -S localhost:8088
```

### 2. Browser öffnen

```
http://localhost:8088/index.html
```

### 3. Loslegen!

**Neu erstellen:**
1. URL eingeben (z.B. von Amazon, Thalia)
2. Enter drücken → Metadaten werden geladen
3. Bemerkung eintragen
4. Optional: Als "Gekauft" markieren
5. Exportieren: CSV + Bilder

**Bestehende Liste bearbeiten:**
1. Klick "📥 CSV Importieren"
2. Wähle `links.csv` Datei
3. Karten bearbeiten, neue hinzufügen
4. Sortierung anpassen (⬆️⬇️)
5. Exportieren: CSV + Bilder

## 🆕 Features

### CSV-Import
- Importiere bestehende `links.csv` Dateien
- Bildpfade bleiben erhalten (keine Bilder beim Import angezeigt)
- Importierte Listen normal bearbeitbar

### Bild-Upload
- Eigene Bilder hochladen (📷 Button)
- Produktbilder ersetzen
- Funktioniert auch für manuelle Karten

### Aktualisieren
- Metadaten von URL neu laden (🔄 Button)
- Erscheint nur bei Karten mit URL
- Aktualisiert Titel und Bild

### Sortierung
- Karten verschieben (⬆️ ⬇️ Buttons)
- Reihenfolge beeinflusst CSV-Export
- Keine Limits

## 📁 Export-Format

### CSV-Datei (`links.csv`)

Format: `sort;url;description;imageFilename;comment;bought`

Beispiel:
```
1;https://example.com;LEGO Set;1-lego-set.webp;Wunsch von Max;false
2;https://example.com;Spielzeug;2-spielzeug.jpg;Gekauft am 15.02;true
3;;Selbstgemacht;3-geschenk.png;Von Oma gehäkelt;false
```

### Bilder-ZIP (`images.zip`)

```
images.zip
└── img/
    ├── 1-lego-set.webp
    ├── 2-spielzeug.jpg
    └── 3-geschenk.png
```

## 📖 Weitere Dokumentation

- **[ANLEITUNG.md](ANLEITUNG.md)** - Ausführliche Bedienungsanleitung mit Details und Tipps
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Fehlerbehebung für Server-Probleme (502-Fehler, PHP-Setup)

## 🔧 Technische Details

### Voraussetzungen

- PHP 7.0+ mit cURL-Erweiterung
- Webserver (oder PHP Built-in Server für Development)
- Moderner Browser (Chrome, Firefox, Edge, Safari)

### Dateien

- `index.html` - Hauptanwendung (UI)
- `style.css` - Stylesheet
- `graphdata.js` - JavaScript-Logik (Verwaltung, Import, Export, Sortierung)
- `proxy.php` - PHP-Proxy für CORS-freien Metadaten-Abruf

### Integration mit Template

Exportierte Dateien können direkt verwendet werden

```

## ⚠️ Wichtige Hinweise

- **🔒 SICHERHEIT**: Diese Anwendung ist **NUR für lokale Nutzung**. Niemals öffentlich deployen!
- **Keine Persistenz**: Alle Daten existieren nur im Browser-RAM - bei Reload sind sie weg!
- **Regelmäßig exportieren**: Sichere deine Arbeit zwischendurch
- **CSV-Import**: Bildpfade bleiben erhalten, aber Bilder werden nicht angezeigt (nur Platzhalter)
- **Bot-Protection**: Manche Websites (z.B. Thalia) blockieren automatisierte Zugriffe → Metadaten manuell eingeben

## 📝 Lizenz

© Stefan Temme 2025-2026


