<?php
/**
 * POST /api/auth
 * Body: { "password": "...", "list": ":name" }
 * Response: { "token": "eyJ..." }
 */

require_once dirname(__DIR__) . '/lib/env.php';
require_once dirname(__DIR__) . '/lib/jwt.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit();
}

$body     = json_decode(file_get_contents('php://input'), true);
$password = trim($body['password'] ?? '');
$list     = trim($body['list'] ?? '');

if ($password === '' || $list === '') {
    http_response_code(400);
    echo json_encode(['error' => 'password und list erforderlich']);
    exit();
}

$hash   = env('PASSWORD_HASH');
$secret = env('JWT_SECRET');

if ($hash === '' || $secret === '') {
    http_response_code(500);
    echo json_encode(['error' => '.env nicht konfiguriert']);
    exit();
}

if (!password_verify($password, $hash)) {
    http_response_code(401);
    echo json_encode(['error' => 'Falsches Passwort']);
    exit();
}

$token = jwtEncode([
    'list' => $list,
    'iat'  => time(),
    'exp'  => time() + 8 * 3600,
], $secret);

echo json_encode(['token' => $token]);

