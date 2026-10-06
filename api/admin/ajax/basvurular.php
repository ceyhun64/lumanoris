<?php
/**
 * Admin — Pazaryeri başvuruları (madde 3, Faz 5; GK-9, GK-21, GK-23, GK-25, GK-26).
 *
 *   GET  ?status=submitted|reviewed|rejected   → liste (tam alanlar, GK-26)
 *   POST id, status=reviewed|rejected, review_note → durum güncelle
 *
 * `_guard.php`: admin oturumu + her POST'ta CSRF (başlıktaki fetch shim'i
 * X-CSRF-Token ekliyor). Tablo genel CRUD beyaz listesine (`update.php`)
 * EKLENMEDİ — bu tek giriş noktası.
 *
 * GK-9: "incelendi" satıcıyı `active` YAPMAZ (B1).
 * GK-23: incelemede başvurudaki IBAN'ın `banka_bilgileri`'ne aktarılması,
 * kalıcı bir admin işlem logu gerektiriyor; mevcut log tablosu YOK ve yeni
 * tablo (017) onay bekliyor. O yüzden aktarım BU SÜRÜMDE YAPILMIYOR; liste
 * yine de mevcut ve yeni IBAN'ı ve bekleyen çekim talebini gösteriyor.
 * GK-25: sonuç kullanıcıya `notifications` tablosu üzerinden bildirilir.
 */
require_once __DIR__ . '/_guard.php';
require_once __DIR__ . '/../../functions/db.php';
require_once __DIR__ . '/../../functions/marketplace_application.php';

header('Content-Type: application/json; charset=utf-8');

$database = Database::getInstance();

function basvuru_json(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if (!marketplaceApplicationsReady($database)) {
    basvuru_json(['success' => false, 'message' => 'marketplace_applications tablosu yok — migration 016 uygulanmamış.'], 503);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $status = $_GET['status'] ?? '';
    $where  = '';
    $params = [];
    if (in_array($status, ['submitted', 'reviewed', 'rejected'], true)) {
        $where    = 'WHERE m.status = ?';
        $params[] = $status;
    }

    $rows = $database->selectMulti(
        "m.*, k.kullanici_adi, k.eposta,
                b.iban AS current_iban,
                (SELECT COUNT(*) FROM para_cekme_talepleri t
                  WHERE t.user_id = m.user_id AND t.durum = 'beklemede') AS pending_withdrawals
         FROM marketplace_applications m
         LEFT JOIN kullanicilar k ON k.id = m.user_id
         LEFT JOIN banka_bilgileri b ON b.user_id = m.user_id
         $where
         ORDER BY FIELD(m.status, 'submitted', 'rejected', 'reviewed'), m.updated_at DESC
         LIMIT 200",
        $params
    );

    foreach ($rows as &$r) {
        $r['pending_withdrawals'] = (int) $r['pending_withdrawals'];
        $r['iban_differs']        = ($r['current_iban'] ?? null) !== null
            && preg_replace('/\s+/', '', (string) $r['current_iban']) !== $r['iban'];
    }
    unset($r);

    basvuru_json(['success' => true, 'applications' => $rows, 'iban_transfer_enabled' => false]);
}

if ($method !== 'POST') {
    basvuru_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$id     = (int) ($_POST['id'] ?? 0);
$status = (string) ($_POST['status'] ?? '');
$note   = trim(mb_substr(strip_tags((string) ($_POST['review_note'] ?? '')), 0, 1000));

if ($id <= 0 || !in_array($status, ['reviewed', 'rejected'], true)) {
    basvuru_json(['success' => false, 'message' => 'Geçersiz istek.'], 400);
}
if ($status === 'rejected' && $note === '') {
    basvuru_json(['success' => false, 'message' => 'Reddetmek için kullanıcıya gösterilecek bir açıklama yazın.'], 400);
}

$app = $database->selectSingle('id, user_id, status, company_title FROM marketplace_applications WHERE id = ?', [$id]);
if (!$app) {
    basvuru_json(['success' => false, 'message' => 'Başvuru bulunamadı.'], 404);
}

$adminId = isset($_SESSION['admin_id']) && is_numeric($_SESSION['admin_id']) ? (int) $_SESSION['admin_id'] : null;
$conn    = $database->getConnection();

$conn->beginTransaction();
try {
    $database->execute(
        'UPDATE marketplace_applications
         SET status = ?, review_note = ?, reviewed_by_admin_id = ?, reviewed_at = NOW()
         WHERE id = ?',
        [$status, $note !== '' ? $note : null, $adminId, $id]
    );

    // GK-25 — uygulama içi bildirim (mevcut altyapı). Mesajda kişisel veri yok.
    $title = $status === 'reviewed' ? 'Pazaryeri başvurunuz incelendi' : 'Pazaryeri başvurunuz onaylanmadı';
    $msg   = $status === 'reviewed'
        ? 'Başvurunuz incelendi. Pazaryerinde ücretli satış, ödeme altyapısı tamamlandığında açılacaktır.'
        : 'Başvurunuz onaylanmadı. Açıklamayı Pazaryeri Başvurusu sayfasında görebilir, düzeltip yeniden gönderebilirsiniz.';
    $database->execute(
        'INSERT INTO notifications (user_id, type, title_tr, title_en, message_tr, message_en, is_read)
         VALUES (?, ?, ?, ?, ?, ?, 0)',
        [
            (int) $app['user_id'],
            'marketplace_application',
            $title,
            $status === 'reviewed' ? 'Your marketplace application was reviewed' : 'Your marketplace application was not approved',
            $msg,
            $status === 'reviewed'
                ? 'Your application was reviewed. Paid marketplace sales will open once the payment infrastructure is ready.'
                : 'Your application was not approved. See the note on the Marketplace Application page, fix it and resubmit.',
        ]
    );

    $conn->commit();
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    error_log('[admin/basvurular] durum güncellenemedi id=' . $id . ': ' . $e->getMessage());
    basvuru_json(['success' => false, 'message' => 'Durum güncellenemedi.'], 500);
}

error_log(sprintf('[admin/basvurular] başvuru id=%d durum=%s admin_id=%s', $id, $status, $adminId ?? '-'));
basvuru_json(['success' => true, 'message' => 'Başvuru güncellendi; kullanıcıya bildirim gönderildi.']);
