<?php
require_once __DIR__ . '/_guard.php';

/**
 * CKEditor upload endpoint for the admin content pages.
 *
 * Previously this trusted the client in three ways at once: the file type came
 * from the client-supplied filename extension, the client's filename was kept
 * verbatim (so uploads overwrote each other and sat at predictable URLs), and
 * anything matching the extension list landed in a web-served directory. A
 * "shell.php.jpg" or a PHP payload inside a ".pdf" was therefore stored and
 * served — harmless under the PHP dev server, which only executes ".php", but
 * live on any Apache/nginx configured to hand additional extensions to PHP.
 *
 * The bot-image path (ChatbotController::handleImageUploads) already did this
 * correctly; this now follows the same rules — verify the bytes, derive the
 * extension from the verified type, and pick the name server-side.
 */

// H-06/G-06 — `upload_detect_mime()` buradan `functions/upload_guard.php`'ye
// TAŞINDI. Panelin üç yükleme yolu artık aynı uygulamayı paylaşıyor; eskiden
// bu doğru sürüm yalnızca burada vardı, `seo.php` kendi zayıf kopyasını
// kullanıyordu.
require_once __DIR__ . '/../functions/upload_guard.php';

// Only types whose content can actually be verified are accepted. doc/docx/txt
// used to be allowed but cannot be confirmed from their bytes here, and an
// unverifiable type in a web-served directory is the whole problem — they are
// deliberately no longer accepted.
//
// H-06: görsel tipleri AppConfig'ten; PDF bu uca ÖZEL bir ek (CKEditor
// belge yüklemesi), o yüzden burada birleştiriliyor.
const UPLOAD_ALLOWED_MIMES = AppConfig::IMAGE_MIME_EXTENSIONS + ['application/pdf' => 'pdf'];
const UPLOAD_MAX_BYTES = AppConfig::MAX_UPLOAD_SIZE_BYTES;

header('Content-Type: application/json; charset=utf-8');

function upload_fail(string $message, int $status = 400): never {
    http_response_code($status);
    // CKEditor 5 renders `error.message` when the upload adapter rejects.
    echo json_encode([
        'success' => false,
        'message' => $message,
        'error'   => ['message' => $message],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['file'])) {
    upload_fail('No file uploaded.');
}

$file = $_FILES['file'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    upload_fail('Dosya yüklenemedi.');
}
if ($file['size'] > UPLOAD_MAX_BYTES) {
    upload_fail('File size exceeds 5MB limit.');
}
if (!is_uploaded_file($file['tmp_name'])) {
    upload_fail('Geçersiz yükleme.');
}

$mime = upload_detect_mime($file['tmp_name']);
if ($mime === false || !isset(UPLOAD_ALLOWED_MIMES[$mime])) {
    upload_fail('File type not allowed.');
}
$ext = UPLOAD_ALLOWED_MIMES[$mime];

// Subdirectory stays client-selectable (CKEditor pages group by section), but
// it is rebuilt from safe segments rather than filtered — stripping "." from a
// path still leaves room for surprises, whereas an allowlist per segment does
// not.
$segments = [];
foreach (explode('/', (string) ($_POST['subdir'] ?? '')) as $segment) {
    if (preg_match('/^[A-Za-z0-9_-]{1,32}$/', $segment)) {
        $segments[] = $segment;
    }
}
$segments  = array_slice($segments, 0, 3);
$baseDir   = __DIR__ . '/../uploads';
$targetDir = $baseDir . ($segments ? '/' . implode('/', $segments) : '');

if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
    upload_fail('Yükleme klasörü oluşturulamadı.', 500);
}

// Name chosen server-side: no overwriting another upload, no guessable URL,
// and the extension always matches the verified content type.
$fileName   = time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
$targetFile = $targetDir . '/' . $fileName;

if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
    upload_fail('Error moving uploaded file.', 500);
}

$publicPath = '/admin/uploads' . ($segments ? '/' . implode('/', $segments) : '') . '/' . $fileName;

// `url`/`default` is the shape CKEditor 5's upload adapter requires; the old
// response returned a filesystem path under `path` and no `default` at all, so
// the editor never received a usable image URL.
echo json_encode([
    'success' => true,
    'message' => 'File uploaded successfully.',
    'file'    => $fileName,
    'url'     => $publicPath,
    'default' => $publicPath,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
