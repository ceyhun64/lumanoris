<?php

function ensureParamMarketplaceTables(PDO $conn): void
{
    $files = [
        __DIR__ . '/../database/create_param_marketplace_payments.sql',
        __DIR__ . '/../database/alter_param_marketplace_sellers.sql',
        __DIR__ . '/../database/alter_banka_bilgileri.sql',
    ];
    foreach ($files as $path) {
        if (!file_exists($path)) {
            if (basename($path) === 'create_param_marketplace_payments.sql') {
                throw new Exception('Param ödeme tablo şeması okunamadı: ' . basename($path));
            }
            continue;
        }
        $sql = file_get_contents($path);
        if ($sql === false || trim($sql) === '') {
            continue;
        }
        $conn->exec($sql);
    }
}

function parseExpiry(string $expiry): array
{
    if (!preg_match('/^(\d{2})\/(\d{2})$/', $expiry, $matches)) {
        throw new Exception('Kart son kullanma tarihi AA/YY formatında olmalıdır.');
    }

    $month = (int)$matches[1];
    if ($month < 1 || $month > 12) {
        throw new Exception('Kart son kullanma ayı geçersiz.');
    }

    return [str_pad((string)$month, 2, '0', STR_PAD_LEFT), $matches[2]];
}

function getUserName(Database $database, int $userId): string
{
    $user = $database->selectSingle('ad_soyad, kullanici_adi FROM kullanicilar WHERE id = ?', [$userId]);
    return trim((string)($user['ad_soyad'] ?? '')) ?: ((string)($user['kullanici_adi'] ?? 'Lumanoris User'));
}

function getDefaultSubMerchantGuid(): string
{
    $value = $_ENV['PARAM_DEFAULT_SUBMERCHANT_GUID'] ?? $_SERVER['PARAM_DEFAULT_SUBMERCHANT_GUID'] ?? getenv('PARAM_DEFAULT_SUBMERCHANT_GUID');
    return ($value === false || $value === null) ? '' : (string)$value;
}

