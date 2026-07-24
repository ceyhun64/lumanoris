"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
          return (
            <button
              key={`${cat.kategori_adi_tr}-${index}`}
              onClick={() => handleClick(cat)}
              className={cn(
                "shrink-0 rounded-xl px-4 py-2 text-body-sm font-sans font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-gradient-btn text-white shadow-[0_4px_16px_rgba(192,38,211,0.4)]"
                  : "bg-transparent text-white/50 border border-transparent hover:bg-white/[0.05] hover:text-white/85",
              )}
            >
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
