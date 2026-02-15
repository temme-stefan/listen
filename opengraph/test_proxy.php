<?php
// Test-Skript für proxy.php

// Simuliere GET-Request
$_GET['url'] = 'https://www.example.com';
$_SERVER['REQUEST_METHOD'] = 'GET';

echo "=== Test der proxy.php ===\n\n";
echo "Test-URL: {$_GET['url']}\n\n";

// Capture output
ob_start();
include 'proxy.php';
$output = ob_get_clean();

echo "Response:\n";
echo $output . "\n\n";

// Parse JSON
$result = json_decode($output, true);
if ($result) {
    echo "Erfolgreich geparst:\n";
    echo "Success: " . ($result['success'] ? 'Ja' : 'Nein') . "\n";
    if (isset($result['error'])) {
        echo "Fehler: " . $result['error'] . "\n";
    }
    if (isset($result['metadata'])) {
        echo "Metadaten gefunden: Ja\n";
        echo "Titel: " . ($result['metadata']['title'] ?: 'N/A') . "\n";
    }
} else {
    echo "JSON Parse Fehler: " . json_last_error_msg() . "\n";
}