function finalizeSubscriptionPayment(Database $database, PDO $conn, string $orderId, string $receiptId, string $islemId, float $netAmount, array $callback): void
{
    if ($conn->inTransaction()) {
        $conn->commit();
    }

    $conn->beginTransaction();

    try {
        $stmt = $conn->prepare('SELECT * FROM `param_marketplace_payments` WHERE `order_id` = ? FOR UPDATE');
        $stmt->execute([$orderId]);
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$payment) {
            throw new Exception('Ödeme kaydı bulunamadı.');
        }

        if ($payment['status'] === 'paid') {
            $conn->commit();
            return;
        }

        // 3D callback bazen TURKPOS_RETVAL_Islem_ID göndermiyor; ödeme başlatılırken
        // kaydedilen SanalPOS Islem_ID'sine geri düş. Pazaryeri detayı için zorunlu.
        $islemId = trim($islemId);
        if ($islemId === '') {
            $startRaw = json_decode((string)($payment['param_response_json'] ?? ''), true);
            $islemId = trim((string)($startRaw['Islem_ID'] ?? ''));
        }
        if ($islemId === '') {
            $islemId = trim((string)($payment['param_transaction_id'] ?? ''));
        }
        if ($islemId === '') {
            throw new Exception('SanalPOS işlem ID bulunamadı; pazaryeri sipariş detayı oluşturulamaz.');
        }

        $items = json_decode($payment['items_json'], true) ?: [];
        $sellerSplits = json_decode($payment['seller_splits_json'], true) ?: [];
        $productAmount = max(0.01, (float)$payment['product_amount']);
        $availableSellerNet = min($productAmount, $netAmount);
        $param = new ParamPosMarketplace();
        $param->setOrderContext($orderId);

        foreach ($items as $item) {
            $weeks = (int)$item['duration_weeks'];
            $database->insert('user_subscriptions', [
                'user_id' => (int)$payment['user_id'],
                'chatbot_id' => (int)$item['chatbot_id'],
                'duration_weeks' => $weeks,
                'expiry_date' => date('Y-m-d H:i:s', strtotime("+$weeks weeks")),
                'status' => 1,
            ]);
        }

        $database->delete('user_cart', 'user_id = ?', [(int)$payment['user_id']]);

        $createdDetails = [];
        try {
            foreach ($sellerSplits as $split) {
                $gross = round((float)$split['gross_amount'], 2);
                $payable = round($gross * ($availableSellerNet / $productAmount), 2);
                $detail = $param->addMarketplaceOrderDetail($split['guid_altuyeisyeri'], $gross, $payable, $islemId);

                if (!$detail['success']) {
                    throw new Exception('Pazaryeri detay ekleme başarısız: ' . $detail['message']);
                }

                $pysiparisGuid = $detail['marketplace_order_guid'];
                $createdDetails[] = $pysiparisGuid;

                $database->insert('param_marketplace_details', [
                    'payment_id' => (int)$payment['id'],
                    'seller_user_id' => (int)$split['seller_user_id'],
                    'guid_altuyeisyeri' => $split['guid_altuyeisyeri'],
                    'gross_amount' => $gross,
                    'payable_amount' => $payable,
                    'pysiparis_guid' => $pysiparisGuid,
                    'status' => 'pending_approval',
                    'param_response_json' => json_encode($detail['raw'], JSON_UNESCAPED_UNICODE),
                ]);
            }

            foreach ($createdDetails as $pysiparisGuid) {
                $approval = $param->approveMarketplaceOrder($pysiparisGuid);
                if (!$approval['success']) {
                    throw new Exception('Sipariş onayı başarısız: ' . $approval['message']);
                }
                $database->update('param_marketplace_details', ['status' => 'approved'], 'pysiparis_guid = ?', [$pysiparisGuid]);
            }
        } catch (Throwable $detailError) {
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }
            compensateMarketplaceDetails($database, $param, $createdDetails, $orderId, $detailError->getMessage());
            throw $detailError;
        }

        $database->update('param_marketplace_payments', [
            'status' => 'paid',
            'param_receipt_id' => $receiptId,
            'param_net_amount' => $netAmount,
            'callback_json' => json_encode($callback, JSON_UNESCAPED_UNICODE),
        ], 'order_id = ?', [$orderId]);

        $conn->commit();
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        throw $e;
    }
}

function compensateMarketplaceDetails(Database $database, ParamPosMarketplace $param, array $pysiparisGuids, string $orderId, string $reason): void
{
    foreach ($pysiparisGuids as $pysiparisGuid) {
        try {
            $cancel = $param->cancelOrRefund($pysiparisGuid);
            $status = $cancel['success'] ? 'cancelled' : 'cancel_failed';
            $database->update('param_marketplace_details', ['status' => $status], 'pysiparis_guid = ?', [$pysiparisGuid]);

            if (!$cancel['success']) {
                createMarketplaceAlert($database, 'compensation_failed', 'critical', $orderId, null, null,
                    "Detay iptal başarısız: $pysiparisGuid - " . ($cancel['message'] ?? ''),
                    ['pysiparis_guid' => $pysiparisGuid, 'trigger_reason' => $reason, 'cancel_raw' => $cancel['raw'] ?? null]
                );
            }
        } catch (Throwable $e) {
            createMarketplaceAlert($database, 'compensation_exception', 'critical', $orderId, null, null,
                "Detay iptal istisnası: $pysiparisGuid - " . $e->getMessage(),
                ['pysiparis_guid' => $pysiparisGuid, 'trigger_reason' => $reason]
            );
        }
    }
}

function createMarketplaceAlert(Database $database, string $type, string $severity, ?string $orderId, ?int $userId, ?int $sellerUserId, string $message, array $context = []): void
{
    try {
        $database->insert('param_marketplace_alerts', [
            'alert_type' => $type,
            'severity' => $severity,
            'order_id' => $orderId,
            'user_id' => $userId,
            'seller_user_id' => $sellerUserId,
            'message' => $message,
            'context_json' => json_encode($context, JSON_UNESCAPED_UNICODE),
        ]);
    } catch (Throwable $e) {
        error_log('[ALERT] insert failed: ' . $e->getMessage() . ' | original: ' . $message);
    }
}

?>
