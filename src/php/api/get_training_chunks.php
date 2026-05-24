<?php
header('Content-Type: application/json');
require '../functions/db.php';

$botId = $_GET['botId'] ?? null;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$limit = 10000; // Her seferinde 10k karakter çek

if (!$botId) {
    echo json_encode(["success" => false, "message" => "Bot ID eksik"]);
    exit;
}

try {
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // Veriyi parça parça çekmek için SUBSTRING kullanımı
    $stmt = $conn->prepare("SELECT SUBSTRING(training_prompt, :start, :limit) as chunk, LENGTH(training_prompt) as total_length FROM chatbotlar WHERE id = :id");
    $start = $offset + 1; // MySQL SUBSTRING 1'den başlar
    $stmt->bindParam(':start', $start, PDO::PARAM_INT);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':id', $botId, PDO::PARAM_INT);
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        $chunk = $result['chunk'] ?? "";
        $currentChunkSize = mb_strlen($chunk, '8bit'); // Karakter sayısını güvenli alalım
        $totalLength = (int)$result['total_length'];

        echo json_encode([
            "success" => true,
            "chunk" => $chunk,
            "totalLength" => $totalLength,
            "hasMore" => ($offset + $limit) < $totalLength
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Bot bulunamadı"]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}