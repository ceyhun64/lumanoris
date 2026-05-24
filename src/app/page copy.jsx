"use client";
import {React, useEffect, useState} from 'react';
import logo from '../images/header-logo-icon.png';
import bgPattern from '../images/arkaplandesen.png';
import iyzicoFooter from '../images/iyzico_footer.png';
import AboutPopup from './components/AboutPopup';
import PrivacyPopup from './components/GizlilikPopup';
import UsagePopup from './components/UsagePopup';
import TermsOfSalePopup from './components/MesafeliSatisPopup';
import DeliveryAndReturnPopup from './components/TeslimatIadePopup';
import './css/landing.css';
import blokAll from "../images/blokAll.png";

export default function Home() {
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [isUsageOpen, setIsUsageOpen] = useState(false);
    const [isMesafeOpen, setIsMesafeOpen] = useState(false);
    const [isTeslimatOpen, setIsTeslimatOpen] = useState(false);
    const [landingPhotos, setLandingPhotos] = useState([]);
    const [about, setAbout] = useState('');
    const [contactInfo, setContactInfo] = useState([]);
    const [socialsList, setSocialsList] = useState([]);

    useEffect(() => {
        async function fetchPhotos() {
              try {
                const res = await fetch("/api/getlandingimages.php");
                const resultText = await res.text();
                const result = JSON.parse(resultText);
                setLandingPhotos(result);
              } catch (err) {
                console.error("Error:", err);
              }
            }
        async function fetchAbout() {
              try {
                const res = await fetch("/api/getabout.php");
                const resultText = await res.text();
                const result = JSON.parse(resultText);
                setAbout(result.hakkinda);
              } catch (err) {
                console.error("Error:", err);
              }
            }
        async function fetchContact() {
              try {
                const res = await fetch("/api/getcontactinfo.php");
                const resultText = await res.text();
                const result = JSON.parse(resultText);
                setContactInfo(result);
              } catch (err) {
                console.error("Error:", err);
              }
            }
        async function fetchSocials() {
              try {
                const res = await fetch("/api/getsocials.php");
                const resultText = await res.text();
                const result = JSON.parse(resultText);
                setSocialsList(result);
              } catch (err) {
                console.error("Error:", err);
              }
            }
        fetchPhotos();
        fetchAbout();
        fetchContact();
        fetchSocials();
    },[]);

  return (
    <div 
        className="landing-container" 
        style={{ backgroundImage: `url(${bgPattern.src})` }}
        >
        
        <header className="navbar-header">
            <div className="brand-container">
                <div className="icon">
                    <img src={logo.src} alt="logo" width={50} className="brand-logo" />
                </div>
                <span className="brand-name">LUMANORIS</span>
            </div>
            <nav className="nav-menu">
                <a href="/login" className="nav-link">Giriş Yap</a>
                <a href="/login?to=iletisim" className="contact-btn">İletişim</a>
            </nav>
        </header>

        <section className="hero-section">
            <h1 className="hero-title">Gelecek Nihayet Gelecek Gibi Görünüyor</h1>
            <h2 className="hero-subtitle">Hazırsan başlayalım!</h2>
            <p className="hero-text">
                Lumanoris ile sıradan sohbetlerin ötesine geçin — ister öğrenmek, ister üretmek, ister sadece konuşmak için; yapay zeka desteklenen akıllı asistanlar her zaman yanınızda.
            </p>
            <div className="hero-btns">
                <button onClick={() => window.location.href = '/login'} className="btn-primary-hero">
                    Hemen Keşfet
                </button>
                <button onClick={() => window.location.href = '#howto'} className="btn-outline-hero">
                    Nasıl çalışır?
                </button>
            </div>
            
            <div className="dashboard-preview-container">
                {landingPhotos.anasayfa_resim1 ? (
                    <img 
                        src={`/${landingPhotos.anasayfa_resim1}`} 
                        alt="Dashboard Önizleme" 
                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }} 
                    />
                ) : (
                    <p style={{ color: '#888' }}>[Dashboard/Arayüz Önizlemesi Placeholder]</p>
                )}
            </div>
        </section>

        <section id="aboutUs" style={{ 
            padding: '80px 5%', 
            borderTop: '1px solid #332c50', 
            borderBottom: '1px solid #332c50',
            backgroundColor: 'transparent' // Temanıza göre ayarlayabilirsiniz
        }}>
            <div style={{ 
                maxWidth: '800px', // Okunabilirlik için metin genişliğini sınırlıyoruz
                margin: '0 auto',   // Dış çerçeveyi ortalıyor
                textAlign: 'center' // İçindeki metinleri merkeze yaslıyor
            }}>
                <h2 style={{ 
                    fontSize: '2.5em', 
                    marginBottom: '30px', 
                    color: '#fff' 
                }}>
                    Hakkımızda
                </h2>
                
                <div 
                    className="about-content"
                    style={{ 
                        fontSize: '1.15em', 
                        lineHeight: '1.8', 
                        color: '#b0a7d1', // Daha yumuşak, okunabilir bir gri-mor tonu
                        textAlign: 'center' 
                    }}
                    // Veritabanından gelen HTML içeriğini render ediyoruz
                    dangerouslySetInnerHTML={{ __html: about }} 
                />
            </div>
        </section>

        <section className="features-section" style={{ padding: '80px 5%', textAlign: 'center' }}>
            <h2 className="features-title">Lumanoris Ne Sunar?</h2>
            <p className="features-description" style={{ maxWidth: '800px', margin: '0 auto 40px auto', color: '#b0a7d1' }}>
                Lumanoris, yalnızca cevap veren bir yapay zeka değil; sizi anlayan, ihtiyaçlarınıza göre şekillenen ve her an yanınızda olan akıllı bir asistan deneyimi sunar.
            </p>
            
            <div className="features-image-wrapper" style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginTop: '30px'
            }}>
                <img 
                    src="../images/blokAll.png" 
                    alt="Lumanoris Özellikleri Genel Görünüm" 
                    style={{ 
                        maxWidth: '100%', 
                        height: 'auto', 
                        borderRadius: '12px',
                        // Kart yapısını andıran ama daha geniş bir duruş için:
                        filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.4))'
                    }} 
                />
            </div>
        </section>
        
        <section id="howto" className="process-section">
            <h2 className="process-title">LUMANORIS İçinde Model Üretme Süreci</h2>
            <p className="process-intro">
                LUMANORIS ile yapay zeka üretmek kolay, güçlü ve güvenlidir. Kullanıcı dostu araçlarla dakikalar içinde gelişmiş sohbet modelleri oluşturabilir, güvenli ekosistemimizde paylaşabilirsiniz.
            </p>
            
            <div className="process-image-container" style={{ 
                marginTop: '50px', 
                display: 'flex', 
                justifyContent: 'center',
                padding: '20px'
            }}>
                <img 
                    src="../images/modelolusturmasureci.png"
                    alt="Lumanoris Model Üretme Süreci" 
                    style={{ 
                        maxWidth: '100%', 
                        height: 'auto', 
                        borderRadius: '15px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)', // Derinlik katmak için gölge
                        border: '1px solid #332c50' // Tema bütünlüğü için ince kenarlık
                    }} 
                />
            </div>
        </section>

        <section className="testimonials-section" style={{ padding: '80px 5%', textAlign: 'center' }}>
            <h2 className="testimonials-title">Yorumlar</h2>
            <p className="testimonials-intro" style={{ 
                maxWidth: '800px', 
                margin: '0 auto 40px auto', 
                color: '#b0a7d1',
                lineHeight: '1.6'
            }}>
                Lumanoris topluluğuna katılan binlerce profesyonelin, yapay zeka ile iş akışlarını nasıl dönüştürdüğünü kendi ağızlarından dinleyin.
            </p>
            
            <div className="testimonials-image-wrapper" style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center'
            }}>
                <img 
                    src="../images/yorumlar.png" 
                    alt="Lumanoris Kullanıcı Yorumları" 
                    style={{ 
                        maxWidth: '100%', 
                        height: 'auto', 
                        borderRadius: '15px',
                        // Hafif derinlik katmak için:
                        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
                    }} 
                />
            </div>
        </section>

        <section className="pricing-section">
            <h2 className="pricing-title">Lumanoris Ne Sunar?</h2>
            <h2 className="pricing-subtitle">Sana uygun bir plan seç</h2>
            <p className="pricing-description">
                İster bireysel kullanım, ister profesyonel ihtiyaçlar için olsun; her kullanıcıya özel, esnek ve etkili planlarımızla yanınızdayız.
            </p>
            
            <div className="pricing-grid">

                <div className="pricing-card">
                    <h3>Ücretsiz</h3>
                    <h4>Herkes için</h4>
                    <p className="plan-text">LUMANORIS'in gücünü hiçbir ücret ödemeden keşfedin ve hemen başlayın.</p>
                    <ul className="features-list">
                        <li>✅ Basic workflow automation</li>
                        <li>✅ AI-powered personal assistant</li>
                        <li>✅ Standard analytics & reporting</li>
                        <li>✅ Email & chat support</li>
                        <li>✅ Up to 3 AI integrations</li>
                    </ul>
                    <button className="price-btn btn-basic">Planı Seç</button>
                </div>

                <div className="pricing-card featured">
                    <h3 style={{ color: '#a058ff' }}>Standart Plan</h3>
                    <h4>₺1750 / ay</h4>
                    <p className="plan-text">Gelişmiş araçlar ve daha fazla kaynakla projelerinizi bir üst seviyeye taşıyın.</p>
                    <ul className="features-list">
                        <li>✅ Advanced workflow automation</li>
                        <li>✅ AI-driven marketing tools</li>
                        <li>✅ Enhanced data insights</li>
                        <li>✅ Priority customer support</li>
                        <li>✅ Up to 10 AI integrations</li>
                    </ul>
                    <button className="price-btn btn-standard">Hemen Başla</button>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '15px' }}>
                        veya <a href="#" style={{ color: '#a058ff' }}>İletişime geç</a>
                    </p>
                </div>

                <div className="pricing-card">
                    <h3>Profesyonel</h3>
                    <h4>Özel Plan</h4>
                    <p className="plan-text">Sınırsız imkanlar ve öncelikli destekle maksimum verim alın.</p>
                    <ul className="features-list">
                        <li>✅ Customizable AI automation</li>
                        <li>✅ Dedicated business consultant</li>
                        <li>✅ Enterprise-grade compliance</li>
                        <li>✅ 24/7 VIP support</li>
                        <li>✅ Unlimited AI integrations</li>
                    </ul>
                    <button className="price-btn btn-basic">İletişime Geç</button>
                </div>
            </div>
        </section>

        <section className="cta-section" style={{ 
    position: 'relative', 
    minHeight: '600px', // Bölümün toplam yüksekliğini sabit tutalım
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden'
}}>
    <img 
        src="../images/desen1.png" 
        alt="Dekoratif Desen" 
        style={{ 
            position: 'absolute',
            top: '30px', // Section'ın en üstünden 30px aşağıda sabit durur
            left: '50%',
            transform: 'translateX(-50%)', // Sadece yatayda ortala
            opacity: '1.0', 
            zIndex: '0',
            maxWidth: '600px',
            pointerEvents: 'none'
        }} 
    />

    <div style={{ height: '180px' }}></div> 

    <div style={{ 
        position: 'relative', 
        zIndex: '1',
        maxWidth: '600px',
        padding: '0 20px'
    }}>
        <p className="cta-description">
            Lumanoris, yapay zekayı sadece bir araç değil, gerçek bir yol arkadaşı haline getirir...
        </p>
        
        <button 
            onClick={() => window.location.href = '/login'} 
            className="btn-cta-large"
            style={{ marginTop: '20px' }}
        >
            Hemen Keşfet
        </button>
    </div>
