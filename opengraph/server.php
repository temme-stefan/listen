<?php
// proxy.php

// Setze CORS-Header
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Hole URL aus dem Query-Parameter
$url = isset($_GET['url']) ? $_GET['url'] : 'https://www.tolymp.de/klettern-und-turnen/dip-buin-steelwood/';

if (empty($url)) {
    http_response_code(400);
    echo json_encode(['error' => 'URL Parameter fehlt']);
    exit;
}

// Validiere URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültige URL']);
    exit;
}

try {
    // Initialisiere cURL
    $ch = curl_init();
    
    // Setze cURL Optionen
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        CURLOPT_TIMEOUT => 30
    ]);
    
    // Führe Request aus
    $html = curl_exec($ch);
    
    // Prüfe auf Fehler
    if (curl_errno($ch)) {
        throw new Exception(curl_error($ch));
    }
    
    // Hole HTTP Status Code
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Schließe cURL
    curl_close($ch);
    
    // Erstelle DOMDocument zum Parsen
    $doc = new DOMDocument();
    @$doc->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
    $xpath = new DOMXPath($doc);

    // Extrahiere Metadaten
    $metadata = [
        'title' => '',
        'og' => [
            'title' => '',
            'description' => '',
            'image' => '',
            'url' => '',
            'type' => ''
        ],
        'meta' => []
    ];

    // Hole Seitentitel
    $titleNodes = $xpath->query('//title');
    if ($titleNodes->length > 0) {
        $metadata['title'] = trim($titleNodes->item(0)->nodeValue);
    }

    // Hole alle Meta-Tags
    $metaTags = $xpath->query('//meta');
    foreach ($metaTags as $meta) {
        $property = $meta->getAttribute('property');
        $name = $meta->getAttribute('name');
        $content = $meta->getAttribute('content');

        // Open Graph Metadaten
        if (strpos($property, 'og:') === 0) {
            $ogProperty = str_replace('og:', '', $property);
            if (isset($metadata['og'][$ogProperty])) {
                $metadata['og'][$ogProperty] = $content;
            }
        }

        // Andere Meta-Tags
        if ($name && $content) {
            $metadata['meta'][$name] = $content;
        }
    }

    // Füge zusätzliche Informationen hinzu
    $metadata['url'] = $url;
    $metadata['status'] = $httpCode;
    $metadata['timestamp'] = date('c');

    // Sende erfolgreiche Antwort
    echo json_encode([
        'success' => true,
        'data' => $metadata
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}