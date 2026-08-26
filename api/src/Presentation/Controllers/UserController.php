<?php
class UserController {
    public static function getUserHeader(): void {
        $userId = AuthMiddleware::requireAuth();

        $repo = new UserRepository();
        $user = $repo->findById($userId);
        if (!$user) JsonResponse::error('Kullanıcı bulunamadı!', 404, AppConfig::ERR_NOT_FOUND);

        $db    = Database::getInstance();
        $count = (int) $db->count(AppConfig::TABLE_CHATBOTS, 'author_user_id = ?', [$userId]);

        // UX-002: plan adı artık limitlerle AYNI kaynaktan geliyor
        // (functions/plans.php). Eskiden burası `user_plan_selection`'ın
        // serbest metnini okuyor, bot ekranı ise stub'dan 1/2 alıyordu;
        // ikisi arasında hiçbir bağ yoktu ve kullanıcı "Elmas" başlığıyla
        // 1/2 limitini aynı anda görüyordu.
        require_once __DIR__ . '/../../../functions/plans.php';
        $userPlan = getUserPlan($db, $userId);
        $planName = (string) $userPlan['name_tr'];

        require_once __DIR__ . '/../../../functions/coin_engine.php';
        $coinBalance = getOrInitCoinBalance($db, $userId);

        // Same "purchased" definition ChatbotRepository::getMenuItems uses
        // for the Chatbotlarım list: owns access via an active subscription
        // to a bot someone else authored — not just anything with
        // owner_user_id set (that column isn't updated back to the author
        // when a subscription expires).
        $purchasedCount = (int) $db->selectSingle(
            "COUNT(*) AS total FROM `" . AppConfig::TABLE_CHATBOTS . "` c
             WHERE c.owner_user_id = ? AND c.author_user_id != ?
               AND EXISTS (
                    SELECT 1 FROM user_subscriptions us
                    WHERE us.user_id = ? AND us.chatbot_id = c.id
                      AND us.status = 1 AND us.expiry_date > NOW()
                 )",
            [$userId, $userId, $userId]
        )['total'];

        $sharedDialogueCount = $db->count('user_dialog_books', 'user_id = ?', [$userId]);

        JsonResponse::success([
            'id'                  => $user['id'],
            'fullname'            => $user['ad_soyad'],
            'username'            => $user['kullanici_adi'],
            'chatbotCount'        => $count,
            'purchasedCount'      => $purchasedCount,
            'sharedDialogueCount' => $sharedDialogueCount,
            'planName'            => $planName,
            'dailyCoinsRemaining' => (int) $coinBalance['coins_remaining'],
            // BIZ-002: toplam da plandan gelmeli. Sabit bırakıldığında Elmas
            // planındaki kullanıcı "1000/10" gibi anlamsız bir oran görüyordu.
            'dailyCoinsTotal'     => (int) $userPlan['daily_message_limit'],
        ]);
    }

    public static function getUserNames(): void {
        $userId = AuthMiddleware::requireAuth();

        $repo = new UserRepository();
        $user = $repo->findById($userId);
        if (!$user) JsonResponse::error('Kullanıcı bulunamadı!', 404, AppConfig::ERR_NOT_FOUND);

        JsonResponse::success(['id' => $user['id'], 'fullname' => $user['ad_soyad'], 'username' => $user['kullanici_adi']]);
    }

