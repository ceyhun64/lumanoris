/* Landing kabuğunun (navbar + footer) stilleri; hepsi `.landing` altında
   kapsanmış olduğu için yalnızca bu route'un CSS chunk'ına giriyor. */
import '../css/landing.css';

import LegalPage from '@/widgets/info/LegalPage';
import { LEGAL_DOCS } from '@/shared/config/legal-docs';
import { pageMetadata } from '@/shared/lib/metadata';

const DOC = 'about';

/**
 * Kök layout'ta `dynamic = 'force-static'` var. Bu sayfa onu bilinçli olarak
 * eziyor: metin admin panelinden değişebilen hukuki içerik ve build sırasında
 * PHP'nin ayakta olmasına bağlı kalmak istemiyoruz. SSR maliyeti tek bir yerel
 * JSON çağrısı; buna karşılık metin her zaman güncel ve ilk HTML'de.
 */
export const dynamic = 'force-dynamic';

export const metadata = pageMetadata({
  title: LEGAL_DOCS[DOC].title,
  description: LEGAL_DOCS[DOC].description,
  path: LEGAL_DOCS[DOC].path,
});

export default function Page() {
  /* Diğer dört sözleşme sayfasından farkı: bu sayfa kurumsal bir tanıtım
     sayfası, hukuki bir metin değil. Ana sayfanın navbar'ı ve footer'ı ile
     gösteriliyor ki ziyaretçi buradan siteye devam edebilsin. */
  return <LegalPage docKey={DOC} chrome="landing" />;
}
