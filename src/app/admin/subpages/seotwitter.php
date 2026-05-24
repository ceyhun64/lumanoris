<?php
$seo_data = [];

// Sadece veri çekme mantığı kaldı
try {
    $seo_data = $database->getGlobalVars('twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:site');
} catch (Exception $e) {
    error_log("Twitter bilgileri alınırken hata: " . $e->getMessage());
    echo '<script>alert("Twitter bilgileri alınırken bir hata oluştu.");</script>';
}
?>

<!-- HTML / Tailwind Kodu -->
<div class="max-w-[500px] mx-auto">
    <!-- Form action ve method kaldırıldı, çünkü AJAX kullanılacak -->
    <form id="twitterSeoForm" enctype="multipart/form-data" class="space-y-5">
        <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">
        
        <!-- Twitter Kart Tipi -->
        <div>
            <label for="twitter_card" class="block font-semibold text-sm text-gray-700 mb-2">Twitter Kart Tipi</label>
            <select id="twitter_card" name="twitter_card"
                    class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm">
                <option value="summary" <?= ($seo_data['twitter:card'] ?? '') == 'summary' ? 'selected' : '' ?>>Özet Kart</option>
                <option value="summary_large_image" <?= ($seo_data['twitter:card'] ?? '') == 'summary_large_image' ? 'selected' : '' ?>>Büyük Görsel Kart</option>
                <option value="app" <?= ($seo_data['twitter:card'] ?? '') == 'app' ? 'selected' : '' ?>>Uygulama Kartı</option>
            </select>
        </div>

        <!-- Twitter Başlık -->
        <div>
            <label for="twitter_title" class="block font-semibold text-sm text-gray-700 mb-2">Twitter Başlık</label>
            <input type="text" id="twitter_title" name="twitter_title"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['twitter:title'] ?? '') ?>" required>
        </div>

        <!-- Twitter Açıklama -->
        <div>
            <label for="twitter_description" class="block font-semibold text-sm text-gray-700 mb-2">Twitter Açıklama</label>
            <input type="text" id="twitter_description" name="twitter_description" maxlength="200"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['twitter:description'] ?? '') ?>" required>
        </div>

        <!-- Twitter Görseli -->
        <div>
            <label for="twitter_image" class="block font-semibold text-sm text-gray-700 mb-2">Twitter Görseli</label>
            <input type="file" id="twitter_image" name="twitter_image" accept="image/png, image/jpeg"
                   class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                   onchange="previewTwitterImage(event)">
            
            <?php $twitterImagePath = $seo_data['twitter:image'] ?? ''; ?>
            <img src="<?= htmlspecialchars($twitterImagePath) ?>" id="twitter-image-preview" 
                 class="mt-3 block w-full max-w-full h-auto rounded-lg shadow-md border <?= !empty($twitterImagePath) && file_exists($twitterImagePath) ? 'block' : 'hidden' ?>" 
                 style="max-width: 100%; object-fit: cover;">
            <!-- Eğer mevcut resim yoksa, önizleme için hidden bir img etiketi (JS için) -->
            <?php if (empty($twitterImagePath) || !file_exists($twitterImagePath)): ?>
                <img src="" id="twitter-image-preview-hidden" class="mt-3 block w-full max-w-full h-auto rounded-lg shadow-md border hidden" style="max-width: 100%; object-fit: cover;">
            <?php endif; ?>
        </div>

        <!-- Twitter Kullanıcı Adı -->
        <div>
            <label for="twitter_site" class="block font-semibold text-sm text-gray-700 mb-2">Twitter Kullanıcı Adı</label>
            <input type="text" id="twitter_site" name="twitter_site" placeholder="@kullaniciadi"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                   value="<?= htmlspecialchars($seo_data['twitter:site'] ?? '') ?>" required>
        </div>

        <!-- Kaydet Butonu (Yeni stil) -->
        <div class="pt-2">
            <button type="submit" id="saveTwitterSeoBtn"
                    class="w-full bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 transition duration-150 shadow-md shadow-indigo-500/30">
                Kaydet
            </button>
        </div>
    </form>
</div>

<script>
    function previewTwitterImage(event) {
        const input = event.target;
        // Mevcut görünür resmi veya gizli yedeği seç (JS'de tek bir ID kullanmak daha temiz)
        const previewImage = document.getElementById('twitter-image-preview') || document.getElementById('twitter-image-preview-hidden');
        const file = input.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                previewImage.src = e.target.result;
                // Görünür yap
                previewImage.classList.remove('hidden');
                previewImage.classList.add('block');
            };

            reader.readAsDataURL(file);
        }
    }
    
    // Form Gönderimini AJAX'a dönüştürme
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('twitterSeoForm');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            formData.append('seo_type','twitter');

            try {
                // AJAX modül yolunu belirt
                const res = await fetch('/lumanoris/admin/ajax/seo.php', {
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