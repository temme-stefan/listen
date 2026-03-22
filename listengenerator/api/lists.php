<?php
/**
 * GET  /api/lists/:name  → JSON-Array aller Einträge
 * PUT  /api/lists/:name  → speichert übergebenes JSON-Array als CSV
 * GET  /api/lists        → Liste aller verfügbaren Listennamen
 */

require_once dirname(__DIR__) . '/lib/auth.php';
require_once dirname(__DIR__) . '/lib/csv.php';

header('Content-Type: application/json; charset=utf-8');

$payload = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

// Name aus URI parsen: /api/lists/artur → artur
$uri  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$name = '';
if (preg_match('#^/api/lists/([^/]+)$#', $uri, $m)) {
    $name = $m[1];
}

if ($name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Listenname fehlt']);
    exit();
}

if ($method === 'GET') {
    echo json_encode(csvRead($name));
    exit();
}

if ($method === 'PUT') {
    $rows = json_decode(file_get_contents('php://input'), true);
    if (!is_array($rows)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiges JSON']);
        exit();
    }
    csvWrite($name, $rows);
    echo json_encode(['ok' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);

