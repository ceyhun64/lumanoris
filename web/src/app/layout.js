export const dynamic = 'force-static';
import '../app/css/global.css';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { Toaster } from '@/shared/ui/toaster';
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/shared/config/site';

export const metadata = {
  // SEO-002: `metadataBase` olmadan Next göreli OG/canonical URL'lerini mutlak
  // hâle getiremiyor ve geliştirmede sessizce localhost'a düşüyor. Tek kaynak
  // NEXT_PUBLIC_SITE_URL; production build'de tanımsızsa shared/config/site.js
  // build'i açık hatayla durduruyor.
  metadataBase: new URL(SITE_URL),

  // `template` sayesinde alt sayfalar yalnızca kendi adlarını veriyor
  // ("Giriş Yap"), marka eki tek yerden geliyor. Önceden 15 layout'ta
  // "… | Lumanoris" elle tekrarlanıyordu.
  title: {
    default: 'Lumanoris | AI Stüdyo & Market',
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,

  // Bunlar yalnızca VARSAYILAN: sayfaya özgü metadata (shared/lib/metadata.js)
  // canonical'ı ve sayfaya ait OG başlığını üstüne yazıyor. Canonical bilerek
  // burada TANIMLI DEĞİL — kökte tanımlanırsa her sayfa kendini ana sayfaya
  // canonical'lar ve tüm site tek URL'e çöker.
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: SITE_NAME,
    title: 'Lumanoris | AI Stüdyo & Market',
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumanoris | AI Stüdyo & Market',
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },

  // Sekme ikonu app/icon.png'den geliyor (App Router dosya konvansiyonu).
  // Next linki otomatik enjekte ediyor; elle <link rel="icon"> eklemek
  // gereksiz — zaten HTML'e cikmiyorlardi.
};


export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <style>{`
        .rdp-root {
    --rdp-accent-color: #FF66C4;
    --rdp-accent-background-color: rgba(255, 102, 196, 0.1);
    --rdp-animation_duration: 0.3s;
    --rdp-animation_timing: cubic-bezier(0.4, 0, 0.2, 1);
    --rdp-day-height: 35px;
    --rdp-day-width: 35px;
    --rdp-day_button-height: 35px;
    --rdp-day_button-width: 35px;
    --rdp-day_button-border-radius: 6px;
    --rdp-day_button-border: none;
    --rdp-selected-border: none;
    --rdp-disabled-opacity: 0.2;
    --rdp-outside-opacity: 0.3;
    --rdp-today-color: #FF66C4;
    --rdp-dropdown-gap: 8px;
    --rdp-months-gap: 16px;
    --rdp-nav_button-disabled-opacity: 0.3;
    --rdp-nav_button-height: 32px;
    --rdp-nav_button-width: 32px;
    --rdp-nav-height: 40px;
    --rdp-range_middle-background-color: rgba(255, 102, 196, 0.1);
    --rdp-range_middle-color: #fff;
    --rdp-range_start-color: #fff;
    --rdp-range_start-background: #FF66C4;
    --rdp-range_end-background: #FF66C4;
    --rdp-range_end-color: #fff;
    --rdp-week_number-border-radius: 6px;
    --rdp-week_number-border: 1px solid rgba(255, 241, 250, 0.1);
    --rdp-week_number-height: 35px;
    --rdp-week_number-width: 35px;
    --rdp-weekday-opacity: 0.6;
    --rdp-weekday-padding: 6px 0;
    --rdp-weekday-text-align: center;
    --rdp-chevron-disabled-opacity: 0.3;
}

/* Dark theme specific overrides */
[data-theme="light"] .rdp-root {
    --rdp-accent-color: #FF66C4;
    --rdp-accent-background-color: rgba(255, 102, 196, 0.1);
}
        `}</style>
      </head>
      <body>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}

