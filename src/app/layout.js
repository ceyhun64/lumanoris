
import '../app/css/global.css';

export const metadata = {
  title: 'Lumanoris Dashboard',
  description: 'Yapay zeka destekli arayüz',
  icons: [
    { rel: 'icon', url: '/favicon-light.png', media: '(prefers-color-scheme: light)' },
    { rel: 'icon', url: '/favicon-dark.png', media: '(prefers-color-scheme: dark)' },
  ],
};


export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="/favicon-dark.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/favicon-white.png" media="(prefers-color-scheme: dark)" />
      </head>
      <body>{children}</body>
    </html>
  );
}

