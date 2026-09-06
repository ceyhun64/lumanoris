<?php
/**
 * COMP-004 — satıcı ödeme kimliği doğrulaması (IBAN / TCKN / VKN).
 *
 * NEDEN VAR
 * ---------
 * `WalletController::saveBankInfo()` bu dosyadan önce hiçbir alanı
 * doğrulamıyordu: `array_intersect_key()` ile beyaz listeden geçen ne varsa
 * doğrudan `banka_bilgileri` tablosuna yazılıyordu. Yani "TR00", "asdf",
 * 11 hane yerine 3 hane — hepsi kabul ediliyordu. `withdraw()` de aynı
 * şekilde `InputSanitizer::string($data['iban'], 40)` dışında hiçbir kontrol
 * yapmadan çekim talebi açıyordu.
 *
 * Bunun iki somut sonucu var:
 *   1. Ödemeyi ELLE yapan operatör, hatalı IBAN'ı ancak bankada fark eder;
 *      yanlış hesaba giden havale geri dönmeyebilir.
 *   2. Doğrulanmamış kimlik bilgisiyle para göndermek, ödeme kuruluşu risk
 *      değerlendirmesinde doğrudan olumsuz kalemdir (BLOCKERS B3, B7).
 *
 * BU DOSYA KYC DEĞİLDİR
 * ---------------------
 * Buradaki kontroller yalnızca BİÇİM ve SAĞLAMA (checksum) doğrular:
 * "bu string geçerli bir IBAN/TCKN olabilir mi". Numaranın gerçekten bu
 * kişiye ait olup olmadığını yalnızca resmî bir doğrulama servisi söyler
 * (NVİ TCKN doğrulama, banka hesap sahibi sorgusu). O entegrasyon
 * BLOCKERS B1'e bağlı ve bu dosya onun yerine geçmez.
 */
final class BankIdentity {
    /** Türkiye IBAN'ı sabit uzunlukta: TR + 2 kontrol + 22 hane. */
    private const TR_IBAN_LENGTH = 26;

    /**
     * IBAN'ı normalize eder (boşluklar silinir, büyük harfe çevrilir) ve
     * doğrular.
     *
     * Yalnızca TR IBAN kabul ediliyor: ödeme elle havale ile yapılıyor ve
     * yurt dışı transferi bu akışın kapsamında değil. Yanlış bir ülke kodunu
     * sessizce kabul edip havale aşamasında patlatmak yerine burada
     * reddediliyor.
     *
     * @return string  normalize edilmiş IBAN ("TR120006…")
     * @throws ValidationException
     */
    public static function normalizeIban(mixed $value): string {
        $iban = strtoupper(preg_replace('/\s+/', '', (string) $value) ?? '');

        if ($iban === '') {
            throw new ValidationException('IBAN zorunludur.');
        }
        if (!str_starts_with($iban, 'TR')) {
            throw new ValidationException('Yalnızca TR ile başlayan Türkiye IBAN\'ları kabul edilmektedir.');
        }
        if (strlen($iban) !== self::TR_IBAN_LENGTH) {
            throw new ValidationException('IBAN 26 karakter olmalıdır (TR + 24 rakam).');
        }
        if (!preg_match('/^TR\d{24}$/', $iban)) {
            throw new ValidationException('IBAN yalnızca TR ön eki ve rakamlardan oluşmalıdır.');
        }
        if (!self::mod97IsValid($iban)) {
            // En sık hata bu: rakamlardan biri yanlış yazılmış. Kullanıcıya
            // "geçersiz" demek yerine ne yapması gerektiğini söylüyoruz.
            throw new ValidationException('IBAN doğrulanamadı. Lütfen rakamları kontrol edip tekrar girin.');
        }

        return $iban;
    }

