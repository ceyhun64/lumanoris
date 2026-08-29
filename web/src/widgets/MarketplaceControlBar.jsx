"use client";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Command,
  SlidersHorizontal,
  Sparkles,
  Flame,
  MessageSquare,
  Heart,
  Bookmark,
  Star,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Grid3X3,
  List as ListIcon,
} from "lucide-react";
import { resolveCategory } from "@/shared/lib/categories";

function SortPopover({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sortOptions = [
    { id: "onerilen", label: "Önerilen Sınıflandırma", icon: Sparkles },
    { id: "yeni", label: "En Yeniler", icon: Flame },
    { id: "diyalog", label: "En Çok Konuşulanlar", icon: MessageSquare },
    { id: "favoriler", label: "En Çok Favorilenenler", icon: Heart },
    { id: "liste", label: "En Çok Kaydedilenler", icon: Bookmark },
    { id: "degerlendirme", label: "Popülarite Puanı", icon: Star },
    { id: "fiyat_artan", label: "Fiyat: Düşükten Yükseğe", icon: ArrowUpDown },
    { id: "fiyat_azalan", label: "Fiyat: Yüksekten Düşüğe", icon: ArrowUpDown },
  ];

  const currentOption =
    sortOptions.find((o) => o.id === value) || sortOptions[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/90 px-3.5 py-2 text-xs font-semibold text-zinc-200 backdrop-blur-2xl transition-all hover:border-white/20 hover:bg-zinc-800 hover:text-white"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-violet-400" />
        <span className="hidden sm:inline text-zinc-400 font-normal">
          Sırala:
        </span>
        <span className="font-semibold text-white">{currentOption.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2  rounded-2xl border border-white/15 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-2 text-caption font-bold uppercase tracking-wider text-zinc-400">
            Sıralama Kriteri
          </div>
          <div className="space-y-0.5">
            {sortOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${
                    isSelected
                      ? "bg-violet-600/20 text-violet-200 font-semibold border border-violet-500/30"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-3.5 w-3.5 ${isSelected ? "text-violet-400" : "text-zinc-400"}`}
                    />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="ms-3 h-3.5 w-3.5 text-violet-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Yatay kategori şeridi. Kaydırma çubuğu gizli; onun yerine yalnızca o yöne
 * gidilebiliyorken beliren ok düğmeleri var — en soldayken sadece sağ ok, en
 * sağdayken sadece sol ok, arada ikisi birden görünür.
 */
function CategoryScroller({ categories, selected, onSelect }) {
  const scrollerRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    // 1px tolerans: tarayıcılar kesirli scrollLeft/scrollWidth döndürebiliyor,
    // tam uçtayken ok bir türlü kaybolmuyordu.
    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 });
    };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);

    // Kategoriler geç geldiğinde/panel daraldığında da yeniden ölç.
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    observer?.observe(el);

    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      observer?.disconnect();
    };
  }, [categories]);

  const nudge = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.max(180, el.clientWidth * 0.7),
      behavior: "smooth",
    });
  };

  const arrowBtn =
    "pointer-events-auto flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/90 text-zinc-300 shadow-lg backdrop-blur-sm transition-colors hover:border-violet-500/40 hover:bg-zinc-800 hover:text-white";

  return (
    <div className="relative mt-3 border-t border-white/5">
      <div
        ref={scrollerRef}
        className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none"
      >
        {categories.map((cat) => {
          const isSelected = selected === cat.kategori_adi_tr;
          // "Tümü" gerçek bir kategori değil — ikonsuz kalsın.
          const meta = cat.id === "all" ? null : resolveCategory(cat.id);
          const Icon = meta?.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.kategori_adi_tr)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-semibold transition-all ${
                isSelected
                  ? "bg-white text-zinc-950 shadow-lg"
                  : "border border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-white/15 hover:text-zinc-200"
              }`}
            >
              {Icon && (
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-zinc-700" : meta.icon_cls}`}
                />
              )}
              {cat.kategori_adi_tr}
            </button>
          );
        })}
      </div>

      {/* Oklar şeridin üstünde durur; `invisible` görünmezken tıklanmalarını da
          engeller, opacity ise geçişi yumuşatır. */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 flex items-center bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-transparent pr-8 transition-opacity duration-200 ${
          edges.left ? "opacity-100" : "invisible opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => nudge(-1)}
          tabIndex={edges.left ? 0 : -1}
          aria-label="Önceki kategoriler"
          className={arrowBtn}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div
        className={`pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end bg-gradient-to-l from-zinc-950 via-zinc-950/85 to-transparent pl-8 transition-opacity duration-200 ${
          edges.right ? "opacity-100" : "invisible opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => nudge(1)}
          tabIndex={edges.right ? 0 : -1}
          aria-label="Sonraki kategoriler"
          className={arrowBtn}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Pazaryerinin tek kontrol paneli: arama + sıralama (+ isteğe bağlı görünüm
 * anahtarı) ve altında oklu kategori şeridi. Anasayfa ile Keşfet aynı bileşeni
 * kullanır; ikisi ayrı ayrı yazıldığında Keşfet'inki geride kalmıştı.
 *
 * `viewMode`/`onViewModeChange` verilmezse görünüm anahtarı hiç basılmaz —
 * sayfa gerçekten birden çok görünümü desteklemiyorsa ölü düğme kalmasın.
 */
export default function MarketplaceControlBar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  categories,
  selected,
  onSelectCategory,
  viewMode,
  onViewModeChange,
  searchInputRef,
  placeholder = "Bot, açıklama veya geliştirici ara...",
  className = "",
}) {
  const viewOptions = [
    { id: "bento", icon: LayoutGrid, title: "Kart Görünümü" },
    { id: "compact", icon: Grid3X3, title: "Yoğun Görünüm" },
    { id: "list", icon: ListIcon, title: "Liste Görünümü" },
  ];

  return (
    <section
      className={`sticky top-1 z-30 rounded-3xl border border-white/10 bg-zinc-950/80 p-3 shadow-2xl backdrop-blur-2xl ${className}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-2xl border border-white/5 bg-zinc-900/80 pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-fuchsia-500/60 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
          />
          {query ? (
            <button
              onClick={() => onQueryChange("")}
              aria-label="Aramayı temizle"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-1 rounded-md border border-white/10 bg-zinc-800/80 px-2 py-0.5 text-caption font-mono text-zinc-400 sm:flex">
              <Command className="h-3 w-3" /> K
            </div>
          )}
        </div>

        {/* Right Control Bar */}
        <div className="flex items-center justify-between gap-3">
          <SortPopover value={sort} onChange={onSortChange} />

          {onViewModeChange && (
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-zinc-900/80 p-1">
              {viewOptions.map(({ id, icon: Icon, title }) => (
                <button
                  key={id}
                  onClick={() => onViewModeChange(id)}
                  title={title}
                  className={`rounded-md p-1 transition-all ${
                    viewMode === id
                      ? "bg-violet-600 text-white shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Category Bar */}
      <CategoryScroller
        categories={categories}
        selected={selected}
        onSelect={onSelectCategory}
      />
    </section>
  );
}
