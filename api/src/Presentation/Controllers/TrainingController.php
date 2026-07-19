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

    // Cap on the decoded PDF size this endpoint will parse. Was previously
    // reachable with no session and no size limit at all — anyone on the
    // internet could submit arbitrarily large/malformed PDFs and burn server
    // CPU/memory in Smalot\PdfParser (DoS).
    private const MAX_PDF_BYTES = 15 * 1024 * 1024;

    public static function readPdf(): void {
        require_method('POST');
        AuthMiddleware::requireAuth();
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
