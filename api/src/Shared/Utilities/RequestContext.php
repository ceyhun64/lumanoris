<?php
/**
 * İsteğin taşıma katmanı hakkındaki gerçekler.
 *
 * Neden var: bu kurulumda PHP **hiçbir zaman** doğrudan TLS konuşmuyor.
 * `web/server.js` Express ile Next'i sarıyor ve `/api`, `/admin`, `/assets`
 * yollarını düz HTTP üzerinden 127.0.0.1'deki PHP'ye proxy'liyor. Sonuç:
 * `$_SERVER['HTTPS']` canlıda da BOŞ — site https:// üzerinden yayınlansa
 * bile. Çerezlerin `Secure` bayrağını doğrudan `$_SERVER['HTTPS']`e bağlayan
 * her kod bu yüzden canlıda sessizce yanlış karar veriyor.
 *
 * Doğru kaynak, proxy'nin eklediği `X-Forwarded-Proto` (server.js'te
 * `xfwd: true`). Başlığa yalnızca doğrudan bağlantı yerel/özel bir adresten
 * geliyorsa güveniyoruz — checkout_payments.php'deki `clientIp()` ile aynı
 * desen. Zincirde birden fazla proxy varsa (nginx/Cloudflare + Express)
 * başlık virgülle uzuyor ve İLK değer istemciye en yakın olanıdır; o yüzden
 * baştaki değeri okuyoruz.
 */
class RequestContext {
    /** İstemci ile site arasındaki bağlantı TLS mi? */
    public static function isHttps(): bool {
        $https = strtolower((string) ($_SERVER['HTTPS'] ?? ''));
        if ($https !== '' && $https !== 'off') {
            return true;
        }

        if ((int) ($_SERVER['SERVER_PORT'] ?? 0) === 443) {
            return true;
        }

        if (self::behindLocalProxy()) {
            $forwarded = (string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '');
            if ($forwarded !== '') {
                $first = strtolower(trim(explode(',', $forwarded)[0]));
                if ($first === 'https') {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Doğrudan bağlantı yerel bir adresten mi geliyor? Yalnızca o zaman
     * X-Forwarded-* başlıkları anlamlıdır; aksi hâlde istemcinin uydurduğu
     * bir başlığı okuyor olurduk.
     */
    private static function behindLocalProxy(): bool {
        $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
        if ($remote === '') {
            return true; // CLI veya soket bilgisi yok
        }

        // Genel (public) bir adres DEĞİLSE yerel proxy sayılır.
        return filter_var(
            $remote,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;
    }
}
