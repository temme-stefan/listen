# Link List Creator - Ausführliche Anleitung

## Detaillierte Bedienung

### URL hinzufügen

1. **URL eingeben** in das Eingabefeld
2. **Enter drücken** oder "Mit URL" klicken
3. Die Anwendung versucht automatisch zu laden:
   - **Titel**: Von Open Graph (`og:title`) oder HTML `<title>`-Tag
   - **Produktbild**: Von Open Graph (`og:image`)

#### Bei Erfolg:
- Karte wird erstellt mit Titel und Bild
- Bemerkungsfeld wird automatisch fokusiert
- Du kannst sofort deine Bemerkung eingeben

#### Bei Fehler (z.B. Bot-Protection):
- Karte wird trotzdem erstellt
- Nur URL ist befüllt
- Alle anderen Felder sind leer → manuell ausfüllen
- Fehlermeldung wird angezeigt mit Hinweisen

### CSV importieren

1. **Klick auf "📥 CSV Importieren"**
2. **Wähle deine `links.csv` Datei**
3. Alle Einträge werden als Karten geladen
4. **Wichtig**: Bilder werden NICHT angezeigt (nur Platzhalter)
5. Bildpfade bleiben in `imagePath` erhalten für späteren Export

**CSV-Format:**
```
{Nr};{URL};{Titel};{Bilddatei};{Bemerkung};{Gekauft}
```

**Beispiel:**
```csv
1;https://example.com;LEGO Set;1-lego-set.webp;Wunsch von Max;false
2;;Selbstgemacht;2-geschenk.jpg;Von Oma;true
```

**Hinweis:** Importierte Bildpfade bleiben beim Export erhalten, falls kein neues Bild hochgeladen wurde.

### Karte bearbeiten

Jede Karte hat folgende Felder:

| Feld | Beschreibung | Editierbar |
|------|--------------|------------|
| **Bild** | Produktbild (150x150px) | Via 📷 Button |
| **Titel** | Produktname/Beschreibung | ✅ Ja |
| **URL** | Link zum Produkt | ✅ Ja |
| **Bemerkung** | Kommentar (z.B. "Wunsch von Max") | ✅ Ja (wird fokusiert) |
| **Gekauft** | Checkbox für Status | ✅ Ja |

**Aktions-Buttons:**
- **🔄 Aktualisieren**: Metadaten von URL neu laden (nur sichtbar wenn URL gesetzt)
- **⬆️ Nach oben**: Karte eine Position nach oben verschieben
- **⬇️ Nach unten**: Karte eine Position nach unten verschieben
- **🗑️ Löschen**: Karte entfernen

#### Gekauft-Status:
- Checkbox anhaken → Karte wird grün
- ✅ Symbol erscheint
- Im CSV-Export: `true` statt `false`

#### Bild hochladen:
1. Klick auf **📷 Button** unter dem Bild
2. Wähle Bild von deinem Computer
3. Vorschau wird sofort angezeigt
4. Beim Export wird das hochgeladene Bild verwendet

#### Metadaten aktualisieren:
1. Karte muss URL haben
2. **🔄 Button** erscheint
3. Klick auf 🔄
4. Titel und Bild werden neu von URL geladen
5. Nützlich wenn sich Produktdaten geändert haben

#### Sortierung ändern:
1. **⬆️ klicken**: Verschiebt Karte nach oben
2. **⬇️ klicken**: Verschiebt Karte nach unten
3. Erste Karte: ⬆️ hat keine Wirkung
4. Letzte Karte: ⬇️ hat keine Wirkung
5. **CSV-Export**: Reihenfolge wird übernommen (Spalte `sort`)

### Export-Funktionen

#### CSV exportieren
Klicke "📄 CSV Exportieren":
- Datei `links.csv` wird heruntergeladen
- Enthält alle Karten in aktueller Reihenfolge

