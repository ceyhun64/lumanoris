<?php
header('Content-Type: application/json');

//require '../functions/db.php';       // DB bağlantısı
require '../functions/phpmailer.php'; // sendEmail 2.0 fonksiyonunu kullanacağız

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email      = $_POST['email'] ?? '';
    $resetCode  = $_POST['resetCode'] ?? '';

    if (empty($email) || empty($resetCode)) {
        echo json_encode([
            "success" => false,
            "message" => "Email ve kod zorunludur!"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        // DB bağlantısı
        $database = Database::getInstance();
        $conn = $database->getConnection();

        // Kullanıcı var mı kontrol et
        $user = $database->selectSingle(
            "id, ad_soyad, kullanici_adi FROM kullanicilar WHERE eposta = ?",
            [$email]
        );

        if (!$user) {
            echo json_encode([
                "success" => false,
                "message" => "Bu e-posta ile kayıtlı bir kullanıcı bulunamadı."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Mail subject ve body
        $subject = "Şifre Sıfırlama Kodu";
        $body = "<p>Merhaba <strong>{$user['ad_soyad']}</strong>,</p>
                 <p>Şifrenizi sıfırlamak için kullanmanız gereken kod:</p>
                 <h2 style='color:#2c3e50;'>{$resetCode}</h2>
                 <p>Bu kodu şifre sıfırlama ekranına girerek yeni şifrenizi belirleyebilirsiniz.</p>
                 <p>Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p>";

        // Mail gönder
        $result = sendEmail(
            "no-reply@seninsiten.com", // gönderen email (sistem maili)
            "Sistem",                  // gönderen ad
            $email,                    // alıcı email
            $subject,
            $body
        );
        $result['user_id'] = $user['id'];


        echo json_encode($result, JSON_UNESCAPED_UNICODE);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}
?>