</section>

        {isAboutOpen && (
            <AboutPopup onClose={() => setIsAboutOpen(false)} />
        )}
        {isPrivacyOpen && (
            <PrivacyPopup onClose={() => setIsPrivacyOpen(false)} />
        )}
        {isUsageOpen && (
            <UsagePopup onClose={() => setIsUsageOpen(false)} />
        )}
        {isMesafeOpen && (
            <TermsOfSalePopup onClose={() => setIsMesafeOpen(false)} />
        )}
        {isTeslimatOpen && (
            <DeliveryAndReturnPopup onClose={() => setIsTeslimatOpen(false)} />
        )}
        <footer className="main-footer">
            <div className="footer-top">
                <div className="footer-brand-col">
                    <div className="footer-logo">LUMANORIS</div>
                    <p className="footer-description">
                        Yapay zeka destekli dijital asistanlar oluşturmanıza, içerik üretmenizi ve topluluklarla etkileşime geçmenizi sağlayan modern bir platformdur.
                    </p>
                    <img src={iyzicoFooter.src} width={220} alt='Iyzico payment' />
                </div>

                <div className="footer-links-container">
                    <div>
                        <h5 className="footer-col-title">Hakkımızda</h5>
                        <ul className="footer-list">
                            <li><a onClick={() => window.location.href='#aboutUs'} className="footer-link">Hakkımızda</a></li>
                            <li><a onClick={() => setIsUsageOpen(true)} className="footer-link">Kullanım Koşulları</a></li>
                            <li><a onClick={() => setIsPrivacyOpen(true)} className="footer-link">Gizlilik Sözleşmesi</a></li>
                            <li><a onClick={() => setIsMesafeOpen(true)} className="footer-link">Mesafeli Satış</a></li>
                            <li><a onClick={() => setIsTeslimatOpen(true)} className="footer-link">Teslimat ve İade Şartları</a></li>
                            <li><a onClick={() => setIsMesafeOpen(true)} className="footer-link">Mesafeli Satış</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h5 className="footer-col-title">İletişim</h5>
                        <p className="footer-contact-text">{contactInfo.merkez_adres}</p>
                        <p className="footer-contact-text">{contactInfo.email_adres}</p>
                        
                        <div className="social-icons">
                            {socialsList.facebook_link && (
                                <a href={socialsList.facebook_link} target="_blank" rel="noopener noreferrer">
                                    <i className="bi bi-facebook"></i>
                                </a>
                            )}

                            {socialsList.twitter_link && (
                                <a href={socialsList.twitter_link} target="_blank" rel="noopener noreferrer">
                                    <i className="bi bi-twitter-x"></i>
                                </a>
                            )}

                            {socialsList.instagram_link && (
                                <a href={socialsList.instagram_link} target="_blank" rel="noopener noreferrer">
                                    <i className="bi bi-instagram"></i>
                                </a>
                            )}

                            {socialsList.youtube_link && (
                                <a href={socialsList.youtube_link} target="_blank" rel="noopener noreferrer">
                                    <i className="bi bi-youtube"></i>
                                </a>
                            )}

                            {socialsList.linkedin_link && (
                                <a href={socialsList.linkedin_link} target="_blank" rel="noopener noreferrer">
                                    <i className="bi bi-linkedin"></i>
                                </a>
                            )}

                            {socialsList.tiktok_link && (
                                <a href={socialsList.tiktok_link} target="_blank" rel="noopener noreferrer">
                                    <i className="bi bi-tiktok"></i>
                                </a>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            
            <div className="footer-bottom">
                <p style={{ color: '#aaa' }}>© 2025 Lumanoris. Tüm hakları saklıdır.</p>
                
                <div className="newsletter-box">
                    <p style={{ color: '#ffffff', margin: 0 }}>Yeni özelliklerden haberdar olun:</p>
                    <div className="email-input-group">
                        <input type="email" placeholder="E-posta adresiniz" />
                        <button className="subscribe-btn">Abone Ol</button>
                    </div>
                </div>
            </div>
        </footer>
    </div>
  );

    /*return (
  <>
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 0,
        paddingTop: "506.8814%",
        paddingBottom: 0,
        boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)",
        marginTop: "1.6em",
        marginBottom: "0.9em",
        overflow: "hidden",
        borderRadius: "8px",
        willChange: "transform",
      }}
    >
      <iframe
        loading="lazy"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          border: "none",
          padding: 0,
          margin: 0,
        }}
        src="https://www.canva.com/design/DAHFIDGvuNk/xWqf-9PtUpAkwXjWbWhEcQ/view?embed"
        allowFullScreen={true}
        allow="fullscreen"
      ></iframe>
    </div>
    <a
      href="https://www.canva.com/design/DAHFIDGvuNk/xWqf-9PtUpAkwXjWbWhEcQ/view?utm_content=DAHFIDGvuNk&utm_campaign=designshare&utm_medium=embeds&utm_source=link"
      target="_blank"
      rel="noopener noreferrer"
    >
      lumanoris landing page
    </a>{" "}
    - Adnan Yusuf KOÇAK
  </>
);*/
}