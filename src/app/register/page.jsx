"use client";
import ubeyazlogo from "../../images/ubeyaz.png";
import googleIcon from "../../images/google-icon.svg";
import appleIcon from "../../images/apple-icon.svg";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, useGoogleLogin, GoogleLogin } from '@react-oauth/google';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [isPolicyOpen, setPolicyOpen] = useState(false);
    const [activePolicy, setActivePolicy] = useState(null); // "terms" | "privacy"
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const [formData, setFormData] = useState({
        eposta: "",
        dogum_tarihi: "",
        telefon: "",
        sifre: "",
        kullanici_adi: "" // PHP modülün bunu bekliyor, istersen e-postayı kullanıcı adı yapabilirsin
    });

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            const dataToSend = new FormData();
            // Google'ın verdiği o meşhur karmaşık token'ı direkt PHP'ye yolluyoruz
            dataToSend.append("data", JSON.stringify({
                action: "google_login",
                google_token: credentialResponse.credential 
            }));
            for (const [key, value] of dataToSend.entries()) {
                console.log(key, value);
            }


            const res = await fetch("/api/login-google.php", { // PHP dosyanın yolu
                method: "POST",
                body: dataToSend,
            });

            const resultText = await res.text();
            console.log(resultText);
            const result = JSON.parse(resultText);
            //const result = await res.json();
            if (result.success) {
                alert(result.message);
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Eğer kullanıcı adı alanı yoksa, e-postayı kullanıcı adı olarak setleyebiliriz:
            kullanici_adi: name === "eposta" ? value.split('@')[0] : prev.kullanici_adi
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Sayfa yenilenmesini engelle
        setLoading(true);

        try {
            const dataToSend = new FormData();
            // PHP tarafı $_POST['data'] beklediği için JSON string yapıyoruz
            dataToSend.append("data", JSON.stringify(formData));

            const res = await fetch("/api/register.php", {
                method: "POST",
                body: dataToSend,
            });

            const resultText = await res.text();
            console.log(resultText);
            const result = JSON.parse(resultText);
            //const result = await res.json();

            if (result.success) {
                alert("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz.");
                router.push("/login");
            } else {
                alert("Hata: " + result.message);
            }
        } catch (err) {
            console.error("Kayıt hatası:", err);
            alert("Sunucuyla bağlantı kurulamadı.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
                async function checkSession() {
                    try {
                        const res = await fetch("/api/sessioncheck.php", {
                        credentials: "include", // cookie'yi gönder
                        });
                        const resultText = await res.text();
                        console.log(resultText);
                        const result = JSON.parse(resultText);
            
                        if (result.authenticated) {
                        router.push("/dashboard");
                        }
                    } catch (err) {
                        console.error("Session check error:", err);
                        router.push("/dashboard");
                    }
                }
                checkSession();
            }, [router]);

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
            <div className="register-content">
            <div className="register-box">
                <div className="logo">
                    <div className="shadow">
                        <svg width="259" height="237" viewBox="0 0 259 237" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g filter="url(#filter0_f_7772_13517)">
                                <circle cx="129.496" cy="107.494" r="44.4356" fill="url(#paint0_linear_7772_13517)" />
                            </g>
                            <defs>
                                <filter id="filter0_f_7772_13517" x="0.430855" y="-21.5711" width="258.13" height="258.13" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                    <feGaussianBlur stdDeviation="42.3148" result="effect1_foregroundBlur_7772_13517" />
                                </filter>
                                <linearGradient id="paint0_linear_7772_13517" x1="103.239" y1="124.663" x2="148.179" y2="90.8309" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FF66C4" />
                                    <stop offset="1" stop-color="#4699FF" />
                                </linearGradient>
                            </defs>
                        </svg>

                    </div>
                    <div className="logo-inner">
                        <img src={ubeyazlogo.src} alt="logo" />
                    </div>
                </div>

                <h2 className="title">KAYIT OL</h2>

                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <div className="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
                                <path d="M12.5332 13.1836L4.5332 8.18359V18.1836H20.5332V8.18359L12.5332 13.1836Z" fill="#FF66C4" fill-opacity="0.27" />
                                <path d="M4.5332 5.18359H20.5332C21.0832 5.18359 21.5332 5.63359 21.5332 6.18359V18.1836C21.5332 18.7336 21.0832 19.1836 20.5332 19.1836H4.5332C3.9832 19.1836 3.5332 18.7336 3.5332 18.1836V6.18359C3.5332 5.63359 3.9832 5.18359 4.5332 5.18359Z" stroke="#FF66C4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3.5332 6.68359L12.5332 12.1836L21.5332 6.68359" stroke="#FF66C4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>

                        </div>
                        <input type="email" name="eposta" placeholder="E-POSTA ADRESİNİZİ GİRİN" required value={formData.eposta} onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <div className="icon">
                            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.5" d="M22.5332 10.2734H2.5332V19.2734C2.5332 20.0691 2.84927 20.8321 3.41188 21.3948C3.97449 21.9574 4.73755 22.2734 5.5332 22.2734H19.5332C20.3289 22.2734 21.0919 21.9574 21.6545 21.3948C22.2171 20.8321 22.5332 20.0691 22.5332 19.2734V10.2734ZM7.5332 8.27344C7.26799 8.27344 7.01363 8.16808 6.8261 7.98054C6.63856 7.79301 6.5332 7.53865 6.5332 7.27344V3.27344C6.5332 3.00822 6.63856 2.75387 6.8261 2.56633C7.01363 2.37879 7.26799 2.27344 7.5332 2.27344C7.79842 2.27344 8.05277 2.37879 8.24031 2.56633C8.42785 2.75387 8.5332 3.00822 8.5332 3.27344V7.27344C8.5332 7.53865 8.42785 7.79301 8.24031 7.98054C8.05277 8.16808 7.79842 8.27344 7.5332 8.27344ZM17.5332 8.27344C17.268 8.27344 17.0136 8.16808 16.8261 7.98054C16.6386 7.79301 16.5332 7.53865 16.5332 7.27344V3.27344C16.5332 3.00822 16.6386 2.75387 16.8261 2.56633C17.0136 2.37879 17.268 2.27344 17.5332 2.27344C17.7984 2.27344 18.0528 2.37879 18.2403 2.56633C18.4278 2.75387 18.5332 3.00822 18.5332 3.27344V7.27344C18.5332 7.53865 18.4278 7.79301 18.2403 7.98054C18.0528 8.16808 17.7984 8.27344 17.5332 8.27344Z" fill="#FF66C4" />
                                <path d="M19.5332 4.27344H18.5332V7.27344C18.5332 7.53865 18.4278 7.79301 18.2403 7.98054C18.0528 8.16808 17.7984 8.27344 17.5332 8.27344C17.268 8.27344 17.0136 8.16808 16.8261 7.98054C16.6386 7.79301 16.5332 7.53865 16.5332 7.27344V4.27344H8.5332V7.27344C8.5332 7.53865 8.42785 7.79301 8.24031 7.98054C8.05277 8.16808 7.79842 8.27344 7.5332 8.27344C7.26799 8.27344 7.01363 8.16808 6.8261 7.98054C6.63856 7.79301 6.5332 7.53865 6.5332 7.27344V4.27344H5.5332C4.73755 4.27344 3.97449 4.58951 3.41188 5.15212C2.84927 5.71473 2.5332 6.47779 2.5332 7.27344V10.2734H22.5332V7.27344C22.5332 6.47779 22.2171 5.71473 21.6545 5.15212C21.0919 4.58951 20.3289 4.27344 19.5332 4.27344Z" fill="#FF66C4" />
                            </svg>
                        </div>
                        <input type="date" name="dogum_tarihi" placeholder="DOĞUM TARİHİ" required value={formData.dogum_tarihi} onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <div className="icon">
                            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.4802 16.8793L6.1402 17.2593C4.3152 17.7773 2.5332 16.2723 2.5332 14.2123C2.5332 12.9753 2.8102 11.7353 3.6162 10.8653C4.6612 9.7383 6.5332 8.2703 9.5332 7.6543V13.9803C9.5332 15.3453 8.6892 16.5353 7.4802 16.8793ZM15.5332 13.9803C15.5332 15.3453 16.3772 16.5363 17.5862 16.8803L18.9262 17.2603C20.7512 17.7763 22.5332 16.2723 22.5332 14.2123C22.5332 12.9753 22.2562 11.7353 21.4502 10.8653C20.4052 9.7383 18.5332 8.2703 15.5332 7.6543V13.9803Z" fill="#FF99D6" />
                                <path opacity="0.5" d="M9.5332 13.9804C9.5332 13.9804 9.5332 12.3254 12.5332 12.3254C15.5332 12.3254 15.5332 13.9794 15.5332 13.9794V7.65343C14.5455 7.45561 13.5405 7.35779 12.5332 7.36143C11.4272 7.36143 10.4302 7.46943 9.5332 7.65343V13.9804Z" fill="#FF99D6" />
                            </svg>

                        </div>
                        <input type="tel" name="telefon" placeholder="NUMARA" required value={formData.telefon} onChange={handleChange} />
                    </div>

                    <div className="input-group password">
                        <div className="icon">
                            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M22.5336 8.74417C22.5336 12.2202 19.7036 15.0382 16.2136 15.0382C15.5776 15.0382 14.1276 14.8922 13.4226 14.3062L12.5406 15.1842C12.0216 15.7012 12.1616 15.8532 12.3926 16.1032C12.4886 16.2082 12.6006 16.3292 12.6876 16.5022C12.6876 16.5022 13.4226 17.5262 12.6876 18.5512C12.2466 19.1362 11.0116 19.9552 9.60165 18.5512L9.30765 18.8432C9.30765 18.8432 10.1886 19.8682 9.45465 20.8932C9.01365 21.4782 7.83765 22.0632 6.80865 21.0392L5.78065 22.0632C5.07465 22.7662 4.21265 22.3562 3.87065 22.0632L2.98765 21.1852C2.16465 20.3652 2.64465 19.4772 2.98765 19.1352L10.6296 11.5252C10.6296 11.5252 9.89465 10.3552 9.89465 8.74517C9.89465 5.26917 12.7246 2.45117 16.2146 2.45117C19.7046 2.45117 22.5336 5.26917 22.5336 8.74417Z" fill="#FF66C4" />
                                <path d="M18.4178 8.74483C18.4164 9.32813 18.1835 9.88704 17.7702 10.2987C17.3569 10.7103 16.7971 10.9409 16.2138 10.9398C15.6305 10.9409 15.0706 10.7103 14.6573 10.2987C14.244 9.88704 14.0111 9.32813 14.0098 8.74483C14.0103 8.45592 14.0677 8.16995 14.1788 7.90323C14.2898 7.63652 14.4523 7.39429 14.657 7.19037C14.8616 6.98645 15.1044 6.82484 15.3716 6.71476C15.6387 6.60469 15.9249 6.54831 16.2138 6.54883C16.5027 6.54831 16.7889 6.60469 17.056 6.71476C17.3231 6.82484 17.5659 6.98645 17.7706 7.19037C17.9752 7.39429 18.1377 7.63652 18.2488 7.90323C18.3598 8.16995 18.4172 8.45592 18.4178 8.74483Z" fill="#FF66C4" />
                            </svg>

                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="ŞİFRE BELİRLE" name="sifre" required value={formData.sifre} onChange={handleChange}
                        /> 
                        <div
                            className="eye-icon"
                            onClick={() => setShowPassword(prev => !prev)}
                            style={{ cursor: "pointer" }}
                        >
                            {/* Göster/Gizle ikon değişimi */}
                            {showPassword ? (
                                <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
                                    {/* Eye Open Icon */}
                                    <path d="M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.35 9 9 10.35 9 12C9 13.65 10.35 15 12 15C13.65 15 15 13.65 15 12C15 10.35 13.65 9 12 9Z" fill="#CC3399" />
                                </svg>
                            ) : (
                                <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
                                    {/* Eye Closed Icon */}
                                    <path d="M12 5C7 5 2.73 8.11 1 12C1.78 13.62 2.94 15.09 4.41 16.26L2 18.67L3.41 20.08L5.83 17.66C7.14 18.36 8.55 18.79 10 18.94V21H14V18.94C15.45 18.79 16.86 18.36 18.17 17.66L20.59 20.08L22 18.67L19.59 16.26C21.06 15.09 22.22 13.62 23 12C21.27 8.11 17 5 12 5Z" fill="#CC3399" />
                                </svg>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="register-btn">
                        KAYIT YAP
                    </button>

                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => console.log('Giriş Başarısız')}
                        useOneTap // İstersen sağ üstte "X olarak devam et" penceresini açar
                        theme="filled_blue"
                        shape="pill"
                        locale="tr"
                    />
                    {/* <button type="button" className="social-btn google">
                        <div className="shadow"><svg xmlns="http://www.w3.org/2000/svg" width="76" height="49" viewBox="0 0 76 49" fill="none">
                            <g filter="url(#filter0_f_7772_13560)">
                                <circle cx="8" cy="3.49414" r="18" fill="url(#paint0_linear_7772_13560)" />
                            </g>
                            <defs>
                                <filter id="filter0_f_7772_13560" x="-59.5" y="-64.0059" width="135" height="135" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                    <feGaussianBlur stdDeviation="24.75" result="effect1_foregroundBlur_7772_13560" />
                                </filter>
                                <linearGradient id="paint0_linear_7772_13560" x1="29.0789" y1="29.9343" x2="-9.51837" y2="-20.3863" gradientUnits="userSpaceOnUse">
                                    <stop offset="0.211538" stop-color="#FF66C4" />
                                    <stop offset="1" stop-color="#4699FF" />
                                </linearGradient>
                            </defs>
                        </svg></div>
                        <div className="icon">
                            <img src={googleIcon.src} alt="" />
                        </div>
                        <span>
                            GOOGLE İLE DEVAM ET
                        </span>
                    </button> */}

                    <button type="button" className="social-btn apple">
                        <div className="shadow"><svg xmlns="http://www.w3.org/2000/svg" width="76" height="49" viewBox="0 0 76 49" fill="none">
                            <g filter="url(#filter0_f_7772_13560)">
                                <circle cx="8" cy="3.49414" r="18" fill="url(#paint0_linear_7772_13560)" />
                            </g>
                            <defs>
                                <filter id="filter0_f_7772_13560" x="-59.5" y="-64.0059" width="135" height="135" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                    <feGaussianBlur stdDeviation="24.75" result="effect1_foregroundBlur_7772_13560" />
                                </filter>
                                <linearGradient id="paint0_linear_7772_13560" x1="29.0789" y1="29.9343" x2="-9.51837" y2="-20.3863" gradientUnits="userSpaceOnUse">
                                    <stop offset="0.211538" stop-color="#FF66C4" />
                                    <stop offset="1" stop-color="#4699FF" />
                                </linearGradient>
                            </defs>
                        </svg></div>
                        <div className="icon">
                            <img src={appleIcon.src} alt="" />
                        </div>
                        <span>
                            APPLE İLE DEVAM ET
                        </span>
                    </button>
                </form>

                <p className="terms">
                    DEVAM EDEREK POE’UN{" "}
                    <button onClick={() => openPolicy("terms")}>KULLANIM KOŞULLARI</button> VE{" "}
                    <button onClick={() => openPolicy("privacy")}>GİZLİLİK POLİTİKASI</button>{" "}
                    İLE AYNI FİKİRDE OLDUĞUNUZU KABUL ETMİŞ OLURSUNUZ.
                </p>
            </div>

            {isPolicyOpen && (
                <div className="policy-overlay" onClick={closePolicy}>
                    <div className="policy-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="policy-header">
                            <h3>{activePolicy === "terms" ? "Kullanım Koşulları" : "Gizlilik Politikası"}</h3>
                            <button onClick={closePolicy}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.0008 13.4008L7.10078 18.3008C6.91745 18.4841 6.68411 18.5758 6.40078 18.5758C6.11745 18.5758 5.88411 18.4841 5.70078 18.3008C5.51745 18.1174 5.42578 17.8841 5.42578 17.6008C5.42578 17.3174 5.51745 17.0841 5.70078 16.9008L10.6008 12.0008L5.70078 7.10078C5.51745 6.91745 5.42578 6.68411 5.42578 6.40078C5.42578 6.11745 5.51745 5.88411 5.70078 5.70078C5.88411 5.51745 6.11745 5.42578 6.40078 5.42578C6.68411 5.42578 6.91745 5.51745 7.10078 5.70078L12.0008 10.6008L16.9008 5.70078C17.0841 5.51745 17.3174 5.42578 17.6008 5.42578C17.8841 5.42578 18.1174 5.51745 18.3008 5.70078C18.4841 5.88411 18.5758 6.11745 18.5758 6.40078C18.5758 6.68411 18.4841 6.91745 18.3008 7.10078L13.4008 12.0008L18.3008 16.9008C18.4841 17.0841 18.5758 17.3174 18.5758 17.6008C18.5758 17.8841 18.4841 18.1174 18.3008 18.3008C18.1174 18.4841 17.8841 18.5758 17.6008 18.5758C17.3174 18.5758 17.0841 18.4841 16.9008 18.3008L12.0008 13.4008Z" fill="#FF99D6" />
                                </svg>
                            </button>
                        </div>
                        <div className="policy-content">
                            {activePolicy === "terms" ? <div><h1>Kullanım Koşulları</h1>
            <p><strong>Son Güncelleme:</strong> 24 Temmuz 2025</p>

            <h2>1. Kabul Şartları</h2>
            <p>
                LUMANORIS platformuna erişerek veya hizmetleri kullanarak, aşağıda belirtilen tüm kullanım koşullarını okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
                Koşulları kabul etmiyorsanız lütfen platformu kullanmayınız.
            </p>

            <h2>2. Hizmet Tanımı</h2>
            <p>
                LUMANORIS; bireylerin ve kurumların kendi yapay zekâ sohbet modellerini oluşturabildiği, paylaşabildiği ve gelir elde edebildiği merkeziyetsiz bir dijital platformdur.
                Sunulan içeriklerin ve çıktılarının bilgi verme amaçlı olduğu, herhangi bir profesyonel tavsiye yerine geçmediği kullanıcı tarafından kabul edilir.
            </p>

            <h2>3. Kullanıcı Sorumlulukları</h2>
            <ul>
                <li>Kullanıcılar, platformu yürürlükteki yasalara ve genel ahlak kurallarına uygun şekilde kullanmakla yükümlüdür.</li>
                <li>Hesap bilgilerinin güvenliğinden kullanıcı sorumludur.</li>
                <li>Platformda oluşturulan veya paylaşılan içeriklerin hukuka aykırı, zararlı, yanıltıcı ya da üçüncü kişilerin haklarını ihlal edici olmaması gerekir.</li>
                <li>AI modelleriyle yapılan etkileşimlerde gizli veya kişisel hassas bilgiler paylaşılmamalıdır.</li>
            </ul>

            <h2>4. Fikri Mülkiyet Hakları</h2>
            <p>
                LUMANORIS platformu ve içeriği (yazılım, tasarım, logo, metinler, görseller vb.) telif hakkı ve ilgili fikri mülkiyet yasalarıyla korunmaktadır.
            </p>
            <ul>
                <li>Kullanıcılar, LUMANORIS içeriğini yazılı izin almadan kopyalayamaz, dağıtamaz veya ticari amaçla kullanamaz.</li>
                <li>
                    Kullanıcılar tarafından oluşturulan AI modelleri, ilgili kullanıcıya ait olmakla birlikte;
                    LUMANORIS, bu modelleri platformda tanıtım veya iyileştirme amacıyla kullanabilir (kullanıcı sözleşmesi kapsamında).
                </li>
            </ul>

            <h2>5. Sınırlı Sorumluluk</h2>
            <ul>
                <li>Platform, sunulan hizmetlerin sürekli, kesintisiz veya hatasız olacağını garanti etmez.</li>
                <li>LUMANORIS, teknik aksaklıklar, veri kaybı, üçüncü taraf yazılımlardan kaynaklı arızalar veya kullanıcı kaynaklı hatalardan doğan zararlardan sorumlu tutulamaz.</li>
                <li>Kullanıcılar, AI modellerinden alınan yanıtlardan veya bu yanıtlar doğrultusunda alınan kararlardan tamamen kendileri sorumludur.</li>
            </ul>

            <h2>6. Değişiklik Hakkı</h2>
            <p>
                LUMANORIS, bu kullanım koşullarını dilediği zaman, önceden haber vermeksizin değiştirme hakkını saklı tutar.
                Güncellenen koşullar, platformda yayımlandığı anda yürürlüğe girer.
                Kullanıcıların periyodik olarak bu koşulları kontrol etmesi önerilir.
            </p>

            <h2>7. İletişim</h2>
            <p>Koşullarla ilgili sorularınız veya geri bildirimleriniz için bizimle iletişime geçebilirsiniz:</p>
            <ul>
                <li>E-posta: <a href="mailto:lumanoris.ai@gmail.com">lumanoris.ai@gmail.com</a></li>
                <li>Web: <a href="https://www.lumanoris.com/kullanim-kosullari" target="_blank">www.lumanoris.com/kullanim-kosullari</a></li>
            </ul></div> : <div><h1>Gizlilik Politikası</h1>
                                <p><strong>Son Güncelleme:</strong> 24 Temmuz 2025</p>

                                <h2>1. Giriş</h2>
                                <p>Bu Gizlilik Politikası, LUMANORIS (“biz”, “platform”, “şirket”) tarafından sunulan hizmetleri kullandığınızda kişisel verilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklar.</p>
                                <p>LUMANORIS, bireylerin ve kurumların kendi yapay zeka sohbet modellerini geliştirebildiği, paylaşabildiği ve gelir elde edebildiği merkeziyetsiz bir platformdur.</p>

                                <h2>2. Toplanan Bilgiler</h2>
                                <h3>a. Hesap Bilgileri</h3>
                                <ul>
                                    <li>Ad, soyad</li>
                                    <li>E-posta adresi</li>
                                    <li>Kullanıcı adı</li>
                                    <li>Şifre (şifrelenmiş olarak)</li>
                                    <li>Doğum tarihi (yaş doğrulaması için)</li>
                                </ul>

                                <h3>b. Cihaz ve Bağlantı Bilgileri</h3>
                                <ul>
                                    <li>Tarayıcı türü ve sürümü</li>
                                    <li>İşletim sistemi</li>
                                    <li>Cihaz türü</li>
                                    <li>IP adresi ve yaklaşık konum</li>
                                    <li>Oturum bilgileri ve işlem geçmişi</li>
                                </ul>

                                <h3>c. Etkileşim Verileri</h3>
                                <ul>
                                    <li>Sohbet geçmişiniz</li>
                                    <li>Platform içi arama ve gezinme davranışları</li>
                                    <li>Bot kullanım istatistikleri</li>
                                    <li>Kullanıcı destek talepleri ve geri bildirimler</li>
                                </ul>

                                <h3>d. Ödeme Bilgileri (içerik üreticiler ve abone kullanıcılar için)</h3>
                                <ul>
                                    <li>Fatura bilgileri</li>
                                    <li>Kredi kartı veya ödeme aracı bilgileri (güvenli ödeme sağlayıcılar üzerinden)</li>
                                    <li>Vergi kimlik numarası ve adres (içerik üreticiler için)</li>
                                </ul>

                                <h2>3. Bilgilerin Kullanım Amaçları</h2>
                                <p>Toplanan veriler şu amaçlarla kullanılır:</p>
                                <ul>
                                    <li>Hesap oluşturmak ve kimlik doğrulamak</li>
                                    <li>Hizmet sunmak ve kişiselleştirmek</li>
                                    <li>Teknik sorunları tespit etmek ve çözmek</li>
                                    <li>Kullanıcı destek hizmetleri sunmak</li>
                                    <li>Geliştirme ve analiz yapmak</li>
                                    <li>Abonelik işlemlerini yürütmek</li>
                                    <li>Gelir dağıtımı ve vergi yükümlülüklerini yerine getirmek</li>
                                    <li>Yasal yükümlülüklere uymak</li>
                                    <li>Pazarlama ve reklam faaliyetlerini optimize etmek (onayınız dâhilinde)</li>
                                </ul>

                                <h2>4. Çerezler ve Benzeri Teknolojiler</h2>
                                <p>LUMANORIS, kullanıcı deneyimini geliştirmek ve analiz yapmak için çerezler (cookies) kullanır.</p>
                                <p>Tarayıcınızdan çerezleri devre dışı bırakabilirsiniz, ancak bu bazı özelliklerin çalışmasını etkileyebilir.</p>
                                <p>Kullandığımız çerez türleri:</p>
                                <ul>
                                    <li>Oturum çerezleri</li>
                                    <li>Analitik çerezler</li>
                                    <li>Pazarlama çerezleri (izninizle)</li>
                                </ul>
                                <p><strong>Not:</strong> Sitemiz henüz çerez kullanmamaktadır ancak ilerleyen süreçte kullanıcı deneyimini iyileştirmek adına çerezler devreye alınabilir.</p>

                                <h2>5. Üçüncü Taraflarla Paylaşım</h2>
                                <p>Kişisel verileriniz, yalnızca aşağıdaki durumlarda üçüncü taraflarla paylaşılır:</p>
                                <ul>
                                    <li>Hizmet sağlayıcılarla</li>
                                    <li>Yasal yükümlülüklerin yerine getirilmesi gerektiğinde</li>
                                    <li>İçerik üreticilerine gelir ödemeleri için</li>
                                    <li>AI model sağlayıcılarıyla, yalnızca sohbet etkileşimleri bağlamında (kullanıcı adı veya e-posta paylaşılmaz)</li>
                                </ul>

                                <h2>6. Yapay Zekâ ile Etkileşim</h2>
                                <p>Platform üzerindeki sohbetleriniz, üçüncü taraf yapay zekâ model sağlayıcılarıyla paylaşılabilir.</p>
                                <p>Bu etkileşimler:</p>
                                <ul>
                                    <li>Model çıktılarının iyileştirilmesi</li>
                                    <li>Kişiselleştirme önerilerinin sunulması</li>
                                    <li>Çok kullanıcıya açık sohbetlerde, kullanıcı adı/id bilgisiyle birlikte işlenebilir</li>
                                </ul>
                                <p><strong>Önemli:</strong> Özel, hassas veya kişisel bilgilerinizi sohbet botlarıyla paylaşmanız gerekmez. (Örn: kredi kartı numarası, kimlik bilgisi vs.)</p>

                                <h2>7. Güvenlik</h2>
                                <p>Kişisel verilerinizin güvenliği bizim için önceliklidir.</p>
                                <ul>
                                    <li>Veri şifreleme</li>
                                    <li>Erişim kontrolleri</li>
                                    <li>Güvenlik duvarları ve izleme sistemleri</li>
                                    <li>Düzenli güvenlik denetimleri</li>
                                </ul>

                                <h2>8. Uluslararası Veri Aktarımı</h2>
                                <p>Platformun altyapısı uluslararası sağlayıcılar üzerinden çalışabilir. Avrupa Ekonomik Alanı (EEA) dışına aktarılan veriler, uygun koruma önlemleriyle aktarılır.</p>

                                <h2>9. Veri Saklama Süresi</h2>
                                <p>Kullanıcı verileri, hizmet ilişkisinin sona ermesinden sonra ilgili yasal zorunluluklar ve meşru çıkar süreleri boyunca saklanır ve ardından silinir veya anonimleştirilir.</p>

                                <h2>10. Haklarınız</h2>
                                <p>KVKK, GDPR ve geçerli diğer veri koruma yasaları kapsamında şu haklara sahipsiniz:</p>
                                <ul>
                                    <li>Verilerinize erişme</li>
                                    <li>Düzeltme veya silme talep etme</li>
                                    <li>İşlemeye itiraz etme</li>
                                    <li>Taşınabilirlik talep etme</li>
                                    <li>Onayınızı geri çekme (onaya dayalı işlemler için)</li>
                                </ul>
                                <p>Bu hakları kullanmak için bizimle iletişime geçebilirsiniz.</p>

                                <h2>11. İletişim</h2>
                                <p>Veri koruma ve gizlilikle ilgili her türlü soru için bizimle iletişime geçebilirsiniz:</p>
                                <ul>
                                    <li>E-posta: <a href="mailto:lumanoris.ai@gmail.com">lumanoris.ai@gmail.com</a></li>
                                    <li>İletişim Formu: <a href="https://www.lumanoris.com/iletisim" target="_blank">www.lumanoris.com/iletisim</a></li>
                                </ul></div>}
                        </div>
                    </div>
                </div>
            )}

        </div>
        </GoogleOAuthProvider>
        
    );
}
