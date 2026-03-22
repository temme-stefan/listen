<?php
/**
 * POST /api/images/:name
 * Multipart-Upload (field: "image") ODER JSON { "url": "...", "filename": "..." }
 * Response: { "filename": "1-lego-set.webp" }
 */

require_once dirname(__DIR__) . '/lib/auth.php';
require_once dirname(__DIR__) . '/lib/image.php';

header('Content-Type: application/json; charset=utf-8');

$payload = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit();
}

$name = $_GET['name'] ?? '';
if ($name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Listenname fehlt']);
    exit();
}

try {
    // Upload via multipart
    if (!empty($_FILES['image'])) {
        $index    = (int) ($_POST['index'] ?? 0);
        $title    = $_POST['title'] ?? '';
        $baseName = generateImageFilename($title, $index);
        $filename = saveUploadedImage($_FILES['image'], $name, $baseName);
        echo json_encode(['ok' => true, 'filename' => $filename]);
        exit();
    }

    // Download via URL
    $body     = json_decode(file_get_contents('php://input'), true);
    $url      = trim($body['url'] ?? '');
    $index    = (int) ($body['index'] ?? 0);
    $title    = $body['title'] ?? '';

    if ($url === '') {
        http_response_code(400);
        echo json_encode(['error' => 'url oder image-Upload erforderlich']);
        exit();
    }

    $baseName = generateImageFilename($title, $index);
    $filename = downloadImage($url, $name, $baseName);
    echo json_encode(['ok' => true, 'filename' => $filename]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

