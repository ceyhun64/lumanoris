<?php
/**
 * Genel amaçlı admin CRUD uçları (`ajax/create.php`, `ajax/update.php`)
 * için hassas sütun koruması.
 *
 * AUDIT G-05 — bu iki uç TABLODAN BAĞIMSIZ: istemcinin gönderdiği `data`
 * anahtarlarını doğrudan sütun olarak yazıyorlar (`assertAllowedAdminTable`
 * yalnızca HANGİ TABLO sorusunu yanıtlıyor, hangi sütun sorusunu değil).
 * `kullanicilar` bu beyaz listede olduğu için panelden gönderilen bir
 * `sifre` alanı doğrudan sütuna — HASH'LENMEDEN — yazılırdı.
 *
 * Kimlik doğrulamayla ilgili sütunlar bu yüzden burada topluca
 * reddediliyor:
 *   • `sifre`     — düz metin parola yazımı. Parola belirleme yolu
 *                   `password_hash()` kullanan özel bir uç olmalı
 *                   (`ajax/adminler.php` deseni).
 *   • `google_id` — yazılabilir olsaydı bir hesabı istenen Google
 *                   kimliğine bağlamak, yani devralmak mümkün olurdu
 *                   (SEC-014b ile kayıt akışında zaten kapatılmıştı).
 *   • `avatar`    — longtext; genel CRUD üzerinden sınırsız veri.
 *
 * Sessizce düşürmek yerine açıkça reddediliyor: sessiz düşürme,
 * operatörün "parolayı değiştirdim" sanmasına yol açar.
 */
function admin_assert_no_sensitive_columns(string $table, array $data): void {
    static $sensitive = [
        'kullanicilar' => ['sifre', 'google_id', 'avatar'],
        'adminler'     => ['sifre'],
    ];

    $blocked = $sensitive[strtolower($table)] ?? [];
    if ($blocked === []) {
        return;
    }

    $found = array_values(array_intersect(array_keys($data), $blocked));
    if ($found === []) {
        return;
    }

    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Bu alanlar bu ekrandan değiştirilemez: ' . implode(', ', $found)
            . '. Parola gibi kimlik alanları için ilgili özel ekranı kullanın.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
