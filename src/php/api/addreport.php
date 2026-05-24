<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // Frontend'den gelen JSON string'i çözüyoruz
    $data = json_decode($_POST['data'], true) ?? null;
    
    if (!$data) {
        echo json_encode(["success" => false, "message" => "Veri bulunamadı!"]);
        exit;
    }

    try {
        // Beklenen alanlar: user_id, chatbot, reported_for (array)
        $userId = $data['user_id'] ?? null;
        $chatbot = $data['chatbot_id'] ?? null;
        $reportedFor = $data['reported_for'] ?? [];
        $reportDetail = $data['report_detail'] ?? null;

        if (!$userId || !$chatbot || empty($reportedFor)) {
            echo json_encode(["success" => false, "message" => "Eksik parametreler!"]);
            exit;
        }

        // SET tipine uygun hale getirmek için array → string
        // Örn: ['spam','rahatsiz'] → "spam,rahatsiz"
        $reportedForStr = implode(',', $reportedFor);

        // DB’ye insert için hazırlıyoruz
        $insertData = [
            'user_id' => $userId,
            'chatbot_id' => $chatbot,
            'reported_for' => $reportedForStr,
            'report_detail' => $reportDetail
        ];

        $insertedId = $database->insert('chatbot_reports', $insertData);

        echo json_encode([
            "success" => true,
            "message" => "Bildirim kaydedildi",
            "id" => $insertedId
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Hata: " . $e->getMessage()
        ]);
    }
}
?>