<?php
require_once __DIR__ . '/../functions/session.php';
admin_session_start();
unset($_SESSION['admin']);

echo json_encode([
    "status" => "success",
    "message" => "Oturum başarıyla kapatıldı.",
    "redirect" => "/admin/" // veya giriş sayfan neresiyse
]);
exit;
?>