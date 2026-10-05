"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * "Pazaryeri kaydı var mı?" — madde 4 (Bakiyem kapısı) için TEK kaynak.
 *
 * GK-5: başvuru yapmış olmak Bakiyem'i açar; sınırsız bot hakkı ise yalnızca
 * onaylanmış (`active`) satıcıya verilir — o ikinci kural sunucuda, Faz 3'te.
 *
 * BUGÜNKÜ VERİ KAYNAĞI GEÇİCİ: başvuruları saklayan tablo Faz 5'te gelecek.
 * O zamana kadar "başvuru yapmış" = `param_marketplace_sellers` satırı olan
 * ve durumu `pending | active | suspended | rejected` olan kullanıcı
 * (eski kayıt akışında bir başvuru denemesi yapılmış). `not_started` ve
 * yalnızca banka bilgisi doldurulmuş (`kyc_filled`) başvuru sayılmaz.
 * Faz 5'te bu hook yeni başvuru durumunu da okuyacak; çağıranlar değişmez.
 *
 * Bu bir ARAYÜZ kapısıdır; wallet uç noktalarının sunucu yetkisi
 * değiştirilmedi (bkz. 11-pazaryeri-revizyon.md, Faz 2 madde 4).
 *
 * Aynı sayfada kenar çubuğu, başlık ve Bakiyem aynı anda soruyor; istek
 * kullanıcı başına bir kez atılıyor (modül düzeyinde önbellek).
 */
const REGISTERED_STATUSES = ["pending", "active", "suspended", "rejected"];
const cache = new Map(); // userId -> Promise<{status}>

function loadStatus(userId) {
  if (!cache.has(userId)) {
    const p = fetch("/api/seller/submerchant_status.php", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.success === false) {
          throw new Error(data?.message || "Pazaryeri kaydı durumu alınamadı.");
        }
        return { status: data.status ?? null };
      })
      .catch((err) => {
        cache.delete(userId); // hata önbelleğe alınmasın, tekrar denenebilsin
        throw err;
      });
    cache.set(userId, p);
  }
  return cache.get(userId);
}

export function useMarketplaceRegistration(userId) {
  const [state, setState] = useState({
    loading: true,
    registered: false,
    status: null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) {
      setState({ loading: false, registered: false, status: null, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    loadStatus(userId)
      .then(({ status }) => {
        if (cancelled) return;
        setState({
          loading: false,
          registered: REGISTERED_STATUSES.includes(status),
          status,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          loading: false,
          registered: false,
          status: null,
          error: err.message || String(err),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  const refetch = useCallback(() => {
    if (userId) cache.delete(userId);
    setAttempt((n) => n + 1);
  }, [userId]);

  return { ...state, refetch };
}

export default useMarketplaceRegistration;
