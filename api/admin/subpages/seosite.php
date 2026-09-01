<?php
$seo_data = [];

// Sadece veri çekme mantığı kaldı
try {
    // SEO-002: 'robots_txt' artık okunmuyor — alan kaldırıldı, tek
    // authoritative kaynak web/src/app/robots.js.
    $seo_data = $database->getGlobalVars('site_baslik', 'site_aciklama', 'site_keywords', 'google_analytics', 'google_search');
} catch (Exception $e) {
    echo '<script>alert("Veriler alınırken bir hata oluştu: ' . $e->getMessage() . '");</script>';
}

$faviconPath = '../assets/favicon.ico';
// Favicon'un var olup olmadığını kontrol etme
$faviconExists = file_exists($faviconPath) ? $faviconPath : 'https://via.placeholder.com/64x64?text=ICO'; 
?>
<!-- HTML / Tailwind Kodu -->
<div class="max-w-[500px] mx-auto">
    <!-- Form action ve method kaldırıldı, çünkü AJAX kullanılacak -->
    <form id="siteSeoForm" enctype="multipart/form-data" class="space-y-5">
        <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">

        <!-- Site Başlığı -->
        <div>
            <label for="site_baslik" class="block font-semibold text-sm text-gray-700 mb-2">Site Başlığı</label>
            <input type="text" id="site_baslik" name="site_baslik"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['site_baslik'] ?? '') ?>" required>
        </div>

        <!-- Site Açıklaması -->
        <div>
            <label for="site_aciklama" class="block font-semibold text-sm text-gray-700 mb-2">Site Açıklaması</label>
            <input type="text" id="site_aciklama" name="site_aciklama" maxlength="160"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['site_aciklama'] ?? '') ?>" required>
        </div>

        <!-- Site Anahtar Kelimeleri -->
        <div>
            <label for="site_keywords" class="block font-semibold text-sm text-gray-700 mb-2">Site Anahtar Kelimeleri</label>
            <input type="text" id="site_keywords" name="site_keywords" maxlength="160"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['site_keywords'] ?? '') ?>" required>
        </div>

        <!-- Robots.txt — SEO-002: bu alan kaldırıldı.
             Buradaki metin file_put_contents('../../robots.txt') ile CWD'ye
             göre çözülen bir yola yazıyordu ve yayında servis edilen dosyaya
             hiçbir senaryoda ulaşmıyordu. Artık tek authoritative kaynak
             web/src/app/robots.js. -->
        <div class="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p class="font-semibold text-sm text-amber-900 mb-1">Robots.txt ve Sitemap.xml artık burada yönetilmiyor</p>
            <p class="text-sm text-amber-800 leading-relaxed">
                İkisi de frontend tarafından üretiliyor:
                <code class="font-mono text-xs">web/src/app/robots.js</code> ve
                <code class="font-mono text-xs">web/src/app/sitemap.js</code>.
                Yayındaki hâlleri <a href="/robots.txt" target="_blank" class="underline font-medium">/robots.txt</a>
                ve <a href="/sitemap.xml" target="_blank" class="underline font-medium">/sitemap.xml</a> adreslerinden görülebilir.
                Sitemap, sözleşme metinlerinden hangilerinin yazıldığını her istekte
                kontrol edip listeye kendisi ekliyor — elle üretmek gerekmiyor.
            </p>
        </div>

        <!-- Google Analytics Kodu -->
        <div>
            <label for="google_analytics" class="block font-semibold text-sm text-gray-700 mb-2">Google Analytics Kodu</label>
            <input type="text" id="google_analytics" name="google_analytics"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['google_analytics'] ?? '') ?>">
        </div>

        <!-- Google Search Console Kodu -->
        <div>
            <label for="google_search" class="block font-semibold text-sm text-gray-700 mb-2">Google Search Console Kodu</label>
            <input type="text" id="google_search" name="google_search"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['google_search'] ?? '') ?>">
        </div>

        <!-- Favicon Bölümü
             SEO-002: "Sitemap Oluştur ve İndir" butonu kaldırıldı. Ürettiği
             dosya api/sitemap.xml'e yazılıyordu; server.js yalnızca /api,
             /admin ve /assets'i PHP'ye proxy'lediği için o yol site kökünden
             erişilemiyordu (/sitemap.xml ölçümde 404 dönüyordu). -->
        <div class="space-y-4 pt-2">
            <!-- Favicon Yükleme -->
            <div class="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 border p-4 rounded-lg bg-gray-50">
                <!-- Görsel Önizleme -->
                <div class="flex-shrink-0">
                    <img src="<?= htmlspecialchars($faviconExists) ?>" id="initial-img-preview" 
                         class="block w-16 h-16 object-contain rounded-lg border shadow-sm bg-white" alt="Favicon Önizleme">
                </div>
                
                <!-- Input Alanı -->
                <div class="flex-grow w-full">
                    <label for="site_favicon" class="block font-semibold text-sm text-gray-700 mb-2">Favicon.ico Dosyası (50 KB Max)</label>
                    <input type="file" accept=".ico" id="site_favicon" name="site_favicon"
                           class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                           onchange="previewInitialImage(event)">
                </div>
            </div>
        </div>

        <!-- Kaydet Butonu -->
        <div class="pt-2">
            <button type="submit" id="saveSiteSeoBtn"
                    class="w-full bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 transition duration-150 shadow-md shadow-indigo-500/30">
                Kaydet
            </button>
        </div>
    </form>
</div>

<script>
    function previewInitialImage(event) {
        const input = event.target;
        const reader = new FileReader();
        reader.onload = function(){
            const img = document.getElementById('initial-img-preview');
            img.src = reader.result;
        };
        reader.readAsDataURL(input.files[0]);
    }

    // SEO-002: sitemap indirme mantığı kaldırıldı — butonu da kaldırdık.
    // querySelector("#sitemap") artık null döneceği için burada bırakılsaydı
    // script bu satırda patlar ve aşağıdaki form gönderimi hiç bağlanmazdı.

    // Form Gönderimini AJAX'a dönüştürme
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('siteSeoForm');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            formData.append('seo_type','general');

            try {
                // AJAX modül yolunu belirt
                const res = await fetch('/admin/ajax/seo.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await res.json();
                
                // Varsayılan Notification objeniz ile bildirim gönder
                new Notification({
                    text: result.message,
                    type: result.status === "success" ? "success" : "error",
                    position: "top-right",
                    autoClose: 3000,
                    showProgress: true
                });

                // Başarılı olursa sayfayı yeniden yükle veya veriyi güncelle
                // Basitçe: if (result.status === "success") { /* UI Güncellemesi yapılabilir */ }

            } catch (error) {
                new Notification({
                    text: "İşlem sırasında bir hata oluştu: " + error.message,
                    type: "error",
                    position: "top-right"
                });
            }
        });
    });
</script>