**CSV-Struktur:**
```
{Nr};{URL};{Titel};{Bilddatei};{Bemerkung};{Gekauft}
```

**Bildpfad-Logik beim Export:**
- **Importierte Karte ohne neue Änderung**: Original-Pfad wird verwendet
- **Neue Karte oder Bild hochgeladen**: Neuer Pfad wird generiert
- **Kein Bild**: Leer

**Beispiel:**
```csv
1;https://www.thalia.de/.../A1234;LEGO NINJAGO Set;1-lego-ninjago-set.webp;Wunsch von Artur;false
2;https://amzn.eu/d/xyz;Spielzeug Auto;2-spielzeug-auto.jpg;Gekauft am 10.02;true
3;;Selbstgemacht;3-haekelmuster.png;Von Oma gehäkelt;false
```

#### Bilder exportieren
Klicke "🖼️ Bilder Exportieren":
- ZIP-Datei `images.zip` wird erstellt
- Enthält Ordner `img/` mit allen Produktbildern
- Dateinamen werden automatisch generiert

## Dateinamen-Generierung (Details)

Bilder werden automatisch nach folgendem Schema umbenannt:

```
{Nummer}-{Titel-Slug}.{Extension}
```

### Generierungs-Prozess:

1. **Titel nehmen**: `"LEGO NINJAGO Lloyd's grüner Walddrache - Set 71829"`
2. **Kleinbuchstaben**: `"lego ninjago lloyd's grüner walddrache - set 71829"`
3. **Sonderzeichen entfernen**: `"lego ninjago lloyds grüner walddrache  set 71829"`
   - Behält: `a-z`, `0-9`, `ä`, `ö`, `ü`, `ß`, Leerzeichen, `-`
4. **Leerzeichen → Bindestriche**: `"lego-ninjago-lloyds-grüner-walddrache--set-71829"`
5. **Mehrfach-Bindestriche reduzieren**: `"lego-ninjago-lloyds-grüner-walddrache-set-71829"`
6. **Auf 50 Zeichen kürzen**: `"lego-ninjago-lloyds-gruener-walddrache-set-718"`
7. **Nummer + Extension hinzufügen**: `"1-lego-ninjago-lloyds-gruener-walddrache-set-718.webp"`

### Extension-Erkennung:
- Wird von Bild-URL extrahiert
- Unterstützt: `.webp`, `.jpg`, `.jpeg`, `.png`, `.gif`
- Fallback: `.jpg`

## Workflow-Beispiele

### Beispiel 1: Neue Liste erstellen

```
1. Server starten (./start.sh)
2. Browser öffnen (http://localhost:8088/index.html)
3. URLs hinzufügen:
   - https://www.thalia.de/.../A1234 [Enter]
   - Bemerkung: "Wunsch von Artur"
   - https://amzn.eu/d/xyz [Enter]
   - Bemerkung: "Vorschlag von Sylvie"
4. Manuelle Karte: "➕ Manuelle Karte"
   - Titel: "Selbstgehäkelt"
   - Bild hochladen: 📷
   - Bemerkung: "Von Oma"
5. Sortierung: Wichtigste nach oben (⬆️)
6. Exportieren:
   - 📄 CSV → links.csv
   - 🖼️ Bilder → images.zip
```

### Beispiel 2: Bestehende Liste erweitern

```
1. Server starten
2. Browser öffnen
3. CSV importieren:
   - 📥 CSV Importieren
   - Wähle bestehende links.csv
   - 10 Karten werden geladen
4. Neue Ideen hinzufügen:
   - 3 neue URLs eingeben
   - 1 manuelle Karte
5. Reihenfolge anpassen:
   - Neue Ideen nach oben (⬆️)
6. Exportieren:
   - CSV → Original-Pfade + neue Pfade
   - Bilder → Nur neue Bilder
```

### Beispiel 3: Metadaten aktualisieren

