<?php
header('Content-Type: application/json');
require '../functions/db.php';

try {
    $database = Database::getInstance();
    $userId = (int)($_GET['user_id'] ?? 0);

    if ($userId <= 0) {
        echo json_encode(["success" => false, "message" => "Eksik parametre."]);
        exit;
    }

    // Kullanıcının satın aldığı chatbotlar. Chatbot başına tek satır (en güncel abonelik).
    // is_active: süresi henüz dolmamış mı (1/0).
    $rows = $database->selectMulti(
        "s.chatbot_id,
                c.isim,
                c.kapak_fotografi,
                c.profil_fotografi,
                c.kategori_id,
                MAX(s.expiry_date) AS expiry_date,
                MAX(s.duration_weeks) AS duration_weeks,
                (MAX(s.expiry_date) > NOW()) AS is_active
         FROM user_subscriptions s
         JOIN chatbotlar c ON c.id = s.chatbot_id
         WHERE s.user_id = ? AND s.status = 1
         GROUP BY s.chatbot_id, c.isim, c.kapak_fotografi, c.profil_fotografi, c.kategori_id
         ORDER BY expiry_date DESC",
        [$userId]
    );

    echo json_encode(is_array($rows) ? $rows : []);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
