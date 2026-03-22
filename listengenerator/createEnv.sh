#!/bin/bash
# Interaktives Setup-Skript für listengenerator/.env

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

echo ""
echo "🔧 listengenerator – .env Setup"
echo "================================"
echo ""

# Warnung falls .env bereits existiert
if [ -f "$ENV_FILE" ]; then
  echo "⚠️  Eine .env existiert bereits:"
  echo ""
  cat "$ENV_FILE"
  echo ""
  read -rp "   Überschreiben? (j/N): " OVERWRITE
  if [[ ! "$OVERWRITE" =~ ^[jJ]$ ]]; then
    echo "❌ Abgebrochen."
    exit 0
  fi
  echo ""
fi

# Passwort eingeben
while true; do
  read -rsp "🔑 Passwort eingeben: " PASSWORD
  echo ""
  read -rsp "🔑 Passwort bestätigen: " PASSWORD_CONFIRM
  echo ""

  if [ "$PASSWORD" = "$PASSWORD_CONFIRM" ]; then
    if [ ${#PASSWORD} -lt 5 ]; then
      echo "❌ Passwort muss mindestens 5 Zeichen haben. Erneut versuchen."
      echo ""
    else
      break
    fi
  else
    echo "❌ Passwörter stimmen nicht überein. Erneut versuchen."
    echo ""
  fi
done

echo "⏳ Erzeuge bcrypt-Hash..."
PASSWORD_HASH=$(php -r "echo password_hash('$PASSWORD', PASSWORD_BCRYPT);")

# JWT_SECRET erzeugen
# bin2hex → nur [0-9a-f], damit sind Zeilenumbrüche, = und Sonderzeichen
# strukturell ausgeschlossen – die .env bleibt garantiert parsebar.
# 32 Bytes = 256 Bit Entropie, als 64 Hex-Zeichen kodiert.
echo "⏳ Erzeuge JWT_SECRET..."
JWT_SECRET=$(php -r "echo bin2hex(random_bytes(32));")

# .env schreiben
cat > "$ENV_FILE" << EOF
PASSWORD_HASH=$PASSWORD_HASH
JWT_SECRET=$JWT_SECRET
EOF

echo ""
echo "✅ .env wurde erstellt:"
echo ""
echo "   PASSWORD_HASH=${PASSWORD_HASH:0:20}..."
echo "   JWT_SECRET=${JWT_SECRET:0:20}..."
echo ""
echo "   Datei: $ENV_FILE"
echo ""
echo "⚠️  Gib das Klartext-Passwort an die Nutzer weiter – nicht den Hash!"
echo ""


