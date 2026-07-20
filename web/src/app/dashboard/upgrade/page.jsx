"use client";
import React, { useState, useEffect } from "react";
import { Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/hooks/use-toast";
import { PageLayout, PageHeader } from "@/shared/ui/page-layout";

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
            <PageLayout className="font-display">
                <PageHeader eyebrow="Planlar" title="Hesabını Yükselt" />
                <p className="text-white/60">Planlar yükleniyor...</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout className="font-display">
            <PageHeader eyebrow="Planlar" title="Hesabını Yükselt" />

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
                    {plansData.map((plan, index) => {
                        const isFeatured = !!plan.badge;
                        return (
                        <div
                            key={index}
                            className={cn(
                                "group relative cursor-pointer overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1",
                                isFeatured
                                    ? "border border-fuchsia-400/15 bg-gradient-to-br from-[#1a1030] via-[#150d28] to-[#0d0a1c] hover:border-fuchsia-400/30 hover:shadow-[0_10px_32px_rgba(192,38,211,0.16)]"
                                    : "border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]",
                                selectedPlan === index && "-translate-y-2 border-fuchsia-400/40 shadow-[0_10px_32px_rgba(192,38,211,0.16)]",
                            )}
                        >
                            {isFeatured && (
                                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-fuchsia-600/[0.10] blur-[80px] transition-opacity duration-300 group-hover:opacity-150" />
                            )}
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
                        );
                    })}
                </div>
            </div>
        </PageLayout>
    );
}
