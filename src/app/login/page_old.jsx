"use client";

import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import ubeyazlogo from "../../images/ubeyaz.png";
import appleIcon from "../../images/apple-icon.svg";
import '../css/auth.css';

export default function AuthPage() {
const router = useRouter();
const [isActive, setIsActive] = useState(false);
const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const [isPolicyOpen, setPolicyOpen] = useState(false);
const [activePolicy, setActivePolicy] = useState(null);

const [loginData, setLoginData] = useState({
    eposta: "",
    sifre: "",
    rememberMe: false
});

const [registerData, setRegisterData] = useState({
    eposta: "",
    dogum_tarihi: "",
    telefon: "",
    sifre: "",
    kullanici_adi: ""
});

const [loginError, setLoginError] = useState("");

useEffect(() => {
    async function checkSession() {
        try {
            const res = await fetch("/api/sessioncheck.php", {
                credentials: "include",
            });
            const resultText = await res.text();
            const result = JSON.parse(resultText);
            if (result.authenticated) {
                router.push("/dashboard");
            }
        } catch (err) {
            console.error("Session check error:", err);
        }
    }
    checkSession();
}, [router]);

const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
        const dataToSend = new FormData();
        dataToSend.append("data", JSON.stringify({
            action: "google_login",
            google_token: credentialResponse.credential 
        }));

        const res = await fetch("/api/login-google.php", {
            method: "POST",
            body: dataToSend,
        });

        const resultText = await res.text();
        const result = JSON.parse(resultText);
        if (result.success) {
            router.push("/dashboard");
        } else {
            alert("Google girişi başarısız: " + result.message);
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
    formData.append('data', JSON.stringify({
        eposta: loginData.eposta,
        sifre: loginData.sifre,
        rememberMe: loginData.rememberMe
    }));

    try {
        const response = await fetch('/api/login.php', {
            method: 'POST',
            body: formData,
        });
        const resultText = await response.text();
        console.log(resultText);
        const result = JSON.parse(resultText);
        //const result = await response.json();
        if (result.success) {
            router.push("/dashboard");
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
        const res = await fetch("/api/register.php", {
            method: "POST",
            body: formData,
        });
        const resultText = await res.text();
        const result = JSON.parse(resultText);

        if (result.success) {
            alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
            setIsActive(false);
        } else {
            alert("Hata: " + result.message);
        }
    } catch (err) {
        alert("Sunucuyla bağlantı kurulamadı.");
    } finally {
        setLoading(false);
    }
};

const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
        ...prev,
        [name]: value,
        kullanici_adi: name === "eposta" ? value.split('@')[0] : prev.kullanici_adi
    }));
};

const openPolicy = (type) => {
    setActivePolicy(type);
    setPolicyOpen(true);
};

const closePolicy = () => {
    setPolicyOpen(false);
    setActivePolicy(null);
};

