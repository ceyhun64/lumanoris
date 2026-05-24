"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "./layout"; // Layout ile aynı dizinde olduğu varsayıldı
import BotGrid from "../components/BotGrid/BotGrid";
import CategoryFilter from "../components/CategoryFilter/CategoryFilter";
import MarketplaceHeader from "../components/MarketPlaceHeader/MarketPlaceHeader";

export default function Dashboard() {
    const userId = useContext(UserContext);
    const router = useRouter();

    const [bots, setBots] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Kategorileri Çek (UserId'den bağımsız olduğu için hemen çalışabilir)
    useEffect(() => {
        fetch('/api/getcategories.php')
            .then(async res => {
                const text = await res.text();
                try {
                    const data = JSON.parse(text);
                    if (Array.isArray(data)) {
                        const allCats = [{ id: 'all', kategori_adi_tr: 'Tümü' }, ...data];
                        setCategories(allCats);
                    }
                } catch (e) { console.error("Kategori yükleme hatası:", e); }
            });
    }, []);

    // 2. Ana Veri Çekme (Sadece userId geldiğinde çalışır)
    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [botsRes, unRes, hideRes, listsRes] = await Promise.all([
                    fetch(`/api/getchatbots.php?id=${userId}`),
                    fetch(`/api/getuninterest.php?id=${userId}`),
                    fetch(`/api/gethide.php?user_id=${userId}`),
                    fetch(`/api/getuserlists.php?id=${userId}`)
                ]);

                const botsData = await botsRes.json();
                const unData = await unRes.json();
                const hideData = await hideRes.json();
                const listsData = await listsRes.json();

                const uninterestedCategoryIds = Array.isArray(unData) 
                    ? unData.map(item => Number(item.category_id)) 
                    : [];

                const hiddenBotIds = Array.isArray(hideData)
                    ? hideData.map(item => Number(item.chatbot_id || item.id)) 
                    : [];

                if (Array.isArray(botsData)) {
                    const filteredAndMapped = botsData
                        .filter(bot => {
                            const isCategoryBanned = uninterestedCategoryIds.includes(Number(bot.kategori_id));
                            const isBotHidden = hiddenBotIds.includes(Number(bot.id));
                            return !isCategoryBanned && !isBotHidden;
                        })
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

                    setBots(filteredAndMapped);
                }
            } catch (err) {
                console.error("Veri işleme hatası:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    // Yardımcı Fonksiyonlar
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) return "Bugün";
        return `${diffDays} Gün`;
    };

    const handleRemoveBot = (id) => {
        setBots((prev) => prev.filter((bot) => bot.id !== id));
    };

    // Güvenlik: userId yoksa render etme (Redirect zaten layout'ta yapılıyor)
    if (!userId) return null;

    return (
        <div className="marketplace-page">
            <div className="mobile-header">Home</div>
            <MarketplaceHeader />
            
            <CategoryFilter 
                categories={categories} 
                onSelect={(cat) => console.log("Seçilen Kategori:", cat)} 
            />
            
            {loading ? (
                <div style={{textAlign: 'center', padding: '50px', color: 'white'}}>
                    Botlar yükleniyor...
                </div>
            ) : (
                <BotGrid bots={bots} userId={userId} onRemove={handleRemoveBot} />
            )}
        </div>
    );
}