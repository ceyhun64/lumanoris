"use client";
import { useEffect, useRef } from "react";

/**
 * REACT-001 🟡 — 48 fetch içeren 7 frontend dosyasının hiçbirinde
 * `AbortController` yoktu. `ProfileCard` tek başına 7 effect / 0 cleanup
 * taşıyordu.
 *
 * İki somut sonucu vardı:
 *
 *   1. **Unmount sonrası setState.** Kullanıcı cevap gelmeden başka bir
 *      sayfaya geçtiğinde `.then(setX)` hâlâ çalışıyordu. React 18 bunu
 *      artık uyarı olarak yazdırmıyor, yani sessizce sızıyor.
 *   2. **Boşa giden istek.** Bağımlılık değiştiğinde (ör. `botId`) eski
 *      istek iptal edilmiyor; iki cevap yarışıyor ve YAVAŞ olan kazanabiliyor
 *      — yani ekranda bir önceki botun verisi kalabiliyor.
 *
 * Kullanım:
 *
 *     useAbortableEffect((signal, isActive) => {
 *       (async () => {
 *         const res = await fetch(url, { signal });
 *         const data = await res.json();
 *         if (isActive()) setState(data);
 *       })();
 *     }, [url]);
 *
 * `signal`'i fetch'e geçirmek isteği gerçekten iptal eder; `isActive()`
 * ise fetch dışı asenkron adımlardan (json() ayrıştırma, zincirleme
 * çağrılar) sonra setState'i korur.
 */
export function useAbortableEffect(effect, deps) {
    // effect'i ref'te tutuyoruz ki bağımlılık dizisi yalnızca çağıranın
    // verdiğinden oluşsun — inline fonksiyon her render'da yeniden
    // oluştuğu için deps'e eklenirse effect sonsuz döner.
    const effectRef = useRef(effect);
    effectRef.current = effect;

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        const isActive = () => active && !controller.signal.aborted;

        const cleanup = effectRef.current(controller.signal, isActive);

        return () => {
            active = false;
            controller.abort();
            if (typeof cleanup === "function") cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

/**
 * `AbortError` beklenen bir sonuç — bileşen unmount oldu ya da bağımlılık
 * değişti demek. Hata loglarını kirletmemesi için ayırt edilmesi gerekiyor.
 */
export function isAbortError(err) {
    return err?.name === "AbortError";
}

export default useAbortableEffect;