return (
    <GoogleOAuthProvider clientId="457680679934-poocs7d0n78r3eq8q53c6sedfdi1dh0c.apps.googleusercontent.com">
        <div className="auth-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Montserrat', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className={`container ${isActive ? "active" : ""}`} id="container">
                
                <div className="form-container sign-up">
                    <form onSubmit={handleRegister}>
                        <h1>Hesap Oluştur</h1>
                        <div className="social-icons">
                            {/* <GoogleLogin 
                                onSuccess={handleGoogleSuccess} 
                                onError={() => console.log('Hata')}
                                type="icon"
                                shape="circle"
                            /> */}
                        </div>
                        <span>veya kayıt için e-posta kullanın</span>
                        <input type="email" name="eposta" placeholder="E-Posta" required value={registerData.eposta} onChange={handleRegisterChange} />
                        <input type="date" name="dogum_tarihi" placeholder="Doğum Tarihi" required value={registerData.dogum_tarihi} onChange={handleRegisterChange} />
                        <input type="tel" name="telefon" placeholder="Telefon Numarası" required value={registerData.telefon} onChange={handleRegisterChange} />
                        <input type="password" name="sifre" placeholder="Şifre" required value={registerData.sifre} onChange={handleRegisterChange} />
                        <button type="submit" style={{marginBottom: "15px"}} disabled={loading}>{loading ? "İşleniyor..." : "Kayıt Ol"}</button>
                        <GoogleLogin 
                            onSuccess={handleGoogleSuccess} 
                            onError={() => console.log('Hata')}
                            type="standard"   // icon yerine normal buton
                            shape="rect"      // circle yerine dikdörtgen
                            theme="filled_black" // siyah arka plan, beyaz yazı
                            />
                    </form>
                </div>

                <div className="form-container sign-in">
                    <form onSubmit={handleLogin}>
                        <div className="logo-section" style={{ marginBottom: '10px' }}>
                            <img src={ubeyazlogo.src} alt="logo" width="60" />
                        </div>
                        <h1>Giriş Yap</h1>
                        <div className="social-icons">
                            {/* <GoogleLogin 
                                onSuccess={handleGoogleSuccess} 
                                onError={() => console.log('Hata')}
                                type="icon"
                                shape="circle"
                            /> */}
                        </div>
                        <span>veya e-posta şifrenizi kullanın</span>
                        {loginError && <p style={{ color: 'red', fontSize: '12px' }}>{loginError}</p>}
                        <input type="email" placeholder="E-posta" required value={loginData.eposta} onChange={(e) => setLoginData({...loginData, eposta: e.target.value})} />
                        <div style={{ width: '100%', position: 'relative' }}>
                            <input type={showPassword ? "text" : "password"} placeholder="Şifre" required value={loginData.sifre} onChange={(e) => setLoginData({...loginData, sifre: e.target.value})} />
                            <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '15px', cursor: 'pointer', fontSize: '16px' }}>
                                {showPassword ? <FaEyeSlash color="gray" /> : <FaEye color="pink" />}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%', marginBottom: '10px' }}>
                            <input 
                                type="checkbox" 
                                id="rememberMe" 
                                checked={loginData.rememberMe} 
                                onChange={(e) => setLoginData({...loginData, rememberMe: e.target.checked})} 
                                style={{ width: 'auto', margin: 0 }}
                            />
                            <label htmlFor="rememberMe" style={{ fontSize: '12px', cursor: 'pointer' }}>Beni Hatırla</label>
                        </div>
                        <a id="forgotPasswordLink" href="/forgot-password">Şifremi Unuttum?</a>
                        <button type="submit" style={{marginBottom: "15px"}} disabled={loading}>{loading ? "Giriş Yapılıyor..." : "Giriş Yap"}</button>
                        <GoogleLogin 
                            onSuccess={handleGoogleSuccess} 
                            onError={() => console.log('Hata')}
                            type="standard"   // icon yerine normal buton
                            shape="rect"      // circle yerine dikdörtgen
                            theme="filled_black" // siyah arka plan, beyaz yazı
                            />
                    </form>
                </div>

                <div className="toggle-container">
                    <div className="toggle">
                        <div className="toggle-panel toggle-left">
                            <h1>Tekrar Merhaba!</h1>
                            <p>Tüm özelliklerimizi kullanmak için kişisel bilgilerinizle giriş yapın</p>
                            <button className="hidden" onClick={() => setIsActive(false)}>Giriş Yap</button>
                        </div>
                        <div className="toggle-panel toggle-right">
                            <h1>Selam Dostum!</h1>
                            <p>Kişisel bilgilerinizle kayıt olun ve tüm site özelliklerini kullanmaya başlayın</p>
                            <button className="hidden" onClick={() => setIsActive(true)}>Kayıt Ol</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
                    <p className="terms" style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', fontFamily: 'Montserrat', width: '100%', display: 'block', position: 'relative', top: '-100px' }}>
                DEVAM EDEREK LUMANORIS’İN{" "}
                <button style={{ background: 'none', border: 'none', color: '#512da8', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => openPolicy("terms")}>KULLANIM KOŞULLARI</button> VE{" "}
                <button style={{ background: 'none', border: 'none', color: '#512da8', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => openPolicy("privacy")}>GİZLİLİK POLİTİKASI</button>{" "}
                İLE AYNI FİKİRDE OLDUĞUNUZU KABUL ETMİŞ OLURSUNUZ.
            </p>

        {isPolicyOpen && (
            <div className="policy-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={closePolicy}>
                <div className="policy-panel" style={{ background: 'rgb(20,24,27)', padding: '30px', borderRadius: '20px', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                    <div className="policy-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3>{activePolicy === "terms" ? "Kullanım Koşulları" : "Gizlilik Politikası"}</h3>
                        <button onClick={closePolicy} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                    </div>
                    <div className="policy-content">
                        {activePolicy === "terms" ? (
                            <div>
                                <h1>Kullanım Koşulları</h1>
                                <p><strong>Son Güncelleme:</strong> 24 Temmuz 2025</p>
                                <h2>1. Kabul Şartları</h2>
                                <p>LUMANORIS platformuna erişerek veya hizmetleri kullanarak, koşulları kabul etmiş olursunuz.</p>
                                <h2>2. Hizmet Tanımı</h2>
                                <p>LUMANORIS; bireylerin ve kurumların kendi yapay zekâ sohbet modellerini oluşturabildiği merkeziyetsiz bir platformdur.</p>
                                <h2>3. Kullanıcı Sorumlulukları</h2>
                                <p>Kullanıcılar, platformu yürürlükteki yasalara ve genel ahlak kurallarına uygun şekilde kullanmakla yükümlüdür.</p>
                                <h2>4. Fikri Mülkiyet Hakları</h2>
                                <p>LUMANORIS platformu ve içeriği fikri mülkiyet yasalarıyla korunmaktadır.</p>
                            </div>
                        ) : (
                            <div>
                                <h1>Gizlilik Politikası</h1>
                                <p><strong>Son Güncelleme:</strong> 24 Temmuz 2025</p>
                                <h2>1. Giriş</h2>
                                <p>Bu Gizlilik Politikası kişisel verilerinizin nasıl toplandığını ve işlendiğini açıklar.</p>
                                <h2>2. Toplanan Bilgiler</h2>
                                <ul>
                                    <li>Hesap Bilgileri (Ad, E-posta, Kullanıcı Adı, Şifre)</li>
                                    <li>Cihaz ve Bağlantı Bilgileri</li>
                                    <li>Etkileşim Verileri</li>
                                </ul>
                                <h2>3. Bilgilerin Kullanım Amaçları</h2>
                                <p>Veriler, hesap doğrulaması, hizmet sunumu ve teknik destek amacıyla kullanılır.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </GoogleOAuthProvider>
);

}