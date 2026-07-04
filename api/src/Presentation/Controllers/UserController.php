<?php
class UserController {
    public static function getUserHeader(): void {
        $userId = InputSanitizer::positiveInt($_GET['id'] ?? 0);
        if (!$userId) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $repo = new UserRepository();
        $user = $repo->findById($userId);
        if (!$user) JsonResponse::error('Kullanıcı bulunamadı!', 404, AppConfig::ERR_NOT_FOUND);

        $count = (int) Database::getInstance()->count(AppConfig::TABLE_CHATBOTS, 'author_user_id = ?', [$userId]);

        JsonResponse::success([
            'id'           => $user['id'],
            'fullname'     => $user['ad_soyad'],
            'username'     => $user['kullanici_adi'],
            'chatbotCount' => $count,
        ]);
    }

    public static function getUserNames(): void {
        $userId = InputSanitizer::positiveInt($_GET['id'] ?? 0);
        if (!$userId) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $repo = new UserRepository();
        $user = $repo->findById($userId);
        if (!$user) JsonResponse::error('Kullanıcı bulunamadı!', 404, AppConfig::ERR_NOT_FOUND);

        JsonResponse::success(['id' => $user['id'], 'fullname' => $user['ad_soyad'], 'username' => $user['kullanici_adi']]);
    }

    public static function updateUserNames(): void {
        require_method('POST');
        $userId = InputSanitizer::positiveInt($_POST['id'] ?? 0);
        if (!$userId) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $adSoyad      = InputSanitizer::string($_POST['ad_soyad'] ?? '', 100);
        $kullaniciAdi = InputSanitizer::string($_POST['kullanici_adi'] ?? '', 60);

        if (!$adSoyad && !$kullaniciAdi) {
            JsonResponse::error('Güncellenecek alan bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }

        $updates = [];
        if ($adSoyad)      $updates['ad_soyad']      = $adSoyad;
        if ($kullaniciAdi) $updates['kullanici_adi']  = $kullaniciAdi;

        (new UserRepository())->updateById($userId, $updates);
        JsonResponse::success(['message' => 'Kullanıcı güncellendi.']);
    }

    public static function getUserEmail(): void {
        $userId = InputSanitizer::positiveInt($_GET['id'] ?? 0);
        if (!$userId) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $user = (new UserRepository())->findById($userId);
        if (!$user) JsonResponse::error('Kullanıcı bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);

        JsonResponse::success(['id' => $user['id'], 'email' => $user['eposta']]);
    }

    public static function updateUserEmail(): void {
        require_method('POST');
        $userId   = InputSanitizer::positiveInt($_POST['id'] ?? 0);
        $newEmail = InputSanitizer::email($_POST['email'] ?? '');

        if (!$userId)   JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        if (!$newEmail) JsonResponse::error('Yeni e-posta adresi zorunludur!', 400, AppConfig::ERR_VALIDATION);
        if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
            JsonResponse::error('Geçerli bir e-posta adresi girin.', 400, AppConfig::ERR_VALIDATION);
        }

        $ok = (new UserRepository())->updateById($userId, ['eposta' => $newEmail]);
        if ($ok) {
            JsonResponse::success(['message' => 'E-posta güncellendi.']);
        } else {
            JsonResponse::error('E-posta güncellenemedi veya kullanıcı bulunamadı.', 400);
        }
    }

    public static function getUserPhone(): void {
        $userId = InputSanitizer::positiveInt($_GET['id'] ?? 0);
        if (!$userId) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $user = (new UserRepository())->findById($userId);
        if (!$user) JsonResponse::error('Kullanıcı bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);

        JsonResponse::success(['id' => $user['id'], 'telefon' => $user['telefon'] ?? null]);
    }

    public static function updateUserPhone(): void {
        require_method('POST');
        $userId  = InputSanitizer::positiveInt($_POST['id'] ?? 0);
        $telefon = InputSanitizer::string($_POST['telefon'] ?? '', 20);

        if (!$userId)  JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        if (!$telefon) JsonResponse::error('Telefon numarası zorunludur!', 400, AppConfig::ERR_VALIDATION);

        $ok = (new UserRepository())->updateById($userId, ['telefon' => $telefon]);
        if ($ok) {
            JsonResponse::success(['message' => 'Telefon numarası güncellendi.']);
        } else {
            JsonResponse::error('Telefon güncellenemedi veya kullanıcı bulunamadı.', 400);
        }
    }

    public static function uploadProfilePhoto(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $userId = InputSanitizer::positiveInt($data['id'] ?? 0);
        $avatar = $data['avatar'] ?? null;

        if (!$userId || !$avatar) {
            JsonResponse::error('Eksik alanlar!', 400, AppConfig::ERR_VALIDATION);
        }

        $ok = (new UserRepository())->updateById($userId, ['avatar' => $avatar]);
        if ($ok) {
            JsonResponse::success(['message' => 'Profil fotoğrafı güncellendi.', 'user_id' => $userId]);
        } else {
            JsonResponse::error('Güncelleme yapılamadı veya değişiklik yok.', 400);
        }
    }

    public static function getProfilePhoto(): void {
        $userId = InputSanitizer::positiveInt($_GET['id'] ?? 0);
        if (!$userId) JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $user   = (new UserRepository())->findById($userId);
        $avatar = isset($user['avatar']) ? preg_replace('/\s+/', '', $user['avatar']) : null;

        echo json_encode(
            ['success' => true, 'avatar' => (!empty($avatar) ? $avatar : null)],
            JSON_UNESCAPED_SLASHES
        );
        exit;
    }
}
