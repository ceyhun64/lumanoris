<?php
require_once __DIR__ . '/_guard.php';
// Ortak Başlangıç ve Bağlantılar
require_once __DIR__ . '/../../functions/db.php'; // G-13: göreli yol PHP'nin çalışma dizinine göre çözülüyordu
$database = Database::getInstance();
$conn = $database->getConnection();

header('Content-Type: application/json');

if (empty($_SESSION['admin'])) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Yetkisiz erişim."]);
    exit;
}

// Ortak Değişken (Hangi modülün çalışacağını belirler)
// Bu değerin POST isteği ile gelmesi beklenir: örn: '{"seo_type": "og", ...}'
$input_data = json_decode(file_get_contents('php://input'), true);
$seo_type = $input_data['seo_type'] ?? $_POST['seo_type'] ?? ''; // POST'tan veya JSON body'den al

if (empty($seo_type)) {
    echo json_encode(["status" => "error", "message" => "Ortak değişken ('seo_type') eksik veya tanımlı değil."]);
    exit;
}

// Genel POST isteği kontrolü (Tüm modüller için geçerli)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Geçersiz istek metodu."]);
    exit;
}

$queries = [];
$successMessages = [];
$error_message = null;

require_once __DIR__ . '/../functions/upload_guard.php';

/**
 * Dosya Yükleme İşlemleri için Ortak Fonksiyon.
 *
 * G-06 — bu fonksiyonun eski hâli panelin ÜÇÜNCÜ ve en zayıf yükleme
 * yoluydu. İki ayrı sorunu vardı:
 *   (a) Uzantı İSTEMCİNİN dosya adından alınıyordu
 *       (`pathinfo($file['name'], PATHINFO_EXTENSION)`), yani doğrulanan
 *       MIME ile diske yazılan uzantı arasında hiçbir bağ yoktu: geçerli
 *       bir PNG "og_image.php" olarak kaydedilebiliyordu ve hedef dizin
 *       web'den servis ediliyor.
 *   (b) `mime_content_type()` `function_exists` koruması olmadan
 *       çağrılıyordu; ext-fileinfo yoksa yakalanamayan fatal error.
 * Artık uzantı DOĞRULANMIŞ MIME'dan türetiliyor
 * (`functions/upload_guard.php`, upload.php ile aynı uygulama).
 *
 * G-13 — `$upload_base_dir` göreli yol ('../../assets/...') olarak
 * geliyordu; göreli yollar PHP'nin ÇALIŞMA DİZİNİNE göre çözülür, dosyanın
 * konumuna göre değil. Router/CLI/Apache üçünde üç farklı yere yazıyordu.
 * Artık çağıranlar `__DIR__` tabanlı MUTLAK yol veriyor; veritabanına
 * yazılacak göreli yol da ayrı parametre olarak alınıyor.
 *
 * @param string               $uploadBaseDir Mutlak hedef dizin (sonunda /)
 * @param string               $publicPrefix  DB'ye yazılacak göreli önek
 * @param array<string,string> $mimeToExt     izinli MIME → uzantı
 */
