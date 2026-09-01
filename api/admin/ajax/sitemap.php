<?php
require_once __DIR__ . '/_guard.php';

if (empty($_SESSION['admin'])) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["status" => "error", "message" => "Yetkisiz erişim."]);
    exit;
}

/**
 * SEO-002 — bu uç nokta emekliye ayrıldı.
 *
 * Neden: ürettiği XML'i `__DIR__ . '/../../sitemap.xml'` yoluna, yani
 * api/sitemap.xml'e yazıyordu. web/server.js PHP'ye yalnızca /api, /admin ve
 * /assets önekli istekleri proxy'liyor — dolayısıyla o dosya site kökünden
 * hiçbir zaman erişilebilir değildi. Denetimde `/sitemap.xml` 404 döndü.
 *
 * Ayrıca üretilen liste kodda sabitti ve üç ayrı hata taşıyordu:
 *   • yönlendirilen `/register`'ı dahil ediyordu (307 → /login),
 *   • trailing slash'sız URL üretiyordu — `trailingSlash: true` yüzünden
 *     her biri 308 redirect'e düşüyordu,
 *   • `$_SERVER['HTTP_HOST']` ile domain'i istekten alıyordu (spoof edilebilir).
 *
 * Tek authoritative kaynak artık web/src/app/sitemap.js. Orası ayrıca hangi
 * sözleşme metninin gerçekten yazıldığını kontrol edip 404 dönecek URL'leri
 * listeye koymuyor.
 *
 * Dosya silinmek yerine 410 döndürüyor: eski bir sekmede açık kalmış admin
 * paneli hâlâ bu adrese istek atabilir; sessiz bir 404 yerine ne olduğunu
 * söyleyen bir cevap veriyoruz.
 */
http_response_code(410);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    "status"  => "gone",
    "message" => "Sitemap artık frontend tarafından üretiliyor (web/src/app/sitemap.js). "
               . "Yayındaki hâli /sitemap.xml adresinde; elle üretmek gerekmiyor.",
], JSON_UNESCAPED_UNICODE);
