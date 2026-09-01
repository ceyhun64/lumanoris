import { OG_IMAGE, SITE_NAME, SITE_DESCRIPTION, absoluteUrl } from '@/shared/config/site';

/**
 * Bir sayfanın metadata'sını tek yerden kurar.
 *
 * Neden yardımcı bir fonksiyon: canonical'ın en sık yapılan hatası, sayfaların
 * bir kısmına eklenip bir kısmına unutulmasıdır. Tek giriş noktası olunca
 * `path` verilen her sayfa canonical'ını, OG URL'ini ve OG başlığını otomatik
 * ve tutarlı alıyor.
 *
 * `absoluteUrl` trailing slash ekliyor — next.config.mjs'te `trailingSlash:
 * true` olduğu için slash'sız her URL 308 redirect. Canonical bir redirect'i
 * göstermemeli.
 *
 * @param {object}  o
 * @param {string}  o.title        Sayfa başlığı (marka eki layout template'inden gelir)
 * @param {string}  o.description  Sayfaya özgü açıklama
 * @param {string}  o.path         Site köküne göre yol, ör. "/hakkimizda"
 * @param {boolean} [o.index=true] false ise noindex,nofollow
 */
export function pageMetadata({ title, description, path, index = true }) {
  const url = absoluteUrl(path);
  const desc = description || SITE_DESCRIPTION;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    robots: index
      ? undefined
      : { index: false, follow: false },
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      siteName: SITE_NAME,
      url,
      title: `${title} | ${SITE_NAME}`,
      description: desc,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description: desc,
      images: [OG_IMAGE.url],
    },
  };
}
