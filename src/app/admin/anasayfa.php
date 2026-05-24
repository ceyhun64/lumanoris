
<?php
    $anasayfa_resimler = $database->getGlobalVars("anasayfa_resim1","anasayfa_resim2","anasayfa_resim3");
?>
<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <?php pageTitle("Anasayfa Resimleri", "Bu sayfada, sitenizin ana sayfasında yer alan resimleri tayin edebilirsiniz."); ?>
        <form id="mainForm" class="space-y-6" enctype="multipart/form-data">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">
             <!--form inputs go here-->
            
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
        const form = document.getElementById('mainForm');
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