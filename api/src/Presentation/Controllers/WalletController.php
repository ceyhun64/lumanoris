<?php
class WalletController {
    public static function getMyBalance(): void {
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        if (!$userId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $db = Database::getInstance();

        $incomeRows = $db->selectMulti(
            "d.payable_amount, d.status, d.created_at, p.order_id
             FROM param_marketplace_details d
             JOIN param_marketplace_payments p ON p.id = d.payment_id
             WHERE d.seller_user_id = ?
             ORDER BY d.created_at DESC",
            [$userId]
        );

        $withdrawRows = [];
        try {
            $withdrawRows = $db->selectMulti('* FROM para_cekme_talepleri WHERE user_id = ? ORDER BY id DESC', [$userId]);
        } catch (Exception $e) {
            error_log('[getmybalance] para_cekme_talepleri okunamadı: ' . $e->getMessage());
        }

        $transactions = [];
        $balance      = 0.0;

        foreach ($incomeRows as $r) {
            $amount = (float) $r['payable_amount'];
            if ($r['status'] === 'approved') {
                $balance        += $amount;
                $transactions[] = ['amount' => $amount, 'type' => 'income', 'status' => $r['status'], 'created_at' => $r['created_at'], 'description' => 'Satışlarınızdan elde ettiğiniz gelir bakiyenize aktarıldı. #' . $r['order_id']];
            } elseif ($r['status'] === 'refunded') {
                $balance        -= $amount;
                $transactions[] = ['amount' => -$amount, 'type' => 'refund', 'status' => $r['status'], 'created_at' => $r['created_at'], 'description' => 'Satış iadesi işlendi. #' . $r['order_id']];
            }
        }

        foreach ($withdrawRows as $w) {
            $amount = (float) ($w['miktar'] ?? 0);
            $durum  = (string) ($w['durum'] ?? '');
            if ($durum !== 'reddedildi' && $durum !== 'iptal') {
                $balance -= $amount;
            }
            $transactions[] = ['amount' => -$amount, 'type' => 'withdrawal', 'status' => $durum, 'created_at' => $w['created_at'] ?? null, 'description' => 'Para çekme talebi (' . ($durum !== '' ? $durum : 'beklemede') . ')'];
        }

        usort($transactions, static fn($a, $b) => strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? '')));

