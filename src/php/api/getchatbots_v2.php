<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // Parametreleri kontrol et
    $searchTerm = isset($_GET['search']) && !empty(trim($_GET['search'])) ? trim($_GET['search']) : null;
    // userId parametresini ekledik
    $userId = isset($_GET['userId']) && is_numeric($_GET['userId']) ? intval($_GET['userId']) : 0;
    
    $params = [];

    // Temel sorgu kısmı
    // NOT: Sayıların birbirini katlamaması için DISTINCT ekledim.
    $queryBody = "
        c.id,
        c.kapak_fotografi,
        c.profil_fotografi,
        c.kategori_id,
        c.isim,
        c.aciklama,
        c.ucret_haftalik,
        c.yayimlanma_tarih,
        1 AS durum,
        u.kullanici_adi AS owner_name,
        COUNT(DISTINCT cc.id) AS toplam_chats,
        COUNT(DISTINCT cf.id) AS toplam_follows,
        COUNT(DISTINCT cl.id) AS toplam_lists,
        COUNT(DISTINCT cli.id) AS toplam_likes,
        COUNT(DISTINCT cdi.id) AS toplam_dislikes
    FROM chatbotlar c
    INNER JOIN param_marketplace_sellers pms
        ON pms.user_id = c.author_user_id AND pms.status = 'active'
    LEFT JOIN chatbot_chats cc ON cc.chatbot_id = c.id
    LEFT JOIN chatbot_follows cf ON cf.chatbot_id = c.id
    LEFT JOIN chatbot_in_list cl ON cl.chatbot_id = c.id
    LEFT JOIN chatbot_likes cli ON cli.chatbot_id = c.id
    LEFT JOIN chatbot_dislikes cdi ON cdi.chatbot_id = c.id
    LEFT JOIN kullanicilar u ON u.id = c.owner_user_id
    WHERE c.id > 0
    ";

    // 1. Entegrasyon: İlgilenilmeyen Kategorileri Filtrele
    if ($userId > 0) {
        $queryBody .= " AND c.kategori_id NOT IN (
            SELECT category_id FROM chatbot_uninterested WHERE user_id = ?
        )";
        $params[] = $userId;
    }

    // 2. Arama Koşulu
    if ($searchTerm !== null) {
        $queryBody .= " AND c.isim LIKE ?";
        $params[] = '%' . $searchTerm . '%';
    }

    $queryBody .= "
    GROUP BY c.id
    ORDER BY c.id DESC
    ";
    
    $results = $database->selectMulti($queryBody, $params);
    
    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>
