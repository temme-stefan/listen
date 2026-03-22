<?php
/**
 * .env-Loader – liest KEY=VALUE-Paare aus listengenerator/.env
 * Werte werden einmalig in $_ENV gecacht.
 */

function loadEnv(): void
{
    static $loaded = false;
    if ($loaded) return;

    $path = dirname(__DIR__) . '/.env';
    if (!file_exists($path)) return;

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        if (!str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value);
        if (!isset($_ENV[$key])) {
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }

    $loaded = true;
}

function env(string $key, string $default = ''): string
{
    loadEnv();
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

