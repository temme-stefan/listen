<?php
/**
 * Build-Service – injiziert CSV ins Template und schreibt listen/{name}/index.html
 */

require_once __DIR__ . '/csv.php';

/** Listenname → Titel (konfigurierbar, Fallback: Listenname) */
function listTitle(string $name): string
{
    $file = dirname(__DIR__) . '/lists.json';
    if (file_exists($file)) {
        $lists = json_decode(file_get_contents($file), true) ?? [];
        foreach ($lists as $entry) {
            if ($entry['name'] === $name) return $entry['title'];
        }
    }
    return ucfirst($name) . 's Wunschliste';
}

function buildList(string $name): void
{
    $csvPath      = csvPath($name);
    $templatePath = dirname(__DIR__) . '/template/index.html';
    $templateImgDir = dirname(__DIR__) . '/template/img';
    $outputPath   = listenDir($name) . '/index.html';
    $imgDir       = listenDir($name) . '/img';

    if (!file_exists($templatePath)) {
        throw new RuntimeException('Template nicht gefunden');
    }
    if (!file_exists($csvPath)) {
        throw new RuntimeException("links.csv für Liste '$name' nicht gefunden");
    }

    // Template-Bilder (noimg.svg, Icons) in img/ kopieren
    if (is_dir($templateImgDir)) {
        if (!is_dir($imgDir)) mkdir($imgDir, 0755, true);
        foreach (glob("$templateImgDir/*") as $file) {
            copy($file, $imgDir . '/' . basename($file));
        }
    }

    $csv      = file_get_contents($csvPath);
    $template = file_get_contents($templatePath);
    $title    = listTitle($name);

    // %title ersetzen
    $html = str_replace('%title', htmlspecialchars($title, ENT_QUOTES), $template);

    // CSV zwischen //startData … //endData injizieren
    $html = preg_replace(
        '/\/\/startData.*?\/\/endData/s',
        "//startData\n`$csv`\n        //endData",
        $html
    );

    if ($html === null) {
        throw new RuntimeException('Template-Injection fehlgeschlagen');
    }

    file_put_contents($outputPath, $html);
}