        echo json_encode(['success' => true, 'balance' => round($balance, 2), 'transactions' => $transactions]);
        exit;
    }

    public static function getIban(): void {
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        if (!$userId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $row = Database::getInstance()->selectSingle('iban FROM banka_bilgileri WHERE user_id = ?', [$userId]);
        JsonResponse::success(['iban' => $row['iban'] ?? null]);
    }

    public static function withdraw(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['user_id'], $data['iban'], $data['amount'])) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        $id = Database::getInstance()->insert('para_cekme_talepleri', [
            'user_id' => InputSanitizer::positiveInt($data['user_id']),
            'iban'    => InputSanitizer::string($data['iban'], 40),
            'miktar'  => InputSanitizer::price($data['amount']),
            'durum'   => 'beklemede',
        ]);

        JsonResponse::success(['message' => 'Para çekme talebi oluşturuldu.', 'id' => $id]);
    }

    public static function getBankInfo(): void {
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        if (!$userId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $row = Database::getInstance()->selectSingle('* FROM banka_bilgileri WHERE user_id = ?', [$userId]);
        JsonResponse::success(['bank_info' => $row]);
    }

    public static function saveBankInfo(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['user_id'])) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        $userId = InputSanitizer::positiveInt($data['user_id']);
        $db     = Database::getInstance();

        $allowed  = ['user_id', 'ad_soyad', 'iban', 'banka_adi', 'sube_kodu', 'hesap_no', 'tc_kimlik'];
        $filtered = array_intersect_key($data, array_flip($allowed));
        $filtered['user_id'] = $userId;

        $existing = $db->selectSingle('id FROM banka_bilgileri WHERE user_id = ?', [$userId]);

        if ($existing) {
            unset($filtered['user_id']);
            $db->update('banka_bilgileri', $filtered, 'user_id = ?', [$userId]);
            JsonResponse::success(['message' => 'Banka bilgileri güncellendi.']);
        } else {
            $db->insert('banka_bilgileri', $filtered);
            JsonResponse::success(['message' => 'Banka bilgileri kaydedildi.']);
        }
    }

    public static function getMyPayments(): void {
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        if (!$userId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $rows = Database::getInstance()->selectMulti(
            "p.id, p.order_id, p.total_amount, p.status, p.created_at,
             d.chatbot_id, d.payable_amount AS item_amount, d.status AS item_status,
             c.isim AS chatbot_title
             FROM param_marketplace_payments p
             JOIN param_marketplace_details d ON d.payment_id = p.id
             LEFT JOIN chatbotlar c ON c.id = d.chatbot_id
             WHERE p.buyer_user_id = ?
               AND p.status IN ('paid', 'refunded', 'partial_refund')
             ORDER BY p.created_at DESC",
            [$userId]
        );

        JsonResponse::success(['payments' => $rows]);
    }

    public static function getMySubscriptions(): void {
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        if (!$userId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $rows = Database::getInstance()->selectMulti(
            "us.id, us.chatbot_id, us.expiry_date, us.status,
             c.isim AS chatbot_name, c.profil_fotografi
             FROM user_subscriptions us
             JOIN chatbotlar c ON c.id = us.chatbot_id
             WHERE us.user_id = ? AND us.status = 1 AND us.expiry_date > NOW()
             ORDER BY us.expiry_date DESC",
            [$userId]
        );

        JsonResponse::success(['subscriptions' => $rows]);
    }

    /**
     * 4 sabit üyelik paketi (Ücretsiz/Gümüş/Altın/Elmas). Fiyat ve özellikler
     * yer tutucu değerlerdir — iş ekibi tarafından kolayca güncellenebilir.
     */
    public static function getPricing(): void {
        $output = [
            [
                'title'         => 'Ücretsiz',
                'monthly_price' => '₺0',
                'yearly_price'  => null,
                'description'   => 'LUMANORIS\'in gücünü hiçbir ücret ödemeden keşfedin.',
                'features'      => ['Günlük mesaj hakkı', 'Temel chatbot oluşturma', 'Pazaryerinde gezinme'],
                'buttonText'    => 'Mevcut Paket',
                'buttonType'    => 'default',
                'badge'         => null,
            ],
            [
                'title'         => 'Gümüş',
                'monthly_price' => '₺149,00',
                'yearly_price'  => null,
                'description'   => 'Daha fazla mesaj hakkı ve gelişmiş özelliklerle bir üst seviyeye taşıyın.',
                'features'      => ['Artırılmış günlük mesaj hakkı', 'Daha fazla chatbot oluşturma limiti', 'Öncelikli destek'],
                'buttonText'    => 'Bu Paketi Seç',
                'buttonType'    => 'default',
                'badge'         => null,
            ],
            [
                'title'         => 'Altın',
                'monthly_price' => '₺299,00',
                'yearly_price'  => null,
                'description'   => 'Yoğun kullanıcılar için genişletilmiş limitler ve öncelikli destek.',
                'features'      => ['Yüksek günlük mesaj hakkı', 'Genişletilmiş chatbot limiti', 'Öncelikli destek', 'Gelişmiş istatistikler'],
                'buttonText'    => 'Bu Paketi Seç',
                'buttonType'    => 'primary',
                'badge'         => 'Önerilen',
            ],
            [
                'title'         => 'Elmas',
                'monthly_price' => '₺599,00',
                'yearly_price'  => null,
                'description'   => 'Sınırsız imkanlar ve VIP destekle maksimum verim alın.',
                'features'      => ['Sınırsız mesaj hakkı', 'Sınırsız chatbot oluşturma', '7/24 VIP destek', 'Gelişmiş istatistikler'],
                'buttonText'    => 'Bu Paketi Seç',
                'buttonType'    => 'default',
                'badge'         => null,
            ],
        ];

        JsonResponse::success(['all_plans' => $output]);
    }

    public static function upgradePlan(): void {
        require_method('POST');
        $data     = json_decode($_POST['data'] ?? '', true) ?? null;
        $userId   = InputSanitizer::positiveInt($data['user_id'] ?? 0);
        $planName = InputSanitizer::string($data['plan_name'] ?? '', 30);

        if (!$userId || !$planName) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        $db = Database::getInstance();
        $db->getConnection()->exec(
            'CREATE TABLE IF NOT EXISTS user_plan_selection (
                user_id INT PRIMARY KEY,
                plan_name VARCHAR(30) NOT NULL,
                selected_at DATETIME NOT NULL
            )'
        );
        $db->insert('user_plan_selection', [
            'user_id'     => $userId,
            'plan_name'   => $planName,
            'selected_at' => date('Y-m-d H:i:s'),
        ], true);

        JsonResponse::success(['message' => 'Üyelik paketiniz güncellendi.', 'plan_name' => $planName]);
    }

    public static function getSubscription(): void {
        $userId    = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);

        if (!$userId || !$chatbotId) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        $sub = Database::getInstance()->selectSingle(
            'id, expiry_date FROM user_subscriptions WHERE user_id = ? AND chatbot_id = ? AND status = 1 AND expiry_date > NOW() ORDER BY expiry_date DESC LIMIT 1',
            [$userId, $chatbotId]
        );

        if ($sub) {
            JsonResponse::success(['has_active_sub' => true, 'expiry_date' => $sub['expiry_date']]);
        } else {
            JsonResponse::success(['has_active_sub' => false]);
        }
    }
}
