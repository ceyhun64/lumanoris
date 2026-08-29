import {
  Feather,
  Briefcase,
  GraduationCap,
  Languages,
  ClipboardList,
  AppWindow,
  Lightbulb,
  Code2,
  Palette,
  Gamepad2,
  FlaskConical,
  BadgeCheck,
  Drama,
  Clapperboard,
  Shapes,
} from "lucide-react";

/**
 * Kategori kimliği — her kategoriye bir ikon ve bir renk ailesi.
 *
 * Neden: kategori verisi her yerde taşınıyordu (`kategori_id` kartların
 * mapping'inde, sohbet başlığında, sepette) ama hiçbir yerde görünmüyordu —
 * yalnızca "Chatbotlarım" kartlarında düz gri bir etiket vardı. Böylece bir
 * botun hangi alan için yapıldığı ancak açıklamayı okuyunca anlaşılıyordu.
 *
 * Anahtar olarak ID kullanılıyor: isimler admin panelinden değiştirilebilir,
 * ID'ler sabit. İsim eşlemesi yalnızca yedek — ID gelmediği yerler için
 * (ör. sepet yanıtı kategori adını düz metin döndürüyor).
 *
 * Renk sınıfları TAM yazılmak zorunda: Tailwind kaynak dosyalarını literal
 * tarıyor, `bg-${x}-500/10` gibi birleştirmeler üretilmiyor.
 */
