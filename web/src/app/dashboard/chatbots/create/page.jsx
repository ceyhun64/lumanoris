'use client';

import { useEffect, useState } from "react";
import ChatbotForm from "@/features/chatbot-mgmt/ChatbotForm";
import SellerOnboardingWizard from "@/features/seller/SellerOnboardingWizard";
import BuyProducerAccountModal from "@/features/purchasing/BuyProducerAccountModal";
import useSellerStatus from "@/shared/hooks/useSellerStatus";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Lock, Globe2, Sparkles, ArrowRight, Crown } from "lucide-react";
import { PageLayout, PageHeader } from "@/shared/ui/page-layout";

export default function CreateChatbot() {
    // İlk adım gizli, direkt form göster
    const [bot, setBot] = useState(null); //düzenlenecek bot
    // null: henüz URL'den okunmadı (create/edit ayrımı belli değil), -1: yeni
    // bot oluşturuluyor, başka bir değer: düzenlenen botun id'si.
    const [botId, setBotId] = useState(null);
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

    const [sessionChecked, setSessionChecked] = useState(false);

    useEffect(() => {
                    async function checkSession() {
                        try {
                            const res = await fetch("/api/auth/sessioncheck.php", {
                            credentials: "include", // cookie'yi gönder
                            });
                            const resultText = await res.text();
                            const result = JSON.parse(resultText);

                            if (result.authenticated) {
                            setUserId(result.user_id);
                            } else {
                            // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
                            }
                        } catch (err) {
                            console.error("Session check error:", err);
                            // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
                        } finally {
                            setSessionChecked(true);
                        }
                    }
                    checkSession();
                }, [router]);

    // URL'deki ?id= parametresini oturumdan bağımsız olarak hemen okuyoruz —
    // giriş yapılmamış bir ziyaretçi bile "yeni bot oluştur" formunu (botId=-1)
    // görebilmeli; bunu userId'ye bağlamak botId'yi sonsuza dek başlangıç
    // değerinde (0) kilitleyip formun hiç görünmemesine sebep oluyordu.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id") || -1;
        setBotId(id);
    }, []);

    useEffect(() => {
        if (!userId) return;
        if (botId && botId !== -1) {
            fetch(`/api/chatbot/getchatbot.php?id=${botId}&user_id=${userId}`)
            .then(res => res.text())
            .then(async (tdata) => {
                let data = JSON.parse(tdata);
                // getchatbot.php returns {chatbot, comments} — ChatbotForm
                // reads bot.chatbot.* throughout, so `bot` here must stay the
                // whole wrapped response, not just the unwrapped chatbot.
                const botData = Array.isArray(data) ? data[0] : data;
                if(botData)
                {
                    setBot(botData);
                }
            })
            .catch(err => console.error("Bot fetch error:", err));
        }

    }, [userId, botId]);

    if (botId === null || (botId !== -1 && !bot)) {
        return (
            <PageLayout className="gap-5">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
            </PageLayout>
        );
    }

    if (sessionChecked && !userId) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
                <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
                    Bot oluşturmak için giriş yapın
                </h2>
                <p className="max-w-md text-[15px] leading-relaxed text-white/55">
                    Yeni bir sohbet botu oluşturabilmek için önce hesabınıza giriş yapmanız gerekiyor.
                </p>
                <Button onClick={() => router.push('/login')} className="h-auto px-6 py-3 text-[14px]">
                    Giriş Yap
                </Button>
            </div>
        );
    }

    return <CreateChatbotInner userId={userId} bot={bot} botId={botId} selectedCard={selectedCard} />;
}

