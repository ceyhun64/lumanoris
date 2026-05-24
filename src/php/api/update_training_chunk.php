<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $data = json_decode($_POST['data'], true) ?? null;

    if (!$data || !isset($data['id']) || !isset($data['textChunk'])) {
        echo json_encode(["success" => false, "message" => "Eksik veri!"]);
        exit;
    }

    try {
        $id = (int)$data['id'];
        $chunk = $data['textChunk'];
        $isFirst = $data['isFirst'] ?? false;

        if ($isFirst) {
            // İlk paketse mevcut veriyi temizle ve yenisini yaz
            $stmt = $conn->prepare("UPDATE chatbotlar SET training_prompt = :chunk WHERE id = :id");
        } else {
            // İlk paket değilse mevcut verinin SONUNA ekle (CONCAT)
            // IFNULL kullanarak eğer alan boşsa hata almasını engelliyoruz
            $stmt = $conn->prepare("UPDATE chatbotlar SET training_prompt = CONCAT(IFNULL(training_prompt, ''), :chunk) WHERE id = :id");
        }

        $stmt->bindParam(':chunk', $chunk);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Parça başarıyla eklendi."]);
        } else {
            echo json_encode(["success" => false, "message" => "SQL hatası oluştu."]);
        }

    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}
?>