<?php
/**
 * Auth – JWT aus Authorization-Header prüfen.
 * Bricht mit 401 ab, wenn der Token fehlt, abgelaufen oder ungültig ist.
 * Gibt das dekodierte Payload zurück.
 */

require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/env.php';

function requireAuth(): array
{
    $secret = env('JWT_SECRET');

    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($header, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['error' => 'Kein Token angegeben']);
        exit();
    }

    $token   = substr($header, 7);
    $payload = jwtDecode($token, $secret);

    if ($payload === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Token ungültig oder abgelaufen']);
        exit();
    }

    return $payload;
}

