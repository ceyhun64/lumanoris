<?php
/**
 * Bağımlılıksız, minimal SMTP istemcisi.
 *
 * DEP-003 🟠 — `sendEmail()` bir stub'dı ve **fail-open** davranıyordu:
 * `['success' => true]` dönüyor ama hiçbir şey göndermiyordu. Daha kötüsü,
 * `$htmlBody` parametresini alıp HİÇ KULLANMIYORDU — ne gönderiyor ne
 * logluyordu. Şifre sıfırlama kodu yalnızca `$body` içinde ve DB'de SHA-256
 * hash olarak vardı; yani hesabını kaybeden kullanıcı için kurtarma yolu
 * yoktu ve README'nin "kod error_log'da görünür" tavsiyesi de yanlıştı.
 *
 * Neden PHPMailer değil: composer.json'da yok ve bu ortamda paket kurulamıyor.
 * SMTP'nin bu uygulamanın ihtiyaç duyduğu alt kümesi (EHLO → STARTTLS → AUTH
 * LOGIN → MAIL FROM → RCPT TO → DATA) üç yüz satırdan kısa ve tam olarak test
 * edilebilir. Ayarlar zaten `global_vars` tablosunda (admin → SMTP Ayarları).
 */

final class SmtpException extends RuntimeException {}

final class SmtpClient
{
    private $socket = null;

    public function __construct(
        private string $host,
        private int $port,
        private string $username,
        private string $password,
        private int $timeout = 15,
        private string $encryption = 'auto'
    ) {}

    /**
     * @param array{email:string,name:string} $from
     * @param string[] $to
     */
    public function send(array $from, array $to, string $subject, string $htmlBody, string $textBody): void
    {
        // I-05 — savunma derinliği. Zarf adresleri (`MAIL FROM:<…>`,
        // `RCPT TO:<…>`) ve `From:`/`To:` başlıkları bu değerleri HAM olarak
        // alıyordu; konu ve gönderici adı `encodeHeaderValue()` ile CR/LF'ten
        // arındırılıyordu ama ADRESLER arındırılmıyordu. İçinde CRLF olan tek
        // bir adres, SMTP oturumuna kendi komutlarını enjekte etmeye
        // (fazladan RCPT TO, yani sunucumuz üzerinden spam) yeterdi.
        //
        // Kaynak tarafında da doğrulama var (admin/ajax/smtp.php); ikisi
        // birbirinden bağımsız, çünkü alıcı adresi başka yollardan da geliyor.
        self::assertCleanAddress($from['email'] ?? '', 'gönderici adresi');
        foreach ($to as $recipient) {
            self::assertCleanAddress($recipient, 'alıcı adresi');
        }

        $this->connect();

        try {
            $this->expect($this->read(), 220, 'sunucu karşılama');

            $ehloHost = $this->ehloName();
            $capabilities = $this->ehlo($ehloHost);

            $wantsTls = $this->encryption === 'tls'
                || ($this->encryption === 'auto' && $this->port !== 465 && stripos($capabilities, 'STARTTLS') !== false);

            if ($wantsTls) {
                $this->command('STARTTLS', 220, 'STARTTLS');
                $ok = @stream_socket_enable_crypto(
                    $this->socket,
                    true,
                    STREAM_CRYPTO_METHOD_TLS_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_1_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT
                );
                if ($ok !== true) {
                    throw new SmtpException('STARTTLS el sıkışması başarısız.');
                }
                // RFC 3207: TLS sonrası EHLO tekrarlanmalı.
                $capabilities = $this->ehlo($ehloHost);
            }

            if ($this->username !== '') {
                $this->authenticate($capabilities);
            }

            $this->command('MAIL FROM:<' . $from['email'] . '>', 250, 'MAIL FROM');
            foreach ($to as $recipient) {
                $this->command('RCPT TO:<' . $recipient . '>', 250, 'RCPT TO');
            }

            $this->command('DATA', 354, 'DATA');
            $this->write($this->buildMessage($from, $to, $subject, $htmlBody, $textBody) . "\r\n.");
            $this->expect($this->read(), 250, 'mesaj gövdesi');

            // QUIT hatası mesajın gönderildiği gerçeğini değiştirmez.
            try {
                $this->command('QUIT', 221, 'QUIT');
            } catch (SmtpException $e) {
                // yoksay
            }
        } finally {
            $this->close();
        }
    }

    private function connect(): void
    {
        $useImplicitTls = $this->encryption === 'ssl' || ($this->encryption === 'auto' && $this->port === 465);
        $target = ($useImplicitTls ? 'ssl://' : 'tcp://') . $this->host . ':' . $this->port;

        $context = stream_context_create([
            'ssl' => [
                'verify_peer'       => true,
                'verify_peer_name'  => true,
                'allow_self_signed' => false,
            ],
        ]);

        $errno  = 0;
        $errstr = '';
        $socket = @stream_socket_client($target, $errno, $errstr, $this->timeout, STREAM_CLIENT_CONNECT, $context);
        if ($socket === false) {
            throw new SmtpException(sprintf('SMTP sunucusuna bağlanılamadı (%s): %s', $target, $errstr ?: 'bilinmeyen hata'));
        }

        stream_set_timeout($socket, $this->timeout);
        $this->socket = $socket;
    }

    private function close(): void
    {
        if (is_resource($this->socket)) {
            @fclose($this->socket);
        }
        $this->socket = null;
    }

