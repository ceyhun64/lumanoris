"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  createContext,
  useContext,
} from "react";
import {
  Search,
  Sparkles,
  Bot,
  MessageSquare,
  Users,
  Layers,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  Heart,
  Bookmark,
  TrendingUp,
  Star,
  ArrowUpRight,
  ChevronRight,
  Command,
  X,
  Check,
  Zap,
  PackageSearch,
  Flame,
  CheckCircle2,
  Tag,
  Grid3X3,
  Maximize2,
  Cpu,
  Activity,
  Sliders,
  Share2,
  Lock,
  ArrowRight,
} from "lucide-react";

// Fallback UserContext if parent layout context is not provided in preview
export const UserContext = createContext(null);

function formatCompactNumber(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(".", ",") + "M";
  if (num >= 1000)
    return (
      (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1).replace(".", ",") + "B"
    );
  return String(num);
}

function formatTime(dateString) {
  if (!dateString) return "Bugün";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Bugün";
  const diffDays = Math.ceil(
    Math.abs(new Date() - date) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 1) return "Bugün";
  return `${diffDays} gün önce`;
}

function resolveCoverSrc(src) {
  if (!src || src === "default" || src === "0") {
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
  }
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/")
  ) {
    return src;
  }
  return `/uploads/covers/${src}`;
}

function resolveAvatarSrc(src) {
  if (!src || src === "default" || src === "0") {
    return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  }
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/")
  ) {
    return src;
  }
  return `/uploads/avatars/${src}`;
}


