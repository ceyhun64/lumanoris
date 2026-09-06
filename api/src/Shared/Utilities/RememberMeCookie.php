<?php
/**
 * `remember_me` çerezinin TEK yazma noktası.
 *
 * Neden tek noktada: çerez dört ayrı yerde elle yazılıyordu (login, logout,
 * AuthMiddleware'in rotasyonu ve temizliği) ve bayrakları birbirini tutmuyordu
 * — login `secure: true` sabitliyor, rotasyon ise `!empty($_SERVER['HTTPS'])`
 * kullanıyordu. `$_SERVER['HTTPS']` bu mimaride hiçbir zaman dolmadığı için
 * (bkz. RequestContext) ikisi zıt kararlar veriyordu:
 *
 *   - Düz HTTP sunulan bir kurulumda giriş, tarayıcının kabul etmeyeceği bir
 *     `Secure` çerez yazıyordu → "Beni Hatırla" sessizce hiç çalışmıyordu.
 *   - HTTPS'te ise çerez ilk rotasyonda `Secure` bayrağını KAYBEDİYORDU →
 *     30 günlük kimlik doğrulama sırrı düz HTTP'ye de gönderilebilir hâle
 *     geliyordu.
 *
 * Aynı seçenekleri üreten tek bir yer olduğu sürece ikisi de olamaz. Silme
 * çerezinin bayrakları da yazma çereziyle birebir aynı olmak zorunda: path,
 * secure, samesite eşleşmezse tarayıcı onu AYRI bir çerez sayar ve orijinali
 * silinmeden yerinde kalır.
 */
class RememberMeCookie {
    public const NAME = 'remember_me';

    public static function issue(string $selector, string $validator, int $expiresAt): void {
        setcookie(self::NAME, $selector . ':' . $validator, self::options($expiresAt));
    }

    public static function clear(): void {
        setcookie(self::NAME, '', self::options(time() - 3600));
        unset($_COOKIE[self::NAME]);
    }

    private static function options(int $expires): array {
        return [
            'expires'  => $expires,
            'path'     => '/',
            'httponly' => true,
            // TLS varsa Secure; yoksa çerezi tarayıcıya hiç kabul ettiremeyiz.
            'secure'   => RequestContext::isHttps(),
            // Strict kalıyor: oturumu canlandıran istek her zaman kendi
            // origin'imizden atılan bir fetch, yani site-içi. Dışarıdan gelen
            // bir bağlantıda çerezin gönderilmemesi bilinçli.
            'samesite' => 'Strict',
        ];
    }
}
