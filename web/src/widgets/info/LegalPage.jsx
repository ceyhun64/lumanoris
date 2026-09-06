import { notFound } from 'next/navigation';

import { LEGAL_DOCS, LEGAL_PROSE, PUBLIC_LEGAL_DOCS } from '@/shared/config/legal-docs';
import { COMPANY_IDENTITY, companyIdentityRows, hasCompanyIdentity } from '@/shared/config/company';
import { SITE_NAME, SITE_SOCIALS, SITE_SOCIAL_LINKS, absoluteUrl, assetUrl } from '@/shared/config/site';
import { fetchLegalDocument, isLegalDocumentPublished } from '@/shared/lib/legal-content.server';
import LandingFooter from '@/app/components/landing/LandingFooter';
import LandingHeader from '@/app/components/landing/LandingHeader';
import VideoModalProvider from '@/app/components/landing/VideoModalProvider';

/**
 * Public sözleşme/kurumsal sayfaların ortak kabuğu — SUNUCU bileşeni.
 *
 * Aynı metni gösteren istemci tarafındaki modal (`LegalBody`) duruyor ve
 * değişmedi; buradaki fark, içeriğin JS beklemeden ilk HTML'e girmesi.
 *
 * `chrome`:
 *   'minimal' — sözleşme sayfalarının sade kabuğu (marka + Giriş yap +
 *               kardeş doküman linkleri).
 *   'landing' — ana sayfanın navbar'ı ve footer'ı. Bunu kullanan sayfa
 *               `app/css/landing.css`i kendi route'unda import etmeli ve
 *               stiller `.landing` kökü altında kapsandığı için sarmalayıcı
 *               div o sınıfı taşımalı.
 *
 * Alt bilgideki çapraz bağlantılar yalnızca dekor değil: `/login` yalnızca
 * kullanım koşulları ve gizlilik politikasına bağlanıyor, geri kalan üç sayfa
 * onlar üzerinden keşfediliyor. Bu satır kaldırılırsa üç sayfa orphan kalır.
 * Landing footer'ı aynı dört linki zaten taşıdığı için 'landing' kabuğunda
 * kardeş listesi hiç hesaplanmıyor.
 */
