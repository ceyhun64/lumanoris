<?php
/**
 * Application-wide constants.
 * Single source of truth for all magic numbers and configuration values.
 */
final class AppConfig {
    // ── Subscription durations ─────────────────────────────────────────────
    const SUBSCRIPTION_WEEKLY  = 7;
    const SUBSCRIPTION_MONTHLY = 30;

    // ── Free-plan bot limits ───────────────────────────────────────────────
    const FREE_INDEPENDENT_BOT_LIMIT = 1;
    const FREE_PUBLIC_BOT_LIMIT      = 2;

    // ── Producer-plan bot limits ───────────────────────────────────────────
    const PRODUCER_INDEPENDENT_LIMIT = 10;
    const PRODUCER_PUBLIC_LIMIT      = 20;

    // ── Daily free messages (coin system) ─────────────────────────────────
    const DAILY_FREE_MESSAGES = 10;

    // ── Auth ───────────────────────────────────────────────────────────────
    const REMEMBER_ME_DAYS = 30;

    // ── File upload ────────────────────────────────────────────────────────
    const ALLOWED_IMAGE_TYPES  = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ALLOWED_IMAGE_MIMES  = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const MAX_UPLOAD_SIZE_MB   = 5;
    const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

    // ── Pagination ─────────────────────────────────────────────────────────
    const DEFAULT_PAGE_LIMIT = 20;

    // ── Marketplace ────────────────────────────────────────────────────────
    const SERVICE_FEE_PERCENT  = 5;
    const SERVICE_FEE_EXEMPT_ABOVE = 1000; // ₺
    const DISCOUNT_MONTHLY_FACTOR  = 0.9;  // 10% discount on monthly subscription
    const SELLER_COMMISSION_WEEKLY  = 0.85; // Seller keeps 85% of weekly sales
    const SELLER_COMMISSION_MONTHLY = 0.80; // Seller keeps 80% of monthly sales

    // ── Database table names ───────────────────────────────────────────────
    const TABLE_USERS          = 'kullanicilar';
    const TABLE_CHATBOTS       = 'chatbotlar';
    const TABLE_CART           = 'user_cart';
    const TABLE_SUBSCRIPTIONS  = 'user_subscriptions';
    const TABLE_NOTIFICATIONS  = 'notifications';
    const TABLE_CONVERSATIONS  = 'chatbot_conversations';
    const TABLE_CHATS          = 'chatbot_chats';
    const TABLE_LIKES          = 'chatbot_likes';
    const TABLE_DISLIKES       = 'chatbot_dislikes';
    const TABLE_FOLLOWS        = 'chatbot_follows';
    const TABLE_COMMENTS       = 'chatbot_comments';
    const TABLE_LISTS          = 'user_lists';
    const TABLE_LIST_ITEMS     = 'chatbot_in_list';
    const TABLE_USER_TOKENS    = 'user_tokens';
    const TABLE_BANK_INFO      = 'banka_bilgileri';
    const TABLE_SELLERS        = 'param_marketplace_sellers';
    const TABLE_DIALOG_BOOKS   = 'user_dialog_books';
    const TABLE_COIN_BALANCES  = 'user_coin_balance';
    const TABLE_PURCHASE_CREDITS = 'chatbot_purchase_credits';

    // ── Error codes ────────────────────────────────────────────────────────
    const ERR_VALIDATION       = 'VALIDATION_ERROR';
    const ERR_AUTH_REQUIRED    = 'AUTH_REQUIRED';
    const ERR_NOT_FOUND        = 'NOT_FOUND';
    const ERR_PERMISSION       = 'PERMISSION_DENIED';
    const ERR_LIMIT_REACHED    = 'LIMIT_REACHED';
    const ERR_SELLER_INACTIVE  = 'SELLER_NOT_ACTIVE';
    const ERR_DUPLICATE        = 'DUPLICATE_ENTRY';
    const ERR_SERVER           = 'SERVER_ERROR';
    const ERR_PAYMENT          = 'PAYMENT_ERROR';

    // ── External config (from environment / bootstrap) ────────────────────
    const LUMANORIS_USERNAME   = 'lumanoris';

    public static function googleClientId(): string {
        return $_ENV['GOOGLE_CLIENT_ID'] ?? getenv('GOOGLE_CLIENT_ID') ?: '';
    }

    public static function contactEmail(): string {
        return $_ENV['CONTACT_EMAIL'] ?? getenv('CONTACT_EMAIL') ?: 'alperkum.cs@gmail.com';
    }

    public static function noreplyEmail(): string {
        return $_ENV['NOREPLY_EMAIL'] ?? getenv('NOREPLY_EMAIL') ?: 'no-reply@seninsiten.com';
    }

    /**
     * The admin panel (admin/api.php + admin/ajax/updateenv.php) manages this
     * key in api/admin/.env, not the app-root api/.env that bootstrap.php
     * loads into $_ENV — so it has to be read from that file directly.
     */
    public static function googleGeminiApiKey(): string {
        if ($_ENV['API_GOOGLE_GEMINI'] ?? getenv('API_GOOGLE_GEMINI') ?: '') {
            return $_ENV['API_GOOGLE_GEMINI'] ?? getenv('API_GOOGLE_GEMINI');
        }

        $envFile = __DIR__ . '/../../../admin/.env';
        if (!is_file($envFile)) {
            return '';
        }
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            $pos = strpos($line, '=');
            if ($pos === false) continue;
            $key = trim(substr($line, 0, $pos));
            if ($key === 'API_GOOGLE_GEMINI') {
                return trim(substr($line, $pos + 1), " \t\"'");
            }
        }
        return '';
    }
}
