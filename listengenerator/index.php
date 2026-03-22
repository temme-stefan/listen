<?php
/**
 * Einstiegspunkt – liefert die React-SPA aus public/index.html aus.
 * API-Requests werden via .htaccess direkt in api/ geleitet.
 */

$spa = __DIR__ . '/public/index.html';

if (file_exists($spa)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($spa);
} else {
    // Während der Entwicklung, bevor das React-Build existiert
    http_response_code(503);
    echo '<!doctype html><html><body>'
       . '<h1>listengenerator</h1>'
       . '<p>Frontend noch nicht gebaut. Bitte <code>npm run build</code> im <code>frontend/</code>-Verzeichnis ausführen.</p>'
       . '</body></html>';
}

