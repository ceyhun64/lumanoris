<?php
    // Database zaten yukarıda import edildiği için direkt değişkenleri çekiyoruz
    $anasayfa_resimler = $database->getGlobalVars("anasayfa_resim1", "anasayfa_resim2", "anasayfa_resim3");
?>

<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <?php pageTitle("Anasayfa Resimleri", "Bu sayfada, sitenizin ana sayfasında yer alan resimleri tayin edebilirsiniz."); ?>
        
        <form id="mainForm" class="space-y-6" enctype="multipart/form-data">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <?php 
                $fields = [
                    'anasayfa_resim1' => 'Kapak Fotoğrafı 1',
                    'anasayfa_resim2' => 'Kapak Fotoğrafı 2',
                    'anasayfa_resim3' => 'Kapak Fotoğrafı 3'
                ];

                foreach ($fields as $key => $label): 
                    $currentPath = !empty($anasayfa_resimler[$key]) ? '/' . $anasayfa_resimler[$key] : 'https://placehold.co/600x400?text=Resim+Yok';
                ?>
                    <div class="border border-indigo-200 bg-indigo-50 p-4 rounded-lg">
                        <h4 class="font-bold text-md text-indigo-700 mb-3"><?= $label ?></h4>
                        <div class="flex flex-col gap-4">
                            <img src="<?= $currentPath ?>" id="<?= $key ?>_preview" 
                                 class="w-full h-48 object-cover rounded-lg shadow-md border bg-white" alt="Görsel Önizleme">
                            <div>
                                <label for="<?= $key ?>" class="block font-semibold text-sm text-gray-700 mb-1">Görsel Yükle (PNG/JPEG/WebP)</label>
                                <input type="file" id="<?= $key ?>" name="<?= $key ?>" accept="image/*"
                                       class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                                       onchange="previewImage(event, '<?= $key ?>_preview')">
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
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
    function previewImage(event, id) {
        const input = event.target;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById(id).src = e.target.result;
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

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