<?php
set_time_limit(120);

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode([
            'success' => false,
            'message' => 'Sunucu hatası oluştu. Lütfen tekrar deneyin.',
        ], JSON_UNESCAPED_UNICODE);
    }
});

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Geçersiz istek yöntemi."], JSON_UNESCAPED_UNICODE);
    exit;
}

require '../functions/db.php';
require '../functions/ParamPosMarketplace.php';
require '../functions/checkout_payments.php';

$database = Database::getInstance();
$conn = $database->getConnection();
$data = json_decode($_POST['data'] ?? '', true);
error_log('[PAY] Raw POST data key present: ' . (isset($_POST['data']) ? 'yes' : 'no'));
error_log('[PAY] JSON parse result: ' . ($data ? 'OK' : 'FAILED - raw: ' . substr($_POST['data'] ?? '', 0, 200)));

if (!$data || !isset($data['user_id'], $data['items']) || !is_array($data['items'])) {
    echo json_encode(["success" => false, "message" => "Eksik veya hatalı veri formatı!"], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    ensureParamMarketplaceTables($conn);

    $userId = (int)$data['user_id'];
    $requestedItems = $data['items'];
    $card = $data['card'] ?? [];

    $cardNumber = preg_replace('/\D+/', '', (string)($card['number'] ?? ''));
    $cardHolder = trim((string)($card['holder_name'] ?? ''));
    $expiry = trim((string)($card['expiry'] ?? ''));
    $cvv = preg_replace('/\D+/', '', (string)($card['cvv'] ?? ''));
    $use3d = !empty($data['use_3d']);

    error_log('[PAY] Raw card object: ' . json_encode($card, JSON_UNESCAPED_UNICODE));
    error_log('[PAY] Card fields - number_len:' . strlen($cardNumber) . ' expiry:' . $expiry . ' cvv_len:' . strlen($cvv) . ' holder:' . ($cardHolder !== '' ? 'set' : 'empty'));
    error_log('[PAY] Validation: cardNumber=' . (empty($cardNumber) ? 'EMPTY' : 'OK') . ' expiry=' . (empty($expiry) ? 'EMPTY' : 'OK') . ' cvv=' . (empty($cvv) ? 'EMPTY' : 'OK'));

    if ($cardNumber === '' || $expiry === '' || $cvv === '') {
        throw new Exception("Kart bilgileri Param ödeme başlatmak için zorunludur.");
    }

    [$expiryMonth, $expiryYear2] = parseExpiry($expiry);
    error_log('[PAY] Parsed expiry - month:' . $expiryMonth . ' year:' . $expiryYear2);
    $cardHolder = $cardHolder !== '' ? $cardHolder : getUserName($database, $userId);

    $itemMap = [];
    foreach ($requestedItems as $item) {
        $chatbotId = (int)($item['chatbot_id'] ?? 0);
        $weeks = max(1, min(4, (int)($item['duration_weeks'] ?? 1)));
        if ($chatbotId > 0) {
            $itemMap[$chatbotId] = $weeks;
        }
    }

    if (empty($itemMap)) {
        throw new Exception("Sepette ödeme yapılacak ürün bulunamadı.");
    }

    $placeholders = implode(',', array_fill(0, count($itemMap), '?'));
    $params = array_merge([$userId], array_keys($itemMap));

    // Pre-flight: hangi botların satıcısı aktif değil?
    $missingSellers = $database->selectMulti(
        "c.id, c.isim FROM user_cart uc
         JOIN chatbotlar c ON c.id = uc.chatbot_id
         LEFT JOIN param_marketplace_sellers pms
            ON pms.user_id = c.author_user_id AND pms.status = 'active'
         WHERE uc.user_id = ? AND uc.chatbot_id IN ($placeholders) AND pms.id IS NULL",
        $params
    );
    if (!empty($missingSellers)) {
        $names = array_map(static function ($r) { return $r['isim']; }, $missingSellers);
        throw new Exception('Bu chatbotların satıcı kaydı tamamlanmamış, ödeme başlatılamaz: ' . implode(', ', $names));
    }

    $cartRows = $database->selectMulti(
        "uc.chatbot_id, c.isim, c.ucret_haftalik, c.ucret_aylik, c.author_user_id,
         pms.guid_altuyeisyeri AS guid_altuyeisyeri
         FROM user_cart uc
         JOIN chatbotlar c ON c.id = uc.chatbot_id
         INNER JOIN param_marketplace_sellers pms
            ON pms.user_id = c.author_user_id AND pms.status = 'active'
         WHERE uc.user_id = ? AND uc.chatbot_id IN ($placeholders)",
        $params
    );

    if (count($cartRows) !== count($itemMap)) {
        throw new Exception("Sepet güncel değil. Lütfen sayfayı yenileyip tekrar deneyin.");
    }

    $items = [];
    $sellerSplits = [];
    $productTotal = 0.0;

    foreach ($cartRows as $row) {
        $chatbotId = (int)$row['chatbot_id'];
        $weeks = $itemMap[$chatbotId];
        $weekly = (float)$row['ucret_haftalik'];
        $monthly = (float)($row['ucret_aylik'] ?: ($weekly * 4));
        $lineTotal = $weeks === 4 ? (0.95 * $monthly) : ($weekly * $weeks);
        $lineTotal = round($lineTotal, 2);
        $sellerId = (int)$row['author_user_id'];
        $subMerchantGuid = trim((string)$row['guid_altuyeisyeri']);

        if ($subMerchantGuid === '') {
            createMarketplaceAlert(
                $database,
                'missing_submerchant',
                'warning',
                null,
                $userId,
                $sellerId,
                'Satıcının Param alt üye işyeri kaydı yok. Onboarding gerekiyor: ' . $row['isim'],
                ['chatbot_id' => $chatbotId, 'chatbot_isim' => $row['isim']]
            );
            throw new Exception($row['isim'] . " satıcısı için Param alt üye işyeri kaydı bulunamadı. Satıcının onboarding işlemi tamamlanmalı.");
        }

        $productTotal += $lineTotal;
        if (!isset($sellerSplits[$sellerId])) {
            $sellerSplits[$sellerId] = [
                'seller_user_id' => $sellerId,
                'guid_altuyeisyeri' => $subMerchantGuid,
                'gross_amount' => 0.0,
                'payable_amount' => 0.0,
            ];
        }
        $sellerSplits[$sellerId]['gross_amount'] += $lineTotal;
        $sellerSplits[$sellerId]['payable_amount'] += $lineTotal;

        $items[] = [
            'chatbot_id' => $chatbotId,
            'duration_weeks' => $weeks,
            'title' => $row['isim'],
            'amount' => $lineTotal,
            'seller_user_id' => $sellerId,
        ];
    }

    $serviceFee = count($items) > 0 ? 5.0 : 0.0;
    $total = round($productTotal + $serviceFee, 2);
    $orderId = 'LUM' . date('YmdHis') . random_int(1000, 9999);

    $conn->beginTransaction();
    $database->insert('param_marketplace_payments', [
        'order_id' => $orderId,
        'user_id' => $userId,
        'status' => 'pending',
        'amount' => $total,
        'product_amount' => round($productTotal, 2),
        'service_fee' => $serviceFee,
        'items_json' => json_encode($items, JSON_UNESCAPED_UNICODE),
        'seller_splits_json' => json_encode(array_values($sellerSplits), JSON_UNESCAPED_UNICODE),
    ]);
    $conn->commit();

    $param = new ParamPosMarketplace();
    $paymentResult = $param->startPayment([
        'order_id' => $orderId,
        'amount' => $total,
        'card_holder' => $cardHolder,
        'card_number' => $cardNumber,
        'expiry_month' => $expiryMonth,
        'expiry_year_2' => $expiryYear2,
        'cvv' => $cvv,
        'phone' => preg_replace('/\D+/', '', (string)($card['phone'] ?? '')),
        'description' => 'Lumanoris chatbot aboneligi',
        'installment' => 1,
        'use_3d' => $use3d,
    ]);

    $database->update('param_marketplace_payments', [
        'status' => $paymentResult['success'] ? 'payment_started' : 'failed',
        'param_transaction_id' => $paymentResult['transaction_id'],
        'redirect_url' => $paymentResult['redirect_url'],
        'param_response_json' => json_encode($paymentResult['raw'], JSON_UNESCAPED_UNICODE),
    ], 'order_id = ?', [$orderId]);

    error_log('[PAY] ParamPOS result - success:' . ($paymentResult['success'] ? 'yes' : 'no') . ' message:' . $paymentResult['message'] . ' redirect:' . $paymentResult['redirect_url']);

    if (!$paymentResult['success']) {
        echo json_encode(["success" => false, "message" => $paymentResult['message']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (strtoupper($paymentResult['redirect_url']) === 'NONSECURE') {
        finalizeSubscriptionPayment($database, $conn, $orderId, $paymentResult['transaction_id'], $paymentResult['transaction_id'], $total, []);
        echo json_encode([
            "success" => true,
            "message" => count($items) . " adet abonelik başarıyla oluşturuldu.",
            "details" => ["user_id" => $userId, "subscription_count" => count($items), "order_id" => $orderId],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        "success" => true,
        "requires_redirect" => true,
        "redirect_url" => $paymentResult['redirect_url'],
        "message" => "3D Secure doğrulaması için yönlendiriliyorsunuz.",
        "details" => ["order_id" => $orderId],
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log('[PAY] Exception: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Satın alma işlemi başarısız oldu: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

?>
