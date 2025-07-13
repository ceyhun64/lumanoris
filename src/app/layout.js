
import '../app/css/global.css';

export const metadata = {
  title: 'Lumanoris Dashboard',
  description: 'Yapay zeka destekli arayüz',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
