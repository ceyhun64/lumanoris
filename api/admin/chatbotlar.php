<?php
$chatbotlar = $database->selectMulti("c.id, c.isim, k.kullanici_adi FROM chatbotlar c JOIN kullanicilar k ON c.author_user_id = k.id");
$kategoriler = $database->selectMulti("id, kategori_adi_tr FROM chatbot_kategoriler");
?>
<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <?php pageTitle("Chatbotlar", "Bu ekranda sitenizde oluşturulan chatbotları inceleyip düzenleyebilirsiniz."); ?>

        <div class="grid grid-cols-1 lg:grid-cols-[300px_auto] gap-6">
            <aside class="bg-white rounded-xl shadow-lg border border-gray-100 p-4 h-[400px] overflow-y-auto">
                <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-3">Chatbot Listesi</h3>
                <ul id="kategoriUl" class="space-y-2 overflow-auto">
                    <?php foreach ($chatbotlar as $chatbot): ?>
                        <li class="flex items-center bg-gray-100 hover:bg-indigo-50/70 text-gray-800 px-3 py-2 rounded-lg cursor-pointer transition duration-150" data-id="<?= $chatbot['id'] ?>">
                            <span class="font-medium"><?= htmlspecialchars($chatbot['isim']) ?></span>
                        </li>   
                    <?php endforeach; ?>
                </ul>
            </aside>
            <section class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Chatbot Bilgileri</h3>
                <form id="chatbotForm" class="space-y-6" enctype="multipart/form-data">
                    <input type="hidden" name="id" id="id" value="0">
                    <!--form inputs go here-->

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="border border-indigo-200 bg-indigo-50 p-4 rounded-lg">
                            <h4 class="font-bold text-md text-indigo-700 mb-3">Kapak Fotoğrafı</h4>
                            <div class="flex flex-col gap-4">
                                <img src="" id="kapak_fotografi_preview" 
                                    class="w-full h-auto max-h-48 object-cover rounded-lg shadow-md border bg-white" alt="Görsel Önizleme">
                                <div>
                                    <label for="kapak_fotografi" class="block font-semibold text-sm text-gray-700 mb-1">Görsel Yükle (PNG/JPEG/WebP)</label>
                                    <input type="file" id="kapak_fotografi" name="kapak_fotografi" accept="image/*"
                                        class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                                        onchange="previewImage(event,'kapak_fotografi_preview')">
                                </div>
                            </div>
                        </div>
                        <div class="border border-indigo-200 bg-indigo-50 p-4 rounded-lg">
                            <h4 class="font-bold text-md text-indigo-700 mb-3">Profil Fotoğrafı</h4>
                            <div class="flex flex-col gap-4">
                                <img src="" id="profil_fotografi_preview" 
                                    class="w-full h-auto max-h-48 object-cover rounded-lg shadow-md border bg-white" alt="Görsel Önizleme">
                                <div>
                                    <label for="profil_fotografi" class="block font-semibold text-sm text-gray-700 mb-1">Görsel Yükle (PNG/JPEG/WebP)</label>
                                    <input type="file" id="profil_fotografi" name="profil_fotografi" accept="image/*"
                                        class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                                        onchange="previewImage(event,'profil_fotografi_preview')">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                      <label for="creator_name" class="block font-semibold text-sm text-gray-700 mb-2">Oluşturan Kullanıcı</label>
                      <input type="text" id="creator_name" name="creator_name" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" disabled>
                    </div>
                    <div>
                      <label for="isim" class="block font-semibold text-sm text-gray-700 mb-2">Chatbot Adı</label>
                      <input type="text" id="isim" name="isim" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" required>
                    </div>
                    <div>
                      <label for="aciklama" class="block font-semibold text-sm text-gray-700 mb-2">Chatbot Açıklaması</label>
                      <input type="text" id="aciklama" name="aciklama" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" required>
                    </div>
                    <div>
                    <label for="kategori_id" class="block font-semibold text-sm text-gray-700 mb-2">Chatbot Kategorisi</label>
                        <select id="kategori_id" name="kategori_id"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" required>
                            <?php foreach ($kategoriler as $kategori): ?>
                                <option value="<?= $kategori['id'] ?>"><?= $kategori['kategori_adi_tr'] ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="mt-4">
                      <label for="style_prompt" class="block font-semibold text-sm text-gray-700 mb-2">Style Prompt</label>
                      <textarea id="style_prompt" name="style_prompt" rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" required></textarea>
                    </div>
                    <div class="mt-4">
                      <label for="sohbet_basi_mesaj" class="block font-semibold text-sm text-gray-700 mb-2">Sohbet Başı Mesaj</label>
                      <textarea id="sohbet_basi_mesaj" name="sohbet_basi_mesaj" rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" required></textarea>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="ucret_haftalik" class="block font-semibold text-sm text-gray-700 mb-2">Haftalık Ücret (₺)</label>
                            <input type="number" id="ucret_haftalik" name="ucret_haftalik" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" min="0" value="0" required>
                        </div>
                        <div>
                            <label for="ucret_aylik" class="block font-semibold text-sm text-gray-700 mb-2">Aylık Ücret (₺)</label>
                            <input type="number" id="ucret_aylik" name="ucret_aylik" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" min="0" value="0" required>
                        </div>
                    </div>
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
    function previewImage(event,id) {
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
        const form = document.getElementById("chatbotForm");
        const saveOrUpdateBtn = document.getElementById("saveOrUpdate");
        const newBtn = document.getElementById("new");
        const deleteBtn = document.getElementById("delete");
        const dataUl = document.getElementById("kategoriUl");

        dataUl.querySelectorAll("li").forEach(li => {
            li.addEventListener("click", async () => {
                const id = li.dataset.id;

                const formData = new FormData();
                formData.append("table", "chatbotlar c JOIN kullanicilar k ON c.author_user_id = k.id");
                formData.append("columns", "c.*, CONCAT(k.ad_soyad, ' (', k.kullanici_adi, ')') AS creator_name");
                formData.append("where", "c.id = " + id);
                /*formData.append("table", "chatbotlar");
                formData.append("where", "id = " + id);*/

                try {
                    const res = await fetch("/admin/ajax/read.php", {
                        method: "POST",
                        body: formData
                    });
                    const resText = await res.text();
                    const result = JSON.parse(resText);

                    if (result.success === true) {
                        const row = result.data[0]; // ilk obje
                        Object.keys(row).forEach(key => {
                            console.log(key, row[key]); // kontrol için
                            
                            if (form[key]) {
                                if (key === "kapak_fotografi" || key === "profil_fotografi") {
                                    // Base64 string'i img src'ye yaz
                                    //form[key].src = row[key];
                                    document.getElementById(key + "_preview").src = row[key];
                                } else {
                                    form[key].value = row[key];
                                }
                            }
                        });

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
                        text: "Admin bilgisi alınamadı: " + err.message,
                        type: "error",
                        position: "top-right"
                    });
                }
            });
        });

        newBtn.addEventListener("click", () => {
            form.reset();
            form.id.value = "0";
            saveOrUpdateBtn.textContent = "Kaydet";
            newBtn.classList.add("hidden");
            deleteBtn.classList.add("hidden");

            dataUl.querySelectorAll("li").forEach(item => {
                item.classList.remove("bg-white", "text-black", "pointer-events-none", "shadow-inner");
                item.classList.add("bg-gray-100", "hover:bg-gray-200");
            });
        });

        saveOrUpdateBtn.addEventListener("click", async (event) => {
            event.preventDefault();
            const id = form.elements["id"].value;/*form.id.value*/;

            const formData = new FormData();
            formData.append("table", "chatbotlar");

            const data = {};
            Array.from(form.elements).forEach(el => {
                if (!el.name) return;
                if (el.type === "file") return;
                data[el.name] = el.value;
            });
            delete data.creator_name;

            formData.append("data", JSON.stringify(data));

            Array.from(form.elements).forEach(el => {
                if (el.type === "file" && el.files.length > 0) {
                    // Dosyanın kendisini $_FILES için ekle
                    formData.append(el.name + "_file", el.files[0]);

                    // Veritabanına gidecek yol bilgisini data içine ekle
                    const relativePath = "assets/chatbotlar/" + el.name + "/" + el.files[0].name;
                    data[el.name] = relativePath;
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
                //console.log(resultText);
                const result = JSON.parse(resultText);

                new Notification({
                    text: result.message,
                    type: result.success === true ? "success" : "error",
                    position: "top-right",
                    autoClose: 3000,
                    showProgress: true
                });
                if (id === "0" && result.success) {
                    const baslik1 = form.kategori_adi_tr.value;
                    const id = result.id;
                    const li = document.createElement("li");
                    li.className = "bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded cursor-pointer transition";
                    li.dataset.id = id;
                    li.innerText = `baslik1`;
                    dataUl.appendChild(li);

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
                            //console.log(resText);
                            const result = JSON.parse(resText);

                            if (result.success === true) {
                                // otomatik eşleştirme
                                const row = result.data[0];
                                Object.keys(row).forEach(key => {
                                    if (form[key]) {
                                        form[key].value = row[key];
                                    }
                                });

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
                                text: "Veri alınamadı: " + err.message,
                                type: "error",
                                position: "top-right"
                            });
                        }
                    });
                }
                else if(id !== "0" && result.success) {
                    const existingLi = dataUl.querySelector(`li[data-id="id"]`);
                    const baslik1 = form.isim.value;
                    if (existingLi) {
                        existingLi.textContent = baslik1;
                    }
                }
            } catch (err) {
                console.log(err);
                new Notification({
                    text: err,
                    type: "error",
                    position: "top-right",
                    autoClose: 3000,
                    showProgress: true
                });
            }
        });

        deleteBtn.addEventListener("click", async () => {
            const id = form.id.value;
            const currentLi = dataUl.querySelector(`li[data-id="${id}"]`);
            const categoryName = form.isim.value || "Bu chatbot"; // Onay mesajı için isim

            if (id === "0") {
                new Notification({
                    text: "Silmek için bir chatbot seçili olmalı.",
                    type: "error",
                    position: "top-right"
                });
                return;
            }

            if (confirm(`Emin misiniz? "${categoryName}" chatbotını kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.`)) {

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