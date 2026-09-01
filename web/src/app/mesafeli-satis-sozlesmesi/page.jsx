import LegalPage from '@/widgets/info/LegalPage';
import { LEGAL_DOCS } from '@/shared/config/legal-docs';
import { pageMetadata } from '@/shared/lib/metadata';

const DOC = 'sale';

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
  return <LegalPage docKey={DOC} />;
}
