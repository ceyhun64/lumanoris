'use client';

import { useEffect, useState } from "react";
import ChatbotForm from "@/features/chatbot-mgmt/ChatbotForm";
import SellerOnboardingWizard from "@/features/seller/SellerOnboardingWizard";
import BuyProducerAccountModal from "@/features/purchasing/BuyProducerAccountModal";
import useSellerStatus from "@/shared/hooks/useSellerStatus";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function CreateChatbot() {
    // İlk adım gizli, direkt form göster
    const [bot, setBot] = useState(null); //düzenlenecek bot
    const [botId, setBotId] = useState(0);
    const router = useRouter();
    const [userId, setUserId] = useState(null);
    const [selectedCard, setSelectedCard] = useState({
            title: "YÖNLENDİRME BOTU",
            desc: "Talimat Vererek Bir Bot Oluştur.",
            icon: (
                <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 8.5125V7.5625C20 5.6765 20 4.7345 19.414 4.1485C18.828 3.5625 17.886 3.5625 16 3.5625H8C6.114 3.5625 5.172 3.5625 4.586 4.1485C4 4.7345 4 5.6765 4 7.5625V8.5125" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path opacity="0.5" d="M12 3.5625V21.5625" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 21.5625H17" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
        ),
        bgColor: "#9BC8FF"
    });

    useEffect(() => {
                    async function checkSession() {
                        try {
                            const res = await fetch("/api/auth/sessioncheck.php", {
                            credentials: "include", // cookie'yi gönder
                            });
                            const resultText = await res.text();
                            console.log(resultText);
                            const result = JSON.parse(resultText);
            
                            if (result.authenticated) {
                            setUserId(result.user_id);
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

    useEffect(() => {
        if (!userId) return;
        const params = new URLSearchParams(window.location.search);
        let botId = params.get("id") || -1;
        setBotId(botId);
        if(botId !== -1)
        {
            fetch(`/api/chatbot/getchatbot.php?id=${botId}&user_id=${userId}`)
            .then(res => res.text())
            .then(async (tdata) => {
                let data = JSON.parse(tdata);
                const botData = Array.isArray(data) ? data[0] : data;
                if(botData)
                {
                    setBot(botData);
                    console.log("Bot geldi!");
                }
            })
            .catch(err => console.error("Bot fetch error:", err));
        }

    }, [userId]);

    if (botId !== -1 && !bot) {
        return <div className="px-4 py-6 text-white/60 md:px-16">Bot bilgileri yükleniyor...</div>;
    }

    return <CreateChatbotInner userId={userId} bot={bot} botId={botId} selectedCard={selectedCard} />;
}

function CreateChatbotInner({ userId, bot, botId, selectedCard }) {
    const seller = useSellerStatus(userId);
    const isEditing = !!bot;
    // Düzenleme modunda seçim ekranı gösterilmez; bağımsız mı pazaryeri mi
    // olduğu, var olan botun is_independent alanından alınır.
    const [choice, setChoice] = useState(isEditing ? (bot.is_independent ? 'independent' : 'public') : null);
    const [limits, setLimits] = useState(null);
    const [planActive, setPlanActive] = useState(null);
    const [showBuyPlan, setShowBuyPlan] = useState(false);

    const fetchLimits = () => {
        if (!userId) return;
        fetch(`/api/chatbot/getchatbotlimits.php?user_id=${userId}`)
            .then(res => res.json())
            .then(data => { if (data.success) setLimits(data); })
            .catch(err => console.error("Limit bilgisi alınamadı:", err));
    };

    useEffect(() => {
        if (isEditing || !userId) return;
        fetchLimits();
        fetch(`/api/marketplace/getproducerplanstatus.php?user_id=${userId}`)
            .then(res => res.json())
            .then(data => { if (data.success) setPlanActive(!!data.active); })
            .catch(err => console.error("Plan durumu alınamadı:", err));
    }, [isEditing, userId]);

    if (!userId || (!isEditing && !limits)) {
        return <div className="flex h-full w-full flex-col px-4 py-6 text-white md:px-16"><p className="text-white/60">Yükleniyor...</p></div>;
    }

    // Yeni bot oluşturuluyor ve henüz seçim yapılmadıysa: iki seçenekli ekran.
    if (!isEditing && choice === null) {
        return (
            <div className="flex h-full w-full flex-col px-4 py-6 text-white md:px-16">
                <div className="mb-10 flex items-center justify-between">
                    <h2 className="bg-gradient-to-br from-indigo-400 to-cyan-400 bg-clip-text font-display text-2xl font-semibold text-transparent md:text-4xl">
                        Oluştur
                    </h2>
                </div>
                <div className="flex max-w-[560px] flex-col gap-4">
                    <button
                        type="button"
                        disabled={!limits.can_create_independent}
                        onClick={() => setChoice('independent')}
                        className={cn(
                            "rounded-2xl border border-white/10 bg-luma-elevated p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/25",
                            limits.can_create_independent ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                        )}
                    >
                        <h3 className="mb-1.5 font-display text-base font-semibold text-white">Pazaryeri Sistemine Kayıt Olmadan Devam Et</h3>
                        <p className="text-[13px] text-white/70">
                            Bu seçeneği seçtiğinizde oluşturduğunuz chatbot yalnızca sizin erişiminize açık olacaktır.
                            Chatbotunuzu daha sonra istediğiniz zaman herkese açık olarak yayınlayabilirsiniz.
                        </p>
                        {!limits.can_create_independent && (
                            <p className="mt-2 text-xs text-pink-400">
                                Ücretsiz bağımsız chatbot hakkınızı ({limits.independent_limit}) kullandınız.
                            </p>
                        )}
                    </button>

                    {(!limits.can_create_independent || !limits.can_create_public) && planActive === false && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowBuyPlan(true); }}
                            className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 p-3.5 text-center font-semibold text-white shadow-glow transition-transform duration-200 hover:scale-[1.02]"
                        >
                            750₺ ile Üretici Hesabı Satın Al (5 herkese açık + 2 bağımsız chatbot hakkı)
                        </button>
                    )}

                    <button
                        type="button"
                        disabled={!limits.can_create_public}
                        onClick={() => setChoice('public')}
                        className={cn(
                            "rounded-2xl border border-white/10 bg-luma-elevated p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/25",
                            limits.can_create_public ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                        )}
                    >
                        <h3 className="mb-1.5 font-display text-base font-semibold text-white">Herkese Açık Yayınlamak İstiyorum</h3>
                        <p className="text-[13px] text-white/70">
                            Bu seçeneği seçtiğinizde chatbotunuz pazaryerinde yayınlanır, herkes tarafından erişilebilir
                            hale gelir ve gelir elde etmeye başlayabilirsiniz.
                        </p>
                        {!limits.can_create_public && (
                            <p className="mt-2 text-xs text-pink-400">
                                Ücretsiz herkese açık chatbot hakkınızı ({limits.public_limit}) kullandınız.
                            </p>
                        )}
                    </button>
                </div>

                <BuyProducerAccountModal
                    isOpen={showBuyPlan}
                    onClose={() => setShowBuyPlan(false)}
                    userId={userId}
                    onPurchased={() => { setPlanActive(true); fetchLimits(); }}
                />
            </div>
        );
    }

    const independentMode = choice === 'independent';

    // Sadece "herkese açık" seçimi (veya pazaryerinde olan bir botu düzenleme)
    // pazaryeri satıcı kaydını gerektirir.
    if (!independentMode && !seller.loading && seller.status !== "active") {
        return (
            <div className="flex h-full w-full flex-col px-4 py-6 text-white md:px-16">
                <div className="mb-10 flex items-center justify-between">
                    <h2 className="bg-gradient-to-br from-indigo-400 to-cyan-400 bg-clip-text font-display text-2xl font-semibold text-transparent md:text-4xl">
                        Satıcı Kaydı Gerekli
                    </h2>
                </div>
                <SellerOnboardingWizard
                    userId={userId}
                    initialStatus={seller}
                    onComplete={() => seller.refetch()}
                />
            </div>
        );
    }

    if (!independentMode && seller.loading) {
        return <div className="flex h-full w-full flex-col px-4 py-6 text-white md:px-16"><p className="text-white/60">Yükleniyor...</p></div>;
    }

    return (
        <div className="flex h-full w-full flex-col px-4 py-6 text-white md:px-16">
            <div className="mb-10 flex items-center justify-between">
                <h2 className="bg-gradient-to-br from-indigo-400 to-cyan-400 bg-clip-text font-display text-2xl font-semibold text-transparent md:text-4xl">
                    Oluştur
                </h2>
            </div>
            {bot
                ? <ChatbotForm selectedCard={selectedCard} bot={bot} botId={botId} userId={userId} independentMode={independentMode} />
                : <ChatbotForm selectedCard={selectedCard} userId={userId} independentMode={independentMode} />}
        </div>
    );
}