    public static function updateUserNames(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();

        $adSoyad      = InputSanitizer::string($_POST['ad_soyad'] ?? '', 100);
        $kullaniciAdi = InputSanitizer::string($_POST['kullanici_adi'] ?? '', 60);

        if (!$adSoyad && !$kullaniciAdi) {
            JsonResponse::error('Güncellenecek alan bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }

        $updates = [];
        if ($adSoyad)      $updates['ad_soyad']      = $adSoyad;
        if ($kullaniciAdi) $updates['kullanici_adi']  = $kullaniciAdi;

        (new UserRepository())->updateById($userId, $updates);
        JsonResponse::success(['message' => 'Kullanıcı güncellendi.']);
    }

    public static function getUserEmail(): void {
        $userId = AuthMiddleware::requireAuth();

        $user = (new UserRepository())->findById($userId);
        if (!$user) JsonResponse::error('Kullanıcı bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);

        JsonResponse::success(['id' => $user['id'], 'email' => $user['eposta']]);
    }

    public static function updateUserEmail(): void {
        require_method('POST');
        $userId   = AuthMiddleware::requireAuth();
        $newEmail = InputSanitizer::email($_POST['email'] ?? '');

        if (!$newEmail) JsonResponse::error('Yeni e-posta adresi zorunludur!', 400, AppConfig::ERR_VALIDATION);
        if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
            JsonResponse::error('Geçerli bir e-posta adresi girin.', 400, AppConfig::ERR_VALIDATION);
        }

        $ok = (new UserRepository())->updateById($userId, ['eposta' => $newEmail]);
        if ($ok) {
            JsonResponse::success(['message' => 'E-posta güncellendi.']);
        } else {
            JsonResponse::error('E-posta güncellenemedi veya kullanıcı bulunamadı.', 400);
        }
    }

    public static function getUserPhone(): void {
        $userId = AuthMiddleware::requireAuth();

        $user = (new UserRepository())->findById($userId);
        if (!$user) JsonResponse::error('Kullanıcı bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);

        JsonResponse::success(['id' => $user['id'], 'telefon' => $user['telefon'] ?? null]);
    }

    public static function updateUserPhone(): void {
        require_method('POST');
        $userId  = AuthMiddleware::requireAuth();
        $telefon = InputSanitizer::string($_POST['telefon'] ?? '', 20);

        if (!$telefon) JsonResponse::error('Telefon numarası zorunludur!', 400, AppConfig::ERR_VALIDATION);

        $ok = (new UserRepository())->updateById($userId, ['telefon' => $telefon]);
        if ($ok) {
            JsonResponse::success(['message' => 'Telefon numarası güncellendi.']);
        } else {
            JsonResponse::error('Telefon güncellenemedi veya kullanıcı bulunamadı.', 400);
        }
    }

    /**
     * SEC-016 🟡 — avatar değeri HİÇ doğrulanmadan saklanıyordu.
     *
     * Chatbot görselleri için titiz bir yükleme yolu var
     * (ChatbotController::handleImageUploads: boyut sınırı, magic-byte MIME
     * doğrulaması, MIME'dan türetilen uzantı, sunucunun ürettiği dosya adı).
     * Kullanıcı avatarları o yolu tamamen atlıyordu: `$data['avatar']` ne
     * gelirse `kullanicilar.avatar` (LONGTEXT) sütununa yazılıyordu.
     *
     * Pratik sonuçları: sınırsız uzunlukta veri (LONGTEXT'e istediği kadar
     * yazabilir), `javascript:` / `data:text/html` gibi şemalar (avatar bir
     * <img src> içinde render ediliyor) ve tamamen dış URL'ler (kullanıcı
     * profil resmini istediği sunucudan çektirerek görüntüleyenlerin IP'sini
     * toplayabilir).
     *
     * Kabul edilen üç biçim:
     *   • ""                       → fotoğrafı kaldır
     *   • assets/…                 → bu sunucunun yükleme yolu
     *   • data:image/…;base64,…    → küçük gömülü görsel (istemci kırpma akışı)
     */
    private const MAX_AVATAR_DATA_URI_BYTES = 512 * 1024;

    public static function uploadProfilePhoto(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $avatar = $data['avatar'] ?? null;

        // avatar === "" is a valid request meaning "remove my photo" — only a
        // truly missing key should be rejected.
        if ($avatar === null) {
            JsonResponse::error('Eksik alanlar!', 400, AppConfig::ERR_VALIDATION);
        }
        if (!is_string($avatar)) {
            JsonResponse::error('Geçersiz avatar değeri.', 400, AppConfig::ERR_VALIDATION);
        }

        $avatar = trim($avatar);

        if ($avatar !== '') {
            $isLocalPath = (bool) preg_match('#^assets/[A-Za-z0-9_\-/]+\.(png|jpe?g|gif|webp)$#i', $avatar);
            $isDataUri   = (bool) preg_match('#^data:image/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$#i', $avatar);

            if (!$isLocalPath && !$isDataUri) {
                JsonResponse::error(
                    'Geçersiz avatar. Yalnızca bu sunucuya yüklenmiş bir görsel yolu '
                    . 'veya gömülü bir görsel kabul edilir.',
                    400,
                    AppConfig::ERR_VALIDATION
                );
            }

            // ".." yolu assets/ dışına çıkarabilirdi.
            if (str_contains($avatar, '..')) {
                JsonResponse::error('Geçersiz avatar yolu.', 400, AppConfig::ERR_VALIDATION);
            }

            if ($isDataUri && strlen($avatar) > self::MAX_AVATAR_DATA_URI_BYTES) {
                JsonResponse::error('Görsel çok büyük (en fazla 512 KB).', 400, AppConfig::ERR_VALIDATION);
            }

            if ($isDataUri) {
                // Base64 gövdesi gerçekten bir görsel mi? Uzantı/MIME iddiası
                // tek başına yeterli değil — chatbot yolundaki magic-byte
                // kontrolünün karşılığı.
                $payload = substr($avatar, strpos($avatar, ',') + 1);
                $binary  = base64_decode($payload, true);
                if ($binary === false || @getimagesizefromstring($binary) === false) {
                    JsonResponse::error('Görsel çözümlenemedi.', 400, AppConfig::ERR_VALIDATION);
                }
            }
        }

        $ok = (new UserRepository())->updateById($userId, ['avatar' => $avatar]);
        if ($ok) {
            JsonResponse::success(['message' => 'Profil fotoğrafı güncellendi.', 'user_id' => $userId]);
        } else {
            JsonResponse::error('Güncelleme yapılamadı veya değişiklik yok.', 400);
        }
    }

    public static function getProfilePhoto(): void {
        $userId = AuthMiddleware::requireAuth();

        $user   = (new UserRepository())->findById($userId);
        $avatar = isset($user['avatar']) ? preg_replace('/\s+/', '', $user['avatar']) : null;

        echo json_encode(
            ['success' => true, 'avatar' => (!empty($avatar) ? $avatar : null)],
            JSON_UNESCAPED_SLASHES
        );
        exit;
    }
}
