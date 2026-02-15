// Link List Creator - Client-side only
class LinkListManager {
    constructor() {
        this.cards = [];
        this.nextId = 1;
        this.container = document.getElementById('cards-container');
        this.urlInput = document.getElementById('url-input');
        this.addBtn = document.getElementById('add-btn');
        this.addManualBtn = document.getElementById('add-manual-btn');
        this.importCsvBtn = document.getElementById('import-csv-btn');
        this.importCsvInput = document.getElementById('import-csv-input');
        this.exportCsvBtn = document.getElementById('export-csv-btn');
        this.exportImagesBtn = document.getElementById('export-images-btn');
        this.template = document.getElementById('card-template');

        this.init();
    }

    init() {
        // Event Listeners
        this.addBtn.addEventListener('click', () => this.addCardFromUrl());
        this.addManualBtn.addEventListener('click', () => this.addManualCard());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addCardFromUrl();
            }
        });

        this.importCsvBtn.addEventListener('click', () => this.importCsvInput.click());
        this.importCsvInput.addEventListener('change', (e) => this.importCSV(e));

        this.exportCsvBtn.addEventListener('click', () => this.exportCSV());
        this.exportImagesBtn.addEventListener('click', () => this.exportImages());
    }

    showMessage(message, type = 'info') {
        // Entferne alte Nachrichten
        const oldMsg = this.container.querySelector('.status-message');
        if (oldMsg) oldMsg.remove();

        const msgDiv = document.createElement('div');
        msgDiv.className = `status-message ${type}`;
        msgDiv.textContent = message;
        this.container.insertBefore(msgDiv, this.container.firstChild);

        if (type !== 'error') {
            setTimeout(() => msgDiv.remove(), 3000);
        }
    }

    async addCardFromUrl() {
        const url = this.urlInput.value.trim();

        if (!url) {
            // Wenn keine URL, erstelle manuelle Karte
            this.addManualCard();
            return;
        }

        try {
            new URL(url); // Validiere URL
        } catch (e) {
            this.showMessage('Ungültige URL', 'error');
            return;
        }

        this.showMessage('Lade Metadaten...', 'loading');

        try {
            const response = await fetch(`proxy.php?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            let cardData = {
                id: this.nextId++,
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
                        cardData.imageBlob = await this.downloadImageAsBlob(cardData.image);
                    } catch (e) {
                        console.warn('Bild konnte nicht geladen werden:', e);
                    }
                }

                this.showMessage('Metadaten erfolgreich geladen!', 'success');
            } else {
                // Fehlerfall: Nur URL befüllen
                this.showMessage(`Metadaten konnten nicht geladen werden: ${data.error || 'Unbekannter Fehler'}. Bitte manuell ausfüllen.`, 'error');
            }

            this.addCard(cardData);
            this.urlInput.value = '';
            this.urlInput.focus();

        } catch (error) {
            this.showMessage(`Fehler: ${error.message}`, 'error');

            // Erstelle Karte trotzdem mit nur URL
            this.addCard({
                id: this.nextId++,
                url: url,
                title: '',
                image: '',
                imageBlob: null,
                imagePath: '',
                comment: '',
                bought: false
            });

            this.urlInput.value = '';
        }
    }

    addManualCard() {
        // Erstelle leere Karte ohne URL
        this.addCard({
            id: this.nextId++,
            url: '',
            title: '',
            image: '',
            imageBlob: null,
            imagePath: '',
            comment: '',
            bought: false
        });

        this.showMessage('Manuelle Karte erstellt', 'success');
        this.urlInput.value = '';
    }

    importCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showMessage('Importiere CSV...', 'loading');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                const lines = csvContent.split('\n').filter(line => line.trim());

                if (lines.length === 0) {
                    this.showMessage('CSV-Datei ist leer', 'error');
                    return;
                }

                // Parse CSV
                let importedCount = 0;
                lines.forEach(line => {
                    const parts = line.split(';');
                    if (parts.length >= 6) {
                        const [sort, url, description, imageFilename, comment, bought] = parts;

                        this.addCard({
                            id: this.nextId++,
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

                this.showMessage(`${importedCount} Karten erfolgreich importiert!`, 'success');

                // Reset file input
                event.target.value = '';

            } catch (error) {
                this.showMessage('Fehler beim Importieren: ' + error.message, 'error');
                console.error('CSV Import Error:', error);
            }
        };

        reader.onerror = () => {
            this.showMessage('Fehler beim Lesen der Datei', 'error');
        };

        reader.readAsText(file, 'UTF-8');
    }

    async downloadImageAsBlob(imageUrl) {
        // Versuche Bild über Proxy zu laden (CORS-sicher)
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Download fehlgeschlagen');
            return await response.blob();
        } catch (e) {
            // Fallback: Versuche direkten Download
            try {
                const response = await fetch(imageUrl, { mode: 'no-cors' });
                return await response.blob();
            } catch (e2) {
                console.warn('Bild-Download fehlgeschlagen:', e2);
                return null;
            }
        }
    }

    addCard(cardData) {
        // Entferne empty state
        const emptyState = this.container.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        // Erstelle Karte aus Template
        const cardElement = this.template.content.cloneNode(true);
        const article = cardElement.querySelector('.card');
        article.dataset.id = cardData.id;

        // Setze Werte
        const titleInput = cardElement.querySelector('.card-title');
        const urlInput = cardElement.querySelector('.card-url-input');
        const commentInput = cardElement.querySelector('.card-comment-input');
        const boughtCheckbox = cardElement.querySelector('.card-bought-checkbox');
        const img = cardElement.querySelector('.card-image img');
        const deleteBtn = cardElement.querySelector('.delete-btn');
        const imageUploadInput = cardElement.querySelector('.card-image-upload');
        const imageBtn = cardElement.querySelector('.card-image-btn');
        const refreshBtn = cardElement.querySelector('.card-refresh-btn');
        const moveUpBtn = cardElement.querySelector('.card-move-up-btn');
        const moveDownBtn = cardElement.querySelector('.card-move-down-btn');

        titleInput.value = cardData.title;
        urlInput.value = cardData.url;
        commentInput.value = cardData.comment;
        boughtCheckbox.checked = cardData.bought;

        // Setze bought-item CSS-Klasse wenn bereits gekauft
        if (cardData.bought) {
            article.classList.add('bought-item');
        }

        // Zeige Refresh-Button nur wenn URL vorhanden
        if (cardData.url) {
            refreshBtn.style.display = 'inline-block';
        }

        if (cardData.image) {
            if (cardData.imageBlob) {
                img.src = URL.createObjectURL(cardData.imageBlob);
            } else {
                img.src = cardData.image;
            }
        }

        // Event Listeners
        titleInput.addEventListener('input', (e) => {
            cardData.title = e.target.value;
        });

        urlInput.addEventListener('input', (e) => {
            cardData.url = e.target.value;
            // Zeige/Verstecke Refresh-Button
            if (e.target.value.trim()) {
                refreshBtn.style.display = 'inline-block';
            } else {
                refreshBtn.style.display = 'none';
            }
        });

        commentInput.addEventListener('input', (e) => {
            cardData.comment = e.target.value;
        });

        boughtCheckbox.addEventListener('change', (e) => {
            cardData.bought = e.target.checked;
            if (e.target.checked) {
                article.classList.add('bought-item');
            } else {
                article.classList.remove('bought-item');
            }
        });

        // Bild-Upload
        imageBtn.addEventListener('click', () => {
            imageUploadInput.click();
        });

        imageUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                // Speichere Blob
                cardData.imageBlob = file;

                // Zeige Vorschau
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                    cardData.image = file.name; // Dateiname merken
                };
                reader.readAsDataURL(file);
            }
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteCard(cardData.id);
        });

        // Refresh-Button: Metadaten neu laden
        refreshBtn.addEventListener('click', async () => {
            if (!cardData.url) return;

            this.showMessage('Aktualisiere Metadaten...', 'loading');

            try {
                const response = await fetch(`proxy.php?url=${encodeURIComponent(cardData.url)}`);
                const data = await response.json();

                if (data.success && data.metadata) {
                    // Aktualisiere Daten
                    cardData.title = data.metadata.og.title || data.metadata.title || cardData.title;
                    cardData.image = data.metadata.og.image || cardData.image;

                    // Aktualisiere UI
                    titleInput.value = cardData.title;

                    // Lade neues Bild
                    if (cardData.image) {
                        try {
                            cardData.imageBlob = await this.downloadImageAsBlob(cardData.image);
                            img.src = URL.createObjectURL(cardData.imageBlob);
                        } catch (e) {
                            img.src = cardData.image;
                        }
                    }

                    this.showMessage('Metadaten erfolgreich aktualisiert!', 'success');
                } else {
                    this.showMessage('Aktualisierung fehlgeschlagen: ' + (data.error || 'Unbekannter Fehler'), 'error');
                }
            } catch (error) {
                this.showMessage('Fehler beim Aktualisieren: ' + error.message, 'error');
            }
        });

        // Sortier-Buttons
        moveUpBtn.addEventListener('click', () => {
            this.moveCard(cardData.id, 'up');
        });

        moveDownBtn.addEventListener('click', () => {
            this.moveCard(cardData.id, 'down');
        });

        // Füge Karte hinzu
        this.container.appendChild(cardElement);
        this.cards.push(cardData);

        // Fokusiere Bemerkung
        setTimeout(() => {
            commentInput.focus();
        }, 100);
    }

    deleteCard(id) {
        const cardIndex = this.cards.findIndex(c => c.id === id);
        if (cardIndex !== -1) {
            this.cards.splice(cardIndex, 1);
        }

        const cardElement = this.container.querySelector(`[data-id="${id}"]`);
        if (cardElement) {
            cardElement.remove();
        }

        // Zeige empty state wenn keine Karten mehr da sind
        if (this.cards.length === 0) {
            this.container.innerHTML = '<div class="empty-state">Füge Links hinzu, um loszulegen...</div>';
        }

        this.showMessage('Karte gelöscht', 'success');
    }

    moveCard(id, direction) {
        const cardIndex = this.cards.findIndex(c => c.id === id);
        if (cardIndex === -1) return;

        const newIndex = direction === 'up' ? cardIndex - 1 : cardIndex + 1;

        // Prüfe Grenzen
        if (newIndex < 0 || newIndex >= this.cards.length) return;

        // FLIP Animation: First - Speichere alle aktuellen Positionen
        const allCards = Array.from(this.container.querySelectorAll('.card'));
        const firstPositions = allCards.map(card => card.getBoundingClientRect());

        // Speichere andere ID VOR dem Tausch
        const otherCardId = this.cards[newIndex].id;

        // Tausche in Array
        [this.cards[cardIndex], this.cards[newIndex]] = [this.cards[newIndex], this.cards[cardIndex]];

        // Tausche im DOM
        const cardElement = this.container.querySelector(`[data-id="${id}"]`);
        const otherCardElement = this.container.querySelector(`[data-id="${otherCardId}"]`);

        if (direction === 'up') {
            // Nach oben: Setze vor das andere Element
            this.container.insertBefore(cardElement, otherCardElement);
        } else {
            // Nach unten: Setze das andere Element vor dieses
            this.container.insertBefore(otherCardElement, cardElement);
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

    generateImageFilename(url, title, index) {
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

    exportCSV() {
        if (this.cards.length === 0) {
            this.showMessage('Keine Karten zum Exportieren vorhanden', 'error');
            return;
        }

        // Erstelle CSV
        const csvLines = this.cards.map((card, index) => {
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
                imageFilename = this.generateImageFilename(card.url, card.title, index) + this.getImageExtension(card.image || 'jpg');
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
        link.download = 'Artur_Weihnachten_2025.csv';
        link.click();

        this.showMessage('CSV erfolgreich exportiert!', 'success');
    }

    getImageExtension(url) {
        const match = url.match(/\.(webp|jpg|jpeg|png|gif)($|\?)/i);
        return match ? '.' + match[1].toLowerCase() : '.jpg';
    }

    async exportImages() {
        if (this.cards.length === 0) {
            this.showMessage('Keine Karten zum Exportieren vorhanden', 'error');
            return;
        }

        const cardsWithImages = this.cards.filter(card => card.image);

        if (cardsWithImages.length === 0) {
            this.showMessage('Keine Bilder zum Exportieren vorhanden', 'error');
            return;
        }

        this.showMessage(`Exportiere ${cardsWithImages.length} Bilder...`, 'loading');

        try {
            // Dynamisch JSZip laden (oder inline einbinden)
            if (typeof JSZip === 'undefined') {
                // Erstelle ZIP manuell oder lade JSZip
                await this.loadJSZip();
            }

            const zip = new JSZip();
            const imgFolder = zip.folder('img');

            for (let i = 0; i < this.cards.length; i++) {
                const card = this.cards[i];
                if (!card.image) continue;

                const filename = this.generateImageFilename(card.url, card.title, i) + this.getImageExtension(card.image);

                try {
                    let blob = card.imageBlob;

                    if (!blob) {
                        // Versuche Bild neu zu laden
                        blob = await this.downloadImageAsBlob(card.image);
                    }

                    if (blob) {
                        imgFolder.file(filename, blob);
                    } else {
                        console.warn(`Bild konnte nicht geladen werden: ${card.image}`);
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
            link.download = 'images.zip';
            link.click();

            this.showMessage('Bilder erfolgreich exportiert!', 'success');

        } catch (error) {
            this.showMessage(`Fehler beim Exportieren: ${error.message}`, 'error');
            console.error('Export error:', error);
        }
    }

    async loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// Initialisiere die Anwendung
document.addEventListener('DOMContentLoaded', () => {
    new LinkListManager();
});

