<?php
/**
 * PHP Built-in Server Router (nur für lokale Entwicklung)
 * Ersetzt .htaccess-Rewriting beim Ausführen mit: php -S localhost:8088 router.php
 */

$uri  = $_SERVER['REQUEST_URI'];
$path = urldecode(parse_url($uri, PHP_URL_PATH));

// Path-Traversal blockieren
if (str_contains($path, '..') || str_contains($path, "\0")) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültiger Pfad']);
    exit();
}

// MIME-Type-Tabelle
$mimes = [
    'js'    => 'application/javascript',
    'mjs'   => 'application/javascript',
    'css'   => 'text/css',
    'html'  => 'text/html',
    'svg'   => 'image/svg+xml',
    'png'   => 'image/png',
    'jpg'   => 'image/jpeg',
    'jpeg'  => 'image/jpeg',
    'webp'  => 'image/webp',
    'gif'   => 'image/gif',
    'ico'   => 'image/x-icon',
    'woff'  => 'font/woff',
    'woff2' => 'font/woff2',
    'json'  => 'application/json',
];

function serveFile(string $file, array $mimes): void {
    $ext  = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    $mime = $mimes[$ext] ?? 'application/octet-stream';
    header("Content-Type: $mime");
    readfile($file);
    exit();
}

// 1. Direkte statische Datei im Docroot (z.B. /favicon.svg)
$docroot = __DIR__ . $path;
if ($path !== '/' && file_exists($docroot) && !is_dir($docroot)) {
    serveFile($docroot, $mimes);
}

// 2. Dateien aus public/ (React Build-Output: /assets/..., /index.html etc.)
$publicFile = __DIR__ . '/public' . $path;
if ($path !== '/' && file_exists($publicFile) && !is_dir($publicFile)) {
    serveFile($publicFile, $mimes);
}

// 3. Dateien aus listen/ (statische Listen: /listen/:name/img/... etc.)
//    Verzeichnis-Requests auf index.html weiterleiten
if (str_starts_with($path, '/listen/')) {
    $listenFile = __DIR__ . $path;

    // Verzeichnis ohne trailing slash → Redirect mit slash
    if (is_dir($listenFile) && !str_ends_with($path, '/')) {
        header("Location: $path/", true, 301);
        exit();
    }

    // Verzeichnis mit trailing slash → index.html ausliefern
    $indexFile = rtrim($listenFile, '/') . '/index.html';
    if (is_dir($listenFile) && file_exists($indexFile)) {
        serveFile($indexFile, $mimes);
    }

    // Direkte Datei
    if (file_exists($listenFile) && !is_dir($listenFile)) {
        serveFile($listenFile, $mimes);
    }
}

// 4. API-Routing
$routes = [
    '#^/api/auth$#'                => __DIR__ . '/api/auth.php',
    '#^/api/lists-config$#'        => __DIR__ . '/api/lists-config.php',
    '#^/api/lists/?$#'             => __DIR__ . '/api/lists.php',
    '#^/api/lists/([^/]+)$#'       => __DIR__ . '/api/lists.php',
    '#^/api/meta$#'                => __DIR__ . '/api/meta.php',
    '#^/api/images/([^/]+)$#'      => __DIR__ . '/api/images.php',
    '#^/api/deploy/([^/]+)$#'      => __DIR__ . '/api/deploy.php',
];

foreach ($routes as $pattern => $file) {
    if (preg_match($pattern, $path, $matches)) {
        if (isset($matches[1])) {
            $_GET['name'] = $matches[1];
        }
        require $file;
        exit();
    }
}

// 5. SPA Fallback → public/index.html
require __DIR__ . '/index.php';

