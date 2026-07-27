import { Search, SlidersHorizontal, ListFilter } from "lucide-react";
import { FilterPopover2026 } from "@/shared/ui/filter-popover";

export default function ChatbotsToolbar({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          type="text"
          placeholder="Chatbot ismi ile ara..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 pl-11 text-sm text-white placeholder-white/30 backdrop-blur-xl transition-all duration-200 focus:border-violet-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FilterPopover2026
          icon={SlidersHorizontal}
          prefixLabel="Kategori:"
          menuLabel="Kategori Seç"
          value={selectedCategory}
          onChange={onSelectCategory}
          options={[
            { id: "all", label: "Tüm Kategoriler" },
            ...categories.map((cat) => ({
              id: cat.id,
              label: cat.kategori_adi_tr,
            })),
          ]}
        />

        <FilterPopover2026
          icon={ListFilter}
          prefixLabel="Sırala:"
          menuLabel="Sıralama Kriteri"
          value={sortBy}
          onChange={onSortChange}
          options={[
            { id: "newest", label: "En Yeniler" },
            { id: "name", label: "İsme Göre (A-Z)" },
            { id: "likes", label: "En Çok Beğenilen" },
          ]}
        />
      </div>
    </div>
  );
}
