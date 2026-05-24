<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Basit CSRF kontrolü (isteğe bağlı)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Yanlış İstek Türü'
    ]);
    exit;
}

// İstenen anahtar
$key = $_POST['key'] ?? null;
if (!$key) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Anahtar belirtilmedi'
    ]);
    exit;
}

// .env dosya yolu
$envFile = __DIR__ . '/../.env';

// Dosya yoksa hata
if (!file_exists($envFile)) {
    echo json_encode([
        'status' => 'error',
        'message' => '.env dosyası bulunamadı'
    ]);
    exit;
}

// .env dosyasını oku
$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$value = null;
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue; // yorum satırlarını atla
    [$envKey, $envValue] = array_map('trim', explode('=', $line, 2));
    if ($envKey === $key) {
        $value = $envValue;
        break;
    }
}

// Çıktı
if ($value !== null) {
    echo json_encode([
        'status' => 'success',
        'key' => $key,
        'value' => $value
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Anahtar bulunamadı'
    ]);
}