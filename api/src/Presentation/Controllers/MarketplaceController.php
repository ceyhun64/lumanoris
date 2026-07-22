<?php
class MarketplaceController {
    public static function addToCart(): void {
        require_method('POST');
        $userId     = AuthMiddleware::requireAuth();
        $data       = json_decode($_POST['data'] ?? '', true) ?? null;
        $chatbotId  = InputSanitizer::positiveInt($data['chatbot_id'] ?? 0);
        $orderWeeks = InputSanitizer::positiveInt($data['order_weeks'] ?? 0) ?: null;

        if (!$data || !$chatbotId) {
            JsonResponse::error('Eksik parametreler!', 400, AppConfig::ERR_VALIDATION);
        }

        $db          = Database::getInstance();
        $sellerCheck = $db->selectSingle(
            "pms.status FROM param_marketplace_sellers pms
             JOIN chatbotlar c ON c.author_user_id = pms.user_id
             WHERE c.id = ? AND c.is_independent = 0",
            [$chatbotId]
        );
        if (!$sellerCheck || ($sellerCheck['status'] ?? '') !== 'active') {
            JsonResponse::error('Bu chatbot şu anda satışa kapalı. Satıcısı henüz pazaryeri kaydını tamamlamamış.', 422, AppConfig::ERR_SELLER_INACTIVE);
        }

        try {
            $id = $db->insert('user_cart', ['user_id' => $userId, 'chatbot_id' => $chatbotId, 'order_weeks' => $orderWeeks]);
            JsonResponse::success(['message' => 'Ürün sepete eklendi', 'id' => $id]);
        } catch (Exception $e) {
            $msg = str_contains($e->getMessage(), 'Duplicate entry')
                ? 'Bu chatbot zaten sepetinizde bulunuyor.'
                : 'Hata: ' . $e->getMessage();
            JsonResponse::error($msg, 409, AppConfig::ERR_DUPLICATE);
        }
    }

    public static function getCart(): void {
        $userId = AuthMiddleware::requireAuth();

        $results = Database::getInstance()->selectMulti(
            "uc.id, uc.chatbot_id, c.isim as title, c.profil_fotografi as image,
             c.ucret_haftalik as price, c.ucret_aylik as monthlyPrice,
             uc.order_weeks, ck.kategori_adi_tr as category
             FROM user_cart uc
             JOIN chatbotlar c ON uc.chatbot_id = c.id
             LEFT JOIN chatbot_kategoriler ck ON c.kategori_id = ck.id
             WHERE uc.user_id = ?",
            [$userId]
        );
        JsonResponse::success(['cart' => $results]);
    }

    public static function getCartCount(): void {
        $userId = AuthMiddleware::requireAuth();

        $row = Database::getInstance()->selectSingle('COUNT(*) AS total FROM user_cart WHERE user_id = ?', [$userId]);
        JsonResponse::success(['count' => (int) ($row['total'] ?? 0)]);
    }

    public static function deleteCart(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? [];
        $id     = InputSanitizer::positiveInt($data['id'] ?? $_POST['id'] ?? 0);
        if (!$id) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        // Previously had no ownership check — anyone could remove items from
        // any user's cart by guessing the cart row id.
        Database::getInstance()->delete('user_cart', 'id = ? AND user_id = ?', [$id, $userId]);
        JsonResponse::success(['message' => 'Sepetten kaldırıldı.']);
    }

