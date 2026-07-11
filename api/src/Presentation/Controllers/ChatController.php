<?php
class ChatController {
    public static function addChat(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $data['user_id'] = $userId;
        $id = Database::getInstance()->insert('chatbot_chats', $data);
        JsonResponse::success(['message' => 'Mesaj kaydedildi!', 'id' => $id]);
    }

    public static function getChat(): void {
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);
        $userId    = AuthMiddleware::requireAuth();
        if (!$chatbotId) JsonResponse::error('chatbot_id gereklidir.', 400, AppConfig::ERR_VALIDATION);

        $results = Database::getInstance()->selectMulti(
            'message, sent_by FROM chatbot_chats WHERE chatbot_id = ? AND user_id = ?',
            [$chatbotId, $userId]
        );
        JsonResponse::success(['messages' => $results]);
    }

    public static function addConversation(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $data['user_id'] = $userId;
        $id = Database::getInstance()->insert('chatbot_conversations', $data);
        JsonResponse::success(['message' => 'Yeni sohbet başarıyla başlatıldı!', 'id' => $id]);
    }

    public static function getConversation(): void {
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);
        $userId    = AuthMiddleware::requireAuth();
        $convId    = InputSanitizer::positiveInt($_GET['convId'] ?? 0);

        if (!$chatbotId) JsonResponse::error('chatbot_id gereklidir.', 400, AppConfig::ERR_VALIDATION);

        $db = Database::getInstance();

        if ($convId) {
            // Previously looked up by id alone — anyone could read another
            // user's conversation_name by guessing/incrementing convId.
            $result = $db->selectSingle('id, conversation_name FROM chatbot_conversations WHERE id = ? AND user_id = ?', [$convId, $userId]);
            if (empty($result)) {
                $result = $db->selectSingle(
                    'id, conversation_name FROM chatbot_conversations WHERE chatbot_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1',
                    [$chatbotId, $userId]
                );
            }
            if (empty($result)) {
                // Flat shape, matching the successful-lookup branch above —
                // this used to be array-wrapped ([[...]]), which meant
                // getconversation.php returned an inconsistent shape
                // depending on whether a row was found, and chat/page.jsx's
                // consumption of `conversation.id`/`conversation.chatbot_id`
                // silently broke on the not-found path.
                $result = ['id' => 0, 'conversation_name' => 'Yeni Sohbet'];
            }
        } else {
            $result = $db->selectSingle(
                'id, chatbot_id, conversation_name FROM chatbot_conversations WHERE chatbot_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1',
                [$chatbotId, $userId]
            );
            if (empty($result)) {
                // Flat shape, matching the successful-lookup branch above —
                // this used to be array-wrapped ([[...]]), which meant
                // getconversation.php returned an inconsistent shape
                // depending on whether a row was found, and chat/page.jsx's
                // consumption of `conversation.id`/`conversation.chatbot_id`
                // silently broke on the not-found path.
                $result = ['id' => 0, 'conversation_name' => 'Yeni Sohbet'];
            }
        }

        echo json_encode($result);
        exit;
    }

    public static function updateConversation(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['id'])) JsonResponse::error('Veri veya ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $id = InputSanitizer::positiveInt($data['id']);
        unset($data['id'], $data['user_id']);

        $db = Database::getInstance();
        // Previously had no ownership check — anyone could rename any conversation by id.
        if (!$db->selectSingle('id FROM chatbot_conversations WHERE id = ? AND user_id = ?', [$id, $userId])) {
            JsonResponse::error('Bu sohbet üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        $updated = $db->update('chatbot_conversations', $data, 'id = ?', [$id]);

        if ($updated) {
            JsonResponse::success(['message' => 'Sohbet başarıyla güncellendi!', 'id' => $id]);
        } else {
            JsonResponse::error('Güncelleme başarısız!', 400);
        }
    }

    public static function deleteConversation(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $id     = InputSanitizer::positiveInt($_POST['id'] ?? 0);
        if (!$id) JsonResponse::error("Silinecek sohbet ID'si belirtilmedi.", 400, AppConfig::ERR_VALIDATION);

        $db   = Database::getInstance();
        // Previously had no ownership check — anyone could delete any
        // conversation (and, transitively, wipe that bot's chat history) by id.
        $conv = $db->selectSingle('chatbot_id, user_id FROM chatbot_conversations WHERE id = ? AND user_id = ?', [$id, $userId]);
        if (!$conv) {
            JsonResponse::error('Bu sohbet üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        $db->delete('chatbot_conversations', 'id = ?', [$id]);

        // chatbot_chats has no per-conversation column (rows are keyed by
        // chatbot_id + user_id only), so this can only scope to "this user's
        // messages with this bot" — not the single conversation. That's still
        // correct in the common case of one conversation per bot per user.
        // Previously this used the conversation's own id as if it were the
        // chatbot's id, which could wipe an unrelated bot's messages for
        // every user that happened to share that numeric id.
        if ($conv) {
            $db->delete('chatbot_chats', 'chatbot_id = ? AND user_id = ?', [$conv['chatbot_id'], $conv['user_id']]);
        }

        JsonResponse::success(['message' => 'Sohbet başarıyla silindi.', 'deleted_id' => $id]);
    }

    public static function getHistory(): void {
        $userId = AuthMiddleware::requireAuth();

        // chatbot_chats has no per-conversation column (rows are keyed by
        // chatbot_id + user_id only — see the same note in
        // deleteConversation), so "latest message" can only be scoped to
        // "this user's messages with this bot", not the single conversation.
        // Previously this used the conversation's own id (cc.id) as if it
        // were the chatbot id, so the subquery never matched anything and
        // latest_message/latest_sent_time were always null.
        $results = Database::getInstance()->selectMulti(
            "cc.id, cc.chatbot_id, cc.conversation_name, cb.profil_fotografi,
             (SELECT bc_inner.message FROM chatbot_chats bc_inner WHERE bc_inner.chatbot_id = cc.chatbot_id AND bc_inner.user_id = cc.user_id ORDER BY bc_inner.sent_time DESC LIMIT 1) AS latest_message,
             (SELECT bc_inner.sent_time FROM chatbot_chats bc_inner WHERE bc_inner.chatbot_id = cc.chatbot_id AND bc_inner.user_id = cc.user_id ORDER BY bc_inner.sent_time DESC LIMIT 1) AS latest_sent_time
             FROM chatbot_conversations cc
             INNER JOIN chatbotlar cb ON cc.chatbot_id = cb.id
             WHERE cc.user_id = ? ORDER BY cc.id DESC",
            [$userId]
        );

        echo json_encode(['success' => true, 'message' => 'ok', 'results' => $results]);
        exit;
    }

    /**
     * Server-side proxy for the Gemini streaming call. The frontend used to
     * fetch the raw API key from /admin/ajax/readenv.php and call Google
     * directly from the browser — that endpoint requires an admin session
     * (which no regular user has, so chat was 403ing for everyone), and even
     * when it worked it handed the real API key to any client, visible in
     * devtools and reusable by anyone. The key never leaves the server now;
     * this just streams Gemini's SSE response straight through.
     */
    public static function generateReply(): void {
        require_method('POST');
        AuthMiddleware::requireAuth();

        $data             = json_decode($_POST['data'] ?? '', true) ?? null;
        $systemInstruction = $data['system_instruction'] ?? null;
        $message          = $data['message'] ?? null;
        if (!$data || $systemInstruction === null || $message === null) {
            JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);
        }

        $apiKey = AppConfig::googleGeminiApiKey();
        if (!$apiKey) {
            JsonResponse::error('Yapay zeka servisi yapılandırılmamış.', 500, AppConfig::ERR_SERVER);
        }

        $payload = json_encode([
            'contents' => [[
                'role'  => 'user',
                'parts' => [
                    ['text' => $systemInstruction],
                    ['text' => $message],
                ],
            ]],
        ]);

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent'
             . '?alt=sse&key=' . urlencode($apiKey);

        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('X-Accel-Buffering: no');
        while (ob_get_level() > 0) { ob_end_flush(); }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_WRITEFUNCTION  => static function ($handle, string $chunk): int {
                echo $chunk;
                @flush();
                return strlen($chunk);
            },
        ]);
        curl_exec($ch);
        curl_close($ch);
        exit;
    }
}
