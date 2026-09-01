import { SITE_URL } from '@/shared/config/site';

/**
 * SEO-002: robots.txt'in TEK authoritative kaynağı burası.
 *
 * Önceden iki paralel sistem vardı ve ikisi birbirini görmüyordu:
 *   • `web/public/robots.txt` — yayında servis edilen dosya (artık silindi;
 *     public/ altındaki statik dosya bu route'u ezerdi).
 *   • `api/admin/ajax/seo.php` — admin panelindeki "robots.txt" alanı,
 *     `file_put_contents('../../robots.txt')` ile CWD'ye göre çözülen bir yola
 *     yazıyordu; hiçbir senaryoda yayındaki dosyaya ulaşmıyordu.
 *
 * Eksik olan `Sitemap:` satırı da buradan geliyor.
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /dashboard/* oturum arkasında ve ilk HTML'de yalnızca "Oturum
        // kontrol ediliyor..." kabuğu var; /api ve /admin zaten sayfa değil.
        //
        // /docs/ — web/public/docs/ altındaki .docx sözleşme kaynakları ve
        // iyzico logo paketi. public/ altındaki her şey site kökünden
        // servis edildiği için bunlar /docs/... adresinden indirilebiliyor ve
        // Google .docx dosyalarını indeksler: aynı sözleşme metni hem
        // /kullanim-kosullari/ hem de bir Word dosyası olarak indekse girer,
        // yani kendi sayfalarımızla duplicate content üretirdi.
        //
        // NOT: bu yalnızca indekslemeyi engeller, ERİŞİMİ engellemez —
        // dosyalar adresi bilen herkes tarafından hâlâ indirilebilir.
        // Kalıcı çözüm onları public/ dışına taşımak.
        disallow: ['/admin/', '/api/', '/dashboard/', '/docs/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
