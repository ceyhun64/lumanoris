<?php
class NoteController {
    public static function addDialogBook(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        // B-02 — istemcinin JSON'u olduğu gibi insert()'e gidiyordu: tablo dışı
        // bir anahtar ham SQL hatası, tablo içi bir anahtar (created_at) sahte
        // veri demekti. Beyaz liste + uzunluk kırpma (ChatController deseni).
        $chatbotId = InputSanitizer::positiveInt($data['chatbot_id'] ?? 0);
        $name      = InputSanitizer::string($data['name'] ?? '', 255);
        $input     = InputSanitizer::text($data['input_message'] ?? '', 20000);
        $output    = InputSanitizer::text($data['output_message'] ?? '', 20000);

        if (!$chatbotId)      JsonResponse::error('chatbot_id gereklidir.', 400, AppConfig::ERR_VALIDATION);
        if (trim($name) === '') JsonResponse::error('Başlık boş olamaz.', 400, AppConfig::ERR_VALIDATION);

        $id = Database::getInstance()->insert('user_dialog_books', [
            'user_id'        => $userId,
            'chatbot_id'     => $chatbotId,
            'name'           => $name,
            'input_message'  => $input,
            'output_message' => $output,
        ]);
        JsonResponse::success(['message' => 'Yeni sohbet başarıyla başlatıldı!', 'id' => $id]);
    }

    public static function getDialogues(): void {
        // The dialogue book is a deliberately public feed (notes/page.jsx has a
        // "Paylaştıklarım" tab), but it was readable with no session at all, so
        // every user's input_message/output_message could be scraped from
        // outside the app entirely. The feed is only ever rendered inside the
        // authenticated dashboard, so requiring a session costs the product
        // nothing and takes it off the open internet.
        AuthMiddleware::requireAuth();

        // user_dialog_books.chatbot_id is already the real chatbot id (see
        // addDialogBook / DialogNotebookModal.jsx) — the previous query
        // joined it against chatbot_conversations.id as if it were a
        // conversation id, so every chatbot_isim/photo/category/owner field
        // always came back null.
        $results = Database::getInstance()->selectMulti(
            // `owner_kullanici_adi` BOTUN sahibi, diyaloğu paylaşan değil —
            // ikisi karıştırılmasın. Paylaşan `udb.user_id`; arayüzde
            // "Profil" düğmesi ona gittiği için adı da buradan geliyor.
            // `avatar` bilerek ÇEKİLMİYOR: longtext ve base64 gömülü
            // olabiliyor, 100 satırda yanıtı şişirirdi. Profil sayfası onu
            // kendi tekil isteğinde alıyor.
            "udb.*,
             udb.chatbot_id AS conversation_chatbot_id,
             c.owner_user_id, c.isim AS chatbot_isim, c.kategori_id AS chatbot_kategori_id,
             c.profil_fotografi AS chatbot_profil_fotografi,
             k.kullanici_adi AS owner_kullanici_adi,
             sharer.kullanici_adi AS sharer_kullanici_adi
             FROM user_dialog_books udb
             LEFT JOIN chatbotlar c ON udb.chatbot_id = c.id
             LEFT JOIN kullanicilar k ON c.owner_user_id = k.id
             LEFT JOIN kullanicilar sharer ON udb.user_id = sharer.id
             ORDER BY RAND() LIMIT 100",
            []
        );
        JsonResponse::success(['dialogues' => $results]);
    }

    public static function getDialogInteracts(): void {
        // Same feed as getDialogues, same reasoning: it returns other users'
        // comments and usernames, and is only rendered inside the dashboard.
        AuthMiddleware::requireAuth();

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

        // B-03 — ham $data doğrudan insert()'e gidiyordu; ayrıca dialog_id'nin
        // var olduğu hiç kontrol edilmiyor ve yorum kırpılmıyordu.
        // SocialController::addComment() ile birebir aynı desen.
        $dialogId = InputSanitizer::positiveInt($data['dialog_id'] ?? 0);
        // Sütun varchar(1000).
        $comment  = InputSanitizer::text($data['comment'] ?? '', 1000);

        if (!$dialogId) JsonResponse::error('dialog_id gereklidir.', 400, AppConfig::ERR_VALIDATION);
        if (trim($comment) === '') JsonResponse::error('Yorum boş olamaz.', 400, AppConfig::ERR_VALIDATION);

        $db = Database::getInstance();
        if (!$db->selectSingle('id FROM user_dialog_books WHERE id = ?', [$dialogId])) {
            JsonResponse::error('Diyalog bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);
        }

        $id = $db->insert('dialog_comments', [
            'user_id'   => $userId,
            'dialog_id' => $dialogId,
            'comment'   => $comment,
        ]);
        JsonResponse::success(['message' => 'Yorum eklendi.', 'id' => $id]);
    }

    public static function likeDialog(): void {
        require_method('POST');
        $userId   = AuthMiddleware::requireAuth();
        $data     = json_decode($_POST['data'] ?? '', true) ?? null;
        $dialogId = InputSanitizer::positiveInt($data['dialog_id'] ?? 0);
        if (!$data || !$dialogId) JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);

        $db = Database::getInstance();

        // C-02 — SELECT+INSERT yarışı UNIQUE (user_id, dialog_id) ihlaliyle
        // 500 üretiyordu. DELETE'in satır sayısı atomik "var mıydı?" cevabı.
        if ($db->delete('dialog_likes', 'user_id = ? AND dialog_id = ?', [$userId, $dialogId]) > 0) {
            JsonResponse::success(['action' => 'unliked', 'message' => 'Like kaldırıldı.']);
        }

        $id = $db->insert('dialog_likes', ['user_id' => $userId, 'dialog_id' => $dialogId], true);
        $db->delete('dialog_dislikes', 'user_id = ? AND dialog_id = ?', [$userId, $dialogId]);
        JsonResponse::success(['action' => 'liked', 'inserted_id' => $id, 'message' => 'Like eklendi.']);
    }

    public static function dislikeDialog(): void {
        require_method('POST');
        $userId   = AuthMiddleware::requireAuth();
        $data     = json_decode($_POST['data'] ?? '', true) ?? null;
        $dialogId = InputSanitizer::positiveInt($data['dialog_id'] ?? 0);
        if (!$data || !$dialogId) JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);

        $db = Database::getInstance();

        // C-02 — bkz. likeDialog(); aynı yarış, aynı çözüm.
        if ($db->delete('dialog_dislikes', 'user_id = ? AND dialog_id = ?', [$userId, $dialogId]) > 0) {
            JsonResponse::success(['action' => 'undisliked', 'message' => 'Dislike kaldırıldı.']);
        }

        $id = $db->insert('dialog_dislikes', ['user_id' => $userId, 'dialog_id' => $dialogId], true);
        $db->delete('dialog_likes', 'user_id = ? AND dialog_id = ?', [$userId, $dialogId]);
        JsonResponse::success(['action' => 'disliked', 'inserted_id' => $id, 'message' => 'Dislike eklendi.']);
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
