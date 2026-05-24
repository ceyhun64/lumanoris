"use client";
import Link from "next/link";
import iconSrc from "../../../images/ubeyaz.png";
import Image from "next/image";
import sampleImage from "../../../images/sample-bot-page.png";
import ChatbotCard from "@/app/components/ChatbotCard/ChatbotCard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const mockChatbots = [
];

export default function Chatbotlarim() {
    const [chatbots, setChatbots] = useState([]);
    const [categories, setCategories] = useState([]);
    const [userId, setUserId] = useState(null);
    const router = useRouter();

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
                        setUserId(result.user_id);
                        } else {
                        router.push("/login");
                        }
                    } catch (err) {
                        console.error("Session check error:", err);
                        router.push("/login");
                    }
                }
                checkSession();
            }, [router]);

    useEffect(() => {
        console.log(userId);
        fetch(`/api/getchatbotsmenu.php?id=${userId}`)
            .then(res => res.text())
            .then(dataText => {
                console.log(dataText);
                const data = JSON.parse(dataText);
                console.log(data);
                if (Array.isArray(data)) {
                    setChatbots(data);
                }
            })
            .catch(err => console.error("Yükleme hatası:", err));
        
        fetch('/api/getcategories.php')
            .then(async res => {
                const text = await res.text(); // Önce metin olarak alıyoruz
                //console.log("Sunucudan gelen ham yanıt:", text);
                
                try {
                    const data = JSON.parse(text); // Sonra manuel olarak parse etmeyi deniyoruz
                    if (Array.isArray(data)) {
                        setCategories(data);
                    } else {
                        console.error("Gelen veri bir dizi değil:", data);
                    }
                } catch (parseError) {
                    console.error("JSON Parse Hatası! Sunucu muhtemelen PHP hatası döndürdü.");
                }
            })
            .catch(err => console.error("Fetch Hatası:", err));
    }, [userId]);

    const handleDelete = async (id) => {
        if (!confirm("Bu chatbot'u silmek istediğinize emin misiniz?")) return;

        const formData = new FormData();
        formData.append('id', id);

        try {
            const response = await fetch('/api/deletechatbot.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                // State'den anlık olarak kaldır
                setChatbots(prev => prev.filter(bot => bot.id !== id));
            } else {
                alert("Hata: " + result.message);
            }
        } catch (error) {
            console.error("Silme hatası:", error);
        }
    };

    const isEmpty = chatbots.length === 0;

    if (isEmpty) {
        return (<div className="chatbots-empty-state">
            <div className="mobile-header">
                <span>
                    Home
                </span>
            </div>
            <div className="logo">
                <Image src={iconSrc} alt="Logo" />
                <svg width="153" height="153" viewBox="0 0 153 153" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_f_7776_8385)">
                        <circle cx="76.2031" cy="76.7031" r="26.1386" fill="url(#paint0_linear_7776_8385)" />
                    </g>
                    <defs>
                        <filter id="filter0_f_7776_8385" x="0.28228" y="0.78228" width="151.842" height="151.842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="24.8911" result="effect1_foregroundBlur_7776_8385" />
                        </filter>
                        <linearGradient id="paint0_linear_7776_8385" x1="60.7575" y1="86.8021" x2="87.1932" y2="66.9011" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FF66C4" />
                            <stop offset="1" stopColor="#4699FF" />
                        </linearGradient>
                    </defs>
                </svg>

            </div>

            <h2>Sohbet Botlarım</h2>

            <div>
                <p>
                    Hayalinizdeki sohbet botunu sadece <span className="highlight">birkaç basit adımda</span> hayata geçirin.
                </p>
                <p>
                    Bilgi paylaşın, eğlendirin ya da iş süreçlerini kolaylaştırın <br />

                </p>
                <p className="highlight">hepsi sizin elinizde!</p>
            </div>

            <Link href="/dashboard/chatbots/create" className="create-button">
                <span><svg xmlns="http://www.w3.org/2000/svg" width="26" height="25" viewBox="0 0 26 25" fill="none">
                    <path d="M13 5.20117V19.7842M5.7085 12.4927H20.2915" stroke="#FF66C4" strokeLinecap="round" strokeLinejoin="round" />
                </svg></span> İlk Sohbet Botunuzu Oluşturun
            </Link>
        </div>)
    };
    return (
        <div className="chatbots-list-wrapper">
            <div className="chatbots-header">
                <h2>Chatbotlarım</h2>
                <Link href="/dashboard/chatbots/create" className="create-button">
                    <span>＋</span> Yeni Chatbot Oluştur
                </Link>
            </div>

            <div className="chatbots-grid">
                {chatbots.map((bot) => {
                    // Chatbot'un kategori_id'sine sahip kategoriyi buluyoruz
                    const targetCategory = categories.find(cat => String(cat.id) === String(bot.kategori_id));
                    
                    // Eğer kategori bulunduysa adını, bulunamadıysa 'Kategorisiz' (veya boş string) döndürüyoruz
                    const categoryLabel = targetCategory ? targetCategory.kategori_adi_tr : "Genel";

                    return (
                        <ChatbotCard
                            key={bot.id}
                            id={bot.id}
                            userId={userId}
                            title={bot.isim}
                            image={bot.kapak_fotografi}
                            profileImage={bot.profil_fotografi}
                            category={categoryLabel}
                            status={bot.seller_status === 'active' ? 'Aktif' : 'Yayında Değil'}
                            sellerStatus={bot.seller_status}
                            likes={bot.likes}
                            dislikes={bot.dislikes}
                            comments={bot.comments}
                            dialogs={bot.dialogs}
                            weeklyPrice={bot.ucret_haftalik}
                            monthlyPrice={bot.ucret_aylik}
                            onDelete={() => handleDelete(bot.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
