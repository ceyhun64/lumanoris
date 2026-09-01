/**
 * Kart doğrulama — ödeme alan HER ekran için tek kaynak.
 *
 * Bu kurallar `api/functions/checkout_payments.php` içindeki `chargeCard()`
 * ön doğrulamasının BİREBİR aynısı olmak zorunda. İki katman ayrıştığında
 * ortaya çıkan hata sınıfı şu: istemcinin kabul ettiği bir kartı sunucu
 * reddediyor (ya da tersi), kullanıcı sebebini göremiyor.
 *
 * Daha önce bu fonksiyonlar yalnızca checkout sayfasının içinde, dosyaya
 * gömülü duruyordu; üyelik paketi satın alma ekranı ödeme almaya
 * başlayınca ikinci bir kopya çıkacaktı. Buraya taşındı.
 */

export function luhnCheck(digits) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * @returns {Object} alan adı → Türkçe hata mesajı. Boş nesne = geçerli.
 */
export function validateCard(card) {
  const errors = {};
  const number = (card.number || "").replace(/\D/g, "");
  const [month, year] = (card.expiry || "").split("/").map((v) => parseInt(v, 10));
  const cvv = (card.cvv || "").replace(/\D/g, "");
  const holderName = (card.holderName || "").trim();

  if (!holderName) errors.holderName = "Kart sahibinin adı gereklidir.";

  if (number.length < 13 || number.length > 19 || !luhnCheck(number)) {
    errors.number = "Kart numarası geçersiz.";
  }

  if (!month || !year || month < 1 || month > 12) {
    errors.expiry = "Son kullanma tarihi geçersiz.";
  } else {
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      errors.expiry = "Bu kartın süresi dolmuş.";
    }
  }

  if (!/^\d{3,4}$/.test(cvv)) errors.cvv = "CVV geçersiz.";

  return errors;
}

/** "4242424242424242" → "4242 4242 4242 4242" (yalnızca görüntüleme). */
export function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

/** "1230" → "12/30"; kullanıcı yazarken otomatik bölü ekler. */
export function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** Boş kart durumu — form sıfırlarken kullanılır. */
export const EMPTY_CARD = { number: "", expiry: "", cvv: "", holderName: "" };

/**
 * Form durumunu sunucunun beklediği biçime çevirir.
 * Anahtar adları PHP tarafındaki `$card['number'|'expiry'|'cvv'|'holder_name']`
 * ile eşleşmek zorunda.
 */
export function toCardPayload(card) {
  return {
    number: card.number.replace(/\s/g, ""),
    expiry: card.expiry,
    cvv: card.cvv,
    holder_name: card.holderName.trim(),
  };
}
