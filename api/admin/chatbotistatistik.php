<?php
$chatbotlar = $database->selectMulti("id, isim FROM chatbotlar");
?>
<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <?php pageTitle("Chatbot İstatistikleri", "Bu sayfada chatbotlarınızın kullanıcı istatistiklerini inceleyip görebilirsiniz."); ?>

        <div class="grid grid-cols-1 lg:grid-cols-[300px_auto] gap-6">
            <aside class="bg-white rounded-xl shadow-lg border border-gray-100 p-4 h-[400px] overflow-y-auto">
                <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-3">Chatbotlar</h3>
                <ul id="dataUl" class="space-y-2 overflow-auto">
                    <?php foreach ($chatbotlar as $chatbot): ?>
                        <li class="flex items-center bg-gray-100 hover:bg-indigo-50/70 text-gray-800 px-3 py-2 rounded-lg cursor-pointer transition duration-150" data-id="<?= $chatbot['id'] ?>">
                            <span class="font-medium"><?= htmlspecialchars($chatbot['isim']) ?></span>
                        </li>   
                    <?php endforeach; ?>
                </ul>
            </aside>
            <section class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Chatbot İstatistikleri</h3>
                <form id="dataForm" class="space-y-6" enctype="multipart/form-data">
                    <input type="hidden" name="id" id="id" value="0">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label for="chatbot_chats" class="block font-semibold text-sm text-gray-700 mb-2">Toplam Mesaj</label>
                          <input type="text" id="chatbot_chats" name="chatbot_chats" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"  readonly>
                        </div>
                        <div>
                          <label for="chatbot_visits" class="block font-semibold text-sm text-gray-700 mb-2">Ziyaret</label>
                          <input type="text" id="chatbot_visits" name="chatbot_visits" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" readonly>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label for="chatbot_likes" class="block font-semibold text-sm text-gray-700 mb-2">Beğeni</label>
                          <input type="text" id="chatbot_likes" name="chatbot_likes" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"  readonly>
                        </div>
                        <div>
                          <label for="chatbot_dislikes" class="block font-semibold text-sm text-gray-700 mb-2">Beğenmeme (Dislike)</label>
                          <input type="text" id="chatbot_dislikes" name="chatbot_dislikes" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"  readonly>
                        </div>
                        <div>
                          <label for="chatbot_follows" class="block font-semibold text-sm text-gray-700 mb-2">Takip</label>
                          <input type="text" id="chatbot_follows" name="chatbot_follows" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"  readonly>
                        </div>
                    </div>

                    <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-4 mt-8">Rapor Özetleri</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                        <label class="block font-semibold text-sm text-red-700 mb-2">Cinsel İçerik</label>
                        <input type="text" id="report_sexual" name="report_sexual" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 focus:outline-none shadow-sm text-red-600 font-bold" readonly value="0">
                        </div>
                        <div>
                        <label class="block font-semibold text-sm text-red-700 mb-2">Yasal Sorun</label>
                        <input type="text" id="report_legal" name="report_legal" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 focus:outline-none shadow-sm text-red-600 font-bold" readonly value="0">
                        </div>
                        <div>
                        <label class="block font-semibold text-sm text-red-700 mb-2">Terörizm</label>
                        <input type="text" id="report_terrorism" name="report_terrorism" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 focus:outline-none shadow-sm text-red-600 font-bold" readonly value="0">
                        </div>
                        <div>
                        <label class="block font-semibold text-sm text-red-700 mb-2">Spam</label>
                        <input type="text" id="report_spam" name="report_spam" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 focus:outline-none shadow-sm text-red-600 font-bold" readonly value="0">
                        </div>
                    </div>

                    <!-- YENİ BÖLÜM: Rapor Detayları Listesi -->
                    <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-4 mt-8">Gelen Şikayet Detayları</h3>
                    <div id="reportDetailsList" class="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        <p class="text-gray-500 italic text-sm">Detayları görmek için bir chatbot seçin.</p>
                    </div>
                </form>
            </section>
        </div>
    </div>
</main>

