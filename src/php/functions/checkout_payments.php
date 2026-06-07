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

function lockMarketplacePayment(PDO $conn, string $orderId): array
{
    $stmt = $conn->prepare('SELECT * FROM `param_marketplace_payments` WHERE `order_id` = ? FOR UPDATE');
    $stmt->execute([$orderId]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$payment) {
        throw new Exception('Ödeme kaydı bulunamadı.');
    }
    return $payment;
}

function resolveSanalPosIslemId(array $payment, string $islemId): string
{
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
    return $islemId;
}

// İdempotent finalize. Param Detay_Ekle/Onay dış SOAP çağrısı — DB rollback geri alamaz.
// Bu yüzden 3 ayrı commit aşaması; her aşama retry/çift-callback altında güvenli tekrar edilebilir:
//   1) Detaylar: oluştur-VEYA-yeniden-kullan, kalıcı commit → retry asla ikinci Detay_Ekle yapmaz (çift ödeme yok).
//   2) Onay:    Durum=1, idempotent ("zaten güncellen" = başarı say).
//   3) Abonelik + status=paid: tek atomik commit → tam-bir-kez (status guard + FOR UPDATE).
function finalizeSubscriptionPayment(Database $database, PDO $conn, string $orderId, string $receiptId, string $islemId, float $netAmount, array $callback): void
{
    if ($conn->inTransaction()) {
        $conn->commit();
    }

    $param = new ParamPosMarketplace();
    $param->setOrderContext($orderId);

    // ---- Aşama 1: pazaryeri detayları (oluştur-veya-yeniden-kullan), kalıcı commit ----
    $conn->beginTransaction();
    try {
        $payment = lockMarketplacePayment($conn, $orderId);
        if ($payment['status'] === 'paid') {
            $conn->commit();
            return;
        }

        $islemId = resolveSanalPosIslemId($payment, $islemId);
        $sellerSplits = json_decode($payment['seller_splits_json'], true) ?: [];
        $productAmount = max(0.01, (float)$payment['product_amount']);
        $availableSellerNet = min($productAmount, $netAmount);

        // Önceki denemeden kalıcı kaydedilmiş detaylar (seller_user_id|guid → satır).
        $existingDetails = $database->selectMulti(
            'seller_user_id, guid_altuyeisyeri, pysiparis_guid FROM param_marketplace_details WHERE payment_id = ?',
            [(int)$payment['id']]
        );
        $reuseBySeller = [];
        foreach ($existingDetails as $row) {
            if (!empty($row['pysiparis_guid'])) {
                $reuseBySeller[(int)$row['seller_user_id'] . '|' . $row['guid_altuyeisyeri']] = true;
            }
        }

        $newlyCreated = [];
        try {
            foreach ($sellerSplits as $split) {
                $sellerKey = (int)$split['seller_user_id'] . '|' . $split['guid_altuyeisyeri'];
                if (isset($reuseBySeller[$sellerKey])) {
                    // Bu satıcı için detay zaten Param'da var; ikinci Detay_Ekle = çift ödeme. Atla.
                    continue;
                }

                $gross = round((float)$split['gross_amount'], 2);
                $payable = round($gross * ($availableSellerNet / $productAmount), 2);
                $detail = $param->addMarketplaceOrderDetail($split['guid_altuyeisyeri'], $gross, $payable, $islemId);

                if (!$detail['success']) {
                    throw new Exception('Pazaryeri detay ekleme başarısız: ' . $detail['message']);
                }

                $pysiparisGuid = $detail['marketplace_order_guid'];
                $newlyCreated[] = $pysiparisGuid;

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
        } catch (Throwable $detailError) {
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }
            // Sadece bu turda yeni oluşturulanlar yetim kaldı (commit edilmedi); Param'da iptal et.
            compensateMarketplaceDetails($database, $param, $newlyCreated, $orderId, $detailError->getMessage());
            throw $detailError;
        }

        $conn->commit();
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        throw $e;
    }

    // ---- Aşama 2: tüm detayları onayla (Durum=1, idempotent) ----
    $conn->beginTransaction();
    try {
        $payment = lockMarketplacePayment($conn, $orderId);
        if ($payment['status'] === 'paid') {
            $conn->commit();
            return;
        }

        $details = $database->selectMulti(
            'pysiparis_guid, status FROM param_marketplace_details WHERE payment_id = ? AND pysiparis_guid IS NOT NULL AND pysiparis_guid <> \'\'',
            [(int)$payment['id']]
        );

        foreach ($details as $detail) {
            if ($detail['status'] === 'approved') {
                continue;
            }
            $approval = $param->approveMarketplaceOrder($detail['pysiparis_guid']);
            // Sipariş zaten onaylıysa Param "Onay durumu zaten güncellenmiştir" döner;
            // hedef durum sağlandığı için başarı say (retry / çift callback idempotency).
            $alreadyApproved = mb_stripos((string)$approval['message'], 'zaten güncellen') !== false;
            if (!$approval['success'] && !$alreadyApproved) {
                throw new Exception('Sipariş onayı başarısız: ' . $approval['message']);
            }
            $database->update('param_marketplace_details', ['status' => 'approved'], 'pysiparis_guid = ?', [$detail['pysiparis_guid']]);
        }

        $conn->commit();
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        // Detaylar kalıcı; iptal etme. Retry mevcut detayları yeniden kullanıp idempotent onaylar.
        throw $e;
    }

    // ---- Aşama 3: abonelikleri oluştur + status=paid (atomik, tam-bir-kez) ----
    $conn->beginTransaction();
    try {
        $payment = lockMarketplacePayment($conn, $orderId);
        if ($payment['status'] === 'paid') {
            $conn->commit();
            return;
        }

        $items = json_decode($payment['items_json'], true) ?: [];
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
            $cancel = $param->cancelOrRefund($pysiparisGuid, $orderId, 'IPTAL');
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
