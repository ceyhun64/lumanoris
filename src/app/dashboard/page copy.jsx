"use client";
import { UserContext } from "./layout";
import BotGrid from "../components/BotGrid/BotGrid";
import CategoryFilter from "../components/CategoryFilter/CategoryFilter";
import MarketplaceHeader from "../components/MarketPlaceHeader/MarketPlaceHeader";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useContext(UserContext);
    const [categories, setCategories] = useState([]);

    const router = useRouter();

    useEffect(() => {
        fetch('/api/getcategories.php')
        .then(async res => {
            const text = await res.text();
            //console.log(text);
            try {
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                    const allCats = [{ id: 'all', kategori_adi_tr: 'Tümü' }, ...data];
                    setCategories(allCats);
                }
            } catch (e) { console.error(e); }
        });
    },[]);

    // 1. Oturum Kontrolü
    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/sessioncheck.php", { credentials: "include" });
                const result = await res.json();
                if (result.authenticated) {
                    setUser(result.user_id);
                } else {
                    router.push("/login");
                }
            } catch (err) {
                console.error("Session check error:", err);
                router.push("/login");
            }
        }
        checkSession();
    }, [router]);

    // Tarih formatlama
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) return "Bugün";
        return `${diffDays} Gün`;
    };

    // 2. Veri Çekme ve Filtreleme
    useEffect(() => {
        if (!user) return; // userId layout'tan gelene kadar hiçbir şey yapma

        const fetchData = async () => {
            setLoading(true);
            try {
                // Sadece verileri çekiyoruz, session kontrolü falan bitti.
                const [botsRes, unRes, hideRes] = await Promise.all([
                    fetch('/api/getchatbots.php'),
                    fetch(`/api/getuninterest.php?id=${user}`),
                    fetch(`/api/gethide.php?user_id=${user}`)
                ]);
                // ... (Geri kalan işlemlerin aynı)
                const botsData = await botsRes.json();
                const unData = await unRes.json();
                const hideData = await hideRes.json();

                // Kategori bazlı engeller (category_id'leri topluyoruz)
                const uninterestedCategoryIds = Array.isArray(unData) 
                    ? unData.map(item => Number(item.category_id)) 
                    : [];

                // Bot bazlı engeller (chatbot_id'leri topluyoruz)
                // PHP modülün "chatbot_id" dönüyorsa "item.chatbot_id" yapıyoruz
                const hiddenBotIds = Array.isArray(hideData)
                    ? hideData.map(item => Number(item.chatbot_id || item.id)) 
                    : [];

                if (Array.isArray(botsData)) {
                    const filteredAndMapped = botsData
                        .filter(bot => {
                            // Filtre 1: Botun kategorisi yasaklı mı?
                            const isCategoryBanned = uninterestedCategoryIds.includes(Number(bot.kategori_id));
                            
                            // Filtre 2: Botun kendisi gizlenmiş mi?
                            const isBotHidden = hiddenBotIds.includes(Number(bot.id));

                            // İkisi de değilse göster
                            return !isCategoryBanned && !isBotHidden;
                        })
                        .map(bot => ({
                            id: bot.id,
                            title: bot.isim,
                            author: "Anonim",
                            dialogues: bot.toplam_chats,
                            time: formatTime(bot.yayimlanma_tarih),
                            avatar: bot.profil_fotografi,
                            image: bot.kapak_fotografi,
                            kategori_id: bot.kategori_id, // Card içinde "İlgilenmiyorum" için gerekli
                            badge: { 
                                type: bot.durum == 1 ? "sold" : "produced", 
                                label: bot.durum == 1 ? "Daha önce satıldı" : "Üretildi" 
                            }
                        }));

                    setBots(filteredAndMapped);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // BotCard bileşeninden "Kaldır" (gizle) tetiklendiğinde UI'ı anlık güncelle
    const handleRemoveBot = (id) => {
        setBots((prev) => prev.filter((bot) => bot.id !== id));
    };

    return (
        <div className="marketplace-page">
            <div className="mobile-header">Home</div>
            <MarketplaceHeader />
            <CategoryFilter categories={categories} onSelect={(cat) => console.log("Seçilen:", cat)} />
            
            {loading ? (
                <div style={{textAlign: 'center', padding: '50px', color: 'white'}}>Yükleniyor...</div>
            ) : (
                <BotGrid bots={bots} userId={user} onRemove={handleRemoveBot} />
            )}
        </div>
    );
}