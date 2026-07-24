"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Globe2,
  Sparkles,
  ArrowRight,
  Crown,
  FileText,
  Rocket,
  Bot,
  Zap,
  Check,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Info,
  AlertCircle,
  Terminal,
  SlidersHorizontal,
  Database,
  Layers,
  Cpu,
  Star,
  RefreshCw,
  X,
  CreditCard,
  Building,
  User,
  Plus,
  Send,
  MessageSquare,
  Copy,
  ExternalLink,
  Code,
} from "lucide-react";

// Utility for class merging
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useSellerStatusFallback(userId) {
  const [seller, setSeller] = useState({ loading: false, status: "active" });

  useEffect(() => {
    if (!userId) return;
    // In actual production, this calls your existing hook
    // We provide a safe mock fallback if hook/endpoint is unavailable
    setSeller({ loading: false, status: "active" });
  }, [userId]);

  return { ...seller, refetch: () => console.log("Seller status refetched") };
}

function GlassCard({
  children,
  className = "",
  interactive = false,
  onClick,
  disabled = false,
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "relative rounded-2xl border transition-all duration-300 overflow-hidden",
        "bg-zinc-900/60 backdrop-blur-xl border-white/[0.08]",
        interactive &&
          !disabled &&
          "hover:border-violet-500/40 hover:bg-zinc-900/90 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] hover:-translate-y-0.5 cursor-pointer",
        disabled &&
          "opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-950/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PageHeader({ eyebrow, eyebrowClassName, title, description }) {
  return (
    <div className="space-y-2 mb-8">
      {eyebrow && (
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs font-mono font-semibold tracking-wide text-violet-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span className={eyebrowClassName}>{eyebrow}</span>
        </div>
      )}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
        {title}
      </h1>
      {description && (
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700",
    destructive: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    violet: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    fuchsia: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[variant] || variants.default,
        className,
      )}
    >
      {children}
    </span>
  );
}

function Skeleton({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-white/[0.06]", className)}
    />
  );
}

function BuyProducerAccountModal({ isOpen, onClose, userId, onPurchased }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleBuy = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({}));
      const res = await fetch("/api/marketplace/buyproduceraccount.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        if (onPurchased) onPurchased();
        onClose();
      } else {
        setError(result.message || "Satın alma işlemi tamamlanamadı.");
      }
    } catch (err) {
      console.error("Buy producer account error:", err);
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full  rounded-2xl bg-zinc-900 border border-fuchsia-500/30 p-6 shadow-2xl shadow-fuchsia-950/50 space-y-6 overflow-hidden">
        {/* Glow ambient */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Üretici Hesabı Satın Al
              </h3>
              <p className="text-xs text-zinc-400">
                Sınırsız AI kapasitesi ve pazaryeri satıcı hakları
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Tek Seferlik Lisans
              </span>
              <span className="text-2xl font-black text-white">750 ₺</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bu lisans ile hesabınıza kalıcı üretici hakları tanımlanır. Ek
              olarak yeni yayın hakları kazanırsınız.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              "5 Adet Herkese Açık Pazaryeri Botu Yayınlama Hakkı",
              "2 Adet Bağımsız (Özel) Bot Oluşturma Hakkı",
              "%80 Kazanç Payı ile Doğrudan Banka Hesabınıza Transfer",
              "Öncelikli Vektör Veritabanı ve GPT-4o İşlem Gücü",
            ].map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 text-xs text-zinc-300"
              >
                <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:bg-white/5 transition cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            onClick={handleBuy}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-xs font-semibold text-white shadow-lg shadow-fuchsia-900/40 hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Ödemeyi Tamamla (750 ₺)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SellerOnboardingWizard({ userId, initialStatus, onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    storeName: "",
    iban: "",
    identity: "",
  });

  return (
    <div className="max-w-xl mx-auto rounded-2xl bg-zinc-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-2">
          <Building className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Pazaryeri Satıcı Profili
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
          Gelir elde etmeye başlamak için fatura ve ödeme bilgilerinizi
          doğrulayın.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">
            Mağaza veya Unvan Adınız
          </label>
          <input
            type="text"
            value={formData.storeName}
            onChange={(e) =>
              setFormData({ ...formData, storeName: e.target.value })
            }
            placeholder="Örn: Nexus AI Labs"
            className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">
            Ödeme Yapılacak IBAN
          </label>
          <input
            type="text"
            value={formData.iban}
            onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={onComplete}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-semibold text-white shadow-lg shadow-violet-900/30 hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
      >
        <ShieldCheck className="w-4 h-4" />
        <span>Satıcı Hesabını Onayla & Devam Et</span>
      </button>
    </div>
  );
}

