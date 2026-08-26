<?php
/**
 * Migration çalıştırıcı — `php api/database/migrate.php`
 *
 * DB-002 🟠 / ARCH-003 🟠: `api/database/migrations/` altında yüksek kaliteli,
 * canlı veriye karşı ölçülmüş üç migration duruyordu ama (a) hiçbiri versiyon
 * kontrolünde değildi, (b) sırayı zorlayan ya da neyin uygulandığını hatırlayan
 * hiçbir araç yoktu. Sonuç: "yeni bir sunucuda güvenilir kurulabilir mi?"
 * sorusunun cevabı hayırdı.
 *
 * Bu script:
 *   • dosyaları ada göre sıralayıp (001, 002, …) sırayla uygular,
 *   • uygulananları `schema_migrations` tablosunda tutar, tekrar çalıştırmaz,
 *   • her dosyayı kendi transaction'ında çalıştırır (DDL örtük commit
 *     yaptığında bunu söyler, sessizce geçmez),
 *   • VARSAYILAN OLARAK KURU ÇALIŞIR. Gerçekten uygulamak için --apply gerekir.
 *
 * 002_clean_orphan_rows.sql kendi başlığında "Every statement here DELETES OR
 * REWRITES DATA" diyor. Bu yüzden veri silen migration'lar ayrıca
 * --allow-destructive ister; --apply tek başına onları çalıştırmaz.
 *
 * Kullanım:
 *   php api/database/migrate.php                  # ne yapılacağını listeler
 *   php api/database/migrate.php --apply          # yıkıcı olmayanları uygular
 *   php api/database/migrate.php --apply --allow-destructive
 *   php api/database/migrate.php --status
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit("Bu script yalnızca komut satırından çalıştırılabilir.\n");
}

require_once __DIR__ . '/../functions/env.php';
require_once __DIR__ . '/../functions/db.php';

$args             = array_slice($argv, 1);
$apply            = in_array('--apply', $args, true);
$allowDestructive = in_array('--allow-destructive', $args, true);
$statusOnly       = in_array('--status', $args, true);

$dir   = __DIR__ . '/migrations';
$files = glob($dir . '/*.sql') ?: [];
sort($files, SORT_STRING); // 001_, 002_, 003_ … sıra dosya adından gelir

if ($files === []) {
    exit("Migration bulunamadı: $dir\n");
}

try {
    $db   = Database::getInstance();
    $conn = $db->getConnection();
} catch (Throwable $e) {
    exit('Veritabanına bağlanılamadı: ' . $e->getMessage() . "\n");
}

$conn->exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   VARCHAR(191) PRIMARY KEY,
        checksum   CHAR(64)     NOT NULL,
        applied_at DATETIME     NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);

$applied = [];
foreach ($conn->query('SELECT filename, checksum, applied_at FROM schema_migrations')->fetchAll(PDO::FETCH_ASSOC) as $row) {
    $applied[$row['filename']] = $row;
}

/** Veriyi silen/yeniden yazan ifade içeriyor mu? */
function isDestructive(string $sql): bool
{
    return (bool) preg_match('/^\s*(DELETE|TRUNCATE|DROP)\b/im', $sql);
}

$pending = 0;
$failed  = 0;

foreach ($files as $file) {
    $name = basename($file);
    $sql  = (string) file_get_contents($file);
    $hash = hash('sha256', $sql);

    if (isset($applied[$name])) {
        $note = $applied[$name]['checksum'] === $hash
            ? 'uygulanmış'
            : 'UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin';
        printf("  [=] %-40s %s (%s)\n", $name, $note, $applied[$name]['applied_at']);
        continue;
    }

    $destructive = isDestructive($sql);
    $pending++;

    if ($statusOnly || !$apply) {
        printf("  [ ] %-40s bekliyor%s\n", $name, $destructive ? '  ⚠ VERİ SİLER' : '');
        continue;
    }

    if ($destructive && !$allowDestructive) {
        printf("  [!] %-40s ATLANDI — veri siliyor, --allow-destructive gerekli\n", $name);
        continue;
    }

    printf("  [>] %-40s uygulanıyor…\n", $name);

    // DDL örtük commit yapar; yine de transaction açıyoruz ki saf DML
    // migration'ları (002 gibi) atomik olsun.
    $inTransaction = false;
    try {
        $conn->beginTransaction();
        $inTransaction = true;
    } catch (Throwable $e) {
        $inTransaction = false;
    }

    try {
        $conn->exec($sql);

        if ($inTransaction && $conn->inTransaction()) {
            $conn->commit();
        } elseif ($inTransaction) {
            echo "      not: DDL örtük COMMIT yaptı, bu dosya geri alınamaz.\n";
        }

        $stmt = $conn->prepare(
            'INSERT INTO schema_migrations (filename, checksum, applied_at) VALUES (?, ?, NOW())'
        );
        $stmt->execute([$name, $hash]);
        echo "      tamam\n";
    } catch (Throwable $e) {
        if ($inTransaction && $conn->inTransaction()) {
            $conn->rollBack();
        }
        $failed++;
        echo '      HATA: ' . $e->getMessage() . "\n";
        echo "      Sıra bozulmasın diye duruluyor — sonraki migration'lar çalıştırılmadı.\n";
        break;
    }
}

echo "\n";
if (!$apply && $pending > 0) {
    echo "$pending migration bekliyor. Uygulamak için: php api/database/migrate.php --apply\n";
    echo "Veri silen dosyalar için ayrıca --allow-destructive gerekir.\n";
} elseif ($failed > 0) {
    echo "Bir migration başarısız oldu. Yukarıdaki hatayı giderip tekrar çalıştırın.\n";
    exit(1);
} elseif ($pending === 0) {
    echo "Her şey güncel.\n";
}
