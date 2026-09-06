<?php
/**
 * G-10 — bu dosya `ajax/` altında `_guard.php`'yi ÇAĞIRMAYAN tek dosyaydı:
 * metot kontrolü yoktu (GET ile de çalışıyordu) ve CSRF kontrolü yoktu.
 * Sonuç: admin'in ziyaret ettiği herhangi bir sayfa (bir `<img>` etiketi
 * bile yeterdi) admin'i sessizce oturumdan atabiliyordu. Tek başına
 * "sadece can sıkıcı" görünse de, oturumu düşürüp yeniden giriş yaptırmak
 * kimlik avı senaryolarının klasik ilk adımıdır.
 *
 * `_guard.php` oturumu başlatıyor, admin değilse 403 veriyor ve GET
 * olmayan her istekte CSRF token'ı doğruluyor (panelin fetch shim'i
 * `X-CSRF-Token` başlığını zaten her isteğe ekliyor — çağıran taraf
 * değişmedi).
 */
require_once __DIR__ . '/_guard.php';

header('Content-Type: application/json; charset=utf-8');

// Oturumu yalnızca `admin` anahtarını silerek değil, tamamen kapat:
// `admin_login_at`/`admin_login_ip` gibi kalıntılar geride kalmasın.
$_SESSION = [];
session_unset();
session_destroy();

echo json_encode([
    "status" => "success",
    "message" => "Oturum başarıyla kapatıldı.",
    "redirect" => "/admin/"
], JSON_UNESCAPED_UNICODE);
exit;
