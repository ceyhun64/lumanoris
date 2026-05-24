<?php
$chatbot_kategoriler = $database->selectMulti("* FROM chatbot_kategoriler");
?>
<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <?php pageTitle("Chatbot Kategorileri", "Bu sayfada sitenizdeki sunulacak olan chatbotların kategorilerini ekleyip düzenleyebilirsiniz."); ?>

        <div class="grid grid-cols-1 lg:grid-cols-[300px_auto] gap-6">
            <aside class="bg-white rounded-xl shadow-lg border border-gray-100 p-4 h-[400px] overflow-y-auto">
                <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-3">Kategoriler</h3>
                <ul id="kategoriUl" class="space-y-2 overflow-auto">
                    <?php foreach ($chatbot_kategoriler as $kategori): ?>
                        <li class="flex items-center bg-gray-100 hover:bg-indigo-50/70 text-gray-800 px-3 py-2 rounded-lg cursor-pointer transition duration-150" data-id="<?= $kategori['id'] ?>">
                            <span class="font-medium"><?= htmlspecialchars($kategori['kategori_adi_tr']) ?></span>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </aside>
            <section class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Kategori Bilgileri</h3>
                <form id="kategoriForm" class="space-y-6" enctype="multipart/form-data">
                    <input type="hidden" name="id" id="id" value="0">
                    <!--form inputs go here-->
                    <div>
                        <label for="kategori_adi_tr" class="block font-semibold text-sm text-gray-700 mb-2">Kategori Adı (Türkçe)</label>
                        <input type="text" id="kategori_adi_tr" name="kategori_adi_tr" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" required>
                    </div>
                    <div>
                        <label for="kategori_adi_en" class="block font-semibold text-sm text-gray-700 mb-2">Kategori Adı (İngilizce)</label>
                        <input type="text" id="kategori_adi_en" name="kategori_adi_en" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" required>
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
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById("kategoriForm");
        const saveOrUpdateBtn = document.getElementById("saveOrUpdate");
        const newBtn = document.getElementById("new");
        const deleteBtn = document.getElementById("delete");
        const dataUl = document.getElementById("kategoriUl");

        dataUl.querySelectorAll("li").forEach(li => {
            li.addEventListener("click", async () => {
                const id = li.dataset.id;

                const formData = new FormData();
                formData.append("table", "chatbot_kategoriler");
                formData.append("where", "id = " + id);

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
                                form[key].value = row[key];
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
            const id = form.id.value;

            const formData = new FormData();
            formData.append("table", "chatbot_kategoriler");

            const data = {};
            Array.from(form.elements).forEach(el => {
                if (!el.name) return;
                if (el.type === "file") return;
                data[el.name] = el.value;
            });

            formData.append("data", JSON.stringify(data));

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
                    li.innerText = `${baslik1}`;
                    dataUl.appendChild(li);

                    li.addEventListener("click", async () => {
                        const id = li.dataset.id;

                        const formData = new FormData();
                        formData.append("table", "chatbot_kategoriler");
                        formData.append("where", "id = " + id);

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
                } else if (id !== "0" && result.success) {
                    const existingLi = dataUl.querySelector(`li[data-id="${id}"]`);
                    const baslik1 = form.kategori_adi_tr.value;
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
            const categoryName = form.kategori_adi_tr.value || "Bu kategori"; // Onay mesajı için isim

            if (id === "0") {
                new Notification({
                    text: "Silmek için bir kategori seçili olmalı.",
                    type: "error",
                    position: "top-right"
                });
                return;
            }

            // Confirm penceresi
            if (confirm(`Emin misiniz? "${categoryName}" kategorisini kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.`)) {

                const formData = new FormData();
                formData.append("table", "chatbot_kategoriler");
                formData.append("where", "id = " + id);

                try {
                    const res = await fetch("/admin/ajax/delete.php", {
                        method: "POST",
                        body: formData
                    });
                    const resText = await res.text();
                    const result = JSON.parse(resText);

                    if (result.success === true) {
                        // 1. Listedeki öğeyi kaldır (Görsel tutarlılık)
                        if (currentLi) {
                            currentLi.remove();
                        }

                        // 2. Formu temizle ve butonları gizle (Formu temiz moduna döndür)
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
                        // Silme işlemi sunucuda başarısız oldu
                        new Notification({
                            text: result.message,
                            type: "error",
                            position: "top-right"
                        });
                    }
                } catch (err) {
                    // İstemci tarafı veya ağ hatası
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