<?php
/**
 * Thin Chatbot controller — request → use case/repository → response.
 * No SQL, no business logic. File upload handled here only because it touches $_FILES.
 */
class ChatbotController {
    public static function saveChatbot(): void {
        require_method('POST');
        require_once __DIR__ . '/../../../functions/chatbot_limits.php';

        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) {
            JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }

        // ChatbotForm.jsx always sends id:-1 as a "this is a new bot" sentinel
        // (botId is unset and bot is null on the create path). chatbotlar.id
        // is an unsigned auto-increment column, so passing -1 straight into
        // the INSERT's column list failed every single create with
        // "SQLSTATE[22003]: Numeric value out of range" — id must never be
        // client-supplied on create, the DB assigns it.
        unset($data['id']);

        // Identity comes from the session, never from the client-supplied
        // author_user_id — otherwise anyone could create bots "as" another
        // user, or dodge their own free-tier limit by claiming someone else's id.
        $authorUserId  = AuthMiddleware::requireAuth();
        $isIndependent = !empty($data['is_independent']) ? 1 : 0;
        $data['is_independent'] = $isIndependent;
        $data['author_user_id'] = $authorUserId;

        $repo = new ChatbotRepository();

        $db    = Database::getInstance();
        $limit = $isIndependent ? getIndependentBotLimit($db, $authorUserId) : getPublicBotLimit($db, $authorUserId);
        $counts = $repo->countByOwner($authorUserId);
        $used  = $isIndependent ? $counts['independent'] : $counts['public'];

        if ($used >= $limit) {
            JsonResponse::error(
                $isIndependent
                    ? 'Ücretsiz bağımsız chatbot hakkınızı kullandınız.'
                    : 'Ücretsiz herkese açık chatbot hakkınızı kullandınız.',
                422, AppConfig::ERR_LIMIT_REACHED
            );
        }

        if (!$isIndependent) {
            $sellerStatus = $repo->getSellerStatus($authorUserId);
            if ($sellerStatus !== 'active') {
                JsonResponse::error('Önce Pazaryeri satıcı kaydınızı tamamlayın.', 422, AppConfig::ERR_SELLER_INACTIVE);
            }
        }

        $data['owner_user_id'] = $data['author_user_id'];
        $data = self::handleImageUploads($data);

