<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // 1. Parametreleri al
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 3; // Sayıyı sen belirlemek istiyordun

    if ($userId <= 0) {
        echo json_encode([]);
        exit;
    }

    // 2. Önce kullanıcının sepetindeki ürünlerin kategori_id'lerini ve chatbot_id'lerini bulalım
    // Böylece hem aynı kategoriden önerebiliriz hem de zaten sepette olanı tekrar önermeyiz.
    $cartItems = $database->selectMulti(
        "uc.chatbot_id, c.kategori_id 
        FROM user_cart uc 
        JOIN chatbotlar c ON uc.chatbot_id = c.id 
        WHERE uc.user_id = ?", 
        [$userId]
    );

    //echo json_encode($cartItems); // Debug için, kaldırılabilir
    //die();
    
    if (empty($cartItems)) {
        // Sepet boşsa genel popüler veya rastgele botlar getirilebilir (Opsiyonel)
        echo json_encode([]);
        exit;
    }

    $categoryIdsRaw = array_unique(array_column($cartItems, 'kategori_id'));
    $excludedBotIdsRaw = array_column($cartItems, 'chatbot_id');

    // Boş değerleri temizleyelim ve stringe çevirelim
    $categoryIn = implode(',', array_filter($categoryIdsRaw));
    $excludeIn = implode(',', array_filter($excludedBotIdsRaw));

    // Eğer sepetten kategori gelmediyse sorguyu hiç çalıştırma
    if (empty($categoryIn)) {
        echo json_encode([]);
        exit;
    }

    // 3. Öneri sorgusunu ID'leri doğrudan içine yazarak hazırla
    $queryBody = "
        c.id,
        c.kapak_fotografi,
        c.profil_fotografi,
        c.isim,
        c.aciklama,
        c.owner_user_id,
        u.kullanici_adi AS owner_name,
        c.ucret_haftalik,
        COUNT(cc.id) AS toplam_chats
    FROM chatbotlar c
    INNER JOIN param_marketplace_sellers pms
        ON pms.user_id = c.author_user_id AND pms.status = 'active'
    LEFT JOIN kullanicilar u ON u.id = c.owner_user_id
    LEFT JOIN chatbot_chats cc ON cc.chatbot_id = c.id
    WHERE c.kategori_id IN ($categoryIn)
    AND c.id NOT IN ($excludeIn)
    GROUP BY c.id
    ORDER BY RAND() 
    LIMIT $limit
    ";

    //echo json_encode(["query" => $queryBody]); // Debug için, kaldırılabilir
    //die();

    // Artık $params göndermene gerek yok, sorgu kendi içinde değerleri barındırıyor
    $results = $database->selectMulti($queryBody, []);
    
    // Resim formatlama (Base64 check)
    foreach ($results as &$bot) {
        if (isset($bot['profil_fotografi'])) {
            $bot['profil_fotografi'] = str_starts_with($bot['profil_fotografi'], 'data:') 
                ? $bot['profil_fotografi'] 
                : "data:image/jpeg;base64," . $bot['profil_fotografi'];
        }
    }

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>