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

        $authorUserId  = InputSanitizer::positiveInt($data['author_user_id'] ?? 0);
        $isIndependent = !empty($data['is_independent']) ? 1 : 0;
        $data['is_independent'] = $isIndependent;

        $repo = new ChatbotRepository();

        if ($authorUserId > 0) {
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
        }

        if ($authorUserId > 0 && !$isIndependent) {
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
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);

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
        echo json_encode($repo->getPublished(['search' => $search !== '' ? $search : null]));
        exit;
    }

    public static function getChatbotsV2(): void {
        $userId = InputSanitizer::positiveInt($_GET['userId'] ?? 0);
        $search = InputSanitizer::string($_GET['search'] ?? '');
        $repo   = new ChatbotRepository();
        echo json_encode($repo->getPublishedV2($userId, ['search' => $search !== '' ? $search : null]));
        exit;
    }

    public static function updateChatbot(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;

        if (!$data || !isset($data['id'])) {
            JsonResponse::error('Veri veya ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }

        $data['owner_user_id'] = $data['author_user_id'] ?? $data['owner_user_id'] ?? null;
        $data = self::handleImageUploads($data);

        $id = (int) $data['id'];
        unset($data['id']);

        $repo = new ChatbotRepository();
        $repo->update($id, $data);
        JsonResponse::success(['message' => 'Chatbot başarıyla güncellendi!', 'id' => $id]);
    }

    public static function deleteChatbot(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? [];
        $id   = InputSanitizer::positiveInt($data['id'] ?? $_POST['id'] ?? 0);

        if (!$id) {
            JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }

        (new ChatbotRepository())->delete($id);
        JsonResponse::success(['message' => 'Chatbot silindi.']);
    }

    public static function publishChatbot(): void {
        require_method('POST');
        require_once __DIR__ . '/../../../functions/chatbot_limits.php';

        $data    = json_decode($_POST['data'] ?? '', true) ?? null;
        $id      = InputSanitizer::positiveInt($data['id'] ?? 0);
        $userId  = InputSanitizer::positiveInt($data['user_id'] ?? 0);
        $weekly  = isset($data['ucret_haftalik']) ? (float) $data['ucret_haftalik'] : 0;
        $monthly = isset($data['ucret_aylik'])    ? (float) $data['ucret_aylik']    : 0;

        if (!$data || !$id || !$userId) {
            JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);
        }
        if ($weekly <= 0 || $monthly <= 0) {
            JsonResponse::error('Haftalık ve aylık fiyatlar geçerli pozitif sayı olmalıdır.', 400, AppConfig::ERR_VALIDATION);
        }

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

        $repo->update($id, ['is_independent' => 0, 'ucret_haftalik' => $weekly, 'ucret_aylik' => $monthly]);
        JsonResponse::success(['message' => 'Chatbot herkese açık olarak yayınlandı!']);
    }

    public static function unpublishChatbot(): void {
        require_method('POST');
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        $id     = InputSanitizer::positiveInt($data['id'] ?? 0);
        $userId = InputSanitizer::positiveInt($data['user_id'] ?? 0);

        if (!$data || !$id || !$userId) {
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
        $userId = InputSanitizer::positiveInt($_GET['id'] ?? 0);
        $repo   = new ChatbotRepository();
        echo json_encode($repo->getMenuItems($userId));
        exit;
    }

    public static function getChatbotLimits(): void {
        require_once __DIR__ . '/../../../functions/chatbot_limits.php';
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);

        if (!$userId) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

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
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        $limit  = InputSanitizer::positiveInt($_GET['limit'] ?? 3);

        if (!$userId) {
            echo json_encode([]);
            exit;
        }

        $repo     = new ChatbotRepository();
        $cartRows = $repo->getCartCategoryIds($userId);

        if (empty($cartRows)) {
            echo json_encode([]);
            exit;
        }

        $categoryIds = array_filter(array_unique(array_column($cartRows, 'kategori_id')));
        $excludeIds  = array_filter(array_column($cartRows, 'chatbot_id'));

        $results = $repo->getSuggested($userId, $categoryIds, $excludeIds, $limit ?: 3);

        foreach ($results as &$bot) {
            if (isset($bot['profil_fotografi']) && !str_starts_with($bot['profil_fotografi'], 'data:')) {
                $bot['profil_fotografi'] = 'data:image/jpeg;base64,' . $bot['profil_fotografi'];
            }
        }

        echo json_encode($results);
        exit;
    }

    public static function updateChatbotPrice(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;

        if (!$data || !isset($data['id'])) {
            JsonResponse::error('Veri veya Chatbot ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }

        $id      = InputSanitizer::positiveInt($data['id']);
        $weekly  = InputSanitizer::price($data['ucret_haftalik'] ?? 0);
        $monthly = InputSanitizer::price($data['ucret_aylik'] ?? 0);

        $repo = new ChatbotRepository();
        $ok   = $repo->updatePrice($id, $weekly, $monthly);

        if ($ok) {
            JsonResponse::success(['message' => 'Fiyatlar başarıyla güncellendi!', 'id' => $id]);
        } else {
            JsonResponse::error('Güncelleme başarısız veya değişiklik yapılmadı.', 400);
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private static function handleImageUploads(array $data): array {
        foreach (['coverImage_file' => 'kapak_fotografi', 'profileImage_file' => 'profil_fotografi'] as $postKey => $dbCol) {
            if (!isset($_FILES[$postKey]) || $_FILES[$postKey]['error'] !== UPLOAD_ERR_OK) {
                continue;
            }

            $file = $_FILES[$postKey];
            if ($file['size'] > AppConfig::MAX_UPLOAD_SIZE_BYTES) {
                JsonResponse::error('Dosya boyutu 5 MB\'ı aşamaz.', 400, AppConfig::ERR_VALIDATION);
            }
            if (!InputSanitizer::isAllowedMime($file['tmp_name'], AppConfig::ALLOWED_IMAGE_MIMES)) {
                JsonResponse::error('Geçersiz dosya türü. Sadece resim yükleyebilirsiniz.', 400, AppConfig::ERR_VALIDATION);
            }

            $ext       = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
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