const CATEGORIES = {
  21: {
    name: "Yaratıcı Yazarlık",
    icon: Feather,
    chip: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    icon_cls: "text-amber-300",
    dot: "bg-amber-400",
    hoverBorder: "hover:border-amber-400/45 focus-visible:border-amber-400/45",
    glow: "hover:shadow-amber-500/10",
    sweep: "via-amber-400/50",
  },
  22: {
    name: "Kurumsal",
    icon: Briefcase,
    chip: "border-slate-400/25 bg-slate-400/10 text-slate-200",
    icon_cls: "text-slate-300",
    dot: "bg-slate-400",
    hoverBorder: "hover:border-slate-400/45 focus-visible:border-slate-400/45",
    glow: "hover:shadow-slate-500/10",
    sweep: "via-slate-400/50",
  },
  23: {
    name: "Eğitim",
    icon: GraduationCap,
    chip: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    icon_cls: "text-sky-300",
    dot: "bg-sky-400",
    hoverBorder: "hover:border-sky-400/45 focus-visible:border-sky-400/45",
    glow: "hover:shadow-sky-500/10",
    sweep: "via-sky-400/50",
  },
  24: {
    name: "Çeviri",
    icon: Languages,
    chip: "border-teal-400/25 bg-teal-400/10 text-teal-200",
    icon_cls: "text-teal-300",
    dot: "bg-teal-400",
    hoverBorder: "hover:border-teal-400/45 focus-visible:border-teal-400/45",
    glow: "hover:shadow-teal-500/10",
    sweep: "via-teal-400/50",
  },
  25: {
    name: "Planlar",
    icon: ClipboardList,
    chip: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    icon_cls: "text-indigo-300",
    dot: "bg-indigo-400",
    hoverBorder: "hover:border-indigo-400/45 focus-visible:border-indigo-400/45",
    glow: "hover:shadow-indigo-500/10",
    sweep: "via-indigo-400/50",
  },
  26: {
    name: "Uygulamalar",
    icon: AppWindow,
    chip: "border-violet-400/25 bg-violet-400/10 text-violet-200",
    icon_cls: "text-violet-300",
    dot: "bg-violet-400",
    hoverBorder: "hover:border-violet-400/45 focus-visible:border-violet-400/45",
    glow: "hover:shadow-violet-500/10",
    sweep: "via-violet-400/50",
  },
  27: {
    name: "Yaratıcı Fikirler",
    icon: Lightbulb,
    chip: "border-yellow-400/25 bg-yellow-400/10 text-yellow-200",
    icon_cls: "text-yellow-300",
    dot: "bg-yellow-400",
    hoverBorder: "hover:border-yellow-400/45 focus-visible:border-yellow-400/45",
    glow: "hover:shadow-yellow-500/10",
    sweep: "via-yellow-400/50",
  },
  28: {
    name: "Programlama",
    icon: Code2,
    chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    icon_cls: "text-emerald-300",
    dot: "bg-emerald-400",
    hoverBorder: "hover:border-emerald-400/45 focus-visible:border-emerald-400/45",
    glow: "hover:shadow-emerald-500/10",
    sweep: "via-emerald-400/50",
  },
  29: {
    name: "Hobiler",
    icon: Palette,
    chip: "border-pink-400/25 bg-pink-400/10 text-pink-200",
    icon_cls: "text-pink-300",
    dot: "bg-pink-400",
    hoverBorder: "hover:border-pink-400/45 focus-visible:border-pink-400/45",
    glow: "hover:shadow-pink-500/10",
    sweep: "via-pink-400/50",
  },
  30: {
    name: "Oyunlar",
    icon: Gamepad2,
    chip: "border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-200",
    icon_cls: "text-fuchsia-300",
    dot: "bg-fuchsia-400",
    hoverBorder: "hover:border-fuchsia-400/45 focus-visible:border-fuchsia-400/45",
    glow: "hover:shadow-fuchsia-500/10",
    sweep: "via-fuchsia-400/50",
  },
  31: {
    name: "Bilim&Araştırma",
    icon: FlaskConical,
    chip: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
    icon_cls: "text-cyan-300",
    dot: "bg-cyan-400",
    hoverBorder: "hover:border-cyan-400/45 focus-visible:border-cyan-400/45",
    glow: "hover:shadow-cyan-500/10",
    sweep: "via-cyan-400/50",
  },
  32: {
    name: "Profesyonel",
    icon: BadgeCheck,
    chip: "border-blue-400/25 bg-blue-400/10 text-blue-200",
    icon_cls: "text-blue-300",
    dot: "bg-blue-400",
    hoverBorder: "hover:border-blue-400/45 focus-visible:border-blue-400/45",
    glow: "hover:shadow-blue-500/10",
    sweep: "via-blue-400/50",
  },
  33: {
    name: "Karakter",
    icon: Drama,
    chip: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    icon_cls: "text-rose-300",
    dot: "bg-rose-400",
    hoverBorder: "hover:border-rose-400/45 focus-visible:border-rose-400/45",
    glow: "hover:shadow-rose-500/10",
    sweep: "via-rose-400/50",
  },
  34: {
    name: "Filmler",
    icon: Clapperboard,
    chip: "border-orange-400/25 bg-orange-400/10 text-orange-200",
    icon_cls: "text-orange-300",
    dot: "bg-orange-400",
    hoverBorder: "hover:border-orange-400/45 focus-visible:border-orange-400/45",
    glow: "hover:shadow-orange-500/10",
    sweep: "via-orange-400/50",
  },
  35: {
    name: "Diğer",
    icon: Shapes,
    chip: "border-zinc-400/25 bg-zinc-400/10 text-zinc-300",
    icon_cls: "text-zinc-400",
    dot: "bg-zinc-400",
    hoverBorder: "hover:border-zinc-400/45 focus-visible:border-zinc-400/45",
    glow: "hover:shadow-zinc-500/10",
    sweep: "via-zinc-400/50",
  },
};

const FALLBACK = {
  name: "Genel",
  icon: Shapes,
  chip: "border-zinc-400/25 bg-zinc-400/10 text-zinc-300",
  icon_cls: "text-zinc-400",
  dot: "bg-zinc-400",
  hoverBorder: "hover:border-zinc-400/45 focus-visible:border-zinc-400/45",
  glow: "hover:shadow-zinc-500/10",
  sweep: "via-zinc-400/50",
};

/** Türkçe karşılaştırma için normalize — "Bilim&Araştırma" ↔ "bilim&arastirma". */
function normalize(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/\s+/g, "")
    .replace(/[ıi]/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

const BY_NAME = new Map(
  Object.entries(CATEGORIES).map(([id, c]) => [normalize(c.name), { ...c, id: Number(id) }]),
);

/**
 * ID ya da isimden kategori kimliğini çözer.
 * @param {number|string|null} idOrName
 */
export function resolveCategory(idOrName) {
  if (idOrName === null || idOrName === undefined || idOrName === "") return FALLBACK;

  const asId = Number(idOrName);
  if (Number.isFinite(asId) && CATEGORIES[asId]) {
    return { ...CATEGORIES[asId], id: asId };
  }

  return BY_NAME.get(normalize(idOrName)) || { ...FALLBACK, name: String(idOrName) || FALLBACK.name };
}

export { CATEGORIES, FALLBACK };
