<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $id = $_GET['id'];
    // Sadece ID ve Türkçe isim çekiyoruz
    $results = $database->selectMulti("c.id, c.author_user_id, c.isim, c.kapak_fotografi, c.profil_fotografi, c.kategori_id, c.ucret_haftalik, c.ucret_aylik,
    COALESCE(pms.status, 'not_started') AS seller_status,
    (SELECT COUNT(*) FROM chatbot_likes WHERE chatbot_id = c.id) AS likes,
    (SELECT COUNT(*) FROM chatbot_dislikes WHERE chatbot_id = c.id) AS dislikes,
    (SELECT COUNT(*) FROM chatbot_follows WHERE chatbot_id = c.id) AS follows
     FROM chatbotlar c
     LEFT JOIN param_marketplace_sellers pms ON pms.user_id = c.author_user_id
     WHERE c.author_user_id = $id OR c.owner_user_id = $id");

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>