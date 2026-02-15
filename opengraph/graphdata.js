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

function getDefaultCardData() {
    return {
        id: nextId++,
        url: '',
        title: '',
        image: '',
        imageBlob: null,
        imageBlobUrl: null,
        imagePath: '',
        comment: '',
        bought: false
    };
}

const updateCardFromUrl = async (cardData) => {
    const response = await fetch(`proxy.php?url=${encodeURIComponent(cardData.url)}`);
    const data = await response.json();
    if (data.success && data.metadata) {
        // Erfolgreich Metadaten geladen
        cardData.title = data.metadata.og.title || data.metadata.title || cardData.title;
        cardData.image = data.metadata.og.image || cardData.image;

        // Lade Bild als Blob
        if (cardData.image) {
            try {
                cardData.imageBlob = await downloadImageAsBlob(cardData.image);
                if (cardData.imageBlob) {
                    cardData.imageBlobUrl = URL.createObjectURL(cardData.imageBlob);
                }
            } catch (e) {
                console.warn('Bild konnte nicht geladen werden:', e);
            }
        }

        showMessage('Metadaten erfolgreich geladen!', 'success');
    } else {
        showMessage(`Metadaten konnten nicht geladen werden: ${data.error || 'Unbekannter Fehler'}. Bitte manuell ausfüllen.`, 'error');
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
    const cardData = getDefaultCardData();
    cardData.url = url;
    try {
        await updateCardFromUrl(cardData);
    } catch (error) {
        showMessage(`Fehler: ${error.message}`, 'error');
    } finally {
        addCard(cardData);
        urlInput.value = '';
        urlInput.focus();
    }
}

function addManualCard() {
    // Erstelle leere Karte ohne URL
    addCard(getDefaultCardData());

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

                    const cardData = getDefaultCardData();
                    cardData.url = url || '';
                    cardData.title = description || '';
                    cardData.image = ''; // Kein Bild beim Import
                    cardData.imagePath = imageFilename || ''; // Pfad erhalten
                    cardData.comment = comment || '';
                    cardData.bought = bought.toLowerCase().trim() === 'true';

                    addCard(cardData);
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
    let blob = null;
    const blobValid = () => blob && blob.size > 0;
    const setBlob = async (proxy = false) => {
        const url = proxy ? getProxiedImageUrl(imageUrl) : imageUrl;
        try {
            const response = await fetch(url);
            if (response.ok) {
                blob = await response.blob();
            }
        } catch (e) {
            if (proxy) {
                console.warn('Bild-Download fehlgeschlagen (direkt + Proxy):', e);
            } else {
                console.log('Direkter Download fehlgeschlagen, nutze imageProxy:', imageUrl);
            }
        }
    }
    await setBlob(false);
    if (!blobValid()) {
        await setBlob(true);
    }
    return blobValid() ? blob : null;
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

function updateCardUI(cardData) {
    // Finde DOM-Element für diese Karte
    const article = container.querySelector(`[data-id="${cardData.id}"]`);
    if (!article) return;

    // Setze Input-Werte
    Object.entries({
        '.card-title': 'title',
        '.card-url-input': 'url',
        '.card-comment-input': 'comment'
    }).forEach(([selector, key]) => {
        const input = article.querySelector(selector);
        if (input.value !== cardData[key]) {
            input.value = cardData[key];
        }
    });
    const boughtCheckbox = article.querySelector('.card-bought-checkbox');
    if (boughtCheckbox.checked !== cardData.bought) {
        boughtCheckbox.checked = cardData.bought;
    }

    // Setze CSS-Klasse für "gekauft"
    article.classList.toggle('bought-item', cardData.bought);

    // Zeige/Verstecke Refresh-Button basierend auf URL
    article.querySelector('.card-refresh-btn').classList.toggle("hidden", !cardData.url);

    // Setze Bild-Source
    if (cardData.image) {
        const img = article.querySelector('.card-image img');
        const src = cardData.imageBlob
            ? cardData.imageBlobUrl
            : getProxiedImageUrl(cardData.image);
        if (img.src !== src) {
            if (img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
            img.src = src;
        }
    }
}

function updateUI() {
    // Zeige Empty-State nur wenn keine Karten vorhanden sind
    container.querySelector('.empty-state')?.classList.toggle('hidden', cards.length > 0);
}

function addCard(cardData) {
    // Erstelle Karte aus Template

    const cardElement = template.content.cloneNode(true);
    const article = cardElement.querySelector('.card');
    article.dataset.id = cardData.id;

    // Event Listeners für Daten-Änderungen
    article.querySelector('.card-title').addEventListener('input', (e) => {
        cardData.title = e.target.value;
        updateCardUI(cardData);
    });

    article.querySelector('.card-url-input').addEventListener('input', (e) => {
        cardData.url = e.target.value;
        updateCardUI(cardData);
    });

    article.querySelector('.card-comment-input').addEventListener('input', (e) => {
        cardData.comment = e.target.value;
        updateCardUI(cardData);
    });

    article.querySelector('.card-bought-checkbox').addEventListener('change', (e) => {
        cardData.bought = e.target.checked;
        updateCardUI(cardData);
    });

    // Bild-Upload
    const imageUploadInput = article.querySelector('.card-image-upload');
    article.querySelector('.card-image-btn').addEventListener('click', () => {
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            cardData.imageBlob = file;
            cardData.image = file.name;
            if (cardData.imageBlob && !cardData.imageBlobUrl) {
                cardData.imageBlobUrl = URL.createObjectURL(cardData.imageBlob);
            }

            // Zeige Vorschau via FileReader
            const reader = new FileReader();
            reader.onload = () => updateCardUI(cardData);
            reader.readAsDataURL(file);
        }
    });

    // Delete-Button
    article.querySelector('.delete-btn').addEventListener('click', () => {
        deleteCard(cardData.id);
    });

    // Refresh-Button: Metadaten neu laden
    article.querySelector('.card-refresh-btn').addEventListener('click', async () => {
        if (!cardData.url) return;

        showMessage('Aktualisiere Metadaten...', 'loading');

        try {
            await updateCardFromUrl(cardData);
        } catch (error) {
            showMessage('Fehler beim Aktualisieren: ' + error.message, 'error');
        } finally {
            updateCardUI(cardData);
        }
    });

    // Sortier-Buttons
    article.querySelector('.card-move-up-btn').addEventListener('click', () => {
        moveCard(cardData.id, 'up');
    });

    article.querySelector('.card-move-down-btn').addEventListener('click', () => {
        moveCard(cardData.id, 'down');
    });

    // Füge Karte zum DOM hinzu
    container.appendChild(cardElement);
    cards.push(cardData);
    updateUI();

    // Initiales UI-Rendering
    updateCardUI(cardData);

    // Fokusiere Bemerkung
    setTimeout(() => article.querySelector('.card-comment-input').focus(), 100);
}


function deleteCard(id) {
    const cardIndex = cards.findIndex(c => c.id === id);
    if (cardIndex !== -1) {
        // Befreie Blob-URL vor dem Löschen
        const cardData = cards[cardIndex];
        if (cardData.imageBlobUrl) {
            URL.revokeObjectURL(cardData.imageBlobUrl);
        }
        cards.splice(cardIndex, 1);
    }

    const cardElement = container.querySelector(`[data-id="${id}"]`);
    if (cardElement) {
        cardElement.remove();
    }

    updateUI();

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
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
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
        const zipBlob = await zip.generateAsync({type: 'blob'});

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
