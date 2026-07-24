"use client";
import React, { useState, useEffect } from "react";
import {
  Crown,
  Check,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const Button = ({
  children,
  className,
  variant = "default",
  disabled,
  onClick,
  ...props
}) => {
  const baseStyles =
    "relative inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    default:
      "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-violet-400/30",
    primary:
      "bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white shadow-[0_0_30px_rgba(192,38,211,0.4)] border border-fuchsia-400/40",
    secondary:
      "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50",
    outline:
      "bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-200 border border-zinc-700/60 hover:border-zinc-500",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variants[variant] || variants.default,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = "default", className }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
        variant === "default"
          ? "bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(192,38,211,0.15)]"
          : "bg-zinc-800 text-zinc-300",
        className,
      )}
    >
      {children}
    </span>
  );
};

const PageLayout = ({ children, className }) => (
  <div
    className={cn(
      "min-h-screen bg-[#09090b] text-zinc-100 selection:bg-violet-500 selection:text-white px-4 sm:px-6 lg:px-8 py-12 lg:py-20",
      className,
    )}
  >
    <div>{children}</div>
  </div>
);

const PageHeader = ({ eyebrow, title }) => (
  <div className="text-center max-w-3xl mx-auto mb-16 relative">
    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
    {eyebrow && (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-4 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        {eyebrow}
      </div>
    )}
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
      {title}
    </h1>
    <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
      Yapay zeka asistanlarınızı ve iş akışlarınızı ölçeklendirmek için en uygun
      planı seçin. İstediğiniz zaman yükseltin veya iptal edin.
    </p>
  </div>
);

const toast = ({ title, variant }) => {
  // Fallback toast notification render or console alert
  console.log(`[Toast ${variant || "info"}]: ${title}`);
};

