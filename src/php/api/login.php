<?php
header('Content-Type: application/json');
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // DUMMY LOGIN BYPASS: Herhangi bir bilgi girildiğinde user 1 ile giriş yap
    $user = $database->selectSingle("id, kullanici_adi, eposta FROM kullanicilar WHERE id = ?", [1]);
    
    if (!$user) {
        // Veritabanında user 1 yoksa ID 1 ile devam et
        $user = ['id' => 1, 'eposta' => 'dummy@example.com'];
    }

    $_SESSION['user_id'] = $user['id'];

    echo json_encode([
        "success" => true,
        "message" => "Giriş başarılı! (Dummy User 1)",
        "user_id" => $user['id'],
        "email"   => $user['eposta']
    ]);
    exit;
}
?>
