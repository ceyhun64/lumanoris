<?php
require_once __DIR__ . '/_guard.php';

if (empty($_SESSION['admin'])) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["status" => "error", "message" => "Yetkisiz erişim."]);
    exit;
}

require_once '../../functions/db.php';
$database = Database::getInstance();
$conn = $database->getConnection();

header("Content-Type: application/xml; charset=utf-8");

$domain = 'https://' . $_SERVER['HTTP_HOST'];

// This file arrived from another project: it emitted hardcoded
// omegaspiritual.com URLs and read a `hizmetler` table that has never existed
// in this database, so the admin panel's "Sitemap.xml" button was a guaranteed
// fatal ("Table 'lumanoris.hizmetler' doesn't exist"). The list below mirrors
// the public routes in web/src/app; everything under /dashboard sits behind
// authentication and is deliberately left out, as is /auth, which is an OAuth
// callback rather than a page.
$public_paths = ['/', '/login', '/register', '/forgot-password'];
$static_urls  = array_map(
    static fn(string $path): string => $domain . rtrim($path, '/'),
    $public_paths
);

// There is no public per-chatbot route yet — every bot view lives inside the
// authenticated /dashboard tree — so there is nothing dynamic to list. Build
// it here if such a route is added.
$dynamic_urls = [];

//$dynamic_url_chunk1 = select("");

$xml_output = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
$xml_output .= "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";

// Statik URL'ler
foreach ($static_urls as $url) {
    $xml_output .= "  <url>\n";
    $xml_output .= "    <loc>$url</loc>\n";
    $xml_output .= "    <changefreq>monthly</changefreq>\n";
    $xml_output .= "    <priority>0.8</priority>\n";
    $xml_output .= "  </url>\n";
}

foreach ($dynamic_urls as $url) {
    $xml_output .= "  <url>\n";
    $xml_output .= "    <loc>$url</loc>\n";
    $xml_output .= "    <changefreq>monthly</changefreq>\n";
    $xml_output .= "    <priority>0.8</priority>\n";
    $xml_output .= "  </url>\n";
}

$xml_output .= "</urlset>";

// Anchor to this file's location: the old relative path resolved against the
// process working directory, which is not guaranteed to be this folder. A
// failed open used to reach fwrite(false, ...) and fatal.
$file_path = __DIR__ . '/../../sitemap.xml';
$file      = @fopen($file_path, 'w');
if ($file === false) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => 'error', 'message' => 'Sitemap dosyası yazılamadı.']);
    exit;
}
fwrite($file, $xml_output);
fclose($file);

echo "Sitemap başarıyla oluşturuldu ve ana dizine kaydedildi!";
?>
