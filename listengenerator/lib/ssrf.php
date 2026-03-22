<?php
/**
 * SSRF-Schutz – blockiert Anfragen an interne IP-Adressen.
 */

function assertNotSsrf(string $url): void
{
    $parsed = parse_url($url);

    // Nur http/https erlaubt
    if (!isset($parsed['scheme']) || !in_array($parsed['scheme'], ['http', 'https'], true)) {
        throw new InvalidArgumentException('Nur http/https-URLs erlaubt');
    }

    $host = $parsed['host'] ?? '';
    if ($host === '') {
        throw new InvalidArgumentException('Kein Host in URL');
    }

    // Hostname auflösen
    $ip = gethostbyname($host);
    if ($ip === $host && !filter_var($ip, FILTER_VALIDATE_IP)) {
        throw new InvalidArgumentException("Host konnte nicht aufgelöst werden: $host");
    }

    if (isBlockedIp($ip)) {
        throw new InvalidArgumentException("Zugriff auf interne Adresse verweigert: $ip");
    }
}

function isBlockedIp(string $ip): bool
{
    $blocked = [
        '/^127\./',                          // Loopback
        '/^10\./',                           // RFC 1918
        '/^192\.168\./',                     // RFC 1918
        '/^172\.(1[6-9]|2\d|3[01])\./',     // RFC 1918
        '/^169\.254\./',                     // Link-local
        '/^::1$/',                           // IPv6 Loopback
        '/^fc00:/i',                         // IPv6 ULA
        '/^fe80:/i',                         // IPv6 Link-local
    ];

    foreach ($blocked as $pattern) {
        if (preg_match($pattern, $ip)) return true;
    }

    return false;
}