const initialPlanData = [
  {
    title: "Ücretsiz",
    monthly_price: "₺0",
    description: "LUMANORIS'in gücünü hiçbir ücret ödemeden keşfedin.",
    features: [
      "Günlük mesaj hakkı",
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
      "Daha fazla mesaj hakkı ve gelişmiş özelliklerle bir üst seviyeye taşıyın.",
    features: [
      "Artırılmış günlük mesaj hakkı",
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
      "Yüksek günlük mesaj hakkı",
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
      "Sınırsız mesaj hakkı",
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
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plansData, setPlansData] = useState(initialPlanData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [upgrading, setUpgrading] = useState(null);
  const [upgradedPlan, setUpgradedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [salesContactSending, setSalesContactSending] = useState(false);
  const [salesContactSent, setSalesContactSent] = useState(false);

  useEffect(() => {
    fetch("/api/auth/sessioncheck.php", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUserId(data.user_id);
      })
      .catch(() => {});
  }, []);

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
      toast({
        variant: "destructive",
        title: "Paket seçebilmek için giriş yapmalısınız.",
      });
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
        toast({
          variant: "destructive",
          title: result.message || "Paket seçimi başarısız oldu.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Sunucuyla bağlantı kurulamadı.",
      });
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
        toast({
          variant: "destructive",
          title: result.message || "Talep gönderilemedi.",
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Sunucuyla bağlantı kurulamadı." });
    } finally {
      setSalesContactSending(false);
    }
  };

  if (loading) {
    return (
      <PageLayout className="font-display">
        <PageHeader
          eyebrow="Planlar ve Fiyatlandırma"
          title="Hesabını Yükselt"
        />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm animate-pulse">
            Planlar yükleniyor, lütfen bekleyin...
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="font-display">
      <PageHeader
        eyebrow="Esnek Fiyatlandırma"
        title="Geleceğin Yapay Zeka Altyapısı"
      />

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center p-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-xl">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300",
              billingCycle === "monthly"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/30"
                : "text-zinc-400 hover:text-white",
            )}
          >
            Aylık Faturalandırma
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-1.5",
              billingCycle === "annual"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/30"
                : "text-zinc-400 hover:text-white",
            )}
          >
            <span>Yıllık Faturalandırma</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-caption font-bold border border-emerald-500/30">
              %20 İndirim
            </span>
          </button>
        </div>
      </div>

      <div>
        {error && (
          <div className="max-w-xl mx-auto mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center text-xs backdrop-blur-md">
            API Hatası: {error}. Güvenli modda varsayılan planlar
            gösterilmektedir.
          </div>
        )}
        {upgradedPlan && (
          <div className="max-w-xl mx-auto mb-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-center text-xs backdrop-blur-md flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>
              Tebrikler! "{upgradedPlan}" paketi başarıyla etkinleştirildi.
            </span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 pt-4">
          {plansData.map((plan, index) => {
            const isFeatured = !!plan.badge;
            const isSelected = selectedPlan === index;

            return (
              <div
                key={index}
                className={cn(
                  "group relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-500 backdrop-blur-2xl",
                  isFeatured
                    ? "bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border-2 border-fuchsia-500/40 shadow-[0_0_50px_rgba(192,38,211,0.15)] hover:border-fuchsia-400/70 hover:shadow-[0_0_70px_rgba(192,38,211,0.25)] -translate-y-2"
                    : "bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/70 hover:-translate-y-1 shadow-xl",
                  isSelected && "ring-2 ring-violet-500 border-transparent",
                )}
              >
                {/* Ambient Glow for Featured Card */}
                {isFeatured && (
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-fuchsia-600/20 rounded-full blur-[70px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100" />
                )}

                <div>
                  {/* Header & Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                      <Crown
                        className={cn(
                          "w-6 h-6",
                          isFeatured ? "text-fuchsia-400" : "text-violet-400",
                        )}
                      />
                    </div>
                    {plan.badge && (
                      <Badge variant="default">{plan.badge}</Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                    {plan.title}
                  </h3>

                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6 min-h-[40px]">
                    {plan.description}
                  </p>

                  {/* Pricing */}
                  <div className="mb-6 pb-6 border-b border-zinc-800/80 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white tracking-tight">
                      {plan.monthly_price}
                    </span>
                    {plan.monthly_price !== "₺0" && (
                      <span className="text-xs text-zinc-400 font-medium">
                        /
                        {billingCycle === "annual" ? "Yıllık (Aylık)" : "Aylık"}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {/* Action Button */}
                  <Button
                    disabled={plan.title === "Ücretsiz" || upgrading === index}
                    onClick={() => handleChoosePlan(plan.title, index)}
                    variant={
                      plan.buttonType === "primary"
                        ? "primary"
                        : plan.title === "Ücretsiz"
                          ? "secondary"
                          : "outline"
                    }
                    className="w-full rounded-xl py-3.5 text-xs font-semibold tracking-wide mb-8 group/btn"
                  >
                    <span>
                      {upgrading === index ? "İşleniyor..." : plan.buttonText}
                    </span>
                    {plan.title !== "Ücretsiz" && upgrading !== index && (
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    )}
                  </Button>

                  {/* Features List */}
                  <div className="space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Neler Dahil?
                    </div>
                    <ul className="flex flex-col gap-3">
                      {plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-xs sm:text-sm text-zinc-300"
                        >
                          <div className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-violet-400" />
                          </div>
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise Trust Footer */}
        <div className="mt-20 p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-base">
                Özel Kurumsal İhtiyaçlarınız mı var?
              </h4>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Özel entegrasyonlar, SLA güvenceleri ve size özel fiyatlandırma
                için ekibimizle iletişime geçin.
              </p>
            </div>
          </div>
          <button
            onClick={handleContactSales}
            disabled={salesContactSending || salesContactSent}
            className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all border border-zinc-700/60 shrink-0 disabled:opacity-70"
          >
            {salesContactSent
              ? "Talebiniz Alındı ✓"
              : salesContactSending
                ? "Gönderiliyor..."
                : "Kurumsal Satışla Görüş"}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