        $id = $repo->create($data);
        JsonResponse::success(['message' => 'Chatbot başarıyla oluşturuldu!', 'id' => $id]);
    }

    public static function getDefaultBot(): void {
        $id = (new UserRepository())->getDefaultFollowBotId();
        if (!$id) {
            JsonResponse::error('Varsayılan bot bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);
        }
        JsonResponse::success(['id' => $id]);
    }

    public static function getChatbot(): void {
        $id     = InputSanitizer::positiveInt($_GET['id'] ?? 0);
        $userId = AuthMiddleware::optionalAuth();

        if (!$id) {
            JsonResponse::error('Chatbot ID gerekli.', 400, AppConfig::ERR_VALIDATION);
        }

        $repo    = new ChatbotRepository();
        $chatbot = $repo->getDetail($id, $userId);

        if (!$chatbot) {
            JsonResponse::error('Chatbot bulunamadı veya bu bota erişim izniniz yok.', 404, AppConfig::ERR_NOT_FOUND);
        }

        $comments = $repo->getComments($id);
        echo json_encode([
            'chatbot'  => $chatbot,
            'comments' => ['count' => count($comments), 'list' => $comments],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    public static function getChatbots(): void {
        $search = InputSanitizer::string($_GET['search'] ?? '');
        $repo   = new ChatbotRepository();
        JsonResponse::success(['bots' => $repo->getPublished(['search' => $search !== '' ? $search : null])]);
    }

    public static function getChatbotsV2(): void {
        $userId = AuthMiddleware::optionalAuth();
        $search = InputSanitizer::string($_GET['search'] ?? '');
        $repo   = new ChatbotRepository();
        echo json_encode($repo->getPublishedV2($userId, ['search' => $search !== '' ? $search : null]));
        exit;
    }

    public static function updateChatbot(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;

        if (!$data || !isset($data['id'])) {
            JsonResponse::error('Veri veya ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }

        $id   = (int) $data['id'];
        $repo = new ChatbotRepository();

        // Previously this had no ownership check at all — anyone who knew a
        // chatbot's id could overwrite its data.
        if (!$repo->findByIdAndOwner($id, $userId)) {
            JsonResponse::error('Bu chatbot üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        unset($data['id'], $data['author_user_id'], $data['owner_user_id']);
        $data = self::handleImageUploads($data);

        $repo->updateById($id, $data);
        JsonResponse::success(['message' => 'Chatbot başarıyla güncellendi!', 'id' => $id]);
    }

    public static function deleteChatbot(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? [];
        $id     = InputSanitizer::positiveInt($data['id'] ?? $_POST['id'] ?? 0);

        if (!$id) {
            JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }

        $repo = new ChatbotRepository();

        // Previously this had no ownership check at all — anyone who knew a
        // chatbot's id could delete it.
        if (!$repo->findByIdAndOwner($id, $userId)) {
            JsonResponse::error('Bu chatbot üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        $repo->deleteById($id);
        JsonResponse::success(['message' => 'Chatbot silindi.']);
    }

    public static function publishChatbot(): void {
        require_method('POST');
        require_once __DIR__ . '/../../../functions/chatbot_limits.php';

        $userId  = AuthMiddleware::requireAuth();
        $data    = json_decode($_POST['data'] ?? '', true) ?? null;
        $id      = InputSanitizer::positiveInt($data['id'] ?? 0);
        $weekly  = isset($data['ucret_haftalik']) ? (float) $data['ucret_haftalik'] : 0;
        $monthly = isset($data['ucret_aylik'])    ? (float) $data['ucret_aylik']    : 0;

        if (!$data || !$id) {
            JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);
        }
        self::assertValidPrice($weekly, 'Haftalık', AppConfig::MAX_WEEKLY_PRICE);
        self::assertValidPrice($monthly, 'Aylık', AppConfig::MAX_WEEKLY_PRICE * 4);

        $repo = new ChatbotRepository();
        $bot  = $repo->findById($id);

        if (!$bot || (int) $bot['author_user_id'] !== $userId) {
            JsonResponse::error('Bu chatbot üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }
        if ((int) $bot['is_independent'] === 0) {
            JsonResponse::error('Bu chatbot zaten yayında.', 400, AppConfig::ERR_DUPLICATE);
        }

        $db          = Database::getInstance();
        $publicLimit = getPublicBotLimit($db, $userId);
        $counts      = $repo->countByOwner($userId);
        if ($counts['public'] >= $publicLimit) {
            JsonResponse::error('Ücretsiz herkese açık chatbot hakkınızı kullandınız.', 422, AppConfig::ERR_LIMIT_REACHED);
        }

        $sellerStatus = $repo->getSellerStatus($userId);
        if ($sellerStatus !== 'active') {
            JsonResponse::error('Önce Pazaryeri satıcı kaydınızı tamamlayın.', 422, AppConfig::ERR_SELLER_INACTIVE);
        }

        $repo->updateById($id, ['is_independent' => 0, 'ucret_haftalik' => $weekly, 'ucret_aylik' => $monthly]);
        JsonResponse::success(['message' => 'Chatbot herkese açık olarak yayınlandı!']);
    }

    public static function unpublishChatbot(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        $id     = InputSanitizer::positiveInt($data['id'] ?? 0);

        if (!$data || !$id) {
            JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);
        }

        $repo = new ChatbotRepository();
        $bot  = $repo->findById($id);

        if (!$bot || (int) $bot['author_user_id'] !== $userId) {
            JsonResponse::error('Bu chatbot üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        $repo->unpublish($id);
        JsonResponse::success(['message' => 'Chatbot yayından kaldırıldı.']);
    }

    public static function getChatbotsMenu(): void {
        $userId = AuthMiddleware::requireAuth();
        $repo   = new ChatbotRepository();
        JsonResponse::success(['bots' => $repo->getMenuItems($userId)]);
    }

    public static function getChatbotLimits(): void {
        require_once __DIR__ . '/../../../functions/chatbot_limits.php';
        $userId = AuthMiddleware::requireAuth();

        $db               = Database::getInstance();
        $repo             = new ChatbotRepository();
        $counts           = $repo->countByOwner($userId);
        $independentLimit = getIndependentBotLimit($db, $userId);
        $publicLimit      = getPublicBotLimit($db, $userId);

        JsonResponse::success([
            'independent_used'       => $counts['independent'],
            'independent_limit'      => $independentLimit,
            'public_used'            => $counts['public'],
            'public_limit'           => $publicLimit,
            'can_create_independent' => $counts['independent'] < $independentLimit,
            'can_create_public'      => $counts['public'] < $publicLimit,
        ]);
    }

    public static function getSuggested(): void {
        $userId = AuthMiddleware::optionalAuth();
        $limit  = InputSanitizer::positiveInt($_GET['limit'] ?? 3);

        if (!$userId) {
            JsonResponse::success(['bots' => []]);
        }

        $repo     = new ChatbotRepository();
        $cartRows = $repo->getCartCategoryIds($userId);

        if (empty($cartRows)) {
            JsonResponse::success(['bots' => []]);
        }

        $categoryIds = array_filter(array_unique(array_column($cartRows, 'kategori_id')));
        $excludeIds  = array_filter(array_column($cartRows, 'chatbot_id'));

        $results = $repo->getSuggested($userId, $categoryIds, $excludeIds, $limit ?: 3);

        foreach ($results as &$bot) {
            if (isset($bot['profil_fotografi']) && !str_starts_with($bot['profil_fotografi'], 'data:')) {
                $bot['profil_fotografi'] = 'data:image/jpeg;base64,' . $bot['profil_fotografi'];
            }
        }

        JsonResponse::success(['bots' => $results]);
    }

    public static function updateChatbotPrice(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;

        if (!$data || !isset($data['id'])) {
            JsonResponse::error('Veri veya Chatbot ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }

        $id      = InputSanitizer::positiveInt($data['id']);
        $weekly  = InputSanitizer::price($data['ucret_haftalik'] ?? 0);
        $monthly = InputSanitizer::price($data['ucret_aylik'] ?? 0);

        // InputSanitizer::price() only rejects negatives, not zero or
        // absurdly large values — this endpoint previously had no range
        // check at all (unlike publishChatbot's now-shared assertValidPrice),
        // so a seller could silently zero out or wildly overprice an
        // already-published bot via "Satış Listesine Ekle".
        self::assertValidPrice($weekly, 'Haftalık', AppConfig::MAX_WEEKLY_PRICE);
        self::assertValidPrice($monthly, 'Aylık', AppConfig::MAX_WEEKLY_PRICE * 4);

        $repo = new ChatbotRepository();

        // Previously had no ownership check at all — anyone who knew a
        // chatbot's id could change its price.
        if (!$repo->findByIdAndOwner($id, $userId)) {
            JsonResponse::error('Bu chatbot üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        $ok   = $repo->updatePrice($id, $weekly, $monthly);

        if ($ok) {
            JsonResponse::success(['message' => 'Fiyatlar başarıyla güncellendi!', 'id' => $id]);
        } else {
            JsonResponse::error('Güncelleme başarısız veya değişiklik yapılmadı.', 400);
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Single price-range check shared by publishChatbot and
     * updateChatbotPrice — previously each endpoint enforced a different
     * (or no) rule, so the same "set this bot's price" action behaved
     * inconsistently depending on which screen triggered it.
     */
    private static function assertValidPrice(float $value, string $label, float $max): void {
        if ($value <= 0 || $value > $max) {
            JsonResponse::error(
                sprintf('%s fiyat 0\'dan büyük ve en fazla %s₺ olmalıdır.', $label, number_format($max, 0, ',', '.')),
                400, AppConfig::ERR_VALIDATION
            );
        }
    }

    private static function handleImageUploads(array $data): array {
        foreach (['coverImage_file' => 'kapak_fotografi', 'profileImage_file' => 'profil_fotografi'] as $postKey => $dbCol) {
            if (!isset($_FILES[$postKey]) || $_FILES[$postKey]['error'] !== UPLOAD_ERR_OK) {
                continue;
            }

            $file = $_FILES[$postKey];
            if ($file['size'] > AppConfig::MAX_UPLOAD_SIZE_BYTES) {
                JsonResponse::error('Dosya boyutu 5 MB\'ı aşamaz.', 400, AppConfig::ERR_VALIDATION);
            }
            $mime = InputSanitizer::detectMime($file['tmp_name']);
            if (!in_array($mime, AppConfig::ALLOWED_IMAGE_MIMES, true)) {
                JsonResponse::error('Geçersiz dosya türü. Sadece resim yükleyebilirsiniz.', 400, AppConfig::ERR_VALIDATION);
            }

            // Extension is derived from the verified MIME type, never the
            // client-supplied filename — see InputSanitizer::extensionForMime().
            $ext       = InputSanitizer::extensionForMime($mime);
            $uploadDir = __DIR__ . '/../../../assets/' . $dbCol;
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $fileName = time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
            if (move_uploaded_file($file['tmp_name'], $uploadDir . '/' . $fileName)) {
                $data[$dbCol] = 'assets/' . $dbCol . '/' . $fileName;
            }
        }
        return $data;
    }
}
