<main class="bg-gray-50 p-6 max-w-screen-xl mx-auto min-h-screen">
    <!-- Başlık (Admin Yönetimi sayfasındaki stile uygun hale getirildi) -->
    <section class="text-center mb-10">
        <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">SEO Ayarları</h2>
        <p class="text-gray-500 mt-1">Bu sayfadaki ayarların kapsamı için aşağıdaki nota bakın.</p>
    </section>

    <!--
        SEO-002 — İki paralel SEO sistemi vardı ve biri hiç yayına çıkmıyordu.
        Bu sayfadaki title/description/keywords ve OG/Twitter alanları
        `global_vars` tablosuna yazıyor, ama frontend (Next.js) bu anahtarların
        HİÇBİRİNİ okumuyor: denetimde `web/src/` altında site_baslik, og_title,
        twitter_card vb. için tek bir eşleşme çıkmadı. Yani buraya girilen
        değerler yıllardır yayındaki sayfalara ulaşmıyordu.
        Karar: tek authoritative kaynak Next.js App Router. Alanlar veri
        kaybı olmasın diye silinmedi, ama ne oldukları açıkça yazılıyor.
    -->
    <section class="mb-8">
        <div class="rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
            <p class="font-bold text-amber-900 mb-2">Bu sayfa şu an yayındaki SEO etiketlerini DEĞİŞTİRMİYOR</p>
            <p class="text-sm text-amber-800 leading-relaxed">
                Sitenin başlık, açıklama, canonical, Open Graph ve Twitter etiketleri
                frontend kodundan üretiliyor. Tek kaynak:
                <code class="font-mono text-xs bg-white/60 px-1 rounded">web/src/app/layout.js</code>,
                <code class="font-mono text-xs bg-white/60 px-1 rounded">web/src/shared/config/site.js</code> ve
                <code class="font-mono text-xs bg-white/60 px-1 rounded">web/src/shared/lib/metadata.js</code>.
                Aşağıdaki alanlar veritabanına kaydediliyor ama yayındaki sayfalara
                <strong>ulaşmıyor</strong> — bu her zaman böyleydi, artık gizlenmiyor.
            </p>
            <p class="text-sm text-amber-800 leading-relaxed mt-3">
                <strong>Sözleşme metinleri farklı:</strong> Hakkımızda, Gizlilik Politikası,
                Kullanım Koşulları, Teslimat ve İade, Mesafeli Satış Sözleşmesi ilgili
                admin sayfalarından yönetilmeye devam ediyor ve artık kendi public
                adreslerinde yayınlanıyor (ör. /hakkimizda). Bir metni yazdığınızda
                sayfası ve sitemap kaydı kendiliğinden oluşur; metin boşken sayfa
                bilerek 404 döner.
            </p>
        </div>
    </section>

    <!-- Ana Grid (Kart stili eklendi, gap-6 yapıldı) -->
    <section>
        <div class="grid grid-cols-1 lg:grid-cols-[300px_auto] gap-6">
            
            <!-- Sol Sütun: Navigasyon Kartı (Aside yerine div ve modern kart stili) -->
            <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-4 h-fit sticky top-6">
                <!-- Başlık stili güncellendi -->
                <h3 class="text-xl font-bold text-gray-800 border-b pb-3 mb-3">Ayarlar Kategorileri</h3>
                <!-- Listeyi daha profesyonel göstermek için arkaplan ve gölge kaldırıldı, sadece liste öğelerine stil verildi -->
                <ul class="list-tabs space-y-1">
                    <!-- Liste öğesi stili: flex, items-center, hover:bg-indigo-50/70, text-gray-700, rounded-lg, py-2 -->
                    <li id="li-site" class="flex items-center font-medium bg-gray-100 hover:bg-indigo-50/70 text-gray-700 transition duration-150 pl-4 rounded-lg px-2 py-2 cursor-pointer">
                        <i class="bi bi-gear-fill text-indigo-500 mr-2"></i> Site SEO Ayarları
                    </li>
                    <li id="li-meta" class="flex items-center font-medium bg-gray-100 hover:bg-indigo-50/70 text-gray-700 transition duration-150 pl-4 rounded-lg px-2 py-2 cursor-pointer mt-1">
                        <i class="bi bi-share-fill text-indigo-500 mr-2"></i> OG Meta SEO Ayarları
                    </li>
                    <li id="li-x" class="flex items-center font-medium bg-gray-100 hover:bg-indigo-50/70 text-gray-700 transition duration-150 pl-4 rounded-lg px-2 py-2 cursor-pointer mt-1">
                        <i class="bi bi-twitter-x text-indigo-500 mr-2"></i> Twitter/X SEO Ayarları
                    </li>
                </ul>
            </div>
            
            <!-- Sağ Sütun: İçerik Kartı (Modern kart stili) -->
            <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                
                <div id="seo-site">
                    <!-- Başlık stili güncellendi -->
                    <h3 class="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Site SEO Ayarları</h3>
                    <?php include("subpages/seosite.php"); ?>
                </div>
                
                <div id="seo-meta" style="display: none;">
                    <!-- Başlık stili güncellendi -->
                    <h3 class="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Meta SEO Ayarları</h3>
                    <?php include("subpages/seometa.php"); ?>
                </div>
                
                <div id="seo-x" style="display: none;">
                    <!-- Başlık stili güncellendi -->
                    <h3 class="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Twitter/X SEO Ayarları</h3>
                    <?php include("subpages/seotwitter.php"); ?>
                </div>
                
            </div>
        </div>
    </section>
</main>
<script>
    document.addEventListener("DOMContentLoaded", function () {
        const items = document.querySelectorAll(".list-tabs li");
        const sections = document.querySelectorAll("div[id^='seo-']");

        function updateActiveState(targetId) {
            sections.forEach(section => {
                section.style.display = section.id === targetId ? "block" : "none";
            });

            items.forEach(item => {
                // Tüm eski ve yeni stil sınıflarını kaldır
                item.classList.remove("bg-white", "pointer-events-none", "text-black", "shadow-inner", "bg-indigo-50/70", "text-indigo-700");
                // Varsayılan stili uygula
                item.classList.add("bg-gray-100", "hover:bg-indigo-50/70", "text-gray-700"); 

                const relatedId = item.id.replace("li-", "seo-");
                if (relatedId === targetId) {
                    // Seçili öğe için modern stili uygula (Beyaz arkaplan, Indigo metin, Hafif gölge)
                    item.classList.remove("bg-gray-100", "hover:bg-indigo-50/70", "text-gray-700");
                    item.classList.add("bg-white", "pointer-events-none", "text-indigo-700", "shadow", "shadow-indigo-200/50");
                    // Seçili öğenin içindeki iconun rengini de belirginleştir (Opsiyonel ama iyi görünür)
                    item.querySelector('i').classList.add("text-indigo-700");
                    item.querySelector('i').classList.remove("text-indigo-500");
                } else {
                    // Seçili olmayan öğenin içindeki iconun rengini normale çevir
                    item.querySelector('i').classList.remove("text-indigo-700");
                    item.querySelector('i').classList.add("text-indigo-500");
                }
            });
        }
        updateActiveState("seo-site");

        items.forEach(item => {
            item.addEventListener("click", function () {
                const targetId = this.id.replace("li-", "seo-");
                updateActiveState(targetId);
            });
        });
    });
</script>