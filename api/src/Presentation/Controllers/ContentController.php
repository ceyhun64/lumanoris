<?php
class ContentController {
    public static function getCategories(): void {
        $results = Database::getInstance()->selectMulti('id, kategori_adi_tr FROM chatbot_kategoriler', []);
        JsonResponse::success(['categories' => $results]);
        exit;
    }

    public static function getLandingImages(): void {
        JsonResponse::success(['content' => Database::getInstance()->getGlobalVars('anasayfa_resim1', 'anasayfa_resim2', 'anasayfa_resim3')]);
        exit;
    }

    public static function getAbout(): void {
        JsonResponse::success(['content' => Database::getInstance()->getGlobalVars('hakkinda')]);
        exit;
    }

    public static function getContactInfo(): void {
        JsonResponse::success(['content' => Database::getInstance()->getGlobalVars('email_adres', 'merkez_adres', 'telefon_numarasi')]);
        exit;
    }

    public static function getTermsOfSale(): void {
        JsonResponse::success(['content' => Database::getInstance()->getGlobalVars('satis_kosullari')]);
        exit;
    }

    public static function getDelivery(): void {
        JsonResponse::success(['content' => Database::getInstance()->getGlobalVars('teslimat_iade_sartlari')]);
        exit;
    }

    public static function getSocials(): void {
        JsonResponse::success(['content' => Database::getInstance()->getGlobalVars('facebook_link', 'instagram_link', 'twitter_link', 'youtube_link', 'linkedin_link', 'tiktok_link')]);
        exit;
    }

    public static function getPrivacy(): void {
        JsonResponse::success(['content' => Database::getInstance()->getGlobalVars('gizlilik_politikasi')]);
    }

    public static function getUsage(): void {
        JsonResponse::success(['content' => Database::getInstance()->getGlobalVars('kullanim_kosullari')]);
    }

    public static function getAdCounts(): void {
        JsonResponse::success(['content' => Database::getInstance()->getGlobalVars('chat_reklam_sikligi')]);
        exit;
    }

    public static function getOwner(): void {
        // B-10 — kimlik doğrulaması olmadan `user_id → kullanici_adi` eşlemesi
        // veriyordu: id'leri sırayla gezerek tüm kullanıcı adları toplanabilir
        // (numaralandırma). A-01'de silme adayı olarak da işaretli; silinene
        // kadar en azından oturum arkasında.
        AuthMiddleware::requireAuth();

        $userId = InputSanitizer::positiveInt($_GET['id'] ?? 0);
        if (!$userId) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $user = Database::getInstance()->selectSingle('kullanici_adi FROM kullanicilar WHERE id = ?', [$userId]);
        JsonResponse::success(['kullanici_adi' => $user['kullanici_adi'] ?? null]);
    }
}