    public static function updateCart(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['id'])) JsonResponse::error('Veri veya ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $id = InputSanitizer::positiveInt($data['id']);
        unset($data['id'], $data['user_id']);

        // Previously had no ownership check — anyone could edit any cart row by id.
        Database::getInstance()->update('user_cart', $data, 'id = ? AND user_id = ?', [$id, $userId]);
        JsonResponse::success(['message' => 'Sepet güncellendi.', 'id' => $id]);
    }

    /**
     * No frontend caller exists (the real purchase flow is createSubscription,
     * which grants time-limited access — it never transfers ownership). This
     * method used to reassign chatbotlar.owner_user_id to whoever called it
     * for any chatbot_ids, with no payment, cart, or for-sale check at all —
     * a live, session-authenticated "steal any bot for free" endpoint. There
     * being no legitimate ownership-transfer flow to preserve, the endpoint
     * is disabled outright rather than patched.
     */
    public static function buyChatbot(): void {
        JsonResponse::error('Bu işlem artık desteklenmiyor.', 410, AppConfig::ERR_VALIDATION);
    }

    public static function createSubscription(): void {
        require_method('POST');
        require_once __DIR__ . '/../../../functions/coin_engine.php';
        require_once __DIR__ . '/../../../functions/checkout_payments.php';
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || empty($data['items']) || !is_array($data['items'])) {
            JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }

        $db   = Database::getInstance();
        $conn = $db->getConnection();

        $subscriptionIds = [];
        $detailRows      = [];
        $totalAmount     = 0.0;

        // Anchor expiry math to the DB server's clock, not PHP's — the app
        // server and DB server can run in different timezones (seen locally:
        // PHP=UTC, MySQL=UTC+3), and computing "+N days" from PHP's time()
        // then later comparing against MySQL's NOW() would skew every expiry.
        $mysqlNowRow = $db->selectSingle('NOW() AS now_time');
        $mysqlNow    = strtotime($mysqlNowRow['now_time']);

        // The loop below does several inserts/deletes per cart item with no
        // transaction — a failure partway through (e.g. item 3 of 5) used to
        // leave prior items fully purchased/removed from cart while later
        // ones silently never happened, with no way to retry cleanly.
        $conn->beginTransaction();
        try {
        foreach ($data['items'] as $item) {
            $chatbotId     = InputSanitizer::positiveInt($item['chatbot_id'] ?? 0);
            $durationWeeks = InputSanitizer::positiveInt($item['duration_weeks'] ?? 0) ?: 4;
            if (!$chatbotId) continue;

            $bot = $db->selectSingle(
                'author_user_id, ucret_haftalik, ucret_aylik FROM chatbotlar WHERE id = ?',
                [$chatbotId]
            );
            if (!$bot) continue;

            $isMonthly = $durationWeeks >= 4;
            $price     = $isMonthly
                ? ((float) $bot['ucret_aylik'] * AppConfig::DISCOUNT_MONTHLY_FACTOR)
                : ((float) $bot['ucret_haftalik'] * $durationWeeks);
            $price = InputSanitizer::price($price);

            $days       = $isMonthly ? AppConfig::SUBSCRIPTION_MONTHLY : $durationWeeks * AppConfig::SUBSCRIPTION_WEEKLY;
            $expiryDate = date('Y-m-d H:i:s', $mysqlNow + $days * 86400);

            $subscriptionIds[] = $db->insert('user_subscriptions', [
                'user_id'        => $userId,
                'chatbot_id'     => $chatbotId,
                'duration_weeks' => $durationWeeks,
                'expiry_date'    => $expiryDate,
                'status'         => 1,
            ]);

            $commissionRate = $isMonthly ? AppConfig::SELLER_COMMISSION_MONTHLY : AppConfig::SELLER_COMMISSION_WEEKLY;
            $detailRows[] = [
                'seller_user_id' => (int) $bot['author_user_id'],
                'chatbot_id'     => $chatbotId,
                'payable_amount' => InputSanitizer::price($price * $commissionRate),
            ];
            $totalAmount += $price;

            // Bonus message credits for this bot, advertised in the buy popup
            // (BuyModal.jsx) but previously never actually granted.
            grantPurchaseCredit($db, $userId, $chatbotId, $price, $expiryDate);

            $db->delete('user_cart', 'chatbot_id = ? AND user_id = ?', [$chatbotId, $userId]);
        }

        if (empty($subscriptionIds)) {
            $conn->rollBack();
            JsonResponse::error('Geçerli ürün bulunamadı.', 400, AppConfig::ERR_VALIDATION);
        }

        // Root-cause fix: this used to never look at $data['card'] at all —
        // any chatbot_id/duration_weeks pair succeeded with no card data
        // whatsoever. Card is validated (and, in production, actually
        // charged) only now that the real amount is known — a failure here
        // rolls back every subscription/credit/cart-delete above, so no
        // access is ever granted without a valid card.
        $card         = is_array($data['card'] ?? null) ? $data['card'] : [];
        $chargeResult = chargeCard($card, $totalAmount);
        if (!$chargeResult['success']) {
            $conn->rollBack();
            JsonResponse::error($chargeResult['message'] ?? 'Ödeme başarısız.', 402, AppConfig::ERR_PAYMENT);
        }

        // Real param_marketplace_payments columns are user_id/amount, not
        // buyer_user_id/total_amount (confirmed via live DESCRIBE) — the
        // original names here were guessed without DB access and never worked.
        $orderId   = 'ORD-' . strtoupper(InputSanitizer::randomToken(4));
        $paymentId = $db->insert('param_marketplace_payments', [
            'order_id' => $orderId,
            'user_id'  => $userId,
            'amount'   => InputSanitizer::price($totalAmount),
            'status'   => 'paid',
        ]);

        // param_marketplace_details has no chatbot_id column in its original
        // (ParamPos-gateway-oriented) schema, but getMyPayments needs one to
        // show which bot each line item was for — add it additively (nullable,
        // doesn't touch existing rows/columns) rather than working around it
        // with a JSON blob. MySQL 8's `ADD COLUMN IF NOT EXISTS` rejects this
        // form, so check information_schema first to stay idempotent.
        $columnCheck = $db->selectSingle(
            "COUNT(*) AS cnt FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'param_marketplace_details' AND column_name = 'chatbot_id'"
        );
        if ((int) ($columnCheck['cnt'] ?? 0) === 0) {
            $conn->exec('ALTER TABLE param_marketplace_details ADD COLUMN chatbot_id INT NULL AFTER seller_user_id');
        }

        foreach ($detailRows as $row) {
            $db->insert('param_marketplace_details', [
                'payment_id'        => $paymentId,
                'seller_user_id'    => $row['seller_user_id'],
                'chatbot_id'        => $row['chatbot_id'],
                'guid_altuyeisyeri' => '', // no real ParamPos sub-merchant guid outside prod
                'gross_amount'      => $row['payable_amount'],
                'payable_amount'    => $row['payable_amount'],
                'status'            => 'approved',
            ]);
        }

        $conn->commit();
        } catch (Exception $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            throw $e;
        }

        JsonResponse::success(['message' => 'Abonelik oluşturuldu.', 'ids' => $subscriptionIds, 'order_id' => $orderId]);
    }

    public static function deleteSubscription(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? [];
        $id     = InputSanitizer::positiveInt($data['id'] ?? $_POST['id'] ?? 0);
        if (!$id) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        // Previously had no ownership check — anyone could cancel any user's subscription by id.
        Database::getInstance()->delete('user_subscriptions', 'id = ? AND user_id = ?', [$id, $userId]);
        JsonResponse::success(['message' => 'Abonelik silindi.']);
    }

    public static function updateSubscription(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['id'])) JsonResponse::error('Veri veya ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $id = InputSanitizer::positiveInt($data['id']);
        unset($data['id'], $data['user_id']);

        // Previously had no ownership check — anyone could edit any subscription by id.
        Database::getInstance()->update('user_subscriptions', $data, 'id = ? AND user_id = ?', [$id, $userId]);
        JsonResponse::success(['message' => 'Abonelik güncellendi.', 'id' => $id]);
    }

    public static function buyProducerAccount(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        require_once __DIR__ . '/../../../functions/checkout_payments.php';
        require_once __DIR__ . '/../../../functions/producer_plan.php';

        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Eksik veri.', 400, AppConfig::ERR_VALIDATION);

        $data['user_id'] = $userId;
        $status = buyProducerAccount(Database::getInstance(), $data);
        echo json_encode($status, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function getProducerPlanStatus(): void {
        require_once __DIR__ . '/../../../functions/producer_plan.php';
        $userId = AuthMiddleware::requireAuth();

        $status = getProducerPlanStatus(Database::getInstance(), $userId);
        echo json_encode(array_merge(['success' => true], $status));
        exit;
    }
}
