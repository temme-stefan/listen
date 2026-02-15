// Link List Creator - Client-side Module
// Module-Scope Variablen
let cards = [];
let nextId = 1;
let container;
let urlInput;
let addBtn;
let addManualBtn;
let importCsvBtn;
let importCsvInput;
let exportCsvBtn;
let exportImagesBtn;
let template;

function init() {
    // DOM Elemente holen
    container = document.getElementById('cards-container');
    urlInput = document.getElementById('url-input');
    addBtn = document.getElementById('add-btn');
    addManualBtn = document.getElementById('add-manual-btn');
    importCsvBtn = document.getElementById('import-csv-btn');
    importCsvInput = document.getElementById('import-csv-input');
    exportCsvBtn = document.getElementById('export-csv-btn');
    exportImagesBtn = document.getElementById('export-images-btn');
    template = document.getElementById('card-template');

    // Event Listeners
    addBtn.addEventListener('click', () => addCardFromUrl());
    addManualBtn.addEventListener('click', () => addManualCard());
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCardFromUrl();
        }
    });

    importCsvBtn.addEventListener('click', () => importCsvInput.click());
    importCsvInput.addEventListener('change', (e) => importCSV(e));

    exportCsvBtn.addEventListener('click', () => exportCSV());
    exportImagesBtn.addEventListener('click', () => exportImages());
}

function showMessage(message, type = 'info') {
    // Entferne alte Nachrichten
    const oldMsg = container.querySelector('.status-message');
    if (oldMsg) oldMsg.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `status-message ${type}`;
    msgDiv.textContent = message;
    container.insertBefore(msgDiv, container.firstChild);

    if (type !== 'error') {
        setTimeout(() => msgDiv.remove(), 3000);
    }
}

