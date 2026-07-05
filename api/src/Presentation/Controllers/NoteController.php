<?php
class NoteController {
    public static function addDialogBook(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $data['user_id'] = $userId;
        $id = Database::getInstance()->insert('user_dialog_books', $data);
        JsonResponse::success(['message' => 'Yeni sohbet başarıyla başlatıldı!', 'id' => $id]);
    }

    public static function getDialogues(): void {
        // user_dialog_books.chatbot_id is already the real chatbot id (see
        // addDialogBook / DialogNotebookModal.jsx) — the previous query
        // joined it against chatbot_conversations.id as if it were a
        // conversation id, so every chatbot_isim/photo/category/owner field
        // always came back null.
        $results = Database::getInstance()->selectMulti(
            "udb.*,
             udb.chatbot_id AS conversation_chatbot_id,
             c.owner_user_id, c.isim AS chatbot_isim, c.kategori_id AS chatbot_kategori_id,
             c.profil_fotografi AS chatbot_profil_fotografi,
             k.kullanici_adi AS owner_kullanici_adi
             FROM user_dialog_books udb
             LEFT JOIN chatbotlar c ON udb.chatbot_id = c.id
             LEFT JOIN kullanicilar k ON c.owner_user_id = k.id
             ORDER BY RAND() LIMIT 100",
            []
        );
        echo json_encode($results);
        exit;
    }

    public static function getDialogInteracts(): void {
        $id = InputSanitizer::positiveInt($_GET['id'] ?? 0);
        if (!$id) JsonResponse::error('ID gereklidir.', 400, AppConfig::ERR_VALIDATION);

        $db = Database::getInstance();
        $likeDislike = $db->selectSingle(
            "udb.id,
             (SELECT COUNT(*) FROM dialog_likes WHERE dialog_id = udb.id) AS likes,
             (SELECT COUNT(*) FROM dialog_dislikes WHERE dialog_id = udb.id) AS dislikes
             FROM user_dialog_books udb WHERE udb.id = ?",
            [$id]
        );
        $comments = $db->selectMulti(
            "dc.id AS comment_id, dc.comment, dc.commented_at, k.kullanici_adi AS comment_owner
             FROM dialog_comments dc
             LEFT JOIN kullanicilar k ON dc.user_id = k.id
             WHERE dc.dialog_id = ?",
            [$id]
        );

        echo json_encode(['success' => true, 'dialog' => $likeDislike, 'comments' => $comments], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    public static function addComment(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $data['user_id'] = $userId;
        $id = Database::getInstance()->insert('dialog_comments', $data);
        JsonResponse::success(['message' => 'Yorum eklendi.', 'id' => $id]);
    }

    public static function likeDialog(): void {
        require_method('POST');
        $userId   = AuthMiddleware::requireAuth();
        $data     = json_decode($_POST['data'] ?? '', true) ?? null;
        $dialogId = InputSanitizer::positiveInt($data['dialog_id'] ?? 0);
        if (!$data || !$dialogId) JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);

        $db       = Database::getInstance();
        $existing = $db->selectSingle('id FROM dialog_likes WHERE user_id = ? AND dialog_id = ?', [$userId, $dialogId]);

        if ($existing) {
            $db->delete('dialog_likes', 'id = ?', [$existing['id']]);
            JsonResponse::success(['action' => 'unliked', 'message' => 'Like kaldırıldı.']);
        } else {
            $id = $db->insert('dialog_likes', ['user_id' => $userId, 'dialog_id' => $dialogId]);
            $db->delete('dialog_dislikes', 'user_id = ? AND dialog_id = ?', [$userId, $dialogId]);
            JsonResponse::success(['action' => 'liked', 'inserted_id' => $id, 'message' => 'Like eklendi.']);
        }
    }

    public static function dislikeDialog(): void {
        require_method('POST');
        $userId   = AuthMiddleware::requireAuth();
        $data     = json_decode($_POST['data'] ?? '', true) ?? null;
        $dialogId = InputSanitizer::positiveInt($data['dialog_id'] ?? 0);
        if (!$data || !$dialogId) JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);

        $db       = Database::getInstance();
        $existing = $db->selectSingle('id FROM dialog_dislikes WHERE user_id = ? AND dialog_id = ?', [$userId, $dialogId]);

        if ($existing) {
            $db->delete('dialog_dislikes', 'id = ?', [$existing['id']]);
            JsonResponse::success(['action' => 'undisliked', 'message' => 'Dislike kaldırıldı.']);
        } else {
            $id = $db->insert('dialog_dislikes', ['user_id' => $userId, 'dialog_id' => $dialogId]);
            $db->delete('dialog_likes', 'user_id = ? AND dialog_id = ?', [$userId, $dialogId]);
            JsonResponse::success(['action' => 'disliked', 'inserted_id' => $id, 'message' => 'Dislike eklendi.']);
        }
    }

    public static function didUserLike(): void {
        $userId   = AuthMiddleware::optionalAuth();
        $dialogId = InputSanitizer::positiveInt($_GET['dialog_id'] ?? 0);
        if (!$dialogId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $row = Database::getInstance()->selectSingle('id FROM dialog_likes WHERE user_id = ? AND dialog_id = ?', [$userId, $dialogId]);
        JsonResponse::success(['didLike' => (bool) $row]);
    }

    public static function didUserDislike(): void {
        $userId   = AuthMiddleware::optionalAuth();
        $dialogId = InputSanitizer::positiveInt($_GET['dialog_id'] ?? 0);
        if (!$dialogId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $row = Database::getInstance()->selectSingle('id FROM dialog_dislikes WHERE user_id = ? AND dialog_id = ?', [$userId, $dialogId]);
        JsonResponse::success(['didDisLike' => (bool) $row]);
    }
}
