"use client"
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Bot,
  Sparkles,
  Layers,
  Activity,
  ArrowUpRight,
  Cpu,
  TrendingUp,
  ListFilter,
  Trash2,
  ExternalLink,
  Heart,
  MessageSquare,
  Rocket,
} from "lucide-react";
import { FilterPopover2026 } from "@/shared/ui/filter-popover";
import PublishModal from "@/features/chatbot-mgmt/PublishModal";
import AddToSaleListModal from "@/features/chatbot-mgmt/AddToSaleListModal";

function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />
  );
}

function toast({ title, description, variant }) {
  console.log(`[Toast ${variant || "default"}]: ${title} - ${description}`);
}

function PageLayout({ children, className = "" }) {
  return (
    <div
      className={`min-h-screen bg-[#070709] text-white p-6 md:p-10 ${className}`}
    >
      {children}
    </div>
  );
}

function CardGrid({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {children}
    </div>
  );
}

function ChatbotCard({
  id,
  userId,
  title,
  image,
  profileImage,
  category,
  status,
  likes,
  dialogs,
  weeklyPrice,
  monthlyPrice,
  isIndependent,
  isOwn,
  onDelete,
  onChanged,
}) {
  const [deleting, setDeleting] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0c10]/90 backdrop-blur-2xl transition-all duration-300 hover:border-violet-500/40 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-violet-950/40 to-slate-900/60">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-violet-600/10 text-violet-400">
            <Bot className="h-12 w-12 opacity-50" />
          </div>
        )}
        <div className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-caption font-medium text-white/90 backdrop-blur-md border border-white/10">
          {category}
        </div>
        <div className="absolute top-3 right-3 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-caption font-semibold backdrop-blur-md">
          {status}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Bot className="h-5 w-5 text-violet-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-white text-base truncate">
              {title || "İsimsiz Bot"}
            </h3>
            <p className="text-xs text-white/40">ID: #{id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 py-2 border-y border-white/[0.06] text-xs text-white/60">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
            <span>{dialogs || 0} Diyalog</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-fuchsia-400" />
            <span>{likes || 0} Beğeni</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs font-medium text-white/50">
            {weeklyPrice
              ? `${weeklyPrice} ₺/hafta`
              : monthlyPrice
                ? `${monthlyPrice} ₺/ay`
                : "Ücretsiz"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (
                  window.confirm("Bu botu silmek istediğinize emin misiniz?")
                ) {
                  onDelete();
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
              title="Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {isOwn && isIndependent ? (
              <button
                onClick={() => setPublishOpen(true)}
                className="flex h-8 items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50"
                title="Herkese açık yayınla"
              >
                <span>Yayınla</span>
                <Rocket className="h-3 w-3" />
              </button>
            ) : isOwn ? (
              <button
                onClick={() => setPriceOpen(true)}
                className="flex h-8 items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/20 hover:border-amber-500/50"
                title="Satış fiyatını düzenle"
              >
                <span>Fiyat Düzenle</span>
              </button>
            ) : null}
            <a
              href={`/dashboard/chatbots/edit?id=${id}`}
              className="flex h-8 items-center gap-1 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 text-xs font-semibold text-violet-300 transition-all hover:bg-violet-500/20 hover:border-violet-500/50"
            >
              <span>Yönet</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <PublishModal
        isOpen={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublished={onChanged}
        botId={id}
        userId={userId}
        weeklyPrice={weeklyPrice}
      />
      <AddToSaleListModal
        isOpen={priceOpen}
        onClose={() => setPriceOpen(false)}
        botId={id}
        weeklyPrice={weeklyPrice}
        monthlyPrice={monthlyPrice}
      />
    </div>
  );
}

