<?php
class SellerController {
    public static function register(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        require_once __DIR__ . '/../../../functions/checkout_payments.php';

        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) {
            JsonResponse::error('Eksik veri.', 400, AppConfig::ERR_VALIDATION);
        }

        $db     = Database::getInstance();
        $conn   = $db->getConnection();

        ensureParamMarketplaceTables($conn);

        $bank = $db->selectSingle('* FROM banka_bilgileri WHERE user_id = ?', [$userId]);
        if (!$bank) {
            JsonResponse::error('Önce banka ve kimlik bilgilerinizi tamamlayın.', 422, AppConfig::ERR_VALIDATION);
        }

        $typeMap     = ['Bireysel Hesap' => 1, 'Şahıs Şirketi' => 2, 'Kurumsal Hesap' => 3];
        $tip         = $typeMap[$bank['account_type'] ?? ''] ?? 1;
        $isCorporate = ($tip === 3);
        $isSahis     = ($tip === 2);

        $required = ['phone', 'iban', 'il_kod', 'ilce_kod'];
        $required = array_merge($required, $isCorporate
            ? ['authorized_first_name', 'authorized_last_name', 'company_title', 'tax_number', 'tax_office', 'yetkili_kisi_dogum_tarihi']
            : ['full_name', 'id_number', 'tax_office', 'kisi_dogum_tarihi']);

        $missing = array_values(array_filter($required, fn($f) => empty($bank[$f])));
        if (!empty($missing)) {
            JsonResponse::error('Eksik alanlar: ' . implode(', ', $missing), 422, AppConfig::ERR_VALIDATION);
        }

