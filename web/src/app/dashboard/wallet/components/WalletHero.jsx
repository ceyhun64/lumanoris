import { ShieldCheck, ArrowDownToLine } from "lucide-react";

export default function WalletHero({ onWithdraw }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 backdrop-blur-md mb-2 shadow-lg shadow-violet-500/5">
          <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
          <span>2026 Güvenli Finans Altyapısı</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Cüzdan & Finans
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Bakiyenizi yönetin, harcamalarınızı takip edin ve ödemelerinizi
          inceleyin.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onWithdraw}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-btn px-5 py-3 text-xs font-bold text-white shadow-glow hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          <ArrowDownToLine className="h-4 w-4" />
          <span>Para Çek</span>
        </button>
      </div>
    </header>
  );
}
