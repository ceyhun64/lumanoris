<?php
$abonelikler = $database->selectMulti("* FROM plans");
?>
<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <?php pageTitle("Abonelik Planları", "Bu sayfada sitenizde sunacağınız abonelik planlarını yönetebilirsiniz."); ?>

        <div class="grid grid-cols-1 lg:grid-cols-[300px_auto] gap-6">
            <aside class="bg-white rounded-xl shadow-lg border border-gray-100 p-4 h-[400px] overflow-y-auto">
                <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-3">Abonelik Planları</h3>
                <ul id="dataUl" class="space-y-2 overflow-auto">
                    <?php foreach ($abonelikler as $abonelik): ?>
                        <li class="flex items-center bg-gray-100 hover:bg-indigo-50/70 text-gray-800 px-3 py-2 rounded-lg cursor-pointer transition duration-150" data-id="<?= $abonelik['id'] ?>">
                            <span class="font-medium"><?= htmlspecialchars($abonelik['name_tr']) ?></span>
                        </li>   
                    <?php endforeach; ?>
                </ul>
            </aside>
            <section class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Plan Bilgileri</h3>
                <form id="dataForm" class="space-y-6" enctype="multipart/form-data">
                    <input type="hidden" name="id" id="id" value="0">
                    <!--form inputs go here-->

                    <div class="flex justify-between gap-2 pt-4">
                        <button type="button" id="new" class="flex-1 hidden bg-gray-200 text-indigo-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 active:bg-gray-400 active:scale-95 transition duration-150">Yeni Ekle</button>
                        <button type="submit" id="saveOrUpdate" class="flex-1 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 transition duration-150 shadow-md shadow-indigo-500/30">Kaydet</button>
                        <button type="button" id="delete" class="flex-1 hidden bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 active:bg-red-800 active:scale-95 transition duration-150 shadow-md shadow-red-500/30">Sil</button>
                    </div>
                </form>
            </section>
        </div>
    </div>
