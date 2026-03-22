<?php
/**
 * JWT – erzeugen & verifizieren (HMAC-SHA256, keine externe Bibliothek)
 */

function jwtEncode(array $payload, string $secret): string
{
    $header  = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64UrlEncode(json_encode($payload));
    $sig     = base64UrlEncode(hash_hmac('sha256', "$header.$payload", $secret, true));
    return "$header.$payload.$sig";
}

function jwtDecode(string $token, string $secret): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $payload, $sig] = $parts;

    // Signatur prüfen
    $expected = base64UrlEncode(hash_hmac('sha256', "$header.$payload", $secret, true));
    if (!hash_equals($expected, $sig)) return null;

    // Payload dekodieren
    $data = json_decode(base64UrlDecode($payload), true);
    if (!is_array($data)) return null;

    // Ablaufzeit prüfen
    if (isset($data['exp']) && $data['exp'] < time()) return null;

    return $data;
}

function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
}

