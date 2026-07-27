import { Shield } from "lucide-react";

export default function EnterpriseContactFooter({ sending, sent, onContact }) {
  return (
    <div className="mt-20 p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h4 className="text-white font-semibold text-base">
            Özel Kurumsal İhtiyaçlarınız mı var?
          </h4>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Özel entegrasyonlar, SLA güvenceleri ve size özel fiyatlandırma
            için ekibimizle iletişime geçin.
          </p>
        </div>
      </div>
      <button
        onClick={onContact}
        disabled={sending || sent}
        className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all duration-200 border border-zinc-700/60 shrink-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sent
          ? "Talebiniz Alındı ✓"
          : sending
            ? "Gönderiliyor..."
            : "Kurumsal Satışla Görüş"}
      </button>
    </div>
  );
}
