<?php

header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $results = $database->selectSingle("
        c.id,
        c.isim,
        (SELECT kullanici_adi FROM kullanicilar WHERE id = c.author_user_id) AS author_username,
        (SELECT kullanici_adi FROM kullanicilar WHERE id = c.owner_user_id) AS owner_username,
        c.owner_user_id,
        c.aciklama,
        c.kategori_id,
        c.kapak_fotografi,
        c.profil_fotografi,
        c.style_prompt,
        c.sohbet_basi_mesaj,
        c.ucret_haftalik,
        c.ucret_aylik,
        (SELECT COUNT(*) FROM chatbot_likes WHERE chatbot_id = c.id) AS likes,
        (SELECT COUNT(*) FROM chatbot_dislikes WHERE chatbot_id = c.id) AS dislikes,
        (SELECT COUNT(*) FROM chatbot_follows WHERE chatbot_id = c.id) AS follows
    FROM chatbotlar c
    INNER JOIN param_marketplace_sellers pms
        ON pms.user_id = c.author_user_id AND pms.status = 'active'
    WHERE c.id = ?
    ", [$_GET['id']]);

    if (!$results) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Chatbot bulunamadı veya satıcısı pazaryeri kaydını tamamlamamış."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Yorum sayısı + yorumlar + kullanıcı adları
    $comments = $database->selectMulti("
        cc.id,
        cc.chatbot_id,
        cc.user_id,
        cc.comment,
        cc.commented_at,
        u.kullanici_adi
    FROM chatbot_comments cc
    JOIN kullanicilar u ON u.id = cc.user_id
    WHERE cc.chatbot_id = ?
    ORDER BY cc.id DESC
    ", [$_GET['id']]);

    $commentCount = count($comments);

    // JSON olarak döndür
    $response = [
        "chatbot" => $results,
        "comments" => [
            "count" => $commentCount,
            "list" => $comments
        ]
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}