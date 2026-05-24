<?php
$is_offline = $database->getGlobalVars('offline')['offline'];
?>
<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <!-- Başlık -->
        <section class="text-center mb-10">
            <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">⚙️ Genel Ayarlar</h2>
            <p class="text-gray-500 mt-1">Bu sayfada sitenizin temel ayarlarını yapabilirsiniz.</p>
        </section>

        <!-- Ayarlar Formu (Sadece Bakım Modu) -->
        <form id="genelAyarlarForm" class="mx-auto" style="max-width: 800px;">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">
            
            <!-- Bakım Modu ve Kaydet Butonu Kartı -->
            <section class="bg-white rounded-xl shadow-xl border border-gray-100 p-8 mb-8 text-center">
                <h3 class="text-xl font-bold text-gray-800 border-b pb-3 mb-6">Temel Site Ayarları</h3>
                
                <!-- Bakım Modu Basit Tailwind Toggle Stili -->
                <div class="flex items-center justify-center mb-8">
                    <label for="offlineToggle" class="flex items-center cursor-pointer">
                        <!-- Basit Toggle Input (Saf Tailwind ve hile yok) -->
                        <div class="relative">
                            <input type="checkbox" name="offline" value="1" id="offlineToggle" class="hidden peer"
                                <?= ($is_offline == '1') ? 'checked' : ''; ?>>
                            <!-- Toggle Arka Planı -->
                            <div class="w-14 h-8 bg-gray-300 rounded-full shadow-inner peer-checked:bg-red-500 transition-colors duration-300"></div>
                            <!-- Toggle Düğmesi -->
                            <div class="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow peer-checked:translate-x-6 transition-transform duration-300"></div>
                        </div>
                        
                        <span class="ml-4 text-lg font-medium text-gray-700">Bakım Modu (Offline Modu)</span>
                    </label>
                </div>
                
                <!-- Kaydet Butonu -->
                <button type="submit" id="saveGenelAyarBtn"
                        class="bg-indigo-600 text-white font-semibold text-lg px-8 py-3 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 transition duration-150 shadow-lg shadow-indigo-500/50 mt-4">
                    Değişiklikleri Kaydet
                </button>
            </section>
        </form>

        <!-- Veritabanı Yedekleme Alanı (Aynen Kalır) -->
        <hr class="my-8 border-gray-300"> 
        <section class="bg-indigo-50 rounded-xl shadow-xl border border-indigo-200 p-8 max-w-4xl mx-auto">
            <h3 class="text-2xl font-extrabold mb-4 text-indigo-800">📂 Veritabanı Yönetimi</h3>
            <p class="text-indigo-700 leading-relaxed mb-6">
                Bu bölümde veritabanınızı yedekleyebilir ve geri yükleme işlemlerini gerçekleştirebilirsiniz.
                Olası sunucu kaynaklı teknik sorunlara karşı, <strong>Zamanlanmış Görevler</strong> bölümünden
                düzenli olarak yedekleme modülünü çalıştırmanızı öneririz.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Yedekle Butonu -->
                <div>
                    <button id="db-backup" 
                        class="w-full bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition duration-150 shadow-md shadow-blue-500/30"
                        onclick="backupDatabase()">
                        Yedekle
                    </button>
                </div>
                <!-- Geri Yükle Butonu (Daha dikkat çekici tehlike rengi) -->
                <div>
                    <button id="db-restore" 
                        class="w-full bg-red-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 active:scale-[0.98] transition duration-150 shadow-md shadow-red-500/30"
                        onclick="restoreDatabase()">
                        Geri Yükle
                    </button>
                </div>
            </div>
        </section>
    </div>
</main>
<script>
    // JS fonksiyonları ve AJAX mantığı, sadece form data gönderme kısmı basitleştirilerek aynen kalır.
    
    function backupDatabase()
    {
        fetch('ajax/db_backup.php?mode=backup', {method: 'GET'})
        .then(response => response.json()) 
        .then(t => {
            new Notification({
                text: t.message,
                type: t.status === "success" ? "success" : "error",
                position: "top-right"
            });
        })
        .catch(err => {
            new Notification({
                text: "Yedekleme hatası: " + err.message,
                type: "error",
                position: "top-right"
            });
        });
    }

    function restoreDatabase()
    {
        if (!confirm("Veritabanını yedekten geri yüklemek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
            return;
        }

        fetch('ajax/db_backup.php?mode=restore', {method: 'GET'})
        .then(response => response.json()) 
        .then(t => {
            new Notification({
                text: t.message,
                type: t.status === "success" ? "success" : "error",
                position: "top-right"
            });
        })
        .catch(err => {
            new Notification({
                text: "Geri yükleme hatası: " + err.message,
                type: "error",
                position: "top-right"
            });
        });
    }

    // Form Gönderimini AJAX'a dönüştürme
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('genelAyarlarForm');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Sadece offline checkbox'ı ve csrf_token'ı gönder
            const formData = new FormData();
            formData.append('csrf_token', this.querySelector('input[name="csrf_token"]').value);
            
            // Checkbox işaretliyse 1, değilse 0 gönder
            const offlineCheckbox = this.querySelector('input[name="offline"]');
            formData.append('offline', offlineCheckbox.checked ? '1' : '0');
            
            // Tema seçimi kaldırıldığı için sadece bu iki veriyi gönderiyoruz.

            try {
                const res = await fetch('/admin/ajax/ayarlar.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await res.json();
                
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