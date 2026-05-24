<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();

    // POST verisini al (JSON formatında)
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception("Geçersiz istek verisi.");
    }

    $userId = (int)$input['userId'];
    $iban = trim($input['iban']);
    $amount = (float)$input['amount'];

    // 1. Temel Doğrulamalar
    if ($userId <= 0 || empty($iban) || $amount <= 0) {
        throw new Exception("Lütfen tüm alanları doğru şekilde doldurun.");
    }

    // 2. Veri Hazırlığı
    // Database::insert metodunun beklediği dizi yapısı
    $data = [
        'user_id' => $userId,
        'iban'    => $iban,
        'miktar'  => $amount,
        'durum'   => 'beklemede'
    ];

    // 3. Kayıt İşlemi
    // insert metodun tablo ismini, veriyi ve duplicate kontrolünü alıyor.
    $lastId = $database->insert('para_cekme_talepleri', $data);

    if ($lastId) {
        echo json_encode([
            "success" => true,
            "message" => "Talebiniz #$lastId numarası ile kaydedildi.",
            "id" => $lastId
        ]);
    } else {
        throw new Exception("İşlem gerçekleştirilemedi.");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}