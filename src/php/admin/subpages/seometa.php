<?php
// Sadece veri çekme mantığı kaldı
try {
    $seo_data = $database->getGlobalVars('og:title','og:description','og:image', 'og:url', 'og:type', 'og:site_name');
} catch (Exception $e) {
    error_log("Veriler alınırken hata: " . $e->getMessage());
    echo '<script>alert("Veriler alınırken bir hata oluştu.");</script>';
}
?>

<!-- HTML / Tailwind Kodu -->
<div class="max-w-[500px] mx-auto">
    <!-- Form action ve method kaldırıldı, çünkü AJAX kullanılacak -->
    <form id="ogMetaForm" enctype="multipart/form-data" class="space-y-5">
        <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">
        
        <!-- OG Meta Başlık -->
        <div>
            <label for="og_title" class="block font-semibold text-sm text-gray-700 mb-2">OG Meta Başlık</label>
            <input type="text" id="og_title" name="og_title"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['og:title'] ?? '') ?>" required>
        </div>

        <!-- OG Meta Açıklama -->
        <div>
            <label for="og_description" class="block font-semibold text-sm text-gray-700 mb-2">OG Meta Site Açıklaması</label>
            <input type="text" id="og_description" name="og_description" maxlength="200"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['og:description'] ?? '') ?>" required>
        </div>

        <!-- OG Meta URL -->
        <div>
            <label for="og_url" class="block font-semibold text-sm text-gray-700 mb-2">OG Meta Site URL</label>
            <input type="url" id="og_url" name="og_url"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['og:url'] ?? '') ?>" required>
        </div>

        <!-- OG Meta Resim -->
        <div>
            <label for="og_image" class="block font-semibold text-sm text-gray-700 mb-2">OG Meta Site Resmi</label>
            <input type="file" id="og_image" name="og_image" accept="image/png, image/jpeg"
                   class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                   onchange="previewOGImage(event)">
            
            <?php $ogImagePath = $seo_data['og:image'] ?? ''; ?>
            <img src="<?= htmlspecialchars($ogImagePath) ?>" id="og-image-preview" 
                 class="mt-3 block w-full max-w-full h-auto rounded-lg shadow-md border <?= !empty($ogImagePath) && file_exists($ogImagePath) ? 'block' : 'hidden' ?>" 
                 style="max-width: 100%; object-fit: cover;">
            <!-- Eğer mevcut resim yoksa, önizleme için hidden bir img etiketi (JS için) -->
            <?php if (empty($ogImagePath) || !file_exists($ogImagePath)): ?>
                <img src="" id="og-image-preview-hidden" class="mt-3 block w-full max-w-full h-auto rounded-lg shadow-md border hidden" style="max-width: 100%; object-fit: cover;">
            <?php endif; ?>
        </div>

        <!-- OG Meta Tip -->
        <div>
            <label for="og_type" class="block font-semibold text-sm text-gray-700 mb-2">OG Meta Site Tipi</label>
            <select id="og_type" name="og_type"
                    class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm">
                <option value="website" <?= ($seo_data['og:type'] ?? '') == 'website' ? 'selected' : '' ?>>Website</option>
                <option value="article" <?= ($seo_data['og:type'] ?? '') == 'article' ? 'selected' : '' ?>>Makale</option>
                <option value="product" <?= ($seo_data['og:type'] ?? '') == 'product' ? 'selected' : '' ?>>Ürün</option>
            </select>
        </div>

        <!-- OG Meta Site Adı -->
        <div>
            <label for="og_site_name" class="block font-semibold text-sm text-gray-700 mb-2">OG Meta Site Adı</label>
            <input type="text" id="og_site_name" name="og_site_name"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['og:site_name'] ?? '') ?>" required>
        </div>

        <!-- Kaydet Butonu (Yeni stil) -->
        <div class="pt-2">
            <button type="submit" id="saveOgMetaBtn"
                    class="w-full bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 transition duration-150 shadow-md shadow-indigo-500/30">
                Kaydet
            </button>
        </div>
    </form>
</div>

<script>
    function previewOGImage(event) {
        const input = event.target;
        // Mevcut görünür resmi veya gizli yedeği seç (JS'de tek bir ID kullanmak daha temiz)
        const previewImage = document.getElementById('og-image-preview') || document.getElementById('og-image-preview-hidden');

        if (input.files && input.files[0]) {
            const reader = new FileReader();

            reader.onload = function (e) {
                previewImage.src = e.target.result;
                // Görünür yap
                previewImage.classList.remove('hidden');
                previewImage.classList.add('block');
            };

            reader.readAsDataURL(input.files[0]);
        }
    }
    
    // Form Gönderimini AJAX'a dönüştürme
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('ogMetaForm');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            formData.append('seo_type','og');

            try {
                const res = await fetch('/admin/ajax/seo.php', {
                    method: 'POST',
                    body: formData
                });
                
                // Sunucu JSON yanıtı bekliyor
                const result = await res.json();
                
                // Varsayılan Notification objeniz ile bildirim gönder
                new Notification({
                    text: result.message,
                    type: result.status === "success" ? "success" : "error",
                    position: "top-right",
                    autoClose: 3000,
                    showProgress: true
                });

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