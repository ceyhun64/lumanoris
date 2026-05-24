<?php
header('Content-Type: application/json');
require '../functions/db.php'; 

try {
    $database = Database::getInstance();
    
    // Tüm planları çekme (SQL SELECT eklendi)
    $allPlans = $database->selectMulti("
            p.id,
            p.name_tr,
            p.monthly_price,
            p.yearly_price,
            p.description_tr
        FROM plans p
    ");

    $plansOutput = [];

    foreach ($allPlans as $planRow) {
        $planId = $planRow['id'];
        $planName = $planRow['name_tr'];
        $description = $planRow['description_tr'];

        $rawFeatures = $database->selectMulti("
            feature_tr 
            FROM plan_icerikler 
            WHERE plan_id = ?
        ", [$planId]);
        
        $features = array_column($rawFeatures, 'feature_tr'); 

        // Fiyatları yapılandırma
        $monthlyPriceText = ($planRow['monthly_price'] !== null) 
            ? ((float)$planRow['monthly_price'] == 0 ? '₺0' : '₺' . number_format((float)$planRow['monthly_price'], 2, ',', '.')) 
            : null;
        
        $yearlyPriceText = ($planRow['yearly_price'] !== null) 
            ? '₺' . number_format((float)$planRow['yearly_price'], 2, ',', '.') 
            : null;

        // React'teki başlangıç verisine göre dinamik metinleri ayarla
        $buttonText = 'Choose this plan';
        $buttonType = 'default';
        $badge = null;

        // **ÖNEMLİ: Bu eşleştirmeler React'teki başlangıç verilerine sıkı sıkıya bağlıdır.**
        if ($planName === "Standart") {
            $buttonType = 'primary';
            $badge = 'Popular';
        } elseif ($planName === "Profesyonel" && $yearlyPriceText === null) { // Sadece aylık fiyatı varsa (muhtemelen özel plan)
            $buttonText = 'Schedule a call';
            $monthlyPriceText = 'Özel Plan';
        }
        
        if ($planName === "Silver Plan" && $yearlyPriceText !== null && $monthlyPriceText === null) {
            $buttonType = 'primary';
            $badge = 'Önerilen';
        } elseif ($planName === "Gold Plan" && $yearlyPriceText !== null && $monthlyPriceText === null) {
            $buttonText = 'Contact sales';
        }
        
        // Tüm planları tek bir dizide gönder
        $plansOutput[] = [
            'title' => $planName,
            'monthly_price' => $monthlyPriceText,
            'yearly_price' => $yearlyPriceText,
            'description' => $description,
            'features' => $features,
            'buttonText' => $buttonText,
            'buttonType' => $buttonType,
            'badge' => $badge
        ];
    }
    
    echo json_encode([
        "success" => true,
        "all_plans" => $plansOutput // Tek bir liste gönderiyoruz
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>