function CreateChatbotInner({ userId, bot, botId, selectedCard }) {
    const seller = useSellerStatus(userId);
    const isEditing = !!bot;
    // Düzenleme modunda seçim ekranı gösterilmez; bağımsız mı pazaryeri mi
    // olduğu, var olan botun is_independent alanından alınır.
    const [choice, setChoice] = useState(isEditing ? (bot.chatbot?.is_independent ? 'independent' : 'public') : null);
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
        return (
            <PageLayout className="gap-5">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
            </PageLayout>
        );
    }

    // Yeni bot oluşturuluyor ve henüz seçim yapılmadıysa: iki seçenekli ekran.
    if (!isEditing && choice === null) {
        const canBuyPlan = (!limits.can_create_independent || !limits.can_create_public) && planActive === false;

        return (
            <PageLayout>
                <PageHeader
                    eyebrow="Oluştur"
                    title="Yeni Bir Chatbot Yarat"
                    description="Yapay zeka botunu birkaç adımda hayata geçir; önce erişimini nasıl kısıtlayacağına karar ver, gerisini birlikte tamamlayalım."
                />

                <div className="grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
                    <button
                        type="button"
                        disabled={!limits.can_create_independent}
                        onClick={() => setChoice('independent')}
                        className={cn(
                            "group relative w-full text-left",
                            !limits.can_create_independent && "cursor-not-allowed",
                        )}
                    >
                        <Card
                            interactive={limits.can_create_independent}
                            className={cn(
                                "relative h-full overflow-hidden p-6",
                                !limits.can_create_independent && "opacity-50",
                            )}
                        >
                            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/[0.08] blur-[70px] transition-opacity duration-300 group-hover:opacity-150" />
                            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-violet-500/10">
                                <Lock className="h-5 w-5 text-violet-300" />
                            </div>
                            <h3 className="relative mb-1.5 mt-4 font-display text-lg font-bold text-white">
                                Kayıt Olmadan Devam Et
                            </h3>
                            <p className="relative text-[13.5px] leading-relaxed text-white/60">
                                Oluşturduğun chatbot yalnızca sana özel kalır. İstediğin zaman herkese açık olarak yayınlayabilirsin.
                            </p>
                            {!limits.can_create_independent ? (
                                <Badge variant="destructive" className="relative mt-4">
                                    Hakkınız Doldu ({limits.independent_limit})
                                </Badge>
                            ) : (
                                <span className="relative mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-violet-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    Bu seçimle devam et <ArrowRight className="h-3.5 w-3.5" />
                                </span>
                            )}
                        </Card>
                    </button>

                    <button
                        type="button"
                        disabled={!limits.can_create_public}
                        onClick={() => setChoice('public')}
                        className={cn(
                            "group relative w-full text-left",
                            !limits.can_create_public && "cursor-not-allowed",
                        )}
                    >
                        <Card
                            interactive={limits.can_create_public}
                            className={cn(
                                "relative h-full overflow-hidden p-6",
                                !limits.can_create_public && "opacity-50",
                            )}
                        >
                            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-500/[0.08] blur-[70px] transition-opacity duration-300 group-hover:opacity-150" />
                            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/25 to-fuchsia-500/10">
                                <Globe2 className="h-5 w-5 text-fuchsia-300" />
                            </div>
                            <h3 className="relative mb-1.5 mt-4 font-display text-lg font-bold text-white">
                                Herkese Açık Yayınla
                            </h3>
                            <p className="relative text-[13.5px] leading-relaxed text-white/60">
                                Chatbotun pazaryerinde yayınlanır, herkes tarafından erişilebilir hale gelir ve gelir elde etmeye başlarsın.
                            </p>
                            {!limits.can_create_public ? (
                                <Badge variant="destructive" className="relative mt-4">
                                    Hakkınız Doldu ({limits.public_limit})
                                </Badge>
                            ) : (
                                <span className="relative mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    Bu seçimle devam et <ArrowRight className="h-3.5 w-3.5" />
                                </span>
                            )}
                        </Card>
                    </button>
                </div>

                {canBuyPlan && (
                    <div className="relative mt-6 w-full max-w-3xl overflow-hidden rounded-2xl border border-fuchsia-400/15 bg-gradient-to-br from-[#1a1030] via-[#150d28] to-[#0d0a1c] p-6 shadow-[0_8px_28px_rgba(139,0,180,0.18)]">
                        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-fuchsia-600/[0.10] blur-[90px]" />
                        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/25 to-violet-500/15">
                                    <Crown className="h-6 w-6 text-fuchsia-300" />
                                </div>
                                <div>
                                    <h4 className="font-display text-base font-bold text-white">Üretici Hesabı Satın Al</h4>
                                    <p className="mt-0.5 text-[13px] text-white/60">750₺ karşılığında 5 herkese açık + 2 bağımsız chatbot hakkı kazan.</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setShowBuyPlan(true)}
                                className="h-auto w-full shrink-0 px-5 py-3 text-[13px] sm:w-auto"
                            >
                                Şimdi Satın Al
                            </Button>
                        </div>
                    </div>
                )}

                <BuyProducerAccountModal
                    isOpen={showBuyPlan}
                    onClose={() => setShowBuyPlan(false)}
                    userId={userId}
                    onPurchased={() => { setPlanActive(true); fetchLimits(); }}
                />
            </PageLayout>
        );
    }

    const independentMode = choice === 'independent';

    // Sadece "herkese açık" seçimi (veya pazaryerinde olan bir botu düzenleme)
    // pazaryeri satıcı kaydını gerektirir.
    if (!independentMode && !seller.loading && seller.status !== "active") {
        return (
            <PageLayout>
                <PageHeader
                    eyebrow="Pazaryeri"
                    title="Satıcı Kaydı Gerekli"
                    description="Chatbotunu pazaryerinde yayınlayabilmen için önce kısa bir satıcı kaydı tamamlaman gerekiyor."
                />
                <SellerOnboardingWizard
                    userId={userId}
                    initialStatus={seller}
                    onComplete={() => seller.refetch()}
                />
            </PageLayout>
        );
    }

    if (!independentMode && seller.loading) {
        return (
            <PageLayout className="gap-5">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <PageHeader
                eyebrow="Oluştur"
                title={bot ? "Chatbotunu Düzenle" : "Yeni Chatbot Oluştur"}
                description={bot ? "Görselleri, davranışını ve fiyatlandırmasını güncelle." : "Kimliğini, davranışını ve (varsa) fiyatlandırmasını belirleyerek yayına hazırla."}
            />
            {bot
                ? <ChatbotForm selectedCard={selectedCard} bot={bot} botId={botId} userId={userId} independentMode={independentMode} />
                : <ChatbotForm selectedCard={selectedCard} userId={userId} independentMode={independentMode} />}
        </PageLayout>
    );
}
