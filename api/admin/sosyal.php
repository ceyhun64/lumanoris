<?php
// Sadece veri çekme mantığı kaldı
$keys = ['facebook_link', 'instagram_link', 'twitter_link', 'youtube_link', 'linkedin_link', 'tiktok_link'];
$placeholders = implode(", ", array_fill(0, count($keys), "?"));

$global_vars = $database->selectMulti("var_key, var_value FROM global_vars WHERE var_key IN ($placeholders)", $keys);

$social_medias = [];
foreach ($global_vars as $row) {
    $social_medias[$row['var_key']] = $row['var_value'];
}
?>

<!-- HTML / Tailwind Kodu -->
<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <!-- Başlık (Admin Yönetimi sayfasındaki stile uygun hale getirildi) -->
        <section class="text-center mb-10">
            <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Sosyal Medya Bağlantıları</h2>
            <p class="text-gray-500 mt-1">Sitenizin veya firmanızın sosyal medya hesap bağlantılarını buradan belirleyebilirsiniz.</p>
        </section>

        <!-- Form action ve method kaldırıldı, çünkü AJAX kullanılacak -->
        <form id="socialMediaForm" class="mx-auto" style="max-width: 800px;">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">
            
            <!-- Form Kartı (Modernize Edilmiş Kart Stili) -->
            <section class="bg-white rounded-xl shadow-xl border border-gray-100 p-8">
                <h3 class="font-bold text-xl mb-6 text-center text-gray-800 border-b pb-3">Sosyal Medya Hesaplarınız</h3>
                
                <!-- Grid yapısı (row g-4 -> grid grid-cols-1 md:grid-cols-2 gap-6) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <!-- Facebook -->
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <label for="facebook_link" class="block font-semibold text-md text-gray-700 mb-2">
                            <i class="bi bi-facebook text-blue-600 mr-2"></i> Facebook
                        </label>
                        <input type="url" id="facebook_link" name="facebook_link" placeholder="Facebook bağlantısını girin"
                               class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                               value="<?= htmlspecialchars($social_medias['facebook_link'] ?? '') ?>">
                    </div>

                    <!-- Instagram -->
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <label for="instagram_link" class="block font-semibold text-md text-gray-700 mb-2">
                            <i class="bi bi-instagram text-pink-600 mr-2"></i> Instagram
                        </label>
                        <input type="url" id="instagram_link" name="instagram_link" placeholder="Instagram bağlantısını girin"
                               class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition shadow-sm"
                               value="<?= htmlspecialchars($social_medias['instagram_link'] ?? '') ?>">
                    </div>

                    <!-- Twitter -->
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <label for="twitter_link" class="block font-semibold text-md text-gray-700 mb-2">
                            <i class="bi bi-twitter-x text-gray-800 mr-2"></i> Twitter / X
                        </label>
                        <input type="url" id="twitter_link" name="twitter_link" placeholder="Twitter bağlantısını girin"
                               class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition shadow-sm"
                               value="<?= htmlspecialchars($social_medias['twitter_link'] ?? '') ?>">
                    </div>

                    <!-- YouTube -->
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <label for="youtube_link" class="block font-semibold text-md text-gray-700 mb-2">
                            <i class="bi bi-youtube text-red-600 mr-2"></i> YouTube
                        </label>
                        <input type="url" id="youtube_link" name="youtube_link" placeholder="YouTube bağlantısını girin"
                               class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition shadow-sm"
                               value="<?= htmlspecialchars($social_medias['youtube_link'] ?? '') ?>">
                    </div>

                    <!-- LinkedIn -->
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <label for="linkedin_link" class="block font-semibold text-md text-gray-700 mb-2">
                            <i class="bi bi-linkedin text-blue-800 mr-2"></i> LinkedIn
                        </label>
                        <input type="url" id="linkedin_link" name="linkedin_link" placeholder="LinkedIn bağlantısını girin"
                               class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition shadow-sm"
                               value="<?= htmlspecialchars($social_medias['linkedin_link'] ?? '') ?>">
                    </div>

                    <!-- TikTok -->
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <label for="tiktok_link" class="block font-semibold text-md text-gray-700 mb-2">
                            <i class="bi bi-tiktok text-gray-900 mr-2"></i> TikTok
                        </label>
                        <input type="url" id="tiktok_link" name="tiktok_link" placeholder="TikTok bağlantısını girin"
                               class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition shadow-sm"
                               value="<?= htmlspecialchars($social_medias['tiktok_link'] ?? '') ?>">
                    </div>

                </div>
            </section>
            
            <!-- Kaydet Butonu -->
            <section class="text-center p-6">
                <button type="submit" id="saveSocialMediaBtn"
                        class="bg-indigo-600 text-white font-semibold text-lg px-8 py-3 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 transition duration-150 shadow-lg shadow-indigo-500/50">
                    Değişiklikleri Kaydet
                </button>
            </section>
        </form>
    </div>
</main>

<script>
    // Form Gönderimini AJAX'a dönüştürme
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('socialMediaForm');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);

            try {
                // AJAX modül yolunu belirt
                const res = await fetch('/admin/ajax/updategv.php', {
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