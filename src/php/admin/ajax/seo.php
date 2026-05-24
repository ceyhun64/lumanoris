<?php
// Ortak Başlangıç ve Bağlantılar
require '../../functions/db.php';
$database = Database::getInstance();
$conn = $database->getConnection();

session_start();
header('Content-Type: application/json');

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

// Dosya Yükleme İşlemleri için Ortak Fonksiyon (Tekrar eden kod)
function handleFileUpload($file_input_name, $upload_base_dir, $max_size, $allowed_types, $custom_file_name_prefix) {
    global $error_message;
    
    if (isset($_FILES[$file_input_name]) && $_FILES[$file_input_name]['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES[$file_input_name];
        
        if (!is_dir($upload_base_dir)) {
            if (!mkdir($upload_base_dir, 0755, true)) {
                $error_message = "Klasör oluşturulamadı: " . $upload_base_dir;
                return null;
            }
        }

        $fileMimeType = mime_content_type($file['tmp_name']);
        if (!in_array($fileMimeType, $allowed_types)) {
            $error_message = "Geçersiz dosya türü! Sadece izin verilenler yüklenebilir.";
            return null;
        }

        if ($file['size'] > $max_size) {
            $error_message = "Dosya çok büyük! Maksimum " . ($max_size / 1024) . " KB olmalıdır.";
            return null;
        }

        $fileExt = pathinfo($file['name'], PATHINFO_EXTENSION);
        $uploadFile = $upload_base_dir . $custom_file_name_prefix . '.' . $fileExt; 

        if (is_uploaded_file($file['tmp_name'])) {
            // Eski dosyayı sil (aynı ön ekli farklı uzantı olabilir)
            $oldFiles = glob($upload_base_dir . $custom_file_name_prefix . '.*');
            foreach ($oldFiles as $oldFile) {
                if (is_file($oldFile)) {
                    unlink($oldFile);
                }
            }
            
            if (move_uploaded_file($file['tmp_name'], $uploadFile)) {
                // Veritabanı için yolu kök dizine göre ayarla
                return str_replace('../../', '', $uploadFile);
            } else {
                $error_message = ucfirst($custom_file_name_prefix) . " yükleme sırasında bir hata oluştu.";
                return null;
            }
        } else {
            $error_message = "Dosya doğrulaması başarısız oldu.";
            return null;
        }
    }
    return null;
}


// Ortak Kontrol Yapısı ($seo_type'a göre)
switch ($seo_type) {
    case 'og':
        // 1. OG:Image Yükleme İşlemi
        $og_image_path = handleFileUpload(
            'og_image', 
            '../../assets/images/seo/', 
            500 * 1024, // 500 KB
            ['image/png', 'image/jpeg'], 
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
            '../../assets/images/twitter/', 
            500 * 1024, // 500 KB
            ['image/png', 'image/jpeg'], 
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
        $fields = ['site_baslik', 'site_aciklama', 'site_keywords', 'robots_txt', 'google_analytics', 'google_search'];
        $db_queries_temp = [];
        
        // 1. Metin Alanlarını Topla (DB ve Dosya için)
        foreach ($fields as $field) {
            $value = isset($_POST[$field]) ? trim($_POST[$field]) : '';
            if ($field !== 'robots_txt') {
                $db_queries_temp[$field] = $value;
            }
        }

        // 2. Robots.txt Dosya İşlemi
        $robots_txt_content = $_POST['robots_txt'] ?? '';
        if (!empty($robots_txt_content)) {
            $file_path = '../../robots.txt'; 
            if (file_put_contents($file_path, $robots_txt_content) === false) {
                $error_message = "Robots.txt dosyası yazılamadı.";
                echo json_encode(["status" => "error", "message" => $error_message]); exit;
            }
            $successMessages[] = "Robots.txt güncellendi.";
        }

        // 3. Favicon Yükleme İşlemi
        $favicon_path = handleFileUpload(
            'site_favicon', 
            '../../assets/', 
            50 * 1024, // 50 KB
            ['image/x-icon', 'image/vnd.microsoft.icon'], 
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