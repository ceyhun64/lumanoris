"use client";
import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "@/shared/contexts/UserContext";
import { requireLogin } from "@/shared/lib/auth-guard";
import {
  Tag,
  Bookmark,
  Heart,
  Star,
  MessageSquare,
  ArrowUpRight,
  Check,
} from "lucide-react";
import CategoryBadge from "@/shared/ui/category-badge";
import { resolveCategory } from "@/shared/lib/categories";

function formatCompactNumber(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(".", ",") + "M";
  if (num >= 1000)
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1).replace(".", ",") + "B";
  return String(num);
}

function resolveAvatarSrc(src) {
  if (!src || src === "default" || src === "0") {
    return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  }
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
    return src;
  }
  return `/uploads/avatars/${src}`;
}

/**
 * Pazaryeri bot karti. Anasayfa ve Kesfet ayni karti kullanir — daha once
 * iki ayri bilesen vardi (BentoBotCard ve MarketplaceListCard) ve gorunumleri
 * birbirinden ayrilmisti.
 *
 * `selectable`: Kesfet'teki "listeye ekle" akisi kartlari secilebilir yapar.
 */
export default function BotCard({
  bot,
  onOpenDetails,
  selectable = false,
  selected = false,
  onToggleSelect,
}) {
  const { userId } = useContext(UserContext) || {};
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(bot.likes || 0);
  const category = resolveCategory(bot.kategori_id);

  /* Beğenme ve kaydetme oturum ister: misafir artık panelde gezinebiliyor ve
     bu düğmeler onun için sessizce hiçbir şey yapmamalı — girişe götürmeli.
     (Bu iki eylem bugün yalnızca yerel state değiştiriyor, sunucuya hiç
     yazmıyor; kapıyı yine de buraya koyuyoruz ki kalıcı hâle geldiğinde
     misafir yolu zaten kapalı olsun.) */
  const toggleLike = (e) => {
    e.stopPropagation();
    if (!requireLogin(userId, router)) return;
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
    if (!requireLogin(userId, router)) return;
    setIsSaved(!isSaved);
  };

  return (
    <div
      onClick={() => (selectable ? onToggleSelect?.(bot.id) : onOpenDetails?.(bot))}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target || !["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        selectable ? onToggleSelect?.(bot.id) : onOpenDetails?.(bot);
      }}
      role="button"
      tabIndex={0}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 shadow-xl shadow-black/10 transition-[border-color,box-shadow] duration-200 focus-visible:outline-none ${category.hoverBorder} ${category.glow} cursor-pointer${selectable && selected ? " !border-fuchsia-400/50 bg-fuchsia-500/[0.06]" : ""}`}
    >
      {/* Top Border Glow Sweep */}
      <div className={`absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent ${category.sweep} to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />

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
        <div className="absolute left-3.5 top-3.5 right-3.5 z-10 flex min-w-0 items-center justify-between gap-2">
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-bold tracking-wide backdrop-blur-md shadow-xl border ${
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
        <h3 className="text-base font-bold text-white line-clamp-1">
          {bot.title}
        </h3>

        {/* Kategori rozeti burada: tepedeki serit rozet + iki dugmeyle
            dolu oldugu icin etiket kirpiliyor, yalnizca ikon kaliyordu. */}
        <div className="mt-2">
          <CategoryBadge category={bot.kategori_id} />
        </div>

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
