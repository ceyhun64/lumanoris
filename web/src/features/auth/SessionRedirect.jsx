"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAbortableEffect, isAbortError } from "@/shared/hooks/useAbortableEffect";

/**
 * Oturumu açık ziyaretçiyi pazarlama sayfasından panele yollar.
 *
 * Neden istemci tarafında:
 * `/` statik olarak üretilen, canonical/JSON-LD taşıyan gerçek bir sayfa
 * (bkz. app/page.jsx). Kontrolü sunucuya taşımak sayfayı her istekte dinamik
 * hâle getirir ve SEO tarafını bozar. Tarayıcı botlarında oturum çerezi
 * bulunmadığı için buradaki kontrol onlar için hiçbir zaman tetiklenmez —
 * bot da anonim ziyaretçi de landing'i olduğu gibi görür.
 *
 * Neden çerez OKUNMUYOR (middleware yerine):
 * PHP oturum çerezi (`PHPSESSID`) anonim ziyaretçiye de yazılıyor — herhangi
 * bir API çağrısı yeterli — yani varlığı "giriş yapılmış" demek değil.
 * Üstelik hem `PHPSESSID` hem `remember_me` httponly; JS onları göremez.
 * Tek güvenilir kaynak sessioncheck.php: `$_SESSION['user_id']`e ek olarak
 * remember-me token'ını da doğruluyor (AuthController::sessionCheck).
 *
 * Kontrol sayfayı BLOKLAMIYOR: landing hemen boyanıyor, cevap geldiğinde
 * yalnızca gerçekten tanınan kullanıcı yönlendiriliyor. Aksi hâlde her anonim
 * ziyaretçinin ilk boyaması bir API gidiş-dönüşü kadar gecikirdi.
 */
export default function SessionRedirect({ to = "/dashboard/" }) {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useAbortableEffect(
    (signal, isActive) => {
      (async () => {
        try {
          const res = await fetch("/api/auth/sessioncheck.php", {
            credentials: "include",
            signal,
          });
          if (!res.ok) return;

          const result = await res.json();
          if (!isActive() || !result?.authenticated) return;

          setRedirecting(true);
          router.replace(to);
        } catch (err) {
          // Oturum kontrolü landing'in çalışması için gerekli değil: ağ
          // hatasında ziyaretçi sayfada kalır, hiçbir şey bozulmaz.
          if (!isAbortError(err)) console.error("Oturum kontrolü başarısız:", err);
        }
      })();
    },
    [router, to],
  );

  if (!redirecting) return null;

  // Yönlendirme anlık değil (panel ayrı bir bundle). Bu perde olmadan
  // kullanıcı bir an landing'e bakıp sonra panele atlıyor gibi hissediyor.
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-luma-base text-white/60"
      role="status"
      aria-live="polite"
    >
      <span className="animate-pulse">Panele yönlendiriliyorsunuz...</span>
    </div>
  );
}
