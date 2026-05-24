<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../vendor/autoload.php'; // composer autoload

use Smalot\PdfParser\Parser;

try {
    // Base64 string POST ile gelecek
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['base64Data'])) {
        echo json_encode(['error' => 'base64Data missing']);
        exit;
    }

    $base64 = $input['base64Data'];
    $pdfBytes = base64_decode($base64);

    // Geçici dosya oluştur
    $tmpFile = tempnam(sys_get_temp_dir(), 'pdf');
    file_put_contents($tmpFile, $pdfBytes);

    $parser = new Parser();
    $pdf    = $parser->parseFile($tmpFile);
    $text   = $pdf->getText();

    unlink($tmpFile); // geçici dosyayı sil

    echo json_encode([
        'success' => true,
        'text'    => $text
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}