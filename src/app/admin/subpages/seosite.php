<?php
$seo_data = [];

// Sadece veri çekme mantığı kaldı
try {
    $seo_data = $database->getGlobalVars('site_baslik', 'site_aciklama', 'site_keywords', 'robots_txt', 'google_analytics', 'google_search');
    $file_path = '../robots.txt';
    // robots_txt içeriğini veritabanından değil, dosyadan çekme
    $seo_data['robots_txt'] = file_exists($file_path) ? file_get_contents($file_path) : ''; 
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

        <!-- Robots.txt -->
        <div>
            <label for="robots_txt" class="block font-semibold text-sm text-gray-700 mb-2">Robots.txt</label>
            <textarea id="robots_txt" name="robots_txt" rows="8"
                      class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"><?= htmlspecialchars($seo_data['robots_txt'] ?? '') ?></textarea>
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

        <!-- Sitemap ve Favicon Bölümü -->
        <div class="space-y-4 pt-2">
            <!-- Sitemap Oluştur Butonu -->
            <div>
                <label for="sitemap" class="block font-semibold text-sm text-gray-700 mb-2">Sitemap.xml</label>
                <!-- Sitemap butonu stili güncellendi -->
                <button type="button" id="sitemap"
                        class="w-full bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-600 active:bg-indigo-700 active:scale-95 transition duration-150 shadow-md">
                    Sitemap Oluştur ve İndir
                </button>
            </div>

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

    // Sitemap AJAX mantığı korundu
    document.querySelector("#sitemap").addEventListener("click", async function() {
        try {
            // URL, ana admin dizinine göre ayarlanmalıdır. Varsayım: ajax/sitemap.php doğru yolda.
            const response = await fetch("/lumanoris/admin/ajax/sitemap.php"); 
            if (!response.ok) throw new Error("İstek başarısız oldu! (Durum: " + response.status + ")");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.style.display = "none";
            a.href = url;
            a.download = "sitemap.xml";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            // Varsayılan Notification objeniz ile bildirim gönder
            new Notification({
                text: "Sitemap başarıyla oluşturuldu ve indirildi!",
                type: "success",
                position: "top-right",
                autoClose: 3000,
                showProgress: true
            });
        } catch (error) {
            new Notification({
                text: `Sitemap hatası: ${error.message}`,
                type: "error",
                position: "top-right"
            });
        }
    });

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