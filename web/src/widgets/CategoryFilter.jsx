"use client";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (externalSelected) setSelected(externalSelected);
  }, [externalSelected]);

  const handleClick = (cat) => {
    const catName = cat.kategori_adi_tr;
    setSelected(catName);
    if (onSelect) onSelect(catName);
  };

  return (
    <div className={cn("relative", bare ? "" : "mt-3", className)}>
      <div
        className={cn(
          "flex flex-nowrap gap-2 overflow-x-auto pr-9 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
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
      {/* Right-edge fade — signals "this scrolls" instead of the row
                cutting off mid-pill with no affordance. */}
      <div className="pointer-events-none absolute right-1.5 top-0 h-full w-10 rounded-r-2xl bg-gradient-to-l from-black/40 to-transparent" />
    </div>
  );
}
