<?php
// Sadece veri çekme mantığı kaldı
$global_vars = $database->getGlobalVars("smtp_host", "smtp_email", "smtp_pass", "smtp_name");
?>

<!-- HTML / Tailwind Kodu -->
<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <!-- Başlık -->
        <section class="text-center mb-10">
            <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">✉️ SMTP Ayarları</h2>
            <p class="text-gray-500 mt-1">E-Posta bildirimleri göndermek için kullanacağınız e-posta ayarlarını buradan değiştirebilirsiniz.</p>
        </section>

        <!-- Form action ve method kaldırıldı, çünkü AJAX kullanılacak -->
        <form id="smtpForm" class="mx-auto" style="max-width: 800px;">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">
            
            <!-- Form Kartı (Modernize Edilmiş Kart Stili) -->
            <section class="bg-white rounded-xl shadow-xl border border-gray-100 p-8 space-y-6">
                <h3 class="font-bold text-xl text-center text-gray-800 border-b pb-3">SMTP Bilgileriniz</h3>

                <!-- Grid yapısı (row g-4 -> grid grid-cols-1 md:grid-cols-2 gap-6) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <!-- SMTP Host -->
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <label for="smtp_host" class="block font-semibold text-sm text-gray-700 mb-2">SMTP Host</label>
                        <input type="text" id="smtp_host" name="smtp_host" placeholder="smtp.host.com"
                               class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                               value="<?= htmlspecialchars($global_vars['smtp_host'] ?? '') ?>">
                    </div>

                    <!-- SMTP Email -->
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <label for="smtp_email" class="block font-semibold text-sm text-gray-700 mb-2">SMTP Email</label>
                        <input type="text" id="smtp_email" name="smtp_email" placeholder="email@mail.com"
                               class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                               value="<?= htmlspecialchars($global_vars['smtp_email'] ?? '') ?>">
                    </div>
                </div>

                <!-- Grid yapısı (row g-4 -> grid grid-cols-1 md:grid-cols-2 gap-6) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <!-- SMTP Şifre -->
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <label for="smtp_pass" class="block font-semibold text-sm text-gray-700 mb-2">SMTP Şifre</label>
                        <input type="password" id="smtp_pass" name="smtp_pass" placeholder="********"
                               class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                               value="<?= htmlspecialchars($global_vars['smtp_pass'] ?? '') ?>">
                    </div>

                    <!-- Gönderici Adı -->
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <label for="smtp_name" class="block font-semibold text-sm text-gray-700 mb-2">Gönderici Adı</label>
                        <input type="text" id="smtp_name" name="smtp_name" placeholder="İşletme Adı"
                               class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                               value="<?= htmlspecialchars($global_vars['smtp_name'] ?? '') ?>">
                    </div>
                </div>
            </section>
            
            <!-- Kaydet Butonu -->
            <section class="text-center p-6">
                <button type="submit" id="saveSmtpBtn"
                        class="bg-indigo-600 text-white font-semibold text-lg px-8 py-3 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 transition duration-150 shadow-lg shadow-indigo-500/50">
                    💾 Değişiklikleri Kaydet
                </button>
            </section>
        </form>
    </div>
</main>

<script>
    // Form Gönderimini AJAX'a dönüştürme
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('smtpForm');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);

            try {
                // AJAX modül yolunu belirt
                const res = await fetch('/admin/ajax/smtp.php', {
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