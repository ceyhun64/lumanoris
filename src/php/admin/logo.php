<form id="logo-upload-form" enctype="multipart/form-data">
    <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">
    <div class="col-xs-12 mt-2 text-center">
        <img id="logo-img" src="<?= $logo['var_value'] ?>" class="img-fluid mx-auto" style="max-height: 500px;">
        <input type="file" id="file-input" name="file-input" class="form-control-file my-2 mt-3" accept="image/*">
    </div>
    <div class="text-center p-2">
        <button type="button" class="btn btn-success" id="save">Kaydet</button>
    </div>
</form>

<script>
    const fileInput = document.getElementById('file-input');
    const saveButton = document.getElementById('save');
    const logoImg = document.getElementById('logo-img');

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                logoImg.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    saveButton.addEventListener("click", async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert("Lütfen bir resim seçin!");
            return;
        }

        let formData = new FormData();
        formData.append("file", file);
        formData.append("var_key", "site_logo");

        try {
            const response = await fetch("ajax/updategv.php", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.status === "success") {
                alert("Logo başarıyla güncellendi!");
            } else {
                alert("Güncelleme başarısız: " + result.message);
            }
        } catch (error) {
            alert("Bir hata oluştu: " + error.message);
        }
    });
</script>