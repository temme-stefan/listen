#!/bin/bash
# Lokalen Entwicklungsserver starten:
# - PHP auf Port 8088 (API)
# - Vite Dev-Server auf Port 5173 (Frontend, proxied /api → 8088)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# .env anlegen falls nicht vorhanden
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "⚠️  Keine .env gefunden – kopiere .env.example → .env"
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  echo "   Bitte PASSWORD_HASH und JWT_SECRET in .env eintragen!"
fi

echo "🐘 Starte PHP auf http://localhost:8088 ..."
php -S localhost:8088 -t "$SCRIPT_DIR" "$SCRIPT_DIR/router.php" &
PHP_PID=$!

echo "⚡ Starte Vite auf http://localhost:5173 ..."
cd "$SCRIPT_DIR/frontend"
bash -i -c "nvm use 22 && npm run dev" &
VITE_PID=$!

echo ""
echo "✅ Entwicklungsserver laufen:"
echo "   Frontend: http://localhost:5173"
echo "   PHP-API:  http://localhost:8088/api/..."
echo ""
echo "Beenden mit Ctrl+C"

trap "kill $PHP_PID $VITE_PID 2>/dev/null; exit" INT TERM
wait

