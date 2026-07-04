'use client';

import { useEffect, useState } from "react";
import ChatbotForm from "@/features/chatbot-mgmt/ChatbotForm";
import SellerOnboardingWizard from "@/features/seller/SellerOnboardingWizard";
import BuyProducerAccountModal from "@/features/purchasing/BuyProducerAccountModal";
import useSellerStatus from "@/shared/hooks/useSellerStatus";
import { useRouter } from "next/navigation";

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
        return <div>Bot bilgileri yükleniyor...</div>;
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
        return <div className="chatbot-create-wrapper"><p>Yükleniyor...</p></div>;
    }

    // Yeni bot oluşturuluyor ve henüz seçim yapılmadıysa: iki seçenekli ekran.
    if (!isEditing && choice === null) {
        return (
            <div className="chatbot-create-wrapper">
                <div className="chatbot-create-header">
                    <h2>Oluştur</h2>
                </div>
                <div className="create-choice-screen" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
                    <button
                        type="button"
                        disabled={!limits.can_create_independent}
                        onClick={() => setChoice('independent')}
                        style={{
                            textAlign: 'left', padding: '20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)',
                            background: '#16151c', color: '#fff', cursor: limits.can_create_independent ? 'pointer' : 'not-allowed',
                            opacity: limits.can_create_independent ? 1 : 0.5,
                        }}
                    >
                        <h3 style={{ marginBottom: 6 }}>Pazaryeri Sistemine Kayıt Olmadan Devam Et</h3>
                        <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>
                            Bu seçeneği seçtiğinizde oluşturduğunuz chatbot yalnızca sizin erişiminize açık olacaktır.
                            Chatbotunuzu daha sonra istediğiniz zaman herkese açık olarak yayınlayabilirsiniz.
                        </p>
                        {!limits.can_create_independent && (
                            <p style={{ fontSize: 12, color: '#FF66C4', marginTop: 8 }}>
                                Ücretsiz bağımsız chatbot hakkınızı ({limits.independent_limit}) kullandınız.
                            </p>
                        )}
                    </button>

                    {(!limits.can_create_independent || !limits.can_create_public) && planActive === false && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowBuyPlan(true); }}
                            style={{
                                textAlign: 'center', padding: '14px', borderRadius: 14, border: 'none',
                                background: 'linear-gradient(90deg,#8B5CF6,#D946EF)', color: '#fff', cursor: 'pointer', fontWeight: 600,
                            }}
                        >
                            750₺ ile Üretici Hesabı Satın Al (5 herkese açık + 2 bağımsız chatbot hakkı)
                        </button>
                    )}

                    <button
                        type="button"
                        disabled={!limits.can_create_public}
                        onClick={() => setChoice('public')}
                        style={{
                            textAlign: 'left', padding: '20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)',
                            background: '#16151c', color: '#fff', cursor: limits.can_create_public ? 'pointer' : 'not-allowed',
                            opacity: limits.can_create_public ? 1 : 0.5,
                        }}
                    >
                        <h3 style={{ marginBottom: 6 }}>Herkese Açık Yayınlamak İstiyorum</h3>
                        <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>
                            Bu seçeneği seçtiğinizde chatbotunuz pazaryerinde yayınlanır, herkes tarafından erişilebilir
                            hale gelir ve gelir elde etmeye başlayabilirsiniz.
                        </p>
                        {!limits.can_create_public && (
                            <p style={{ fontSize: 12, color: '#FF66C4', marginTop: 8 }}>
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
            <div className="chatbot-create-wrapper">
                <div className="chatbot-create-header">
                    <h2>Satıcı Kaydı Gerekli</h2>
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
        return <div className="chatbot-create-wrapper"><p>Yükleniyor...</p></div>;
    }

    return (
        <div className="chatbot-create-wrapper">
            <div className="chatbot-create-header">
                <h2>Oluştur</h2>
            </div>
            {bot
                ? <ChatbotForm selectedCard={selectedCard} bot={bot} botId={botId} userId={userId} independentMode={independentMode} />
                : <ChatbotForm selectedCard={selectedCard} userId={userId} independentMode={independentMode} />}
        </div>
    );
}
