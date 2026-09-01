<?php
class WalletController {
    /**
     * Shared by getMyBalance() (display) and withdraw() (validation) so the
     * two can never drift into disagreeing about what a seller's balance is.
     *
     * DB-003 🟠 — bu sorgu `param_marketplace_payments`'a JOIN yapıyordu ama
     * `p.status`'u hiç okumuyordu; yalnızca `d.status`'a bakıyordu. `d.status`
     * ise her zaman 'approved' yazıldığı için (PAY-001) ödeme durumu sütununun
     * para üzerinde HİÇBİR etkisi yoktu — şemada duran `idx_status` index'i de
     * kullanılmıyordu.
     *
     * Artık bir satır bakiyeye ancak İKİSİ birden onaylıysa giriyor:
     * tahsilatın kendisi ('paid') ve satıcı payı ('approved'). Filtre SQL'de,
     * yani index kullanılabiliyor; ve fail-closed: tanınmayan bir durum
     * bakiyeye eklenmiyor.
     */
    /**
     * PAY-005 🟠 — çekim geçmişini okuyan sorgu istisnayı YUTUYORDU. Okuma
     * başarısız olduğunda (tablo yok, izin hatası, geçici bir DB sorunu)
     * bakiye "hiç çekim yapılmamış gibi" hesaplanıyordu — yani şişmiş.
     * `withdraw()` bu şişmiş değeri doğrulama ölçütü olarak kullanıyordu.
     *
     * $strict = true olduğunda istisna yükseltiliyor. Gösterimde (getMyBalance)
     * tolerans kabul edilebilir; doğrulamada (withdraw) asla.
     */
    private static function computeBalanceAndTransactions(Database $db, int $userId, bool $strict = false): array {
        $incomeRows = $db->selectMulti(
            "d.payable_amount, d.status, d.created_at, p.order_id, p.status AS payment_status
             FROM param_marketplace_details d
             JOIN param_marketplace_payments p ON p.id = d.payment_id
             WHERE d.seller_user_id = ?
               AND p.status IN ('paid', 'refunded')
             ORDER BY d.created_at DESC",
            [$userId]
        );

        $withdrawRows = [];
        try {
            $withdrawRows = $db->selectMulti('* FROM para_cekme_talepleri WHERE user_id = ? ORDER BY id DESC', [$userId]);
        } catch (Exception $e) {
            error_log('[getmybalance] para_cekme_talepleri okunamadı: ' . $e->getMessage());
            // PAY-005: doğrulama yolunda yutma yok — eksik veriyle bakiye
            // hesaplamak, gerçekte olmayan parayı çekilebilir göstermek demek.
            if ($strict) {
                throw $e;
            }
        }

        $transactions = [];
        $balance      = 0.0;

        foreach ($incomeRows as $r) {
            $amount        = (float) $r['payable_amount'];
            $paymentStatus = (string) ($r['payment_status'] ?? '');

            // Tahsilat gerçekten alınmadıysa satıcı payı ne yazarsa yazsın
            // bakiyeye girmez.
            if ($r['status'] === 'approved' && $paymentStatus === 'paid') {
                $balance        += $amount;
                $transactions[] = ['amount' => $amount, 'type' => 'income', 'status' => $r['status'], 'created_at' => $r['created_at'], 'description' => 'Satışlarınızdan elde ettiğiniz gelir bakiyenize aktarıldı. #' . $r['order_id']];
            } elseif ($r['status'] === 'refunded' || $paymentStatus === 'refunded') {
                $balance        -= $amount;
                $transactions[] = ['amount' => -$amount, 'type' => 'refund', 'status' => 'refunded', 'created_at' => $r['created_at'], 'description' => 'Satış iadesi işlendi. #' . $r['order_id']];
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
            $available = self::computeBalanceAndTransactions($db, $userId, true)['balance'];
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
    /**
     * BIZ-002 🟠 — katalog KODDA duruyordu: dört plan, fiyatları ve
     * özellikleriyle birlikte bir PHP dizisiydi; `plans` tablosu 0 satırdı.
     * Yani veritabanında bir plan tablosu vardı ama hiçbir şey onu okumuyor,
     * hiçbir şey ona yazmıyordu.
     *
     * Artık katalog `plans` + `plan_icerikler`'den okunuyor (migration 007).
     * Tablo hazır değilse aşağıdaki kodlanmış listeye düşüyor — böylece
     * migration uygulanmadan da sayfa çalışmaya devam ediyor.
     *
     * Kullanıcının mevcut planı da işaretleniyor: `is_current`. Eskiden
     * "Mevcut Paket" etiketi Ücretsiz plana sabitlenmişti.
     */
    public static function getPricing(): void {
        $userId = AuthMiddleware::optionalAuth();
        $db     = Database::getInstance();
        require_once __DIR__ . '/../../../functions/plans.php';

        $catalog = getPlanCatalog($db);

        if ($catalog !== []) {
            $currentPlan = $userId > 0 ? getUserPlanName($db, $userId) : 'Ücretsiz';
            $badges      = ['Altın' => 'Önerilen'];
            $output      = [];

            foreach ($catalog as $p) {
                $isCurrent = ($p['name_tr'] === $currentPlan);
                $price     = (float) ($p['monthly_price'] ?? 0);

                $output[] = [
                    'title'         => $p['name_tr'],
                    'monthly_price' => $price > 0
                        ? '₺' . number_format($price, 2, ',', '.')
                        : '₺0',
                    'yearly_price'  => $p['yearly_price'] !== null
                        ? '₺' . number_format((float) $p['yearly_price'], 2, ',', '.')
                        : null,
                    'description'   => $p['description_tr'] ?? '',
                    'features'      => $p['features'] ?? [],
                    'buttonText'    => $isCurrent ? 'Mevcut Paket' : 'Bu Paketi Seç',
                    'buttonType'    => ($p['name_tr'] === 'Altın') ? 'primary' : 'default',
                    'badge'         => $badges[$p['name_tr']] ?? null,
                    'is_current'    => $isCurrent,
                    // Pazarlama metni yerine gerçek kotalar — istemci
                    // isterse "3 bot / 50 mesaj" diye gösterebilir.
                    'limits'        => [
                        'independent_bots' => (int) $p['independent_bot_limit'],
                        'public_bots'      => (int) $p['public_bot_limit'],
                        'daily_messages'   => (int) $p['daily_message_limit'],
                    ],
                ];
            }

            JsonResponse::success(['all_plans' => $output]);
        }

        // ── Geri düşüş: migration 007 uygulanmamış ───────────────────────
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

    /**
     * BIZ-001 🔴 — bu metot ₺149 / ₺299 / ₺599'luk üç paketi **hiçbir ödeme
     * almadan** yazıyordu: `plan_name` doğrulanmıyordu (istemci "Elmas" da
     * yazabilirdi, "Kral" da), hiçbir tahsilat çağrılmıyordu ve kullanıcıya
     * "Üyelik paketiniz güncellendi." deniyordu.
     *
     * Kaydın kendisi de karşılıksızdı (BIZ-002): yazdığı satırı yalnızca
     * dashboard başlığı okuyor; `chatbot_limits.php` ve coin motoru plan
     * satırına hiç bakmıyor, herkese ücretsiz limitleri veriyor. Yani ödeme
     * alınmış olsaydı bile kullanıcı hiçbir şey satın almamış olacaktı.
     *
     * Bunu tekrar açmak için gereken üç şeyin ÜÇÜ DE tamamlandı:
     *   1. `chargeCard()` artık gerçek iyzico tahsilatı yapıyor (PAY-001),
     *   2. plan adı VE FİYATI sunucudaki `plans` kataloğundan okunuyor —
     *      istemci ne plan adı uyduruyor ne de tutar gönderiyor,
     *   3. `functions/plans.php` üzerinden `chatbot_limits.php` ve
     *      `coin_engine.php` bu satırı gerçekten okuyor (BIZ-002).
     *
     * Yani ödeme artık karşılıksız değil: yazılan `user_plan_selection`
     * satırı doğrudan bot ve mesaj kotasına dönüşüyor.
     */
    public static function upgradePlan(): void {
        require_method('POST');
        require_once __DIR__ . '/../../../functions/checkout_payments.php';
        require_once __DIR__ . '/../../../functions/plans.php';

        $userId   = AuthMiddleware::requireAuth();
        $data     = json_decode($_POST['data'] ?? '', true) ?? null;
        $planName = InputSanitizer::string($data['plan_name'] ?? '', 30);

        if (!$planName) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        $db = Database::getInstance();
        checkRateLimit($db, 'upgradeplan:' . $userId, 5, 60);

        // Katalog hazır değilse (migration 007 uygulanmamış) plan satırı
        // hiçbir limit üretmez — o durumda para almak karşılıksız tahsilat
        // olurdu. Fail-closed.
        if (!plansTableReady($db)) {
            error_log('[upgradePlan] plans kataloğu hazır değil (migration 007 uygulanmamış) — yükseltme reddedildi.');
            JsonResponse::error(
                'Paket kataloğu şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
                503,
                AppConfig::ERR_UNAVAILABLE
            );
        }

        // Plan adı VE fiyatı sunucudan geliyor. İstemcinin gönderdiği tek
        // şey plan adı; tutarı asla istemci belirlemiyor.
        $plan = $db->selectSingle('id, name_tr, monthly_price FROM plans WHERE name_tr = ?', [$planName]);
        if (!$plan) {
            JsonResponse::error('Geçersiz paket.', 400, AppConfig::ERR_VALIDATION);
        }

        $price = round((float) $plan['monthly_price'], 2);

        // Ücretsiz plan (ya da fiyatı tanımlanmamış plan) için tahsilat yok —
        // ama ücretli bir planın fiyatı NULL kalmışsa bu bir yapılandırma
        // hatası; sessizce bedava vermek yerine reddediyoruz.
        if ($price <= 0) {
            // selectSingle() satır yoksa false döner; doğrudan ['id'] yazmak
            // PHP 8'de "array offset on bool" uyarısı üretir.
            $defaultPlan   = $db->selectSingle('id FROM plans WHERE is_default = 1 ORDER BY sort_order LIMIT 1');
            $defaultPlanId = $defaultPlan ? (int) $defaultPlan['id'] : 0;

            if ((int) $plan['id'] !== $defaultPlanId) {
                error_log('[upgradePlan] ücretli plan için fiyat tanımsız: ' . $planName);
                JsonResponse::error('Bu paket için geçerli bir fiyat tanımlanmamış.', 422, AppConfig::ERR_VALIDATION);
            }
            $db->insert('user_plan_selection', [
                'user_id'     => $userId,
                'plan_name'   => $plan['name_tr'],
                'selected_at' => date('Y-m-d H:i:s'),
            ], true);
            JsonResponse::success(['message' => 'Üyelik paketiniz güncellendi.', 'plan_name' => $plan['name_tr']]);
        }

        $card = is_array($data['card'] ?? null) ? $data['card'] : [];
        if (!$card) {
            JsonResponse::error('Ödeme için kart bilgisi gerekli.', 400, AppConfig::ERR_VALIDATION);
        }

        // order_id tahsilattan önce üretiliyor — checkout ile aynı gerekçe:
        // mutabakat belirsiz kalan bir tahsilatı ancak bu kimlikle bulabilir.
        $orderId  = 'PLN-' . strtoupper(InputSanitizer::randomToken(4));
        $buyerRow = $db->selectSingle(
            'id, ad_soyad, kullanici_adi, eposta, telefon FROM kullanicilar WHERE id = ?',
            [$userId]
        ) ?: ['id' => $userId];

        $chargeResult = chargeCard($card, $price, [
            'order_id'      => $orderId,
            'user'          => $buyerRow,
            'user_id'       => $userId,
            'ip'            => clientIp(),
            'payment_group' => 'SUBSCRIPTION',
            'items'         => [[
                'id'       => 'PLAN-' . $plan['id'],
                'name'     => $plan['name_tr'] . ' Üyelik Paketi',
                'category' => 'Üyelik',
                'price'    => $price,
            ]],
        ]);

        if (!$chargeResult['success']) {
            JsonResponse::error($chargeResult['message'] ?? 'Ödeme başarısız.', 402, AppConfig::ERR_PAYMENT);
        }

        $gatewayPayment = (string) ($chargeResult['payment_id'] ?? '');

        // Tahsilat alındı; buradan sonraki her hata "para çekildi ama paket
        // verilmedi" demek — o yüzden telafi (aynı gün tam iptal) şart.
        try {
            $db->insert('param_marketplace_payments', [
                'order_id'             => $orderId,
                'user_id'              => $userId,
                'amount'               => $price,
                'product_amount'       => $price,
                'status'               => 'paid',
                'param_transaction_id' => $gatewayPayment !== '' ? $gatewayPayment : null,
                'param_receipt_id'     => $orderId,
                'param_net_amount'     => $chargeResult['net_amount'] ?? null,
                'items_json'           => json_encode([[
                    'plan_id'   => (int) $plan['id'],
                    'plan_name' => $plan['name_tr'],
                    'price'     => $price,
                ]], JSON_UNESCAPED_UNICODE),
                // Sıra önemli — bkz. MarketplaceController'daki aynı satır.
                'param_response_json'  => json_encode(
                    array_merge(
                        $chargeResult['raw'] ?? [],
                        ['itemTransactions' => $chargeResult['item_transactions'] ?? []]
                    ),
                    JSON_UNESCAPED_UNICODE
                ),
            ]);

            // user_plan_selection'ın PK'sı user_id — upsert doğru davranış:
            // kullanıcının tek bir etkin planı var.
            $db->insert('user_plan_selection', [
                'user_id'     => $userId,
                'plan_name'   => $plan['name_tr'],
                'selected_at' => date('Y-m-d H:i:s'),
            ], true);
        } catch (Throwable $e) {
            error_log('[upgradePlan] tahsilat sonrası kayıt başarısız: ' . $e->getMessage());
            cancelCharge($gatewayPayment, clientIp(), $orderId);
            JsonResponse::error(
                'Ödemeniz alındı ancak paket tanımlanamadı; tutar iade edildi. Lütfen tekrar deneyin.',
                500,
                AppConfig::ERR_SERVER
            );
        }

        error_log(sprintf('[upgradePlan] paket satın alındı user_id=%d plan=%s order=%s', $userId, $plan['name_tr'], $orderId));

        JsonResponse::success([
            'message'   => 'Üyelik paketiniz güncellendi.',
            'plan_name' => $plan['name_tr'],
            'order_id'  => $orderId,
        ]);
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

    /**
     * PAY-006 🟠 — para çekme taleplerinin `durum` alanını güncelleyen
     * HİÇBİR kod yoktu.
     *
     * `withdraw()` talebi `durum='beklemede'` ile yazıyordu; ne bir admin
     * ekranı, ne bir endpoint, ne bir job o değeri değiştiriyordu. Tablo
     * legacy admin CRUD motorunun beyaz listesinde de yoktu, yani admin
     * panelinden de dokunulamıyordu. Sonuç: her talep kalıcı olarak
     * "beklemede" kalıyor ve `computeBalanceAndTransactions()` bekleyen
     * talepleri bakiyeden düştüğü için satıcının parası **süresiz olarak
     * kilitleniyordu** — ödeme yapılsa bile.
     *
     * Aşağıdaki iki uç nokta yaşam döngüsünü kapatıyor. Bilinçli olarak
     * legacy CRUD beyaz listesine eklemek yerine ayrı yazıldılar: durum
     * geçişleri serbest metin değil, ve `odendi` yazmak gerçek para hareketi
     * anlamına geldiği için kayıt izi bırakması gerekiyor.
     */
    /**
     * Para çekme talebi durumları.
     *
     * DİKKAT — bu liste veritabanındaki gerçek değerlerle birebir eşleşmek
     * zorunda. İlk yazımda ASCII'ye sadeleştirilmişti (`onaylandi`, `odendi`)
     * ama kayıtlı veri Türkçe yazımı kullanıyor (`onaylandı`). Sonuç: admin
     * bir talebi onaylayamıyor, `?status=onaylandı` filtresi de "Geçersiz
     * durum" veriyordu. Canlı veri kontrolüyle yakalandı.
     *
     * `beklemede` `withdraw()` tarafından yazılıyor; `reddedildi` ve `iptal`
     * `computeBalanceAndTransactions()` tarafından bakiyeden düşülmeyen
     * durumlar olarak okunuyor — üçü de burada aynen korunmalı.
     */
    private const WITHDRAWAL_STATUSES = ['beklemede', 'onaylandı', 'ödendi', 'reddedildi', 'iptal'];

    /**
     * İstemci ASCII yazım gönderebilir (klavye, kopyalama, eski entegrasyon).
     * Kanonik Türkçe biçime çeviriyoruz ki veritabanında tek bir yazım olsun.
     */
    private static function normalizeWithdrawalStatus(string $status): string {
        $aliases = [
            'onaylandi' => 'onaylandı',
            'odendi'    => 'ödendi',
        ];
        $status = trim($status);
        return $aliases[mb_strtolower($status)] ?? $status;
    }

    public static function listWithdrawals(): void {
        AuthMiddleware::requireAdmin();

        $db     = Database::getInstance();
        $status = self::normalizeWithdrawalStatus(InputSanitizer::string($_GET['status'] ?? '', 32));
        if ($status !== '' && !in_array($status, self::WITHDRAWAL_STATUSES, true)) {
            JsonResponse::error('Geçersiz durum filtresi.', 400, AppConfig::ERR_VALIDATION);
        }

        $rows = $status !== ''
            ? $db->selectMulti(
                'p.id, p.user_id, p.iban, p.miktar, p.durum, p.created_at, k.kullanici_adi, k.eposta
                 FROM para_cekme_talepleri p
                 JOIN kullanicilar k ON k.id = p.user_id
                 WHERE p.durum = ? ORDER BY p.id DESC',
                [$status]
            )
            : $db->selectMulti(
                'p.id, p.user_id, p.iban, p.miktar, p.durum, p.created_at, k.kullanici_adi, k.eposta
                 FROM para_cekme_talepleri p
                 JOIN kullanicilar k ON k.id = p.user_id
                 ORDER BY p.id DESC'
            );

        JsonResponse::success(['requests' => $rows]);
    }

    public static function updateWithdrawalStatus(): void {
        require_method('POST');
        $adminName = AuthMiddleware::requireAdmin();

        $data   = json_decode($_POST['data'] ?? '', true) ?? [];
        $id     = InputSanitizer::positiveInt($data['id'] ?? $_POST['id'] ?? 0);
        $status = self::normalizeWithdrawalStatus(InputSanitizer::string($data['durum'] ?? $_POST['durum'] ?? '', 32));

        if (!$id) {
            JsonResponse::error('Talep ID gerekli.', 400, AppConfig::ERR_VALIDATION);
        }
        if (!in_array($status, self::WITHDRAWAL_STATUSES, true)) {
            JsonResponse::error(
                'Geçersiz durum. İzin verilenler: ' . implode(', ', self::WITHDRAWAL_STATUSES),
                400,
                AppConfig::ERR_VALIDATION
            );
        }

        $db      = Database::getInstance();
        $request = $db->selectSingle('id, user_id, miktar, durum FROM para_cekme_talepleri WHERE id = ?', [$id]);
        if (!$request) {
            JsonResponse::error('Talep bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);
        }

        // Kapanmış bir talebin yeniden açılması bakiyeyi geriye doğru
        // değiştirir; kasıtlı olabilir ama sessizce olmamalı.
        $closed = ['odendi', 'reddedildi', 'iptal'];
        if (in_array((string) $request['durum'], $closed, true) && empty($data['force'])) {
            JsonResponse::error(
                'Bu talep zaten kapatılmış (' . $request['durum'] . '). Değiştirmek için force gönderin.',
                409,
                AppConfig::ERR_VALIDATION
            );
        }

        $db->update('para_cekme_talepleri', ['durum' => $status], 'id = ?', [$id]);

        error_log(sprintf(
            '[withdrawal] durum güncellendi id=%d user_id=%d tutar=%s %s -> %s admin=%s',
            $id,
            (int) $request['user_id'],
            (string) $request['miktar'],
            (string) $request['durum'],
            $status,
            $adminName
        ));

        JsonResponse::success(['message' => 'Talep durumu güncellendi.', 'id' => $id, 'durum' => $status]);
    }
}
