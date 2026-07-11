export const dynamic = 'force-static';
import '../app/css/global.css';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { Toaster } from '@/shared/ui/toaster';

export const metadata = {
  title: 'Lumanoris Dashboard',
  description: 'Yapay zeka destekli arayüz',
};


export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="/favicon-dark.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/favicon-white.png" media="(prefers-color-scheme: dark)" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2002896111697347" crossOrigin="anonymous"></script>
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

