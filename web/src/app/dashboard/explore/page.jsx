"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { SearchX } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { resolveCoverSrc } from "@/shared/lib/image";
import BotList from "@/widgets/BotList";
import MarketplaceToolbar from "@/widgets/MarketplaceToolbar";
import { PageLayout, PageHeader, PageSection, CardGrid } from "@/shared/ui/page-layout";

function formatTime(dateString) {
    const date = new Date(dateString);
    const diffDays = Math.ceil(Math.abs(new Date() - date) / (1000 * 60 * 60 * 24));
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

    const [categories, setCategories] = useState([{ id: 0, kategori_adi_tr: "Tümü" }]);
    const [apiBots, setApiBots] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortType, setSortType] = useState("onerilen");

    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch("/api/content/getcategories.php");
            if (!response.ok) throw new Error(`Kategori HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.success === false) throw new Error(data.message || "Kategori API'sinden hata alındı.");

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
            if (!response.ok) throw new Error(`Bot HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (!data.success) throw new Error(data.message || "Bot API'sinden hata alındı.");

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
            const lists = localStorage.getItem('userLists');
            return lists ? JSON.parse(lists) : [];
        }
        return [];
    };

    const addBotsToList = (listName, botIds) => {
        const lists = getUserLists();
        const selectedBotData = botIds.map(id => apiBots.find(bot => bot.id === id)).filter(Boolean);

        const existingListIndex = lists.findIndex(list => list.name === listName);

        if (existingListIndex >= 0) {
            lists[existingListIndex].bots = [...lists[existingListIndex].bots, ...selectedBotData];
        } else {
            lists.push({
                name: listName,
                bots: selectedBotData,
                createdAt: new Date().toISOString()
            });
        }

        localStorage.setItem('userLists', JSON.stringify(lists));
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const from = params.get("from");
            const name = params.get("name");
            const urlSearchTerm = params.get("search") || "";

            setIsFromList(from === "list");
            setListName(name || '');
            setSearchTerm(urlSearchTerm);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchAllBots();
    }, [fetchAllBots]);

    const mappedBots = apiBots.map(bot => ({
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
        const cat = categories.find(c => c.kategori_adi_tr === activeCategory);
        filteredBots = cat ? filteredBots.filter(b => Number(b.kategori_id) === Number(cat.id)) : filteredBots;
    }

    if (searchTerm.trim()) {
        const q = searchTerm.trim().toLocaleLowerCase('tr');
        filteredBots = filteredBots.filter(b => b.title?.toLocaleLowerCase('tr').includes(q));
    }

    const sortedBots = [...filteredBots];
    switch (sortType) {
        case 'fiyat_artan':   sortedBots.sort((a, b) => a.weeklyPrice - b.weeklyPrice); break;
        case 'fiyat_azalan':  sortedBots.sort((a, b) => b.weeklyPrice - a.weeklyPrice); break;
        case 'favoriler':     sortedBots.sort((a, b) => b.likes - a.likes); break;
        case 'liste':         sortedBots.sort((a, b) => b.saves - a.saves); break;
        case 'yeni':          sortedBots.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)); break;
        case 'diyalog':       sortedBots.sort((a, b) => b.dialogues - a.dialogues); break;
        case 'degerlendirme': sortedBots.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments)); break;
        default: sortedBots.sort((a, b) => (b.dialogues * 2 + b.likes) - (a.dialogues * 2 + a.likes)); break; // 'onerilen'
    }

    const toggleBotSelection = (botId) => {
        setSelectedBots((prev) =>
            prev.includes(botId) ? prev.filter(id => id !== botId) : [...prev, botId]
        );
    };

    return (
        <PageLayout className="pb-24">
            <PageHeader
                eyebrow="Pazaryeri"
                title="Keşfet"
                description="Topluluğun oluşturduğu chatbotları keşfet, sohbet et ve favorilerini kaydet."
                action={!loading && (
                    <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/[0.08] px-3.5 py-1.5 text-[12.5px] font-semibold text-fuchsia-300">
                        {sortedBots.length} chatbot bulundu
                    </span>
                )}
            />

            {error && (
                <p className="mb-4 text-rose-400">Veri yüklenemedi: {error}</p>
            )}

            <PageSection>
                <MarketplaceToolbar
                    query={searchTerm}
                    onQueryChange={setSearchTerm}
                    sort={sortType}
                    onSortChange={setSortType}
                    categories={categories}
                    selected={activeCategory}
                    onSelectCategory={setActiveCategory}
                />
            </PageSection>

            <PageSection className="flex-1 pt-6">
                {loading ? (
                    <CardGrid>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex flex-col overflow-hidden rounded-2xl bg-luma-card">
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
            </PageSection>

            {isFromList && selectedBots.length > 0 && (
                <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-transparent bg-luma-elevated px-6 py-4 shadow-modal">
                    <p className="text-sm text-white">{selectedBots.length} bot seçildi</p>
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
        </PageLayout>
    );
}
