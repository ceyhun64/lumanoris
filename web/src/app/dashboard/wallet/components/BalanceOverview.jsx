import { WalletIcon, TrendingUp, ShoppingBag, ArrowDownToLine } from "lucide-react";
import { formatCurrency } from "@/shared/lib/format";

export default function BalanceOverview({ balance, totalSpent, uniqueOrderCount, onWithdraw }) {
  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Main Balance Card */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-7 shadow-2xl backdrop-blur-2xl lg:col-span-2 group">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet-600/20 blur-3xl transition-all duration-500 group-hover:bg-violet-500/30 group-hover:scale-125 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Kullanılabilir Net Bakiye
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-inner">
            <WalletIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 flex items-baseline gap-3">
          <div className="text-4xl font-black tracking-tight text-white sm:text-5xl font-mono">
            {formatCurrency(balance)}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            Aktif
          </span>
        </div>

        <p className="mt-2 text-xs text-zinc-400">
          Son güncelleme:{" "}
          <span className="text-zinc-200 font-medium">Bugün, anlık</span>
        </p>

        <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-4">
          <button
            onClick={onWithdraw}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20"
          >
            <ArrowDownToLine className="h-3.5 w-3.5 text-violet-400" />
            Para Çekme Talebi
          </button>
        </div>
      </div>

      {/* Total Spent Stat Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-950 p-7 shadow-xl backdrop-blur-2xl flex flex-col justify-between group">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Toplam Harcama
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-fuchsia-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black tracking-tight text-white font-mono">
            {formatCurrency(totalSpent)}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Toplam{" "}
            <span className="text-white font-semibold">{uniqueOrderCount}</span>{" "}
            sipariş tamamlandı
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/5 bg-zinc-900/40 p-3 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-300 font-medium">
            Tüm işlemler şifreli olarak korunmaktadır.
          </span>
        </div>
      </div>
    </section>
  );
}
