/**
 * COMP-010 — işletmenin yasal kimliği. TEK KAYNAK.
 *
 * ═══ DOLDURULMASI GEREKEN DOSYA BUDUR ═══
 *
 * Aşağıdaki alanlar BİLEREK boş. Mesafeli Sözleşmeler Yönetmeliği satıcının
 * ünvanını, açık adresini, telefonunu ve vergi bilgisini sitede göstermeyi
 * zorunlu kılıyor; ödeme kuruluşu onboarding'inin de ilk kontrol kalemi bu.
 * Bu bilgiler sitede hiçbir yerde yoktu — iletişim olarak yalnızca iki gmail
 * adresi vardı.
 *
 * NEDEN YER TUTUCU YAZILMADI
 * --------------------------
 * "Örnek A.Ş. / İstanbul / 1234567890" gibi bir değer, eksiği kapatmaz —
 * GİZLER. Sahte tüzel kişilik bilgisi yayınlamak, hiç yayınlamamaktan daha
 * kötüdür: hem yanıltıcıdır hem de doldurulduğu sanılır. Bu yüzden alanlar
 * boş ve aşağıdaki `hasCompanyIdentity()` boşken ilgili bloğun HİÇ render
 * edilmemesini sağlıyor — sitede yarım/uydurma bir künye görünmüyor.
 *
 * NASIL DOLDURULUR
 * ----------------
 * Değerleri doğrudan buraya yazın. Bir alan gerçekten yoksa (örneğin şahıs
 * şirketinde MERSİS numarası olmayabilir) boş bırakın; boş alanlar künyede
 * atlanır, "—" ya da "belirtilmemiş" yazılmaz.
 *
 * Dolduğu anda şurada görünür: `LandingFooter` künye bloğu ve sözleşme
 * sayfalarının alt bilgisi. `LegalPage`'teki Organization JSON-LD de dolu
 * alanları bildirir — o schema kuralı gereği yalnızca sayfada GÖRÜNEN veriden
 * üretilir, bu yüzden ikisi aynı kaynaktan besleniyor.
 */
export const COMPANY_IDENTITY = {
  /** Ticaret ünvanı — ör. "Lumanoris Yazılım Anonim Şirketi" */
  legalName: '',
  /** Açık adres (mahalle/cadde/no/ilçe/il dahil, tek satır) */
  address: '',
  /** Telefon — ör. "+90 212 000 00 00" */
  phone: '',
  /** Kurumsal e-posta. Gmail DEĞİL: kendi alan adınızda bir adres olmalı. */
  email: '',
  /** Vergi dairesi — ör. "Kadıköy" */
  taxOffice: '',
  /** Vergi kimlik no (10 hane) veya şahıs şirketinde T.C. Kimlik No */
  taxNumber: '',
  /** MERSİS numarası (16 hane). Şahıs şirketinde olmayabilir; boş bırakın. */
  mersisNumber: '',
  /** Ticaret sicil numarası. Şahıs şirketinde olmayabilir; boş bırakın. */
  tradeRegistryNumber: '',
};

/**
 * Künyenin gösterilip gösterilmeyeceği.
 *
 * Ünvan ve adres birlikte aranıyor: ikisinden biri eksikse ortaya çıkan şey
 * bir künye değil, künye kırıntısıdır — ve eksik künye, mevzuat açısından
 * künyesizlikle aynı yere düşerken kullanıcıya "bilgi var" izlenimi verir.
 */
export function hasCompanyIdentity() {
  return COMPANY_IDENTITY.legalName.trim() !== '' && COMPANY_IDENTITY.address.trim() !== '';
}

/**
 * Künyede gösterilecek satırlar — yalnızca DOLU olanlar.
 *
 * Etiket/değer çiftleri hâlinde döner, böylece hem footer listesi hem de
 * ileride bir sözleşme sayfası aynı sırayı ve aynı adlandırmayı kullanır.
 */
export function companyIdentityRows() {
  if (!hasCompanyIdentity()) return [];

  return [
    ['Ticaret Ünvanı', COMPANY_IDENTITY.legalName],
    ['Adres', COMPANY_IDENTITY.address],
    ['Telefon', COMPANY_IDENTITY.phone],
    ['E-posta', COMPANY_IDENTITY.email],
    ['Vergi Dairesi', COMPANY_IDENTITY.taxOffice],
    ['Vergi No', COMPANY_IDENTITY.taxNumber],
    ['MERSİS No', COMPANY_IDENTITY.mersisNumber],
    ['Ticaret Sicil No', COMPANY_IDENTITY.tradeRegistryNumber],
  ].filter(([, value]) => String(value ?? '').trim() !== '');
}
