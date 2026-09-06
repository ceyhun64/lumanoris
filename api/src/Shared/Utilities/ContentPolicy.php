<?php
/**
 * COMP-003 — kullanıcı üretimi chatbot içeriği için ilk hat içerik filtresi.
 *
 * NEDEN VAR
 * ---------
 * Platform, personayı/karşılama mesajını/stil promptunu kullanıcının serbest
 * metnine bırakıyor ve bu botlar pazaryerinde ÜCRETLE satılıyor. Bu dosyadan
 * önce hiçbir katmanda tek bir içerik kontrolü yoktu: yasaklı kelime listesi
 * de, insan incelemesi de, rapor üzerine otomatik askıya alma da yok.
 *
 * Ödeme kuruluşlarının yasaklı iş modeli listesi "cinsel içerikli siteler",
 * "erotik nitelikli hizmetler", "pornografik içerikli ürünler", "kumar ve
 * bahis", "her türlü uyuşturucu madde" ve "replika/sahte ürün" kalemlerini
 * doğrudan sayıyor. Moderasyonsuz bir üretici platformunda bunları engelleyen
 * hiçbir şey olmaması, risk değerlendirmesinde "olabilir mi" değil "önleyen ne
 * var" sorusuna verilen boş cevaptır (BLOCKERS B3).
 *
 * BU DOSYA MODERASYON DEĞİLDİR
 * ----------------------------
 * Bir kelime listesi kararlı bir kötüye kullanımı durdurmaz — eş anlamlı,
 * yabancı dil, ima ve kod adı sonsuzdur. Burada amaçlanan üç şey:
 *   1. açık ve kaba ihlalleri kapıda durdurmak,
 *   2. platformun beyan ettiği politikayı KODDA uygulanır kılmak,
 *   3. insan incelemesine giden hacmi düşürmek.
 * Gerçek çözüm rapor kuyruğu + insan incelemesi + yayından kaldırmadır;
 * o iş AUDIT.md COMP-003'te ayrı madde olarak duruyor.
 *
 * YANLIŞ POZİTİF POLİTİKASI
 * -------------------------
 * Meşru bir kullanıcıyı bloklamak, kaçırılan bir ihlalden daha pahalıdır:
 * kullanıcı ne yaptığını anlamaz ve platformu terk eder. Üç önlem var:
 *   • eşleşme sözcük bazında; kök, sözcüğün BAŞINDA olmak zorunda,
 *   • kökten sonra en fazla MAX_SUFFIX_LEN harflik Türkçe ek tolere edilir,
 *   • ek toleransının yarattığı bilinen çakışmalar ALLOWED_TOKENS ile
 *     tek tek muaf tutulur ("seksen", "esrarengiz", "seksiyon" …).
 * Kararsız/çok anlamlı sözcükler (örn. "am", "çıplak", "poker", "slot",
 * "silah", "sıkış") listeye BİLİNÇLİ olarak alınmadı — Türkçe'de masum
 * karşılıkları var ve bunları ayırmak insan işidir.
 */
final class ContentPolicy {
    /**
     * Kullanıcının serbestçe yazdığı, başkalarının GÖRDÜĞÜ alanlar.
     *
     * `training_prompt` BİLİNÇLİ olarak dışarıda: içeriği OCR/PDF/URL
     * içe aktarımından gelen yüz kilobaytlık ham metin. Bir tıp PDF'i
     * "kokain" sözcüğünü geçirdiği için botun reddedilmesi saf yanlış
     * pozitif olurdu; ayrıca her kayıtta o hacmi taramak gereksiz maliyet.
     */
    public const MODERATED_FIELDS = [
        'isim'              => 'Bot adı',
        'aciklama'          => 'Açıklama',
        'style_prompt'      => 'Kişilik / stil promptu',
        'sohbet_basi_mesaj' => 'Karşılama mesajı',
    ];

    /**
     * Sözcük kökü olarak eşleşen terimler (normalize edilmiş biçimde yazılmalı:
     * küçük harf, Türkçe harfler sadeleştirilmiş — "fetiş" değil "fetis").
     *
     * Her grup bir yasaklı iş modeli kalemine karşılık geliyor.
     */
    private const BLOCKED_WORDS = [
        // Cinsel / pornografik içerik
        'porno', 'pornografi', 'sex', 'seks', 'seksuel', 'orgazm',
        'masturbasyon', 'erotik', 'erotizm', 'escort', 'eskort',
        'gigolo', 'jigolo', 'striptiz', 'hentai', 'nsfw', 'ensest',
        'subyan', 'pedofil', 'fetis', 'fetish',
        // Uyuşturucu
        'uyusturucu', 'eroin', 'kokain', 'metamfetamin', 'amfetamin',
        'ecstasy', 'ekstazi', 'mdma', 'bonzai', 'captagon',
        'esrar', 'kenevir', 'marihuana', 'marijuana',
        // Kumar / bahis
        'kumar', 'kumarhane', 'kumarbaz', 'bahis', 'iddaa',
        'casino', 'kasino', 'rulet', 'bookmaker',
        // Reçeteli ilaç / sağlık spam'i
        'viagra', 'cialis',
    ];

    /**
     * Ek toleransının ürettiği bilinen çakışmalar. Bunlar ihlal DEĞİL; eşleşse
     * bile geçilecek sözcükler.
     *
     * Örnekler gerçek: "seksen" = 80 sayısı, kökü "seks" + "en"; "esrarengiz"
     * = gizemli, kökü "esrar" + "engiz". İkisi de tamamen masum ve ikisi de
     * bu liste olmadan bloklanırdı.
     */
    private const ALLOWED_TOKENS = [
        'seksen', 'seksenler', 'seksenli', 'seksenlik', 'sekseninci',
        'seksiyon', 'seksiyonu', 'seksiyonlar',
        'esrarengiz', 'esrarengizlik',
        'kumarin',      // kimyasal bileşik (coumarin)
        'bahisli',      // "bahis" kökünden ama nadiren de olsa nötr kullanım
    ];

