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
 */
export const LEGAL_DOCS = {
  privacy: {
    title: "Gizlilik Politikası",
    endpoint: "/api/content/getprivacy.php",
    contentKey: "gizlilik_politikasi",
  },
  terms: {
    title: "Kullanım Koşulları",
    endpoint: "/api/content/getusage.php",
    contentKey: "kullanim_kosullari",
  },
  sale: {
    title: "Mesafeli Satış Sözleşmesi",
    endpoint: "/api/content/gettermsofsale.php",
    contentKey: "satis_kosullari",
  },
  delivery: {
    title: "Teslimat ve İade Şartları",
    endpoint: "/api/content/getdelivery.php",
    contentKey: "teslimat_iade_sartlari",
  },
  about: {
    title: "Hakkımızda",
    endpoint: "/api/content/getabout.php",
    contentKey: "hakkinda",
  },
};

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

/** Admin HTML'i için ortak tipografi — her çağrı yerinde tekrarlanmasın. */
export const LEGAL_PROSE =
  "[&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white " +
  "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-fuchsia-400 " +
  "[&_h3]:mb-1.5 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-white " +
  "[&_p]:mb-3 [&_p]:leading-relaxed " +
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 " +
  "[&_em]:text-white/45";

export default useLegalDocument;
