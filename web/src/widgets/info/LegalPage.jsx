import { notFound } from 'next/navigation';

import { LEGAL_DOCS, LEGAL_PROSE, PUBLIC_LEGAL_DOCS } from '@/shared/config/legal-docs';
import { SITE_NAME, SITE_SOCIALS, absoluteUrl, assetUrl } from '@/shared/config/site';
import { fetchLegalDocument, isLegalDocumentPublished } from '@/shared/lib/legal-content.server';

/**
 * Public sözleşme/kurumsal sayfaların ortak kabuğu — SUNUCU bileşeni.
 *
 * Aynı metni gösteren istemci tarafındaki modal (`LegalBody`) duruyor ve
 * değişmedi; buradaki fark, içeriğin JS beklemeden ilk HTML'e girmesi.
 *
 * Alt bilgideki çapraz bağlantılar yalnızca dekor değil: `/login` yalnızca
 * kullanım koşulları ve gizlilik politikasına bağlanıyor, geri kalan üç sayfa
 * onlar üzerinden keşfediliyor. Bu satır kaldırılırsa üç sayfa orphan kalır.
 */
export default async function LegalPage({ docKey }) {
  const meta = LEGAL_DOCS[docKey];
  if (!meta) notFound();

  // Backend kapalıysa `fetchLegalDocument` fırlatıyor ve Next 500 döndürüyor.
  // Bilinçli: geçici bir arıza 404'e çevrilirse Google sayfayı silinmiş sayar.
  const { state, html } = await fetchLegalDocument(docKey);

  // Metin admin panelinde henüz yazılmamış → sayfa gerçekten yok.
  // Yarım dolu bir kabuğu 200 ile servis etmek soft-404 olurdu.
  if (state !== 'ready') notFound();

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

        {/*
          İçerik admin panelinden gelen HTML. Tek güven sınırı admin oturumu ve
          next.config.mjs'teki CSP; buraya kullanıcı girdisi hiç ulaşmıyor —
          `LegalBody` ile aynı güven modeli.
        */}
        <main className={`flex-1 text-sm ${LEGAL_PROSE}`}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </main>

        <footer className="mt-14 border-t border-white/10 pt-6">
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
            Organization JSON-LD'sinin `sameAs` alanı bu iki adresi bildiriyor.
            Sayfada görünmeyen bilgiden schema üretmiyoruz.
          */}
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <li>
              <a
                href="https://www.instagram.com/lumanoris/"
                rel="me noopener"
                target="_blank"
                className="text-white/50 transition-colors hover:text-fuchsia-400"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/channel/UCX6_dT34vajhx8PGk5_1xfA"
                rel="me noopener"
                target="_blank"
                className="text-white/50 transition-colors hover:text-fuchsia-400"
              >
                YouTube
              </a>
            </li>
          </ul>

          <p className="mt-6 text-xs text-white/30">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </footer>
      </div>

      {/*
        Organization JSON-LD — yalnızca doğrulanmış, sayfada da görünen veriden:
        marka adı, site adresi, logo ve iki gerçek sosyal hesap. Offer,
        AggregateRating, FAQ gibi elimizde gerçek verisi olmayan hiçbir tip
        üretilmiyor.
      */}
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
          }),
        }}
      />
    </div>
  );
}
