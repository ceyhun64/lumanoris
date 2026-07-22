<?php
class SocialController {
    // ── Likes ────────────────────────────────────────────────────────────────

    public static function likeChatbot(): void {
        require_method('POST');
        $userId    = AuthMiddleware::requireAuth();
        $data      = json_decode($_POST['data'] ?? '', true) ?? null;
        $chatbotId = InputSanitizer::positiveInt($data['chatbot_id'] ?? 0);

        if (!$data || !$chatbotId) JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);

        $db       = Database::getInstance();
        $existing = $db->selectSingle('id FROM chatbot_likes WHERE user_id = ? AND chatbot_id = ?', [$userId, $chatbotId]);

        if ($existing) {
            $deleted = $db->delete('chatbot_likes', 'id = ?', [$existing['id']]);
            JsonResponse::success(['action' => 'unliked', 'deleted' => $deleted, 'message' => 'Like kaldırıldı.']);
        } else {
            $id = $db->insert('chatbot_likes', ['user_id' => $userId, 'chatbot_id' => $chatbotId, 'liked_at' => date('Y-m-d H:i:s')]);
            $db->delete('chatbot_dislikes', 'user_id = ? AND chatbot_id = ?', [$userId, $chatbotId]);
            JsonResponse::success(['action' => 'liked', 'inserted_id' => $id, 'message' => 'Like eklendi.']);
        }
    }

    public static function dislikeChatbot(): void {
        require_method('POST');
        $userId    = AuthMiddleware::requireAuth();
        $data      = json_decode($_POST['data'] ?? '', true) ?? null;
        $chatbotId = InputSanitizer::positiveInt($data['chatbot_id'] ?? 0);

        if (!$data || !$chatbotId) JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);

        $db       = Database::getInstance();
        $existing = $db->selectSingle('id FROM chatbot_dislikes WHERE user_id = ? AND chatbot_id = ?', [$userId, $chatbotId]);

        if ($existing) {
            $deleted = $db->delete('chatbot_dislikes', 'id = ?', [$existing['id']]);
            JsonResponse::success(['action' => 'undisliked', 'deleted' => $deleted, 'message' => 'Dislike kaldırıldı.']);
        } else {
            $id = $db->insert('chatbot_dislikes', ['user_id' => $userId, 'chatbot_id' => $chatbotId, 'disliked_at' => date('Y-m-d H:i:s')]);
            $db->delete('chatbot_likes', 'user_id = ? AND chatbot_id = ?', [$userId, $chatbotId]);
            JsonResponse::success(['action' => 'disliked', 'inserted_id' => $id, 'message' => 'Dislike eklendi.']);
        }
    }

    public static function didUserLike(): void {
        $userId    = AuthMiddleware::optionalAuth();
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);
        if (!$chatbotId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $row = Database::getInstance()->selectSingle('id FROM chatbot_likes WHERE user_id = ? AND chatbot_id = ?', [$userId, $chatbotId]);
        JsonResponse::success(['didLike' => (bool) $row]);
    }

    // Bundles didUserLike/didUserDislike/didUserFollow into one round-trip —
    // ProfileCard.jsx and ChatbotCard.jsx each fired 2-3 separate GETs for
    // the same chatbot_id on mount (worse on a marketplace grid, where every
    // visible card repeats this). Same three underlying queries, same auth,
    // just returned together instead of over three requests.
    public static function getUserBotStatus(): void {
        $userId    = AuthMiddleware::optionalAuth();
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);
        if (!$chatbotId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $db = Database::getInstance();
        $didLike    = (bool) $db->selectSingle('id FROM chatbot_likes WHERE user_id = ? AND chatbot_id = ?', [$userId, $chatbotId]);
        $didDisLike = (bool) $db->selectSingle('id FROM chatbot_dislikes WHERE user_id = ? AND chatbot_id = ?', [$userId, $chatbotId]);
        $didFollow  = (bool) $db->selectSingle('id FROM chatbot_follows WHERE user_id = ? AND chatbot_id = ?', [$userId, $chatbotId]);

        JsonResponse::success(['didLike' => $didLike, 'didDisLike' => $didDisLike, 'didFollow' => $didFollow]);
    }

    public static function didUserDislike(): void {
        $userId    = AuthMiddleware::optionalAuth();
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);
        if (!$chatbotId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $row = Database::getInstance()->selectSingle('id FROM chatbot_dislikes WHERE user_id = ? AND chatbot_id = ?', [$userId, $chatbotId]);
        JsonResponse::success(['didDisLike' => (bool) $row]);
    }

    // ── Follows ──────────────────────────────────────────────────────────────

    public static function followChatbot(): void {
        require_method('POST');
        $userId    = AuthMiddleware::requireAuth();
        $data      = json_decode($_POST['data'] ?? '', true) ?? null;
        $chatbotId = InputSanitizer::positiveInt($data['chatbot_id'] ?? 0);

        if (!$data || !$chatbotId) JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);

        $db       = Database::getInstance();
        $existing = $db->selectSingle('id FROM chatbot_follows WHERE user_id = ? AND chatbot_id = ?', [$userId, $chatbotId]);

        if ($existing) {
            $deleted = $db->delete('chatbot_follows', 'id = ?', [$existing['id']]);
            JsonResponse::success(['action' => 'unfollowed', 'deleted' => $deleted, 'message' => 'Follow kaldırıldı.']);
        } else {
            $id = $db->insert('chatbot_follows', ['user_id' => $userId, 'chatbot_id' => $chatbotId, 'followed_at' => date('Y-m-d H:i:s')]);
            JsonResponse::success(['action' => 'follow', 'inserted_id' => $id, 'message' => 'Follow eklendi.']);
        }
    }

    public static function didUserFollow(): void {
        $userId    = AuthMiddleware::optionalAuth();
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);
        if (!$chatbotId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $row = Database::getInstance()->selectSingle('id FROM chatbot_follows WHERE user_id = ? AND chatbot_id = ?', [$userId, $chatbotId]);
        JsonResponse::success(['didFollow' => (bool) $row]);
    }

    // ── Comments ─────────────────────────────────────────────────────────────

    public static function addComment(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $data['user_id'] = $userId;
        $id = Database::getInstance()->insert('chatbot_comments', $data);
        JsonResponse::success(['message' => 'Yorum başarıyla eklendi', 'id' => $id]);
    }

    public static function getChatbotComments(): void {
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);
        if (!$chatbotId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $comments = Database::getInstance()->selectMulti(
            'cc.id, cc.chatbot_id, cc.user_id, cc.comment, cc.commented_at, u.kullanici_adi
             FROM chatbot_comments cc
             JOIN kullanicilar u ON u.id = cc.user_id
             WHERE cc.chatbot_id = ? ORDER BY cc.id DESC',
            [$chatbotId]
        );

        JsonResponse::success(['count' => count($comments), 'comments' => $comments]);
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    public static function addReport(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $chatbotId   = InputSanitizer::positiveInt($data['chatbot_id'] ?? 0);
        $reportedFor = is_array($data['reported_for'] ?? null) ? $data['reported_for'] : [];
        $detail      = InputSanitizer::text($data['report_detail'] ?? '', 2000);

        if (!$chatbotId || empty($reportedFor)) {
            JsonResponse::error('Eksik parametreler!', 400, AppConfig::ERR_VALIDATION);
        }

        $id = Database::getInstance()->insert('chatbot_reports', [
            'user_id'       => $userId,
            'chatbot_id'    => $chatbotId,
            'reported_for'  => implode(',', array_map('strval', $reportedFor)),
            'report_detail' => $detail,
        ]);

        JsonResponse::success(['message' => 'Bildirim kaydedildi', 'id' => $id]);
    }

    // ── Lists ─────────────────────────────────────────────────────────────────

    public static function addUserList(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $data['user_id'] = $userId;
        $id = Database::getInstance()->insert('user_lists', $data);
        JsonResponse::success(['message' => 'Liste eklendi!', 'listId' => $id]);
    }

    public static function addBotToList(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['list_id'])) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $listId = InputSanitizer::positiveInt($data['list_id']);
        $db     = Database::getInstance();

        // Previously anyone could add a bot to any list_id — verify it's the caller's own list.
        if (!$db->selectSingle('id FROM user_lists WHERE id = ? AND user_id = ?', [$listId, $userId])) {
            JsonResponse::error('Bu liste üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        $id = $db->insert('chatbot_in_list', $data);
        JsonResponse::success(['message' => 'Bot listeye eklendi.', 'id' => $id]);
    }

    public static function deleteBotFromList(): void {
        require_method('POST');
        $userId    = AuthMiddleware::requireAuth();
        $data      = json_decode($_POST['data'] ?? '', true) ?? null;
        $chatbotId = InputSanitizer::positiveInt($data['chatbot_id'] ?? 0);
        $listId    = InputSanitizer::positiveInt($data['list_id'] ?? 0);

        if (!$data || !$chatbotId || !$listId) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        $db = Database::getInstance();
        // Previously anyone could remove bots from any list_id — verify ownership first.
        if (!$db->selectSingle('id FROM user_lists WHERE id = ? AND user_id = ?', [$listId, $userId])) {
            JsonResponse::error('Bu liste üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        $db->delete('chatbot_in_list', 'chatbot_id = ? AND list_id = ?', [$chatbotId, $listId]);
        JsonResponse::success(['message' => 'Bot listeden kaldırıldı.']);
    }

    public static function getUserLists(): void {
        $userId = AuthMiddleware::requireAuth();

        $lists = Database::getInstance()->selectMulti('id, name FROM user_lists WHERE user_id = ?', [$userId]);
        JsonResponse::success(['lists' => $lists]);
    }

    public static function getBotLists(): void {
        $userId = AuthMiddleware::requireAuth();
        $botId  = InputSanitizer::positiveInt($_GET['botId'] ?? 0);
        if (!$botId) JsonResponse::error('botId gereklidir.', 400, AppConfig::ERR_VALIDATION);

        $lists = Database::getInstance()->selectMulti(
            'ul.id, ul.name,
             (SELECT COUNT(*) FROM chatbot_in_list cil WHERE cil.list_id = ul.id AND cil.chatbot_id = ?) as is_in_list
             FROM user_lists ul WHERE ul.user_id = ?',
            [$botId, $userId]
        );

        JsonResponse::success(['lists' => $lists]);
    }

    public static function getBotsOfList(): void {
        $listId = InputSanitizer::positiveInt($_GET['list_id'] ?? 0);
        if (!$listId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $bots = Database::getInstance()->selectMulti(
            "c.id, c.isim, c.profil_fotografi, c.ucret_haftalik,
             COUNT(DISTINCT cc.id) AS toplam_chats
             FROM chatbot_in_list cil
             JOIN chatbotlar c ON c.id = cil.chatbot_id
             INNER JOIN param_marketplace_sellers pms ON pms.user_id = c.author_user_id AND pms.status = 'active'
             LEFT JOIN chatbot_chats cc ON cc.chatbot_id = c.id
             WHERE cil.list_id = ? AND c.is_independent = 0
             GROUP BY c.id",
            [$listId]
        );

        JsonResponse::success(['count' => count($bots), 'bots' => $bots, 'total_chats' => array_sum(array_column($bots, 'toplam_chats'))]);
    }

    public static function getFollowedBots(): void {
        $userId = AuthMiddleware::requireAuth();

        $bots = Database::getInstance()->selectMulti(
            "c.id, c.isim, c.aciklama, c.profil_fotografi, c.kapak_fotografi, c.ucret_haftalik
             FROM chatbot_follows cf
             JOIN chatbotlar c ON c.id = cf.chatbot_id
             WHERE cf.user_id = ?",
            [$userId]
        );

        JsonResponse::success(['bots' => $bots]);
    }

    public static function deleteUserList(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? [];
        $id     = InputSanitizer::positiveInt($data['id'] ?? $_POST['id'] ?? 0);
        if (!$id) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $db = Database::getInstance();

        // Previously anyone could delete any list_id — verify ownership first.
        if (!$db->selectSingle('id FROM user_lists WHERE id = ? AND user_id = ?', [$id, $userId])) {
            JsonResponse::error('Bu liste üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        $db->delete('chatbot_in_list', 'list_id = ?', [$id]);
        $db->delete('user_lists', 'id = ?', [$id]);
        JsonResponse::success(['message' => 'Liste silindi.']);
    }

    // ── Hide / Uninterested ───────────────────────────────────────────────────

    public static function addHide(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $data['user_id'] = $userId;
        $id = Database::getInstance()->insert('chatbot_hide', $data);
        JsonResponse::success(['message' => 'Chatbot gizlendi.', 'id' => $id]);
    }

    public static function getHide(): void {
        $userId = AuthMiddleware::requireAuth();

        $rows = Database::getInstance()->selectMulti('chatbot_id FROM chatbot_hide WHERE user_id = ?', [$userId]);
        JsonResponse::success(['hidden' => array_column($rows, 'chatbot_id')]);
    }

    public static function addUninterest(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $data['user_id'] = $userId;
        $id = Database::getInstance()->insert('chatbot_uninterested', $data);
        JsonResponse::success(['message' => 'Kategori ilgi dışı olarak işaretlendi.', 'id' => $id]);
    }

    public static function getUninterest(): void {
        $userId = AuthMiddleware::requireAuth();

        $rows = Database::getInstance()->selectMulti('category_id FROM chatbot_uninterested WHERE user_id = ?', [$userId]);
        JsonResponse::success(['categories' => array_column($rows, 'category_id')]);
    }
}
