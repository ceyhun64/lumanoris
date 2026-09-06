<?php
require_once __DIR__ . '/_guard.php';
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['admin'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Yetkisiz erişim.']);
    exit;
}

// Basit CSRF kontrolü (isteğe bağlı)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Yanlış İstek Türü'
    ]);
    exit;
}

/**
 * G-08 — bu uç nokta İSTENEN HER `.env` anahtarının değerini ham JSON
 * olarak tarayıcıya döndürüyordu: `key=DB_PASS` bir POST ile veritabanı
 * parolasını, `SMTP_PASS` ile posta parolasını veriyordu. Admin oturumu
 * arkasındaydı ama panelde CSP yok (G-20) ve bu uç noktanın HİÇBİR
 * ÇAĞIRANI yok — yani tek işlevi bir sızıntı yüzeyi olmaktı.
 *
 * Silme adayı olarak işaretlendi (silme kararı ürün tarafında,
 * AUDIT Belirsizlikler #1). Silinene kadar iki kapı:
 *   1. anahtar beyaz listesi — yalnızca panelin gerçekten gösterdiği
 *      alanlar okunabilir,
 *   2. değer MASKELENİYOR — anahtarın var/yok bilgisi ve son 4 karakteri
 *      dönüyor, tam değer asla.
 */
const ENV_READABLE_KEYS = ['API_GOOGLE_GEMINI'];

// İstenen anahtar
$key = $_POST['key'] ?? null;
if (!$key) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Anahtar belirtilmedi'
    ]);
    exit;
}

if (!in_array($key, ENV_READABLE_KEYS, true)) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Bu anahtar okunamaz.'
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
    // G-08: tam değer ASLA dönmüyor. Panelin ihtiyacı "kayıtlı mı, hangisi"
    // bilgisi; bunun için son 4 karakter yeterli.
    $unquoted = trim($value, "\"'");
    $masked   = strlen($unquoted) > 4
        ? str_repeat('•', 8) . substr($unquoted, -4)
        : ($unquoted === '' ? '' : str_repeat('•', 8));

    echo json_encode([
        'status'    => 'success',
        'key'       => $key,
        'value'     => $masked,
        'masked'    => true,
        'is_set'    => $unquoted !== '',
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Anahtar bulunamadı'
    ]);
}