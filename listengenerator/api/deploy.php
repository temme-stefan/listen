<?php
/**
 * POST /api/deploy/:name
 * Baut listen/{name}/index.html aus Template + CSV.
 * Response: { "ok": true }
 */

require_once dirname(__DIR__) . '/lib/auth.php';
require_once dirname(__DIR__) . '/lib/build.php';

header('Content-Type: application/json; charset=utf-8');

$payload = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit();
}

// Name aus URI parsen: /api/deploy/artur → artur
$uri  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$name = '';
if (preg_match('#^/api/deploy/([^/]+)$#', $uri, $m)) {
    $name = $m[1];
}
if ($name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Listenname fehlt']);
    exit();
}

try {
    buildList($name);
    echo json_encode(['ok' => true, 'message' => "Liste '$name' erfolgreich gebaut"]);
} catch (RuntimeException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

