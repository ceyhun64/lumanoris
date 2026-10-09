<?php
/**
 * migrate.php'nin test edilebilir parçaları. `api/database/` web'e kapalı.
 */

/**
 * N-25 — checksum satır sonundan bağımsız: CRLF ve tek CR, LF'ye çevrilip
 * öyle hash'leniyor. LF dosyada sonuç eski `hash('sha256', $sql)` ile aynı,
 * yani mevcut schema_migrations kayıtları geçerli kalır. Windows'ta
 * core.autocrlf=true ile alınmış bir kopya artık "DOSYA DEĞİŞMİŞ" görünmez.
 */
function migrationChecksum(string $sql): string
{
    return hash('sha256', str_replace(["\r\n", "\r"], "\n", $sql));
}
