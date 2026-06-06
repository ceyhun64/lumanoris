<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Geçersiz istek yöntemi.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require '../functions/db.php';
require '../functions/checkout_payments.php';

$database = Database::getInstance();
$conn = $database->getConnection();

try {
    ensureParamMarketplaceTables($conn);

    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Geçerli bir user_id gönderilmedi.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $seller = $database->selectSingle(
        'status, guid_altuyeisyeri, tip, last_error, last_attempt_at FROM param_marketplace_sellers WHERE user_id = ?',
        [$userId]
    );

    $bank = $database->selectSingle(
        'id, account_type, full_name, authorized_first_name, authorized_last_name, company_title,
         tax_number, tax_office, id_number, phone, iban, il_kod, ilce_kod
         FROM banka_bilgileri WHERE user_id = ?',
        [$userId]
    );

    $hasBankInfo = false;
    $missing = [];
    if ($bank) {
        $required = ['account_type', 'phone', 'iban', 'il_kod', 'ilce_kod'];
        $typeMap = ['Bireysel Hesap' => 1, 'Şahıs Şirketi' => 2, 'Kurumsal Hesap' => 3];
        $tip = $typeMap[$bank['account_type'] ?? ''] ?? 1;
        if ($tip === 3) {
            $required = array_merge($required, ['authorized_first_name', 'authorized_last_name', 'company_title', 'tax_number', 'tax_office']);
        } elseif ($tip === 2) {
            $required = array_merge($required, ['full_name', 'id_number', 'tax_office']);
        } else {
            $required = array_merge($required, ['full_name', 'id_number']);
        }
        foreach ($required as $field) {
            if (empty($bank[$field])) {
                $missing[] = $field;
            }
        }
        $hasBankInfo = empty($missing);
    }

    $status = $seller['status'] ?? null;
    if ($status === null) {
        $status = $hasBankInfo ? 'kyc_filled' : 'not_started';
    } elseif ($status === 'not_started' && $hasBankInfo) {
        $status = 'kyc_filled';
    }

    echo json_encode([
        'success' => true,
        'status' => $status,
        'guid' => $seller['guid_altuyeisyeri'] ?? null,
        'tip' => $seller['tip'] ?? null,
        'last_error' => $seller['last_error'] ?? null,
        'last_attempt_at' => $seller['last_attempt_at'] ?? null,
        'has_bank_info' => $hasBankInfo,
        'missing_fields' => $missing,
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
