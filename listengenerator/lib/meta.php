<?php
/**
 * OpenGraph-Scraper – basierend auf opengraph/proxy.php
 * Gibt ['title' => ..., 'image' => ...] zurück oder wirft Exception.
 */

require_once __DIR__ . '/ssrf.php';

function fetchMeta(string $url): array
{
    // SSRF-Schutz
    assertNotSsrf($url);

    try {
        $result = fetchMetaDirect($url);
        // Leeres Ergebnis (Bot-Protection hat durchgelassen aber kein OG geliefert) → Fallback
        if ($result['title'] === '' && $result['image'] === '') {
            throw new RuntimeException('Keine Metadaten im HTML gefunden');
        }
        return $result;
    } catch (RuntimeException $e) {
        // Fallback: microlink.io (50 kostenlose Requests/Tag)
        return fetchMetaMicrolink($url);
    }
}

function fetchMetaDirect(string $url): array
{
    $cookieFile = sys_get_temp_dir() . '/lg_cookies_' . md5($url) . '.txt';

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 5,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_AUTOREFERER    => true,
        CURLOPT_COOKIEJAR      => $cookieFile,
        CURLOPT_COOKIEFILE     => $cookieFile,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        CURLOPT_HTTPHEADER     => [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language: de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding: gzip, deflate',
            'DNT: 1',
            'Connection: keep-alive',
            'Upgrade-Insecure-Requests: 1',
            'Sec-Fetch-Dest: document',
            'Sec-Fetch-Mode: navigate',
            'Sec-Fetch-Site: none',
            'Sec-Fetch-User: ?1',
            'Cache-Control: max-age=0',
        ],
        CURLOPT_ENCODING       => 'gzip, deflate',
    ]);

    $html     = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    @unlink($cookieFile);

    if ($html === false) throw new RuntimeException("cURL-Fehler: $error");
    if ($httpCode < 200 || $httpCode >= 400) {
        throw new RuntimeException("HTTP $httpCode – Website blockiert automatisierten Zugriff");
    }

    return parseMetadata($html);
}

function fetchMetaMicrolink(string $url): array
{
    $apiUrl = 'https://api.microlink.io?url=' . urlencode($url);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $apiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT      => 'listengenerator/1.0',
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($response === false) throw new RuntimeException("microlink cURL-Fehler: $error");
    if ($httpCode < 200 || $httpCode >= 400) {
        throw new RuntimeException("microlink HTTP $httpCode");
    }

    $data = json_decode($response, true);
    if (!isset($data['data'])) {
        throw new RuntimeException('microlink: Ungültige Antwort');
    }

    return [
        'title' => $data['data']['title'] ?? '',
        'image' => $data['data']['image']['url'] ?? '',
    ];
}

function parseMetadata(string $html): array
{
    $dom = new DOMDocument();
    @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));

    $title = '';
    $image = '';

    // <title>
    $titles = $dom->getElementsByTagName('title');
    if ($titles->length > 0) {
        $title = trim($titles->item(0)->textContent);
    }

    // <meta> Tags
    foreach ($dom->getElementsByTagName('meta') as $tag) {
        $property = $tag->getAttribute('property');
        $content  = $tag->getAttribute('content');

        if ($property === 'og:title' && $content !== '') $title = $content;
        if ($property === 'og:image' && $content !== '') $image = $content;
    }

    return ['title' => $title, 'image' => $image];
}