        $existing = $db->selectSingle('id, status, guid_altuyeisyeri FROM param_marketplace_sellers WHERE user_id = ?', [$userId]);
        if ($existing && $existing['status'] === 'active' && !empty($existing['guid_altuyeisyeri'])) {
            echo json_encode(['success' => true, 'message' => 'Zaten aktif sub-merchant kaydınız var.', 'guid_altuyeisyeri' => $existing['guid_altuyeisyeri'], 'status' => 'active', 'idempotent' => true], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $user        = $db->selectSingle('eposta FROM kullanicilar WHERE id = ?', [$userId]);
        $email       = trim((string) ($user['eposta'] ?? ''));
        $adSoyad     = $isCorporate ? trim($bank['authorized_first_name'] . ' ' . $bank['authorized_last_name']) : trim((string) $bank['full_name']);
        $companyTitle = trim((string) ($bank['company_title'] ?? ''));
        $unvan       = $isCorporate ? $companyTitle : (($isSahis && $companyTitle !== '') ? $companyTitle : $adSoyad);
        $tcVn        = $isCorporate ? (string) $bank['tax_number'] : (string) $bank['id_number'];
        $ibanUnvan   = $isCorporate ? $companyTitle : $adSoyad;

        $addressParts = array_filter([
            $bank['mahalle'] ?? '', $bank['cadde'] ?? '', $bank['sokak'] ?? '',
            !empty($bank['bina_no'])   ? 'No: ' . $bank['bina_no'] : '',
            !empty($bank['kapi_no'])   ? 'Daire: ' . $bank['kapi_no'] : '',
            !empty($bank['posta_kodu']) ? $bank['posta_kodu'] : '',
        ], fn($p) => trim((string) $p) !== '');
        $address = trim(implode(' ', $addressParts)) ?: trim((string) ($bank['address'] ?? ''));

        $paramParams = [
            'Tip' => $tip, 'Ad_Soyad' => $adSoyad, 'Unvan' => $unvan ?: $adSoyad,
            'TC_VN'       => preg_replace('/\D+/', '', $tcVn),
            'GSM_No'      => ltrim(preg_replace('/\D+/', '', (string) $bank['phone']), '0'),
            'IBAN_No'     => preg_replace('/\s+/', '', strtoupper((string) $bank['iban'])),
            'IBAN_Unvan'  => $ibanUnvan ?: $adSoyad,
            'Adres'       => $address,
            'Il'          => (int) $bank['il_kod'],
            'Ilce'        => (int) $bank['ilce_kod'],
            'EPosta'      => $email,
            'Website'     => '',
            'MCC_Kod'     => '5815',
            'Vergi_Daire' => trim((string) ($bank['tax_office'] ?? '')),
        ];
        if (!$isCorporate) {
            $paramParams['Kisi_DogumTarihi'] = (string) ($bank['kisi_dogum_tarihi'] ?? '');
        }
        if ($isCorporate) {
            $paramParams['Yetkili_Kisi_TC']          = preg_replace('/\D+/', '', (string) $bank['id_number']);
            $paramParams['Yetkili_Kisi_DogumTarihi'] = (string) ($bank['yetkili_kisi_dogum_tarihi'] ?? '');
        }

        $param       = new ParamPosMarketplace();
        $result      = $param->addSubMerchant($paramParams);
        $now         = date('Y-m-d H:i:s');
        $payloadJson = json_encode($paramParams, JSON_UNESCAPED_UNICODE);

        if (!$result['success']) {
            $errMsg = $result['message'] ?: 'Param sub-merchant başvurusu reddedildi.';
            if ($existing) {
                $db->update('param_marketplace_sellers', ['status' => 'rejected', 'tip' => $tip, 'last_error' => $errMsg, 'last_attempt_at' => $now, 'param_payload_json' => $payloadJson], 'user_id = ?', [$userId]);
            } else {
                $db->insert('param_marketplace_sellers', ['user_id' => $userId, 'guid_altuyeisyeri' => '', 'status' => 'rejected', 'tip' => $tip, 'last_error' => $errMsg, 'last_attempt_at' => $now, 'param_payload_json' => $payloadJson]);
            }
            JsonResponse::error($errMsg, 422, AppConfig::ERR_PAYMENT, ['status' => 'rejected']);
        }

        $guid = (string) $result['guid_altuyeisyeri'];
        if ($existing) {
            $db->update('param_marketplace_sellers', ['guid_altuyeisyeri' => $guid, 'status' => 'active', 'tip' => $tip, 'last_error' => null, 'last_attempt_at' => $now, 'param_payload_json' => $payloadJson], 'user_id = ?', [$userId]);
        } else {
            $db->insert('param_marketplace_sellers', ['user_id' => $userId, 'guid_altuyeisyeri' => $guid, 'status' => 'active', 'tip' => $tip, 'last_error' => null, 'last_attempt_at' => $now, 'param_payload_json' => $payloadJson]);
        }

        echo json_encode(['success' => true, 'status' => 'active', 'guid_altuyeisyeri' => $guid, 'message' => 'Pazaryeri satıcı kaydınız oluşturuldu.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function list(): void {
        require_method('GET');
        AuthMiddleware::requireAdmin();
        $rows = Database::getInstance()->selectMulti(
            'pms.id, pms.user_id, pms.guid_altuyeisyeri, pms.created_at, pms.updated_at, k.kullanici_adi, k.ad_soyad, k.eposta
             FROM param_marketplace_sellers pms LEFT JOIN kullanicilar k ON k.id = pms.user_id ORDER BY pms.created_at DESC',
            []
        );
        echo json_encode(['success' => true, 'data' => $rows], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function listRemote(): void {
        AuthMiddleware::requireAdmin();
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        $result = (new ParamPosMarketplace())->listSubMerchants();
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function update(): void {
        require_method('POST');
        AuthMiddleware::requireAdmin();
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        $data   = json_decode($_POST['data'] ?? '', true) ?? [];
        $result = (new ParamPosMarketplace())->updateSubMerchant($data);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function delete(): void {
        require_method('POST');
        AuthMiddleware::requireAdmin();
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        $data   = json_decode($_POST['data'] ?? '', true) ?? [];
        $param  = new ParamPosMarketplace();
        $result = $param->deleteSubMerchant($data);
        if (!empty($data['user_id'])) {
            Database::getInstance()->delete('param_marketplace_sellers', 'user_id = ?', [InputSanitizer::positiveInt($data['user_id'])]);
        }
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function resubmit(): void {
        self::register();
    }

    public static function status(): void {
        require_method('GET');
        $userId = AuthMiddleware::requireAuth();
        require_once __DIR__ . '/../../../functions/checkout_payments.php';

        $db   = Database::getInstance();
        $conn = $db->getConnection();
        ensureParamMarketplaceTables($conn);

        $seller = $db->selectSingle('status, guid_altuyeisyeri, tip, last_error, last_attempt_at FROM param_marketplace_sellers WHERE user_id = ?', [$userId]);
        $bank   = $db->selectSingle('id, account_type, full_name, authorized_first_name, authorized_last_name, company_title, tax_number, tax_office, id_number, phone, iban, il_kod, ilce_kod FROM banka_bilgileri WHERE user_id = ?', [$userId]);

        $hasBankInfo = false;
        $missing     = [];
        if ($bank) {
            $required = ['account_type', 'phone', 'iban', 'il_kod', 'ilce_kod'];
            $typeMap  = ['Bireysel Hesap' => 1, 'Şahıs Şirketi' => 2, 'Kurumsal Hesap' => 3];
            $tip      = $typeMap[$bank['account_type'] ?? ''] ?? 1;
            if ($tip === 3)      $required = array_merge($required, ['authorized_first_name', 'authorized_last_name', 'company_title', 'tax_number', 'tax_office']);
            elseif ($tip === 2)  $required = array_merge($required, ['full_name', 'id_number', 'tax_office']);
            else                 $required = array_merge($required, ['full_name', 'id_number']);
            foreach ($required as $field) { if (empty($bank[$field])) $missing[] = $field; }
            $hasBankInfo = empty($missing);
        }

        $status = $seller['status'] ?? null;
        if ($status === null)                          $status = $hasBankInfo ? 'kyc_filled' : 'not_started';
        elseif ($status === 'not_started' && $hasBankInfo) $status = 'kyc_filled';

        echo json_encode([
            'success' => true, 'status' => $status, 'guid' => $seller['guid_altuyeisyeri'] ?? null,
            'tip' => $seller['tip'] ?? null, 'last_error' => $seller['last_error'] ?? null,
            'last_attempt_at' => $seller['last_attempt_at'] ?? null,
            'has_bank_info' => $hasBankInfo, 'missing_fields' => $missing,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function reconcile(): void {
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        require_once __DIR__ . '/../../../functions/checkout_payments.php';
        set_time_limit(300);

        $cronSecret = $_ENV['PARAM_RECONCILE_SECRET'] ?? $_SERVER['PARAM_RECONCILE_SECRET'] ?? getenv('PARAM_RECONCILE_SECRET') ?: '';
        $provided   = $_GET['secret'] ?? $_POST['secret'] ?? $_SERVER['HTTP_X_RECONCILE_SECRET'] ?? '';

        if ($cronSecret === '' || !hash_equals((string) $cronSecret, (string) $provided)) {
            JsonResponse::error('Yetkisiz.', 403, AppConfig::ERR_PERMISSION);
        }

        $db = Database::getInstance();
        reconcilePayments($db, $db->getConnection());
    }

    public static function refund(): void {
        require_method('POST');
        AuthMiddleware::requireAdmin();
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        require_once __DIR__ . '/../../../functions/checkout_payments.php';
        $data = json_decode($_POST['data'] ?? file_get_contents('php://input'), true) ?? null;
        $db   = Database::getInstance();
        processRefund($db, $db->getConnection(), $data ?? []);
    }

    public static function paramposCallback(): void {
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        require_once __DIR__ . '/../../../functions/checkout_payments.php';
        $db = Database::getInstance();
        handleParamCallback($db, $db->getConnection(), $_POST);
    }

    public static function listIller(): void {
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        $cacheFile   = sys_get_temp_dir() . '/param_iller.json';
        $cacheTtl    = 900;
        $bypassCache = isset($_GET['nocache']);

        if (!$bypassCache && is_file($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
            $cached  = file_get_contents($cacheFile);
            $decoded = $cached ? json_decode($cached, true) : null;
            $first   = $decoded['items'][0] ?? null;
            if (is_array($first) && (int) ($first['IL_Kodu'] ?? 0) > 0 && !empty($first['IL_Adi'])) {
                echo $cached; exit;
            }
            @unlink($cacheFile);
        }

        $result = (new ParamPosMarketplace())->listIller();
        if (!$result['success']) JsonResponse::error($result['message'] ?: 'Param il listesi alınamadı.', 502);

        $payload = json_encode(['success' => true, 'items' => $result['items']], JSON_UNESCAPED_UNICODE);
        @file_put_contents($cacheFile, $payload);
        echo $payload;
        exit;
    }

    public static function listIlceler(): void {
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        // Frontend (BankInfo.jsx, SellerOnboardingWizard.jsx) sends `il`, not `il_kodu`.
        $ilKodu    = InputSanitizer::positiveInt($_GET['il'] ?? 0);
        $cacheFile = sys_get_temp_dir() . '/param_ilceler_' . $ilKodu . '.json';
        $cacheTtl  = 900;

        if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
            $cached = file_get_contents($cacheFile);
            if ($cached !== false) { echo $cached; exit; }
        }

        $result  = (new ParamPosMarketplace())->listIlceler($ilKodu);
        $payload = json_encode($result, JSON_UNESCAPED_UNICODE);
        @file_put_contents($cacheFile, $payload);
        echo $payload;
        exit;
    }
}
