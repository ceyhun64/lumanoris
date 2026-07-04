<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// 1. Sadece POST kabul et
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Yanlış İstek Türü'
    ]);
    exit;
}

// 2. CSRF token kontrolü
if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Geçersiz CSRF token'
    ]);
    exit;
}

// 3. camelCase → API_CAMEL_CASE dönüştürücü
function camelToApiCase($key) {
    $converted = preg_replace('/([a-z])([A-Z])/', '$1_$2', $key);
    $converted = strtoupper($converted);
    return 'API_' . $converted;
}

// 4. .env dosya yolu
$envFile = __DIR__ . '/../.env';

// 5. Dosyayı oku (varsa)
$lines = file_exists($envFile) ? file($envFile, FILE_IGNORE_NEW_LINES) : [];

// 6. POST verilerini işle (CSRF hariç)
$result = [];
foreach ($_POST as $key => $value) {
    if ($key === 'csrf_token') continue;

    $newKey = camelToApiCase($key);
    $result[$newKey] = $value;

    $found = false;
    foreach ($lines as $i => $line) {
        if (strpos($line, $newKey . '=') === 0) {
            // Anahtar bulundu, güncelle
            $lines[$i] = $newKey . '=' . $value;
            $found = true;
            break;
        }
    }
    if (!$found) {
        // Anahtar yoksa ekle
        $lines[] = $newKey . '=' . $value;
    }
}

// 7. Dosyayı yeniden yaz
file_put_contents($envFile, implode(PHP_EOL, $lines) . PHP_EOL);

// 8. Çıktı
if (!empty($result)) {
    echo json_encode([
        'status' => 'success',
        'message' => "API Anahtarları başarıyla güncellendi!"
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'POST verisi bulunamadı'
    ]);
}