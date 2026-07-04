"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { UserContext } from "./layout";
import BotGrid from "@/widgets/BotGrid";
import CategoryFilter from "@/widgets/CategoryFilter";
import MarketplaceHeader from "@/widgets/MarketplaceHeader";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState as SharedEmptyState } from "@/shared/ui/empty-state";

function SkeletonCard() {
    return (
        <div className="bg-luma-card border border-white/5 rounded-2xl overflow-hidden">
            <Skeleton className="w-full aspect-[4/3] rounded-none" />
            <div className="p-3 flex flex-col gap-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
                <div className="flex items-center gap-2 mt-1">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-2 w-1/3" />
                </div>
            </div>
        </div>
    );
}

function EmptyState() {
    const router = useRouter();
    return (
        <SharedEmptyState
            icon={PackageSearch}
            title="Bot bulunamadı"
            description="Bu kategoride henüz bot yok veya tümü filtrelendi."
            actionLabel="İlk Botu Oluştur"
            onAction={() => router.push("/dashboard/chatbots/create")}
        />
    );
}

export default function Dashboard() {
    const userId = useContext(UserContext);
    const router = useRouter();

    const [bots, setBots] = useState([]);
    const [allBots, setAllBots] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("Tümü");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/content/getcategories.php')
            .then(async res => {
                try {
                    const data = JSON.parse(await res.text());
                    if (Array.isArray(data)) {
                        setCategories([{ id: 'all', kategori_adi_tr: 'Tümü' }, ...data]);
                    }
                } catch (e) { console.error("Kategori yükleme hatası:", e); }
            });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [botsRes, unRes, hideRes, listsRes] = await Promise.all([
                    fetch(`/api/chatbot/getchatbots.php`),
                    userId ? fetch(`/api/social/getuninterest.php?id=${userId}`) : Promise.resolve(null),
                    userId ? fetch(`/api/social/gethide.php?user_id=${userId}`) : Promise.resolve(null),
                    userId ? fetch(`/api/social/getuserlists.php?id=${userId}`) : Promise.resolve(null),
                ]);

                const botsData = await botsRes.json();
                const unData = unRes ? await unRes.json() : [];
                const hideData = hideRes ? await hideRes.json() : [];
                const listsData = listsRes ? await listsRes.json() : [];

                const uninterestedCategoryIds = Array.isArray(unData)
                    ? unData.map(item => Number(item.category_id)) : [];
                const hiddenBotIds = Array.isArray(hideData)
                    ? hideData.map(item => Number(item.chatbot_id || item.id)) : [];

                if (Array.isArray(botsData)) {
                    const mapped = botsData
                        .filter(bot =>
                            !uninterestedCategoryIds.includes(Number(bot.kategori_id)) &&
                            !hiddenBotIds.includes(Number(bot.id))
                        )
                        .map(bot => ({
                            id: bot.id,
                            title: bot.isim,
                            author: (bot.owner_name === "SYSTEM" ? "Lumanoris" : bot.owner_name) || "Anonim",
                            dialogues: bot.toplam_chats,
                            time: formatTime(bot.yayimlanma_tarih),
                            avatar: bot.profil_fotografi,
                            image: bot.kapak_fotografi,
                            kategori_id: bot.kategori_id,
                            badge: {
                                type: bot.durum == 0 ? "sold" : "produced",
                                label: bot.durum == 1 ? "Daha önce satıldı" : "Üretildi"
                            },
                            userLists: Array.isArray(listsData) ? listsData : []
                        }));
                    setAllBots(mapped);
                    setBots(mapped);
                }
            } catch (err) {
                console.error("Veri işleme hatası:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    // Apply category filter whenever selection or allBots changes
    useEffect(() => {
        if (selectedCategory === "Tümü") {
            setBots(allBots);
        } else {
            const cat = categories.find(c => c.kategori_adi_tr === selectedCategory);
            setBots(cat ? allBots.filter(b => String(b.kategori_id) === String(cat.id)) : allBots);
        }
    }, [selectedCategory, allBots, categories]);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const diffDays = Math.ceil(Math.abs(new Date() - date) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) return "Bugün";
        return `${diffDays} Gün`;
    };

    const handleRemoveBot = (id) => {
        setAllBots(prev => prev.filter(bot => bot.id !== id));
    };

    return (
        <div className="flex flex-col min-h-full bg-luma-base">

            {/* ── Hero / Search area ── */}
            <div className="relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(99,102,241,0.09)_0%,transparent_100%)] pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                <MarketplaceHeader />
            </div>

            {/* ── Sticky category bar ── */}
            <div className="sticky top-0 z-20 bg-luma-base/95 backdrop-blur-md border-b border-white/5">
                <CategoryFilter
                    categories={categories}
                    selected={selectedCategory}
                    onSelect={(cat) => setSelectedCategory(cat)}
                />
            </div>

            {/* ── Bot grid section ── */}
            <div className="flex-1 px-6 pt-5 pb-10">

                {/* Section header */}
                {!loading && (
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <h2 className="text-[17px] font-semibold font-display text-white">
                                {selectedCategory === "Tümü" ? "Pazaryeri" : selectedCategory}
                            </h2>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[13px] font-sans">
                                {bots.length} bot
                            </span>
                        </div>

                        {selectedCategory !== "Tümü" && (
                            <button
                                onClick={() => setSelectedCategory("Tümü")}
                                className="text-[13px] text-white/30 hover:text-white/60 font-sans transition-colors flex items-center gap-1"
                            >
                                <span>×</span> Filtreyi temizle
                            </button>
                        )}
                    </div>
                )}

                {/* Loading skeletons */}
                {loading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && bots.length === 0 && <EmptyState />}

                {/* Bot grid */}
                {!loading && bots.length > 0 && (
                    <BotGrid bots={bots} userId={userId} onRemove={handleRemoveBot} />
                )}
            </div>
        </div>
    );
}
