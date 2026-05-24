<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();

    if (!isset($_GET['user_id'])) {
        throw new Exception("Kullanıcı ID belirtilmedi.");
    }

    $userId = (int)$_GET['user_id'];
    
    $query = "uc.id, uc.chatbot_id, c.isim as title, c.profil_fotografi as image, 
            c.ucret_haftalik as price, c.ucret_aylik as monthlyPrice, 
            uc.order_weeks, ck.kategori_adi_tr as category 
            FROM user_cart uc 
            JOIN chatbotlar c ON uc.chatbot_id = c.id 
            LEFT JOIN chatbot_kategoriler ck ON c.kategori_id = ck.id
            WHERE uc.user_id = ?";
              
    $results = $database->selectMulti($query, [$userId]);

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>