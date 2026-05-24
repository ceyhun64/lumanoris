<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Geçersiz istek yöntemi.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require '../functions/db.php';
require '../functions/ParamPosMarketplace.php';

$database = Database::getInstance();

try {
    $limit = (int)($_GET['limit'] ?? 100);
    $skip = (int)($_GET['skip'] ?? 0);
    $limit = max(1, min(500, $limit));
    $skip = max(0, $skip);

    $param = new ParamPosMarketplace();
    $remote = $param->listSubMerchants($limit, $skip);

    if (!$remote['success']) {
        throw new Exception('ParamPOS sub-merchant listesi alınamadı: ' . $remote['message']);
    }

    $localRows = $database->selectMulti(
        'pms.user_id, pms.guid_altuyeisyeri, k.kullanici_adi, k.ad_soyad, k.eposta
         FROM param_marketplace_sellers pms
         LEFT JOIN kullanicilar k ON k.id = pms.user_id',
        []
    );

    $localByGuid = [];
    foreach ($localRows as $row) {
        $localByGuid[strtolower((string)$row['guid_altuyeisyeri'])] = $row;
    }

    $remoteByGuid = [];
    $merged = [];
    foreach ($remote['items'] as $item) {
        $guid = strtolower((string)($item['GUID_AltUyeIsyeri'] ?? $item['guid_altuyeisyeri'] ?? ''));
        if ($guid === '') {
            continue;
        }
        $remoteByGuid[$guid] = $item;

        $local = $localByGuid[$guid] ?? null;
        $merged[] = [
            'guid_altuyeisyeri' => $item['GUID_AltUyeIsyeri'] ?? $guid,
            'remote' => $item,
            'local_user_id' => $local ? (int)$local['user_id'] : null,
            'local_user_name' => $local['ad_soyad'] ?? $local['kullanici_adi'] ?? null,
            'in_local_db' => $local !== null,
        ];
    }

    $orphansLocal = [];
    foreach ($localRows as $row) {
        $guid = strtolower((string)$row['guid_altuyeisyeri']);
        if (!isset($remoteByGuid[$guid])) {
            $orphansLocal[] = [
                'user_id' => (int)$row['user_id'],
                'guid_altuyeisyeri' => $row['guid_altuyeisyeri'],
                'user_name' => $row['ad_soyad'] ?? $row['kullanici_adi'] ?? null,
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'remote_total' => $remote['total'],
        'returned' => count($merged),
        'merged' => $merged,
        'orphans_local_only' => $orphansLocal,
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
