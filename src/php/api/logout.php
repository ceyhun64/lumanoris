<?php
header('Content-Type: application/json');
session_start();

// Session temizle
$_SESSION = [];
session_unset();
session_destroy();

// Cookie’yi de sıfırla
setcookie("PHPSESSID", "", time() - 3600, "/", "", true, true);

echo json_encode([
    "success" => true,
    "message" => "Çıkış yapıldı."
]);
exit;
?>