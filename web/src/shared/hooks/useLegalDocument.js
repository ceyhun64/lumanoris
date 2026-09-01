"use client";
import { useEffect, useState } from "react";

/**
 * Admin panelinden yönetilen sözleşme metinlerini çeker.
 *
 * Zincir: /admin/<sayfa> → global_vars → /api/content/<uç>.php → burası.
 *
 * `state` dört değerden biri: "loading" | "ready" | "empty" | "error".
 * "empty", metnin henüz yazılmadığı anlamına gelir — çağıran taraf boş bir
 * kutu göstermek yerine bunu açıkça belirtmeli.
 *
 * SEO-002: doküman tanımları artık `@/shared/config/legal-docs` içinde,
 * çünkü aynı listeyi sunucuda render edilen public sayfalar ve sitemap de
 * okuyor. Bu dosya `"use client"` taşıdığı için sabitler burada kalsaydı
 * sunucu tarafından düz değer olarak okunamazdı. Mevcut çağrı yerleri
 * kırılmasın diye aynı isimlerle yeniden dışa aktarılıyorlar.
 */
export { LEGAL_DOCS, LEGAL_PROSE } from "@/shared/config/legal-docs";

export function useLegalDocument(endpoint, contentKey) {
  const [html, setHtml] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    if (!endpoint || !contentKey) return undefined;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(endpoint, { signal: controller.signal });
        const result = await res.json().catch(() => null);
        if (cancelled) return;

        const value = result?.content?.[contentKey];
        if (!res.ok || !result?.success || !value || !String(value).trim()) {
          setState("empty");
          return;
        }
        setHtml(value);
        setState("ready");
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") setState("error");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [endpoint, contentKey]);

  return { html, state };
}

export default useLegalDocument;
