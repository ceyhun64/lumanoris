<?php
/**
 * SEC-001 / DEP-002: PHP'nin varsayılan davranışı, error_log yönergesi
 * tanımlı değilken hataları çalışan script'in dizinine yazmak. Bu yüzden
 * api/admin/error_log oluştu ve HTTP üzerinden indirilebiliyordu — içinde
 * stack trace'ler, DSN'ler ve (ParamPosMarketplace json_encode($params)
 * logladığı için) TC kimlik no + IBAN değerleri vardı.
 *
 * Burada log hedefi doküman kökünün DIŞINA sabitleniyor ve dizin oluşturuluyor.
 * APP_LOG_FILE ile override edilebilir.
 */
require_once __DIR__ . '/env.php';

function configure_error_log(): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;

    env_load();

    $target = env_get('APP_LOG_FILE');
    if ($target === null || trim($target) === '') {
        // api/functions -> api -> repo kökü
        $target = __DIR__ . '/../../storage/logs/php-error.log';
    }

    $dir = dirname($target);
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    if (!is_dir($dir)) {
        return; // yazamıyorsak PHP varsayılanına dokunma, sessizce vazgeç
    }

    ini_set('log_errors', '1');
    ini_set('error_log', $target);

    // Hata metinleri asla yanıta karışmamalı; APP_DEBUG yalnızca yerelde açık.
    if (!env_bool('APP_DEBUG', false)) {
        ini_set('display_errors', '0');
        ini_set('display_startup_errors', '0');
    }
}
