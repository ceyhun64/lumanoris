"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  SearchX,
  Compass,
  Plus,
  ArrowUpRight,
  Bot,
  MessageSquare,
  Users,
  Layers,
} from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { resolveCoverSrc } from "@/shared/lib/image";
import BotList from "@/widgets/BotList";
import MarketplaceToolbar from "@/widgets/MarketplaceToolbar";
import { CardGrid } from "@/shared/ui/page-layout";

function formatCompactNumber(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(".", ",") + "M";
  if (num >= 1000)
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1).replace(".", ",") + "B";
  return String(num);
}

function StatBox({ icon: Icon, label, value, accent }) {
  const accentCls = {
    zinc: { border: "border-white/[0.08]", bg: "bg-zinc-900/60", label: "text-zinc-400", value: "text-white" },
    violet: { border: "border-violet-500/20", bg: "bg-violet-500/[0.03]", label: "text-violet-400", value: "text-violet-300" },
    fuchsia: { border: "border-fuchsia-500/20", bg: "bg-fuchsia-500/[0.03]", label: "text-fuchsia-400", value: "text-fuchsia-300" },
  }[accent || "zinc"];

  return (
    <div className={`rounded-2xl border ${accentCls.border} ${accentCls.bg} backdrop-blur-xl p-4 space-y-1`}>
      <p className={`text-caption font-mono uppercase tracking-wider flex items-center gap-1.5 ${accentCls.label}`}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </p>
      <p className={`text-2xl font-bold tracking-tight ${accentCls.value}`}>{value}</p>
    </div>
  );
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const diffDays = Math.ceil(
    Math.abs(new Date() - date) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 1) return "Bugün";
  return `${diffDays} Gün`;
}

