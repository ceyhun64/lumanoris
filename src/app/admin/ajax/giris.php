<?php
session_start();
header("Content-Type: application/json");

// CSRF fonksiyonu (util.php'de olmalı)
require($_SERVER['DOCUMENT_ROOT'] . '/lumanoris/functions/util.php');
require($_SERVER['DOCUMENT_ROOT'] . '/lumanoris/functions/db.php');

$database = Database::getInstance();
$conn = $database->getConnection();

// CSRF kontrolü
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "status" => "error",
        "message" => "Geçersiz istek"
    ]);
    exit;
}

$csrf_token = $_POST['csrf_token'] ?? '';
if (!csrf_check($csrf_token)) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    echo json_encode([
        "status" => "error",
        "message" => "Geçersiz istek (CSRF hatası)!"
    ]);
    exit;
}

// Giriş kontrolü
$admin_adi = $_POST['admin_adi'] ?? '';
$admin_sifre = $_POST['admin_sifre'] ?? '';

if (empty($admin_adi) || empty($admin_sifre)) {
    echo json_encode([
        "status" => "error",
        "message" => "Kullanıcı adı ve şifre zorunludur"
    ]);
    exit;
}

$admin_bilgi = $database->selectSingle("* FROM adminler WHERE kullanici_adi = ?", [$admin_adi]);

if ($admin_bilgi && password_verify($admin_sifre, $admin_bilgi['sifre'])) {
    $_SESSION['admin'] = $admin_adi;
    echo json_encode([
        "status" => "success",
        "message" => "Giriş başarılı",
        "redirect" => "lumanoris/admin/"
    ]);
    exit;
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Geçersiz kullanıcı adı veya şifre"
    ]);
    exit;
}