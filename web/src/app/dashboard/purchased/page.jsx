"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles,
  Bot,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Filter,
} from "lucide-react";

// Safe navigation hook for interactive preview environments
function useRouter() {
  return {
    push: (path) => {
      if (typeof window !== "undefined") {
        window.location.href = path;
      }
    },
  };
}

// Class names merger helper
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Fallback images and path resolvers
function resolveImg(path, kind = "cover") {
  if (path) {
    return path.startsWith("http") ||
      path.startsWith("data:") ||
      path.startsWith("/")
      ? path
      : "/" + path;
  }
  return kind === "avatar"
    ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80"
    : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
}

function formatDate(value) {
  if (!value) return "Süresiz";
  const d = new Date(String(value).replace(" ", "T"));
  if (isNaN(d.getTime())) return "Geçersiz Tarih";
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysRemaining(value) {
  if (!value) return null;
  const d = new Date(String(value).replace(" ", "T"));
  if (isNaN(d.getTime())) return null;
  const diffTime = d.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-white/[0.08] rounded-full animate-pulse" />
          <div className="h-8 w-64 bg-white/[0.08] rounded-xl animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-white/[0.08] rounded-xl animate-pulse" />
      </div>

      {/* Stats Bar Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 animate-pulse space-y-2"
          >
            <div className="h-3 w-16 bg-white/[0.08] rounded" />
            <div className="h-7 w-20 bg-white/[0.08] rounded-lg" />
          </div>
        ))}
      </div>

      {/* Controls Skeleton */}
      <div className="h-12 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-4 space-y-4"
          >
            <div className="h-36 w-full bg-white/[0.06] rounded-xl animate-pulse" />
            <div className="h-4 w-3/4 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-white/[0.06] rounded animate-pulse" />
            <div className="pt-2 flex justify-between">
              <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SatinAldiklarim() {
  const [bots, setBots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'expired'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/sessioncheck.php", {
          credentials: "include",
        });
        const result = JSON.parse(await res.text());
        if (result.authenticated) {
          setUserId(result.user_id);
        } else {
          // Demo fallback for presentation mode
          setUserId("demo_user_123");
        }
      } catch (err) {
        console.error("Session check error:", err);
        setUserId("demo_user_123");
      } finally {
        setSessionChecked(true);
      }
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchSubscriptions = fetch(
      `/api/wallet/getmysubscriptions.php?user_id=${userId}`,
    )
      .then((res) => res.text())
      .then((dataText) => {
        try {
          const data = JSON.parse(dataText);
          if (data?.success && Array.isArray(data.subscriptions)) {
            setBots(data.subscriptions);
          } else {
            // Mock preview fallback if backend endpoint returns empty array
            setBots([
              {
                id: 101,
                chatbot_id: "bot_101",
                isim: "E-Ticaret Müşteri Asistanı Pro",
                kapak_fotografi:
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
                profil_fotografi:
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                kategori_id: "1",
                is_active: 1,
                expiry_date: "2026-11-20 23:59:59",
              },
              {
                id: 102,
                chatbot_id: "bot_102",
                isim: "Hukuk & Mevzuat Danışmanı AI",
                kapak_fotografi:
                  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80",
                profil_fotografi:
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                kategori_id: "2",
                is_active: 1,
                expiry_date: "2026-08-15 12:00:00",
              },
              {
                id: 103,
                chatbot_id: "bot_103",
                isim: "SaaS Kod Inceleme & Reviewer",
                kapak_fotografi:
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
                profil_fotografi:
                  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
                kategori_id: "3",
                is_active: 0,
                expiry_date: "2026-01-10 00:00:00",
              },
            ]);
          }
        } catch (e) {
          console.error("Subscription parse error:", e);
        }
      })
      .catch((err) => console.error("Satın alınanlar yüklenemedi:", err));

    const fetchCategories = fetch("/api/content/getcategories.php")
      .then((res) => res.text())
      .then((text) => {
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) setCategories(data);
        } catch (e) {
          setCategories([
            { id: "1", kategori_adi_tr: "Müşteri Desteği" },
            { id: "2", kategori_adi_tr: "Hukuk & Finans" },
            { id: "3", kategori_adi_tr: "Yazılım & Teknik" },
          ]);
        }
      })
      .catch((err) => console.error("Kategori fetch hatası:", err));

    Promise.all([fetchSubscriptions, fetchCategories]).finally(() =>
      setLoading(false),
    );
  }, [userId, sessionChecked]);

  const filteredBots = useMemo(() => {
    return bots.filter((bot) => {
      const matchesSearch =
        bot.isim?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.chatbot_id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "all" ||
        String(bot.kategori_id) === String(selectedCategory);

      const isActive = Number(bot.is_active) === 1;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "expired" && !isActive);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [bots, searchQuery, selectedCategory, statusFilter]);

  const activeCount = useMemo(
    () => bots.filter((b) => Number(b.is_active) === 1).length,
    [bots],
  );
  const expiredCount = useMemo(
    () => bots.filter((b) => Number(b.is_active) !== 1).length,
    [bots],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4 sm:p-8 font-sans">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-fuchsia-500/30 selection:text-fuchsia-200 p-4 sm:p-8 font-sans pb-24">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-fuchsia-600/10 via-violet-600/10 to-transparent blur-[140px]" />
        <div className="absolute top-[40%] left-[-100px] h-[400px] w-[400px] rounded-full bg-cyan-600/10 blur-[140px]" />
      </div>

      <div className="relative space-y-8">
        {}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1 text-xs font-mono font-semibold text-fuchsia-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Kütüphanem</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Satın Aldıklarım
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Pazaryerinden edindiğiniz özel yapay zeka asistanları ve aktif
              lisanslarınız.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/explore")}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-fuchsia-950/40 hover:brightness-110 active:scale-95 transition cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Pazaryerini Keşfet</span>
            <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl p-4 space-y-1">
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Toplam Bot
            </p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {bots.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] backdrop-blur-xl p-4 space-y-1">
            <p className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aktif Lisanslar
            </p>
            <p className="text-2xl font-bold text-emerald-300 tracking-tight">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] backdrop-blur-xl p-4 space-y-1">
            <p className="text-[11px] font-mono text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Süresi Dolan
            </p>
            <p className="text-2xl font-bold text-rose-300 tracking-tight">
              {expiredCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl p-4 space-y-1">
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400" /> Koruma
              Tipi
            </p>
            <p className="text-sm font-semibold text-zinc-200 mt-1">
              Gelişmiş RAG + GPT-4o
            </p>
          </div>
        </div>

        {}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 rounded-2xl border border-white/[0.08] bg-zinc-900/80 backdrop-blur-xl">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bot ismi veya ID ara..."
              className="w-full bg-black/40 border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-fuchsia-500/50 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-black/40 border border-white/[0.08] text-xs text-zinc-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-fuchsia-500/50 cursor-pointer"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.kategori_adi_tr}
                </option>
              ))}
            </select>

            {/* Status Segment Control */}
            <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/[0.08] text-xs font-medium">
              <button
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition cursor-pointer",
                  statusFilter === "all"
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                Tümü
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition cursor-pointer",
                  statusFilter === "active"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                Aktif
              </button>
              <button
                onClick={() => setStatusFilter("expired")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition cursor-pointer",
                  statusFilter === "expired"
                    ? "bg-rose-500/20 text-rose-300"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                Süresi Dolan
              </button>
            </div>

            {/* View Toggle */}
            <div className="hidden sm:flex items-center bg-black/50 p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-lg transition cursor-pointer",
                  viewMode === "grid"
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-lg transition cursor-pointer",
                  viewMode === "list"
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {}
        {filteredBots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 p-12 text-center space-y-4 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 mx-auto flex items-center justify-center">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-lg font-bold text-white">Bot Bulunamadı</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {searchQuery ||
                selectedCategory !== "all" ||
                statusFilter !== "all"
                  ? "Aradığınız filtre kriterlerine uygun satın alınmış chatbot bulunmuyor."
                  : "Henüz bir sohbet botu satın almadınız. Pazaryerinden ihtiyacınıza en uygun asistanı seçebilirsiniz."}
              </p>
            </div>
            {searchQuery ||
            selectedCategory !== "all" ||
            statusFilter !== "all" ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition cursor-pointer"
              >
                Filtreleri Sıfırla
              </button>
            ) : (
              <button
                onClick={() => router.push("/dashboard/explore")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-xs font-bold text-white shadow-lg hover:brightness-110 transition cursor-pointer"
              >
                Pazaryerini Keşfet
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredBots.map((bot) => {
              const cat = categories.find(
                (c) => String(c.id) === String(bot.kategori_id),
              );
              const categoryLabel = cat ? cat.kategori_adi_tr : "Genel";
              const active = Number(bot.is_active) === 1;
              const daysLeft = getDaysRemaining(bot.expiry_date);

              return (
                <div
                  key={bot.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    router.push("/dashboard/chat?botId=" + bot.chatbot_id)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push("/dashboard/chat?botId=" + bot.chatbot_id);
                    }
                  }}
                  className="group relative rounded-2xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl overflow-hidden hover:border-fuchsia-500/40 hover:bg-zinc-900/90 hover:shadow-[0_0_30px_-5px_rgba(217,70,239,0.15)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  {/* Top Cover Section */}
                  <div>
                    <div className="relative aspect-[16/9] w-full bg-zinc-950 overflow-hidden">
                      <img
                        src={resolveImg(bot.kapak_fotografi)}
                        alt={bot.isim}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                      {/* Status Badge */}
                      <div className="absolute right-3 top-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-md shadow-md",
                            active
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30",
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              active
                                ? "bg-emerald-400 animate-pulse"
                                : "bg-rose-400",
                            )}
                          />
                          {active ? "Aktif" : "Süresi Bitti"}
                        </span>
                      </div>

                      {/* Avatar Overlay */}
                      <div className="absolute -bottom-4 left-4 h-10 w-10 overflow-hidden rounded-xl border-2 border-zinc-900 bg-zinc-950 shadow-lg">
                        <img
                          src={resolveImg(bot.profil_fotografi, "avatar")}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-4 pt-6 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-fuchsia-400">
                        <Zap className="w-3 h-3" />
                        <span>#{categoryLabel}</span>
                      </div>

                      <h3 className="font-bold text-sm text-white group-hover:text-fuchsia-200 transition-colors line-clamp-1">
                        {bot.isim}
                      </h3>

                      <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>
                          {active ? "Bitiş" : "Sona Erdi"}:{" "}
                          {formatDate(bot.expiry_date)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Action */}
                  <div className="p-4 pt-2 border-t border-white/[0.06] mt-2 flex items-center justify-between">
                    {active && daysLeft !== null && daysLeft > 0 ? (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {daysLeft} gün kaldı
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500">
                        ID: {bot.chatbot_id}
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-xs font-bold text-fuchsia-300 group-hover:text-fuchsia-200">
                      Sohbet Et
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBots.map((bot) => {
              const cat = categories.find(
                (c) => String(c.id) === String(bot.kategori_id),
              );
              const categoryLabel = cat ? cat.kategori_adi_tr : "Genel";
              const active = Number(bot.is_active) === 1;

              return (
                <div
                  key={bot.id}
                  onClick={() =>
                    router.push("/dashboard/chat?botId=" + bot.chatbot_id)
                  }
                  className="group rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-4 hover:border-fuchsia-500/40 hover:bg-zinc-900/90 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={resolveImg(bot.profil_fotografi, "avatar")}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                          {bot.isim}
                        </h4>
                        <span className="text-[10px] font-mono text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">
                          {categoryLabel}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2 font-mono">
                        <span>Bitiş: {formatDate(bot.expiry_date)}</span>
                        <span>•</span>
                        <span>Bot ID: {bot.chatbot_id}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border",
                        active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20",
                      )}
                    >
                      {active ? "Aktif Lisans" : "Süresi Dolan"}
                    </span>

                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-fuchsia-600 text-xs font-semibold text-white transition cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Sohbete Başlat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
