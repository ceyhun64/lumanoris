"use client";

import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import ubeyazlogo from "../../images/ubeyaz.png";
import appleIcon from "../../images/apple-icon.svg";
import "../css/auth.css";

export default function AuthPage() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPolicyOpen, setPolicyOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);

  const searchParams = useSearchParams();
  const target = searchParams.get('to') || null;

  const redirectAfterLogin = () => {
    if (target === 'iletisim') {
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
        const res = await fetch("/api/sessioncheck.php", {
          credentials: "include",
        });
        const resultText = await res.text();
        const result = JSON.parse(resultText);
        if (result.authenticated) {
          redirectAfterLogin();
          //router.push("/dashboard");
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
      dataToSend.append(
        "data",
        JSON.stringify({
          action: "google_login",
          google_token: credentialResponse.credential,
        }),
      );

      const res = await fetch("/api/login-google.php", {
        method: "POST",
        body: dataToSend,
      });

      const resultText = await res.text();
      const result = JSON.parse(resultText);
      if (result.success) {
        redirectAfterLogin();
        //router.push("/dashboard");
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
    formData.append(
      "data",
      JSON.stringify({
        eposta: loginData.eposta,
        sifre: loginData.sifre,
        rememberMe: loginData.rememberMe,
      }),
    );

    try {
      const response = await fetch("/api/login.php", {
        method: "POST",
        body: formData,
      });
      const resultText = await response.text();
      const result = JSON.parse(resultText);
      if (result.success) {
        redirectAfterLogin();
        //router.push("/dashboard");
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

    if (name === "telefon") {
      // Sadece rakamları al
      const onlyNums = value.replace(/[^\d]/g, "");

      // Formatlama: 0512 345 67 89
      let formattedMobile = "";
      if (onlyNums.length <= 4) {
        formattedMobile = onlyNums;
      } else if (onlyNums.length <= 7) {
        formattedMobile = `${onlyNums.slice(0, 4)} ${onlyNums.slice(4)}`;
      } else if (onlyNums.length <= 9) {
        formattedMobile = `${onlyNums.slice(0, 4)} ${onlyNums.slice(4, 7)} ${onlyNums.slice(7)}`;
      } else {
        formattedMobile = `${onlyNums.slice(0, 4)} ${onlyNums.slice(4, 7)} ${onlyNums.slice(7, 9)} ${onlyNums.slice(9, 11)}`;
      }

      // State'i güncelle (Sınır koymak için .slice(0, 14) ekleyebilirsin)
      setRegisterData({
        ...registerData,
        [name]: formattedMobile.trim()
      });
    } else {
      // Diğer inputlar için standart işlem
      setRegisterData({ ...registerData, [name]: value });
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

  return (
    <GoogleOAuthProvider clientId="457680679934-poocs7d0n78r3eq8q53c6sedfdi1dh0c.apps.googleusercontent.com">
      <div
        className="auth-wrapper"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "Montserrat",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <div className={`container ${isActive ? "active" : ""}`} id="container">
          <div className="form-container sign-up">
            <form onSubmit={handleRegister}>
              <h1>Hesap Oluştur</h1>
              <div className="social-icons"></div>
              <span>veya kayıt için e-posta kullanın</span>
              <input
                type="email"
                name="eposta"
                placeholder="E-Posta"
                required
                value={registerData.eposta}
                onChange={handleRegisterChange}
              />
              <input
                type="date"
                name="dogum_tarihi"
                placeholder="Doğum Tarihi"
                required
                value={registerData.dogum_tarihi}
                onChange={handleRegisterChange}
              />
              <input
                type="tel"
                name="telefon"
                placeholder="Telefon Numarası"
                required
                value={registerData.telefon}
                onChange={handleRegisterChange}
              />
              <input
                type="password"
                name="sifre"
                placeholder="Şifre"
                required
                value={registerData.sifre}
                onChange={handleRegisterChange}
              />
              <button
                type="submit"
                style={{ marginBottom: "15px" }}
                disabled={loading}
              >
                {loading ? "İşleniyor..." : "Kayıt Ol"}
              </button>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.log("Hata")}
                type="standard"
                shape="rect"
                theme="filled_black"
              />
            </form>
          </div>

          <div className="form-container sign-in">
            <form onSubmit={handleLogin}>
              <div className="logo-section" style={{ marginBottom: "10px" }}>
                <img src={ubeyazlogo.src} alt="logo" width="60" />
              </div>
              <h1>Giriş Yap</h1>
              <div className="social-icons"></div>
              <span>veya e-posta şifrenizi kullanın</span>
              {loginError && (
                <p style={{ color: "red", fontSize: "12px" }}>{loginError}</p>
              )}
              <input
                type="email"
                placeholder="E-posta"
                required
                value={loginData.eposta}
                onChange={(e) =>
                  setLoginData({ ...loginData, eposta: e.target.value })
                }
              />
              <div style={{ width: "100%", position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifre"
                  required
                  value={loginData.sifre}
                  onChange={(e) =>
                    setLoginData({ ...loginData, sifre: e.target.value })
                  }
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "15px",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  {showPassword ? (
                    <FaEyeSlash color="gray" />
                  ) : (
                    <FaEye color="pink" />
                  )}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  margin: "10px 0",
                }}
              >
                <input
                  type="checkbox"
                  id="rememberMe"
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  checked={loginData.rememberMe}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      rememberMe: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="rememberMe"
                  style={{
                    fontSize: "12px",
                    cursor: "pointer",
                    color: "#333",
                  }}
                >
                  Beni Hatırla
                </label>
              </div>
              <a id="forgotPasswordLink" href="/forgot-password">
                Şifremi Unuttum?
              </a>
              <button
                type="submit"
                style={{ marginBottom: "15px" }}
                disabled={loading}
              >
                {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </button>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.log("Hata")}
                type="standard"
                shape="rect"
                theme="filled_black"
              />
            </form>
          </div>

          <div className="toggle-container">
            <div className="toggle">
              <div className="toggle-panel toggle-left">
                <h1>Tekrar Merhaba!</h1>
                <p>
                  Tüm özelliklerimizi kullanmak için kişisel bilgilerinizle
                  giriş yapın
                </p>
                <button className="hidden" onClick={() => setIsActive(false)}>
                  Giriş Yap
                </button>
              </div>
              <div className="toggle-panel toggle-right">
                <h1>Selam Dostum!</h1>
                <p>
                  Kişisel bilgilerinizle kayıt olun ve tüm site özelliklerini
                  kullanmaya başlayın
                </p>
                <button className="hidden" onClick={() => setIsActive(true)}>
                  Kayıt Ol
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p
        className="terms"
        style={{
          textAlign: "center",
          marginTop: "20px",
          fontSize: "12px",
          fontFamily: "Montserrat",
          width: "100%",
          display: "block",
          position: "relative",
          top: "-70px",
        }}
      >
        DEVAM EDEREK LUMANORIS’İN{" "}
        <button
          style={{
            background: "none",
            border: "none",
            color: "#512da8",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          onClick={() => openPolicy("terms")}
        >
          KULLANIM KOŞULLARI
        </button>{" "}
        VE{" "}
        <button
          style={{
            background: "none",
            border: "none",
            color: "#512da8",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          onClick={() => openPolicy("privacy")}
        >
          GİZLİLİK POLİTİKASI
        </button>{" "}
        İLE AYNI FİKİRDE OLDUĞUNUZU KABUL ETMİŞ OLURSUNUZ.
      </p>

      {isPolicyOpen && (
        <div
          className="policy-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={closePolicy}
        >
          <div
            className="policy-panel"
            style={{
              background: "rgb(20,24,27)",
              padding: "30px",
              borderRadius: "20px",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="policy-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h3>
                {activePolicy === "terms"
                  ? "Kullanım Koşulları"
                  : "Gizlilik Politikası"}
              </h3>
              <button
                onClick={closePolicy}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div className="policy-content">
              {activePolicy === "terms" ? (
                <div>
                  <h1>Kullanım Koşulları</h1>
                  <p>
                    <strong>Son Güncelleme:</strong> 4 Şubat 2026
                  </p>

                  <h2>1. Kabul Şartları</h2>
                  <p>
                    LUMANORIS platformuna erişerek veya hizmetleri kullanarak,
                    aşağıda belirtilen tüm kullanım koşullarını okuduğunuzu,
                    anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
                    Koşulları kabul etmiyorsanız lütfen platformu kullanmayınız.
                  </p>

                  <h2>2. Hizmet Tanımı</h2>
                  <p>
                    LUMANORIS; bireylerin ve kurumların kendi yapay zekâ sohbet
                    modellerini oluşturabildiği, paylaşabildiği ve gelir elde
                    edebildiği merkeziyetsiz bir dijital platformdur. Sunulan
                    içeriklerin ve çıktılarının bilgi verme amaçlı olduğu,
                    herhangi bir profesyonel tavsiye yerine geçmediği kullanıcı
                    tarafından kabul edilir.
                  </p>

                  <h2>3. Kullanıcı Sorumlulukları</h2>
                  <p>
                    Kullanıcılar, platformu yürürlükteki yasalara ve genel ahlak
                    kurallarına uygun şekilde kullanmakla yükümlüdür.
                  </p>
                  <p>Hesap bilgilerinin güvenliğinden kullanıcı sorumludur.</p>
                  <p>
                    Platformda oluşturulan veya paylaşılan içeriklerin hukuka
                    aykırı, zararlı, yanıltıcı ya da üçüncü kişilerin haklarını
                    ihlal edici olmaması gerekir.
                  </p>
                  <p>
                    AI modelleriyle yapılan etkileşimlerde gizli veya kişisel
                    hassas bilgiler paylaşılmamalıdır.
                  </p>

                  <h2>4. Fikri Mülkiyet Hakları</h2>
                  <p>
                    LUMANORIS platformu ve içeriği (yazılım, tasarım, logo,
                    metinler, görseller vb.) telif hakkı ve ilgili fikri
                    mülkiyet yasalarıyla korunmaktadır.
                  </p>
                  <p>
                    Kullanıcılar, LUMANORIS içeriğini yazılı izin almadan
                    kopyalayamaz, dağıtamaz veya ticari amaçla kullanamaz.
                  </p>
                  <p>
                    Kullanıcılar tarafından oluşturulan AI modelleri, ilgili
                    kullanıcıya ait olmakla birlikte; LUMANORIS, bu modelleri
                    platformda tanıtım veya iyileştirme amacıyla kullanabilir
                    (kullanıcı sözleşmesi kapsamında).
                  </p>

                  <h2>5. Sınırlı Sorumluluk</h2>
                  <p>
                    Platform, sunulan hizmetlerin sürekli, kesintisiz veya
                    hatasız olacağını garanti etmez.
                  </p>
                  <p>
                    LUMANORIS, teknik aksaklıklar, veri kaybı, üçüncü taraf
                    yazılımlardan kaynaklı arızalar veya kullanıcı kaynaklı
                    hatalardan doğan zararlardan sorumlu tutulamaz.
                  </p>
                  <p>
                    Kullanıcılar, AI modellerinden alınan yanıtlardan veya bu
                    yanıtlar doğrultusunda alınan kararlardan tamamen kendileri
                    sorumludur.
                  </p>

                  <h2>6. Değişiklik Hakkı</h2>
                  <p>
                    LUMANORIS, bu kullanım koşullarını dilediği zaman, önceden
                    haber vermeksizin değiştirme hakkını saklı tutar.
                    Güncellenen koşullar, platformda yayımlandığı anda yürürlüğe
                    girer. Kullanıcıların periyodik olarak bu koşulları kontrol
                    etmesi önerilir.
                  </p>

                  <h2>7. İletişim</h2>
                  <p>
                    Koşullarla ilgili sorularınız veya geri bildirimleriniz için
                    bizimle iletişime geçebilirsiniz:
                  </p>
                  <p>
                    E-posta:{" "}
                    <a href="mailto:lumanoris.ai@gmail.com">
                      lumanoris.ai@gmail.com
                    </a>{" "}
                  </p>
                  <p>
                    Web:{" "}
                    <a href="www.lumanoris.com/kullanim-kosullari">
                      www.lumanoris.com/kullanim-kosullari
                    </a>{" "}
                  </p>
                </div>
              ) : (
                <div>
                  <h1>Gizlilik Politikası</h1>
                  <p>
                    <strong>Son Güncelleme:</strong> 24 Temmuz 2025
                  </p>

                  <h2>1. Giriş</h2>
                  <p>
                    Bu Gizlilik Politikası, LUMANORIS (“biz”, “platform”,
                    “şirket”) tarafından sunulan hizmetleri kullandığınızda
                    kişisel verilerinizin nasıl toplandığını, işlendiğini ve
                    korunduğunu açıklar.
                  </p>
                  <p>
                    LUMANORIS, bireylerin ve kurumların kendi yapay zeka sohbet
                    modellerini geliştirebildiği, paylaşabildiği ve gelir elde
                    edebildiği merkeziyetsiz bir platformdur.
                  </p>

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

                  <h3>d. Ödeme Bilgileri</h3>
                  <ul>
                    <li>Fatura bilgileri</li>
                    <li>
                      Kredi kartı veya ödeme aracı bilgileri (güvenli ödeme
                      sağlayıcılar üzerinden)
                    </li>
                    <li>
                      Vergi kimlik numarası ve adres (içerik üreticiler için)
                    </li>
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
                    <li>
                      Gelir dağıtımı ve vergi yükümlülüklerini yerine getirmek
                    </li>
                    <li>Yasal yükümlülüklere uymak</li>
                    <li>
                      Pazarlama ve reklam faaliyetlerini optimize etmek
                      (onayınız dâhilinde)
                    </li>
                  </ul>

                  <h2>4. Çerezler ve Benzeri Teknolojiler</h2>
                  <p>
                    LUMANORIS, kullanıcı deneyimini geliştirmek ve analiz yapmak
                    için çerezler (cookies) kullanır. Tarayıcınızdan çerezleri
                    devre dışı bırakabilirsiniz, ancak bu bazı özelliklerin
                    çalışmasını etkileyebilir.
                  </p>
                  <p>Kullandığımız çerez türleri:</p>
                  <ul>
                    <li>Oturum çerezleri</li>
                    <li>Analitik çerezler</li>
                    <li>Pazarlama çerezleri (izninizle)</li>
                  </ul>
                  <p>
                    Not: Sitemiz henüz çerez kullanmamaktadır ancak ilerleyen
                    süreçte kullanıcı deneyimini iyileştirmek adına çerezler
                    devreye alınabilir.
                  </p>

                  <h2>5. Üçüncü Taraflarla Paylaşım</h2>
                  <p>
                    Kişisel verileriniz, yalnızca aşağıdaki durumlarda üçüncü
                    taraflarla paylaşılır:
                  </p>
                  <ul>
                    <li>Hizmet sağlayıcılarla</li>
                    <li>
                      Yasal yükümlülüklerin yerine getirilmesi gerektiğinde
                    </li>
                    <li>İçerik üreticilerine gelir ödemeleri için</li>
                    <li>
                      AI model sağlayıcılarıyla, yalnızca sohbet etkileşimleri
                      bağlamında (kullanıcı adı veya e-posta paylaşılmaz)
                    </li>
                  </ul>

                  <h2>6. Yapay Zekâ ile Etkileşim</h2>
                  <p>
                    Platform üzerindeki sohbetleriniz, üçüncü taraf yapay zekâ
                    model sağlayıcılarıyla paylaşılabilir. Bu etkileşimler:
                  </p>
                  <ul>
                    <li>Model çıktılarının iyileştirilmesi</li>
                    <li>Kişiselleştirme önerilerinin sunulması</li>
                    <li>
                      Çok kullanıcıya açık sohbetlerde, kullanıcı adı/id
                      bilgisiyle birlikte işlenebilir
                    </li>
                  </ul>
                  <p>
                    <strong>Önemli:</strong> Özel, hassas veya kişisel
                    bilgilerinizi sohbet botlarıyla paylaşmanız gerekmez. (Örn:
                    kredi kartı numarası, kimlik bilgisi vs.)
                  </p>

                  <h2>7. Güvenlik</h2>
                  <ul>
                    <li>Veri şifreleme</li>
                    <li>Erişim kontrolleri</li>
                    <li>Güvenlik duvarları ve izleme sistemleri</li>
                    <li>Düzenli güvenlik denetimleri</li>
                  </ul>

                  <h2>8. Uluslararası Veri Aktarımı</h2>
                  <p>
                    Platformun altyapısı uluslararası sağlayıcılar üzerinden
                    çalışabilir. Avrupa Ekonomik Alanı (EEA) dışına aktarılan
                    veriler, uygun koruma önlemleriyle aktarılır.
                  </p>

                  <h2>9. Veri Saklama Süresi</h2>
                  <p>
                    Kullanıcı verileri, hizmet ilişkisinin sona ermesinden sonra
                    ilgili yasal zorunluluklar ve meşru çıkar süreleri boyunca
                    saklanır ve ardından silinir veya anonimleştirilir.
                  </p>

                  <h2>10. Haklarınız</h2>
                  <p>
                    KVKK, GDPR ve geçerli diğer veri koruma yasaları kapsamında
                    şu haklara sahipsiniz:
                  </p>
                  <ul>
                    <li>Verilerinize erişme</li>
                    <li>Düzeltme veya silme talep etme</li>
                    <li>İşlemeye itiraz etme</li>
                    <li>Taşınabilirlik talep etme</li>
                    <li>Onayınızı geri çekme (onaya dayalı işlemler için)</li>
                  </ul>
                  <p>
                    Bu hakları kullanmak için bizimle iletişime geçebilirsiniz.
                  </p>

                  <h2>11. İletişim</h2>
                  <p>
                    Veri koruma ve gizlilikle ilgili her türlü soru için bizimle
                    iletişime geçebilirsiniz:
                  </p>
                  <p>
                    E-posta:{" "}
                    <a href="mailto:lumanoris.ai@gmail.com">
                      lumanoris.ai@gmail.com
                    </a>
                  </p>
                  <p>
                    İletişim Formu:{" "}
                    <a href="https://www.lumanoris.com/iletisim">
                      www.lumanoris.com/iletisim
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  );
}
