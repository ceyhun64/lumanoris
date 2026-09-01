import "./css/landing.css";

import FeaturesSection from "./components/landing/FeaturesSection";
import HeroSection from "./components/landing/HeroSection";
import LandingFooter from "./components/landing/LandingFooter";
import LandingHeader from "./components/landing/LandingHeader";
import OnboardingSection from "./components/landing/OnboardingSection";
import PricingSection from "./components/landing/PricingSection";
import SectionDivider from "./components/landing/SectionDivider";
import VideoModalProvider from "./components/landing/VideoModalProvider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SOCIALS, absoluteUrl, assetUrl } from "@/shared/config/site";
import { pageMetadata } from "@/shared/lib/metadata";

/**
 * SEO: `/` artık bir yönlendirme DEĞİL, gerçek bir sayfa.
 *
 * Önceden burada `permanentRedirect('/dashboard/')` vardı ve bu yüzden
 * `sitemap.js` `/`i bilerek dışarıda bırakıyordu. Landing yayına girdiği için
 * ikisi de güncellendi: canonical burada üretiliyor, sitemap'e `/` eklendi.
 */
export const metadata = pageMetadata({
  title: "AI Stüdyo & Market",
  description: SITE_DESCRIPTION,
  path: "/",
});

/* Organization + WebSite JSON-LD. `sameAs` yalnızca shared/config/site.js'te
   doğrulanmış hesapları taşıyor — uydurma profil eklenmiyor. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
      name: SITE_NAME,
      url: absoluteUrl("/"),
      logo: assetUrl("images/landing/logo.png"),
      description: SITE_DESCRIPTION,
      sameAs: SITE_SOCIALS,
    },
    {
      "@type": "WebSite",
      "@id": `${absoluteUrl("/")}#website`,
      url: absoluteUrl("/"),
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "tr-TR",
      publisher: { "@id": `${absoluteUrl("/")}#organization` },
    },
  ],
};

export default function Home() {
  return (
    <div className="landing">
      {/* Kaynaktaki UnicornStudio arka planı üçüncü taraf bir CDN script'iydi;
          next.config.mjs'teki CSP (`script-src 'self'`) onu zaten engellerdi.
          Yerine palet içi iki radyal gradient (bkz. landing.css). */}
      <div className="landing-backdrop" aria-hidden="true" />

      <VideoModalProvider>
        <LandingHeader />
        <HeroSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <OnboardingSection />
        <SectionDivider />
        <PricingSection />
        <SectionDivider />
        <LandingFooter />
      </VideoModalProvider>

      <script
        type="application/ld+json"
        // JSON-LD'nin tek yolu bu; içerik tamamen bizim ürettiğimiz sabit
        // yapı, kullanıcı girdisi karışmıyor.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
    </div>
  );
}