export default async function LegalPage({ docKey, chrome = 'minimal' }) {
  const meta = LEGAL_DOCS[docKey];
  if (!meta) notFound();

  // Backend kapalıysa `fetchLegalDocument` fırlatıyor ve Next 500 döndürüyor.
  // Bilinçli: geçici bir arıza 404'e çevrilirse Google sayfayı silinmiş sayar.
  const { state, html } = await fetchLegalDocument(docKey);

  // Metin admin panelinde henüz yazılmamış → sayfa gerçekten yok.
  // Yarım dolu bir kabuğu 200 ile servis etmek soft-404 olurdu.
  if (state !== 'ready') notFound();

  // COMP-010: sözleşme sayfalarında gösterilecek yasal künye. Boşsa boş dizi
  // döner ve aşağıdaki blok hiç render edilmez.
  const companyRows = companyIdentityRows();

  const organizationJsonLd = (
    /*
      Organization JSON-LD — yalnızca doğrulanmış, sayfada da görünen veriden:
      marka adı, site adresi, logo ve iki gerçek sosyal hesap. Offer,
      AggregateRating, FAQ gibi elimizde gerçek verisi olmayan hiçbir tip
      üretilmiyor.

      COMP-010: künye alanları da aynı kurala tabi — `legalName`, `address`,
      `telephone` ve `taxID` schema'ya YALNIZCA sayfada görünüyorlarsa
      giriyor. `company.js` boşken hiçbiri eklenmiyor; sayfada olmayan
      veriden schema üretmek tam olarak kaçındığımız şey.
    */
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: absoluteUrl('/'),
          logo: assetUrl('favicon-white.png'),
          sameAs: SITE_SOCIALS,
          ...(hasCompanyIdentity()
            ? {
                legalName: COMPANY_IDENTITY.legalName,
                address: COMPANY_IDENTITY.address,
                ...(COMPANY_IDENTITY.phone ? { telephone: COMPANY_IDENTITY.phone } : {}),
                ...(COMPANY_IDENTITY.taxNumber ? { taxID: COMPANY_IDENTITY.taxNumber } : {}),
              }
            : {}),
        }),
      }}
    />
  );

  /*
    İçerik admin panelinden gelen HTML. Tek güven sınırı admin oturumu ve
    next.config.mjs'teki CSP; buraya kullanıcı girdisi hiç ulaşmıyor —
    `LegalBody` ile aynı güven modeli.
  */
  const body = <div dangerouslySetInnerHTML={{ __html: html }} />;

  if (chrome === 'landing') {
    return (
      <div className="landing flex min-h-screen flex-col bg-luma-base text-white/80">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-[15%] h-[720px] w-[720px] rounded-full bg-fuchsia-600/[0.06] blur-[160px]" />
          <div className="absolute bottom-[-30%] right-0 h-[620px] w-[620px] rounded-full bg-violet-600/[0.05] blur-[160px]" />
        </div>

        {/* Provider kendi DOM kutusunu üretmiyor: header/main/footer doğrudan
            dış flex sütununun çocukları kalıyor, böylece kısa metinlerde
            `flex-1` main footer'ı sayfanın dibine itiyor. */}
        <VideoModalProvider>
          {/* Header `position: fixed`; içeriğin altına girmemesi için üstteki
              pt-28/pt-32 boşluğu bırakılıyor. */}
          <LandingHeader hideOnScroll={false} />

          <main
            className={`relative mx-auto w-full max-w-3xl flex-1 px-5 pb-8 pt-28 text-sm sm:px-8 sm:pt-32 ${LEGAL_PROSE}`}
          >
            {body}
          </main>

          <LandingFooter />
        </VideoModalProvider>

        {organizationJsonLd}
      </div>
    );
  }

  // Metni henüz yazılmamış doküman 404 dönüyor; alt bilgide ona bağlantı
  // vermek kırık iç link olurdu. Sitemap ile aynı kuralı uyguluyoruz:
  // yalnızca gerçekten 200 dönen sayfalar listeleniyor. Kontroller paralel,
  // hepsi yereldeki PHP'ye giden küçük JSON çağrıları.
  const siblingChecks = await Promise.all(
    PUBLIC_LEGAL_DOCS.filter((key) => key !== docKey).map(async (key) => ({
      key,
      published: await isLegalDocumentPublished(key),
    }))
  );
  const siblings = siblingChecks.filter((s) => s.published).map((s) => s.key);

  return (
    <div className="min-h-screen bg-luma-base text-white/80">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-[15%] h-[720px] w-[720px] rounded-full bg-fuchsia-600/[0.06] blur-[160px]" />
        <div className="absolute bottom-[-30%] right-0 h-[620px] w-[620px] rounded-full bg-violet-600/[0.05] blur-[160px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-10 sm:px-8">
        <header className="mb-10 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <span className="text-lg font-extrabold tracking-wider text-white">
            {SITE_NAME.toUpperCase()}
          </span>
          <a
            href="/login/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Giriş yap
          </a>
        </header>

        <main className={`flex-1 text-sm ${LEGAL_PROSE}`}>{body}</main>

        <footer className="mt-14 border-t border-white/10 pt-6">
          {/*
            COMP-010: künye SÖZLEŞME sayfalarında en çok burada gerekli —
            mesafeli satış sözleşmesinin tarafı olan satıcının kim olduğu
            sayfanın kendisinden okunabilmeli. `company.js` doldurulana kadar
            `companyRows` boş ve bu blok hiç basılmıyor.
          */}
          {companyRows.length > 0 && (
            <dl className="mb-6 grid gap-x-8 gap-y-2 text-xs sm:grid-cols-2">
              {companyRows.map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="shrink-0 text-white/40">{label}:</dt>
                  <dd className="text-white/60">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <nav aria-label="Kurumsal sayfalar">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
              {siblings.map((key) => (
                <li key={key}>
                  <a
                    href={`${LEGAL_DOCS[key].path}/`}
                    className="text-white/50 transition-colors hover:text-fuchsia-400"
                  >
                    {LEGAL_DOCS[key].title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/*
            Sosyal hesaplar burada GÖRÜNÜR olarak duruyor çünkü aşağıdaki
            Organization JSON-LD'sinin `sameAs` alanı bu adresleri bildiriyor.
            Sayfada görünmeyen bilgiden schema üretmiyoruz — bu yüzden liste
            elle değil, `sameAs` ile aynı kaynaktan (SITE_SOCIAL_LINKS)
            üretiliyor; ikisi ayrı yazılırsa er ya da geç ayrışırlar.
          */}
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {SITE_SOCIAL_LINKS.map((social) => (
              <li key={social.url}>
                <a
                  href={social.url}
                  rel="me noopener"
                  target="_blank"
                  className="text-white/50 transition-colors hover:text-fuchsia-400"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs text-white/30">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </footer>
      </div>

      {organizationJsonLd}
    </div>
  );
}
