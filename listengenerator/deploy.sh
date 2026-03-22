#!/bin/bash
set -e

SERVER="u106909590@access895651998.webspace-data.io"
REMOTE="~/phpSites/listengenerator"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔨 Frontend bauen..."
cd "$SCRIPT_DIR/frontend"

# Lokal: nvm nutzen falls verfügbar; in CI: node direkt verfügbar
if command -v nvm &>/dev/null; then
  bash -i -c "nvm use 22 && npm ci && npm run build"
else
  npm ci
  npm run build
fi

cd "$SCRIPT_DIR"

echo "🧹 Server aufräumen (listen/ und .env bleiben erhalten)..."
ssh "$SERVER" "find $REMOTE -mindepth 1 \
  -not -path '$REMOTE/listen*' \
  -not -name '.env' \
  -delete 2>/dev/null; true"

echo "🚀 Deploye..."
scp -r api/ lib/ template/ public/ index.php .htaccess router.php "$SERVER:$REMOTE/"

echo "✅ Fertig"

