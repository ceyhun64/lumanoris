"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Bot,
  Lock,
  Mail,
  Phone,
  Calendar,
  X,
  Cpu,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPolicyOpen, setPolicyOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null); // "terms" | "privacy"
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    eposta: "",
    dogum_tarihi: "",
    telefon: "",
    sifre: "",
    kullanici_adi: "",
  });

  const showToast = (title, variant = "success", description = "") => {
    setToastMessage({ title, variant, description });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append(
        "data",
        JSON.stringify({
          action: "google_login",
          google_token:
            credentialResponse?.credential || "simulated_google_token",
        }),
      );
      const res = await fetch("/api/auth/login-google.php", {
        method: "POST",
        body: dataToSend,
      });
      const resultText = await res.text();
      const result = JSON.parse(resultText);
      if (result.success) {
        showToast(result.message || "Google girişi başarılı!");
        window.location.href = "/dashboard";
      } else {
        showToast(result.message || "Google girişi başarısız.", "destructive");
      }
    } catch (err) {
      console.error("Google login error:", err);
      showToast(
        "Google girişi başarısız.",
        "destructive",
        "Sunucuya bağlanılamadı. Lütfen tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "telefon") {
      const onlyNums = value.replace(/[^\d]/g, "");
      let formatted = "";
      if (onlyNums.length <= 4) formatted = onlyNums;
      else if (onlyNums.length <= 7)
        formatted = `${onlyNums.slice(0, 4)} ${onlyNums.slice(4)}`;
      else if (onlyNums.length <= 9)
        formatted = `${onlyNums.slice(0, 4)} ${onlyNums.slice(4, 7)} ${onlyNums.slice(7)}`;
      else
        formatted = `${onlyNums.slice(0, 4)} ${onlyNums.slice(4, 7)} ${onlyNums.slice(7, 9)} ${onlyNums.slice(9, 11)}`;
      setFormData((prev) => ({ ...prev, [name]: formatted.trim() }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        kullanici_adi:
          name === "eposta" ? value.split("@")[0] : prev.kullanici_adi,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = new FormData();
      dataToSend.append("data", JSON.stringify(formData));

      const res = await fetch("/api/auth/register.php", {
        method: "POST",
        body: dataToSend,
      });

      const resultText = await res.text();
      const result = JSON.parse(resultText);

      if (result.success) {
        showToast(
          "Kayıt başarılı!",
          "success",
          "Giriş sayfasına yönlendiriliyorsunuz.",
        );
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        showToast(
          "Hata",
          "destructive",
          result.message || "Kayıt sırasında bir hata oluştu.",
        );
      }
    } catch (err) {
      console.error("Kayıt hatası:", err);
      showToast(
        "Hata",
        "destructive",
        "Sunucuya bağlanılamadı. Lütfen tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/sessioncheck.php", {
          credentials: "include",
        });
        const resultText = await res.text();
        const result = JSON.parse(resultText);
        if (result.authenticated) {
          window.location.href = "/dashboard";
        }
      } catch (err) {
        console.error("Session check note:", err);
      }
    }
    checkSession();
  }, []);

  const openPolicy = (type) => {
    setActivePolicy(type);
    setPolicyOpen(true);
  };

  const closePolicy = () => {
    setPolicyOpen(false);
    setActivePolicy(null);
  };

  const inputCls =
    "w-full bg-[#0A0B10]/80 border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-body text-white placeholder-white/35 outline-none transition-all duration-300 focus:border-fuchsia-500/50 focus:bg-[#0E0F16] focus:ring-4 focus:ring-fuchsia-500/10 hover:border-white/20 font-sans";

  return (
    <div className="min-h-screen bg-[#09090F] text-white flex selection:bg-fuchsia-500/30 selection:text-fuchsia-200 overflow-x-hidden font-sans relative">
      {/* Toast Notification Widget */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-2xl border text-xs font-medium shadow-2xl backdrop-blur-xl animate-bounce flex items-center gap-3 max-w-sm ${
            toastMessage.variant === "destructive"
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-200"
          }`}
        >
          {toastMessage.variant === "destructive" ? (
            <X className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <div>
            <div className="font-bold">{toastMessage.title}</div>
            {toastMessage.description && (
              <div className="text-white/70 text-caption mt-0.5">
                {toastMessage.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ambient background lighting effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-fuchsia-600/[0.07] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/[0.07] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-16 border-r border-white/[0.06] bg-[#050508]/50 backdrop-blur-3xl">
        <div className="relative z-10 flex items-center justify-between">
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 p-0.5 shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-transform duration-500 group-hover:scale-105">
              <div className="w-full h-full bg-[#030305] rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-fuchsia-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                LUMANORIS
              </span>
              <span className="block text-caption tracking-widest text-fuchsia-400 font-semibold uppercase">
                AI Architecture
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-xs text-white/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Secure TLS 1.3 Active</span>
          </div>
        </div>

        <div className="relative z-10 my-auto py-12 flex flex-col gap-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300 text-xs font-medium w-fit shadow-[0_0_20px_rgba(217,70,239,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Merkeziyetsiz Yapay Zekâ Ekosistemi</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
            Kendi akıllı botlarınızı kurun,{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              gelir elde edin
            </span>
            .
          </h1>

          <p className="text-base text-white/50 leading-relaxed">
            Yapay zeka sohbet modellerinizi saniyeler içinde oluşturun, küresel
            toplulukla paylaşın ve dijital varlıklarınızı güvenle yönetin.
          </p>

          <div className="relative rounded-2xl border border-white/[0.08] bg-[#0A0B10]/90 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.8)] backdrop-blur-xl group hover:border-fuchsia-500/30 transition-all duration-500">
            <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />

            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <Cpu className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    Lumanoris Core Engine
                    <span className="text-caption px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono">
                      SECURE
                    </span>
                  </div>
                  <div className="text-caption text-white/40">
                    Encrypted user registration pipeline
                  </div>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-white/60 text-caption">
                  AI
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/80 leading-relaxed">
                  Hesabınızı oluşturduktan sonra özel API anahtarlarınıza ve
                  gelişmiş model mimarilerine tam erişim sağlayabileceksiniz.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/40 pt-6 border-t border-white/[0.06]">
          <span>© 2026 Lumanoris Inc. Tüm hakları saklıdır.</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => openPolicy("terms")}
              className="hover:text-white transition-colors"
            >
              Şartlar
            </button>
            <button
              onClick={() => openPolicy("privacy")}
              className="hover:text-white transition-colors"
            >
              Gizlilik
            </button>
            <a
              href="mailto:lumanoris.ai@gmail.com"
              className="hover:text-white transition-colors"
            >
              Destek
            </a>
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-600/[0.05] rounded-full blur-[120px] pointer-events-none lg:hidden" />

        <div className="w-full max-w-[420px] relative z-10">
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 p-0.5 shadow-[0_0_25px_rgba(217,70,239,0.4)] mb-3">
              <div className="w-full h-full bg-[#030305] rounded-[14px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-fuchsia-400" />
              </div>
            </div>
            <span className="font-extrabold text-xl tracking-wider text-white">
              LUMANORIS
            </span>
            <span className="text-xs text-white/40 mt-1">
              Yapay Zekâ Ekosistemine Katılın
            </span>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-[#07080D]/90 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-6">
              <span className="text-caption font-bold uppercase tracking-widest text-fuchsia-400 block mb-1">
                Yeni Hesap Başlatın
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Kayıt Ol
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60 ml-1">
                  E-posta Adresi
                </label>
                <div className="relative group flex items-center w-full">
                  <Mail className="absolute left-3.5 w-4 h-4 text-white/30 group-focus-within:text-fuchsia-400 transition-colors" />
                  <input
                    type="email"
                    name="eposta"
                    placeholder="ornek@domain.com"
                    required
                    className={inputCls}
                    value={formData.eposta}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60 ml-1">
                    Doğum Tarihi
                  </label>
                  <div className="relative group flex items-center w-full">
                    <Calendar className="absolute left-3.5 w-4 h-4 text-white/30 group-focus-within:text-fuchsia-400 transition-colors" />
                    <input
                      type="date"
                      name="dogum_tarihi"
                      required
                      className={`${inputCls} text-xs`}
                      value={formData.dogum_tarihi}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60 ml-1">
                    Telefon
                  </label>
                  <div className="relative group flex items-center w-full">
                    <Phone className="absolute left-3.5 w-4 h-4 text-white/30 group-focus-within:text-fuchsia-400 transition-colors" />
                    <input
                      type="tel"
                      name="telefon"
                      placeholder="05XX XXX XXXX"
                      required
                      className={inputCls}
                      value={formData.telefon}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60 ml-1">
                  Şifre Belirle
                </label>
                <div className="relative group flex items-center w-full">
                  <Lock className="absolute left-3.5 w-4 h-4 text-white/30 group-focus-within:text-fuchsia-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="sifre"
                    placeholder="••••••••"
                    required
                    className={inputCls}
                    value={formData.sifre}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-white/30 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-[0_10px_30px_rgba(217,70,239,0.3)] hover:shadow-[0_15px_40px_rgba(217,70,239,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? "Hesap Oluşturuluyor..." : "Kayıt Ol"}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="relative flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-caption uppercase tracking-wider text-white/30 font-medium">
                  veya devam et
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="flex justify-center w-full">
                <button
                  type="button"
                  onClick={() =>
                    handleGoogleSuccess({
                      credential: "simulated_google_token",
                    })
                  }
                  className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-3 shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google ile Devam Et</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <a
                  href="/login"
                  className="text-xs text-white/50 hover:text-white transition-colors"
                >
                  Zaten hesabınız var mı?{" "}
                  <span className="text-fuchsia-400 font-semibold">
                    Giriş Yap
                  </span>
                </a>
              </div>
            </form>
          </div>

          <p className="text-center mt-6 text-caption text-white/40 leading-relaxed px-4">
            Devam ederek Lumanoris'in{" "}
            <button
              type="button"
              onClick={() => openPolicy("terms")}
              className="text-fuchsia-400 hover:underline font-medium"
            >
              Kullanım Koşulları
            </button>{" "}
            ve{" "}
            <button
              type="button"
              onClick={() => openPolicy("privacy")}
              className="text-fuchsia-400 hover:underline font-medium"
            >
              Gizlilik Politikası
            </button>
            'nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>

      {}
      {isPolicyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0A0B10] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h3 className="text-lg font-bold text-white font-display">
                {activePolicy === "terms"
                  ? "Kullanım Koşulları"
                  : "Gizlilik Politikası"}
              </h3>
              <button
                onClick={closePolicy}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-white/70 text-xs sm:text-sm leading-relaxed space-y-4 font-sans">
              {activePolicy === "terms" ? (
                <>
                  <h4 className="text-white font-bold text-sm">
                    1. Kabul Şartları
                  </h4>
                  <p>
                    LUMANORIS platformuna erişerek veya hizmetleri kullanarak,
                    aşağıda belirtilen tüm kullanım koşullarını okuduğunuzu,
                    anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
                  </p>
                  <h4 className="text-white font-bold text-sm">
                    2. Hizmet Tanımı
                  </h4>
                  <p>
                    LUMANORIS; bireylerin ve kurumların kendi yapay zekâ sohbet
                    modellerini oluşturabildiği, paylaşabildiği ve gelir elde
                    edebildiği merkeziyetsiz bir dijital platformdur.
                  </p>
                  <h4 className="text-white font-bold text-sm">
                    3. Kullanıcı Sorumlulukları
                  </h4>
                  <p>
                    Kullanıcılar, platformu yürürlükteki yasalara ve genel ahlak
                    kurallarına uygun şekilde kullanmakla yükümlüdür. Hesap
                    bilgilerinin güvenliğinden kullanıcı sorumludur.
                  </p>
                  <h4 className="text-white font-bold text-sm">4. İletişim</h4>
                  <p>
                    E-posta:{" "}
                    <a
                      href="mailto:lumanoris.ai@gmail.com"
                      className="text-fuchsia-400 hover:underline"
                    >
                      lumanoris.ai@gmail.com
                    </a>
                  </p>
                </>
              ) : (
                <>
                  <h4 className="text-white font-bold text-sm">1. Giriş</h4>
                  <p>
                    Bu Gizlilik Politikası, LUMANORIS tarafından sunulan
                    hizmetleri kullandığınızda kişisel verilerinizin nasıl
                    toplandığını, işlendiğini ve korunduğunu açıklar.
                  </p>
                  <h4 className="text-white font-bold text-sm">
                    2. Veri Güvenliği
                  </h4>
                  <p>
                    KVKK ve GDPR kapsamında verilerinize erişme, düzeltme,
                    silme, itiraz etme ve taşınabilirlik talep etme haklarına
                    sahipsiniz. Tüm verileriniz endüstri standardı şifreleme
                    algoritmalarıyla korunur.
                  </p>
                  <h4 className="text-white font-bold text-sm">3. İletişim</h4>
                  <p>
                    E-posta:{" "}
                    <a
                      href="mailto:lumanoris.ai@gmail.com"
                      className="text-fuchsia-400 hover:underline"
                    >
                      lumanoris.ai@gmail.com
                    </a>
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={closePolicy}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
