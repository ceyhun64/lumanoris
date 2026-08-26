"use client";

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
  Bot,
  MessageSquareCode,
  Lock,
  Mail,
  Phone,
  Calendar,
  User,
  X,
  Cpu,
  Layers,
  Globe,
  ChevronDown,
} from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const TR_DAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

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
function MiniSelect({ value, options, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const current = options.find((o) => o.value === value);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    // Capture phase + stopPropagation: this select can be opened while it's
    // nested inside BirthdatePicker's own popover, which has an identical
    // document-level Escape listener. Without this, one Escape press would
    // close both layers at once instead of just the innermost (this) one.
    function handleKeyDown(e) {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = ref.current?.querySelector('[data-selected="true"]');
    if (el) el.scrollIntoView({ block: "center" });
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white hover:border-white/20 hover:bg-white/[0.07] transition-colors"
      >
        <span>{current?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/40 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-10 max-h-52 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0E0F16] shadow-[0_15px_40px_rgba(0,0,0,0.6)] p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                close();
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                opt.value === value
                  ? "bg-fuchsia-600/20 text-fuchsia-300 font-semibold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Custom calendar dropdown for the birthdate field — native <input type="date">
// pickers render with an unstyleable, often barely-visible indicator on dark
// themes, so this replaces it with an in-brand popover. Kept as a top-level
// component (not nested inside AuthPage) so it isn't remounted — and its own
// open/view state lost — on every keystroke elsewhere in the form.
function BirthdatePicker({ value, onChange, inputCls, inputWrapperCls, fieldIconCls }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const today = new Date();
  const parsed = value ? new Date(`${value}T00:00:00`) : null;
  const defaultView = parsed || new Date(today.getFullYear() - 20, 0, 1);
  const [viewYear, setViewYear] = useState(defaultView.getFullYear());
  const [viewMonth, setViewMonth] = useState(defaultView.getMonth());

  const closeCalendar = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") closeCalendar();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const years = [];
  for (let y = today.getFullYear(); y >= today.getFullYear() - 100; y -= 1) years.push(y);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday-first grid

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const displayLabel = parsed
    ? `${String(parsed.getDate()).padStart(2, "0")}.${String(parsed.getMonth() + 1).padStart(2, "0")}.${parsed.getFullYear()}`
    : "";

  const isSelectedDay = (day) =>
    !!parsed &&
    parsed.getFullYear() === viewYear &&
    parsed.getMonth() === viewMonth &&
    parsed.getDate() === day;

  function pickDay(day) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    closeCalendar();
  }

  return (
    <div className={inputWrapperCls} ref={wrapRef}>
      <Calendar className={fieldIconCls} />
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`${inputCls} text-xs text-left`}
      >
        <span className={displayLabel ? "text-white" : "text-white/35"}>
          {displayLabel || "gg.aa.yyyy"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border border-white/10 bg-[#0A0B10] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 mb-3">
            <MiniSelect
              value={viewMonth}
              onChange={setViewMonth}
              options={TR_MONTHS.map((m, i) => ({ value: i, label: m }))}
              className="flex-1"
            />
            <MiniSelect
              value={viewYear}
              onChange={setViewYear}
              options={years.map((y) => ({ value: y, label: String(y) }))}
              className="w-24"
            />
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {TR_DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-white/40 py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) =>
              day === null ? (
                <div key={`blank-${idx}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={`h-8 rounded-lg text-xs transition-colors ${
                    isSelectedDay(day)
                      ? "bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-bold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {day}
                </button>
              ),
            )}
          </div>
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

  const googleButtonSlotRef = useRef(null);
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
    if (googleButtonSlotRef.current) {
      window.google.accounts.id.renderButton(googleButtonSlotRef.current, {
        type: "standard",
        width: 320,
      });
    }
    setGoogleReady(true);
  };

  const handleGoogleLoginClick = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      toast.error("Google ile giriş bu ortamda yapılandırılmamış.");
      return;
    }
    if (!googleReady) {
      toast.error("Google girişi hazırlanıyor, birkaç saniye sonra tekrar deneyin.");
      return;
    }
    googleButtonSlotRef.current?.querySelector('div[role="button"]')?.click();
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
    if (!registerData.dogum_tarihi) {
      toast.warning("Lütfen doğum tarihinizi seçin.");
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
      {/* Real Google Identity Services button, kept visually hidden — our
          own styled buttons below forward their click to this one, since
          Google's widget doesn't accept custom styling directly. */}
      <div
        ref={googleButtonSlotRef}
        className="absolute h-px w-px overflow-hidden opacity-0"
        style={{ pointerEvents: googleReady ? "auto" : "none" }}
        aria-hidden="true"
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 p-0.5 shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-transform duration-500 group-hover:scale-105">
              <div className="w-full h-full bg-[#030305] rounded-md flex items-center justify-center">
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
            <span>Sistem Aktif</span>
          </div>
        </div>

        {/* Center Hero Content & Interactive Chat Simulation */}
        <div className="relative z-10 my-auto py-12 flex flex-col gap-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300 text-xs font-medium w-fit shadow-[0_0_20px_rgba(217,70,239,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Autonomous Intelligence Platform</span>
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
                      PRO
                    </span>
                  </div>
                  <div className="text-caption text-white/40">
                    Real-time LLM inference stream
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 p-0.5 shadow-[0_0_25px_rgba(217,70,239,0.4)] mb-3">
              <div className="w-full h-full bg-[#030305] rounded-[14px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-fuchsia-400" />
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
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
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
                  <button
                    type="button"
                    onClick={handleGoogleLoginClick}
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
                    <label className="text-xs font-medium text-white/60 ml-1">
                      Doğum Tarihi
                    </label>
                    <BirthdatePicker
                      value={registerData.dogum_tarihi}
                      onChange={(iso) =>
                        setRegisterData((prev) => ({ ...prev, dogum_tarihi: iso }))
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
                      aria-label={showRegisterPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className={eyeToggleCls}
                    >
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  <button
                    type="button"
                    onClick={handleGoogleLoginClick}
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
              </form>
            </div>
          )}

          {/* Terms Footer */}
          <p className="text-center mt-6 text-caption text-white/40 leading-relaxed px-4">
            Devam ederek{" "}
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

      {/* ── Policy Modal Overlay ── */}
      {isPolicyOpen && (
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

            <div className="text-white/70 text-xs sm:text-sm leading-relaxed space-y-4">
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
