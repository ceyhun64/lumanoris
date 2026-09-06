"use client";
import LegalBody from "@/widgets/info/LegalBody";
import { ModalPortal } from "@/shared/ui/modal-portal";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import {
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  MessageSquareCode,
  Lock,
  Mail,
  Phone,
  User,
  X,
  Cpu,
  Layers,
  Globe,
} from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { BirthdatePicker } from "@/shared/ui/birthdate-picker";
import { MIN_REGISTRATION_AGE, isAtLeastYearsOld } from "@/shared/lib/age";
import logo from "@/images/header-logo-icon.png";

const CHAT_DEMO_MESSAGES = [
  {
    role: "ai",
    text: "Merhaba! Bugün hangi karmaşık problemi optimize etmek veya hangi fikri hayata geçirmek istiyorsun?",
  },
  {
    role: "user",
    text: "SaaS platformum için ölçeklenebilir bir mimari tasarlayalım.",
  },
  {
    role: "ai",
    text: "Harika seçim — birkaç saniye içinde ilk mimari taslağını hazırlıyorum.",
  },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
    </div>
  );
}

// Calm, looping chat preview for the auth hero panel — a quiet supporting
// showcase, not the page's focal point. Whole messages fade/slide in (never
// letter-by-letter); a brief three-dot indicator stands in for "typing"
// between turns. Under prefers-reduced-motion the loop never starts and the
// full conversation renders once, statically.
function ChatShowcase() {
  const reducedMotion = usePrefersReducedMotion();
  const [visibleCount, setVisibleCount] = useState(
    reducedMotion ? CHAT_DEMO_MESSAGES.length : 1,
  );
  const [typingRole, setTypingRole] = useState(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCount(CHAT_DEMO_MESSAGES.length);
      return;
    }

    let cancelled = false;
    const timeouts = [];
    const wait = (ms) =>
      new Promise((resolve) => {
        timeouts.push(setTimeout(resolve, ms));
      });

    async function loop() {
      while (!cancelled) {
        setFading(false);
        setVisibleCount(1);
        setTypingRole(null);

        for (let i = 1; i < CHAT_DEMO_MESSAGES.length; i += 1) {
          await wait(2400);
          if (cancelled) return;
          setTypingRole(CHAT_DEMO_MESSAGES[i].role);
          await wait(1100);
          if (cancelled) return;
          setTypingRole(null);
          setVisibleCount(i + 1);
        }

        await wait(4000);
        if (cancelled) return;
        setFading(true);
        await wait(400);
      }
    }

    loop();
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [reducedMotion]);

  return (
    <div
      className={`space-y-3 font-sans text-xs transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      {CHAT_DEMO_MESSAGES.slice(0, visibleCount).map((msg, i) =>
        msg.role === "ai" ? (
          <div
            key={i}
            className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-500"
          >
            <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-white/60 text-caption">
              AI
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-white/80 leading-relaxed">
              {msg.text}
            </div>
          </div>
        ) : (
          <div
            key={i}
            className="flex items-start gap-2.5 justify-end animate-in fade-in slide-in-from-bottom-1 duration-500"
          >
            <div className="p-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white font-medium shadow-lg max-w-[80%]">
              {msg.text}
            </div>
          </div>
        ),
      )}

      {typingRole && (
        <div
          className={`flex items-start gap-2.5 animate-in fade-in duration-300 ${typingRole === "user" ? "justify-end" : ""}`}
        >
          {typingRole === "ai" && (
            <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/60 text-caption">
              AI
            </div>
          )}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <TypingDots />
          </div>
        </div>
      )}
    </div>
  );
}

// In-brand replacement for a native <select> — used for the calendar's
// month/year pickers so they don't fall back to the browser's unstyleable
// default dropdown look next to an otherwise fully custom popover.

/**
 * Google'in KENDI butonu — gorunur olarak cizilir.
 *
 * Eskiden bu buton 1x1 piksel, `opacity-0` bir kaba ciziliyor ve bizim
 * tasarladigimiz sahte buton tiklamayi ona iletiyordu. Google Identity
 * Services bunu kabul etmiyor: butonu gizli ya da sifir boyutlu bir kapta
 * bulursa akisi kasitli olarak tamamlamiyor (clickjacking korumasi).
 * Belirtisi, acilip bos kalan bir `accounts.google.com/gsi/transform`
 * penceresiydi.
 *
 * Widget'in ic tasarimi degistirilemez; desteklenen ozellestirme
 * theme/size/shape/width ile sinirli. Cevresindeki duzen bize ait.
 */
function GoogleSignInButton({ ready, disabledReason }) {
  const wrapRef = useRef(null);
  const slotRef = useRef(null);

  // GSI butonunun İÇ tasarımı değiştirilemez — desteklenen tek özelleştirme
  // theme/size/shape/width/logo_alignment. Yapabileceğimiz en iyi şey onu
  // formun geri kalanıyla aynı genişliğe oturtmak; sabit 320px bırakılınca
  // "Giriş Yap" düğmesinden dar kalıp hizasız duruyordu.
  //
  // width bir SAYI olmak zorunda (yüzde kabul edilmiyor), o yüzden kabın
  // gerçek genişliğini ölçüp veriyoruz ve pencere boyutu değişince yeniden
  // çiziyoruz. Google 400px tavanı uyguluyor.
  useEffect(() => {
    if (!ready || !window.google?.accounts?.id) return undefined;

    const draw = () => {
      const el = slotRef.current;
      const wrap = wrapRef.current;
      if (!el || !wrap) return;
      const width = Math.max(200, Math.min(400, Math.round(wrap.offsetWidth)));
      el.innerHTML = "";
      window.google.accounts.id.renderButton(el, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "left",
        locale: "tr",
        width,
      });
    };

    draw();

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(draw) : null;
    if (observer && wrapRef.current) observer.observe(wrapRef.current);
    window.addEventListener("resize", draw);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [ready]);

  return (
    <div ref={wrapRef} className="w-full">
      {ready ? (
        // Yükseklik farkını kapatmak için hafif bir kap: GSI 44px çiziyor,
        // formdaki diğer düğmeler daha yüksek.
        <div ref={slotRef} className="flex w-full justify-center [color-scheme:dark]" />
      ) : (
        <div className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] text-xs text-white/40">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white/50" />
          {disabledReason || "Google girişi hazırlanıyor…"}
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  const [isActive, setIsActive] = useState(false); // false = Login, true = Register
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isPolicyOpen, setPolicyOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setTarget(params.get("to"));
      if (params.get("tab") === "register") setIsActive(true);
    }
  }, []);

  const redirectAfterLogin = () => {
    if (target === "iletisim") {
      window.location.href = "/dashboard/settings?to=iletisim";
    } else {
      window.location.href = "/dashboard";
    }
  };

  const [loginData, setLoginData] = useState({
    eposta: "",
    sifre: "",
    rememberMe: false,
  });

  const [registerData, setRegisterData] = useState({
    eposta: "",
    dogum_tarihi: "",
    telefon: "",
    sifre: "",
    kullanici_adi: "",
  });

  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/sessioncheck.php", {
          credentials: "include",
        });
        const result = JSON.parse(await res.text());
        if (result.authenticated) redirectAfterLogin();
      } catch (err) {
        console.error("Session check error:", err);
      }
    }
    checkSession();
  }, []);

  const [googleReady, setGoogleReady] = useState(false);

  // Google's Identity Services widget renders its own button into a DOM
  // node — it doesn't accept custom styling. To keep our own button design,
  // GIS renders into a visually hidden slot and our styled button forwards
  // its click to the real (hidden) Google button.
  const handleGoogleCredentialResponse = useCallback(async (response) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({ google_token: response.credential }),
      );
      const res = await fetch("/api/auth/login-google.php", {
        method: "POST",
        body: formData,
      });
      const result = await res.json().catch(() => ({
        success: false,
        message: "Sunucu yanıtı okunamadı.",
      }));
      if (result.success) {
        redirectAfterLogin();
      } else {
        toast.error(result.message || "Google ile giriş başarısız oldu.");
      }
    } catch (err) {
      console.error("Google login error:", err);
      toast.error("Google kimlik doğrulama servisine bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGoogleScriptLoad = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredentialResponse,
    });
    // Butonlar artik kendi kaplarina ciziliyor (GoogleSignInButton).
    setGoogleReady(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({
        eposta: loginData.eposta,
        sifre: loginData.sifre,
        rememberMe: loginData.rememberMe,
      }),
    );
    try {
      const response = await fetch("/api/auth/login.php", {
        method: "POST",
        body: formData,
      });
      const result = JSON.parse(await response.text());
      if (result.success) {
        redirectAfterLogin();
      } else {
        setLoginError(result.message || "Bilinmeyen bir hata oluştu.");
      }
    } catch (error) {
      setLoginError("Sunucuya bağlanılamadı. Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    /* COMP-002: bu kontrol artık tek savunma DEĞİL — asıl kapı sunucuda
       (RegisterUseCase → InputSanitizer::birthDate). Buradaki amaç yalnızca
       kullanıcıyı formu göndermeden uyarmak; sunucuya doğrudan POST atan biri
       yine de reddedilir. MIN_REGISTRATION_AGE ile ELLE senkron: sunucu
       tarafındaki sabit değişirse buradaki 18 de değişmeli. */
    if (!registerData.dogum_tarihi) {
      toast.warning("Lütfen doğum tarihinizi seçin.");
      return;
    }
    if (!isAtLeastYearsOld(registerData.dogum_tarihi, MIN_REGISTRATION_AGE)) {
      toast.warning(
        `Bu platformu kullanabilmek için en az ${MIN_REGISTRATION_AGE} yaşında olmalısınız.`
      );
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("data", JSON.stringify(registerData));
    try {
      const res = await fetch("/api/auth/register.php", {
        method: "POST",
        body: formData,
      });
      const result = JSON.parse(await res.text());
      if (result.success) {
        toast.success("Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.");
        setIsActive(false);
      } else {
        toast.error(result.message || "Kayıt sırasında bir hata oluştu.");
      }
    } catch (err) {
      toast.error("Sunucuyla bağlantı kurulamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
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
      setRegisterData({ ...registerData, [name]: formatted.trim() });
    } else {
      setRegisterData({
        ...registerData,
        [name]: value,
        kullanici_adi:
          name === "eposta" ? value.split("@")[0] : registerData.kullanici_adi,
      });
    }
  };

  const openPolicy = (type) => {
    setActivePolicy(type);
    setPolicyOpen(true);
  };
  const closePolicy = () => {
    setPolicyOpen(false);
    setActivePolicy(null);
  };

  const inputWrapperCls = "relative group flex items-center w-full";
  const inputCls =
    "w-full bg-[#0A0B10]/80 border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-body text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-fuchsia-500/50 focus:bg-[#0E0F16] focus:ring-4 focus:ring-fuchsia-500/10 hover:border-white/20 font-sans";
  // Password fields reserve extra right padding so typed text never runs
  // under the show/hide toggle button.
  const passwordInputCls = `${inputCls} pr-11`;
  const fieldIconCls =
    "absolute left-3.5 w-4 h-4 text-white/45 group-focus-within:text-fuchsia-400 transition-colors pointer-events-none";
  const eyeToggleCls =
    "absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/50 hover:text-fuchsia-300 hover:bg-white/5 transition-colors";

  return (
    <div className="min-h-screen bg-[#030305] text-white flex selection:bg-fuchsia-500/30 selection:text-fuchsia-200 overflow-x-hidden font-sans relative">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={handleGoogleScriptLoad}
      />
      {/* Ambient background lighting effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-fuchsia-600/[0.07] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/[0.07] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* ── Left Interactive Branding & Preview Panel (Desktop) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-16 border-r border-white/[0.06] bg-[#050508]/50 backdrop-blur-3xl">
        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl p-0.5 shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-transform duration-500 group-hover:scale-105">
              <div className="w-full h-full bg-[#030305] rounded-md flex items-center justify-center">
                <img
                  src={logo.src}
                  alt="Lumanoris"
                  className="relative w-7 h-7 object-contain transition-transform group-hover:scale-110"
                />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                LUMANORIS
              </span>
              <span className="block text-caption tracking-widest text-fuchsia-400 font-semibold uppercase">
                Yapay Zekâ Mimarisi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-xs text-white/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistem Aktif</span>
          </div>
        </div>

        {/* Center Hero Content & Interactive Chat Simulation */}
        <div className="relative z-10 my-auto py-12 flex flex-col gap-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300 text-xs font-medium w-fit shadow-[0_0_20px_rgba(217,70,239,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Yeni Nesil Otonom Yapay Zeka Platformu</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white max-w-[680px]">
            Yapay zekâ botlarınla sohbet et, kendi{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              ekosistemini
            </span>{" "}
            kur.
          </h1>

          <p className="text-base text-white/50 leading-relaxed">
            Yüzlerce uzmanlaştırılmış yapay zekâ modeline anında erişin veya
            kendi özel botunuzu saniyeler içinde tasarlayıp küresel pazaryerinde
            gelir elde etmeye başlayın.
          </p>

          {/* Simulated Live UI Preview Widget */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#0A0B10]/90 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.8)] backdrop-blur-xl group hover:border-fuchsia-500/30 transition-all duration-500">
            <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />

            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <Cpu className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    Nexus Neural v4.5
                    <span className="text-caption px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono">
                      Profesyonel
                    </span>
                  </div>
                  <div className="text-caption text-white/40">
                    Gerçek zamanlı yanıt akışı
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-white/30">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            </div>

            <ChatShowcase />
          </div>
        </div>

        {/* Bottom Footer Info */}
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

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-600/[0.05] rounded-full blur-[120px] pointer-events-none lg:hidden" />

        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile Brand Header */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="group w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 p-0.5 shadow-[0_0_25px_rgba(217,70,239,0.4)] mb-3">
              <div className="w-full h-full bg-[#030305] rounded-[14px] flex items-center justify-center">
                <img
                  src={logo.src}
                  alt="Lumanoris"
                  className="relative w-7 h-7 object-contain transition-transform group-hover:scale-110"
                />
              </div>
            </div>
            <span className="font-extrabold text-xl tracking-wider text-white">
              LUMANORIS
            </span>
            <span className="text-xs text-white/40 mt-1">
              Yapay Zekâ Ekosistemine Giriş Yapın
            </span>
          </div>

          {/* Segmented Tab Selector */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-8 backdrop-blur-xl relative">
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative z-10 ${
                !isActive
                  ? "text-white shadow-lg bg-gradient-to-r from-fuchsia-600 to-violet-600"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative z-10 ${
                isActive
                  ? "text-white shadow-lg bg-gradient-to-r from-fuchsia-600 to-violet-600"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Hesap Oluştur
            </button>
          </div>

          {/* ── Login Card ── */}
          {!isActive && (
            <div className="rounded-3xl border border-white/[0.08] bg-[#07080D]/80 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="mb-6">
                <span className="text-caption font-bold uppercase tracking-widest text-fuchsia-400 block mb-1">
                  Güvenli Kimlik Doğrulama
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Tekrar Hoş Geldiniz
                </h2>
              </div>

              {loginError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-relaxed flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60 ml-1">
                    E-posta Adresi
                  </label>
                  <div className={inputWrapperCls}>
                    <Mail className={fieldIconCls} />
                    <input
                      type="email"
                      placeholder="ornek@domain.com"
                      required
                      className={inputCls}
                      value={loginData.eposta}
                      onChange={(e) =>
                        setLoginData({ ...loginData, eposta: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-medium text-white/60">
                      Şifre
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-medium"
                    >
                      Şifremi Unuttum?
                    </a>
                  </div>
                  <div className={inputWrapperCls}>
                    <Lock className={fieldIconCls} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className={passwordInputCls}
                      value={loginData.sifre}
                      onChange={(e) =>
                        setLoginData({ ...loginData, sifre: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Şifreyi gizle" : "Şifreyi göster"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                      className={eyeToggleCls}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center py-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group/chk">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-fuchsia-500 focus:ring-fuchsia-500/20 focus:ring-offset-0 cursor-pointer accent-fuchsia-500"
                      checked={loginData.rememberMe}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          rememberMe: e.target.checked,
                        })
                      }
                    />
                    <span className="text-xs text-white/60 group-hover/chk:text-white/90 transition-colors">
                      Beni Hatırla
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-btn text-white shadow-glow hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>{loading ? "Giriş Yapılıyor..." : "Giriş Yap"}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="relative flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-caption uppercase tracking-wider text-white/30 font-medium">
                    veya devam et
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="flex justify-center w-full">
                  <GoogleSignInButton
                    ready={googleReady}
                    disabledReason={
                      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
                        ? undefined
                        : "Google girişi yapılandırılmamış"
                    }
                  />
                </div>
              </form>
            </div>
          )}

          {/* ── Register Card ── */}
          {isActive && (
            <div className="rounded-3xl border border-white/[0.08] bg-[#07080D]/80 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="mb-6">
                <span className="text-caption font-bold uppercase tracking-widest text-fuchsia-400 block mb-1">
                  Yeni Hesap Başlatın
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Ekosisteme Katılın
                </h2>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60 ml-1">
                    E-posta Adresi
                  </label>
                  <div className={inputWrapperCls}>
                    <Mail className={fieldIconCls} />
                    <input
                      type="email"
                      name="eposta"
                      placeholder="ornek@domain.com"
                      required
                      className={inputCls}
                      value={registerData.eposta}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    {/* COMP-002: yaş sınırı kullanıcıya ÖNCEDEN söyleniyor.
                        Doğum tarihini girip formu gönderdikten sonra
                        reddedilmek, sınırı hiç yazmamakla aynı kötü deneyim. */}
                    <label className="text-xs font-medium text-white/60 ml-1">
                      Doğum Tarihi{" "}
                      <span className="text-white/35">
                        ({MIN_REGISTRATION_AGE}+)
                      </span>
                    </label>
                    <BirthdatePicker
                      value={registerData.dogum_tarihi}
                      onChange={(iso) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          dogum_tarihi: iso,
                        }))
                      }
                      inputCls={inputCls}
                      inputWrapperCls={inputWrapperCls}
                      fieldIconCls={fieldIconCls}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60 ml-1">
                      Telefon
                    </label>
                    <div className={inputWrapperCls}>
                      <Phone className={fieldIconCls} />
                      <input
                        type="tel"
                        name="telefon"
                        placeholder="05XX XXX XXXX"
                        required
                        className={inputCls}
                        value={registerData.telefon}
                        onChange={handleRegisterChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60 ml-1">
                    Şifre
                  </label>
                  <div className={inputWrapperCls}>
                    <Lock className={fieldIconCls} />
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      name="sifre"
                      placeholder="••••••••"
                      required
                      className={passwordInputCls}
                      value={registerData.sifre}
                      onChange={handleRegisterChange}
                    />
                    <button
                      type="button"
                      aria-label={
                        showRegisterPassword
                          ? "Şifreyi gizle"
                          : "Şifreyi göster"
                      }
                      onClick={() =>
                        setShowRegisterPassword(!showRegisterPassword)
                      }
                      className={eyeToggleCls}
                    >
                      {showRegisterPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-btn text-white shadow-glow hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  <span>{loading ? "Hesap Oluşturuluyor..." : "Kayıt Ol"}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="relative flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-caption uppercase tracking-wider text-white/30 font-medium">
                    veya kayıt ol
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="flex justify-center w-full">
                  <GoogleSignInButton
                    ready={googleReady}
                    disabledReason={
                      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
                        ? undefined
                        : "Google girişi yapılandırılmamış"
                    }
                  />
                </div>
              </form>
            </div>
          )}

          {/* Terms Footer */}
          <p className="text-center mt-6 text-caption text-white/40 leading-relaxed px-4">
            Devam ederek{" "}
            {/* SEO-002: bunlar <button> idi. Metin artık kendi public
                sayfasında da yayınlanıyor; <a href> vermek Googlebot'a gerçek
                bir bağlantı sunuyor (JS click handler'ı SEO linki sayılmaz) ve
                "yeni sekmede aç" çalışıyor. Görünüm ve modal davranışı aynı:
                tıklama preventDefault ile sayfada kalıyor. */}
            <a
              href="/kullanim-kosullari/"
              onClick={(e) => {
                e.preventDefault();
                openPolicy("terms");
              }}
              className="text-fuchsia-400 hover:underline font-medium cursor-pointer"
            >
              Kullanım Koşulları
            </a>{" "}
            ve{" "}
            <a
              href="/gizlilik-politikasi/"
              onClick={(e) => {
                e.preventDefault();
                openPolicy("privacy");
              }}
              className="text-fuchsia-400 hover:underline font-medium cursor-pointer"
            >
              Gizlilik Politikası
            </a>
            'nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>

      {/* ── Policy Modal Overlay ── */}
      {isPolicyOpen && (
        <ModalPortal onClose={() => setPolicyOpen(false)}>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0A0B10] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <h3 className="text-lg font-bold text-white">
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

              {/* Metin artık admin panelinden yönetiliyor:
                  /admin/kullanimkosullari ve /admin/gizlilikpolitikasi →
                  global_vars → /api/content/*.php. Buradaki sabit kopya
                  güncellenmiyordu, yani admin metni değiştirdiğinde giriş
                  ekranındaki sözleşme eski hâlinde kalıyordu. */}
              <LegalBody doc={activePolicy === "terms" ? "terms" : "privacy"} />

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
        </ModalPortal>
      )}
    </div>
  );
}
