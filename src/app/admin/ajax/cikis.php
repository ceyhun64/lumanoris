<?php
session_start();
unset($_SESSION['admin']);

echo json_encode([
    "status" => "success",
    "message" => "Oturum başarıyla kapatıldı.",
    "redirect" => "/admin/" // veya giriş sayfan neresiyse
]);
exit;
?>