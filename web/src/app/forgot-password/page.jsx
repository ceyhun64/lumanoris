"use client";
import { useState } from "react";
import ubeyazlogo from "@/images/ubeyaz.png";
import { useRouter } from "next/navigation";
import Alert from "@/shared/ui/Alert";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Button } from "@/shared/ui/button";

export default function ForgotPassword() {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [alert, setAlert] = useState({ show: false, message: "", type: "warning" });

    // Email validation
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Password validation
    const validatePassword = (password) => {
        if (password.length < 8) return "Şifre en az 8 karakter olmalıdır.";
        if (!/(?=.*[a-z])/.test(password)) return "Şifre en az bir küçük harf içermelidir.";
        if (!/(?=.*[A-Z])/.test(password)) return "Şifre en az bir büyük harf içermelidir.";
        if (!/(?=.*\d)/.test(password)) return "Şifre en az bir rakam içermelidir.";
        return null;
    };

    // Show alert
    const showAlert = (message, type = "warning") => {
        setAlert({ show: true, message, type });
    };

    // Close alert
    const closeAlert = () => {
        setAlert({ show: false, message: "", type: "warning" });
    };

    // Handle step 1 - Send code
    const handleSendCode = async () => {
        if (!email.trim()) {
            showAlert("E-posta adresi boş olamaz.");
            return;
        }

        if (!validateEmail(email)) {
            showAlert("Geçerli bir e-posta adresi girin.");
            return;
        }

        try {
            // Kod sunucu tarafında üretilip saklanır; istemci sadece e-postayı gönderir.
            const formData = new FormData();
            formData.append("email", email);

            const res = await fetch("/api/auth/passresetmail.php", {
            method: "POST",
            body: formData,
            });

            const result = await res.json();

            if (result.success) {
            setStep(2);
            showAlert("Doğrulama kodu e-posta adresinize gönderildi.", "success");
            } else {
            showAlert(result.message || "Kod gönderilemedi.");
            }
        } catch (err) {
            console.error("Kod gönderme hatası:", err);
            showAlert("Sunucuya bağlanırken hata oluştu.");
        }
    };

    // Handle password save
    const handleSavePassword = async () => {
        // Kod kontrolü artık sunucu tarafında yapılıyor (updateuserpass.php),
        // burada sadece boş bırakılmadığını kontrol ediyoruz.
        if (!verificationCode.trim()) {
            showAlert("Doğrulama kodu boş olamaz.");
            return;
        }

        // Şifre kontrolleri
        if (!password.trim()) {
            showAlert("Yeni şifre boş olamaz.");
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            showAlert(passwordError);
            return;
        }

        if (!passwordRepeat.trim()) {
            showAlert("Şifre tekrarı boş olamaz.");
            return;
        }

        if (password !== passwordRepeat) {
            showAlert("Şifreler eşleşmiyor.");
            return;
        }

        try {
            // Backend'e isteği gönderiyoruz — kimlik e-posta + kod ile doğrulanır
            const formData = new FormData();
            formData.append("email", email);
            formData.append("code", verificationCode);
            formData.append("password", password);
            formData.append("password_confirm", passwordRepeat);

            const res = await fetch("/api/auth/updateuserpass.php", {
            method: "POST",
            body: formData,
            });

            const result = await res.json();

            if (result.success) {
            showAlert("Şifreniz başarıyla güncellendi.", "success");
            setTimeout(() => {
                window.location.href = "/login"; // ✅ login sayfasına yönlendirme
            }, 1500);
            } else {
            showAlert(result.message || "Şifre güncellenemedi.");
            }
        } catch (err) {
            console.error("Şifre güncelleme hatası:", err);
            showAlert("Sunucuya bağlanırken hata oluştu.");
        }
    };

    const inputCls =
        "w-full bg-luma-input border border-transparent rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-fuchsia-500/60 focus:ring-1 focus:ring-fuchsia-500/30 transition-colors font-sans";

    return (
        <div className="min-h-screen bg-luma-base flex">
            {/* ── Left branding panel (desktop only) ── */}
            <div className="hidden lg:flex lg:w-[45%] relative flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/20 via-purple-900/15 to-violet-900/10" />
                <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_39px,rgba(255,255,255,0.02)_39px,rgba(255,255,255,0.02)_40px),repeating-linear-gradient(90deg,transparent,transparent_39px,rgba(255,255,255,0.02)_39px,rgba(255,255,255,0.02)_40px)]" />
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
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex items-center justify-center p-6 min-h-screen">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex justify-center mb-8 lg:hidden">
                        <img src={ubeyazlogo.src} alt="Lumanoris" className="w-14 h-14" />
                    </div>

                    <div className="bg-luma-elevated rounded-2xl p-8 border border-transparent shadow-modal">
                        <h2 className="text-xl font-bold text-white font-display mb-6">
                            Şifremi Unuttum
                        </h2>

                        {/* Step 1 - Email gönder */}
                        {step === 1 && (
                            <div className="flex flex-col gap-4">
                                <p className="text-sm text-white/60 font-sans leading-relaxed">
                                    <strong className="block text-white font-semibold mb-1">
                                        E-posta Adresinizi Girin
                                    </strong>
                                    E-posta adresine doğrulama kodu göndereceğiz.
                                </p>
                                <input
                                    type="email"
                                    placeholder="E-posta Adresinizi Girin"
                                    className={inputCls}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendCode()}
                                />
                                <Button onClick={handleSendCode} className="mt-2 h-auto w-full py-3">
                                    Kod Gönder
                                </Button>
                            </div>
                        )}

                        {/* Step 2 - Yeni şifre belirle */}
                        {step === 2 && (
                            <div className="flex flex-col gap-4">
                                <p className="text-sm text-white/60 font-sans leading-relaxed">
                                    <strong className="block text-white font-semibold mb-1">Yeni Şifrenizi Belirleyin</strong>
                                    E-posta adresinize gönderilen kodu girin ve yeni bir şifre oluşturun.
                                </p>

                                <input
                                    type="text"
                                    placeholder="Doğrulama Kodu"
                                    className={inputCls}
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSavePassword()}
                                />

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Yeni Şifre Belirle"
                                        className={inputCls}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <input
                                        type={showPasswordRepeat ? "text" : "password"}
                                        placeholder="Yeni Şifre Tekrarla"
                                        className={inputCls}
                                        value={passwordRepeat}
                                        onChange={(e) => setPasswordRepeat(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSavePassword()}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordRepeat(!showPasswordRepeat)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        {showPasswordRepeat ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                    </button>
                                </div>

                                <Button onClick={handleSavePassword} className="mt-2 h-auto w-full py-3">
                                    Kaydet
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {alert.show && (
                <Alert
                    message={alert.message}
                    onClose={closeAlert}
                    type={alert.type}
                />
            )}
        </div>
    );
}