    /**
     * ISO 13616 mod-97 sağlaması.
     *
     * İlk dört karakter sona alınır, harfler sayıya çevrilir (A=10 … Z=35) ve
     * kalan 97'ye bölümden 1 olmalıdır. Sayı 26 haneyi aşacağı için tam sayı
     * aritmetiği yerine parça parça mod alınıyor — `intval()` ile taşarsa
     * sonuç sessizce yanlış çıkardı.
     */
    private static function mod97IsValid(string $iban): bool {
        $rearranged = substr($iban, 4) . substr($iban, 0, 4);

        $remainder = 0;
        foreach (str_split($rearranged) as $char) {
            $chunk = ctype_digit($char)
                ? $char
                : (string) (ord($char) - 55); // 'A' (65) → 10

            foreach (str_split($chunk) as $digit) {
                $remainder = ($remainder * 10 + (int) $digit) % 97;
            }
        }

        return $remainder === 1;
    }

    /**
     * T.C. Kimlik No sağlaması.
     *
     * Kurallar: 11 hane, ilk hane 0 olamaz, 10. hane
     * ((tek hanelerin toplamı * 7) - (çift hanelerin toplamı)) mod 10,
     * 11. hane ilk 10 hanenin toplamının mod 10'u.
     *
     * Bu bir SAĞLAMA'dır, kimlik doğrulama değil: algoritmayı sağlayan sahte
     * bir numara da üretilebilir (bkz. dosya başlığı).
     *
     * @throws ValidationException
     */
    public static function normalizeTckn(mixed $value): string {
        $tckn = preg_replace('/\D/', '', (string) $value) ?? '';

        if (strlen($tckn) !== 11 || $tckn[0] === '0') {
            throw new ValidationException('T.C. Kimlik No 11 haneli olmalı ve 0 ile başlayamaz.');
        }
        // Tüm haneleri aynı olan numaralar ("11111111111") algoritmayı
        // sağlayabiliyor; yer tutucu olarak yazıldıkları için ayrıca eleniyor.
        if (preg_match('/^(\d)\1{10}$/', $tckn) === 1) {
            throw new ValidationException('Geçerli bir T.C. Kimlik No girin.');
        }

        $digits = array_map('intval', str_split($tckn));

        $oddSum  = $digits[0] + $digits[2] + $digits[4] + $digits[6] + $digits[8];
        $evenSum = $digits[1] + $digits[3] + $digits[5] + $digits[7];

        // PHP'de negatif sayının % operatörü negatif kalan verir
        // (-3 % 10 === -3), bu yüzden +10 ile pozitife çekiliyor.
        $tenth = (($oddSum * 7) - $evenSum) % 10;
        $tenth = ($tenth + 10) % 10;

        $eleventh = array_sum(array_slice($digits, 0, 10)) % 10;

        if ($digits[9] !== $tenth || $digits[10] !== $eleventh) {
            throw new ValidationException('Geçerli bir T.C. Kimlik No girin.');
        }

        return $tckn;
    }

    /**
     * Vergi Kimlik No — yalnızca BİÇİM kontrolü (10 hane).
     *
     * Sağlama (checksum) BİLEREK uygulanmıyor. VKN algoritmasının dolaşımda
     * birbiriyle çelişen sürümleri var (toplama teriminin `9-i` mi `10-i` mi
     * olduğu, `tmp == 0` durumunda katkının 0 mı 9 mu sayılacağı). Yanlış
     * sürümü yazmak, GEÇERLİ vergi numarasına sahip kurumsal satıcıyı
     * reddederdi — yani doğrulama yokluğundan daha zararlı olurdu.
     *
     * Resmî algoritma doğrulanıp bir örnek kümesiyle test edilene kadar
     * burada yalnızca uzunluk ve "hepsi aynı hane değil" kontrolü var.
     * AUDIT.md COMP-004.
     *
     * @throws ValidationException
     */
    public static function normalizeVkn(mixed $value): string {
        $vkn = preg_replace('/\D/', '', (string) $value) ?? '';

        if (strlen($vkn) !== 10) {
            throw new ValidationException('Vergi Kimlik No 10 haneli olmalıdır.');
        }
        if (preg_match('/^(\d)\1{9}$/', $vkn) === 1) {
            throw new ValidationException('Geçerli bir Vergi Kimlik No girin.');
        }

        return $vkn;
    }
}
