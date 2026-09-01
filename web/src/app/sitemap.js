import { LEGAL_DOCS, PUBLIC_LEGAL_DOCS } from '@/shared/config/legal-docs';
import { absoluteUrl } from '@/shared/config/site';
import { isLegalDocumentPublished } from '@/shared/lib/legal-content.server';

/**
 * SEO-002: sitemap'in TEK authoritative kaynağı burası.
 *
 * `api/admin/ajax/sitemap.php` emekliye ayrıldı. O dosya çıktısını
 * `api/sitemap.xml`'e yazıyordu; server.js yalnızca /api, /admin ve /assets'i
 * PHP'ye proxy'lediği için o yol site kökünden hiçbir zaman erişilemiyordu —
 * `/sitemap.xml` ölçümde 404 dönüyordu. Ayrıca yönlendirilen `/register`'ı
 * listeliyor ve trailing slash'sız URL üretiyordu (her biri 308 redirect).
 *
 * Build sırasında PHP'nin ayakta olmasına bağlı kalmamak için istek anında
 * üretiliyor; sitemap seyrek çekilen bir kaynak, maliyeti önemsiz.
 */
export const dynamic = 'force-dynamic';

export default async function sitemap() {
  // Metni admin panelinde henüz yazılmamış doküman 404 dönüyor (bkz.
  // widgets/info/LegalPage.jsx). 404 dönen bir URL'i sitemap'e koymak Search
  // Console'da doğrudan hata üretir — bu yüzden tek tek doğruluyoruz.
  const published = await Promise.all(
    PUBLIC_LEGAL_DOCS.map(async (key) => ({
      key,
      ok: await isLegalDocumentPublished(key),
    }))
  );

  const entries = [
    // `/` artık gerçek bir sayfa (landing). Önceden `permanentRedirect`
    // olduğu için bilinçli olarak dışarıda bırakılmıştı; yönlendirme
    // kalktığı için sitemap'in en yüksek öncelikli girdisi oldu.
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1.0 },
    // `/register` hâlâ YOK: `/login`e yönleniyor. Yönlendirilen URL'i
    // sitemap'e koymak Search Console'da uyarı üretir.
    { url: absoluteUrl('/login'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/forgot-password'), changeFrequency: 'yearly', priority: 0.3 },
    ...published
      .filter((d) => d.ok)
      .map((d) => ({
        url: absoluteUrl(LEGAL_DOCS[d.key].path),
        changeFrequency: 'yearly',
        priority: 0.5,
      })),
  ];

  // `lastmod` bilerek üretilmiyor: `global_vars` tablosunda güncelleme zamanı
  // sütunu yok (id, var_key, var_value). Her istekte `new Date()` yazmak
  // Google'a "bu sayfa bugün değişti" demek olurdu — uydurulmuş bir sinyal.
  return entries;
}
