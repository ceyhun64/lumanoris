"use client";

import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import ubeyazlogo from "@/images/ubeyaz.png";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { toast } from "@/shared/hooks/use-toast";

export default function AuthPage() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPolicyOpen, setPolicyOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);

  const searchParams = useSearchParams();
  const target = searchParams.get("to") || null;

  const redirectAfterLogin = () => {
    if (target === "iletisim") {
      router.push("/dashboard/settings?to=iletisim");
    } else {
      router.push("/dashboard");
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
  }, [router]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          action: "google_login",
          google_token: credentialResponse.credential,
        })
      );
      const res = await fetch("/api/auth/login-google.php", {
        method: "POST",
        body: formData,
      });
      const result = JSON.parse(await res.text());
      if (result.success) {
        redirectAfterLogin();
      } else {
        toast({ variant: "destructive", title: "Google girişi başarısız", description: result.message });
      }
    } catch (err) {
      console.error("Hata:", err);
    } finally {
      setLoading(false);
    }
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
      })
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
        toast({ variant: "success", title: "Kayıt başarılı!", description: "Şimdi giriş yapabilirsiniz." });
        setIsActive(false);
      } else {
        toast({ variant: "destructive", title: "Hata", description: result.message });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Sunucuyla bağlantı kurulamadı." });
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

  const inputCls =
    "w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-[14px] text-white placeholder-white/35 outline-none ring-1 ring-inset ring-transparent focus:border-fuchsia-400/30 focus:ring-fuchsia-400/20 transition-all duration-200 font-sans";

  return (
    <GoogleOAuthProvider clientId="457680679934-poocs7d0n78r3eq8q53c6sedfdi1dh0c.apps.googleusercontent.com">
      <div className="min-h-screen bg-[#09090F] flex">
        {/* ── Left branding panel (desktop only) ── */}
        <div className="hidden lg:flex lg:w-[45%] relative flex-col items-center justify-center overflow-hidden">
          <div className="pointer-events-none absolute -top-32 left-[10%] h-[480px] w-[480px] rounded-full bg-fuchsia-600/[0.07] blur-[140px]" />
          <div className="pointer-events-none absolute bottom-[-25%] right-[-10%] h-[420px] w-[420px] rounded-full bg-violet-600/[0.06] blur-[140px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:28px_28px]" />
          <div className="relative z-10 flex flex-col items-center text-center px-12 gap-6">
            <img
              src={ubeyazlogo.src}
              alt="Lumanoris"
              className="w-20 h-20 drop-shadow-[0_0_32px_rgba(217,70,239,0.5)]"
            />
            <h1 className="text-4xl font-bold text-white font-display tracking-tight">
              LUMANORIS
            </h1>
            <p className="text-white/50 text-base max-w-xs font-sans leading-relaxed">
              Yapay zeka sohbet modellerinizi oluşturun, paylaşın ve gelir elde edin.
            </p>
            <div className="flex gap-3 mt-2">
              <div className="px-3 py-1.5 rounded-full border border-fuchsia-400/15 bg-fuchsia-500/[0.06] text-fuchsia-300/80 text-xs font-sans font-medium">
                ✦ AI Destekli
              </div>
              <div className="px-3 py-1.5 rounded-full border border-fuchsia-400/15 bg-fuchsia-500/[0.06] text-fuchsia-300/80 text-xs font-sans font-medium">
                ✦ Güvenli
              </div>
            </div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 flex items-center justify-center p-6 min-h-screen relative overflow-hidden">
          <div className="pointer-events-none absolute top-[10%] right-[15%] h-72 w-72 rounded-full bg-fuchsia-600/[0.08] blur-[100px] lg:hidden" />
          <div className="w-full max-w-md relative">
            {/* Mobile logo */}
            <div className="flex justify-center mb-8 lg:hidden">
              <img src={ubeyazlogo.src} alt="Lumanoris" className="w-14 h-14 drop-shadow-[0_0_24px_rgba(217,70,239,0.4)]" />
            </div>

            {/* Tab toggle */}
            <div className="flex rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 mb-6">
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold font-display transition-all duration-200 ${
                  !isActive
                    ? "bg-gradient-btn text-white shadow-glow"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold font-display transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-btn text-white shadow-glow"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            {/* ── Login form ── */}
            {!isActive && (
              <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/15 bg-gradient-card p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6),0_0_0_1px_rgba(232,121,249,0.03)]">
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-fuchsia-600/[0.08] blur-[90px]" />
                <span className="relative mb-1.5 block text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-fuchsia-400/70">
                  Giriş
                </span>
                <h2 className="relative text-2xl font-bold text-white font-display mb-6">
                  Hoş Geldiniz
                </h2>
                <form onSubmit={handleLogin} className="relative flex flex-col gap-4">
                  {loginError && (
                    <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {loginError}
                    </p>
                  )}
                  <input
                    type="email"
                    placeholder="E-posta"
                    required
                    className={inputCls}
                    value={loginData.eposta}
                    onChange={(e) =>
                      setLoginData({ ...loginData, eposta: e.target.value })
                    }
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Şifre"
                      required
                      className={inputCls}
                      value={loginData.sifre}
                      onChange={(e) =>
                        setLoginData({ ...loginData, sifre: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-transparent bg-luma-input cursor-pointer accent-fuchsia-500"
                        checked={loginData.rememberMe}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            rememberMe: e.target.checked,
                          })
                        }
                      />
                      <span className="text-xs text-white/50 font-sans">Beni Hatırla</span>
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-sans"
                    >
                      Şifremi Unuttum?
                    </a>
                  </div>

                  <Button type="submit" disabled={loading} className="mt-2 h-auto w-full py-3">
                    {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                  </Button>

                  <div className="relative flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/30 font-sans">veya</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => console.log("Google login error")}
                      type="standard"
                      shape="rectangular"
                      theme="filled_black"
                      size="large"
                      width="100%"
                    />
                  </div>
                </form>
              </div>
            )}

            {/* ── Register form ── */}
            {isActive && (
              <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/15 bg-gradient-card p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6),0_0_0_1px_rgba(232,121,249,0.03)]">
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-600/[0.08] blur-[90px]" />
                <span className="relative mb-1.5 block text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-fuchsia-400/70">
                  Kayıt
                </span>
                <h2 className="relative text-2xl font-bold text-white font-display mb-6">
                  Hesap Oluştur
                </h2>
                <form onSubmit={handleRegister} className="relative flex flex-col gap-4">
                  <input
                    type="email"
                    name="eposta"
                    placeholder="E-Posta"
                    required
                    className={inputCls}
                    value={registerData.eposta}
                    onChange={handleRegisterChange}
                  />
                  <input
                    type="date"
                    name="dogum_tarihi"
                    placeholder="Doğum Tarihi"
                    required
                    className={inputCls}
                    value={registerData.dogum_tarihi}
                    onChange={handleRegisterChange}
                  />
                  <input
                    type="tel"
                    name="telefon"
                    placeholder="Telefon Numarası"
                    required
                    className={inputCls}
                    value={registerData.telefon}
                    onChange={handleRegisterChange}
                  />
                  <input
                    type="password"
                    name="sifre"
                    placeholder="Şifre"
                    required
                    className={inputCls}
                    value={registerData.sifre}
                    onChange={handleRegisterChange}
                  />

                  <Button type="submit" disabled={loading} className="mt-2 h-auto w-full py-3">
                    {loading ? "İşleniyor..." : "Kayıt Ol"}
                  </Button>

                  <div className="relative flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/30 font-sans">veya</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => console.log("Google login error")}
                      type="standard"
                      shape="rectangular"
                      theme="filled_black"
                      size="large"
                      width="100%"
                    />
                  </div>
                </form>
              </div>
            )}

            {/* Terms */}
            <p className="text-center mt-6 text-[11px] text-white/25 font-sans px-4">
              Devam ederek{" "}
              <Button
                type="button"
                onClick={() => openPolicy("terms")}
                variant="link"
                className="h-auto p-0 text-[11px] text-fuchsia-400/70 hover:text-fuchsia-400"
              >
                Kullanım Koşulları
              </Button>{" "}
              ve{" "}
              <Button
                type="button"
                onClick={() => openPolicy("privacy")}
                variant="link"
                className="h-auto p-0 text-[11px] text-fuchsia-400/70 hover:text-fuchsia-400"
              >
                Gizlilik Politikası
              </Button>
              'nı kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>

      {/* ── Policy modal ── */}
      <Dialog open={isPolicyOpen} onOpenChange={(open) => !open && closePolicy()}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogTitle>
            {activePolicy === "terms" ? "Kullanım Koşulları" : "Gizlilik Politikası"}
          </DialogTitle>
          <div className="text-white/70 text-sm font-sans leading-relaxed space-y-4">
            {activePolicy === "terms" ? (
              <>
                <h1 className="text-white font-bold text-base">Kullanım Koşulları</h1>
                <p><strong className="text-white/90">Son Güncelleme:</strong> 4 Şubat 2026</p>
                <h2 className="text-white font-semibold">1. Kabul Şartları</h2>
                <p>LUMANORIS platformuna erişerek veya hizmetleri kullanarak, aşağıda belirtilen tüm kullanım koşullarını okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.</p>
                <h2 className="text-white font-semibold">2. Hizmet Tanımı</h2>
                <p>LUMANORIS; bireylerin ve kurumların kendi yapay zekâ sohbet modellerini oluşturabildiği, paylaşabildiği ve gelir elde edebildiği merkeziyetsiz bir dijital platformdur.</p>
                <h2 className="text-white font-semibold">3. Kullanıcı Sorumlulukları</h2>
                <p>Kullanıcılar, platformu yürürlükteki yasalara ve genel ahlak kurallarına uygun şekilde kullanmakla yükümlüdür. Hesap bilgilerinin güvenliğinden kullanıcı sorumludur.</p>
                <h2 className="text-white font-semibold">7. İletişim</h2>
                <p>E-posta: <a href="mailto:lumanoris.ai@gmail.com" className="text-fuchsia-400">lumanoris.ai@gmail.com</a></p>
              </>
            ) : (
              <>
                <h1 className="text-white font-bold text-base">Gizlilik Politikası</h1>
                <p><strong className="text-white/90">Son Güncelleme:</strong> 24 Temmuz 2025</p>
                <h2 className="text-white font-semibold">1. Giriş</h2>
                <p>Bu Gizlilik Politikası, LUMANORIS tarafından sunulan hizmetleri kullandığınızda kişisel verilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklar.</p>
                <h2 className="text-white font-semibold">10. Haklarınız</h2>
                <p>KVKK ve GDPR kapsamında verilerinize erişme, düzeltme, silme, itiraz etme ve taşınabilirlik talep etme haklarına sahipsiniz.</p>
                <h2 className="text-white font-semibold">11. İletişim</h2>
                <p>E-posta: <a href="mailto:lumanoris.ai@gmail.com" className="text-fuchsia-400">lumanoris.ai@gmail.com</a></p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </GoogleOAuthProvider>
  );
}
