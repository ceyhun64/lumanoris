<?php
/**
 * Input validation & sanitization helpers.
 * Include after bootstrap.php.
 *
 * ⚠️ I-07 — SİLME ADAYI. Bu dosyadaki YEDİ fonksiyonun da sıfır çağıranı var
 * (arama üç yerde birden yapıldı: `web/src`, `api/admin`, `api/router.php`).
 * Gerçek girdi temizliği `InputSanitizer` sınıfında yapılıyor. Dosya yine de
 * `autoload.php:11` üzerinden HER API isteğinde yükleniyor.
 *
 * Silinmedi çünkü "ölü kod mu, bilerek duran bir yardımcı seti mi" sorusunun
 * cevabı bende yok (AUDIT.md, Belirsizlikler #3). Silinecekse `autoload.php`
 * satır 11 de kaldırılmalı.
 */

function require_fields(array $data, array $fields): void {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
            json_error("Eksik alan: $field", 400);
        }
    }
}

/**
 * I-07 — iki hatası vardı:
 *  1. `strlen`/`substr` BAYT sayıyor. Türkçe metinde 255. bayt bir çok baytlı
 *     karakterin ORTASINA denk gelebiliyor ve dize bozuk UTF-8 olarak
 *     kesiliyordu. `mb_*` karakter sayıyor.
 *  2. `htmlspecialchars` GİRDİDE uygulanıyordu. Kaçış çıktı-anında yapılır:
 *     girdide yapılınca veritabanında `&#039;` gibi değerler birikiyor, JSON
 *     API'de çift kaçış oluyor ve uzunluk sınırı da bu şişmiş dize üzerinden
 *     ölçülüyordu. `InputSanitizer::string()` ile aynı davranış.
 */
function sanitize_string(?string $value, int $maxLength = 255): string {
    return mb_substr(trim($value ?? ''), 0, $maxLength);
}

function sanitize_int($value): int {
    return (int) filter_var($value, FILTER_SANITIZE_NUMBER_INT);
}

function sanitize_float($value): float {
    return (float) filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
}

function validate_email(string $email): bool {
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validate_positive_int($value): bool {
    return filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) !== false;
}

function allowed_values($value, array $allowedList): bool {
    return in_array($value, $allowedList, true);
}
