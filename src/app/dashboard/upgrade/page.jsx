"use client";
import React, { useState, useEffect } from "react";

// Başlangıç verileri (API'den gelmezse kullanılacak, İSİMLER VERİTABANIYLA AYNI OLMALI)
const initialPlanData = [
    // ... (Başlangıç verileriniz kopyalanacak) ...
    {
        title: "Ücretsiz", monthly_price: "₺0", yearly_price: null, description: "LUMANORIS'in gücünü hiçbir ücret ödemeden keşfedin...",
        features: ["Basic workflow automation", "AI-powered personal assistant", "Standard analytics & reporting", "Email & chat support", "Up to 3 AI integrations"],
        buttonText: "Choose this plan", buttonType: "default", badge: null
    },
    {
        title: "Standart", monthly_price: "₺1750", yearly_price: null, description: "Gelişmiş araçlar ve daha fazla kaynakla projelerinizi bir üst seviyeye taşıyın.",
        features: ["Advanced workflow automation", "AI-driven sales & marketing tools", "Enhanced data analytics & insights", "Priority customer support", "Up to 10 AI integrations"],
        buttonText: "Choose this plan", buttonType: "primary", badge: "Popular"
    },
    {
        title: "Profesyonel", monthly_price: "Özel Plan", yearly_price: null, description: "Sınırsız imkanlar ve öncelikli destekle yapay zeka çözümlerinizde maksimum verim alın.",
        features: ["Fully customizable AI automation", "Dedicated AI business consultant", "Enterprise-grade compliance", "24/7 VIP support", "Unlimited AI integrations"],
        buttonText: "Schedule a call", buttonType: "default", badge: null
    },
    {
        title: "Bronze Plan", monthly_price: null, yearly_price: "₺15.000", description: "Yıllık temel ihtiyaçlar için ekonomik yapay zeka çözümü.",
        features: ["Basic automation", "5 AI integrations", "Email support"],
        buttonText: "Choose Bronze", buttonType: "default", badge: null
    },
    {
        title: "Silver Plan", monthly_price: null, yearly_price: "₺35.000", description: "Orta ölçekli projeler için ideal yıllık plan.",
        features: ["Advanced automation", "15 AI integrations", "Priority support", "Team access"],
        buttonText: "Choose Silver", buttonType: "primary", badge: "Önerilen"
    },
    {
        title: "Gold Plan", monthly_price: null, yearly_price: "₺75.000", description: "Kurumsal düzeyde sınırsız erişim ve destek.",
        features: ["Unlimited automation", "Unlimited integrations", "24/7 VIP support", "Dedicated consultant"],
        buttonText: "Contact sales", buttonType: "default", badge: null
    }
];


export default function PricingPlans() {

    const [isYearly, setIsYearly] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [plansData, setPlansData] = useState(initialPlanData); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // API'den verileri çekme
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch('/api/getpricing.php'); 
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
    
    // **FILTRELEME KALDIRILDI: Tüm kartlar gösterilecek.**
    const plansToRender = plansData.map(plan => {
    let priceToShow = "";
    let periodText = "";

    if (isYearly && plan.yearly_price) {
        priceToShow = plan.yearly_price;
        periodText = "/Yıllık";
    } else if (!isYearly && plan.monthly_price) {
        priceToShow = plan.monthly_price;
        periodText = !plan.monthly_price.includes("Plan") ? "/Aylık" : "";
    } else {
        // Fiyat yoksa fallback mesajı
        priceToShow = "Fiyat için iletişime geçin";
        periodText = "";
    }

    return {
        ...plan,
        price: priceToShow,
        periodText: periodText,
    };
});

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
                <h2>Ödeme Planları</h2>
            </div>

            <div className="pricing-container">
                <div className="pricing-toggle">
                    <span className={!isYearly ? "active" : ""}>Aylık</span>
                    <div
                        className="toggle-switch"
                        onClick={() => setIsYearly(!isYearly)}
                        style={{
                            background: isYearly ? '#ff66c4' : '#6c47ff'  // 🎨 dinamik renk geçişi
                        }}
                    >
                        <div
                            className="circle"
                            style={{ transform: isYearly ? "translateX(26px)" : "translateX(2px)" }}
                        ></div>
                    </div>
                    <span className={isYearly ? "active" : ""}>Yıllık</span>
                </div>


                <div className="plan-grid">
                    {plansToRender.map((plan, index) => (
                        <div
                            className={`plan-card ${plan.badge ? "popular" : ""} ${selectedPlan === index ? "active" : ""}`}
                            key={index}
                            onClick={() => setSelectedPlan(index)}
                        >
                            <h3>
                                <div className="left">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" fillRule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" /><path fill="currentColor" d="M8.084 2.6c.162-.365.523-.6.923-.6h7.977c.75 0 1.239.79.903 1.462L15.618 8h3.358c.9 0 1.35 1.088.714 1.724L7.737 21.677c-.754.754-2.01-.022-1.672-1.033L8.613 13H5.015a1.01 1.01 0 0 1-.923-1.42z" /></g></svg>
                                    {plan.title}
                                </div>
                                {plan.badge && <span className="badge">{plan.badge}</span>}
                            </h3>
                            <p className="plan-price">{plan.price}{plan.periodText}</p>
                            <p className="plan-description">{plan.description}</p>
                            <button
                                className={plan.buttonType === "primary" ? "plan-button" : "schedule-button"}
                            >
                                {plan.buttonText}
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