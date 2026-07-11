"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { UserContext } from "./layout";
import BotList from "@/widgets/BotList";
import CategoryFilter from "@/widgets/CategoryFilter";
import MarketplaceSearchBar from "@/widgets/MarketplaceSearchBar";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState as SharedEmptyState } from "@/shared/ui/empty-state";

function SkeletonRow() {
    return (
        <div className="flex items-start gap-4 bg-luma-card border border-transparent rounded-2xl p-3.5">
            <Skeleton className="h-[84px] w-[84px] shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-2.5 w-2/3" />
                <Skeleton className="h-2.5 w-1/4 mt-2" />
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

    const [allBots, setAllBots] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("Tümü");
    const [searchQuery, setSearchQuery] = useState("");
    const [sort, setSort] = useState("onerilen");
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

                // getuninterest.php / gethide.php both return
                // {success, categories/hidden: [rawId, ...]} — a flat id
                // array under a wrapper key, not a bare array of objects.
                // The old Array.isArray(unData)/Array.isArray(hideData)
                // checks were always false against that shape, so neither
                // filter ever actually removed anything from the feed.
                const uninterestedCategoryIds = Array.isArray(unData?.categories)
                    ? unData.categories.map(Number) : [];
                const hiddenBotIds = Array.isArray(hideData?.hidden)
                    ? hideData.hidden.map(Number) : [];

                if (Array.isArray(botsData?.bots)) {
                    const mapped = botsData.bots
                        .filter(bot =>
                            !uninterestedCategoryIds.includes(Number(bot.kategori_id)) &&
                            !hiddenBotIds.includes(Number(bot.id))
                        )
                        .map(bot => ({
                            id: bot.id,
                            title: bot.isim,
                            description: bot.aciklama,
                            author: (bot.owner_name === "SYSTEM" ? "Lumanoris" : bot.owner_name) || "Anonim",
                            dialogues: bot.toplam_chats,
                            time: formatTime(bot.yayimlanma_tarih),
                            publishedAt: bot.yayimlanma_tarih,
                            avatar: bot.profil_fotografi,
                            image: bot.kapak_fotografi,
                            kategori_id: bot.kategori_id,
                            followers: bot.toplam_follows,
                            likes: bot.toplam_likes,
                            comments: bot.toplam_comments,
                            saves: bot.toplam_lists,
                            weeklyPrice: Number(bot.ucret_haftalik) || 0,
                            badge: {
                                type: bot.durum == 0 ? "sold" : "produced",
                                label: bot.durum == 1 ? "Daha önce satıldı" : "Üretildi"
                            },
                            userLists: Array.isArray(listsData?.lists) ? listsData.lists : []
                        }));
                    setAllBots(mapped);
                }
            } catch (err) {
                console.error("Veri işleme hatası:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const diffDays = Math.ceil(Math.abs(new Date() - date) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) return "Bugün";
        return `${diffDays} Gün`;
    };

    // Category + search + sort are all derived from allBots — recomputed on
    // every relevant change instead of chained state, so there's one source
    // of truth for what's actually on screen.
    const bots = (() => {
        let result = allBots;

        if (selectedCategory !== "Tümü") {
            const cat = categories.find(c => c.kategori_adi_tr === selectedCategory);
            result = cat ? result.filter(b => String(b.kategori_id) === String(cat.id)) : result;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLocaleLowerCase('tr');
            result = result.filter(b => b.title?.toLocaleLowerCase('tr').includes(q));
        }

        const sorted = [...result];
        switch (sort) {
            case 'fiyat_artan':   sorted.sort((a, b) => a.weeklyPrice - b.weeklyPrice); break;
            case 'fiyat_azalan':  sorted.sort((a, b) => b.weeklyPrice - a.weeklyPrice); break;
            case 'favoriler':     sorted.sort((a, b) => b.likes - a.likes); break;
            case 'liste':         sorted.sort((a, b) => b.saves - a.saves); break;
            case 'yeni':          sorted.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)); break;
            case 'diyalog':       sorted.sort((a, b) => b.dialogues - a.dialogues); break;
            case 'degerlendirme': sorted.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments)); break;
            default: break; // 'onerilen' — keep backend order
        }
        return sorted;
    })();

    return (
        <div className="flex flex-col min-h-full bg-luma-base">

            {/* ── Search + sort ── */}
            <MarketplaceSearchBar
                query={searchQuery}
                onQueryChange={setSearchQuery}
                sort={sort}
                onSortChange={setSort}
            />

            {/* ── Category bar ── */}
            <CategoryFilter
                categories={categories}
                selected={selectedCategory}
                onSelect={(cat) => setSelectedCategory(cat)}
            />

            {/* ── Bot list section ── */}
            <div className="flex-1 px-6 pt-2 pb-10">

                {/* Loading skeletons */}
                {loading && (
                    <div className="flex flex-col gap-3 pt-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonRow key={i} />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && bots.length === 0 && <EmptyState />}

                {/* Bot list */}
                {!loading && bots.length > 0 && (
                    <BotList bots={bots} />
                )}
            </div>
        </div>
    );
}
