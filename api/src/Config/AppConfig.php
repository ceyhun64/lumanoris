<?php
class AppConfig {
    // Subscription durations (days)
    const SUBSCRIPTION_WEEKLY  = 7;
    const SUBSCRIPTION_MONTHLY = 30;

    // Free plan limits
    const FREE_PUBLIC_BOT_LIMIT      = 2;
    const FREE_INDEPENDENT_BOT_LIMIT = 1;

    // Token expiry
    const REMEMBER_ME_DAYS = 30;

    // File upload
    const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const MAX_UPLOAD_SIZE_MB  = 5;

    // Pagination defaults
    const DEFAULT_PAGE_LIMIT = 20;

    // DB tables
    const TABLE_USERS        = 'kullanicilar';
    const TABLE_CHATBOTS     = 'chatbotlar';
    const TABLE_COMMENTS     = 'yorumlar';
    const TABLE_LISTS        = 'kullanici_listeleri';
    const TABLE_CART         = 'sepet';
    const TABLE_NOTIFICATIONS = 'bildirimler';
    const TABLE_CONVERSATIONS = 'konusmalar';
    const TABLE_USER_TOKENS   = 'user_tokens';
}
