<?php
$url = 'https://www.thalia.de/shop/home/artikeldetails/A1072995768';
$cookieFile = sys_get_temp_dir() . '/opengraph_cookies_' . md5($url) . '.txt';
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_AUTOREFERER => true,
    CURLOPT_COOKIEJAR => $cookieFile,
    CURLOPT_COOKIEFILE => $cookieFile,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    CURLOPT_HTTPHEADER => [
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
    CURLOPT_ENCODING => 'gzip, deflate',
]);
$html = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
curl_close($ch);

echo "HTTP: $code\n";
echo "Effective URL: $effectiveUrl\n";

if ($code === 200) {
    require_once __DIR__ . '/listengenerator/lib/ssrf.php';
    require_once __DIR__ . '/listengenerator/lib/meta.php';
    $meta = parseMetadata($html);
    echo "title: " . $meta['title'] . "\n";
    echo "image: " . substr($meta['image'], 0, 80) . "\n";
}

