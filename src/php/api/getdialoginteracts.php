<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $results_likedislike = $database->selectSingle("
            udb.id,
            (SELECT COUNT(*) FROM dialog_likes WHERE dialog_id = udb.id) AS likes,
            (SELECT COUNT(*) FROM dialog_dislikes WHERE dialog_id = udb.id) AS dislikes
        FROM user_dialog_books udb
        WHERE udb.id = ?
    ", [$_GET['id']]);

    $results_comments = $database->selectMulti("
            dc.id AS comment_id,
            dc.comment,
            dc.commented_at,
            k.kullanici_adi AS comment_owner
        FROM dialog_comments dc
        LEFT JOIN kullanicilar k 
               ON dc.user_id = k.id
        WHERE dc.dialog_id = ?
    ", [$_GET['id']]);

    $output = [
        "success" => true,
        "dialog" => $results_likedislike,
        "comments" => $results_comments
    ];

    echo json_encode($output, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}