export default function App() {
  const [chatbots, setChatbots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/sessioncheck.php", {
          credentials: "include",
        });
        const result = await res.json();
        setUserId(result.authenticated ? result.user_id : null);
      } catch (err) {
        setUserId(null);
      } finally {
        setSessionChecked(true);
      }
    }
    checkSession();

    fetch("/api/content/getcategories.php")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch((err) => console.error("Categories fetch error:", err));
  }, []);

  const fetchChatbots = () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetch("/api/chatbot/getchatbotsmenu.php", { credentials: "include" })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.bots)) {
          setChatbots(result.bots);
        } else {
          setError(result.message || "Chatbotlar yüklenemedi.");
        }
      })
      .catch((err) => {
        console.error("Chatbots fetch error:", err);
        setError("Sunucuya bağlanılamadı.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!sessionChecked) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchChatbots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionChecked, userId]);

  const handleDelete = async (id) => {
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ id }));
      const res = await fetch("/api/chatbot/deletechatbot.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) {
        toast({
          title: "Hata",
          description: result.message || "Chatbot silinemedi.",
          variant: "destructive",
        });
        return;
      }
      setChatbots((prev) => prev.filter((bot) => bot.id !== id));
      toast({
        title: "Başarılı",
        description: "Chatbot başarıyla silindi.",
        variant: "default",
      });
    } catch (err) {
      console.error("Delete error:", err);
      toast({
        title: "Hata",
        description: "Sunucuya bağlanılamadı.",
        variant: "destructive",
      });
    }
  };

  const filteredChatbots = useMemo(() => {
    return chatbots
      .filter((bot) => {
        const matchesSearch = bot.isim
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategory === "all" ||
          String(bot.kategori_id) === String(selectedCategory);
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return Number(b.id) - Number(a.id);
        if (sortBy === "name")
          return (a.isim || "").localeCompare(b.isim || "");
        if (sortBy === "likes")
          return Number(b.likes || 0) - Number(a.likes || 0);
        return 0;
      });
  }, [chatbots, searchQuery, selectedCategory, sortBy]);

  const metrics = useMemo(() => {
    const total = chatbots.length;
    const active = chatbots.filter(
      (b) => b.seller_status === "active" || b.is_independent,
    ).length;
    const totalDialogs = chatbots.reduce(
      (acc, b) => acc + Number(b.toplam_chats || 0),
      0,
    );
    const totalLikes = chatbots.reduce(
      (acc, b) => acc + Number(b.likes || 0),
      0,
    );
    return { total, active, totalDialogs, totalLikes };
  }, [chatbots]);

  if (loading) {
    return (
      <PageLayout className="min-h-screen bg-[#070709] text-white">
        <div className="mb-12 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8">
          <Skeleton className="h-9 w-64 bg-white/10" />
        </div>
        <CardGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-white/[0.06] bg-[#0c0c10] p-5 flex flex-col gap-4"
            >
              <Skeleton className="aspect-[16/10] w-full rounded-2xl bg-white/5" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
            </div>
          ))}
        </CardGrid>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="min-h-screen bg-[#070709] text-white pb-20">
      {/* Hero Header */}
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

          <a
            href="/dashboard/chatbots/create"
            className="group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-6 py-3.5 font-display font-semibold text-sm text-white shadow-[0_0_25px_rgba(124,58,237,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(124,58,237,0.5)] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            <span>Yeni Chatbot Oluştur</span>
          </a>
        </div>

        {/* Metrics Bar */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/[0.08]">
          <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/40">Toplam Bot</p>
              <p className="font-display text-xl font-bold text-white">
                {metrics.total}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/40">
                Aktif & Çalışır
              </p>
              <p className="font-display text-xl font-bold text-white">
                {metrics.active}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/40">
                Toplam Diyalog
              </p>
              <p className="font-display text-xl font-bold text-white">
                {metrics.totalDialogs}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/40">Beğeni Skoru</p>
              <p className="font-display text-xl font-bold text-white">
                {metrics.totalLikes}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Chatbot ismi ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 pl-11 text-sm text-white placeholder-white/30 backdrop-blur-xl transition-all duration-200 focus:border-violet-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FilterPopover2026
            icon={SlidersHorizontal}
            prefixLabel="Kategori:"
            menuLabel="Kategori Seç"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { id: "all", label: "Tüm Kategoriler" },
              ...categories.map((cat) => ({
                id: cat.id,
                label: cat.kategori_adi_tr,
              })),
            ]}
          />

          <FilterPopover2026
            icon={ListFilter}
            prefixLabel="Sırala:"
            menuLabel="Sıralama Kriteri"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { id: "newest", label: "En Yeniler" },
              { id: "name", label: "İsme Göre (A-Z)" },
              { id: "likes", label: "En Çok Beğenilen" },
            ]}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Grid */}
      <CardGrid>
        <a
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
        </a>

        {filteredChatbots.map((bot) => {
          const targetCategory = categories.find(
            (cat) => String(cat.id) === String(bot.kategori_id),
          );
          const categoryLabel = targetCategory
            ? targetCategory.kategori_adi_tr
            : "Genel";
          const isOwn = String(bot.author_user_id) === String(userId);
          const isPurchased =
            !isOwn && String(bot.owner_user_id) === String(userId);
          const statusLabel = isPurchased
            ? "Satın Alındı"
            : bot.is_independent
              ? "Bağımsız"
              : bot.seller_status === "active"
                ? "Aktif"
                : "Yayında Değil";

          return (
            <ChatbotCard
              key={bot.id}
              id={bot.id}
              userId={userId}
              title={bot.isim}
              image={bot.kapak_fotografi}
              profileImage={bot.profil_fotografi}
              category={categoryLabel}
              status={statusLabel}
              likes={bot.likes}
              dialogs={bot.toplam_chats}
              weeklyPrice={bot.ucret_haftalik}
              monthlyPrice={bot.ucret_aylik}
              isIndependent={!!bot.is_independent}
              isOwn={isOwn}
              onDelete={() => handleDelete(bot.id)}
              onChanged={fetchChatbots}
            />
          );
        })}
      </CardGrid>

      {!loading && !error && chatbots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/40 mb-4">
            <Bot className="h-8 w-8" />
          </div>
          <h3 className="font-display text-lg font-bold text-white mb-1">
            Henüz Chatbot Oluşturmadınız
          </h3>
          <p className="text-sm text-white/50 max-w-sm mb-6">
            İlk yapay zeka asistanınızı oluşturarak başlayın.
          </p>
          <a
            href="/dashboard/chatbots/create"
            className="rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110"
          >
            Yeni Chatbot Oluştur
          </a>
        </div>
      )}

      {filteredChatbots.length === 0 && chatbots.length > 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/40 mb-4">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="font-display text-lg font-bold text-white mb-1">
            Sonuç Bulunamadı
          </h3>
          <p className="text-sm text-white/50 max-w-sm mb-6">
            Arama kriterlerinize uygun chatbot bulunamadı.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/10"
          >
            Filtreleri Temizle
          </button>
        </div>
      )}
    </PageLayout>
  );
}
