<?php
/**
 * CSV-Service – liest/schreibt listen/{name}/links.csv
 * Format: {nr};{url};{titel};{bilddatei};{kommentar};{gekauft}
 */

function listenDir(string $name): string
{
    $name = sanitizeListName($name);
    return dirname(__DIR__) . "/listen/$name";
}

function csvPath(string $name): string
{
    return listenDir($name) . '/links.csv';
}

function sanitizeListName(string $name): string
{
    $clean = preg_replace('/[^a-z0-9\-_]/', '', strtolower($name));
    if ($clean === '') throw new InvalidArgumentException('Ungültiger Listenname');
    return $clean;
}

/** CSV → Array von assoziativen Arrays */
function csvRead(string $name): array
{
    $path = csvPath($name);
    if (!file_exists($path)) return [];

    $rows = [];
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $parts = explode(';', $line);
        if (count($parts) < 6) continue;
        [$sort, $url, $title, $image, $comment, $bought] = $parts;
        $rows[] = [
            'sort'    => (int) $sort,
            'url'     => $url,
            'title'   => $title,
            'image'   => $image,
            'comment' => $comment,
            'bought'  => strtolower(trim($bought)) === 'true',
        ];
    }
    return $rows;
}

/** Array von assoziativen Arrays → CSV */
function csvWrite(string $name, array $rows): void
{
    $dir = listenDir($name);
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $lines = [];
    foreach (array_values($rows) as $i => $row) {
        $sort    = $i + 1;
        $url     = csvEscape($row['url'] ?? '');
        $title   = csvEscape($row['title'] ?? '');
        $image   = csvEscape($row['image'] ?? '');
        $comment = csvEscape($row['comment'] ?? '');
        $bought  = ($row['bought'] ?? false) ? 'true' : 'false';
        $lines[] = "$sort;$url;$title;$image;$comment;$bought";
    }

    file_put_contents(csvPath($name), implode("\n", $lines));
}

/** Semikolons und Zeilenumbrüche in Feldern entfernen */
function csvEscape(string $value): string
{
    return str_replace([';', "\n", "\r"], ['，', ' ', ''], $value);
}

/** Gibt alle verfügbaren Listennamen zurück */
function csvListNames(): array
{
    $base = dirname(__DIR__) . '/listen';
    if (!is_dir($base)) return [];
    return array_values(array_filter(
        scandir($base),
        fn($d) => $d !== '.' && $d !== '..' && is_dir("$base/$d")
    ));
}

