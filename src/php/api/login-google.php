<?php
require_once '../vendor/autoload.php';
require '../functions/db.php';
$database = Database::getInstance();
$conn = $database->getConnection();
session_start();

$client = new Google_Client([
    'client_id' => '457680679934-poocs7d0n78r3eq8q53c6sedfdi1dh0c.apps.googleusercontent.com'
]);

// FormData ile gelen "data" alanını yakala
$jsonData = $_POST['data'] ?? null;
$data = $jsonData ? json_decode($jsonData, true) : null;

$id_token = $data['google_token'] ?? null;

if ($id_token) {
    $payload = $client->verifyIdToken($id_token);
    if ($payload) {
        $googleId = $payload['sub'];
        $email    = $payload['email'];
        $name     = $payload['name'] ?? '';

        // DB kontrol
        $user = $database->selectSingle(
            "id, google_id, COUNT(*) FROM kullanicilar WHERE google_id = ? OR eposta = ?",
            [$googleId, $email]
        );

        if ($user["COUNT(*)"] == 0) {
            $userId = $database->insert("kullanicilar", [
                "google_id" => $googleId,
                "eposta"     => $email,
                "ad_soyad"      => $name
            ]);
        } else {
            $userId = $user["id"];

            if (empty($user['google_id'])) {
                $database->update("kullanicilar", 
                    ["google_id" => $googleId], 
                    "id = ?", 
                    [$userId]
                );
            }
        }

        // Session veya JWT üret
        $_SESSION['user_id'] = $userId;
        echo json_encode([
            "success" => true,
            "user_id" => $userId,
            "message" => "Login successful"
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "error"   => "Invalid token"
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error"   => "Token not provided"
    ]);
}