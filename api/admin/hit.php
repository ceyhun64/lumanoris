<?php
$hits = $database->selectMulti("page_url, COUNT(*) as hits FROM page_hits GROUP BY page_url ORDER BY hits DESC");
?>

<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <!-- Başlık (Admin Yönetimi sayfasındaki stile uygun hale getirildi) -->
        <section class="text-center mb-10">
            <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">📊 Ziyaretçi İstatistikleri</h2>
            <p class="text-gray-500 mt-1">Bu sayfada sitenizin genel ziyaret istatistiklerini inceleyebilirsiniz.</p>
        </section>

        <!-- Tablo Alanı (Modern Kart İçinde) -->
        <section class="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
            <h3 class="font-bold text-xl mb-4 text-gray-800 border-b pb-3">En Çok Ziyaret Edilen Sayfalar</h3>
            
            <div class="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                <table class="min-w-full text-sm text-left text-gray-700">
                    <thead class="bg-indigo-50 border-b border-indigo-200 text-indigo-700">
                        <tr>
                            <!-- Başlıklar daha dolgun ve belirgin yapıldı -->
                            <th class="px-5 py-3 font-bold text-xs uppercase tracking-wider">#</th>
                            <th class="px-5 py-3 font-bold text-xs uppercase tracking-wider">Sayfa URL</th>
                            <th class="px-5 py-3 font-bold text-xs uppercase tracking-wider text-right">Ziyaret Sayısı</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <?php foreach($hits as $index => $row): ?>
                            <!-- Satır stili daha zarif ve hover rengi indigo yapıldı -->
                            <tr class="even:bg-white odd:bg-gray-50 hover:bg-indigo-50/50 transition duration-150">
                                <td class="px-5 py-3 font-medium text-gray-600"><?= $index + 1 ?></td>
                                <td class="px-5 py-3 break-words text-gray-800">
                                    <a href="<?= htmlspecialchars($row['page_url']) ?>" target="_blank" class="text-indigo-600 hover:text-indigo-800 transition">
                                        <?= htmlspecialchars($row['page_url']) ?>
                                    </a>
                                </td>
                                <td class="px-5 py-3 font-extrabold text-base text-indigo-700 text-right"><?= $row['hits'] ?></td>
                            </tr>
                        <?php endforeach; ?>
                        
                        <!-- Veri yoksa mesaj satırı -->
                        <?php if (empty($hits)): ?>
                            <tr>
                                <td colspan="3" class="px-5 py-4 text-center text-gray-500">
                                    Henüz ziyaret istatistiği kaydedilmemiştir.
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</main>