export default function Explore() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [selectedBots, setSelectedBots] = useState([]);
  const [isFromList, setIsFromList] = useState(false);
  const [listName, setListName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([
    { id: 0, kategori_adi_tr: "Tümü" },
  ]);
  const [apiBots, setApiBots] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("onerilen");

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/content/getcategories.php");
      if (!response.ok)
        throw new Error(`Kategori HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success === false)
        throw new Error(data.message || "Kategori API'sinden hata alındı.");

      setCategories([{ id: 0, kategori_adi_tr: "Tümü" }, ...data]);
    } catch (e) {
      console.warn("Kategoriler yüklenemedi. Sadece 'Tümü' gösterilecek.", e);
    }
  }, []);

  const fetchAllBots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/chatbot/getchatbots.php?search=`);
      if (!response.ok)
        throw new Error(`Bot HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Bot API'sinden hata alındı.");

      setApiBots(Array.isArray(data.bots) ? data.bots : []);
      setSelectedBots([]);
    } catch (e) {
      console.error("Botlar çekilirken hata oluştu:", e);
      setError(e.message);
      setApiBots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserLists = () => {
    if (typeof window !== "undefined") {
      const lists = localStorage.getItem("userLists");
      return lists ? JSON.parse(lists) : [];
    }
    return [];
  };

  const addBotsToList = (listName, botIds) => {
    const lists = getUserLists();
    const selectedBotData = botIds
      .map((id) => apiBots.find((bot) => bot.id === id))
      .filter(Boolean);

    const existingListIndex = lists.findIndex((list) => list.name === listName);

    if (existingListIndex >= 0) {
      lists[existingListIndex].bots = [
        ...lists[existingListIndex].bots,
        ...selectedBotData,
      ];
    } else {
      lists.push({
        name: listName,
        bots: selectedBotData,
        createdAt: new Date().toISOString(),
      });
    }

    localStorage.setItem("userLists", JSON.stringify(lists));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      const name = params.get("name");
      const urlSearchTerm = params.get("search") || "";

      setIsFromList(from === "list");
      setListName(name || "");
      setSearchTerm(urlSearchTerm);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchAllBots();
  }, [fetchAllBots]);

  const mappedBots = apiBots.map((bot) => ({
    id: bot.id,
    title: bot.isim,
    description: bot.aciklama,
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
  }));

  let filteredBots = mappedBots;

  if (activeCategory !== "Tümü") {
    const cat = categories.find((c) => c.kategori_adi_tr === activeCategory);
    filteredBots = cat
      ? filteredBots.filter((b) => Number(b.kategori_id) === Number(cat.id))
      : filteredBots;
  }

  if (searchTerm.trim()) {
    const q = searchTerm.trim().toLocaleLowerCase("tr");
    filteredBots = filteredBots.filter((b) =>
      b.title?.toLocaleLowerCase("tr").includes(q),
    );
  }

  const sortedBots = [...filteredBots];
  switch (sortType) {
    case "fiyat_artan":
      sortedBots.sort((a, b) => a.weeklyPrice - b.weeklyPrice);
      break;
    case "fiyat_azalan":
      sortedBots.sort((a, b) => b.weeklyPrice - a.weeklyPrice);
      break;
    case "favoriler":
      sortedBots.sort((a, b) => b.likes - a.likes);
      break;
    case "liste":
      sortedBots.sort((a, b) => b.saves - a.saves);
      break;
    case "yeni":
      sortedBots.sort(
        (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
      );
      break;
    case "diyalog":
      sortedBots.sort((a, b) => b.dialogues - a.dialogues);
      break;
    case "degerlendirme":
      sortedBots.sort((a, b) => b.likes + b.comments - (a.likes + a.comments));
      break;
    default:
      sortedBots.sort(
        (a, b) => b.dialogues * 2 + b.likes - (a.dialogues * 2 + a.likes),
      );
      break; // 'onerilen'
  }

  const toggleBotSelection = (botId) => {
    setSelectedBots((prev) =>
      prev.includes(botId)
        ? prev.filter((id) => id !== botId)
        : [...prev, botId],
    );
  };

  // Real, marketplace-wide metrics — same computation as the dashboard home
  // page's stat row (allBots.reduce over dialogues/followers), so the two
  // pages never disagree on what "toplam diyalog" etc. means.
  const totalDialogues = useMemo(
    () => mappedBots.reduce((sum, b) => sum + (Number(b.dialogues) || 0), 0),
    [mappedBots],
  );
  const totalFollowers = useMemo(
    () => mappedBots.reduce((sum, b) => sum + (Number(b.followers) || 0), 0),
    [mappedBots],
  );
  const categoryCount = Math.max(0, categories.length - 1);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-fuchsia-500/30 selection:text-fuchsia-200 p-4 sm:p-8 font-sans pb-24">
      {/* Background Ambient Glow Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-600/10 via-fuchsia-600/10 to-transparent blur-[140px]" />
        <div className="absolute top-[50%] right-[-100px] h-[400px] w-[400px] rounded-full bg-cyan-600/10 blur-[140px]" />
      </div>

      <div className="relative space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1 text-xs font-mono font-semibold text-fuchsia-300">
              <Compass className="w-3.5 h-3.5" />
              <span>Pazaryeri</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Keşfet
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Topluluğun oluşturduğu chatbotları keşfet, sohbet et ve
              favorilerini kaydet.
            </p>
          </div>

          <a
            href="/dashboard/chatbots/create"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-btn px-5 py-3 text-xs font-semibold text-white shadow-glow hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Bot Oluştur</span>
            <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* Quick Stats Summary Bar — real marketplace-wide metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox
            icon={Bot}
            label="Toplam Bot"
            value={loading ? "—" : formatCompactNumber(mappedBots.length)}
            accent="zinc"
          />
          <StatBox
            icon={MessageSquare}
            label="Toplam Diyalog"
            value={loading ? "—" : formatCompactNumber(totalDialogues)}
            accent="violet"
          />
          <StatBox
            icon={Users}
            label="Toplam Takipçi"
            value={loading ? "—" : formatCompactNumber(totalFollowers)}
            accent="fuchsia"
          />
          <StatBox
            icon={Layers}
            label="Kategoriler"
            value={loading ? "—" : formatCompactNumber(categoryCount)}
            accent="zinc"
          />
        </div>

        {error && (
          <p className="text-rose-400">Veri yüklenemedi: {error}</p>
        )}

        <div className="relative z-20">
          <MarketplaceToolbar
            query={searchTerm}
            onQueryChange={setSearchTerm}
            sort={sortType}
            onSortChange={setSortType}
            categories={categories}
            selected={activeCategory}
            onSelectCategory={setActiveCategory}
          />
        </div>

        {loading ? (
          <CardGrid>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-2xl bg-luma-card"
              >
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="flex flex-col gap-2 p-3.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </CardGrid>
        ) : sortedBots.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Bu kategoriye/aramaya uygun bot bulunamadı."
            className="w-full"
          />
        ) : (
          <BotList
            bots={sortedBots}
            selectable={isFromList}
            selectedIds={selectedBots}
            onToggleSelect={toggleBotSelection}
          />
        )}
      </div>

      {isFromList && selectedBots.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-transparent bg-luma-elevated px-6 py-4 shadow-modal">
          <p className="text-sm text-white">
            {selectedBots.length} bot seçildi
          </p>
          <Button
            onClick={() => {
              addBotsToList(listName, selectedBots);
              router.push("/dashboard/list");
            }}
            className="h-auto px-5 py-2.5"
          >
            Kaydet ve Listeye Ekle
          </Button>
        </div>
      )}
    </div>
  );
}