    private function ehloName(): string
    {
        $name = $_SERVER['SERVER_NAME'] ?? gethostname() ?: 'localhost';
        // EHLO argümanı bir alan adı olmalı; güvenli olmayan karakterleri at.
        $name = preg_replace('/[^A-Za-z0-9.\-]/', '', (string) $name);
        return $name !== '' ? $name : 'localhost';
    }

    private function ehlo(string $host): string
    {
        $this->write('EHLO ' . $host);
        $response = $this->read();
        if (!$this->codeIs($response, 250)) {
            // Bazı eski sunucular yalnızca HELO konuşur.
            $this->write('HELO ' . $host);
            $response = $this->read();
            $this->expect($response, 250, 'HELO');
        }
        return $response;
    }

    private function authenticate(string $capabilities): void
    {
        if (stripos($capabilities, 'AUTH') === false) {
            throw new SmtpException('Sunucu kimlik doğrulamayı desteklemiyor (AUTH yok).');
        }

        if (stripos($capabilities, 'PLAIN') !== false) {
            $credential = base64_encode("\0" . $this->username . "\0" . $this->password);
            $this->command('AUTH PLAIN ' . $credential, 235, 'AUTH PLAIN');
            return;
        }

        $this->command('AUTH LOGIN', 334, 'AUTH LOGIN');
        $this->command(base64_encode($this->username), 334, 'kullanıcı adı');
        $this->command(base64_encode($this->password), 235, 'parola');
    }

    private function command(string $command, int $expected, string $label): string
    {
        $this->write($command);
        $response = $this->read();
        $this->expect($response, $expected, $label);
        return $response;
    }

    private function write(string $data): void
    {
        if (!is_resource($this->socket)) {
            throw new SmtpException('SMTP bağlantısı kapalı.');
        }
        if (@fwrite($this->socket, $data . "\r\n") === false) {
            throw new SmtpException('SMTP sunucusuna yazılamadı.');
        }
    }

    private function read(): string
    {
        if (!is_resource($this->socket)) {
            throw new SmtpException('SMTP bağlantısı kapalı.');
        }

        $response = '';
        while (($line = @fgets($this->socket, 1024)) !== false) {
            $response .= $line;
            // Çok satırlı yanıtta son satır "250 " (boşluk) ile başlar.
            if (strlen($line) >= 4 && $line[3] === ' ') {
                break;
            }
            $meta = stream_get_meta_data($this->socket);
            if (!empty($meta['timed_out'])) {
                throw new SmtpException('SMTP sunucusu zaman aşımına uğradı.');
            }
        }

        if ($response === '') {
            throw new SmtpException('SMTP sunucusundan yanıt alınamadı.');
        }
        return $response;
    }

    private function codeIs(string $response, int $code): bool
    {
        return (int) substr(trim($response), 0, 3) === $code;
    }

    private function expect(string $response, int $code, string $label): void
    {
        if (!$this->codeIs($response, $code)) {
            throw new SmtpException(sprintf(
                'SMTP %s adımı reddedildi (beklenen %d): %s',
                $label,
                $code,
                trim(substr($response, 0, 200))
            ));
        }
    }

    /** @param array{email:string,name:string} $from */
    private function buildMessage(array $from, array $to, string $subject, string $htmlBody, string $textBody): string
    {
        $boundary = 'b' . bin2hex(random_bytes(12));
        $date     = date('r');

        $headers = [
            'Date: ' . $date,
            'From: ' . self::encodeHeaderName($from['name']) . ' <' . $from['email'] . '>',
            'To: ' . implode(', ', $to),
            'Subject: ' . self::encodeHeaderValue($subject),
            'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . (parse_url('http://' . $from['email'], PHP_URL_HOST) ?: 'localhost') . '>',
            'MIME-Version: 1.0',
            'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        ];

        $body = "--$boundary\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($textBody)) . "\r\n"
            . "--$boundary\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($htmlBody)) . "\r\n"
            . "--$boundary--";

        // SMTP nokta-doldurma (RFC 5321 §4.5.2): satır başındaki "." kaçırılmalı,
        // yoksa gövde erken sonlanır.
        $message = implode("\r\n", $headers) . "\r\n\r\n" . $body;
        $message = preg_replace('/^\./m', '..', $message);

        return $message;
    }

    /**
     * I-05: bir e-posta adresi SMTP komutuna/başlığa gömülmeye uygun mu?
     * CR, LF, NUL ve `<`/`>` reddediliyor; ayrıca biçim doğrulanıyor.
     */
    private static function assertCleanAddress(string $address, string $label): void
    {
        if (strpbrk($address, "\r\n\0<>") !== false) {
            throw new SmtpException(ucfirst($label) . ' geçersiz karakter içeriyor.');
        }
        if (!filter_var($address, FILTER_VALIDATE_EMAIL)) {
            throw new SmtpException(ucfirst($label) . ' geçerli bir e-posta adresi değil.');
        }
    }

    private static function encodeHeaderValue(string $value): string
    {
        // Başlık enjeksiyonu: CR/LF asla geçmemeli.
        $value = str_replace(["\r", "\n"], ' ', $value);
        return preg_match('/[\x80-\xFF]/', $value)
            ? '=?UTF-8?B?' . base64_encode($value) . '?='
            : $value;
    }

    private static function encodeHeaderName(string $name): string
    {
        $encoded = self::encodeHeaderValue($name);
        return str_starts_with($encoded, '=?') ? $encoded : '"' . str_replace('"', '', $encoded) . '"';
    }
}
