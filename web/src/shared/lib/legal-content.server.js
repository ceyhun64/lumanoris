import { LEGAL_DOCS } from '@/shared/config/legal-docs';

/**
 * Sözleşme metinlerini SUNUCUDA çeker — public sayfaların içeriği ilk HTML'de
 * bulunsun diye.
 *
 * Neden istemci tarafındaki `useLegalDocument` yeterli değil: o metni ancak JS
 * çalıştıktan sonra basıyor. Modal için sorun değil, ama indekslenmesini
 * istediğimiz bir sayfa için Googlebot'un ilk HTML'de görmesi gerekiyor.
 *
 * Taban URL yalnızca PHP_TARGET'tan geliyor — server.js ve next.config.mjs
 * zaten aynı değişkeni kullanıyor, yani PHP'nin nerede olduğunu bilen tek bir
 * yapılandırma noktası var. Tarayıcıdaki göreli "/api/..." yolu sunucuda
 * çözülemezdi.
 *
 * Dosya adındaki `.server` bir Next konvansiyonu değil, okuyucuya not: burası
 * yalnızca sunucu bileşenlerinden çağrılır. (`server-only` paketi projede
 * kurulu değil ve bu iş için yeni bağımlılık eklenmedi.)
 */
const PHP_TARGET = process.env.PHP_TARGET || 'http://127.0.0.1:8000';

/** Backend'e ulaşılamadığında fırlatılır → Next 500 döndürür. */
export class ContentUnavailableError extends Error {}

/**
 * @returns {Promise<{state: "ready"|"empty", html: string|null}>}
 * @throws {ContentUnavailableError} backend erişilemezse
 *
 * "empty" ile "erişilemedi" bilinçli olarak ayrı: metin henüz yazılmamışsa
 * sayfa gerçekten yok demektir (404 doğru cevap). Backend geçici olarak
 * kapalıysa 404 vermek Google'a "bu sayfa silindi" der ve indeksten düşürür;
 * doğru cevap 500'dür — "sonra tekrar dene".
 */
export async function fetchLegalDocument(docKey) {
  const meta = LEGAL_DOCS[docKey];
  if (!meta) throw new Error(`Bilinmeyen sözleşme anahtarı: ${docKey}`);

  let res;
  try {
    res = await fetch(`${PHP_TARGET}${meta.endpoint}`, {
      // Sözleşme metinleri hukuki içerik: admin panelinden güncellendiği anda
      // yayında olmalı, önbellekten eski sürüm servis edilmemeli.
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    throw new ContentUnavailableError(
      `İçerik servisine ulaşılamadı (${meta.endpoint}): ${err.message}`
    );
  }

  if (!res.ok) {
    throw new ContentUnavailableError(
      `İçerik servisi ${res.status} döndürdü (${meta.endpoint}).`
    );
  }

  let payload;
  try {
    payload = await res.json();
  } catch {
    throw new ContentUnavailableError(
      `İçerik servisi geçerli JSON döndürmedi (${meta.endpoint}).`
    );
  }

  const value = payload?.content?.[meta.contentKey];
  if (!payload?.success || !value || !String(value).trim()) {
    return { state: 'empty', html: null };
  }

  return { state: 'ready', html: String(value) };
}

/** Sitemap için: metni yazılmış (dolayısıyla 200 dönen) dokümanlar. */
export async function isLegalDocumentPublished(docKey) {
  try {
    const { state } = await fetchLegalDocument(docKey);
    return state === 'ready';
  } catch {
    // Sitemap'in tamamı backend yüzünden çökmesin — erişilemeyen dokümanı
    // listelemiyoruz, geri kalan URL'ler yayında kalıyor.
    return false;
  }
}
