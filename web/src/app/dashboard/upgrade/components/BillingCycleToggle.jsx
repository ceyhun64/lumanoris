import { cn } from "@/lib/utils";

export default function BillingCycleToggle({ value, onChange }) {
  return (
    <div className="flex justify-center mb-12">
      <div className="inline-flex items-center p-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-xl">
        <button
          onClick={() => onChange("monthly")}
          className={cn(
            "px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300",
            value === "monthly"
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/30"
              : "text-zinc-400 hover:text-white",
          )}
        >
          Aylık Faturalandırma
        </button>
        <button
          onClick={() => onChange("annual")}
          className={cn(
            "px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-1.5",
            value === "annual"
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/30"
              : "text-zinc-400 hover:text-white",
          )}
        >
          <span>Yıllık Faturalandırma</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-caption font-bold border border-emerald-500/30">
            %20 İndirim
          </span>
        </button>
      </div>
    </div>
  );
}
