document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const output = document.querySelector('output');
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Lösche vorherige Ausgaben
        output.innerHTML = '';
        output.className = '';
        
        const urlInput = form.querySelector('input');
        const urlValue = urlInput.value.trim();

        try {
            const url = new URL(urlValue);
            
            // Erstelle einen iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            iframe.onload = function() {
                try {
                    const doc = iframe.contentDocument;
                    
                    if (!doc) {
                        throw new Error('Dokument konnte nicht geladen werden (CORS)');
                    }

                    // Extrahiere Open Graph Metadaten
                    const metadata = {
                        title: doc.querySelector('title')?.textContent || '',
                        og: {
                            title: doc.querySelector('meta[property="og:title"]')?.content || '',
                            description: doc.querySelector('meta[property="og:description"]')?.content || '',
                            image: doc.querySelector('meta[property="og:image"]')?.content || '',
                            url: doc.querySelector('meta[property="og:url"]')?.content || '',
                            type: doc.querySelector('meta[property="og:type"]')?.content || ''
                        }
                    };
                    
                    // Erstelle HTML für die Ausgabe
                    const resultHTML = `
                        <h3>Gefundene Metadaten:</h3>
                        <div class="metadata">
                            <p><strong>Seitentitel:</strong> ${metadata.title}</p>
                            <h4>Open Graph Daten:</h4>
                            <ul>
                                <li><strong>OG Titel:</strong> ${metadata.og.title}</li>
                                <li><strong>OG Beschreibung:</strong> ${metadata.og.description}</li>
                                <li><strong>OG Bild:</strong> ${metadata.og.image}</li>
                                <li><strong>OG URL:</strong> ${metadata.og.url}</li>
                                <li><strong>OG Typ:</strong> ${metadata.og.type}</li>
                            </ul>
                        </div>
                    `;
                    
                    output.innerHTML = resultHTML;
                    output.className = 'success';
                    
                } catch (error) {
                    output.textContent = 'Leider können die Metadaten aufgrund von CORS-Einschränkungen nicht ausgelesen werden. ' +
                                       'Ein Server-seitiger Proxy wäre hier erforderlich.';
                    output.className = 'error';
                    console.error('Fehler beim Parsen:', error);
                }
                
                // Entferne den iframe wieder
                document.body.removeChild(iframe);
            };

            iframe.onerror = function() {
                output.textContent = 'Fehler beim Laden der Seite';
                output.className = 'error';
                document.body.removeChild(iframe);
            };

            // Setze die URL des iframes
            iframe.src = url.href;
            
        } catch (urlError) {
            output.textContent = 'Bitte geben Sie eine gültige URL ein.';
            output.className = 'error';
            console.error('Ungültige URL:', urlError.message);
        }
    });
});