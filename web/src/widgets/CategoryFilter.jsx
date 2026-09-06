"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveCategory } from "@/shared/lib/categories";

export default function CategoryFilter({
  categories,
  onSelect,
  selected: externalSelected,
  className,
  bare = false,
}) {
  const [selected, setSelected] = useState(externalSelected || "Tümü");
  const scrollerRef = useRef(null);
  // Okların GÖRÜNÜRLÜĞÜ kaydırma durumuna bağlı: sola kaydırılacak yer yoksa
  // sol ok hiç çizilmiyor. Her zaman görünen ama bir işe yaramayan bir ok,
  // hiç olmamasından daha kötü.
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (externalSelected) setSelected(externalSelected);
  }, [externalSelected]);

  const syncArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // 1px tolerans: tarayıcılar kesirli scrollWidth üretebiliyor ve tam sona
    // kaydırıldığında sağ ok yanlışlıkla açık kalıyordu.
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  /* Kategoriler sonradan (fetch ile) geliyor ve kap yeniden boyutlanabiliyor;
     ikisini de dinlemezsek oklar ilk render'daki duruma takılı kalır. */
  useEffect(() => {
    syncArrows();
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(syncArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [categories, syncArrows]);

  const scrollByStep = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Görünen genişliğin %70'i: bir "sayfa" ilerlerken kenardaki pili
    // bağlam olarak ekranda bırakıyor.
    el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: "smooth" });
  };

  const handleClick = (cat) => {
    const catName = cat.kategori_adi_tr;
    setSelected(catName);
    if (onSelect) onSelect(catName);
  };

  const arrowCls =
    "absolute top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0c0c14]/90 text-white/70 shadow-lg backdrop-blur transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className={cn("relative", bare ? "" : "mt-3", className)}>
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Kategorileri sola kaydır"
          onClick={() => scrollByStep(-1)}
          className={cn(arrowCls, "left-1")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollerRef}
        onScroll={syncArrows}
        className={cn(
          "flex flex-nowrap gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // Dolgu yalnızca ilgili ok görünürken: ok yokken boşluk bırakmak
          // sıra başında/sonunda açıklanamayan bir aralık oluşturuyordu.
          canScrollLeft ? "pl-9" : "",
          canScrollRight ? "pr-9" : "",
          bare
            ? "py-1"
            : "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2",
        )}
      >
        {categories.map((cat, index) => {
          const isActive = selected === cat.kategori_adi_tr;
          // "Tümü" gerçek bir kategori değil — ikonsuz kalsın.
          const meta = cat.id === "all" ? null : resolveCategory(cat.id);
          const Icon = meta?.icon;
          return (
            <button
              key={`${cat.kategori_adi_tr}-${index}`}
              onClick={() => handleClick(cat)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-[12px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "border border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-white/15 hover:text-zinc-200",
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isActive ? "text-zinc-700" : meta.icon_cls,
                  )}
                />
              )}
              {cat.kategori_adi_tr}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <>
          {/* Solma gradyanı okla birlikte duruyor: ok "tıkla", gradyan
              "devamı var" diyor. Ok yokken ikisi de gereksiz. */}
          <div className="pointer-events-none absolute right-1.5 top-0 h-full w-10 rounded-r-2xl bg-gradient-to-l from-black/40 to-transparent" />
          <button
            type="button"
            aria-label="Kategorileri sağa kaydır"
            onClick={() => scrollByStep(1)}
            className={cn(arrowCls, "right-1")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
