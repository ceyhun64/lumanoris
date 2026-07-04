<?php
class MarketplaceController {
    public static function addToCart(): void {
        require_method('POST');
        $data      = json_decode($_POST['data'] ?? '', true) ?? null;
        $userId    = InputSanitizer::positiveInt($data['user_id'] ?? 0);
        $chatbotId = InputSanitizer::positiveInt($data['chatbot_id'] ?? 0);
        $orderWeeks = InputSanitizer::positiveInt($data['order_weeks'] ?? 0) ?: null;

        if (!$data || !$userId || !$chatbotId) {
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
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        if (!$userId) JsonResponse::error('Kullanıcı ID belirtilmedi.', 400, AppConfig::ERR_VALIDATION);

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
        echo json_encode($results);
        exit;
    }

    public static function getCartCount(): void {
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        if (!$userId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $row = Database::getInstance()->selectSingle('COUNT(*) AS total FROM user_cart WHERE user_id = ?', [$userId]);
        JsonResponse::success(['count' => (int) ($row['total'] ?? 0)]);
    }

    public static function deleteCart(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? [];
        $id   = InputSanitizer::positiveInt($data['id'] ?? $_POST['id'] ?? 0);
        if (!$id) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        Database::getInstance()->delete('user_cart', 'id = ?', [$id]);
        JsonResponse::success(['message' => 'Sepetten kaldırıldı.']);
    }

    public static function updateCart(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['id'])) JsonResponse::error('Veri veya ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $id = InputSanitizer::positiveInt($data['id']);
        unset($data['id']);
        Database::getInstance()->update('user_cart', $data, 'id = ?', [$id]);
        JsonResponse::success(['message' => 'Sepet güncellendi.', 'id' => $id]);
    }

    public static function buyChatbot(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['chatbot_ids']) || !is_array($data['chatbot_ids']) || !isset($data['user_id'])) {
            JsonResponse::error('Geçersiz veri formatı veya eksik parametre!', 400, AppConfig::ERR_VALIDATION);
        }

        $userId     = InputSanitizer::positiveInt($data['user_id']);
        $chatbotIds = array_map('intval', $data['chatbot_ids']);
        $db         = Database::getInstance();

        foreach ($chatbotIds as $botId) {
            if ($botId <= 0) continue;
            $db->update('chatbotlar', ['owner_user_id' => $userId], 'id = ?', [$botId]);
            $db->delete('user_cart', 'chatbot_id = ? AND user_id = ?', [$botId, $userId]);
        }

        JsonResponse::success(['message' => 'Tüm ürünler başarıyla satın alındı ve hesabınıza tanımlandı.']);
    }

    public static function createSubscription(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['user_id']) || empty($data['items']) || !is_array($data['items'])) {
            JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }

        $userId = InputSanitizer::positiveInt($data['user_id']);
        $db     = Database::getInstance();

        $subscriptionIds = [];
        $detailRows      = [];
        $totalAmount     = 0.0;

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
            $expiryDate = date('Y-m-d H:i:s', strtotime("+{$days} days"));

            $subscriptionIds[] = $db->insert('user_subscriptions', [
                'user_id'     => $userId,
                'chatbot_id'  => $chatbotId,
                'expiry_date' => $expiryDate,
                'status'      => 1,
            ]);

            $commissionRate = $isMonthly ? AppConfig::SELLER_COMMISSION_MONTHLY : AppConfig::SELLER_COMMISSION_WEEKLY;
            $detailRows[] = [
                'seller_user_id' => (int) $bot['author_user_id'],
                'chatbot_id'     => $chatbotId,
                'payable_amount' => InputSanitizer::price($price * $commissionRate),
            ];
            $totalAmount += $price;

            $db->delete('user_cart', 'chatbot_id = ? AND user_id = ?', [$chatbotId, $userId]);
        }

        if (empty($subscriptionIds)) {
            JsonResponse::error('Geçerli ürün bulunamadı.', 400, AppConfig::ERR_VALIDATION);
        }

        $orderId   = 'ORD-' . strtoupper(InputSanitizer::randomToken(4));
        $paymentId = $db->insert('param_marketplace_payments', [
            'order_id'      => $orderId,
            'buyer_user_id' => $userId,
            'total_amount'  => InputSanitizer::price($totalAmount),
            'status'        => 'paid',
        ]);

        foreach ($detailRows as $row) {
            $db->insert('param_marketplace_details', [
                'payment_id'     => $paymentId,
                'seller_user_id' => $row['seller_user_id'],
                'chatbot_id'     => $row['chatbot_id'],
                'payable_amount' => $row['payable_amount'],
                'status'         => 'approved',
            ]);
        }

        JsonResponse::success(['message' => 'Abonelik oluşturuldu.', 'ids' => $subscriptionIds, 'order_id' => $orderId]);
    }

    public static function deleteSubscription(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? [];
        $id   = InputSanitizer::positiveInt($data['id'] ?? $_POST['id'] ?? 0);
        if (!$id) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        Database::getInstance()->delete('user_subscriptions', 'id = ?', [$id]);
        JsonResponse::success(['message' => 'Abonelik silindi.']);
    }

    public static function updateSubscription(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['id'])) JsonResponse::error('Veri veya ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $id = InputSanitizer::positiveInt($data['id']);
        unset($data['id']);
        Database::getInstance()->update('user_subscriptions', $data, 'id = ?', [$id]);
        JsonResponse::success(['message' => 'Abonelik güncellendi.', 'id' => $id]);
    }

    public static function buyProducerAccount(): void {
        require_method('POST');
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        require_once __DIR__ . '/../../../functions/checkout_payments.php';
        require_once __DIR__ . '/../../../functions/producer_plan.php';

        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || empty($data['user_id'])) JsonResponse::error('Eksik veri.', 400, AppConfig::ERR_VALIDATION);

        $status = buyProducerAccount(Database::getInstance(), $data);
        echo json_encode($status, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function getProducerPlanStatus(): void {
        require_once __DIR__ . '/../../../functions/producer_plan.php';
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        if (!$userId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $status = getProducerPlanStatus(Database::getInstance(), $userId);
        echo json_encode(array_merge(['success' => true], $status));
        exit;
    }
}
