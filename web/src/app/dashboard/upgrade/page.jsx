"use client";
import React, { useState, useEffect, useContext } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { UserContext } from "@/shared/contexts/UserContext";
import PricingPageHeader from "./components/PricingPageHeader";
import PricingLoadingState from "./components/PricingLoadingState";
import BillingCycleToggle from "./components/BillingCycleToggle";
import PricingCard from "./components/PricingCard";
import EnterpriseContactFooter from "./components/EnterpriseContactFooter";
import StatusBanner from "./components/StatusBanner";

const initialPlanData = [
  {
    title: "Ücretsiz",
    monthly_price: "₺0",
    description: "LUMANORIS'in gücünü hiçbir ücret ödemeden keşfedin.",
    features: [
      "Günlük Lumacoin",
      "Temel chatbot oluşturma",
      "Pazaryerinde gezinme",
    ],
    buttonText: "Mevcut Paket",
    buttonType: "secondary",
    badge: null,
  },
  {
    title: "Gümüş",
    monthly_price: "₺149,00",
    description:
      "Daha fazla Lumacoin ve gelişmiş özelliklerle bir üst seviyeye taşıyın.",
    features: [
      "Artırılmış günlük Lumacoin",
      "Daha fazla chatbot oluşturma limiti",
      "Öncelikli destek",
    ],
    buttonText: "Bu Paketi Seç",
    buttonType: "default",
    badge: null,
  },
  {
    title: "Altın",
    monthly_price: "₺299,00",
    description:
      "Yoğun kullanıcılar için genişletilmiş limitler ve öncelikli destek.",
    features: [
      "Yüksek günlük Lumacoin",
      "Genişletilmiş chatbot limiti",
      "Öncelikli destek",
      "Gelişmiş istatistikler",
    ],
    buttonText: "Bu Paketi Seç",
    buttonType: "primary",
    badge: "Önerilen",
  },
  {
    title: "Elmas",
    monthly_price: "₺599,00",
    description: "Sınırsız imkanlar ve VIP destekle maksimum verim alın.",
    features: [
      "Sınırsız Lumacoin",
      "Sınırsız chatbot oluşturma",
      "7/24 VIP destek",
      "Gelişmiş istatistikler",
    ],
    buttonText: "Bu Paketi Seç",
    buttonType: "default",
    badge: null,
  },
];

export default function PricingPlans() {
  const { userId } = useContext(UserContext);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plansData, setPlansData] = useState(initialPlanData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upgrading, setUpgrading] = useState(null);
  const [upgradedPlan, setUpgradedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [salesContactSending, setSalesContactSending] = useState(false);
  const [salesContactSent, setSalesContactSent] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/api/wallet/getpricing.php");
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
      toast.warning("Paket seçebilmek için giriş yapmalısınız.");
      return;
    }
    setSelectedPlan(index);
    setUpgrading(index);
    try {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({ user_id: userId, plan_name: planTitle }),
      );
      const res = await fetch("/api/wallet/upgradeplan.php", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setUpgradedPlan(planTitle);
      } else {
        toast.error(result.message || "Paket seçimi başarısız oldu.");
      }
    } catch (err) {
      toast.error("Sunucuyla bağlantı kurulamadı.");
    } finally {
      setUpgrading(null);
    }
  };

  const handleContactSales = async () => {
    setSalesContactSending(true);
    try {
      const formData = new FormData();
      formData.append("fullName", "Kurumsal Satış Talebi");
      formData.append("email", "");
      formData.append("subject", "Kurumsal Satış Görüşmesi Talebi");
      formData.append(
        "message",
        userId
          ? `Kullanıcı (ID: ${userId}) kurumsal satış ekibiyle görüşme talep etti.`
          : "Bir kullanıcı kurumsal satış ekibiyle görüşme talep etti.",
      );
      const res = await fetch("/api/contact/contact.php", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setSalesContactSent(true);
        setTimeout(() => setSalesContactSent(false), 4000);
      } else {
        toast.error(result.message || "Talep gönderilemedi.");
      }
    } catch (err) {
      toast.error("Sunucuyla bağlantı kurulamadı.");
    } finally {
      setSalesContactSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-violet-500 selection:text-white px-4 sm:px-6 lg:px-8 py-12 lg:py-20 font-display">
        <div>
          <PricingPageHeader
            eyebrow="Planlar ve Fiyatlandırma"
            title="Hesabını Yükselt"
          />
          <PricingLoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-violet-500 selection:text-white px-4 sm:px-6 lg:px-8 py-12 lg:py-20 font-display">
      <div>
        <PricingPageHeader
          eyebrow="Esnek Fiyatlandırma"
          title="Geleceğin Yapay Zeka Altyapısı"
        />

        <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />

        <div>
          {error && (
            <StatusBanner variant="error">
              API Hatası: {error}. Güvenli modda varsayılan planlar
              gösterilmektedir.
            </StatusBanner>
          )}
          {upgradedPlan && (
            <StatusBanner variant="success">
              Tebrikler! "{upgradedPlan}" paketi başarıyla etkinleştirildi.
            </StatusBanner>
          )}

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 pt-4">
            {plansData.map((plan, index) => (
              <PricingCard
                key={index}
                plan={plan}
                isSelected={selectedPlan === index}
                isUpgrading={upgrading === index}
                billingCycle={billingCycle}
                onChoose={() => handleChoosePlan(plan.title, index)}
              />
            ))}
          </div>

          <EnterpriseContactFooter
            sending={salesContactSending}
            sent={salesContactSent}
            onContact={handleContactSales}
          />
        </div>
      </div>
    </div>
  );
}
