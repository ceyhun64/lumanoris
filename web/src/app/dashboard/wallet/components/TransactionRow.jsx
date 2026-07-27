import { ArrowDownToLine, ShoppingBag, Clock } from "lucide-react";
import { formatCurrency } from "@/shared/lib/format";

export default function TransactionRow({ tx }) {
  const isIncome = Number(tx.amount) >= 0;
  return (
    <div className="group relative flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-4 transition-all duration-300 hover:border-violet-500/40 hover:bg-zinc-900/80 hover:shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-md ${
            isIncome
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400"
          }`}
        >
          {isIncome ? (
            <ArrowDownToLine className="h-5 w-5" />
          ) : (
            <ShoppingBag className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors">
            {tx.description}
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-zinc-500" />
            <span>Güvenli Onaylandı</span>
            {tx.refunded && (
              <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-caption font-semibold text-amber-400">
                İade Edildi
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div
          className={`text-base font-black font-mono ${
            isIncome ? "text-emerald-400" : "text-white"
          }`}
        >
          {isIncome ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
        </div>
        <span className="text-caption uppercase font-bold tracking-wider text-zinc-500">
          {isIncome ? "Gelir" : "Ödeme"}
        </span>
      </div>
    </div>
  );
}
