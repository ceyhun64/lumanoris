<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // Arama parametresini kontrol et
    $searchTerm = isset($_GET['search']) && !empty(trim($_GET['search'])) ? trim($_GET['search']) : null;
    
    // Parametreler dizisi
    $params = [];

    // Temel sorgu kısmı (SELECT'ten sonraki kısım)
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
        COUNT(cc.id) AS toplam_chats,
        COUNT(cf.id) AS toplam_follows,
        COUNT(cl.id) AS toplam_lists,
        COUNT(cli.id) AS toplam_likes,
        COUNT(cdi.id) AS toplam_dislikes
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

    // Arama terimi varsa WHERE koşulunu ekle ve parametreyi hazırla
    if ($searchTerm !== null) {
        $searchPattern = '%' . $searchTerm . '%';
        
        // Mevcut WHERE koşuluna ekleme yapıyoruz, bu yüzden & işareti ile birleştiriyoruz
        // Eğer c.id > 0 koşulu zaten varsa, AND ile eklenmeli.
        $queryBody .= " AND c.isim LIKE ?";
        
        $params[] = $searchPattern; 
    }

    $queryBody .= "
    GROUP BY c.id
    ORDER BY c.id DESC
    ";
    
    // selectMulti fonksiyonunuz $params'ı executePreparedStatement'e gönderecektir.
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
