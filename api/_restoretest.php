<?php
/**
 * FIX-002 doğrulaması — CANLI VERİTABANINA DOKUNMAZ.
 * Scratch DB yaratır, bugünkü yedeği oraya geri yükler, karşılaştırır, düşürür.
 */
require __DIR__ . '/functions/env.php';
require __DIR__ . '/functions/db.php';
env_load();

$scratch = 'lumanoris_restore_test';
$live    = env_get('DB_NAME');
if ($scratch === $live) { exit("GÜVENLİK: scratch adı canlı DB ile aynı, iptal.\n"); }

$host = env_get('DB_HOST'); $parts = explode(':', $host);
$dsn  = "mysql:host={$parts[0]};port=" . ($parts[1] ?? 3306) . ";charset=utf8mb4";
$pdo  = new PDO($dsn, env_get('DB_USER'), env_get('DB_PASS'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "canlı DB : $live\n";
echo "scratch  : $scratch\n\n";

// Canlı sayımları AL (yalnızca okuma)
$liveCounts = [];
$pdo->exec("USE `$live`");
foreach ($pdo->query("SELECT TABLE_NAME t FROM information_schema.TABLES WHERE TABLE_SCHEMA='$live'")->fetchAll(PDO::FETCH_COLUMN) as $t) {
    $liveCounts[$t] = (int) $pdo->query("SELECT COUNT(*) FROM `$live`.`$t`")->fetchColumn();
}
$liveFk = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA='$live'")->fetchColumn();
printf("canlı: %d tablo, %d satır, %d FK\n\n", count($liveCounts), array_sum($liveCounts), $liveFk);

// Scratch yarat
$pdo->exec("DROP DATABASE IF EXISTS `$scratch`");
$pdo->exec("CREATE DATABASE `$scratch` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
echo "✓ scratch yaratıldı\n";
file_put_contents(__DIR__ . '/../storage/.scratch_created', $scratch);
