<?php
header('Content-Type: application/json');
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $data = json_decode($_POST['data'], true) ?? null;

    if (!$data) {
        echo json_encode(["success" => false, "message" => "Veri bulunamadı!"]);
        exit;
    }

    try {
        $usernameOrEmail = $data['kullanici_adi'] ?? $data['eposta'] ?? null;
        $password        = $data['sifre'] ?? null;
        $rememberMe      = $data['rememberMe'] ?? false;

        if (!$usernameOrEmail || !$password) {
            echo json_encode(["success" => false, "message" => "Eksik alanlar!"]);
            exit;
        }

        $user = $database->selectSingle(
            "id, kullanici_adi, eposta, sifre FROM kullanicilar WHERE kullanici_adi = ? OR eposta = ?",
            [$usernameOrEmail, $usernameOrEmail]
        );

        if (!$user) {
            echo json_encode(["success" => false, "message" => "Kullanıcı bulunamadı!"]);
            exit;
        }

        if (empty($user['eposta'])) {
            $emailRecord = $database->selectSingle(
                "email FROM user_emails WHERE user_id = ? AND email = ?",
                [$user['id'], $usernameOrEmail]
            );

            if (!$emailRecord) {
                echo json_encode(["success" => false, "message" => "Bu e-posta kayıtlı değil!"]);
                exit;
            }
            $user['eposta'] = $emailRecord['email'];
        }

        if (!password_verify($password, $user['sifre'])) {
            echo json_encode(["success" => false, "message" => "Şifre hatalı!"]);
            exit;
        }

        $_SESSION['user_id'] = $user['id'];

        if ($rememberMe === true) {
            $selector = bin2hex(random_bytes(6));
            $validator = bin2hex(random_bytes(32));
            $expiry = date('Y-m-d H:i:s', time() + 60 * 60 * 24 * 30);
            $hashedValidator = hash('sha256', $validator);

            $stmt = $conn->prepare("INSERT INTO user_tokens (selector, hashed_validator, user_id, expiry) VALUES (?, ?, ?, ?)");
            $stmt->execute([$selector, $hashedValidator, $user['id'], $expiry]);

            setcookie(
                'remember_me',
                $selector . ':' . $validator,
                [
                    'expires' => time() + 60 * 60 * 24 * 30,
                    'path' => '/',
                    'httponly' => true,
                    'secure' => true,
                    'samesite' => 'Strict'
                ]
            );
        }

        echo json_encode([
            "success" => true,
            "message" => "Giriş başarılı!",
            "user_id" => $user['id'],
            "email"   => $user['eposta']
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Hata: " . $e->getMessage()
        ]);
    }
}
