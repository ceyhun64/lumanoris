import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small centered inline banner for the page's API-error / upgrade-success notices. */
export default function StatusBanner({ variant = "error", children }) {
  return (
    <div
      className={cn(
        "max-w-xl mx-auto mb-8 p-4 rounded-xl text-center text-xs backdrop-blur-md",
        variant === "success"
          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center gap-2"
          : "bg-rose-500/10 border border-rose-500/20 text-rose-300",
      )}
    >
      {variant === "success" && <Check className="w-4 h-4 text-emerald-400" />}
      <span>{children}</span>
    </div>
  );
}
