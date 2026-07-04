"use client";
import React, { useState, useEffect } from "react";

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
            <div className="pricing-wrapper">
                <div className="pricing-header"><h2>Ödeme Planları</h2></div>
                <p>Planlar yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pricing-wrapper">
                <div className="pricing-header"><h2>Ödeme Planları</h2></div>
                <p style={{ color: 'red' }}>API Hatası: {error}. Başlangıç verileri kullanılıyor.</p>
            </div>
        );
    }

    return (
        <div className="pricing-wrapper">
            <div className="pricing-header">
                <h2>Hesabını Yükselt</h2>
            </div>

            <div className="pricing-container">
                {upgradedPlan && (
                    <p style={{ textAlign: 'center', color: '#22D3EE', marginBottom: 16, fontSize: 13 }}>
                        "{upgradedPlan}" paketi seçildi.
                    </p>
                )}

                <div className="plan-grid">
                    {plansData.map((plan, index) => (
                        <div
                            className={`plan-card ${plan.badge ? "popular" : ""} ${selectedPlan === index ? "active" : ""}`}
                            key={index}
                        >
                            <h3>
                                <div className="left">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" fillRule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" /><path fill="currentColor" d="M8.084 2.6c.162-.365.523-.6.923-.6h7.977c.75 0 1.239.79.903 1.462L15.618 8h3.358c.9 0 1.35 1.088.714 1.724L7.737 21.677c-.754.754-2.01-.022-1.672-1.033L8.613 13H5.015a1.01 1.01 0 0 1-.923-1.42z" /></g></svg>
                                    {plan.title}
                                </div>
                                {plan.badge && <span className="badge">{plan.badge}</span>}
                            </h3>
                            <p className="plan-price">{plan.monthly_price}{plan.monthly_price !== "₺0" ? "/Aylık" : ""}</p>
                            <p className="plan-description">{plan.description}</p>
                            <button
                                className={plan.buttonType === "primary" ? "plan-button" : "schedule-button"}
                                disabled={plan.title === "Ücretsiz" || upgrading === index}
                                onClick={() => handleChoosePlan(plan.title, index)}
                            >
                                {upgrading === index ? "İşleniyor..." : plan.buttonText}
                            </button>
                            <span className="plan-description">
                                Neler Dahil
                            </span>
                            <ul className="plan-features">
                                {plan.features.map((feature, i) => (
                                    <li key={i}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m2.75 8.75l3.5 3.5l7-7.5" /></svg> {feature}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
