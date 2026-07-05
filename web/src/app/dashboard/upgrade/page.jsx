"use client";
import React, { useState, useEffect } from "react";
import { Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
            alert("Paket seçebilmek için giriş yapmalısınız.");
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
                alert(result.message || "Paket seçimi başarısız oldu.");
            }
        } catch (err) {
            alert("Sunucuyla bağlantı kurulamadı.");
        } finally {
            setUpgrading(null);
        }
    };

    // --- UI KISMI ---
    if (loading) {
        return (
            <div className="flex h-full w-full flex-col px-4 py-6 font-display text-white md:px-16">
                <div className="mb-10 flex items-center justify-between">
                    <h2 className="bg-gradient-to-br from-indigo-400 to-cyan-400 bg-clip-text text-2xl font-semibold text-transparent md:text-4xl">Ödeme Planları</h2>
                </div>
                <p className="text-white/60">Planlar yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full w-full flex-col px-4 py-6 font-display text-white md:px-16">
                <div className="mb-10 flex items-center justify-between">
                    <h2 className="bg-gradient-to-br from-indigo-400 to-cyan-400 bg-clip-text text-2xl font-semibold text-transparent md:text-4xl">Ödeme Planları</h2>
                </div>
                <p className="text-rose-400">API Hatası: {error}. Başlangıç verileri kullanılıyor.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col px-4 py-6 font-display text-white md:px-16">
            <div className="mb-10 flex items-center justify-between">
                <h2 className="bg-gradient-to-br from-indigo-400 to-cyan-400 bg-clip-text text-2xl font-semibold text-transparent md:text-4xl">
                    Hesabını Yükselt
                </h2>
            </div>

            <div>
                {upgradedPlan && (
                    <p className="mb-4 text-center text-[13px] text-cyan-400">
                        "{upgradedPlan}" paketi seçildi.
                    </p>
                )}

                <div className="grid grid-cols-1 gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-4">
                    {plansData.map((plan, index) => (
                        <div
                            key={index}
                            className={cn(
                                "relative cursor-pointer rounded-2xl border border-white/[0.13] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(162,89,255,0.2)]",
                                "bg-[radial-gradient(circle_at_top_right,#3d1c7c_0%,#111014_70%)]",
                                selectedPlan === index && "-translate-y-2 border-2 border-violet-400 shadow-[0_0_30px_rgba(162,89,255,0.35)]",
                            )}
                        >
                            <h3 className="mb-4 flex items-center justify-between text-xl font-medium text-white/80">
                                <div className="flex items-center gap-2.5">
                                    <Crown className="h-6 w-6 text-violet-400" />
                                    {plan.title}
                                </div>
                                {plan.badge && (
                                    <span className="rounded-md border border-white/5 bg-[#1c1c1c] px-2.5 py-1 text-xs font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                                        {plan.badge}
                                    </span>
                                )}
                            </h3>
                            <p className="mb-3 text-2xl font-bold text-white">
                                {plan.monthly_price}
                                {plan.monthly_price !== "₺0" && <span className="ml-1 text-xs font-normal text-white/50">/Aylık</span>}
                            </p>
                            <p className="mb-4 text-sm leading-relaxed text-white/75">{plan.description}</p>
                            <button
                                disabled={plan.title === "Ücretsiz" || upgrading === index}
                                onClick={() => handleChoosePlan(plan.title, index)}
                                className={cn(
                                    "mb-6 w-full rounded-lg py-3 text-xs font-semibold transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60",
                                    plan.buttonType === "primary"
                                        ? "bg-violet-500 text-white hover:bg-violet-600"
                                        : "border border-white/5 bg-[#1c1c1c] text-white hover:bg-[#333]",
                                )}
                            >
                                {upgrading === index ? "İşleniyor..." : plan.buttonText}
                            </button>
                            <span className="mb-4 block text-sm text-white/75">
                                Neler Dahil
                            </span>
                            <ul className="flex flex-col gap-2.5 text-[13px] text-white">
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
