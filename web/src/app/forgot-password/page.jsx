"use client";
import { useState } from "react";
import ubeyazlogo from "@/images/ubeyaz.png";
import { useRouter } from "next/navigation";
import Alert from "@/shared/ui/Alert";

export default function ForgotPassword() {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState(""); // *** YENİ: Doğrulama kodu state'i ***
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [alert, setAlert] = useState({ show: false, message: "", type: "warning" });
    const [generatedCode, setGeneratedCode] = useState(""); // *** YENİ: Oluşturulan kod (TEST AMAÇLI) ***
    const [userId, setUserId] = useState(null);

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

    // Doğrulama kodu oluşturma (TEST AMAÇLI)
    const generateRandomCode = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
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

        // Kod oluşturuluyor ve state'e atanıyor
        const code = generateRandomCode();
        setGeneratedCode(code);

        try {
            // Backend'e POST isteği atıyoruz
            const formData = new FormData();
            formData.append("email", email);
            formData.append("resetCode", code);

            const res = await fetch("/api/auth/passresetmail.php", {
            method: "POST",
            body: formData,
            });

            const resultText = await res.text();
            console.log(resultText);
            const result = JSON.parse(resultText);
            // const result = await res.json();
            // console.log("API result:", result);

            if (result.success) {
            setStep(2);
            showAlert("Doğrulama kodu e-posta adresinize gönderildi.", "success");
            setUserId(result.user_id);
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
        // Kod kontrolü
        if (!verificationCode.trim()) {
            showAlert("Doğrulama kodu boş olamaz.");
            return;
        }

        if (verificationCode !== generatedCode) {
            showAlert("Girilen doğrulama kodu hatalı.");
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
            // Backend'e isteği gönderiyoruz
            const formData = new FormData();
            formData.append("id", userId); // şifre sıfırlanan kullanıcının id'si
            formData.append("password", password);
            formData.append("password_confirm", passwordRepeat);

            const res = await fetch("/api/auth/updateuserpass.php", {
            method: "POST",
            body: formData,
            });

            const result = await res.json();
            console.log("API result:", result);

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

    return (
        <div className="forgot-content">


            <div className="forgot-box">
                <div className="logo">
                    <div className="shadow">
                        <svg width="259" height="259" viewBox="0 0 259 259" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g filter="url(#filter0_f_7772_13618)">
                                <circle cx="129.496" cy="129.836" r="44.4356" fill="url(#paint0_linear_7772_13618)" />
                            </g>
                            <defs>
                                <filter id="filter0_f_7772_13618" x="0.430855" y="0.770699" width="258.13" height="258.13" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                    <feGaussianBlur stdDeviation="42.3148" result="effect1_foregroundBlur_7772_13618" />
                                </filter>
                                <linearGradient id="paint0_linear_7772_13618" x1="103.239" y1="147.004" x2="148.179" y2="113.173" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FF66C4" />
                                    <stop offset="1" stop-color="#4699FF" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <img src={ubeyazlogo.src} alt="logo" />
                </div>
                <h2 className="title">Şifremi Unuttum</h2>

                {/* Step 1 - Email gönder */}
                {step === 1 && (
                    <>
                        <p className="info">
                            <strong>
                                E-posta Adresinizi Girin
                            </strong>
                            E-posta adresine doğrulama kodu göndereceğiz.
                        </p>
                        <input
                            type="email"
                            placeholder="E-POSTA ADRESİNİZİ GİRİN"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendCode()}
                        />
                        <button onClick={handleSendCode} className="button">
                            KOD GÖNDER
                        </button>
                    </>
                )}

                {/* Step 2 - Yeni şifre belirle */}
                {step === 2 && (
                    <>
                        <p className="info">
                            <strong>Yeni Şifrenizi Belirleyin</strong><br />
                            E-posta adresinize gönderilen kodu girin ve yeni bir şifre oluşturun.
                        </p>
                        
                        {/* *** YENİ: Doğrulama Kodu Girdisi *** */}
                        <input
                            type="text"
                            placeholder="DOĞRULAMA KODU"
                            className="input"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSavePassword()}
                        />
                        {/* ************************************* */}

                        <div className="password-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="YENİ ŞİFRE BELİRLE"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <span onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? (
                                    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.5" d="M3.7418 15.9103C2.8918 14.8063 2.4668 14.2533 2.4668 12.6143C2.4668 10.9743 2.8918 10.4233 3.7418 9.31826C5.4388 7.11426 8.2848 4.61426 12.4668 4.61426C16.6488 4.61426 19.4948 7.11426 21.1918 9.31826C22.0418 10.4243 22.4668 10.9753 22.4668 12.6143C22.4668 14.2543 22.0418 14.8053 21.1918 15.9103C19.4948 18.1143 16.6488 20.6143 12.4668 20.6143C8.2848 20.6143 5.4388 18.1143 3.7418 15.9103Z" stroke="#CC3399" strokeWidth="1.5" />
                                        <path d="M15.4668 12.6143C15.4668 13.4099 15.1507 14.173 14.5881 14.7356C14.0255 15.2982 13.2624 15.6143 12.4668 15.6143C11.6711 15.6143 10.9081 15.2982 10.3455 14.7356C9.78287 14.173 9.4668 13.4099 9.4668 12.6143C9.4668 11.8186 9.78287 11.0555 10.3455 10.4929C10.9081 9.93033 11.6711 9.61426 12.4668 9.61426C13.2624 9.61426 14.0255 9.93033 14.5881 10.4929C15.1507 11.0555 15.4668 11.8186 15.4668 12.6143Z" stroke="#CC3399" strokeWidth="1.5" />
                                    </svg>
                                ) : (
                                    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.5" d="M3.7418 15.9103C2.8918 14.8063 2.4668 14.2533 2.4668 12.6143C2.4668 10.9743 2.8918 10.4233 3.7418 9.31826C5.4388 7.11426 8.2848 4.61426 12.4668 4.61426C16.6488 4.61426 19.4948 7.11426 21.1918 9.31826C22.0418 10.4243 22.4668 10.9753 22.4668 12.6143C22.4668 14.2543 22.0418 14.8053 21.1918 15.9103C19.4948 18.1143 16.6488 20.6143 12.4668 20.6143C8.2848 20.6143 5.4388 18.1143 3.7418 15.9103Z" stroke="#CC3399" strokeWidth="1.5" />
                                        <path d="M9.4668 12.6143C9.4668 13.4099 9.78287 14.173 10.3455 14.7356C10.9081 15.2982 11.6711 15.6143 12.4668 15.6143C13.2624 15.6143 14.0255 15.2982 14.5881 14.7356C15.1507 14.173 15.4668 13.4099 15.4668 12.6143C15.4668 11.8186 15.1507 11.0555 14.5881 10.4929C14.0255 9.93033 13.2624 9.61426 12.4668 9.61426C11.6711 9.61426 10.9081 9.93033 10.3455 10.4929C9.78287 11.0555 9.4668 11.8186 9.4668 12.6143Z" stroke="#CC3399" strokeWidth="1.5" />
                                        <path d="M5.75 5.75L19.25 19.25" stroke="#CC3399" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                )}
                            </span>


                        </div>
                        <div className="password-group">
                            <input
                                type={showPasswordRepeat ? "text" : "password"}
                                placeholder="YENİ ŞİFRE TEKRARLA"
                                value={passwordRepeat}
                                onChange={(e) => setPasswordRepeat(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSavePassword()}
                            />
                            <span onClick={() => setShowPasswordRepeat(!showPasswordRepeat)}>
                                {showPasswordRepeat ? (
                                    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.5" d="M3.7418 15.9103C2.8918 14.8063 2.4668 14.2533 2.4668 12.6143C2.4668 10.9743 2.8918 10.4233 3.7418 9.31826C5.4388 7.11426 8.2848 4.61426 12.4668 4.61426C16.6488 4.61426 19.4948 7.11426 21.1918 9.31826C22.0418 10.4243 22.4668 10.9753 22.4668 12.6143C22.4668 14.2543 22.0418 14.8053 21.1918 15.9103C19.4948 18.1143 16.6488 20.6143 12.4668 20.6143C8.2848 20.6143 5.4388 18.1143 3.7418 15.9103Z" stroke="#CC3399" strokeWidth="1.5" />
                                        <path d="M15.4668 12.6143C15.4668 13.4099 15.1507 14.173 14.5881 14.7356C14.0255 15.2982 13.2624 15.6143 12.4668 15.6143C11.6711 15.6143 10.9081 15.2982 10.3455 14.7356C9.78287 14.173 9.4668 13.4099 9.4668 12.6143C9.4668 11.8186 9.78287 11.0555 10.3455 10.4929C10.9081 9.93033 11.6711 9.61426 12.4668 9.61426C13.2624 9.61426 14.0255 9.93033 14.5881 10.4929C15.1507 11.0555 15.4668 11.8186 15.4668 12.6143Z" stroke="#CC3399" strokeWidth="1.5" />
                                    </svg>
                                ) : (
                                    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.5" d="M3.7418 15.9103C2.8918 14.8063 2.4668 14.2533 2.4668 12.6143C2.4668 10.9743 2.8918 10.4233 3.7418 9.31826C5.4388 7.11426 8.2848 4.61426 12.4668 4.61426C16.6488 4.61426 19.4948 7.11426 21.1918 9.31826C22.0418 10.4243 22.4668 10.9753 22.4668 12.6143C22.4668 14.2543 22.0418 14.8053 21.1918 15.9103C19.4948 18.1143 16.6488 20.6143 12.4668 20.6143C8.2848 20.6143 5.4388 18.1143 3.7418 15.9103Z" stroke="#CC3399" strokeWidth="1.5" />
                                        <path d="M9.4668 12.6143C9.4668 13.4099 9.78287 14.173 10.3455 14.7356C10.9081 15.2982 11.6711 15.6143 12.4668 15.6143C13.2624 15.6143 14.0255 15.2982 14.5881 14.7356C15.1507 14.173 15.4668 13.4099 15.4668 12.6143C15.4668 11.8186 15.1507 11.0555 14.5881 10.4929C14.0255 9.93033 13.2624 9.61426 12.4668 9.61426C11.6711 9.61426 10.9081 9.93033 10.3455 10.4929C9.78287 11.0555 9.4668 11.8186 9.4668 12.6143Z" stroke="#CC3399" strokeWidth="1.5" />
                                        <path d="M5.75 5.75L19.25 19.25" stroke="#CC3399" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                )}
                            </span>
                        </div>
                        <button className="button" onClick={handleSavePassword}>
                            KAYDET
                        </button>
                    </>
                )}
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