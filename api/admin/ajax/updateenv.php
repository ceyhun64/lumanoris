<?php
require_once __DIR__ . '/_guard.php';
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['admin'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Yetkisiz erişim.']);
    exit;
}

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

/**
 * G-07 — bu uç nokta `.env`'e YAZDIĞI anahtarlar için beyaz liste
 * tutmuyordu ve değeri hiç kaçırmıyordu. İki sonuç:
 *
 *   1. **Serbest anahtar yazımı.** `camelToApiCase()` istemcinin verdiği
 *      HER alan adını `API_*` biçimine çevirip dosyaya yazıyordu. Panelde
 *      tek bir alan var (`googleGemini`) ama uç nokta istediğini kabul
 *      ediyordu.
 *   2. **Satır sonu enjeksiyonu.** Değer ham yazıldığı için içindeki bir
 *      `\n` yeni bir `.env` satırı açıyordu: tek bir POST ile
 *      `API_GOOGLE_GEMINI=x\nDB_PASS=...\nSMTP_PASS=...` yazılabiliyor,
 *      yani `.env`in TAMAMI istemci tarafından belirlenebiliyordu.
 *      `.env` veritabanı kimlik bilgilerini taşıyor.
 *
 * Artık: yalnızca bilinen alan adları kabul ediliyor, değerde CR/LF
 * reddediliyor ve değer tırnak içine alınıp kaçırılıyor.
 */
const ENV_WRITABLE_FIELDS = [
    // form alanı => .env anahtarı
    'googleGemini' => 'API_GOOGLE_GEMINI',
];

$fail = static function (string $message, int $status = 422): void {
    http_response_code($status);
    echo json_encode(['status' => 'error', 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
};

// 4. .env dosya yolu
$envFile = __DIR__ . '/../.env';

// 5. Dosyayı oku (varsa)
$lines = file_exists($envFile) ? file($envFile, FILE_IGNORE_NEW_LINES) : [];

// 6. POST verilerini işle (CSRF hariç)
$result = [];
foreach ($_POST as $key => $value) {
    if ($key === 'csrf_token') continue;

    if (!isset(ENV_WRITABLE_FIELDS[$key])) {
        $fail('Bu alan güncellenemez: ' . htmlspecialchars((string) $key, ENT_QUOTES, 'UTF-8'), 403);
    }
    if (!is_string($value)) {
        $fail('Geçersiz değer.');
    }
    // Boş = "değiştirme". Form artık mevcut anahtarı ÖNCEDEN DOLDURMUYOR
    // (bkz. admin/api.php), yani boş bir gönderim anahtarı silmemeli.
    if (trim($value) === '') {
        continue;
    }
    // CR/LF: yeni bir .env satırı açar (asıl açık).
    // `"` ve `\`: `functions/env.php` yalnızca DIŞ tırnak çiftini soyuyor,
    // içerideki kaçışları ÇÖZMÜYOR — yani kaçırmak değeri bozardı.
    // API anahtarlarında bu karakterler bulunmaz; kabul etmiyoruz.
    if (strpbrk($value, "\r\n\"\\") !== false) {
        $fail('Değer satır sonu, tırnak veya ters bölü içeremez.');
    }

    $newKey = ENV_WRITABLE_FIELDS[$key];
    $result[$newKey] = $value;

    // Değer tırnaklı yazılıyor: boşluk ya da `#` içeren bir değer
    // ayrıştırıcıda sessizce kesilmesin.
    $envLine = $newKey . '="' . $value . '"';

    $found = false;
    foreach ($lines as $i => $line) {
        if (strpos($line, $newKey . '=') === 0) {
            // Anahtar bulundu, güncelle
            $lines[$i] = $envLine;
            $found = true;
            break;
        }
    }
    if (!$found) {
        // Anahtar yoksa ekle
        $lines[] = $envLine;
    }
}

// 7. Çıktı — yazacak bir şey yoksa dosyaya HİÇ dokunma.
// (Eski kod her istekte `.env`i yeniden yazıyordu; boş bir gönderim bile
// dosyayı gereksiz yere yeniden üretiyordu.)
if (empty($result)) {
    echo json_encode([
        'status'  => 'success',
        'message' => 'Değişiklik yapılmadı (alan boş bırakıldı).'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

file_put_contents($envFile, implode(PHP_EOL, $lines) . PHP_EOL);

echo json_encode([
    'status'  => 'success',
    'message' => 'API Anahtarları başarıyla güncellendi!'
], JSON_UNESCAPED_UNICODE);