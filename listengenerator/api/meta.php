<?php
/**
 * POST /api/meta
 * Body: { "url": "https://..." }
 * Response: { "title": "...", "image": "..." }
 */

require_once dirname(__DIR__) . '/lib/auth.php';
require_once dirname(__DIR__) . '/lib/meta.php';

header('Content-Type: application/json; charset=utf-8');

$payload = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit();
}

$body = json_decode(file_get_contents('php://input'), true);
$url  = trim($body['url'] ?? '');

if ($url === '') {
    http_response_code(400);
    echo json_encode(['error' => 'url fehlt']);
    exit();
}

if (!filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültige URL']);
    exit();
}

try {
    $meta = fetchMeta($url);
    echo json_encode(['ok' => true, 'title' => $meta['title'], 'image' => $meta['image']]);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
} catch (RuntimeException $e) {
    // Kein fataler Fehler – Website könnte Bot-Protection haben
    http_response_code(200);
    echo json_encode(['ok' => false, 'error' => $e->getMessage(), 'title' => '', 'image' => '']);
}

