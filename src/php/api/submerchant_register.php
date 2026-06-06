<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Geçersiz istek yöntemi.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require '../functions/db.php';
require '../functions/ParamPosMarketplace.php';
require '../functions/checkout_payments.php';

$database = Database::getInstance();
$conn = $database->getConnection();
$data = json_decode($_POST['data'] ?? '', true);

if (!$data || empty($data['user_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Eksik veri.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    ensureParamMarketplaceTables($conn);

    $userId = (int)$data['user_id'];

    $bank = $database->selectSingle(
        '* FROM banka_bilgileri WHERE user_id = ?',
        [$userId]
    );
    if (!$bank) {
        throw new Exception('Önce banka ve kimlik bilgilerinizi tamamlayın.');
    }

    $typeMap = ['Bireysel Hesap' => 1, 'Şahıs Şirketi' => 2, 'Kurumsal Hesap' => 3];
    $tip = $typeMap[$bank['account_type'] ?? ''] ?? 1;
    $isCorporate = ($tip === 3);
    $isSahis = ($tip === 2);

    $required = ['phone', 'iban', 'il_kod', 'ilce_kod'];
    if ($tip === 3) {
        $required = array_merge($required, ['authorized_first_name', 'authorized_last_name', 'company_title', 'tax_number', 'tax_office', 'yetkili_kisi_dogum_tarihi']);
    } elseif ($tip === 2) {
        $required = array_merge($required, ['full_name', 'id_number', 'tax_office', 'kisi_dogum_tarihi']);
    } else {
        $required = array_merge($required, ['full_name', 'id_number', 'tax_office', 'kisi_dogum_tarihi']);
    }
    $missing = [];
    foreach ($required as $field) {
        if (empty($bank[$field])) {
            $missing[] = $field;
        }
    }
    if (!empty($missing)) {
        throw new Exception('Eksik alanlar: ' . implode(', ', $missing));
    }

    $existing = $database->selectSingle(
        'id, status, guid_altuyeisyeri FROM param_marketplace_sellers WHERE user_id = ?',
        [$userId]
    );
    if ($existing && $existing['status'] === 'active' && !empty($existing['guid_altuyeisyeri'])) {
        echo json_encode([
            'success' => true,
            'message' => 'Zaten aktif sub-merchant kaydınız var.',
            'guid_altuyeisyeri' => $existing['guid_altuyeisyeri'],
            'status' => 'active',
            'idempotent' => true,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $user = $database->selectSingle('eposta, kullanici_adi, ad_soyad FROM kullanicilar WHERE id = ?', [$userId]);
    $email = trim((string)($user['eposta'] ?? ''));

    $adSoyad = $isCorporate
        ? trim($bank['authorized_first_name'] . ' ' . $bank['authorized_last_name'])
        : trim((string)$bank['full_name']);
    $companyTitle = trim((string)($bank['company_title'] ?? ''));
    $unvan = $isCorporate ? $companyTitle : (($isSahis && $companyTitle !== '') ? $companyTitle : $adSoyad);
    $tcVn = $isCorporate ? (string)$bank['tax_number'] : (string)$bank['id_number'];
    $ibanUnvan = $isCorporate ? $companyTitle : $adSoyad;

    $addressParts = array_filter([
        $bank['mahalle'] ?? '',
        $bank['cadde'] ?? '',
        $bank['sokak'] ?? '',
        !empty($bank['bina_no']) ? 'No: ' . $bank['bina_no'] : '',
        !empty($bank['kapi_no']) ? 'Daire: ' . $bank['kapi_no'] : '',
        !empty($bank['posta_kodu']) ? $bank['posta_kodu'] : '',
    ], static function ($part) {
        return trim((string)$part) !== '';
    });
    $address = trim(implode(' ', $addressParts));
    if ($address === '') {
        $address = trim((string)($bank['address'] ?? ''));
    }

    $paramParams = [
        'Tip' => $tip,
        'Ad_Soyad' => $adSoyad,
        'Unvan' => $unvan !== '' ? $unvan : $adSoyad,
        'TC_VN' => preg_replace('/\D+/', '', $tcVn),
        'GSM_No' => ltrim(preg_replace('/\D+/', '', (string)$bank['phone']), '0'),
        'IBAN_No' => preg_replace('/\s+/', '', strtoupper((string)$bank['iban'])),
        'IBAN_Unvan' => $ibanUnvan !== '' ? $ibanUnvan : $adSoyad,
        'Adres' => $address,
        'Il' => (int)$bank['il_kod'],
        'Ilce' => (int)$bank['ilce_kod'],
        'EPosta' => $email,
        'Website' => '',
        'MCC_Kod' => '5815',
    ];

    $paramParams['Vergi_Daire'] = trim((string)($bank['tax_office'] ?? ''));

    if (!$isCorporate) {
        $paramParams['Kisi_DogumTarihi'] = (string)($bank['kisi_dogum_tarihi'] ?? '');
    }

    if ($isCorporate) {
        $paramParams['Yetkili_Kisi_TC'] = preg_replace('/\D+/', '', (string)$bank['id_number']);
        $paramParams['Yetkili_Kisi_DogumTarihi'] = (string)($bank['yetkili_kisi_dogum_tarihi'] ?? '');
    }

    $param = new ParamPosMarketplace();
    $result = $param->addSubMerchant($paramParams);

    $now = date('Y-m-d H:i:s');
    $payloadJson = json_encode($paramParams, JSON_UNESCAPED_UNICODE);

    if (!$result['success']) {
        $errMsg = $result['message'] ?: 'Param sub-merchant başvurusu reddedildi.';
        if ($existing) {
            $database->update('param_marketplace_sellers', [
                'status' => 'rejected',
                'tip' => $tip,
                'last_error' => $errMsg,
                'last_attempt_at' => $now,
                'param_payload_json' => $payloadJson,
            ], 'user_id = ?', [$userId]);
        } else {
            $database->insert('param_marketplace_sellers', [
                'user_id' => $userId,
                'guid_altuyeisyeri' => '',
                'status' => 'rejected',
                'tip' => $tip,
                'last_error' => $errMsg,
                'last_attempt_at' => $now,
                'param_payload_json' => $payloadJson,
            ]);
        }

        try {
            $database->insert('param_marketplace_alerts', [
                'alert_type' => 'submerchant_register_failed',
                'severity' => 'warning',
                'user_id' => null,
                'seller_user_id' => $userId,
                'message' => $errMsg,
                'context_json' => json_encode(['tip' => $tip], JSON_UNESCAPED_UNICODE),
            ]);
        } catch (Throwable $ignored) { /* alert log best effort */ }

        echo json_encode([
            'success' => false,
            'status' => 'rejected',
            'message' => $errMsg,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $guid = (string)$result['guid_altuyeisyeri'];
    if ($existing) {
        $database->update('param_marketplace_sellers', [
            'guid_altuyeisyeri' => $guid,
            'status' => 'active',
            'tip' => $tip,
            'last_error' => null,
            'last_attempt_at' => $now,
            'param_payload_json' => $payloadJson,
        ], 'user_id = ?', [$userId]);
    } else {
        $database->insert('param_marketplace_sellers', [
            'user_id' => $userId,
            'guid_altuyeisyeri' => $guid,
            'status' => 'active',
            'tip' => $tip,
            'last_error' => null,
            'last_attempt_at' => $now,
            'param_payload_json' => $payloadJson,
        ]);
    }

    echo json_encode([
        'success' => true,
        'status' => 'active',
        'guid_altuyeisyeri' => $guid,
        'message' => 'Pazaryeri satıcı kaydınız oluşturuldu.',
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