```
1. Liste importieren
2. Karte #5 hat veraltetes Produktbild
3. Klick 🔄 bei Karte #5
4. Neue Metadaten werden geladen
5. Bild ist aktualisiert
6. Export → Neues Bild wird verwendet
```

## Fehlerbehandlung

### Problem: "Metadaten konnten nicht geladen werden"

**Mögliche Ursachen:**
- Website hat Bot-Protection (z.B. Thalia, Amazon)
- CORS-Probleme
- Website ist nicht erreichbar
- Kein Open Graph vorhanden

**Lösung:**
1. Karte wird trotzdem erstellt
2. Fehlermeldung zeigt Details
3. Fülle Felder manuell aus:
   - Titel: Kopiere von Website
   - Bild: Optional hochladen (📷)
   - Bemerkung: Wie gewohnt

### Problem: "Bild konnte nicht geladen werden"

**Mögliche Ursachen:**
- Bild-URL blockiert (CORS)
- Bild existiert nicht mehr (404)
- Falsches Format

**Lösung:**
- Platzhalter-Bild wird angezeigt
- Eigenes Bild hochladen (📷)
- Beim Export: Falls kein Bild, wird Pfad leer

### Problem: "CSV-Import zeigt keine Bilder"

**Das ist normal!**
- Beim Import werden nur Bildpfade gespeichert
- Bilder werden NICHT geladen (wären große Downloads)
- Platzhalter wird angezeigt
- **Beim Export**: Original-Pfade bleiben erhalten
- **Lösung**: Falls Bilder gewünscht, neu hochladen (📷)

### Problem: "Bilder-Export funktioniert nicht"

**Mögliche Ursachen:**
- JSZip konnte nicht von CDN geladen werden
- Keine Internetverbindung
- Browser blockiert Script-Laden

**Lösung:**
1. Prüfe Internetverbindung
2. Öffne Browser-Konsole (F12)
3. Schaue nach Fehlern
4. Alternative: CSV exportieren, Bilder manuell herunterladen

## Tipps & Best Practices

### ✅ CSV-Import nutzen für iteratives Arbeiten
- Tag 1: Liste erstellen, exportieren
- Tag 2: CSV importieren, erweitern, exportieren
- Tag 3: CSV importieren, finalisieren

### ✅ Regelmäßig exportieren
- Alle 5-10 Karten: CSV + Bilder exportieren
- Bei Browser-Reload sind ALLE Daten weg!
- Kein Auto-Save, keine Warnung

### ✅ Sortierung frühzeitig festlegen
- Wichtigste oben, unwichtige unten
- Nach Import: Reihenfolge mit Pfeilen anpassen
- CSV-Export übernimmt Reihenfolge

### ✅ Aktualisieren-Button nutzen
- URL nachträglich eingegeben? → 🔄 klicken
- Produktbild geändert? → 🔄 klicken
- Titel war falsch? → 🔄 klicken

### ✅ Manuelle Karten für Besonderes
- Selbstgemachte Geschenke (ohne URL)
- Ideen ohne konkreten Link
- Platzhalter für später

### ✅ Bildpfade bleiben erhalten
- Import → Bearbeiten → Export
- Original-Pfade werden wiederverwendet
- Nur neue Karten bekommen neue Pfade

## Technische Limits

| Limit | Wert | Grund |
|-------|------|-------|
| **Titel-Länge (Dateiname)** | 50 Zeichen | Dateinamens-Kompatibilität |
| **Max. Karten** | Unbegrenzt | Nur durch Browser-RAM limitiert |
| **Bild-Größe** | Unbegrenzt | Wird im Browser zwischengespeichert |
| **Proxy-Timeout** | 15 Sekunden | Server-Einstellung in proxy.php |
| **Dateinamen-Zeichen** | a-z, 0-9, äöüß, - | Kompatibilität mit allen OS |
| **CSV-Import** | Unbegrenzt | Dateigröße limitiert durch Browser |

