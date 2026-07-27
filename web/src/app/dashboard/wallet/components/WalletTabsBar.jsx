import { Receipt, ShoppingBag, Search } from "lucide-react";

export default function WalletTabsBar({ activeTab, onTabChange, searchQuery, onSearchChange }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onTabChange("bakiye")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
            activeTab === "bakiye"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
              : "border border-white/10 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-white/20"
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Bakiye Hareketleri</span>
        </button>
        <button
          onClick={() => onTabChange("harcamalar")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
            activeTab === "harcamalar"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
              : "border border-white/10 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-white/20"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Sipariş & Ödemeler</span>
        </button>
      </div>

      {/* Search in Transactions */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="İşlemlerde ara..."
          className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>
    </div>
  );
}
