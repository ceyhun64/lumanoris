const ICON_STYLES = {
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  fuchsia: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
};

/** One tile in the Chatbotlarım hero's metrics bar. */
export default function MetricTile({ icon: Icon, color, label, value }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-xl">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${ICON_STYLES[color]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-white/40">{label}</p>
        <p className="font-display text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