    /**
     * Çok sözcüklü kalıplar (normalize edilmiş biçimde). Tek başına masum olan
     * sözcükler — silah, replika, ilaç, sahte — yalnızca satış bağlamıyla
     * birlikte yakalanıyor: "silah" sözcüğünü tek başına bloklamak bir tarih
     * botunu da bloklardı.
     */
    private const BLOCKED_PHRASES = [
        // Şiddet / silah ticareti
        'silah satisi', 'silah satiyorum', 'ruhsatsiz silah', 'mermi satisi',
        // Replika / sahte ürün
        'replika saat', 'replika urun', 'sahte urun',
        'sahte belge', 'sahte diploma', 'sahte fatura',
        // Reçetesiz ilaç
        'recetesiz ilac', 'recetesiz satis',
        // Cinsel içerik, çok sözcüklü
        'cocuk pornosu', 'yetiskin icerik', 'cinsel icerikli', 'cinsel iliski',
    ];

    /**
     * Kökten SONRA gelmesine izin verilen harf sayısı. 0 olsaydı "bahisler"
     * kaçardı; sınırsız olsaydı yanlış pozitifler patlardı. 6, Türkçe ek
     * zincirlerinin pratikteki üst sınırı ("kumarbazliktan" zaten kökle
     * başladığı için yakalanıyor).
     */
    private const MAX_SUFFIX_LEN = 6;

    /**
     * Verilen alanları tarar; ilk ihlalde ValidationException fırlatır.
     *
     * Hata mesajı HANGİ alanın ve HANGİ ifadenin sorunlu olduğunu söylüyor —
     * "içeriğiniz uygun değil" demek kullanıcıyı kör deneme yanılmaya iter ve
     * yanlış pozitifleri de görünmez kılar.
     *
     * @param array<string,mixed> $data  ham (henüz kaydedilmemiş) sütun dizisi
     * @throws ValidationException
     */
    public static function assertClean(array $data): void {
        foreach (self::MODERATED_FIELDS as $column => $label) {
            if (!isset($data[$column]) || !is_scalar($data[$column])) {
                continue;
            }

            $hit = self::firstViolation((string) $data[$column]);
            if ($hit !== null) {
                throw new ValidationException(sprintf(
                    '%s alanı içerik politikamıza aykırı bir ifade içeriyor ("%s"). '
                    . 'Cinsel içerik, kumar/bahis, uyuşturucu, sahte ürün ve reçeteli '
                    . 'ilaç konulu botlar yayınlanamaz.',
                    $label,
                    $hit
                ));
            }
        }
    }

    /**
     * Metinde ilk yakalanan yasaklı terimi döndürür, temizse null.
     *
     * Ayrı ve public: ileride bir inceleme kuyruğu "neden işaretlendi"
     * bilgisini istisna fırlatmadan okuyabilsin diye.
     */
    public static function firstViolation(string $text): ?string {
        $normalized = self::normalize($text);
        if ($normalized === '') {
            return null;
        }

        foreach (self::BLOCKED_PHRASES as $phrase) {
            if (str_contains($normalized, $phrase)) {
                return $phrase;
            }
        }

        $allowed = array_flip(self::ALLOWED_TOKENS);

        foreach (explode(' ', $normalized) as $token) {
            if ($token === '' || isset($allowed[$token])) {
                continue;
            }

            foreach (self::BLOCKED_WORDS as $root) {
                if (!str_starts_with($token, $root)) {
                    continue;
                }
                // Kökten sonrası yalnızca kısa bir ek olabilir. Uzunsa bu
                // başka bir sözcüktür ("esrar" ⊄ "esrarkeşliginden" gibi
                // uzun zincirler zaten ihlal, ama "porno" ⊄ "pornografik
                // olmayan" ayrımını uzunluk değil sözcük sınırı yapıyor).
                if (strlen($token) - strlen($root) <= self::MAX_SUFFIX_LEN) {
                    return $root;
                }
            }
        }

        return null;
    }

    /**
     * Karşılaştırma için metni sadeleştirir.
     *
     * Rakam-harf ikamesi (leet) katlanıyor: "p0rn0", "s3ks" gibi basit
     * kaçışlar aynı köke iniyor. Bedeli, rakam içeren meşru sözcüklerin de
     * katlanması; kelime listesinde rakam içeren terim olmadığı için bu
     * pratikte yanlış pozitif üretmiyor.
     *
     * Harf ve rakam dışındaki her şey tek boşluğa iniyor. Bu, "p-o-r-n-o"
     * gibi ayırıcı kaçışlarını ayrı sözcüklere dağıtır ve YAKALAMAZ —
     * bilinçli bir sınır: bunları kovalamak yanlış pozitif üretir, kararlı
     * kötüye kullanım insan incelemesinin işidir (bkz. dosya başlığı).
     */
    private static function normalize(string $text): string {
        $text = mb_strtolower($text, 'UTF-8');

        $text = strtr($text, [
            'ı' => 'i', 'ş' => 's', 'ğ' => 'g', 'ü' => 'u', 'ö' => 'o',
            'ç' => 'c', 'â' => 'a', 'î' => 'i', 'û' => 'u',
            '0' => 'o', '1' => 'i', '3' => 'e', '4' => 'a', '5' => 's',
            '7' => 't', '@' => 'a', '$' => 's',
        ]);

        $text = preg_replace('/[^a-z0-9]+/u', ' ', $text) ?? '';

        return trim(preg_replace('/\s+/u', ' ', $text) ?? '');
    }
}