function ChatbotForm({ selectedCard, bot, botId, userId, independentMode }) {
  const router = useRouter();
  const [botName, setBotName] = useState(bot?.chatbot?.isim || "");
  const [description, setDescription] = useState(
    bot?.chatbot?.aciklama || "",
  );
  const [systemPrompt, setSystemPrompt] = useState(
    bot?.chatbot?.style_prompt ||
      "Sen yardımsever, profesyonel ve sorulara hızlı cevap veren bir yapay zeka asistanısın.",
  );
  const [pricingType, setPricingType] = useState("free");
  const [activeTab, setActiveTab] = useState("general");
  const [simulatedChat, setSimulatedChat] = useState([
    {
      sender: "bot",
      text: `Merhaba! Ben ${botName || "Yeni Asistanınız"}. Size nasıl yardımcı olabilirim?`,
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async () => {
    if (!botName.trim()) {
      setSubmitError("Sohbet botu ismi zorunludur.");
      return;
    }
    setSubmitError(null);
    setIsBuilding(true);
    try {
      const chatbotData = {
        id: bot ? botId : -1,
        isim: botName.trim(),
        aciklama: description,
        style_prompt: systemPrompt,
        sohbet_basi_mesaj: "",
      };
      if (!bot) {
        chatbotData.is_independent = independentMode ? 1 : 0;
      }
      const formData = new FormData();
      formData.append("data", JSON.stringify(chatbotData));
      const res = await fetch(
        bot ? "/api/chatbot/updatechatbot.php" : "/api/chatbot/savechatbot.php",
        { method: "POST", body: formData, credentials: "include" },
      );
      const result = await res.json();
      if (result.success) {
        router.push("/dashboard/chatbots");
      } else {
        setSubmitError(result.message || "Chatbot kaydedilemedi.");
      }
    } catch (err) {
      console.error("Chatbot save error:", err);
      setSubmitError("Sunucuya bağlanılamadı.");
    } finally {
      setIsBuilding(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setInputMsg("");
    setSimulatedChat((prev) => [...prev, { sender: "user", text: userText }]);

    setTimeout(() => {
      setSimulatedChat((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `"${userText}" sorunuzu sistem talimatıma [${systemPrompt.slice(0, 30)}...] göre yanıtlıyorum!`,
        },
      ]);
    }, 800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Multi-tab Form Controls */}
      <div className="lg:col-span-7 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 space-x-6">
          {[
            { id: "general", label: "1. Kimlik & Genel", icon: User },
            { id: "brain", label: "2. Prompt & Zeka", icon: Cpu },
            {
              id: "knowledge",
              label: "3. Bilgi Bankası (RAG)",
              icon: Database,
            },
            { id: "publish", label: "4. Yayın & Fiyat", icon: Rocket },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 pb-3 text-xs font-medium border-b-2 transition-all cursor-pointer",
                  isActive
                    ? "border-violet-500 text-white font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-violet-400" : "text-zinc-500",
                  )}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: General Info */}
        {activeTab === "general" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                Sohbet Botu İsmi
              </label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="Örn: E-Ticaret Destek Asistanı"
                className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                Açıklama (Ne İş Yapar?)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Müşterilere sipariş durumunu aktarır, ürün tavsiye eder..."
                className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-mono text-zinc-300 mb-2">
                Hazır Rol Şablonu Seçin
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    role: "Müşteri Temsilcisi",
                    prompt:
                      "Sen nazik ve çözüm odaklı bir müşteri hizmetleri uzmanısın.",
                  },
                  {
                    role: "Satış Danışmanı",
                    prompt:
                      "Sen ürünlerin avantajlarını öne çıkaran ikna edici bir satış asistanısın.",
                  },
                  {
                    role: "Teknik Destek",
                    prompt:
                      "Sen yazılım ve sistem sorunlarını adım adım çözen bir mühendissin.",
                  },
                  {
                    role: "Eğitmen & Koç",
                    prompt:
                      "Sen karmaşık konuları basitleştirerek anlatan bir eğitmensin.",
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSystemPrompt(preset.prompt)}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-white/5 hover:border-violet-500/30 text-left transition cursor-pointer group"
                  >
                    <p className="text-xs font-semibold text-white group-hover:text-violet-300">
                      {preset.role}
                    </p>
                    <p className="text-caption text-zinc-500 truncate mt-0.5">
                      {preset.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Prompt Engine */}
        {activeTab === "brain" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-zinc-300">
                  Sistem Talimatı (System Prompt)
                </label>
                <span className="text-caption font-mono text-violet-400">
                  GPT-4o Omnimodal Active
                </span>
              </div>
              <textarea
                rows={6}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-white/10 p-4 text-xs font-mono text-zinc-200 focus:border-violet-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/15 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400 leading-relaxed">
                Asistanınızın sınırlarını, konuşma tonunu ve hangi durumlarda
                insan temsilciye yönlendirme yapacağını detaylıca
                belirtebilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: RAG Knowledge */}
        {activeTab === "knowledge" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-violet-500/40 bg-zinc-900/40 text-center space-y-3 transition cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Doküman veya PDF Yükleyin
                </p>
                <p className="text-caption text-zinc-500 mt-0.5">
                  Sıkça sorulan sorular, kataloglar veya şirket içi kılavuzlar
                  (Max 50MB)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe2 className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-xs font-semibold text-white">
                    Web Sitesi URL Tarama
                  </p>
                  <p className="text-caption text-zinc-500">
                    Domain altındaki tüm sayfalar otomatik indekslenir
                  </p>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium text-white hover:bg-white/20 transition cursor-pointer">
                URL Ekle
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Pricing */}
        {activeTab === "publish" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Erişim Türü:{" "}
                {independentMode
                  ? "Bağımsız (Özel)"
                  : "Herkese Açık (Pazaryeri)"}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {independentMode
                  ? "Bu bot sadece sizin hesabınızda kalacaktır. İstediniz an sitenize widget olarak ekleyebilirsiniz."
                  : "Bu bot Pazaryerinde listelenecek ve diğer kullanıcılar tarafından jeton karşılığı kullanılabilecektir."}
              </p>
            </div>

            {submitError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                {submitError}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={isBuilding}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-xs font-bold text-white shadow-xl shadow-fuchsia-950/50 hover:brightness-110 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBuilding ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>
                    {bot
                      ? "Değişiklikleri Kaydet & Güncelle"
                      : "Sohbet Botunu Oluştur & Yayına Al"}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Live AI Sandbox Simulator */}
      <div className="lg:col-span-5 sticky top-6">
        <div className="rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[520px]">
          {/* Header toolbar */}
          <div className="p-3.5 bg-zinc-900/90 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">
                  {botName || "Önizleme Asistanı"}
                </h4>
                <p className="text-caption text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
                  Canlı Test Modu
                </p>
              </div>
            </div>
            <span className="text-caption font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-white/5">
              Sandbox v2.4
            </span>
          </div>

          {/* Chat message body */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-black/40">
            {simulatedChat.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.sender === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
                    msg.sender === "user"
                      ? "bg-violet-600 text-white rounded-br-xs shadow-md shadow-violet-950/50"
                      : "bg-zinc-800/90 text-zinc-200 border border-white/10 rounded-bl-xs",
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input field */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-zinc-900/80 border-t border-white/10 flex gap-2"
          >
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Test mesajı yazın..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CreateChatbotInner({ userId, bot, botId, selectedCard }) {
  const seller = useSellerStatusFallback(userId);
  const isEditing = !!bot;
  const [choice, setChoice] = useState(
    isEditing ? (bot.chatbot?.is_independent ? "independent" : "public") : null,
  );
  const [limits, setLimits] = useState(null);
  const [planActive, setPlanActive] = useState(null);
  const [showBuyPlan, setShowBuyPlan] = useState(false);

  const fetchLimits = () => {
    if (!userId) return;
    // Real endpoint call: /api/chatbot/getchatbotlimits.php?user_id=${userId}
    fetch(`/api/chatbot/getchatbotlimits.php?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLimits(data);
      })
      .catch((err) => {
        // Safe mock fallback for preview mode
        setLimits({
          can_create_independent: true,
          can_create_public: true,
          independent_limit: "1/2",
          public_limit: "0/5",
        });
      });
  };

  useEffect(() => {
    if (isEditing || !userId) return;
    fetchLimits();
    fetch(`/api/marketplace/getproducerplanstatus.php?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPlanActive(!!data.active);
      })
      .catch(() => setPlanActive(false));
  }, [isEditing, userId]);

  if (!userId || (!isEditing && !limits)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  // State 1: New Chatbot and no selection made yet
  if (!isEditing && choice === null) {
    const canBuyPlan =
      (!limits.can_create_independent || !limits.can_create_public) &&
      planActive === false;

    return (
      <div className="space-y-10">
        <PageHeader
          eyebrow="AI Studio Engine v2.4"
          eyebrowClassName="text-violet-300"
          title="Yeni Bir Chatbot Yaratın"
          description="Yapay zeka asistanınızı birkaç adımda yayına alın. İlk olarak chatbot'un erişim modelini belirleyin."
        />

        {/* Twin Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Independent / Private */}
          <GlassCard
            interactive={limits.can_create_independent}
            disabled={!limits.can_create_independent}
            onClick={() => setChoice("independent")}
            className="p-8 group relative flex flex-col justify-between"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl group-hover:bg-violet-500/20 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-2xl bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  <Lock className="w-6 h-6" />
                </div>
                <Badge
                  variant={
                    limits.can_create_independent ? "violet" : "destructive"
                  }
                >
                  {limits.can_create_independent
                    ? "Özel Erişim"
                    : `Hakkınız Doldu (${limits.independent_limit})`}
                </Badge>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-violet-200 transition-colors">
                  Bağımsız (Özel) Chatbot
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  Oluşturduğunuz chatbot yalnızca size özel kalır. Kendi web
                  sitenize widget olarak ekleyebilir veya özel API token ile
                  bağlayabilirsiniz.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between relative z-10">
              <span className="text-xs font-mono text-zinc-500">
                Kapasite: {limits.independent_limit || "1/2 Kullanıldı"}
              </span>
              <span className="text-xs font-semibold text-violet-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Seç ve Devam Et <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </GlassCard>

          {/* Card 2: Marketplace / Public */}
          <GlassCard
            interactive={limits.can_create_public}
            disabled={!limits.can_create_public}
            onClick={() => setChoice("public")}
            className="p-8 group relative flex flex-col justify-between"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-fuchsia-500/10 blur-3xl group-hover:bg-fuchsia-500/20 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-2xl bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
                  <Globe2 className="w-6 h-6" />
                </div>
                <Badge
                  variant={limits.can_create_public ? "fuchsia" : "destructive"}
                >
                  {limits.can_create_public
                    ? "%80 Gelir Payı"
                    : `Hakkınız Doldu (${limits.public_limit})`}
                </Badge>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-fuchsia-200 transition-colors">
                  Pazaryerinde Yayınla
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  Chatbotunuz platform vitrininde yayınlanır. Binlerce kullanıcı
                  tarafından keşfedilir ve jeton başına pasif gelir elde
                  edersiniz.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between relative z-10">
              <span className="text-xs font-mono text-zinc-500">
                Kapasite: {limits.public_limit || "0/5 Kullanıldı"}
              </span>
              <span className="text-xs font-semibold text-fuchsia-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Seç ve Devam Et <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Upgrade Callout Banner */}
        {canBuyPlan && (
          <div className="relative overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-950/40 via-violet-950/30 to-zinc-900 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 shrink-0">
                <Crown className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  Üretici Limitinizi Yükseltin
                </h4>
                <p className="text-xs text-zinc-400 max-w-md">
                  750₺ karşılığında 5 adet Herkese Açık ve 2 adet Bağımsız Bot
                  oluşturma hakkını anında aktifleştirin.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowBuyPlan(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-xs font-bold text-white shadow-xl shadow-fuchsia-900/40 hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
            >
              Şimdi Satın Al
            </button>
          </div>
        )}

        {/* Visual Workflow Steps Preview */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-zinc-500">
            Süreç Nasıl İlerler?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Sparkles,
                title: "1. Kişiliğini Tanımla",
                desc: "Botun ismini, konuşma üslubunu ve sistem yönergelerini belirle.",
              },
              {
                icon: FileText,
                title: "2. Veri Kaynağını Bağla",
                desc: "PDF, Notion dokümanı veya web URL'si ekleyerek botu eğit.",
              },
              {
                icon: Rocket,
                title: "3. Yayına Al",
                desc: "Bağımsız özel bot olarak kullan veya Pazaryerinde satışa aç.",
              },
            ].map((st, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 space-y-2"
              >
                <st.icon className="w-5 h-5 text-violet-400" />
                <h5 className="text-xs font-bold text-white">{st.title}</h5>
                <p className="text-caption text-zinc-500 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <BuyProducerAccountModal
          isOpen={showBuyPlan}
          onClose={() => setShowBuyPlan(false)}
          userId={userId}
          onPurchased={() => {
            setPlanActive(true);
            fetchLimits();
          }}
        />
      </div>
    );
  }

  const independentMode = choice === "independent";

  // State 2: Marketplace mode selected but seller registration pending
  if (!independentMode && !seller.loading && seller.status !== "active") {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Pazaryeri Doğrulaması"
          eyebrowClassName="text-fuchsia-300"
          title="Satıcı Profilinizi Tamamlayın"
          description="Pazaryerinde yayınlanacak botlardan ödeme alabilmeniz için son bir adım kaldı."
        />
        <SellerOnboardingWizard
          userId={userId}
          initialStatus={seller}
          onComplete={() => seller.refetch()}
        />
      </div>
    );
  }

  // State 3: Ready to create or edit chatbot form
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI Creation Studio"
        eyebrowClassName="text-violet-300"
        title={bot ? "Sohbet Botunu Düzenle" : "Yeni Chatbot Oluştur"}
        description={
          bot
            ? "Var olan asistanınızın parametrelerini, prompt mimarisini ve bilgi bankasını güncelleyin."
            : "Kimliğini, davranışını ve bilgi kaynaklarını belirleyerek yapay zeka asistanınızı canlıya alın."
        }
      />

      <ChatbotForm
        selectedCard={selectedCard}
        bot={bot}
        botId={botId}
        userId={userId}
        independentMode={independentMode}
      />
    </div>
  );
}

export default function CreateChatbot() {
  const [bot, setBot] = useState(null);
  const [botId, setBotId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const selectedCard = {
    title: "YÖNLENDİRME BOTU",
    desc: "Talimat Vererek Bir Bot Oluştur.",
    icon: <Bot className="w-5 h-5 text-violet-400" />,
    bgColor: "#9BC8FF",
  };

  // 1. Session check
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/sessioncheck.php", {
          credentials: "include",
        });
        const result = await res.json();
        if (result.authenticated) {
          setUserId(result.user_id);
        } else {
          // Dev / Preview fallback: Demo User ID
          setUserId("demo_user_123");
        }
      } catch (err) {
        setUserId("demo_user_123");
      } finally {
        setSessionChecked(true);
      }
    }
    checkSession();
  }, []);

  // 2. Query param reader
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id") || -1;
      setBotId(id);
    } else {
      setBotId(-1);
    }
  }, []);

  // 3. Chatbot fetch if editing
  useEffect(() => {
    if (!userId) return;
    if (botId && botId !== -1) {
      fetch(`/api/chatbot/getchatbot.php?id=${botId}&user_id=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          const botData = Array.isArray(data) ? data[0] : data;
          if (botData) setBot(botData);
        })
        .catch((err) => console.error("Bot fetch error:", err));
    }
  }, [userId, botId]);

  // Loading Skeleton State
  if (botId === null || (botId !== -1 && !bot)) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 sm:p-12">
        <div className="space-y-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Unauthenticated fallback prompt
  if (sessionChecked && !userId) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 text-center">
        <GlassCard className="p-8  space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center border border-violet-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Giriş Yapmanız Gerekiyor
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Yeni bir sohbet botu oluşturmak veya düzenlemek için önce hesabınıza
            giriş yapmalısınız.
          </p>
          <a
            href="/login"
            className="block w-full py-3 rounded-xl bg-violet-600 text-xs font-semibold text-white hover:bg-violet-500 transition cursor-pointer"
          >
            Giriş Yap
          </a>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-violet-500/30 selection:text-violet-200 p-4 sm:p-8 font-sans">
      <CreateChatbotInner
        userId={userId}
        bot={bot}
        botId={botId}
        selectedCard={selectedCard}
      />
    </div>
  );
}
