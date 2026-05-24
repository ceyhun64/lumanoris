<?php
$teslimat_iade_metini = $database->getGlobalVars('teslimat_iade_sartlari')['teslimat_iade_sartlari'];
?>
<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <?php pageTitle("Teslimat ve İade Şartları", "Bu sayfada sitenizin teslimat ve iade şartlarını düzenleyebilirsiniz."); ?>
        <form id="teslimatForm" class="space-y-6" enctype="multipart/form-data">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">
             <!--form inputs go here-->

            <div class="mt-4">
              <label for="teslimat_iade_sartlari" class="block font-semibold text-sm text-gray-700 mb-2">Teslimat ve İade Şartları</label>
              <textarea id="teslimat_iade_sartlari" name="teslimat_iade_sartlari" rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"></textarea>
            </div>

            <div class="pt-2 text-right">
                <button type="submit" id="saveBtn" class="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 transition duration-150 shadow-md shadow-indigo-500/30">
                    Kaydet
                </button>
            </div>
        </form>
    </div>
</main>
<script src="https://cdn.ckeditor.com/ckeditor5/36.0.0/classic/ckeditor.js"></script>
<script>
    let editorInstance;

    const editorConfig = {
        ckfinder: { uploadUrl: '/admin/ajax/upload.php' },
        toolbar: ['heading', '|', 'bold', 'italic', 'link'],
        heading: {
            options: [
                { model: 'paragraph', title: 'Paragraf', class: 'ck-heading_paragraph' },
                { model: 'heading1', view: 'h1', title: 'Başlık 1', class: 'ck-heading_heading1' },
                { model: 'heading2', view: 'h2', title: 'Başlık 2', class: 'ck-heading_heading2' },
                { model: 'heading3', view: 'h3', title: 'Başlık 3', class: 'ck-heading_heading3' }
            ]
        }
    };

    ClassicEditor.create(document.querySelector('#teslimat_iade_sartlari'), editorConfig)
        .then(editor => { 
            editorInstance = editor; 
            editor.ui.view.editable.element.style.minHeight = '300px';
            editor.plugins.get('FileRepository').createUploadAdapter = loader => {
                return {
                    upload: () => {
                        return loader.file.then(file => {
                            const data = new FormData();
                            data.append('file', file);
                            data.append('csrf_token', "<?= $_SESSION['csrf_token'] ?>"); // token ekleniyor

                            return fetch('/admin/ajax/upload.php', {
                                method: 'POST',
                                body: data
                            })
                            .then(res => res.json());
                        });
                    }
                };
            };
        }).catch(console.error);
</script>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        editorInstance.setData(<?= json_encode($teslimat_iade_metini) ?>);
        const form = document.getElementById('teslimatForm');
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