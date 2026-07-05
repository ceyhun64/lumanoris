<?php
class MessageController {
    public static function checkMessageAllowance(): void {
        require_once __DIR__ . '/../../../functions/coin_engine.php';

        $userId    = AuthMiddleware::requireAuth();
        $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);
        if (!$chatbotId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $db      = Database::getInstance();
        $credit  = getActivePurchaseCredit($db, $userId, $chatbotId);
        $balance = getOrInitCoinBalance($db, $userId);

        JsonResponse::success([
            'purchase_credit_remaining' => $credit ? (int) $credit['credits_remaining'] : 0,
            'daily_coins_remaining'     => (int) $balance['coins_remaining'],
            'retry_at'                  => (!$credit && (int) $balance['coins_remaining'] <= 0 && $balance['exhausted_at'])
                ? date('Y-m-d H:i:s', strtotime($balance['exhausted_at']) + 86400)
                : null,
        ]);
    }

    public static function consumeMessage(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        require_once __DIR__ . '/../../../functions/coin_engine.php';

        $data      = json_decode($_POST['data'] ?? '', true) ?? null;
        $chatbotId = InputSanitizer::positiveInt($data['chatbot_id'] ?? 0);
        if (!$chatbotId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $result = consumeMessage(Database::getInstance(), $userId, $chatbotId);
        echo json_encode(array_merge(['success' => true], $result));
        exit;
    }
}
