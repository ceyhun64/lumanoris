<?php
class TrainingController {
    public static function updateTrainingChunk(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['id'], $data['textChunk'])) {
            JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);
        }

        $id = InputSanitizer::positiveInt($data['id']);

        // Previously had no ownership check — anyone who knew a chatbot's id
        // could overwrite or append to its training prompt.
        if (!(new ChatbotRepository())->findByIdAndOwner($id, $userId)) {
            JsonResponse::error('Bu chatbot üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        $chunk   = $data['textChunk'];
        $isFirst = (bool) ($data['isFirst'] ?? false);
        $conn    = Database::getInstance()->getConnection();

        if ($isFirst) {
            $stmt = $conn->prepare('UPDATE chatbotlar SET training_prompt = :chunk WHERE id = :id');
        } else {
            $stmt = $conn->prepare("UPDATE chatbotlar SET training_prompt = CONCAT(IFNULL(training_prompt, ''), :chunk) WHERE id = :id");
        }
        $stmt->bindParam(':chunk', $chunk);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);

        if ($stmt->execute()) {
            JsonResponse::success(['message' => 'Parça başarıyla eklendi.']);
        } else {
            JsonResponse::error('SQL hatası oluştu.', 500, AppConfig::ERR_SERVER);
        }
    }

    public static function getTrainingChunks(): void {
        // chat/page.jsx loads a bot's full training_prompt client-side for
        // every conversation, not just the bot's own owner — a logged-in
        // buyer or anyone previewing a published marketplace bot needs read
        // access here too. Previously this only checked "is there a
        // session at all", with no check that the session's user was
        // actually entitled to *this* botId — anyone logged in could scrape
        // any bot's full training corpus (private/independent bots
        // included) by looping botId. Authorization now goes through the
        // same policy as the chat page's own bot lookup (see
        // ChatbotRepository::userHasAccess) so both endpoints agree on who
        // may see a bot's private content.
        $userId = AuthMiddleware::requireAuth();
        $botId  = InputSanitizer::positiveInt($_GET['botId'] ?? 0);
        $offset = InputSanitizer::positiveInt($_GET['offset'] ?? 0);
        $limit  = 10000;

        if (!$botId) JsonResponse::error('Bot ID eksik', 400, AppConfig::ERR_VALIDATION);

        if (!(new ChatbotRepository())->userHasAccess($botId, $userId)) {
            JsonResponse::error('Bu chatbot üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        $conn  = Database::getInstance()->getConnection();
        $stmt  = $conn->prepare('SELECT SUBSTRING(training_prompt, :start, :limit) as chunk, LENGTH(training_prompt) as total_length FROM chatbotlar WHERE id = :id');
        $start = $offset + 1;
        $stmt->bindParam(':start', $start, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':id', $botId, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) {
            $totalLength = (int) $result['total_length'];
            JsonResponse::success([
                'chunk'       => $result['chunk'] ?? '',
                'totalLength' => $totalLength,
                'hasMore'     => ($offset + $limit) < $totalLength,
            ]);
        } else {
            JsonResponse::error('Bot bulunamadı', 404, AppConfig::ERR_NOT_FOUND);
        }
    }

    // Bir web sayfasindan metin cikarma tavanlari.
    private const MAX_URL_BYTES   = 3 * 1024 * 1024;
    private const URL_TIMEOUT_SEC = 12;

    /**
     * "Bilgi Bankasi > URL Ekle" icin sunucu tarafi sayfa cekimi.
     *
     * Tarayicidan dogrudan cekmek mumkun degil: hem CORS hem de
     * next.config.mjs'teki CSP (connect-src 'self') engelliyor. Sunucudan
     * cekmek ise SSRF acar — istemcinin verdigi adres ic aga bakabilir
     * (127.0.0.1, 169.254.169.254 metadata servisi, 10.x, 192.168.x ...).
     * Bu yuzden:
     *   1. Yalnizca http/https semasi,
     *   2. Host DNS ile cozulur ve TUM cozulen IP'ler ozel/loopback/
     *      link-local araliklara karsi kontrol edilir,
     *   3. Yonlendirme kapali (redirect ile ic aga sicramasin),
     *   4. Boyut ve sure tavani, kullanici basina hiz siniri.
     */
    public static function readUrl(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        checkRateLimit(Database::getInstance(), 'readurl:' . $userId, 15, 300);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $url   = trim((string) ($input['url'] ?? ''));

        if ($url === '') {
            JsonResponse::error('URL gerekli.', 400, AppConfig::ERR_VALIDATION);
        }

        $parts = parse_url($url);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host   = (string) ($parts['host'] ?? '');

        if (!in_array($scheme, ['http', 'https'], true) || $host === '') {
            JsonResponse::error('Yalnizca http/https adresleri desteklenir.', 400, AppConfig::ERR_VALIDATION);
        }
        if (!self::hostIsPublic($host)) {
            JsonResponse::error('Bu adres taranamaz (ic ag adresleri engellidir).', 400, AppConfig::ERR_VALIDATION);
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_TIMEOUT        => self::URL_TIMEOUT_SEC,
            CURLOPT_CONNECTTIMEOUT => 6,
            CURLOPT_MAXFILESIZE    => self::MAX_URL_BYTES,
            CURLOPT_USERAGENT      => 'LumanorisBot/1.0 (+knowledge-base fetch)',
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_PROTOCOLS      => CURLPROTO_HTTP | CURLPROTO_HTTPS,
        ]);
        $body   = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $ctype  = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $err    = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            error_log('[readurl] curl: ' . $err);
            JsonResponse::error('Sayfaya ulasilamadi.', 502, AppConfig::ERR_SERVER);
        }
        if ($status >= 400) {
            JsonResponse::error('Sayfa ' . $status . ' dondurdu.', 502, AppConfig::ERR_SERVER);
        }
        if ($ctype !== '' && stripos($ctype, 'html') === false && stripos($ctype, 'text/plain') === false) {
            JsonResponse::error('Bu adres bir web sayfasi degil (' . $ctype . ').', 400, AppConfig::ERR_VALIDATION);
        }
        if (strlen($body) > self::MAX_URL_BYTES) {
            JsonResponse::error('Sayfa cok buyuk (maks. 3MB).', 413, AppConfig::ERR_VALIDATION);
        }

        JsonResponse::success(['text' => self::htmlToText($body), 'url' => $url]);
    }

    /** Host, DNS cozumlemesi dahil, halka acik bir adrese mi isaret ediyor? */
    private static function hostIsPublic(string $host): bool {
        $ips = [];

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $ips[] = $host;
        } else {
            $records = @dns_get_record($host, DNS_A | DNS_AAAA) ?: [];
            foreach ($records as $r) {
                if (!empty($r['ip']))   $ips[] = $r['ip'];
                if (!empty($r['ipv6'])) $ips[] = $r['ipv6'];
            }
            if ($ips === []) {
                $resolved = gethostbyname($host);
                if ($resolved !== $host) $ips[] = $resolved;
            }
        }

        if ($ips === []) {
            return false; // cozulemeyen host: fail-closed
        }

        foreach ($ips as $ip) {
            $ok = filter_var(
                $ip,
                FILTER_VALIDATE_IP,
                FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
            );
            if ($ok === false) {
                return false; // tek bir ozel IP bile yeterli sebep
            }
        }
        return true;
    }

    /** Kaba ama yeterli HTML -> duz metin. */
    private static function htmlToText(string $html): string {
        $html = preg_replace('#<(script|style|noscript|svg|head)\b[^>]*>.*?</\1>#is', ' ', $html) ?? $html;
        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/[ \t\x{00A0}]+/u', ' ', $text) ?? $text;
        $text = preg_replace('/\s*\n\s*/u', "\n", $text) ?? $text;
        $text = preg_replace('/\n{3,}/u', "\n\n", $text) ?? $text;
        return trim($text);
    }

    // Cap on the decoded PDF size this endpoint will parse. Was previously
    // reachable with no session and no size limit at all — anyone on the
    // internet could submit arbitrarily large/malformed PDFs and burn server
    // CPU/memory in Smalot\PdfParser (DoS).
    private const MAX_PDF_BYTES = 15 * 1024 * 1024;

    public static function readPdf(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        // PDF parsing is CPU- and disk-heavy; it had no ceiling at all.
        checkRateLimit(Database::getInstance(), 'readpdf:' . $userId, 10, 300);
        require_once __DIR__ . '/../../../vendor/autoload.php';

        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['base64Data'])) {
            JsonResponse::error('base64Data eksik.', 400, AppConfig::ERR_VALIDATION);
        }

        $pdfBytes = base64_decode($input['base64Data'], true);
        if ($pdfBytes === false) {
            JsonResponse::error('Geçersiz base64 verisi.', 400, AppConfig::ERR_VALIDATION);
        }
        if (strlen($pdfBytes) > self::MAX_PDF_BYTES) {
            JsonResponse::error('PDF dosyası çok büyük (maks. 15MB).', 413, AppConfig::ERR_VALIDATION);
        }

        $tmpFile = tempnam(sys_get_temp_dir(), 'pdf');
        file_put_contents($tmpFile, $pdfBytes);

        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf    = $parser->parseFile($tmpFile);
            $text   = $pdf->getText();
        } catch (\Exception $e) {
            unlink($tmpFile);
            JsonResponse::error('PDF ayrıştırılamadı.', 400, AppConfig::ERR_VALIDATION);
        }
        unlink($tmpFile);

        JsonResponse::success(['text' => $text]);
    }
}
