import Link from "next/link";
import { Plus } from "lucide-react";

export default function CreateChatbotCard() {
  return (
    <Link
      href="/dashboard/chatbots/create"
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-dashed border-violet-500/30 bg-violet-500/[0.02] p-1 transition-all duration-300 hover:border-violet-400/60 hover:bg-violet-500/[0.05] hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]"
    >
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-gradient-to-b from-violet-500/[0.08] to-transparent transition-colors duration-300 group-hover:from-violet-500/[0.15]">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:border-violet-400 group-hover:bg-violet-500/20">
          <Plus className="h-7 w-7" strokeWidth={2.2} />
        </span>
      </div>
      <div className="flex flex-col gap-1 p-5 text-center">
        <p className="font-display text-body-lg font-bold text-violet-200 tracking-tight">
          Yeni Chatbot Oluştur
        </p>
        <p className="text-body-sm text-white/40">
          Fikrini birkaç dakikada akıllı bir ajana dönüştür
        </p>
      </div>
    </Link>
  );
}
