<?php
/**
 * Bild-Service – lädt Bilder von URL herunter oder speichert Uploads.
 * Gibt den lokalen Dateinamen (relativ zu img/) zurück.
 */

require_once __DIR__ . '/ssrf.php';
require_once __DIR__ . '/csv.php';

function downloadImage(string $imageUrl, string $listName, string $filename): string
{
    assertNotSsrf($imageUrl);

    $imgDir = listenDir($listName) . '/img';
    if (!is_dir($imgDir)) mkdir($imgDir, 0755, true);

    $ext      = imageExtension($imageUrl);
    $saveName = $filename . $ext;
    $savePath = "$imgDir/$saveName";

    $ch = curl_init($imageUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 3,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT      => 'Mozilla/5.0',
    ]);
    $data     = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($data === false || $httpCode < 200 || $httpCode >= 400) {
        throw new RuntimeException("Bild konnte nicht geladen werden: HTTP $httpCode");
    }

    file_put_contents($savePath, $data);
    return $saveName;
}

function saveUploadedImage(array $file, string $listName, string $filename): string
{
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Upload-Fehler: ' . $file['error']);
    }

    $mime     = mime_content_type($file['tmp_name']);
    $allowed  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!in_array($mime, $allowed, true)) {
        throw new RuntimeException("Nicht erlaubter MIME-Typ: $mime");
    }

    $ext      = mimeToExt($mime);
    $imgDir   = listenDir($listName) . '/img';
    if (!is_dir($imgDir)) mkdir($imgDir, 0755, true);

    $saveName = $filename . $ext;
    move_uploaded_file($file['tmp_name'], "$imgDir/$saveName");
    return $saveName;
}

function generateImageFilename(string $title, int $index): string
{
    $slug = strtolower(trim($title));

    // Umlaute transliterieren
    $slug = str_replace(
        ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'],
        ['ae', 'oe', 'ue', 'ss', 'ae', 'oe', 'ue'],
        $slug
    );

    $slug = preg_replace('/[^a-z0-9\s\-]/', '', $slug);
    $slug = preg_replace('/\s+/', '-', $slug);
    $slug = preg_replace('/-+/', '-', $slug);
    $slug = substr($slug, 0, 50);
    $slug = trim($slug, '-');
    if ($slug === '') $slug = 'image';
    return ($index + 1) . '-' . $slug;
}

function imageExtension(string $url): string
{
    $path  = parse_url($url, PHP_URL_PATH) ?? '';
    $match = [];
    if (preg_match('/\.(webp|jpg|jpeg|png|gif)$/i', $path, $match)) {
        return '.' . strtolower($match[1]);
    }
    return '.jpg';
}

function mimeToExt(string $mime): string
{
    return match($mime) {
        'image/jpeg' => '.jpg',
        'image/png'  => '.png',
        'image/webp' => '.webp',
        'image/gif'  => '.gif',
        default      => '.jpg',
    };
}

