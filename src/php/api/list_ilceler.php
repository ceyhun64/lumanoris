<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Geçersiz istek yöntemi.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require '../functions/ParamPosMarketplace.php';

$ilKodu = isset($_GET['il']) ? (int)$_GET['il'] : 0;
if ($ilKodu <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Geçerli bir il kodu gönderilmedi.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$cacheFile = sys_get_temp_dir() . '/param_ilceler_' . $ilKodu . '.json';
$cacheTtl = 15 * 60;
$bypassCache = isset($_GET['nocache']);

if (!$bypassCache && is_file($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    $cached = file_get_contents($cacheFile);
    if ($cached !== false && $cached !== '') {
        $decoded = json_decode($cached, true);
        $first = $decoded['items'][0] ?? null;
        $valid = is_array($first) && (int)($first['Ilce_Kodu'] ?? 0) > 0 && !empty($first['Ilce_Adi']);
        if ($valid) {
            echo $cached;
            exit;
        }
        @unlink($cacheFile);
    }
}

try {
    $param = new ParamPosMarketplace();
    $result = $param->listIlceler($ilKodu);
    if (!$result['success']) {
        throw new Exception($result['message'] ?: 'Param ilçe listesi alınamadı.');
    }
    $payload = json_encode([
        'success' => true,
        'il_kodu' => $ilKodu,
        'items' => $result['items'],
    ], JSON_UNESCAPED_UNICODE);
    @file_put_contents($cacheFile, $payload);
    echo $payload;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
