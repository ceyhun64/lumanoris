<?php

?>
<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <?php pageTitle("Chat Ayarları", "Bu sayfada kullanıcılarınızın chatbot ile etkileşimleriyle ilgili genel ayarları yapabilirsiniz."); ?>
        <form id="Form" class="space-y-6" enctype="multipart/form-data">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">
             <!--form inputs go here-->
            
            <div>
              <label for="gunluk_chat_sinir" class="block font-semibold text-sm text-gray-700 mb-2">Günlük Chat Sınırı</label>
              <input type="text" id="gunluk_chat_sinir" name="gunluk_chat_sinir" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" placeholder="100" required>
            </div>
            <div>
              <label for="chat_reklam_sikligi" class="block font-semibold text-sm text-gray-700 mb-2">Chat İçi Reklam Gösterme Sıklığı</label>
              <input type="text" id="chat_reklam_sikligi" name="chat_reklam_sikligi" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" placeholder="örn. 5 mesajda bir" required>
            </div>

            <div class="pt-2 text-right">
                <button type="submit" id="saveBtn" class="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 transition duration-150 shadow-md shadow-indigo-500/30">
                    Kaydet
                </button>
            </div>
        </form>
    </div>
</main>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('Form');
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            try {
                const res = await fetch('/admin/ajax/updategv.php', {
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