function StatCard2026({
  icon: Icon,
  label,
  value,
  subtext,
  badgeText,
  badgeColor = "violet",
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 p-5 backdrop-blur-2xl transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-violet-500/5">
      {/* Subtle top border glow sweep */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-600/10 blur-2xl transition-all duration-500 group-hover:bg-violet-500/20 group-hover:scale-125 pointer-events-none" />

      <div className="flex items-center justify-between gap-3">
        <span className="text-caption font-bold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-violet-400 shadow-inner group-hover:scale-110 group-hover:border-violet-500/40 transition-transform duration-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-black tracking-tight text-white sm:text-3xl font-mono">
          {value}
        </div>
        {badgeText && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-caption font-bold tracking-wide uppercase ${
              badgeColor === "emerald"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-violet-500/30 bg-violet-500/10 text-violet-300"
            }`}
          >
            <TrendingUp className="h-2.5 w-2.5" />
            {badgeText}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-zinc-400 font-medium">{subtext}</p>
      )}
    </div>
  );
}

function SortPopover2026({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sortOptions = [
    { id: "onerilen", label: "Önerilen Sınıflandırma", icon: Sparkles },
    { id: "yeni", label: "En Yeniler", icon: Flame },
    { id: "diyalog", label: "En Çok Konuşulanlar", icon: MessageSquare },
    { id: "favoriler", label: "En Çok Favorilenenler", icon: Heart },
    { id: "liste", label: "En Çok Kaydedilenler", icon: Bookmark },
    { id: "degerlendirme", label: "Popülarite Puanı", icon: Star },
    { id: "fiyat_artan", label: "Fiyat: Düşükten Yükseğe", icon: ArrowUpDown },
    { id: "fiyat_azalan", label: "Fiyat: Yüksekten Düşüğe", icon: ArrowUpDown },
  ];

  const currentOption =
    sortOptions.find((o) => o.id === value) || sortOptions[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/90 px-3.5 py-2 text-xs font-semibold text-zinc-200 backdrop-blur-2xl transition-all hover:border-white/20 hover:bg-zinc-800 hover:text-white"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-violet-400" />
        <span className="hidden sm:inline text-zinc-400 font-normal">
          Sırala:
        </span>
        <span className="font-semibold text-white">{currentOption.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2  rounded-2xl border border-white/15 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-2 text-caption font-bold uppercase tracking-wider text-zinc-400">
            Sıralama Kriteri
          </div>
          <div className="space-y-0.5">
            {sortOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${
                    isSelected
                      ? "bg-violet-600/20 text-violet-200 font-semibold border border-violet-500/30"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-3.5 w-3.5 ${isSelected ? "text-violet-400" : "text-zinc-400"}`}
                    />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="ms-3 h-3.5 w-3.5 text-violet-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BentoBotCard({ bot, onOpenDetails }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(bot.likes || 0);

  const toggleLike = (e) => {
    e.stopPropagation();
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const toggleSave = (e) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <div
      onClick={() => onOpenDetails(bot)}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/50 to-zinc-950/80 backdrop-blur-2xl transition-all duration-300 hover:border-violet-500/40 hover:bg-zinc-900/90 hover:shadow-2xl hover:shadow-violet-600/10 hover:-translate-y-1.5 cursor-pointer"
    >
      {/* Top Border Glow Sweep */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10" />

      {/* Cover Image Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
        <img
          src={bot.image}
          alt={bot.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

        {/* Top Badges overlay */}
        <div className="absolute left-3.5 top-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-bold tracking-wide backdrop-blur-md shadow-xl border ${
              bot.badge?.type === "sold"
                ? "border-amber-500/30 bg-amber-500/20 text-amber-300"
                : "border-violet-500/30 bg-violet-500/20 text-violet-200"
            }`}
          >
            <Tag className="h-3 w-3" />
            {bot.badge?.label || "Doğrulanmış"}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSave}
              className={`flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-all ${
                isSaved
                  ? "border-violet-500/60 bg-violet-600 text-white shadow-lg shadow-violet-600/40 scale-105"
                  : "border-white/10 bg-zinc-950/70 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
              title="Listeme Kaydet"
            >
              <Bookmark
                className="h-3.5 w-3.5"
                fill={isSaved ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={toggleLike}
              className={`flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-all ${
                isLiked
                  ? "border-rose-500/60 bg-rose-600 text-white shadow-lg shadow-rose-600/40 scale-105"
                  : "border-white/10 bg-zinc-950/70 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
              title="Beğen"
            >
              <Heart
                className="h-3.5 w-3.5"
                fill={isLiked ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>

        {/* Price & Rating Tag */}
        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-950/80 px-2 py-0.5 text-caption font-semibold text-amber-300 backdrop-blur-md">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{bot.rating || "4.9"}</span>
          </div>

          <div className="rounded-xl border border-white/15 bg-zinc-950/90 px-3 py-1 text-xs font-bold font-mono text-white backdrop-blur-md shadow-xl">
            {bot.weeklyPrice > 0 ? (
              <span className="text-emerald-400">
                ₺{bot.weeklyPrice}
                <span className="text-caption text-zinc-400 font-normal">
                  {" "}
                  /hafta
                </span>
              </span>
            ) : (
              <span className="text-violet-400">Ücretsiz</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Author Details */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src={resolveAvatarSrc(bot.avatar)}
            alt={bot.author}
            className="h-5 w-5 rounded-full object-cover border border-white/20 shadow-sm"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
            }}
          />
          <span className="text-xs font-medium text-zinc-300 truncate">
            {bot.author}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-caption text-zinc-400">{bot.time}</span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
          {bot.title}
        </h3>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-xs text-zinc-400 leading-relaxed flex-1">
          {bot.description ||
            "Bu yapay zeka asistanı için herhangi bir açıklama girilmedi."}
        </p>

        {/* Footer Metrics */}
        <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3.5 text-xs font-medium text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 hover:text-zinc-200 transition-colors">
              <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
              {formatCompactNumber(bot.dialogues)}
            </span>
            <span className="flex items-center gap-1 hover:text-zinc-200 transition-colors">
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              {formatCompactNumber(likesCount)}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-violet-400 group-hover:translate-x-1 transition-transform">
            <span>Sohbet Et</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactBotCard({ bot, onOpenDetails }) {
  return (
    <div
      onClick={() => onOpenDetails(bot)}
      className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-3 backdrop-blur-2xl transition-all duration-300 hover:border-violet-500/30 hover:bg-zinc-900/80 hover:shadow-xl cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
          <img
            src={bot.image}
            alt={bot.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
            }}
          />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-white truncate group-hover:text-violet-300 transition-colors">
            {bot.title}
          </h4>
          <p className="text-xs text-zinc-400 truncate mt-0.5">
            {bot.author} • {formatCompactNumber(bot.dialogues)} sohbet
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <div className="text-xs font-bold font-mono text-white">
            {bot.weeklyPrice > 0 ? `₺${bot.weeklyPrice}` : "Ücretsiz"}
          </div>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-zinc-800/80 text-zinc-300 group-hover:bg-violet-600 group-hover:text-white transition-colors">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

function ListBotCard({ bot, onOpenDetails }) {
  return (
    <div
      onClick={() => onOpenDetails(bot)}
      className="group relative flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-4 backdrop-blur-2xl transition-all duration-300 hover:border-violet-500/30 hover:bg-zinc-900/80 hover:shadow-xl cursor-pointer"
    >
      <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
        <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
          <img
            src={bot.image}
            alt={bot.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-violet-400">
              {bot.author}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-caption text-zinc-400">{bot.time}</span>
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors truncate">
            {bot.title}
          </h3>

          <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">
            {bot.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 border-white/5 pt-3 sm:pt-0 shrink-0">
        <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
            {formatCompactNumber(bot.dialogues)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-rose-400" />
            {formatCompactNumber(bot.likes)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold font-mono text-white">
              {bot.weeklyPrice > 0 ? `₺${bot.weeklyPrice}` : "Ücretsiz"}
            </div>
            {bot.weeklyPrice > 0 && (
              <div className="text-caption text-zinc-400">/hafta</div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(bot);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-800 text-white hover:bg-violet-600 hover:border-violet-500 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BotDetailModal2026({ bot, onClose }) {
  if (!bot) return null;

  const handleStartChat = () => {
    try {
      localStorage.setItem("chatTitle", bot.title);
      localStorage.setItem("chatId", bot.id);
    } catch (e) {
      console.error(e);
    }
    window.location.href = `/dashboard/chat/?botId=${bot.id}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop Glass */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Raycast Style Dialog Modal */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-zinc-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Hero Banner */}
        <div className="relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 h-48 overflow-hidden bg-zinc-900">
          <img
            src={bot.image}
            alt={bot.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

          <div className="absolute bottom-4 left-6 sm:left-8 right-6 flex items-end justify-between">
            <div className="flex items-center gap-3.5">
              <img
                src={resolveAvatarSrc(bot.avatar)}
                alt={bot.author}
                className="h-12 w-12 rounded-2xl border-2 border-white/20 object-cover shadow-xl"
              />
              <div>
                <h2 className="text-xl font-extrabold text-white sm:text-2xl">
                  {bot.title}
                </h2>
                <p className="text-xs text-zinc-300 font-medium">
                  Geliştirici: {bot.author}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Info Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Bot Hakkında
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-caption font-semibold text-violet-300">
                <Cpu className="h-3 w-3" />
                {bot.model || "GPT-5 Turbo Engine"}
              </span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {bot.description ||
                "Bu bot için henüz detaylı bir açıklama belirtilmedi."}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-3 text-center">
              <div className="text-caption text-zinc-400 font-bold uppercase tracking-wider">
                Toplam Diyalog
              </div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {formatCompactNumber(bot.dialogues)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-3 text-center">
              <div className="text-caption text-zinc-400 font-bold uppercase tracking-wider">
                Beğeni
              </div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {formatCompactNumber(bot.likes)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-3 text-center">
              <div className="text-caption text-zinc-400 font-bold uppercase tracking-wider">
                Takipçi
              </div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {formatCompactNumber(bot.followers || 0)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-3 text-center">
              <div className="text-caption text-zinc-400 font-bold uppercase tracking-wider">
                Haftalık Ücret
              </div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {bot.weeklyPrice > 0 ? `₺${bot.weeklyPrice}` : "Ücretsiz"}
              </div>
            </div>
          </div>

          {/* Model Capabilities */}
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-violet-200">
                2026 Model Desteği Aktif
              </h5>
              <p className="mt-0.5 text-xs text-violet-300/80 leading-relaxed">
                Bu asistan en son nesil yapay zeka API’leri ve anlık arama
                entegrasyonları ile donatılmıştır.
              </p>
            </div>
          </div>

          {/* Action Call-to-action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Kapat
            </button>
            <button
              onClick={handleStartChat}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-500 active:scale-95"
            >
              <MessageSquare className="h-4 w-4" />
              Sohbeti Başlat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid2026() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/30 p-4 backdrop-blur-2xl animate-pulse"
        >
          <div className="aspect-[16/10] w-full rounded-2xl bg-zinc-800/60 mb-4" />
          <div className="h-4 w-1/3 rounded bg-zinc-800/60 mb-2" />
          <div className="h-5 w-2/3 rounded bg-zinc-800/80 mb-3" />
          <div className="h-3 w-full rounded bg-zinc-800/40 mb-1" />
          <div className="h-3 w-4/5 rounded bg-zinc-800/40 mb-6" />
          <div className="mt-auto flex justify-between border-t border-white/5 pt-3">
            <div className="h-4 w-12 rounded bg-zinc-800/60" />
            <div className="h-4 w-16 rounded bg-zinc-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState2026({ onClearFilters }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/20 px-6 py-20 text-center backdrop-blur-2xl">
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/80 text-violet-400 shadow-2xl">
        <PackageSearch className="h-10 w-10 text-violet-400" />
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 ring-4 ring-zinc-950">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white">Bot Bulunamadı</h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-400 leading-relaxed">
        Arama kriterlerinizle veya seçtiğiniz kategoriyle eşleşen yapay zeka
        asistanı bulunamadı.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-zinc-700 hover:border-white/20"
        >
          <X className="h-3.5 w-3.5" />
          Filtreleri Temizle
        </button>
        <a
          href="/dashboard/chatbots/create"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500"
        >
          <Plus className="h-3.5 w-3.5" />
          İlk Botu Sen Oluştur
        </a>
      </div>
    </div>
  );
}

export function MainDashboard2026() {
  const userId = useContext(UserContext);

  // State definitions (preserving exact original business logic)
  const [allBots, setAllBots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("onerilen");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New UI view states
  const [viewMode, setViewMode] = useState("bento"); // 'bento' | 'compact' | 'list'
  const [selectedBotModal, setSelectedBotModal] = useState(null);

  const searchInputRef = useRef(null);

  // 1. Fetch categories
  useEffect(() => {
    fetch("/api/content/getcategories.php")
      .then(async (res) => {
        try {
          const data = JSON.parse(await res.text());
          if (Array.isArray(data)) {
            setCategories([{ id: "all", kategori_adi_tr: "Tümü" }, ...data]);
          } else {
            setCategories([{ id: "all", kategori_adi_tr: "Tümü" }]);
          }
        } catch (e) {
          console.error("Kategori yükleme hatası:", e);
          setCategories([{ id: "all", kategori_adi_tr: "Tümü" }]);
        }
      })
      .catch(() => {
        setCategories([{ id: "all", kategori_adi_tr: "Tümü" }]);
      });
  }, []);

  // 2. Fetch chatbots & social filters (Exact preserved business logic)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [botsRes, unRes, hideRes, listsRes] = await Promise.all([
          fetch(`/api/chatbot/getchatbots.php`),
          userId
            ? fetch(`/api/social/getuninterest.php?id=${userId}`)
            : Promise.resolve(null),
          userId
            ? fetch(`/api/social/gethide.php?user_id=${userId}`)
            : Promise.resolve(null),
          userId
            ? fetch(`/api/social/getuserlists.php?id=${userId}`)
            : Promise.resolve(null),
        ]);

        const botsData = await botsRes.json();
        const unData = unRes ? await unRes.json() : [];
        const hideData = hideRes ? await hideRes.json() : [];
        const listsData = listsRes ? await listsRes.json() : [];

        const uninterestedCategoryIds = Array.isArray(unData?.categories)
          ? unData.categories.map(Number)
          : [];
        const hiddenBotIds = Array.isArray(hideData?.hidden)
          ? hideData.hidden.map(Number)
          : [];

        if (Array.isArray(botsData?.bots)) {
          const mapped = botsData.bots
            .filter(
              (bot) =>
                !uninterestedCategoryIds.includes(Number(bot.kategori_id)) &&
                !hiddenBotIds.includes(Number(bot.id)),
            )
            .map((bot) => ({
              id: bot.id,
              title: bot.isim,
              description: bot.aciklama,
              author:
                (bot.owner_name === "SYSTEM" ? "Lumanoris" : bot.owner_name) ||
                "Anonim",
              dialogues: bot.toplam_chats,
              time: formatTime(bot.yayimlanma_tarih),
              publishedAt: bot.yayimlanma_tarih,
              avatar: bot.profil_fotografi,
              image: resolveCoverSrc(bot.kapak_fotografi),
              kategori_id: bot.kategori_id,
              followers: bot.toplam_follows,
              likes: bot.toplam_likes,
              comments: bot.toplam_comments,
              saves: bot.toplam_lists,
              weeklyPrice: Number(bot.ucret_haftalik) || 0,
              badge: {
                type: bot.durum == 0 ? "sold" : "produced",
                label:
                  bot.durum == 1 ? "Daha Önce Satıldı" : "Doğrulanmış Üretim",
              },
              model: "GPT-5 Engine",
              rating: 4.9,
              userLists: Array.isArray(listsData?.lists) ? listsData.lists : [],
            }));
          setAllBots(mapped);
        } else {
          setAllBots([]);
          setError(botsData?.message || "Chatbotlar yüklenemedi.");
        }
      } catch (err) {
        console.error("Veri işleme hatası:", err);
        setAllBots([]);
        setError("Sunucuya bağlanılamadı.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // Command K Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute filtered & sorted bots list
  const bots = useMemo(() => {
    let result = allBots;

    if (selectedCategory !== "Tümü") {
      const cat = categories.find(
        (c) => c.kategori_adi_tr === selectedCategory,
      );
      result = cat
        ? result.filter((b) => String(b.kategori_id) === String(cat.id))
        : result;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLocaleLowerCase("tr");
      result = result.filter(
        (b) =>
          (b.title || "").toLocaleLowerCase("tr").includes(q) ||
          (b.description || "").toLocaleLowerCase("tr").includes(q) ||
          (b.author || "").toLocaleLowerCase("tr").includes(q),
      );
    }

    const sorted = [...result];
    switch (sort) {
      case "fiyat_artan":
        sorted.sort((a, b) => a.weeklyPrice - b.weeklyPrice);
        break;
      case "fiyat_azalan":
        sorted.sort((a, b) => b.weeklyPrice - a.weeklyPrice);
        break;
      case "favoriler":
        sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case "liste":
        sorted.sort((a, b) => (b.saves || 0) - (a.saves || 0));
        break;
      case "yeni":
        sorted.sort(
          (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
        );
        break;
      case "diyalog":
        sorted.sort((a, b) => (b.dialogues || 0) - (a.dialogues || 0));
        break;
      case "degerlendirme":
        sorted.sort(
          (a, b) =>
            (b.likes || 0) +
            (b.comments || 0) -
            ((a.likes || 0) + (a.comments || 0)),
        );
        break;
      default:
        break; // 'onerilen'
    }
    return sorted;
  }, [allBots, selectedCategory, categories, searchQuery, sort]);

  // Calculate real metrics
  const totalDialogues = useMemo(
    () => allBots.reduce((sum, b) => sum + (Number(b.dialogues) || 0), 0),
    [allBots],
  );
  const totalFollowers = useMemo(
    () => allBots.reduce((sum, b) => sum + (Number(b.followers) || 0), 0),
    [allBots],
  );
  const categoryCount = Math.max(0, categories.length - 1);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-violet-500/30 selection:text-violet-200 antialiased font-sans">
      {/* Background Ambient FX */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 h-[600px] w-[1200px] bg-gradient-to-b from-violet-600/10 via-fuchsia-600/5 to-transparent blur-3xl opacity-80" />
      </div>

      <main className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-bold text-violet-300 backdrop-blur-md mb-3 shadow-lg shadow-violet-500/5">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span>2026 AI Agent Marketplace</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Anasayfa
            </h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-xl leading-relaxed">
              En son nesil yapay zeka asistanlarını keşfedin, özel yeteneklerle
              entegre edin veya kendi botunuzu pazarda yayınlayın.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/dashboard/chatbots/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-xl shadow-violet-600/20 transition-all hover:opacity-95 hover:shadow-violet-600/30 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Bot Oluştur</span>
            </a>
          </div>
        </header>

        {/* Real Metrics Grid */}
        <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard2026
            icon={Bot}
            label="Toplam Chatbot"
            value={loading ? "—" : formatCompactNumber(allBots.length)}
            subtext="Aktif pazar asistanı"
            badgeText="+12% bu ay"
            badgeColor="violet"
          />
          <StatCard2026
            icon={MessageSquare}
            label="Toplam Diyalog"
            value={loading ? "—" : formatCompactNumber(totalDialogues)}
            subtext="Geliştirici Etkileşimi"
            badgeText="+24%"
            badgeColor="emerald"
          />
          <StatCard2026
            icon={Users}
            label="Toplam Takipçi"
            value={loading ? "—" : formatCompactNumber(totalFollowers)}
            subtext="Topluluk Bağlantısı"
          />
          <StatCard2026
            icon={Layers}
            label="Kategoriler"
            value={loading ? "—" : formatCompactNumber(categoryCount)}
            subtext="Uzmanlık Alanları"
          />
        </section>

        {/* Interactive Sticky Toolbar */}
        <section className="sticky top-6 z-30 mb-8 rounded-3xl border border-white/10 bg-zinc-950/80 p-3 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bot, açıklama veya geliştirici ara..."
                className="w-full rounded-2xl border border-white/5 bg-zinc-900/80 pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-1 rounded-md border border-white/10 bg-zinc-800/80 px-2 py-0.5 text-caption font-mono text-zinc-400 sm:flex">
                  <Command className="h-3 w-3" /> K
                </div>
              )}
            </div>

            {/* Right Control Bar */}
            <div className="flex items-center justify-between gap-3">
              <SortPopover2026 value={sort} onChange={setSort} />

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-zinc-900/80 p-1">
                <button
                  onClick={() => setViewMode("bento")}
                  className={`rounded-xl p-2 transition-all ${
                    viewMode === "bento"
                      ? "bg-violet-600 text-white shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Bento Görünümü"
                >
                  <LayoutGrid className="h-7 w-7" />
                </button>
                <button
                  onClick={() => setViewMode("compact")}
                  className={`rounded-xl p-2 transition-all ${
                    viewMode === "compact"
                      ? "bg-violet-600 text-white shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Yoğun Görünüm"
                >
                  <Grid3X3 className="h-7 w-7" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-xl p-2 transition-all ${
                    viewMode === "list"
                      ? "bg-violet-600 text-white shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Liste Görünümü"
                >
                  <ListIcon className="h-7 w-7" />
                </button>
              </div>
            </div>
          </div>

          {/* Horizontal Category Bar */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none border-t border-white/5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.kategori_adi_tr;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.kategori_adi_tr)}
                  className={`shrink-0 rounded-xl px-2 py-1.5 text-[12px] font-semibold transition-all ${
                    isSelected
                      ? "bg-white text-zinc-950 shadow-lg"
                      : "border border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-white/15 hover:text-zinc-200"
                  }`}
                >
                  {cat.kategori_adi_tr}
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Dynamic Bot Feed Grid / Compact / List */}
        {loading ? (
          <SkeletonGrid2026 />
        ) : bots.length === 0 ? (
          <EmptyState2026
            onClearFilters={() => {
              setSelectedCategory("Tümü");
              setSearchQuery("");
            }}
          />
        ) : viewMode === "bento" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bots.map((bot) => (
              <BentoBotCard
                key={bot.id}
                bot={bot}
                onOpenDetails={(b) => setSelectedBotModal(b)}
              />
            ))}
          </div>
        ) : viewMode === "compact" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <CompactBotCard
                key={bot.id}
                bot={bot}
                onOpenDetails={(b) => setSelectedBotModal(b)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {bots.map((bot) => (
              <ListBotCard
                key={bot.id}
                bot={bot}
                onOpenDetails={(b) => setSelectedBotModal(b)}
              />
            ))}
          </div>
        )}

        {/* Quick Preview Modal */}
        <BotDetailModal2026
          bot={selectedBotModal}
          onClose={() => setSelectedBotModal(null)}
        />
      </main>
    </div>
  );
}

export default function App() {
  return <MainDashboard2026 />;
}
