<?php
class ChatController {
    public static function addChat(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $id = Database::getInstance()->insert('chatbot_chats', $data);
        JsonResponse::success(['message' => 'Mesaj kaydedildi!', 'id' => $id]);
    }

    public static function getChat(): void {
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);
        $userId    = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        if (!$chatbotId || !$userId) JsonResponse::error('chatbot_id ve user_id gereklidir.', 400, AppConfig::ERR_VALIDATION);

        $results = Database::getInstance()->selectMulti(
            'message, sent_by FROM chatbot_chats WHERE chatbot_id = ? AND user_id = ?',
            [$chatbotId, $userId]
        );
        echo json_encode($results);
        exit;
    }

    public static function addConversation(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $id = Database::getInstance()->insert('chatbot_conversations', $data);
        JsonResponse::success(['message' => 'Yeni sohbet başarıyla başlatıldı!', 'id' => $id]);
    }

    public static function getConversation(): void {
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);
        $userId    = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        $convId    = InputSanitizer::positiveInt($_GET['convId'] ?? 0);

        if (!$chatbotId || !$userId) JsonResponse::error('chatbot_id ve user_id gereklidir.', 400, AppConfig::ERR_VALIDATION);

        $db = Database::getInstance();

        if ($convId) {
            $result = $db->selectSingle('id, conversation_name FROM chatbot_conversations WHERE id = ?', [$convId]);
            if (empty($result)) {
                $result = $db->selectSingle(
                    'id, conversation_name FROM chatbot_conversations WHERE chatbot_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1',
                    [$chatbotId, $userId]
                );
            }
            if (empty($result)) {
                $result = [['id' => 0, 'conversation_name' => 'Yeni Sohbet']];
            }
        } else {
            $result = $db->selectSingle(
                'id, chatbot_id, conversation_name FROM chatbot_conversations WHERE chatbot_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1',
                [$chatbotId, $userId]
            );
            if (empty($result)) {
                $result = [['id' => 0, 'conversation_name' => 'Yeni Sohbet']];
            }
        }

        echo json_encode($result);
        exit;
    }

    public static function updateConversation(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['id'])) JsonResponse::error('Veri veya ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $id = InputSanitizer::positiveInt($data['id']);
        unset($data['id']);
        $updated = Database::getInstance()->update('chatbot_conversations', $data, 'id = ?', [$id]);

        if ($updated) {
            JsonResponse::success(['message' => 'Sohbet başarıyla güncellendi!', 'id' => $id]);
        } else {
            JsonResponse::error('Güncelleme başarısız!', 400);
        }
    }

    public static function deleteConversation(): void {
        require_method('POST');
        $id = InputSanitizer::positiveInt($_POST['id'] ?? 0);
        if (!$id) JsonResponse::error("Silinecek sohbet ID'si belirtilmedi.", 400, AppConfig::ERR_VALIDATION);

        $db = Database::getInstance();
        $db->delete('chatbot_conversations', 'id = ?', [$id]);
        $db->delete('chatbot_chats', 'chatbot_id = ?', [$id]);
        JsonResponse::success(['message' => 'Sohbet başarıyla silindi.', 'deleted_id' => $id]);
    }

    public static function getHistory(): void {
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        if (!$userId) JsonResponse::error('user_id gereklidir.', 400, AppConfig::ERR_VALIDATION);

        $results = Database::getInstance()->selectMulti(
            "cc.id, cc.chatbot_id, cc.conversation_name, cb.profil_fotografi,
             (SELECT bc_inner.message FROM chatbot_chats bc_inner WHERE bc_inner.chatbot_id = cc.id ORDER BY bc_inner.sent_time DESC LIMIT 1) AS latest_message,
             (SELECT bc_inner.sent_time FROM chatbot_chats bc_inner WHERE bc_inner.chatbot_id = cc.id ORDER BY bc_inner.sent_time DESC LIMIT 1) AS latest_sent_time
             FROM chatbot_conversations cc
             INNER JOIN chatbotlar cb ON cc.chatbot_id = cb.id
             WHERE cc.user_id = ? ORDER BY cc.id DESC",
            [$userId]
        );

        echo json_encode(['success' => true, 'message' => 'ok', 'results' => $results]);
        exit;
    }
}
