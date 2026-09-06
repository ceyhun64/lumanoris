<?php
require_once __DIR__ . '/_guard.php';
require_once __DIR__ . '/../../functions/db.php';
require_once __DIR__ . '/../functions/upload_guard.php';
$database = Database::getInstance();
$conn = $database->getConnection();

header('Content-Type: application/json');

if (empty($_SESSION['admin'])) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Yetkisiz erişim."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Geçersiz istek metodu."]);
    exit;
}

// Tüm gelen POST verilerini filtrele
$updateData = [];
foreach ($_POST as $key => $value) {
    // CSRF token gibi özel alanları dışla
    if ($key === 'csrf_token') continue;
    $updateData[$key] = $value;
}

if (!empty($_FILES)) {
    /**
     * SEC-021 🟠 — bu yükleme yolu yalnızca UZANTIYA bakıyordu ve izin
     * verilenler arasında **svg** vardı.
     *
     * İki ayrı sorun:
     *
     *   1. **SVG bir belgedir, resim değil.** İçine `<script>` ya da
     *      `onload=` gömülebilir. Dosya `assets/img/global/` altına yazılıp
     *      site kaynağından servis edildiği için, doğrudan açıldığında
     *      JavaScript siteyle AYNI ORIGIN'de çalışır — oturum çerezine
     *      erişebilir. `api/assets/.htaccess` PHP yorumlayıcısını kapatıyor
     *      ama SVG'nin JavaScript'i tarayıcıda çalışır, sunucuda değil.
     *   2. **Uzantı içeriği kanıtlamaz.** Aynı dizindeki
     *      `admin/ajax/upload.php` magic-byte doğrulaması yapıyor
     *      (`finfo_file`); bu yol o kontrolü hiç yapmıyordu. Yani
     *      `zararli.php` içerikli bir dosya `resim.png` adıyla yüklenebilirdi.
     *
     * Artık: SVG kaldırıldı, MIME magic-byte ile doğrulanıyor, ve dosya adı
     * sunucuda üretiliyor (istemcinin verdiği ad hiç kullanılmıyor).
     */
    $uploadDir = __DIR__ . '/../../assets/img/global/';

    if (!is_dir($uploadDir)) {
        // 0777 dünyaya yazılabilir demekti; 0755 yeterli.
        mkdir($uploadDir, 0755, true);
    }

    // H-06 — bu iki değer burada elle yazılıydı ve `AppConfig`teki "tek
    // doğruluk kaynağı" ile bağlantısı yoktu. Artık oradan okunuyor.
    // (SVG bilinçli olarak listede YOK — bkz. yukarıdaki 1. madde;
    // AppConfig::IMAGE_MIME_EXTENSIONS de içermiyor.)
    $allowedMimes = AppConfig::IMAGE_MIME_EXTENSIONS;
    $maxBytes     = AppConfig::MAX_UPLOAD_SIZE_BYTES;

    foreach ($_FILES as $key => $file) {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            continue;
        }
        if (($file['size'] ?? 0) > $maxBytes) {
            continue;
        }
        // Yüklenen dosya gerçekten HTTP yüklemesi mi?
        if (!is_uploaded_file($file['tmp_name'])) {
            continue;
        }

        // Magic-byte doğrulaması — G-06/H-06: üç yükleme yolu artık aynı
        // uygulamayı paylaşıyor (`functions/upload_guard.php`).
        $mime = upload_detect_mime($file['tmp_name']);

        if ($mime === false || !isset($allowedMimes[$mime])) {
            error_log('[updategv] reddedilen yükleme, mime=' . var_export($mime, true) . ' key=' . $key);
            continue;
        }

        // Dosya adı sunucuda üretiliyor; istemcinin verdiği ad kullanılmıyor.
        $fileName   = date('Ymd-His') . '_' . bin2hex(random_bytes(8)) . '.' . $allowedMimes[$mime];
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            @chmod($targetPath, 0644);
            // Burada veritabanındaki var_key değerinin HTML formundaki name ile aynı olması önemli
            $updateData[$key] = 'assets/img/global/' . $fileName;
        }
    }
}

// Eğer güncellenecek veri yoksa hata ver
if (empty($updateData)) {
    echo json_encode(["status" => "error", "message" => "Güncellenecek veri bulunamadı."]);
    exit;
}

// updateGlobalVars fonksiyonunu çağır
$resultMessage = $database->updateGlobalVars($updateData);

// Yanıtı hazırla
if (strpos($resultMessage, 'başarılı') !== false) {
    echo json_encode([
        "status" => "success",
        "message" => "İçerikler başarıyla güncellendi!"
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Güncelleme sırasında hata oluştu: " . $resultMessage
    ]);
}
?>