<script>
    const tables = ["chatbot_visits","chatbot_likes","chatbot_dislikes","chatbot_follows","chatbot_chats"];

    const reportTypes = [
        { id: "report_sexual", value: "sexual_content" },
        { id: "report_legal", value: "legal_issue" },
        { id: "report_terrorism", value: "terrorism" },
        { id: "report_spam", value: "spam" }
    ];

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById("dataForm");
        const dataUl = document.getElementById("dataUl");
        const reportDetailsList = document.getElementById("reportDetailsList");

        dataUl.querySelectorAll("li").forEach(li => {
            li.addEventListener("click", async () => {
                const id = li.dataset.id;
                
                // 1. MEVCUT TABLOLARIN DÖNGÜSÜ
                tables.forEach(async table => {
                    const formData = new FormData();
                    formData.append("table", table);
                    formData.append("columns", "COUNT(*) as total");
                    formData.append("where", "chatbot_id = " + id);

                    try {
                        const res = await fetch("/admin/ajax/read.php", { method: "POST", body: formData });
                        const result = await res.json();
                        if (result.success === true) {
                            form[table].value = result.data[0].total;
                            // Aktiflik sınıfları
                            dataUl.querySelectorAll("li").forEach(item => {
                                item.classList.remove("bg-white", "text-black", "pointer-events-none", "shadow-inner");
                                item.classList.add("bg-gray-100", "hover:bg-gray-200");
                            });
                            li.classList.remove("bg-gray-100", "hover:bg-gray-200");
                            li.classList.add("bg-white", "text-black", "pointer-events-none", "shadow-inner");
                        } else {
                            form[table].value = 0;
                        }
                    } catch (err) { console.error(err); }
                });

                // 2. RAPOR ÖZET SAYILARI (Badge sayıları)
                reportTypes.forEach(async report => {
                    const formData = new FormData();
                    formData.append("table", "chatbot_reports");
                    formData.append("columns", "COUNT(*) as total");
                    formData.append("where", "chatbot_id = " + id + " AND FIND_IN_SET('" + report.value + "', reported_for) > 0");

                    try {
                        const res = await fetch("/admin/ajax/read.php", { method: "POST", body: formData });
                        const result = await res.json();
                        if (result.success === true) {
                            document.getElementById(report.id).value = result.data[0].total;
                        } else {
                            document.getElementById(report.id).value = 0;
                        }
                    } catch (err) { console.error(err); }
                });

                // 3. YENİ: RAPOR DETAYLARINI ÇEKME (report_detail)
                const detailFormData = new FormData();
                detailFormData.append("table", "chatbot_reports");
                detailFormData.append("columns", "reported_for, report_detail, reported_at");
                detailFormData.append("where", "chatbot_id = " + id + " ORDER BY reported_at DESC");

                try {
                    const res = await fetch("/admin/ajax/read.php", { method: "POST", body: detailFormData });
                    const result = await res.json();
                    
                    reportDetailsList.innerHTML = ""; // Listeyi temizle

                    if (result.success === true && result.data.length > 0) {
                        result.data.forEach(item => {
                            // Badge'leri güzelleştirelim (Virgülle ayrılmış SET değerlerini diziye çevirip dönebiliriz)
                            const badges = item.reported_for.split(',').map(tag => 
                                `<span class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase mr-1">${tag.replace('_', ' ')}</span>`
                            ).join('');

                            const detailHtml = `
                                <div class="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm hover:border-red-200 transition">
                                    <div class="flex justify-between items-center mb-2">
                                        <div class="flex flex-wrap">${badges}</div>
                                        <span class="text-xs text-gray-400 font-medium">${item.reported_at}</span>
                                    </div>
                                    <p class="text-sm text-gray-700 leading-relaxed italic">
                                        "${item.report_detail || 'Kullanıcı detay belirtmemiş.'}"
                                    </p>
                                </div>
                            `;
                            reportDetailsList.insertAdjacentHTML('beforeend', detailHtml);
                        });
                    } else {
                        reportDetailsList.innerHTML = `<p class="text-gray-500 italic text-sm bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center">Bu chatbot için henüz detaylı bir şikayet kaydı bulunmuyor.</p>`;
                    }
                } catch (err) {
                    reportDetailsList.innerHTML = `<p class="text-red-500 text-sm">Detaylar yüklenirken bir hata oluştu.</p>`;
                }
            });
        });
    });
</script>