#!/bin/bash
# Start-Script für Link List Creator

# Navigiere zum Verzeichnis
cd "$(dirname "$0")"

# Prüfe ob PHP installiert ist
if ! command -v php &> /dev/null; then
    echo "❌ PHP ist nicht installiert!"
    echo "Installiere PHP mit: sudo apt install php php-curl"
    exit 1
fi

# Prüfe ob php-curl verfügbar ist
if ! php -m | grep -q curl; then
    echo "⚠️  Warnung: PHP cURL Extension nicht gefunden"
    echo "Installiere mit: sudo apt install php-curl"
fi

# Stoppe evtl. laufenden Server
pkill -f "php -S localhost:8088" 2>/dev/null

# Starte Server
echo "🚀 Starte Link List Creator..."
echo "📍 Server läuft auf: http://localhost:8088"
echo "📄 Öffne im Browser: http://localhost:8088/index.html"
echo ""
echo "Drücke Ctrl+C zum Beenden"
echo ""

php -S localhost:8088

