"use client";
import { useState } from "react";
import ubeyazlogo from "../../images/ubeyaz.png";
import { useRouter } from "next/navigation";
import Alert from "../components/Alert";

export default function ForgotPassword() {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
    const [email, setEmail] = useState("");
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
    const handleSendCode = () => {
        if (!email.trim()) {
            showAlert("E-posta adresi boş olamaz.");
            return;
        }

        if (!validateEmail(email)) {
            showAlert("Geçerli bir e-posta adresi girin.");
            return;
        }

        setStep(2);
        showAlert("Doğrulama kodu e-posta adresinize gönderildi.", "success");
    };

    // Handle password save
    const handleSavePassword = () => {
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

        // Here you would typically make an API call to save the new password
        // For now, we'll just redirect
        showAlert("Şifreniz başarıyla güncellendi.", "success");
        setTimeout(() => {
            router.push("/dashboard");
        }, 1500);
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
                            Hesabınız için yeni bir şifre oluşturun.
                        </p>

                        <div className="password-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="YENİ ŞİFRE BELİRLE"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <span onClick={() => setShowPassword(!showPassword)}>
                                <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path opacity="0.5" d="M3.7418 15.9103C2.8918 14.8063 2.4668 14.2533 2.4668 12.6143C2.4668 10.9743 2.8918 10.4233 3.7418 9.31826C5.4388 7.11426 8.2848 4.61426 12.4668 4.61426C16.6488 4.61426 19.4948 7.11426 21.1918 9.31826C22.0418 10.4243 22.4668 10.9753 22.4668 12.6143C22.4668 14.2543 22.0418 14.8053 21.1918 15.9103C19.4948 18.1143 16.6488 20.6143 12.4668 20.6143C8.2848 20.6143 5.4388 18.1143 3.7418 15.9103Z" stroke="#CC3399" strokeWidth="1.5" />
                                    <path d="M15.4668 12.6143C15.4668 13.4099 15.1507 14.173 14.5881 14.7356C14.0255 15.2982 13.2624 15.6143 12.4668 15.6143C11.6711 15.6143 10.9081 15.2982 10.3455 14.7356C9.78287 14.173 9.4668 13.4099 9.4668 12.6143C9.4668 11.8186 9.78287 11.0555 10.3455 10.4929C10.9081 9.93033 11.6711 9.61426 12.4668 9.61426C13.2624 9.61426 14.0255 9.93033 14.5881 10.4929C15.1507 11.0555 15.4668 11.8186 15.4668 12.6143Z" stroke="#CC3399" strokeWidth="1.5" />
                                </svg>
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
                                <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path opacity="0.5" d="M3.7418 15.9103C2.8918 14.8063 2.4668 14.2533 2.4668 12.6143C2.4668 10.9743 2.8918 10.4233 3.7418 9.31826C5.4388 7.11426 8.2848 4.61426 12.4668 4.61426C16.6488 4.61426 19.4948 7.11426 21.1918 9.31826C22.0418 10.4243 22.4668 10.9753 22.4668 12.6143C22.4668 14.2543 22.0418 14.8053 21.1918 15.9103C19.4948 18.1143 16.6488 20.6143 12.4668 20.6143C8.2848 20.6143 5.4388 18.1143 3.7418 15.9103Z" stroke="#CC3399" strokeWidth="1.5" />
                                    <path d="M15.4668 12.6143C15.4668 13.4099 15.1507 14.173 14.5881 14.7356C14.0255 15.2982 13.2624 15.6143 12.4668 15.6143C11.6711 15.6143 10.9081 15.2982 10.3455 14.7356C9.78287 14.173 9.4668 13.4099 9.4668 12.6143C9.4668 11.8186 9.78287 11.0555 10.3455 10.4929C10.9081 9.93033 11.6711 9.61426 12.4668 9.61426C13.2624 9.61426 14.0255 9.93033 14.5881 10.4929C15.1507 11.0555 15.4668 11.8186 15.4668 12.6143Z" stroke="#CC3399" strokeWidth="1.5" />
                                </svg>
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