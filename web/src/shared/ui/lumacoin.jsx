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
 * Kaynak (public/images/lmc.png) 6250x6250 / 11,5 MB — 16-24px çizilen bir
 * ikon için akıl almaz derecede ağır; olduğu gibi bağlamak her sayfa
 * yüklemesine 11,5 MB bindirirdi. Burada ondan üretilen 64px'lik türev
 * (6,6 KB) kullanılıyor; retina 3x'te bile net. 128px'lik türev de
 * (lmc-128.png) daha büyük kullanımlar için hazır duruyor.
 *
 * Türevler ImageMagick ile üretildi:
 *   magick lmc.png -resize 64x64  -strip -define png:compression-level=9 lmc-64.png
 *   magick lmc.png -resize 128x128 -strip -define png:compression-level=9 lmc-128.png
 * Görsel değişirse ikisi de yeniden üretilmeli.
 */
export function Lumacoin({ className, size = 16, title = "Lumacoin" }) {
  return (
    <img
      src="/images/lmc-64.png"
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
