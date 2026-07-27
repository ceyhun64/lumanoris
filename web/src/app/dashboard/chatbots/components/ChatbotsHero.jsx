import Link from "next/link";
import { Cpu, Plus, Bot, Activity, Layers, TrendingUp } from "lucide-react";
import MetricTile from "./MetricTile";

export default function ChatbotsHero({ metrics }) {
  return (
    <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-6 md:p-10 backdrop-blur-3xl shadow-2xl">
      <div className="absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-violet-600/15 via-fuchsia-600/10 to-transparent blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-300 mb-3 backdrop-blur-md">
            <Cpu className="h-3.5 w-3.5" />
            <span>Stüdyo Yönetim Paneli</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Chatbotlarım
          </h1>
          <p className="mt-1 text-sm text-white/55 max-w-lg">
            Yapay zeka asistanlarınızı yönetin, performans metriklerini
            inceleyin ve yeni nesil otomasyonlar kurun.
          </p>
        </div>

        <Link
          href="/dashboard/chatbots/create"
          className="group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-btn px-6 py-3.5 font-display font-semibold text-sm text-white shadow-glow transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
          <span>Yeni Chatbot Oluştur</span>
        </Link>
      </div>

      {/* Metrics Bar */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/[0.08]">
        <MetricTile icon={Bot} color="violet" label="Toplam Bot" value={metrics.total} />
        <MetricTile icon={Activity} color="emerald" label="Aktif & Çalışır" value={metrics.active} />
        <MetricTile icon={Layers} color="blue" label="Toplam Diyalog" value={metrics.totalDialogs} />
        <MetricTile icon={TrendingUp} color="fuchsia" label="Beğeni Skoru" value={metrics.totalLikes} />
      </div>
    </div>
  );
}
