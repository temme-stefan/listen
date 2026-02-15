<?php
/**
 * ⚠️ SICHERHEITSWARNUNG ⚠️
 *
 * Image Proxy - NUR FÜR LOKALE ENTWICKLUNG!
 * Umgeht CORS-Probleme beim Laden externer Bilder
 *
 * NICHT DEPLOYEN auf öffentlichen Servern!
 */

// Error Reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Hole Bild-URL
$imageUrl = $_GET['url'] ?? '';

if (empty($imageUrl)) {
    http_response_code(400);
    header('Content-Type: text/plain');
    echo 'Keine Bild-URL angegeben';
    exit();
}

// Validiere URL
if (!filter_var($imageUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    header('Content-Type: text/plain');
    echo 'Ungültige URL';
    exit();
}

try {
    // Initialisiere cURL
    $ch = curl_init();

    if ($ch === false) {
        throw new Exception('cURL konnte nicht initialisiert werden');
    }

    curl_setopt_array($ch, [
        CURLOPT_URL => $imageUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        CURLOPT_HTTPHEADER => [
            'Accept: image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language: de-DE,de;q=0.9',
            'DNT: 1',
            'Connection: keep-alive',
        ],
        CURLOPT_ENCODING => 'gzip, deflate',
    ]);

    $imageData = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $curlError = curl_error($ch);
    $curlErrno = curl_errno($ch);

    curl_close($ch);

    if ($imageData === false) {
        throw new Exception("cURL Fehler ($curlErrno): " . ($curlError ?: 'Unbekannter Fehler'));
    }

    if ($httpCode < 200 || $httpCode >= 400) {
        http_response_code($httpCode);
        header('Content-Type: text/plain');
        echo "HTTP Fehler: $httpCode";
        exit();
    }

    if (empty($imageData)) {
        throw new Exception('Keine Bilddaten empfangen');
    }

    // Setze Content-Type Header
    if (!empty($contentType)) {
        header('Content-Type: ' . $contentType);
    } else {
        // Fallback: Versuche Content-Type zu erraten
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedType = $finfo->buffer($imageData);
        header('Content-Type: ' . $detectedType);
    }

    // Cache-Header für bessere Performance
    header('Cache-Control: public, max-age=86400'); // 24 Stunden
    header('Content-Length: ' . strlen($imageData));

    // Sende Bilddaten
    echo $imageData;

} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: text/plain');
    echo 'Fehler: ' . $e->getMessage();
    error_log('Image Proxy Error: ' . $e->getMessage());
}

