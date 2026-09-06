/**
 * Sitenin kanonik kimliği — tek kaynak.
 *
 * SEO-002: production domain'i hiçbir dosyaya sabitlemiyoruz. Tek kaynak
 * NEXT_PUBLIC_SITE_URL; tanımsızsa geliştirmede localhost'a düşüyoruz ama
 * production build'de sessizce yanlış canonical üretmektense build'i
 * durduruyoruz. Yanlış bir metadataBase, sitenin tamamını yanlış hostname'e
 * canonical'lar — geri alması pahalı bir hatadır.
 */

function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (raw) {
    // Trailing slash'i burada tek sefer kırpıyoruz; absoluteUrl() her yolu
    // "/" ile başlatıyor, aksi hâlde "//" üretirdik.
    return raw.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL tanımlı değil. Production build canonical/OG/sitemap ' +
      'URL üretemez ve sessizce localhost\'a düşmesine izin verilmiyor. ' +
      'web/.env dosyasına NEXT_PUBLIC_SITE_URL=https://www.lumanoris.net ekleyin.'
    );
  }

  return 'http://localhost:3000';
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = 'Lumanoris';

/*
  COMP-006: açıklama ÜRÜNLE başlıyor, kazançla değil.
  Önceki metin ("… gelir elde edebileceğin …") platformu bir kazanç fırsatı
  olarak konumlandırıyordu. Bu, ödeme kuruluşu risk değerlendirmesinde gelir
  vaadi/ağ pazarlaması kalıplarıyla aynı sinyali üretiyor (BLOCKERS B3).
  Pazaryeri hâlâ anlatılıyor — "satışa sunabileceğin" olgusal bir ifade,
  "gelir elde edebileceğin" ise bir vaat. Fark budur.
*/
export const SITE_DESCRIPTION =
  'Lumanoris, kendi yapay zekâ sohbet botlarını oluşturup eğitebileceğin ve ' +
  'dilersen pazaryerinde satışa sunabileceğin Türkçe yapay zekâ platformudur.';

/**
 * Doğrulanmış, gerçek sosyal hesaplar — tek kaynak.
 *
 * Hem alt bilgideki GÖRÜNÜR linkler hem Organization JSON-LD'nin `sameAs`
 * alanı buradan besleniyor. İkisi ayrı listeler olsaydı schema'da sayfada
 * görünmeyen bir adres kalabilirdi; bu dosya o ikisini tek yerde tutuyor.
 * `key`, alt bilgideki ikon adıyla eşleşiyor (LandingFooter `SOCIAL_ICONS`).
 *
 * LinkedIn adresi bilerek `/home/` soneki OLMADAN: o biçim yalnızca oturumu
 * açık kullanıcılar için çalışıyor, anonim ziyaretçiyi 302 ile giriş sayfasına
 * atıyor. Sonek olmadan sayfa 200 dönüyor.
 */
export const SITE_SOCIAL_LINKS = [
  { key: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/lumanoris/' },
  { key: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/channel/UCX6_dT34vajhx8PGk5_1xfA' },
  { key: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/company/luminoris/' },
];

/** Organization JSON-LD `sameAs`. */
export const SITE_SOCIALS = SITE_SOCIAL_LINKS.map((social) => social.url);

export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Lumanoris',
};

/**
 * Kanonik URL üretici.
 *
 * next.config.mjs'te `trailingSlash: true` var: `/login` her zaman 308 ile
 * `/login/`e gidiyor. Canonical ve sitemap bu yüzden sonu slash'li biçimi
 * göstermek zorunda, aksi hâlde her kanonik URL bir redirect'e işaret ederdi.
 */
export function absoluteUrl(path = '/') {
  const clean = `/${String(path).replace(/^\/+/, '')}`;
  const withSlash = clean.endsWith('/') ? clean : `${clean}/`;
  return `${SITE_URL}${withSlash === '//' ? '/' : withSlash}`;
}

/**
 * Dosya (görsel vb.) için mutlak URL. `absoluteUrl` sayfa yollarına trailing
 * slash ekliyor; bir dosya adının sonuna slash koymak onu 404 yapar.
 */
export function assetUrl(path) {
  return `${SITE_URL}/${String(path).replace(/^\/+/, '')}`;
}
