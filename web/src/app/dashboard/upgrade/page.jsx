"use client";
import React, { useState, useEffect } from "react";
import { Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/hooks/use-toast";

// Başlangıç verileri (API'den gelmezse kullanılacak, İSİMLER VERİTABANIYLA AYNI OLMALI)
const initialPlanData = [
    {
        title: "Ücretsiz", monthly_price: "₺0", description: "LUMANORIS'in gücünü hiçbir ücret ödemeden keşfedin.",
        features: ["Günlük mesaj hakkı", "Temel chatbot oluşturma", "Pazaryerinde gezinme"],
        buttonText: "Mevcut Paket", buttonType: "default", badge: null
    },
    {
        title: "Gümüş", monthly_price: "₺149,00", description: "Daha fazla mesaj hakkı ve gelişmiş özelliklerle bir üst seviyeye taşıyın.",
        features: ["Artırılmış günlük mesaj hakkı", "Daha fazla chatbot oluşturma limiti", "Öncelikli destek"],
        buttonText: "Bu Paketi Seç", buttonType: "default", badge: null
    },
    {
        title: "Altın", monthly_price: "₺299,00", description: "Yoğun kullanıcılar için genişletilmiş limitler ve öncelikli destek.",
        features: ["Yüksek günlük mesaj hakkı", "Genişletilmiş chatbot limiti", "Öncelikli destek", "Gelişmiş istatistikler"],
        buttonText: "Bu Paketi Seç", buttonType: "primary", badge: "Önerilen"
    },
    {
        title: "Elmas", monthly_price: "₺599,00", description: "Sınırsız imkanlar ve VIP destekle maksimum verim alın.",
        features: ["Sınırsız mesaj hakkı", "Sınırsız chatbot oluşturma", "7/24 VIP destek", "Gelişmiş istatistikler"],
        buttonText: "Bu Paketi Seç", buttonType: "default", badge: null
    }
];

export default function PricingPlans() {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [plansData, setPlansData] = useState(initialPlanData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [upgrading, setUpgrading] = useState(null);
    const [upgradedPlan, setUpgradedPlan] = useState(null);

    useEffect(() => {
        fetch("/api/auth/sessioncheck.php", { credentials: "include" })
            .then((res) => res.json())
            .then((data) => { if (data.authenticated) setUserId(data.user_id); })
            .catch(() => {});
    }, []);

    // API'den verileri çekme
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch('/api/wallet/getpricing.php');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                if (data.success) {
                    setPlansData(data.all_plans || initialPlanData);
                } else {
                    throw new Error(data.message || "Veri alınamadı.");
                }
            } catch (err) {
                console.error("Fiyat planları yüklenirken hata oluştu:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    const handleChoosePlan = async (planTitle, index) => {
        if (!userId) {
            toast({ variant: "destructive", title: "Paket seçebilmek için giriş yapmalısınız." });
            return;
        }
        setSelectedPlan(index);
        setUpgrading(index);
        try {
            const formData = new FormData();
            formData.append('data', JSON.stringify({ user_id: userId, plan_name: planTitle }));
            const res = await fetch('/api/wallet/upgradeplan.php', { method: 'POST', body: formData });
            const result = await res.json();
            if (result.success) {
                setUpgradedPlan(planTitle);
            } else {
                toast({ variant: "destructive", title: result.message || "Paket seçimi başarısız oldu." });
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Sunucuyla bağlantı kurulamadı." });
        } finally {
            setUpgrading(null);
        }
    };

    // --- UI KISMI ---
    if (loading) {
        return (
            <div className="flex h-full w-full flex-col px-4 py-6 font-display text-white md:px-16">
                <div className="mb-10 flex items-center justify-between">
                    <h2 className="bg-gradient-to-br from-fuchsia-400 to-violet-400 bg-clip-text text-2xl font-semibold text-transparent md:text-4xl">Ödeme Planları</h2>
                </div>
                <p className="text-white/60">Planlar yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col px-4 py-6 font-display text-white md:px-16">
            <div className="mb-8">
                <span className="mb-1.5 block text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-fuchsia-400/70">
                    Planlar
                </span>
                <h2 className="bg-gradient-to-br from-fuchsia-400 to-violet-400 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                    Hesabını Yükselt
                </h2>
            </div>

            <div>
                {error && (
                    <p className="mb-4 text-center text-[13px] text-rose-400">
                        API Hatası: {error}. Başlangıç verileri kullanılıyor.
                    </p>
                )}
                {upgradedPlan && (
                    <p className="mb-4 text-center text-[13px] text-violet-400">
                        "{upgradedPlan}" paketi seçildi.
                    </p>
                )}

                <div className="grid grid-cols-1 gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-4">
                    {plansData.map((plan, index) => (
                        <div
                            key={index}
                            className={cn(
                                "group relative cursor-pointer overflow-hidden rounded-2xl border border-fuchsia-400/10 bg-gradient-to-br from-[#1a1030] via-[#150d28] to-[#0d0a1c] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-400/25 hover:shadow-[0_10px_32px_rgba(192,38,211,0.2)]",
                                selectedPlan === index && "-translate-y-2 border-fuchsia-400/50 shadow-[0_10px_36px_rgba(192,38,211,0.3)]",
                            )}
                        >
                            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-fuchsia-600/15 blur-[70px] transition-opacity duration-300 group-hover:opacity-150" />
                            <h3 className="relative mb-4 flex items-center justify-between text-xl font-medium text-white/80">
                                <div className="flex items-center gap-2.5">
                                    <Crown className="h-6 w-6 text-fuchsia-300" />
                                    {plan.title}
                                </div>
                                {plan.badge && (
                                    <Badge variant="default">{plan.badge}</Badge>
                                )}
                            </h3>
                            <p className="relative mb-3 text-2xl font-bold text-white">
                                {plan.monthly_price}
                                {plan.monthly_price !== "₺0" && <span className="ml-1 text-xs font-normal text-white/50">/Aylık</span>}
                            </p>
                            <p className="relative mb-4 text-sm leading-relaxed text-white/75">{plan.description}</p>
                            <Button
                                disabled={plan.title === "Ücretsiz" || upgrading === index}
                                onClick={() => handleChoosePlan(plan.title, index)}
                                variant={plan.buttonType === "primary" ? "default" : plan.title === "Ücretsiz" ? "secondary" : "outline"}
                                className="relative h-auto mb-6 w-full rounded-lg py-3 text-xs"
                            >
                                {upgrading === index ? "İşleniyor..." : plan.buttonText}
                            </Button>
                            <span className="relative mb-4 block text-sm text-white/75">
                                Neler Dahil
                            </span>
                            <ul className="relative flex flex-col gap-2.5 text-[13px] text-white">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 shrink-0 text-violet-400" /> {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