async function addCardFromUrl() {
    const url = urlInput.value.trim();

    if (!url) {
        // Wenn keine URL, erstelle manuelle Karte
        addManualCard();
        return;
    }

    try {
        new URL(url); // Validiere URL
    } catch (e) {
        showMessage('Ungültige URL', 'error');
        return;
    }

    showMessage('Lade Metadaten...', 'loading');

    try {
        const response = await fetch(`proxy.php?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        let cardData = {
            id: nextId++,
            url: url,
            title: '',
            image: '',
            imageBlob: null,
            imagePath: '', // Für CSV-Import
            comment: '',
            bought: false
        };

        if (data.success && data.metadata) {
            // Erfolgreich Metadaten geladen
            cardData.title = data.metadata.og.title || data.metadata.title || '';
            cardData.image = data.metadata.og.image || '';

            // Lade Bild als Blob
            if (cardData.image) {
                try {
                    cardData.imageBlob = await downloadImageAsBlob(cardData.image);
                } catch (e) {
                    console.warn('Bild konnte nicht geladen werden:', e);
                }
            }

            showMessage('Metadaten erfolgreich geladen!', 'success');
        } else {
            // Fehlerfall: Nur URL befüllen
            showMessage(`Metadaten konnten nicht geladen werden: ${data.error || 'Unbekannter Fehler'}. Bitte manuell ausfüllen.`, 'error');
        }

        addCard(cardData);
        urlInput.value = '';
        urlInput.focus();

    } catch (error) {
        showMessage(`Fehler: ${error.message}`, 'error');

        // Erstelle Karte trotzdem mit nur URL
        addCard({
            id: nextId++,
            url: url,
            title: '',
            image: '',
            imageBlob: null,
            imagePath: '',
            comment: '',
            bought: false
        });

        urlInput.value = '';
    }
}

function addManualCard() {
    // Erstelle leere Karte ohne URL
    addCard({
        id: nextId++,
        url: '',
        title: '',
        image: '',
        imageBlob: null,
        imagePath: '',
        comment: '',
        bought: false
    });

    showMessage('Manuelle Karte erstellt', 'success');
    urlInput.value = '';
}

function importCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    showMessage('Importiere CSV...', 'loading');

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const csvContent = e.target.result;
            const lines = csvContent.split('\n').filter(line => line.trim());

            if (lines.length === 0) {
                showMessage('CSV-Datei ist leer', 'error');
                return;
            }

            // Parse CSV
            let importedCount = 0;
            lines.forEach(line => {
                const parts = line.split(';');
                if (parts.length >= 6) {
                    const [sort, url, description, imageFilename, comment, bought] = parts;

                    addCard({
                        id: nextId++,
                        url: url || '',
                        title: description || '',
                        image: '', // Kein Bild beim Import
                        imageBlob: null,
                        imagePath: imageFilename || '', // Pfad erhalten
                        comment: comment || '',
                        bought: bought.toLowerCase().trim() === 'true'
                    });

                    importedCount++;
                }
            });

            showMessage(`${importedCount} Karten erfolgreich importiert!`, 'success');

            // Reset file input
            event.target.value = '';

        } catch (error) {
            showMessage('Fehler beim Importieren: ' + error.message, 'error');
            console.error('CSV Import Error:', error);
        }
    };

    reader.onerror = () => {
        showMessage('Fehler beim Lesen der Datei', 'error');
    };

    reader.readAsText(file, 'UTF-8');
}

async function downloadImageAsBlob(imageUrl) {
    // Versuche Bild direkt zu laden
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Download fehlgeschlagen');
        const blob = await response.blob();

        // Prüfe ob Blob gültig ist (nicht leer/opaque)
        if (blob.size > 0) {
            return blob;
        }
        // Blob ist leer → Fallback zu Proxy
        throw new Error('Blob ist leer (opaque response)');
    } catch (e) {
        // Direkter Download fehlgeschlagen → Versuche über imageProxy
        console.log('Direkter Download fehlgeschlagen, nutze imageProxy:', imageUrl);
        try {
            const proxiedUrl = getProxiedImageUrl(imageUrl);
            const response = await fetch(proxiedUrl);
            if (response.ok) {
                const blob = await response.blob();
                if (blob.size > 0) {
                    console.log('✓ Bild erfolgreich über Proxy geladen:', blob.size, 'bytes');
                    return blob;
                }
            }
            throw new Error('Auch Proxy-Download fehlgeschlagen');
        } catch (e2) {
            console.warn('Bild-Download fehlgeschlagen (direkt + Proxy):', e2);
            return null;
        }
    }
}

function getProxiedImageUrl(imageUrl) {
    // Prüfe ob URL extern ist (http/https)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // Nutze Image-Proxy für externe URLs
        return `imageProxy.php?url=${encodeURIComponent(imageUrl)}`;
    }
    // Lokale/relative URLs direkt nutzen
    return imageUrl;
}

function addCard(cardData) {
    // Entferne empty state falls vorhanden
    container.querySelector('.empty-state')?.remove();

    // Erstelle Karte aus Template
    const cardElement = template.content.cloneNode(true);
    const article = cardElement.querySelector('.card');
    article.dataset.id = cardData.id;

    // DOM-Elemente (mehrfach genutzt)
    const titleInput = cardElement.querySelector('.card-title');
    const urlInput = cardElement.querySelector('.card-url-input');
    const commentInput = cardElement.querySelector('.card-comment-input');
    const img = cardElement.querySelector('.card-image img');
    const refreshBtn = cardElement.querySelector('.card-refresh-btn');

    // Setze initiale Werte
    titleInput.value = cardData.title;
    urlInput.value = cardData.url;
    commentInput.value = cardData.comment;
    cardElement.querySelector('.card-bought-checkbox').checked = cardData.bought;

    // Setze bought-item CSS-Klasse wenn bereits gekauft
    if (cardData.bought) {
        article.classList.add('bought-item');
    }

    // Zeige Refresh-Button nur wenn URL vorhanden
    if (cardData.url) {
        refreshBtn.style.display = 'inline-block';
    }

    // Setze Bild falls vorhanden
    if (cardData.image) {
        img.src = cardData.imageBlob
            ? URL.createObjectURL(cardData.imageBlob)
            : getProxiedImageUrl(cardData.image);
    }

    // Event Listeners
    titleInput.addEventListener('input', (e) => {
        cardData.title = e.target.value;
    });

    urlInput.addEventListener('input', (e) => {
        cardData.url = e.target.value;
        refreshBtn.style.display = e.target.value.trim() ? 'inline-block' : 'none';
    });

    commentInput.addEventListener('input', (e) => {
        cardData.comment = e.target.value;
    });

    cardElement.querySelector('.card-bought-checkbox').addEventListener('change', (e) => {
        cardData.bought = e.target.checked;
        article.classList.toggle('bought-item', e.target.checked);
    });

    // Bild-Upload
    const imageUploadInput = cardElement.querySelector('.card-image-upload');
    cardElement.querySelector('.card-image-btn').addEventListener('click', () => {
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            cardData.imageBlob = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
                cardData.image = file.name;
            };
            reader.readAsDataURL(file);
        }
    });

    cardElement.querySelector('.delete-btn').addEventListener('click', () => {
        deleteCard(cardData.id);
    });

    // Refresh-Button: Metadaten neu laden
    refreshBtn.addEventListener('click', async () => {
        if (!cardData.url) return;

        showMessage('Aktualisiere Metadaten...', 'loading');

        try {
            const response = await fetch(`proxy.php?url=${encodeURIComponent(cardData.url)}`);
            const data = await response.json();

            if (data.success && data.metadata) {
                cardData.title = data.metadata.og.title || data.metadata.title || cardData.title;
                cardData.image = data.metadata.og.image || cardData.image;
                titleInput.value = cardData.title;

                if (cardData.image) {
                    cardData.imageBlob = await downloadImageAsBlob(cardData.image);
                    img.src = cardData.imageBlob
                        ? URL.createObjectURL(cardData.imageBlob)
                        : getProxiedImageUrl(cardData.image);
                }

                showMessage('Metadaten erfolgreich aktualisiert!', 'success');
            } else {
                showMessage('Aktualisierung fehlgeschlagen: ' + (data.error || 'Unbekannter Fehler'), 'error');
            }
        } catch (error) {
            showMessage('Fehler beim Aktualisieren: ' + error.message, 'error');
        }
    });

    // Sortier-Buttons
    cardElement.querySelector('.card-move-up-btn').addEventListener('click', () => {
        moveCard(cardData.id, 'up');
    });

    cardElement.querySelector('.card-move-down-btn').addEventListener('click', () => {
        moveCard(cardData.id, 'down');
    });

    // Füge Karte hinzu
    container.appendChild(cardElement);
    cards.push(cardData);

    // Fokusiere Bemerkung
    setTimeout(() => commentInput.focus(), 100);
}


function deleteCard(id) {
    const cardIndex = cards.findIndex(c => c.id === id);
    if (cardIndex !== -1) {
        cards.splice(cardIndex, 1);
    }

    const cardElement = container.querySelector(`[data-id="${id}"]`);
    if (cardElement) {
        cardElement.remove();
    }

    // Zeige empty state wenn keine Karten mehr da sind
    if (cards.length === 0) {
        container.innerHTML = '<div class="empty-state">Füge Links hinzu, um loszulegen...</div>';
    }

    showMessage('Karte gelöscht', 'success');
}

function moveCard(id, direction) {
    const cardIndex = cards.findIndex(c => c.id === id);
    if (cardIndex === -1) return;

    const newIndex = direction === 'up' ? cardIndex - 1 : cardIndex + 1;

    // Prüfe Grenzen
    if (newIndex < 0 || newIndex >= cards.length) return;

    // FLIP Animation: First - Speichere alle aktuellen Positionen
    const allCards = Array.from(container.querySelectorAll('.card'));
    const firstPositions = allCards.map(card => card.getBoundingClientRect());

    // Speichere andere ID VOR dem Tausch
    const otherCardId = cards[newIndex].id;

    // Tausche in Array
    [cards[cardIndex], cards[newIndex]] = [cards[newIndex], cards[cardIndex]];

    // Tausche im DOM
    const cardElement = container.querySelector(`[data-id="${id}"]`);
    const otherCardElement = container.querySelector(`[data-id="${otherCardId}"]`);

    if (direction === 'up') {
        // Nach oben: Setze vor das andere Element
        container.insertBefore(cardElement, otherCardElement);
    } else {
        // Nach unten: Setze das andere Element vor dieses
        container.insertBefore(otherCardElement, cardElement);
    }

    // FLIP Animation: Last - Hole neue Positionen
    const lastPositions = allCards.map(card => card.getBoundingClientRect());

    // FLIP Animation: Invert & Play
    allCards.forEach((card, index) => {
        const first = firstPositions[index];
        const last = lastPositions[index];
        const deltaY = first.top - last.top;

        if (deltaY !== 0) {
            // Invert: Setze Karte zurück auf alte Position (ohne Transition)
            card.style.transition = 'none';
            card.style.transform = `translateY(${deltaY}px)`;

            // Füge moving-Klasse für visuelles Feedback hinzu
            card.classList.add('card-moving');

            // Play: Animiere zur neuen Position
            requestAnimationFrame(() => {
                card.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.transform = 'translateY(0)';

                // Entferne moving-Klasse nach Animation
                setTimeout(() => {
                    card.classList.remove('card-moving');
                    card.style.transition = '';
                    card.style.transform = '';
                }, 300);
            });
        }
    });
}

function generateImageFilename(url, title, index) {
    // Erstelle Dateinamen basierend auf Titel
    let filename = title
        .toLowerCase()
        .replace(/[^a-z0-9äöüß\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);

    if (!filename) {
        filename = `image-${index}`;
    }

    // Füge Präfix hinzu
    return `${index + 1}-${filename}`;
}

function exportCSV() {
    if (cards.length === 0) {
        showMessage('Keine Karten zum Exportieren vorhanden', 'error');
        return;
    }

    // Erstelle CSV
    const csvLines = cards.map((card, index) => {
        const sort = index + 1;
        const url = card.url || '';
        const description = card.title || '';

        // Verwende imagePath falls vorhanden (von Import), sonst generiere neu
        let imageFilename = '';
        if (card.imagePath) {
            // Behalte ursprünglichen Pfad (von Import)
            imageFilename = card.imagePath;
        } else if (card.image || card.imageBlob) {
            // Generiere neuen Dateinamen
            imageFilename = generateImageFilename(card.url, card.title, index) + getImageExtension(card.image || 'jpg');
        }

        const comment = card.comment || '';
        const bought = card.bought ? 'true' : 'false';

        return `${sort};${url};${description};${imageFilename};${comment};${bought}`;
    });

    const csvContent = csvLines.join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'links.csv';
    link.click();

    showMessage('CSV erfolgreich exportiert!', 'success');
}

function getImageExtension(url) {
    const match = url.match(/\.(webp|jpg|jpeg|png|gif)($|\?)/i);
    return match ? '.' + match[1].toLowerCase() : '.jpg';
}

async function exportImages() {
    if (cards.length === 0) {
        showMessage('Keine Karten zum Exportieren vorhanden', 'error');
        return;
    }

    const cardsWithImages = cards.filter(card => card.image);

    if (cardsWithImages.length === 0) {
        showMessage('Keine Bilder zum Exportieren vorhanden', 'error');
        return;
    }

    showMessage(`Exportiere ${cardsWithImages.length} Bilder...`, 'loading');

    try {
        // Dynamisch JSZip laden (oder inline einbinden)
        if (typeof JSZip === 'undefined') {
            await loadJSZip();
        }

        const zip = new JSZip();

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            if (!card.image) continue;

            const filename = generateImageFilename(card.url, card.title, i) + getImageExtension(card.image);

            try {
                let blob = card.imageBlob;

                if (!blob || blob.size === 0) {
                    // Kein gültiger Blob → Lade Bild über imageProxy
                    console.log(`Lade Bild über Proxy für Export: ${card.image}`);
                    const proxiedUrl = getProxiedImageUrl(card.image);
                    const response = await fetch(proxiedUrl);
                    if (response.ok) {
                        blob = await response.blob();
                    }
                }

                if (blob && blob.size > 0) {
                    zip.file(filename, blob);
                    console.log(`✓ Bild hinzugefügt: ${filename} (${blob.size} bytes)`);
                } else {
                    console.warn(`✗ Bild konnte nicht geladen werden: ${card.image}`);
                }
            } catch (e) {
                console.warn(`Fehler beim Laden von Bild ${i}:`, e);
            }
        }

        // Generiere ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Download ZIP
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'img.zip';
        link.click();

        showMessage('Bilder erfolgreich exportiert!', 'success');

    } catch (error) {
        showMessage(`Fehler beim Exportieren: ${error.message}`, 'error');
        console.error('Export error:', error);
    }
}

async function loadJSZip() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Initialisiere die Anwendung
document.addEventListener('DOMContentLoaded', init);