function handleFileUpload($file_input_name, $uploadBaseDir, $publicPrefix, $max_size, $mimeToExt, $custom_file_name_prefix) {
    global $error_message;

    if (!isset($_FILES[$file_input_name]) || ($_FILES[$file_input_name]['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return null;
    }

    $file = $_FILES[$file_input_name];

    if (!is_dir($uploadBaseDir) && !mkdir($uploadBaseDir, 0755, true) && !is_dir($uploadBaseDir)) {
        $error_message = "Klasör oluşturulamadı.";
        return null;
    }

    $verifyError = null;
    $verified    = upload_verify($file, $mimeToExt, $max_size, $verifyError);
    if ($verified === null) {
        $error_message = $verifyError;
        return null;
    }

    [, $ext] = $verified;
    $uploadFile = $uploadBaseDir . $custom_file_name_prefix . '.' . $ext;

    // Eski dosyayı sil (aynı ön ekli farklı uzantı olabilir)
    foreach (glob($uploadBaseDir . $custom_file_name_prefix . '.*') ?: [] as $oldFile) {
        if (is_file($oldFile)) {
            unlink($oldFile);
        }
    }

    if (!move_uploaded_file($file['tmp_name'], $uploadFile)) {
        $error_message = ucfirst($custom_file_name_prefix) . " yükleme sırasında bir hata oluştu.";
        return null;
    }

    return $publicPrefix . $custom_file_name_prefix . '.' . $ext;
}


// Ortak Kontrol Yapısı ($seo_type'a göre)
switch ($seo_type) {
    case 'og':
        // 1. OG:Image Yükleme İşlemi
        $og_image_path = handleFileUpload(
            'og_image',
            __DIR__ . '/../../assets/images/seo/',   // G-13: mutlak
            'assets/images/seo/',                    // DB'ye yazılan göreli yol
            AppConfig::MAX_SEO_IMAGE_BYTES,          // H-06
            ['image/png' => 'png', 'image/jpeg' => 'jpg'],
            'og_image'
        );

        if ($error_message) {
            echo json_encode(["status" => "error", "message" => $error_message]); exit;
        }

        // 2. Metin Alanlarını Topla
        $queries = [
            'og:title' => $_POST['og_title'] ?? '',
            'og:description' => $_POST['og_description'] ?? '',
            'og:url' => $_POST['og_url'] ?? '',
            'og:type' => $_POST['og_type'] ?? '',
            'og:site_name' => $_POST['og_site_name'] ?? ''
        ];

        // 3. Görsel yolu varsa queries'e ekle
        if ($og_image_path !== null) {
            $queries['og:image'] = $og_image_path;
        }
        
        if (!empty($queries)) {
            if ($database->updateGlobalVars($queries)) {
                $successMessages[] = "OG Meta SEO ayarları başarıyla güncellendi.";
            } else {
                $error_message = "OG Meta SEO ayarları güncellemesinde hata oluştu.";
            }
        } else {
            $error_message = "Gönderilecek OG verisi bulunamadı.";
        }
        break;

    case 'twitter':
        // 1. Twitter Görseli Yükleme İşlemi
        $twitter_image_path = handleFileUpload(
            'twitter_image',
            __DIR__ . '/../../assets/images/twitter/',
            'assets/images/twitter/',
            AppConfig::MAX_SEO_IMAGE_BYTES,
            ['image/png' => 'png', 'image/jpeg' => 'jpg'],
            'twitter_image'
        );

        if ($error_message) {
            echo json_encode(["status" => "error", "message" => $error_message]); exit;
        }

        // 2. Metin Alanlarını Topla
        $queries = [
            'twitter:card' => $_POST['twitter_card'] ?? '',
            'twitter:title' => $_POST['twitter_title'] ?? '',
            'twitter:description' => $_POST['twitter_description'] ?? '',
            'twitter:site' => $_POST['twitter_site'] ?? ''
        ];

        // 3. Görsel yolu varsa queries'e ekle
        if ($twitter_image_path !== null) {
            $queries['twitter:image'] = $twitter_image_path;
        }
        
        if (!empty($queries)) {
            // 4. Veritabanı Güncelleme
            if ($database->updateGlobalVars($queries)) {
                $successMessages[] = "Twitter SEO ayarları başarıyla güncellendi.";
            } else {
                $error_message = "Twitter SEO ayarları güncellemesinde hata oluştu.";
            }
        } else {
             $error_message = "Gönderilecek Twitter verisi bulunamadı.";
        }
        break;
        
    case 'general':
        // SEO-002: 'robots_txt' bu listeden çıkarıldı ve dosya yazma adımı
        // tamamen kaldırıldı.
        //
        // Eski kod `file_put_contents('../../robots.txt', ...)` çağırıyordu.
        // Bu göreli yol, dosyanın konumuna değil, PHP sürecinin ÇALIŞMA
        // DİZİNİNE göre çözülüyordu: `php -S` altında proje dışına, Apache
        // altında api/robots.txt'e düşüyordu. Yayında /robots.txt'i servis
        // eden dosya ise ikisi de değildi. Yani bu alan hiçbir zaman
        // çalışmadı; sessizce yanlış yere yazıyordu.
        //
        // Tek authoritative kaynak artık web/src/app/robots.js.
        $fields = ['site_baslik', 'site_aciklama', 'site_keywords', 'google_analytics', 'google_search'];
        $db_queries_temp = [];

        foreach ($fields as $field) {
            $db_queries_temp[$field] = isset($_POST[$field]) ? trim($_POST[$field]) : '';
        }

        // Favicon Yükleme İşlemi
        $favicon_path = handleFileUpload(
            'site_favicon',
            __DIR__ . '/../../assets/',
            'assets/',
            AppConfig::MAX_FAVICON_BYTES,
            [
                'image/x-icon'               => 'ico',
                'image/vnd.microsoft.icon'   => 'ico',
                'image/png'                  => 'png',
            ],
            'favicon'
        );
        
        if ($error_message) {
            echo json_encode(["status" => "error", "message" => $error_message]); exit;
        }
        
        if ($favicon_path !== null) {
            // Favicon yolu veritabanına kaydedilecekse buraya eklenir, yoksa sadece başarı mesajı yeterlidir.
            // Modül 3'te favicon yolu DB'ye kaydedilmiyordu, sadece yükleniyordu.
            $successMessages[] = "Favicon başarıyla yüklendi.";
        }
        
        // Veritabanına yazılacak alanları filtrele
        $queries = $db_queries_temp;

        // 4. Veritabanı Güncelleme
        if (!empty($queries)) {
            if ($database->updateGlobalVars($queries)) {
                $successMessages[] = "Site SEO ayarları veritabanında güncellendi.";
            } else {
                $error_message = "Site SEO ayarları veritabanında güncellenemedi.";
            }
        }
        
        if (empty($queries) && empty($successMessages)) {
            $error_message = "Gönderilecek veri bulunamadı.";
        }
        break;

    default:
        $error_message = "Tanımsız SEO tipi: " . htmlspecialchars($seo_type);
        break;
}

// Sonuç Çıktısı
if ($error_message) {
    echo json_encode(["status" => "error", "message" => $error_message]);
} else if (!empty($successMessages)) {
    echo json_encode(["status" => "success", "message" => implode(" ", $successMessages)]);
} else {
    echo json_encode(["status" => "error", "message" => "Bilinmeyen bir hata oluştu."]);
}
?>