</main>
<script>
    // Resim önizleme fonksiyonu (her iki sayfa için de ortak)
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
        const form = document.getElementById("chatbotForm"); // Form ID'si farklı
        const saveOrUpdateBtn = document.getElementById("saveOrUpdate");
        const newBtn = document.getElementById("new");
        const deleteBtn = document.getElementById("delete");
        const dataUl = document.getElementById("kategoriUl"); // Liste ID'si farklı

        // Sidebar'daki öğelere tıklama olayını ekleme (Veri Okuma)
        dataUl.querySelectorAll("li").forEach(li => {
            li.addEventListener("click", async () => {
                const id = li.dataset.id;

                const formData = new FormData();
                formData.append("table", "chatbotlar c JOIN kullanicilar k ON c.author_user_id = k.id");
                formData.append("columns", "c.*, CONCAT(k.ad_soyad, ' (', k.kullanici_adi, ')') AS creator_name");
                formData.append("where", "c.id = " + id);

                try {
                    const res = await fetch("/admin/ajax/read.php", {
                        method: "POST",
                        body: formData
                    });
                    const resText = await res.text();
                    const result = JSON.parse(resText);

                    if (result.success === true) {
                        const row = result.data[0];
                        
                        // Form alanlarını doldurma (Chatbot alan adları kullanılarak)
                        Object.keys(row).forEach(key => {
                            if (form[key]) {
                                // Gelen key'ler ile form elemanları eşleşmeli
                                if (key === "kapak_fotografi" || key === "profil_fotografi") {
                                    document.getElementById(key + "_preview").src = row[key] || '';
                                } else {
                                    form[key].value = row[key];
                                }
                            }
                        });

                        // Aktif olan listeyi vurgula
                        dataUl.querySelectorAll("li").forEach(item => {
                            item.classList.remove("bg-white", "text-black", "pointer-events-none", "shadow-inner");
                            item.classList.add("bg-gray-100", "hover:bg-gray-200");
                        });

                        li.classList.remove("bg-gray-100", "hover:bg-gray-200");
                        li.classList.add("bg-white", "text-black", "pointer-events-none", "shadow-inner");

                        saveOrUpdateBtn.textContent = "Güncelle";
                        newBtn.classList.remove("hidden");
                        deleteBtn.classList.remove("hidden");
                    } else {
                        new Notification({
                            text: result.message,
                            type: "error",
                            position: "top-right"
                        });
                    }
                } catch (err) {
                    new Notification({
                        text: "Chatbot bilgisi alınamadı: " + err.message,
                        type: "error",
                        position: "top-right"
                    });
                }
            });
        });

        // Yeni Ekle butonuna basıldığında formu temizleme
        newBtn.addEventListener("click", () => {
            form.reset();
            form.id.value = "0";
            saveOrUpdateBtn.textContent = "Kaydet";
            newBtn.classList.add("hidden");
            deleteBtn.classList.add("hidden");

            // Varsayılan resim önizlemelerini temizle
            document.getElementById('kapak_fotografi_preview').src = '';
            document.getElementById('profil_fotografi_preview').src = '';

            // Aktif stili temizleme
            dataUl.querySelectorAll("li").forEach(item => {
                item.classList.remove("bg-white", "text-black", "pointer-events-none", "shadow-inner");
                item.classList.add("bg-gray-100", "hover:bg-indigo-50/70");
            });
        });

        // Kaydet/Güncelle butonuna basıldığında (Form Gönderimi)
        saveOrUpdateBtn.addEventListener("click", async (event) => {
            event.preventDefault();
            const id = form.id.value;

            const formData = new FormData();
            formData.append("table", "chatbotlar");

            const data = {};
            Array.from(form.elements).forEach(el => {
                if (!el.name || el.type === "file" || el.name === "creator_name") return;
                data[el.name] = el.value;
            });
            
            formData.append("data", JSON.stringify(data));

            // Dosyaları işle
            Array.from(form.elements).forEach(el => {
                if (el.type === "file" && el.files.length > 0) {
                    formData.append(el.name + "_file", el.files[0]);
                    // Not: Abonelik kodunda dosya verisi base64 olarak ekleniyordu. Chatbot kodunuzda ise dosya yolu ekleniyordu.
                    // Burada Abonelik kodundaki gibi Base64 okuma mantığını ekliyorum (Ancak bu, sunucu tarafında dosya kaydetme kodunuzun buna göre ayarlanmasını gerektirir)
                    const file = el.files[0];
                    const reader = new FileReader();
                    reader.onload = () => {
                        data[el.name] = reader.result; // Base64 veriyi data objesine ekle (Orijinal planda bu vardı)
                    };
                    reader.readAsDataURL(file);
                }
            });

            let url = "/admin/ajax/create.php";

            if (id !== "0") {
                url = "/admin/ajax/update.php";
                formData.append("where", "id = " + id);
            }

            try {
                const res = await fetch(url, {
                    method: "POST",
                    body: formData
                });
                const resultText = await res.text();
                const result = JSON.parse(resultText);

                new Notification({
                    text: result.message,
                    type: result.success === true ? "success" : "error",
                    position: "top-right",
                    autoClose: 3000,
                    showProgress: true
                });
                
                if (result.success) {
                    if (id === "0") {
                        // Yeni Kayıt ve Listeyi Güncelleme (Abonelik planı mantığına benzer)
                        form.reset();
                        form.id.value = "0";
                        newBtn.classList.add("hidden");
                        deleteBtn.classList.add("hidden");
                        saveOrUpdateBtn.textContent = "Kaydet";
                        
                        const newId = result.id;
                        const newLi = document.createElement("li");
                        const newName = form.isim.value || 'Yeni Chatbot'; // 'name_tr' yerine 'isim'
                        
                        newLi.className = "flex items-center bg-gray-100 hover:bg-indigo-50/70 text-gray-800 px-3 py-2 rounded-lg cursor-pointer transition duration-150";
                        newLi.dataset.id = newId;
                        newLi.innerHTML = `<span class="font-medium">${newName}</span>`;
                        dataUl.appendChild(newLi);

                        // Yeni eklenen öğeyi seçili yap
                        dataUl.querySelectorAll("li").forEach(item => {
                            item.classList.remove("bg-white", "text-black", "pointer-events-none", "shadow-inner");
                            item.classList.add("bg-gray-100", "hover:bg-indigo-50/70");
                        });
                        newLi.classList.remove("bg-gray-100", "hover:bg-indigo-50/70");
                        newLi.classList.add("bg-white", "text-black", "pointer-events-none", "shadow-inner");

                    } else {
                        // Güncelleme ve Listeyi Güncelleme
                        const existingLi = dataUl.querySelector(`li[data-id="${id}"]`);
                        const newName = form.isim.value; // 'name_tr' yerine 'isim'
                        if (existingLi) {
                            existingLi.querySelector('span').textContent = newName;
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                new Notification({
                    text: "İşlem sırasında bir hata oluştu: " + err.message,
                    type: "error",
                    position: "top-right",
                    autoClose: 3000,
                    showProgress: true
                });
            }
        });

        // Silme Butonu
        deleteBtn.addEventListener("click", async () => {
            const id = form.id.value;
            const currentLi = dataUl.querySelector(`li[data-id="${id}"]`);
            const dataName = form.isim.value || "Bu plan"; // 'isim' kullanılıyor

            if (id === "0") {
                new Notification({
                    text: "Silmek için bir plan seçili olmalı.",
                    type: "error",
                    position: "top-right"
                });
                return;
            }

            if (confirm(`Emin misiniz? "${dataName}"ı kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.`)) {

                const formData = new FormData();
                formData.append("table", "chatbotlar");
                formData.append("where", "id = " + id);

                try {
                    const res = await fetch("/admin/ajax/delete.php", {
                        method: "POST",
                        body: formData
                    });
                    const resText = await res.text();
                    const result = JSON.parse(resText);

                    if (result.success === true) {
                        if (currentLi) {
                            currentLi.remove();
                        }

                        // Formu ve butonları sıfırla (Abonelik planı mantığına benzer)
                        form.reset();
                        form.id.value = "0";
                        saveOrUpdateBtn.textContent = "Kaydet";
                        newBtn.classList.add("hidden");
                        deleteBtn.classList.add("hidden");
                        
                        // Aktif stilini temizleme
                        dataUl.querySelectorAll("li").forEach(item => {
                            item.classList.remove("bg-white", "text-black", "pointer-events-none", "shadow-inner");
                            item.classList.add("bg-gray-100", "hover:bg-indigo-50/70");
                        });

                        new Notification({
                            text: result.message,
                            type: "success",
                            position: "top-right",
                            autoClose: 3000,
                            showProgress: true
                        });
                    } else {
                        new Notification({
                            text: result.message,
                            type: "error",
                            position: "top-right"
                        });
                    }
                } catch (err) {
                    new Notification({
                        text: "Silme işlemi sırasında bir hata oluştu: " + err.message,
                        type: "error",
                        position: "top-right"
                    });
                }
            }
        });
    });
</script>