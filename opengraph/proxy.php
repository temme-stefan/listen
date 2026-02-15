<?php
/**
 * ⚠️ SICHERHEITSWARNUNG ⚠️
 *
 * DIESER PROXY IST NICHT FÜR ÖFFENTLICHE DEPLOYMENTS GEEIGNET!
 *
 * NUR FÜR LOKALE ENTWICKLUNG VERWENDEN:
 * - php -S localhost:8088
 * - In privaten, geschützten Netzwerken
 *
 * SICHERHEITSRISIKEN:
 * - Open Proxy / SSRF-Schwachstelle (keine URL-Whitelist)
 * - Keine Authentifizierung
 * - Keine Rate-Limits
 * - SSL-Verification deaktiviert
 * - DDoS-Amplifikation möglich
 *
 * NICHT DEPLOYEN auf öffentlichen Servern!
 */

// Error Reporting für Debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Nicht in Response anzeigen
ini_set('log_errors', 1);

// Setze Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Hole die URL aus dem Request
$url = isset($_GET['url']) ? $_GET['url'] : (isset($_POST['url']) ? $_POST['url'] : '');

if (empty($url)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Keine URL angegeben'
    ]);
    exit();
}

// Validiere URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Ungültige URL'
    ]);
    exit();
}

try {
    // Prüfe ob cURL verfügbar ist
    if (!function_exists('curl_init')) {
        throw new Exception('cURL ist nicht verfügbar');
    }

    // Initialisiere cURL
    $ch = curl_init();

    if ($ch === false) {
        throw new Exception('cURL konnte nicht initialisiert werden');
    }

    // Temporäre Cookie-Datei
    $cookieFile = sys_get_temp_dir() . '/opengraph_cookies_' . md5($url) . '.txt';

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false, // Deaktiviert für Kompatibilität
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_AUTOREFERER => true,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        CURLOPT_HTTPHEADER => [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language: de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding: gzip, deflate, br',
            'DNT: 1',
            'Connection: keep-alive',
            'Upgrade-Insecure-Requests: 1',
            'Sec-Fetch-Dest: document',
            'Sec-Fetch-Mode: navigate',
            'Sec-Fetch-Site: none',
            'Sec-Fetch-User: ?1',
            'Cache-Control: max-age=0',
        ],
        CURLOPT_ENCODING => '',
    ]);

    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    $curlErrno = curl_errno($ch);
    $effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);

    curl_close($ch);

    // Cleanup cookie file
    if (file_exists($cookieFile)) {
        @unlink($cookieFile);
    }

    if ($html === false) {
        throw new Exception("cURL Fehler ($curlErrno): " . ($curlError ?: 'Unbekannter Fehler'));
    }

    if ($httpCode < 200 || $httpCode >= 400) {
        // Gebe trotzdem Informationen zurück für Debugging
        echo json_encode([
            'success' => false,
            'error' => "HTTP Fehler: $httpCode - Diese Website blockiert automatisierte Zugriffe. Versuche die URL direkt im Browser zu öffnen.",
            'url' => $url,
            'httpCode' => $httpCode,
            'effectiveUrl' => $effectiveUrl,
            'hint' => 'Manche Websites (z.B. Online-Shops) haben Bot-Protection und erlauben keinen automatisierten Zugriff.'
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit();
    }

    if (empty($html)) {
        throw new Exception('Keine Daten von der URL empfangen');
    }

    // Parse HTML und extrahiere Metadaten
    $metadata = extractMetadata($html);

    echo json_encode([
        'success' => true,
        'url' => $url,
        'httpCode' => $httpCode,
        'effectiveUrl' => $effectiveUrl,
        'metadata' => $metadata
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'url' => $url
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function extractMetadata($html) {
    $metadata = [
        'title' => '',
        'og' => [
            'title' => '',
            'description' => '',
            'image' => '',
            'url' => '',
            'type' => '',
            'site_name' => ''
        ],
        'twitter' => [
            'card' => '',
            'title' => '',
            'description' => '',
            'image' => ''
        ],
        'description' => ''
    ];

    // Erstelle DOMDocument
    $dom = new DOMDocument();
    @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));

    // Extrahiere Title
    $titleTags = $dom->getElementsByTagName('title');
    if ($titleTags->length > 0) {
        $metadata['title'] = trim($titleTags->item(0)->textContent);
    }

    // Extrahiere Meta-Tags
    $metaTags = $dom->getElementsByTagName('meta');

    foreach ($metaTags as $tag) {
        $property = $tag->getAttribute('property');
        $name = $tag->getAttribute('name');
        $content = $tag->getAttribute('content');

        // Open Graph Tags
        if (strpos($property, 'og:') === 0) {
            $key = substr($property, 3); // Entferne 'og:' Präfix
            if (array_key_exists($key, $metadata['og'])) {
                $metadata['og'][$key] = $content;
            }
        }

        // Twitter Card Tags
        if (strpos($name, 'twitter:') === 0) {
            $key = substr($name, 8); // Entferne 'twitter:' Präfix
            if (array_key_exists($key, $metadata['twitter'])) {
                $metadata['twitter'][$key] = $content;
            }
        }

        // Standard Meta Description
        if ($name === 'description') {
            $metadata['description'] = $content;
        }
    }

    return $metadata;
}

