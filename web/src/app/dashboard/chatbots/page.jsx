"use client";
import Link from "next/link";
import iconSrc from "@/images/ubeyaz.png";
import Image from "next/image";
import ChatbotCard from "@/entities/chatbot/ui/ChatbotCard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";

export default function Chatbotlarim() {
    const [chatbots, setChatbots] = useState([]);
    const [categories, setCategories] = useState([]);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/auth/sessioncheck.php", { credentials: "include" });
                const result = JSON.parse(await res.text());
                if (result.authenticated) setUserId(result.user_id);
                else router.push("/login");
            } catch (err) {
                console.error("Session check error:", err);
                router.push("/login");
            }
        }
        checkSession();
    }, [router]);

    const fetchChatbots = () => {
        if (!userId) return;
        fetch(`/api/chatbot/getchatbotsmenu.php?id=${userId}`)
            .then(res => res.text())
            .then(dataText => {
                const data = JSON.parse(dataText);
                if (Array.isArray(data)) setChatbots(data);
            })
            .catch(err => console.error("Yükleme hatası:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchChatbots();
        fetch('/api/content/getcategories.php')
            .then(async res => {
                try {
                    const data = JSON.parse(await res.text());
                    if (Array.isArray(data)) setCategories(data);
                } catch (e) { console.error("JSON Parse Hatası!"); }
            })
            .catch(err => console.error("Fetch Hatası:", err));
    }, [userId]);

    const handleDelete = async (id) => {
        if (!confirm("Bu chatbot'u silmek istediğinize emin misiniz?")) return;
        const formData = new FormData();
        formData.append('id', id);
        try {
            const response = await fetch('/api/chatbot/deletechatbot.php', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) setChatbots(prev => prev.filter(bot => bot.id !== id));
            else alert("Hata: " + result.message);
        } catch (error) { console.error("Silme hatası:", error); }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-5 px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-10 w-44 rounded-xl" />
                </div>
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (chatbots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 blur-2xl" />
                    <Image src={iconSrc} alt="Logo" width={64} height={64} className="relative z-10 drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
                </div>

                <div className="flex flex-col gap-2 max-w-md">
                    <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                        Sohbet Botlarım
                    </h2>
                    <p className="text-white/55 text-[15px] leading-relaxed">
                        Hayalinizdeki sohbet botunu sadece{' '}
                        <span className="text-indigo-300 font-semibold">birkaç basit adımda</span>{' '}
                        hayata geçirin.
                    </p>
                    <p className="text-white/55 text-[15px] leading-relaxed">
                        Bilgi paylaşın, eğlendirin ya da iş süreçlerini kolaylaştırın —
                        <span className="text-indigo-300 font-semibold"> hepsi sizin elinizde!</span>
                    </p>
                </div>

                <Link
                    href="/dashboard/chatbots/create"
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-btn text-white font-display font-semibold text-[14px] shadow-glow hover:-translate-y-0.5 hover:brightness-110 transition-all duration-200"
                >
                    <Plus className="w-5 h-5" />
                    İlk Sohbet Botunuzu Oluşturun
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 px-6 py-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-display font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                    Chatbotlarım
                </h2>
                <Link
                    href="/dashboard/chatbots/create"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-btn text-white font-display font-semibold text-[13px] shadow-glow hover:-translate-y-0.5 hover:brightness-110 transition-all duration-200"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Chatbot Oluştur
                </Link>
            </div>

            {/* Grid */}
            <div className="flex flex-col gap-3">
                {chatbots.map((bot) => {
                    const targetCategory = categories.find(cat => String(cat.id) === String(bot.kategori_id));
                    const categoryLabel = targetCategory ? targetCategory.kategori_adi_tr : "Genel";
                    const isOwn = String(bot.author_user_id) === String(userId);
                    const isPurchased = !isOwn && String(bot.owner_user_id) === String(userId);
                    const statusLabel = isPurchased
                        ? 'Satın Alındı'
                        : bot.is_independent
                            ? 'Bağımsız'
                            : (bot.seller_status === 'active' ? 'Aktif' : 'Yayında Değil');

                    return (
                        <ChatbotCard
                            key={bot.id}
                            id={bot.id}
                            userId={userId}
                            authorUserId={bot.author_user_id}
                            ownerUserId={bot.owner_user_id}
                            isIndependent={!!Number(bot.is_independent)}
                            title={bot.isim}
                            image={bot.kapak_fotografi}
                            profileImage={bot.profil_fotografi}
                            category={categoryLabel}
                            status={statusLabel}
                            sellerStatus={bot.seller_status}
                            likes={bot.likes}
                            dislikes={bot.dislikes}
                            comments={bot.comments}
                            dialogs={bot.dialogs}
                            weeklyPrice={bot.ucret_haftalik}
                            monthlyPrice={bot.ucret_aylik}
                            onDelete={() => handleDelete(bot.id)}
                            onChanged={fetchChatbots}
                        />
                    );
                })}
            </div>
        </div>
    );
}
