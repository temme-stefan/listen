#!/bin/bash

# Konfiguration
TEMPLATE_FILE="template/index.html"
TEMPLATE_IMG_DIR="template/img"
SSH_USER="u106909590"
SSH_HOST="access895651998.webspace-data.io"
BASE_REMOTE_PATH="~/staticSites/liste"

# Start- und End-Marker für den Ersatz
START_MARKER="\/\/startData"
END_MARKER="\/\/endData"

# Funktion für das Deployment
deploy() {
    local SOURCE_DIR=$1
    local TARGET_DIR=$2
    local TITLE=$3
    
    echo "Starte Deployment für $SOURCE_DIR nach $TARGET_DIR"
    
    # Erstelle Build-Verzeichnis und Build-Image-Verzeichnis
    mkdir -p "$SOURCE_DIR/build"
    mkdir -p "$SOURCE_DIR/build/img"
    
    # Kopiere Template in Build-Verzeichnis
    cp "$TEMPLATE_FILE" "$SOURCE_DIR/build/index.html"
    
    # Kopiere Template-Bilder in Build-Image-Verzeichnis
    cp "$TEMPLATE_IMG_DIR"/* "$SOURCE_DIR/build/img/"
    
    # Kopiere spezifische Bilder aus dem img-Verzeichnis
    cp "$SOURCE_DIR/img"/* "$SOURCE_DIR/build/img/"
    
    # Ersetze den Titel
    sed -i "s/%title/$TITLE/g" "$SOURCE_DIR/build/index.html"
    
    # Lese CSV-Inhalt und wrappe ihn
    CSV_CONTENT=$(cat "$SOURCE_DIR/links.csv")
    WRAPPED_CONTENT="\`$CSV_CONTENT\`"
    
    # Ersetze den Inhalt zwischen den Markern
    sed -i "/$START_MARKER/,/$END_MARKER/ {
        /$START_MARKER/ {p; r /dev/stdin
        d}
        /$END_MARKER/ p
        d
    }" "$SOURCE_DIR/build/index.html" <<< "$WRAPPED_CONTENT"
    
    # Deploy auf Server
    ssh $SSH_USER@$SSH_HOST "rm -rf $BASE_REMOTE_PATH/$TARGET_DIR/*" && \
    scp -r "$SOURCE_DIR/build/index.html" "$SOURCE_DIR/build/img" "$SSH_USER@$SSH_HOST:$BASE_REMOTE_PATH/$TARGET_DIR/"
    
    if [ $? -eq 0 ]; then
        echo "Deployment für $SOURCE_DIR erfolgreich abgeschlossen"
    else
        echo "Fehler beim Deployment von $SOURCE_DIR"
        exit 1
    fi
}

# Führe Deployments nacheinander aus
deploy "artur" "artur2025" "Arturs Geburtstagsliste"
deploy "robin" "robin2025" "Robins Geburtstagsliste"