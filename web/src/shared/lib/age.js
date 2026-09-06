// COMP-002 — kayıt yaş kapısının istemci tarafı.
//
// Asıl kapı SUNUCUDA: `RegisterUseCase` →
// `InputSanitizer::birthDate($value, AppConfig::MIN_REGISTRATION_AGE)`.
// Buradaki kopya yalnızca kullanıcıyı formu göndermeden uyarmak için var;
// bu dosyayı silmek güvenliği bozmaz, sadece hatayı bir tur geciktirir.
//
// DİKKAT: `AppConfig::MIN_REGISTRATION_AGE` ile ELLE senkron tutuluyor —
// pricing.js'teki sabitlerle aynı tuzak. Sunucudaki değer değişirse burası da
// değişmeli, aksi hâlde form kullanıcıyı geçirir ve sunucu reddeder.
export const MIN_REGISTRATION_AGE = 18;

/**
 * `iso` (YYYY-MM-DD) tarihindeki kişinin bugün en az `minAge` yaşında olup
 * olmadığını döndürür.
 *
 * Gün farkını 365'e bölmek gibi bir yaklaşıklık KULLANILMIYOR: artık yıllar
 * yüzünden doğum gününe bir iki gün kala kullanıcıyı yanlış tarafa atardı.
 * Bunun yerine sunucudaki `DateTime::diff()` mantığıyla aynı şey yapılıyor —
 * doğum tarihine `minAge` yıl eklenip bugünle karşılaştırılıyor.
 *
 * Biçimsiz/boş girdi `false` döndürür: "emin değilsek geçirme".
 */
export function isAtLeastYearsOld(iso, minAge = MIN_REGISTRATION_AGE) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? '').trim());
  if (!match) return false;

  const [, y, m, d] = match.map(Number);

  // `new Date('2026-02-31')` sessizce 3 Mart'a taşar. Takvimde olmayan bir
  // tarihin geçerli sayılmaması için bileşenleri geri okuyup karşılaştırıyoruz.
  const birth = new Date(Date.UTC(y, m - 1, d));
  if (
    birth.getUTCFullYear() !== y ||
    birth.getUTCMonth() !== m - 1 ||
    birth.getUTCDate() !== d
  ) {
    return false;
  }

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (birth > today) return false;

  const eligibleFrom = new Date(Date.UTC(y + minAge, m - 1, d));
  return eligibleFrom <= today;
}
