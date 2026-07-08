"use client";
import ubeyazlogo from "@/images/ubeyaz.png";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
            const res = await fetch("/api/auth/login-google.php", { // PHP dosyanın yolu
                method: "POST",
                body: dataToSend,
            });

            const resultText = await res.text();
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

            const res = await fetch("/api/auth/register.php", {
                method: "POST",
                body: dataToSend,
            });

            const resultText = await res.text();
            const result = JSON.parse(resultText);

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
                        const res = await fetch("/api/auth/sessioncheck.php", {
                        credentials: "include", // cookie'yi gönder
                        });
                        const resultText = await res.text();
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

    const inputCls =
        "w-full bg-luma-input border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors font-sans";

    return (
        <GoogleOAuthProvider clientId="457680679934-poocs7d0n78r3eq8q53c6sedfdi1dh0c.apps.googleusercontent.com">
            <div className="min-h-screen bg-luma-base flex">
                {/* ── Left branding panel (desktop only) ── */}
                <div className="hidden lg:flex lg:w-[45%] relative flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-900/15 to-cyan-900/10" />
                    <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_39px,rgba(255,255,255,0.02)_39px,rgba(255,255,255,0.02)_40px),repeating-linear-gradient(90deg,transparent,transparent_39px,rgba(255,255,255,0.02)_39px,rgba(255,255,255,0.02)_40px)]" />
                    <div className="relative z-10 flex flex-col items-center text-center px-12 gap-6">
                        <img
                            src={ubeyazlogo.src}
                            alt="Lumanoris"
                            className="w-20 h-20 drop-shadow-[0_0_32px_rgba(99,102,241,0.5)]"
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

                        <div className="bg-luma-elevated rounded-2xl p-8 border border-white/5 shadow-modal">
                            <h2 className="text-xl font-bold text-white font-display mb-6">
                                Kayıt Ol
                            </h2>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <input
                                    type="email"
                                    name="eposta"
                                    placeholder="E-posta Adresiniz"
                                    required
                                    className={inputCls}
                                    value={formData.eposta}
                                    onChange={handleChange}
                                />
                                <input
                                    type="date"
                                    name="dogum_tarihi"
                                    placeholder="Doğum Tarihi"
                                    required
                                    className={inputCls}
                                    value={formData.dogum_tarihi}
                                    onChange={handleChange}
                                />
                                <input
                                    type="tel"
                                    name="telefon"
                                    placeholder="Telefon Numarası"
                                    required
                                    className={inputCls}
                                    value={formData.telefon}
                                    onChange={handleChange}
                                />
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Şifre Belirle"
                                        name="sifre"
                                        required
                                        className={inputCls}
                                        value={formData.sifre}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl bg-gradient-btn text-white text-sm font-semibold font-display shadow-glow hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 mt-2"
                                >
                                    {loading ? "İşleniyor..." : "Kayıt Yap"}
                                </button>

                                <div className="relative flex items-center gap-3 my-1">
                                    <div className="flex-1 h-px bg-white/10" />
                                    <span className="text-xs text-white/30 font-sans">veya</span>
                                    <div className="flex-1 h-px bg-white/10" />
                                </div>

                                <div className="flex justify-center">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => console.log('Giriş Başarısız')}
                                        useOneTap
                                        theme="filled_black"
                                        shape="rectangular"
                                        size="large"
                                        width="100%"
                                        locale="tr"
                                    />
                                </div>
                            </form>
                        </div>

                        <p className="text-center mt-6 text-[11px] text-white/25 font-sans px-4">
                            Devam ederek POE'un{" "}
                            <button
                                type="button"
                                onClick={() => openPolicy("terms")}
                                className="text-indigo-400/70 hover:text-indigo-400 underline transition-colors"
                            >
                                Kullanım Koşulları
                            </button>{" "}
                            ve{" "}
                            <button
                                type="button"
                                onClick={() => openPolicy("privacy")}
                                className="text-indigo-400/70 hover:text-indigo-400 underline transition-colors"
                            >
                                Gizlilik Politikası
                            </button>{" "}
                            ile aynı fikirde olduğunuzu kabul etmiş olursunuz.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Policy modal ── */}
            {isPolicyOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                    onClick={closePolicy}
                >
                    <div
                        className="bg-luma-elevated border border-white/10 rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-semibold text-lg font-display">
                                {activePolicy === "terms" ? "Kullanım Koşulları" : "Gizlilik Politikası"}
                            </h3>
                            <button
                                onClick={closePolicy}
                                className="text-white/40 hover:text-white text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
                            >
                                ×
                            </button>
                        </div>
                        <div className="text-white/70 text-sm font-sans leading-relaxed space-y-4">
                            {activePolicy === "terms" ? (
                                <>
                                    <h1 className="text-white font-bold text-base">Kullanım Koşulları</h1>
                                    <p><strong className="text-white/90">Son Güncelleme:</strong> 24 Temmuz 2025</p>

                                    <h2 className="text-white font-semibold">1. Kabul Şartları</h2>
                                    <p>
                                        LUMANORIS platformuna erişerek veya hizmetleri kullanarak, aşağıda belirtilen tüm kullanım koşullarını okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
                                        Koşulları kabul etmiyorsanız lütfen platformu kullanmayınız.
                                    </p>

                                    <h2 className="text-white font-semibold">2. Hizmet Tanımı</h2>
                                    <p>
                                        LUMANORIS; bireylerin ve kurumların kendi yapay zekâ sohbet modellerini oluşturabildiği, paylaşabildiği ve gelir elde edebildiği merkeziyetsiz bir dijital platformdur.
                                        Sunulan içeriklerin ve çıktılarının bilgi verme amaçlı olduğu, herhangi bir profesyonel tavsiye yerine geçmediği kullanıcı tarafından kabul edilir.
                                    </p>

                                    <h2 className="text-white font-semibold">3. Kullanıcı Sorumlulukları</h2>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Kullanıcılar, platformu yürürlükteki yasalara ve genel ahlak kurallarına uygun şekilde kullanmakla yükümlüdür.</li>
                                        <li>Hesap bilgilerinin güvenliğinden kullanıcı sorumludur.</li>
                                        <li>Platformda oluşturulan veya paylaşılan içeriklerin hukuka aykırı, zararlı, yanıltıcı ya da üçüncü kişilerin haklarını ihlal edici olmaması gerekir.</li>
                                        <li>AI modelleriyle yapılan etkileşimlerde gizli veya kişisel hassas bilgiler paylaşılmamalıdır.</li>
                                    </ul>

                                    <h2 className="text-white font-semibold">4. Fikri Mülkiyet Hakları</h2>
                                    <p>
                                        LUMANORIS platformu ve içeriği (yazılım, tasarım, logo, metinler, görseller vb.) telif hakkı ve ilgili fikri mülkiyet yasalarıyla korunmaktadır.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Kullanıcılar, LUMANORIS içeriğini yazılı izin almadan kopyalayamaz, dağıtamaz veya ticari amaçla kullanamaz.</li>
                                        <li>
                                            Kullanıcılar tarafından oluşturulan AI modelleri, ilgili kullanıcıya ait olmakla birlikte;
                                            LUMANORIS, bu modelleri platformda tanıtım veya iyileştirme amacıyla kullanabilir (kullanıcı sözleşmesi kapsamında).
                                        </li>
                                    </ul>

                                    <h2 className="text-white font-semibold">5. Sınırlı Sorumluluk</h2>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Platform, sunulan hizmetlerin sürekli, kesintisiz veya hatasız olacağını garanti etmez.</li>
                                        <li>LUMANORIS, teknik aksaklıklar, veri kaybı, üçüncü taraf yazılımlardan kaynaklı arızalar veya kullanıcı kaynaklı hatalardan doğan zararlardan sorumlu tutulamaz.</li>
                                        <li>Kullanıcılar, AI modellerinden alınan yanıtlardan veya bu yanıtlar doğrultusunda alınan kararlardan tamamen kendileri sorumludur.</li>
                                    </ul>

                                    <h2 className="text-white font-semibold">6. Değişiklik Hakkı</h2>
                                    <p>
                                        LUMANORIS, bu kullanım koşullarını dilediği zaman, önceden haber vermeksizin değiştirme hakkını saklı tutar.
                                        Güncellenen koşullar, platformda yayımlandığı anda yürürlüğe girer.
                                        Kullanıcıların periyodik olarak bu koşulları kontrol etmesi önerilir.
                                    </p>

                                    <h2 className="text-white font-semibold">7. İletişim</h2>
                                    <p>Koşullarla ilgili sorularınız veya geri bildirimleriniz için bizimle iletişime geçebilirsiniz:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>E-posta: <a href="mailto:lumanoris.ai@gmail.com" className="text-indigo-400">lumanoris.ai@gmail.com</a></li>
                                        <li>Web: <a href="https://www.lumanoris.com/kullanim-kosullari" target="_blank" className="text-indigo-400">www.lumanoris.com/kullanim-kosullari</a></li>
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-white font-bold text-base">Gizlilik Politikası</h1>
                                    <p><strong className="text-white/90">Son Güncelleme:</strong> 24 Temmuz 2025</p>

                                    <h2 className="text-white font-semibold">1. Giriş</h2>
                                    <p>Bu Gizlilik Politikası, LUMANORIS ("biz", "platform", "şirket") tarafından sunulan hizmetleri kullandığınızda kişisel verilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklar.</p>
                                    <p>LUMANORIS, bireylerin ve kurumların kendi yapay zeka sohbet modellerini geliştirebildiği, paylaşabildiği ve gelir elde edebildiği merkeziyetsiz bir platformdur.</p>

                                    <h2 className="text-white font-semibold">2. Toplanan Bilgiler</h2>
                                    <h3 className="text-white/90 font-medium">a. Hesap Bilgileri</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Ad, soyad</li>
                                        <li>E-posta adresi</li>
                                        <li>Kullanıcı adı</li>
                                        <li>Şifre (şifrelenmiş olarak)</li>
                                        <li>Doğum tarihi (yaş doğrulaması için)</li>
                                    </ul>

                                    <h3 className="text-white/90 font-medium">b. Cihaz ve Bağlantı Bilgileri</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Tarayıcı türü ve sürümü</li>
                                        <li>İşletim sistemi</li>
                                        <li>Cihaz türü</li>
                                        <li>IP adresi ve yaklaşık konum</li>
                                        <li>Oturum bilgileri ve işlem geçmişi</li>
                                    </ul>

                                    <h3 className="text-white/90 font-medium">c. Etkileşim Verileri</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Sohbet geçmişiniz</li>
                                        <li>Platform içi arama ve gezinme davranışları</li>
                                        <li>Bot kullanım istatistikleri</li>
                                        <li>Kullanıcı destek talepleri ve geri bildirimler</li>
                                    </ul>

                                    <h3 className="text-white/90 font-medium">d. Ödeme Bilgileri (içerik üreticiler ve abone kullanıcılar için)</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Fatura bilgileri</li>
                                        <li>Kredi kartı veya ödeme aracı bilgileri (güvenli ödeme sağlayıcılar üzerinden)</li>
                                        <li>Vergi kimlik numarası ve adres (içerik üreticiler için)</li>
                                    </ul>

                                    <h2 className="text-white font-semibold">3. Bilgilerin Kullanım Amaçları</h2>
                                    <p>Toplanan veriler şu amaçlarla kullanılır:</p>
                                    <ul className="list-disc pl-5 space-y-1">
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

                                    <h2 className="text-white font-semibold">4. Çerezler ve Benzeri Teknolojiler</h2>
                                    <p>LUMANORIS, kullanıcı deneyimini geliştirmek ve analiz yapmak için çerezler (cookies) kullanır.</p>
                                    <p>Tarayıcınızdan çerezleri devre dışı bırakabilirsiniz, ancak bu bazı özelliklerin çalışmasını etkileyebilir.</p>
                                    <p>Kullandığımız çerez türleri:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Oturum çerezleri</li>
                                        <li>Analitik çerezler</li>
                                        <li>Pazarlama çerezleri (izninizle)</li>
                                    </ul>
                                    <p><strong className="text-white/90">Not:</strong> Sitemiz henüz çerez kullanmamaktadır ancak ilerleyen süreçte kullanıcı deneyimini iyileştirmek adına çerezler devreye alınabilir.</p>

                                    <h2 className="text-white font-semibold">5. Üçüncü Taraflarla Paylaşım</h2>
                                    <p>Kişisel verileriniz, yalnızca aşağıdaki durumlarda üçüncü taraflarla paylaşılır:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Hizmet sağlayıcılarla</li>
                                        <li>Yasal yükümlülüklerin yerine getirilmesi gerektiğinde</li>
                                        <li>İçerik üreticilerine gelir ödemeleri için</li>
                                        <li>AI model sağlayıcılarıyla, yalnızca sohbet etkileşimleri bağlamında (kullanıcı adı veya e-posta paylaşılmaz)</li>
                                    </ul>

                                    <h2 className="text-white font-semibold">6. Yapay Zekâ ile Etkileşim</h2>
                                    <p>Platform üzerindeki sohbetleriniz, üçüncü taraf yapay zekâ model sağlayıcılarıyla paylaşılabilir.</p>
                                    <p>Bu etkileşimler:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Model çıktılarının iyileştirilmesi</li>
                                        <li>Kişiselleştirme önerilerinin sunulması</li>
                                        <li>Çok kullanıcıya açık sohbetlerde, kullanıcı adı/id bilgisiyle birlikte işlenebilir</li>
                                    </ul>
                                    <p><strong className="text-white/90">Önemli:</strong> Özel, hassas veya kişisel bilgilerinizi sohbet botlarıyla paylaşmanız gerekmez. (Örn: kredi kartı numarası, kimlik bilgisi vs.)</p>

                                    <h2 className="text-white font-semibold">7. Güvenlik</h2>
                                    <p>Kişisel verilerinizin güvenliği bizim için önceliklidir.</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Veri şifreleme</li>
                                        <li>Erişim kontrolleri</li>
                                        <li>Güvenlik duvarları ve izleme sistemleri</li>
                                        <li>Düzenli güvenlik denetimleri</li>
                                    </ul>

                                    <h2 className="text-white font-semibold">8. Uluslararası Veri Aktarımı</h2>
                                    <p>Platformun altyapısı uluslararası sağlayıcılar üzerinden çalışabilir. Avrupa Ekonomik Alanı (EEA) dışına aktarılan veriler, uygun koruma önlemleriyle aktarılır.</p>

                                    <h2 className="text-white font-semibold">9. Veri Saklama Süresi</h2>
                                    <p>Kullanıcı verileri, hizmet ilişkisinin sona ermesinden sonra ilgili yasal zorunluluklar ve meşru çıkar süreleri boyunca saklanır ve ardından silinir veya anonimleştirilir.</p>

                                    <h2 className="text-white font-semibold">10. Haklarınız</h2>
                                    <p>KVKK, GDPR ve geçerli diğer veri koruma yasaları kapsamında şu haklara sahipsiniz:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Verilerinize erişme</li>
                                        <li>Düzeltme veya silme talep etme</li>
                                        <li>İşlemeye itiraz etme</li>
                                        <li>Taşınabilirlik talep etme</li>
                                        <li>Onayınızı geri çekme (onaya dayalı işlemler için)</li>
                                    </ul>
                                    <p>Bu hakları kullanmak için bizimle iletişime geçebilirsiniz.</p>

                                    <h2 className="text-white font-semibold">11. İletişim</h2>
                                    <p>Veri koruma ve gizlilikle ilgili her türlü soru için bizimle iletişime geçebilirsiniz:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>E-posta: <a href="mailto:lumanoris.ai@gmail.com" className="text-indigo-400">lumanoris.ai@gmail.com</a></li>
                                        <li>İletişim Formu: <a href="https://www.lumanoris.com/iletisim" target="_blank" className="text-indigo-400">www.lumanoris.com/iletisim</a></li>
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </GoogleOAuthProvider>
    );
}
