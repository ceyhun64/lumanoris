import { cn } from "@/lib/utils";

/**
 * Lumacoin (LMC) işareti.
 *
 * Uygulamada iki ayrı "para" var ve karıştırılmamaları önemli:
 *   • ₺ (TL)    → gerçek para: Bakiyem, sepet, ödeme, bot fiyatları
 *   • Lumacoin  → günlük mesaj hakkı; satın alınmaz, her gün yenilenir
 *
 * Bu ikon YALNIZCA ikinci kavram için kullanılır. ₺ tutarlarının yanına
 * konursa kullanıcı coin satın alabildiğini/bozdurabildiğini sanır.
 *
 * Kaynak 768x768 / 543 KB — 16-24px çizilen bir ikon için fazlasıyla ağır.
 * Burada 64px'lik türev (3 KB) kullanılıyor; retina 3x'te bile net.
 */
export function Lumacoin({ className, size = 16, title = "Lumacoin" }) {
  return (
    <img
      src="/images/lumacoin-64.png"
      alt=""
      aria-hidden="true"
      title={title}
      width={size}
      height={size}
      className={cn("shrink-0 select-none object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

export default Lumacoin;
