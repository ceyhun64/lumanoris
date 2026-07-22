<?php
class WalletController {
    /**
     * Shared by getMyBalance() (display) and withdraw() (validation) so the
     * two can never drift into disagreeing about what a seller's balance is.
     */
    private static function computeBalanceAndTransactions(Database $db, int $userId): array {
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

        return ['balance' => round($balance, 2), 'transactions' => $transactions];
    }

    public static function getMyBalance(): void {
        $userId = AuthMiddleware::requireAuth();
        $result = self::computeBalanceAndTransactions(Database::getInstance(), $userId);

        echo json_encode(array_merge(['success' => true], $result));
        exit;
    }

    public static function getIban(): void {
        $userId = AuthMiddleware::requireAuth();

        $row = Database::getInstance()->selectSingle('iban FROM banka_bilgileri WHERE user_id = ?', [$userId]);
        JsonResponse::success(['iban' => $row['iban'] ?? null]);
    }

    public static function withdraw(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['iban'], $data['amount'])) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        $amount = InputSanitizer::price($data['amount']);
        if ($amount <= 0) {
            JsonResponse::error('Geçersiz tutar.', 400, AppConfig::ERR_VALIDATION);
        }

        $db = Database::getInstance();

        // Previously inserted a withdrawal request for any client-supplied
        // amount with no check against the seller's actual balance — a user
        // could request (and, once approved, receive) a withdrawal far larger
        // than they've ever earned.
        $conn = $db->getConnection();

        // computeBalanceAndTransactions() is a plain SELECT with no locking,
        // so two concurrent withdraw() calls for the same user could both
        // read the same "available" balance before either's insert commits,
        // both pass the check above, and together withdraw more than the
        // real balance. A MySQL named lock scoped to this user forces
        // concurrent withdraw() calls for the same account to run one at a
        // time, so the second call's balance read always sees the first
        // call's already-inserted request.
        $lockName = 'withdraw_user_' . $userId;
        $lockStmt = $conn->prepare('SELECT GET_LOCK(?, 10) AS locked');
        $lockStmt->execute([$lockName]);
        if ((int) ($lockStmt->fetch()['locked'] ?? 0) !== 1) {
            JsonResponse::error('İşlem şu anda gerçekleştirilemiyor, lütfen tekrar deneyin.', 409, AppConfig::ERR_VALIDATION);
        }

        $conn->beginTransaction();
        try {
            $available = self::computeBalanceAndTransactions($db, $userId)['balance'];
            if ($amount > $available) {
                $conn->rollBack();
                $conn->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]);
                JsonResponse::error('Talep edilen tutar mevcut bakiyenizi aşıyor.', 400, AppConfig::ERR_VALIDATION);
            }

            $id = $db->insert('para_cekme_talepleri', [
                'user_id' => $userId,
                'iban'    => InputSanitizer::string($data['iban'], 40),
                'miktar'  => $amount,
                'durum'   => 'beklemede',
            ]);
            $conn->commit();
        } catch (Exception $e) {
            $conn->rollBack();
            $conn->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]);
            throw $e;
        }
        $conn->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]);

        JsonResponse::success(['message' => 'Para çekme talebi oluşturuldu.', 'id' => $id]);
    }

    public static function getBankInfo(): void {
        $userId = AuthMiddleware::requireAuth();

        $row = Database::getInstance()->selectSingle('* FROM banka_bilgileri WHERE user_id = ?', [$userId]);
        JsonResponse::success(['bank_info' => $row]);
    }

    public static function saveBankInfo(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        $db     = Database::getInstance();

        // Whitelist matches the real banka_bilgileri schema (verified via live
        // DESCRIBE — the old list referenced columns like ad_soyad/sube_kodu/
        // hesap_no that don't exist, so every save silently dropped almost
        // every field except iban).
        $allowed  = [
            'user_id', 'account_type', 'full_name', 'authorized_first_name', 'authorized_last_name',
            'company_title', 'tax_number', 'tax_office', 'id_number', 'phone', 'iban', 'address',
            'il', 'ilce', 'il_kod', 'ilce_kod', 'mahalle', 'cadde', 'sokak', 'bina_no', 'kapi_no',
            'posta_kodu', 'kisi_dogum_tarihi', 'yetkili_kisi_dogum_tarihi',
        ];
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
        $userId = AuthMiddleware::requireAuth();

        // Real column names are user_id/amount, not buyer_user_id/total_amount
        // (confirmed via live DESCRIBE — see MarketplaceController::createSubscription).
        $rows = Database::getInstance()->selectMulti(
            "p.id, p.order_id, p.amount AS total_amount, p.status, p.created_at,
             d.chatbot_id, d.payable_amount AS item_amount, d.status AS item_status,
             c.isim AS chatbot_title
             FROM param_marketplace_payments p
             JOIN param_marketplace_details d ON d.payment_id = p.id
             LEFT JOIN chatbotlar c ON c.id = d.chatbot_id
             WHERE p.user_id = ?
               AND p.status IN ('paid', 'refunded', 'partial_refund')
             ORDER BY p.created_at DESC",
            [$userId]
        );

        JsonResponse::success(['payments' => $rows]);
    }

    public static function getMySubscriptions(): void {
        $userId = AuthMiddleware::requireAuth();

        // dashboard/purchased/page.jsx renders both an "Aktif" and a "Süresi
        // Doldu" state, so this must return the full purchase history, not
        // just currently-active ones (the previous `status = 1 AND
        // expiry_date > NOW()` filter made the expired state unreachable).
        // Field names match what that page reads: isim, kapak_fotografi,
        // profil_fotografi, kategori_id, is_active.
        $rows = Database::getInstance()->selectMulti(
            "us.id, us.chatbot_id, us.expiry_date, us.status,
             c.isim, c.kapak_fotografi, c.profil_fotografi, c.kategori_id,
             (us.status = 1 AND us.expiry_date > NOW()) AS is_active
             FROM user_subscriptions us
             JOIN chatbotlar c ON c.id = us.chatbot_id
             WHERE us.user_id = ?
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
        $userId   = AuthMiddleware::requireAuth();
        $data     = json_decode($_POST['data'] ?? '', true) ?? null;
        $planName = InputSanitizer::string($data['plan_name'] ?? '', 30);

        if (!$planName) {
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
        $userId    = AuthMiddleware::requireAuth();
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);

        if (!$chatbotId) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        // Looks at the most recent subscription regardless of whether it has
        // expired — `duration_weeks` from it is used by the frontend to
        // preselect a duration on "Tekrar Satın Al", which is exactly the
        // case where the previous term has already ended. `has_active_sub`
        // still only reflects a currently-valid (non-expired, status=1) row.
        $sub = Database::getInstance()->selectSingle(
            "id, expiry_date, duration_weeks, (status = 1 AND expiry_date > NOW()) AS is_active
             FROM user_subscriptions WHERE user_id = ? AND chatbot_id = ? ORDER BY id DESC LIMIT 1",
            [$userId, $chatbotId]
        );

        if ($sub) {
            $isActive = (bool) $sub['is_active'];
            JsonResponse::success([
                'has_active_sub' => $isActive,
                'expiry_date'    => $isActive ? $sub['expiry_date'] : null,
                'duration_weeks' => (int) $sub['duration_weeks'],
            ]);
        } else {
            JsonResponse::success(['has_active_sub' => false, 'duration_weeks' => null]);
        }
    }
}
