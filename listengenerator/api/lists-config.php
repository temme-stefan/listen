<?php
/**
 * GET /api/lists-config          – Auth, liefert alle Listen
 * PUT /api/lists-config          – Auth, speichert Listen-Konfig
 */

require_once dirname(__DIR__) . '/lib/env.php';
require_once dirname(__DIR__) . '/lib/jwt.php';
require_once dirname(__DIR__) . '/lib/auth.php';

header('Content-Type: application/json; charset=utf-8');

// Beide Methoden brauchen Auth
requireAuth();

$configPath = dirname(__DIR__) . '/lists.json';
$listenBase = dirname(__DIR__) . '/listen';
$method     = $_SERVER['REQUEST_METHOD'];

function readConfig(string $path): array {
    if (!file_exists($path)) return [];
    return json_decode(file_get_contents($path), true) ?? [];
}

if ($method === 'GET') {
    echo json_encode(readConfig($configPath));
    exit();
}

if ($method === 'PUT') {

    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiges JSON']);
        exit();
    }

    $errors    = [];
    $sanitized = [];

    foreach ($body as $entry) {
        $newName = preg_replace('/[^a-z0-9\-_]/', '', strtolower($entry['name'] ?? ''));
        $oldName = isset($entry['oldName'])
            ? preg_replace('/[^a-z0-9\-_]/', '', strtolower($entry['oldName']))
            : $newName;

        if ($newName === '') continue;

        // Ordner umbenennen falls Slug geändert wurde
        if ($oldName !== $newName) {
            $oldDir = "$listenBase/$oldName";
            $newDir = "$listenBase/$newName";

            if (is_dir($newDir)) {
                $errors[] = "Zielordner '$newName' existiert bereits";
                continue;
            }
            if (is_dir($oldDir)) {
                if (!rename($oldDir, $newDir)) {
                    $errors[] = "Ordner '$oldName' konnte nicht in '$newName' umbenannt werden";
                    continue;
                }
            }
        }

        // Verzeichnis anlegen falls neu
        $imgDir = "$listenBase/$newName/img";
        if (!is_dir($imgDir)) mkdir($imgDir, 0755, true);

        $sanitized[] = [
            'name'     => $newName,
            'title'    => trim($entry['title'] ?? ucfirst($newName) . 's Wunschliste'),
            'archived' => (bool) ($entry['archived'] ?? false),
        ];
    }

    if (!empty($errors)) {
        http_response_code(409);
        echo json_encode(['error' => implode('; ', $errors)]);
        exit();
    }

    file_put_contents($configPath, json_encode($sanitized, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode(['ok' => true]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);

