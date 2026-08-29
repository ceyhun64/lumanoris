"use client";
import {
  useLegalDocument,
  LEGAL_DOCS,
  LEGAL_PROSE,
} from "@/shared/hooks/useLegalDocument";
import { cn } from "@/lib/utils";

/**
 * Admin panelinden yönetilen bir sözleşme metnini gövde olarak basar.
 *
 * Kendi başlığı/kabuğu yok — çağıran taraf (modal, sekme, popup) kendi
 * çerçevesini getirir. Yükleniyor / boş / hata durumlarını burada tek yerden
 * ele alıyoruz; aksi hâlde metin yazılmamışken bomboş bir kutu görünüyordu.
 *
 * @param {"privacy"|"terms"|"sale"|"delivery"|"about"} doc
 */
export default function LegalBody({ doc, className }) {
  const meta = LEGAL_DOCS[doc];
  const { html, state } = useLegalDocument(meta?.endpoint, meta?.contentKey);

  if (!meta) return null;

  if (state === "loading") {
    return (
      <div className={cn("space-y-2.5", className)} aria-busy="true">
        <div className="h-3 w-2/5 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-full animate-pulse rounded bg-white/[0.07]" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-white/[0.07]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-white/[0.07]" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <p className={cn("text-white/50", className)}>
        Metin şu anda yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin.
      </p>
    );
  }

  if (state === "empty") {
    return (
      <p className={cn("text-white/50", className)}>
        Bu metin henüz yayınlanmamış. Ayrıntılı bilgi için destek ekibimizle
        iletişime geçebilirsiniz.
      </p>
    );
  }

  // İçerik admin panelinden gelen HTML. Tek güven sınırı admin oturumu ve
  // next.config.mjs'teki CSP; buraya kullanıcı girdisi hiç ulaşmıyor.
  return (
    <div
      className={cn(LEGAL_PROSE, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
