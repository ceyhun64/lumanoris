"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import aiIcon from "../../../images/smarthelper.png";
import DeleteConfirmModal from "@/app/components/DeleteConfirmModal";
import { useRouter } from "next/navigation";
import EmptyCart from "@/app/components/EmptyCart/EmptyHistory";

const initialItems = [
    {
        id: 1,
        title: "E-Ticaret Hakkında Bilgi",
        subtitle: "Ürün Kategorilerini Optimize Etmek, Müşteri Deneyimini %30 Artırabilir.",
        date: "1 Temmuz 2025",
        chatId: "ecommerce-chat",
        messages: [
            { type: 'sent', text: 'E-ticaret sitelerinde ürün kategorilerini nasıl optimize edebilirim?' },
            { type: 'received', text: 'E-ticaret sitelerinde ürün kategorilerini optimize etmek için şu adımları takip edebilirsiniz:\n\n1. **Kullanıcı Davranışlarını Analiz Edin**: Hangi kategorilerin en çok ziyaret edildiğini ve satış yaptığını belirleyin.\n\n2. **Arama Analitiklerini Kullanın**: Müşterilerin hangi arama terimlerini kullandığını analiz edin.\n\n3. **Kategori Hiyerarşisini Düzenleyin**: Ana kategoriler, alt kategoriler ve ürün grupları oluşturun.\n\n4. **Filtreleme Seçeneklerini Geliştirin**: Fiyat, marka, renk, boyut gibi filtreler ekleyin.\n\n5. **Görsel Tasarımı İyileştirin**: Kategori sayfalarının kullanıcı dostu olmasını sağlayın.' },
            { type: 'sent', text: 'Bu optimizasyonlar müşteri deneyimini ne kadar artırabilir?' },
            { type: 'received', text: 'Doğru yapılan kategori optimizasyonları müşteri deneyimini ortalama %30 artırabilir. Bu artış şu şekilde gerçekleşir:\n\n• **Daha Hızlı Ürün Bulma**: %40 daha hızlı\n• **Satın Alma Oranı**: %25 artış\n• **Sayfa Görüntüleme Süresi**: %35 artış\n• **Müşteri Memnuniyeti**: %30 artış\n\nAyrıca arama motorlarında da daha iyi sıralama elde edersiniz.' }
        ]
    },
    {
        id: 2,
        title: "Yapay Zeka ve Geleceğin Meslekleri",
        subtitle: "2030 Yılına Kadar En Çok Talep Gören Mesleklerin %60'ı Henüz Ortaya Çıkmadı.",
        date: "1 Temmuz 2025",
        chatId: "ai-careers-chat",
        messages: [
            { type: 'sent', text: 'Yapay zeka gelecekte hangi meslekleri etkileyecek?' },
            { type: 'received', text: 'Yapay zeka teknolojileri gelecekte birçok mesleği derinden etkileyecek. İşte öne çıkan alanlar:\n\n**Yüksek Risk Altındaki Meslekler:**\n• Veri girişi ve muhasebe\n• Basit üretim işleri\n• Temel müşteri hizmetleri\n• Rutin analiz işleri\n\n**Yeni Ortaya Çıkacak Meslekler:**\n• AI Etik Uzmanı\n• Veri Bilimci\n• Makine Öğrenmesi Mühendisi\n• AI İnsan Etkileşimi Tasarımcısı\n\n2030 yılına kadar en çok talep gören mesleklerin %60\'ı henüz ortaya çıkmamış durumda.' },
            { type: 'sent', text: 'Bu değişime nasıl hazırlanabilirim?' },
            { type: 'received', text: 'Bu değişime hazırlanmak için şu adımları atabilirsiniz:\n\n1. **Sürekli Öğrenme**: Online kurslar ve sertifikalar alın\n2. **Teknoloji Okuryazarlığı**: AI araçlarını öğrenin\n3. **Yaratıcılık Geliştirin**: AI\'nın yapamayacağı işlere odaklanın\n4. **Sosyal Beceriler**: İnsan etkileşimi gerektiren alanlarda uzmanlaşın\n5. **Esneklik**: Farklı alanlarda deneyim kazanın\n\nGelecekte başarılı olmak için hem teknik hem de sosyal becerilerinizi geliştirmeniz önemli.' }
        ]
    },
    {
        id: 3,
        title: "Sürdürülebilir Enerji Çözümleri",
        subtitle: "Güneş ve Rüzgar Enerjisi, 2040'a Kadar Küresel Enerji Tüketiminin %50'sini Karşılayabilir.",
        date: "28 Haziran 2025",
        chatId: "sustainable-energy-chat",
        messages: [
            { type: 'sent', text: 'Sürdürülebilir enerji çözümleri nelerdir?' },
            { type: 'received', text: 'Sürdürülebilir enerji çözümleri şunları içerir:\n\n**Yenilenebilir Enerji Kaynakları:**\n• Güneş Enerjisi (Fotovoltaik sistemler)\n• Rüzgar Enerjisi (Onshore ve offshore)\n• Hidroelektrik Enerji\n• Jeotermal Enerji\n• Biyokütle Enerjisi\n\n**Enerji Verimliliği:**\n• Akıllı şebekeler\n• Enerji depolama sistemleri\n• LED aydınlatma\n• Enerji tasarruflu cihazlar\n\n2040 yılına kadar güneş ve rüzgar enerjisi küresel enerji tüketiminin %50\'sini karşılayabilir.' },
            { type: 'sent', text: 'Bu geçişin ekonomik etkileri neler olacak?' },
            { type: 'received', text: 'Sürdürülebilir enerjiye geçişin ekonomik etkileri:\n\n**Pozitif Etkiler:**\n• Yeni iş alanları oluşması\n• Enerji maliyetlerinin düşmesi\n• Teknoloji sektöründe büyüme\n• İhracat potansiyeli\n\n**Geçiş Maliyetleri:**\n• Altyapı yatırımları\n• Eğitim ve yeniden eğitim\n• Teknoloji geliştirme\n\nUzun vadede bu geçiş ekonomik büyümeyi destekleyecek ve yeni fırsatlar yaratacaktır.' }
        ]
    },
    {
        id: 4,
        title: "Veri Güvenliği ve Siber Tehditler",
        subtitle: "2025'te Şirketlerin %75'i En Az Bir Kez Ransomware Saldırısına Uğradı.",
        date: "22 Haziran 2025",
        chatId: "cybersecurity-chat",
        messages: [
            { type: 'sent', text: 'Günümüzde en büyük siber tehditler nelerdir?' },
            { type: 'received', text: 'Günümüzde en büyük siber tehditler şunlardır:\n\n**Ransomware Saldırıları:**\n• Veri şifreleme ve fidye talebi\n• Kritik sistemleri devre dışı bırakma\n• Çift şantaj (veri çalma + şifreleme)\n\n**Phishing Saldırıları:**\n• Gelişmiş sosyal mühendislik\n• Hedefli spear phishing\n• CEO dolandırıcılığı\n\n**IoT Güvenlik Açıkları:**\n• Akıllı cihaz saldırıları\n• Botnet oluşturma\n• Ağ güvenlik açıkları\n\n2025\'te şirketlerin %75\'i en az bir kez ransomware saldırısına uğradı.' },
            { type: 'sent', text: 'Bu tehditlere karşı nasıl korunabilirim?' },
            { type: 'received', text: 'Siber tehditlere karşı korunma yöntemleri:\n\n**Temel Güvenlik Önlemleri:**\n• Güçlü şifreler ve 2FA kullanın\n• Düzenli güncellemeler yapın\n• Antivirüs yazılımı kullanın\n• Veri yedekleme yapın\n\n**Eğitim ve Farkındalık:**\n• Çalışanları eğitin\n• Güvenlik politikaları oluşturun\n• Düzenli güvenlik testleri yapın\n• Olay müdahale planı hazırlayın\n\n**Teknik Önlemler:**\n• Firewall kullanın\n• VPN bağlantıları\n• Şifreli iletişim\n• Güvenlik izleme sistemleri' }
        ]
    },
    {
        id: 5,
        title: "Uzaktan Çalışma Kültürü",
        subtitle: "Hibrit Çalışma Modelleri, Çalışan Verimliliğini Ortalama %18 Artırdı.",
        date: "15 Haziran 2025",
        chatId: "remote-work-chat",
        messages: [
            { type: 'sent', text: 'Uzaktan çalışma kültürü nasıl oluşturulur?' },
            { type: 'received', text: 'Uzaktan çalışma kültürü oluşturmak için şu adımları takip edebilirsiniz:\n\n**Teknoloji Altyapısı:**\n• Güvenilir iletişim araçları\n• Proje yönetim platformları\n• Bulut tabanlı dosya paylaşımı\n• Video konferans sistemleri\n\n**İletişim Stratejileri:**\n• Düzenli toplantılar\n• Açık iletişim kanalları\n• Geri bildirim sistemleri\n• Takım oluşturma aktiviteleri\n\n**Çalışan Desteği:**\n• Esnek çalışma saatleri\n• Mental sağlık desteği\n• Profesyonel gelişim fırsatları\n• İş-yaşam dengesi' },
            { type: 'sent', text: 'Hibrit çalışma modelinin avantajları nelerdir?' },
            { type: 'received', text: 'Hibrit çalışma modelinin avantajları:\n\n**Çalışan Açısından:**\n• İş-yaşam dengesi\n• Zaman tasarrufu\n• Esneklik\n• Daha az stres\n\n**Şirket Açısından:**\n• Ofis maliyetlerinde azalma\n• Daha geniş yetenek havuzu\n• Çalışan memnuniyeti\n• Verimlilik artışı\n\nHibrit çalışma modelleri çalışan verimliliğini ortalama %18 artırdı ve bu trend gelecekte de devam edecek.' }
        ]
    }
];

export default function History() {
    const router = useRouter();
    const [editingId, setEditingId] = useState(null);
    //const [editedTitle, setEditedTitle] = useState("");
    const [historyItems, setHistoryItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const menuRef = useRef(null);
    const [userId, setUserId] = useState();

    function formatDateToTurkish(dateString) {
        const months = [
            "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
            "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
        ];

        // Eğer dateString null, undefined, boş string veya "0" ise bugünü kullan
        let date;
        if (!dateString || dateString === "0") {
            date = new Date();
        } else {
            date = new Date(dateString);
        }

        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${day} ${month} ${year}`;
    }

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

    const handleUpdateTitle = async (id, newTitle) => {
        // 1. Önce arayüzü (state) hızlıca güncelle (Kullanıcı beklemesin)
        setHistoryItems(prev =>
            prev.map(i => i.id === id ? { ...i, conversation_name: newTitle } : i)
        );
        setEditingId(null);

        // 2. Veritabanına isteği gönder
        try {
            const formData = new FormData();
            // PHP kodun json_decode($_POST['data']) beklediği için bu formatta gönderiyoruz
            formData.append('data', JSON.stringify({
                id: id,
                conversation_name: newTitle
            }));

            const res = await fetch("/api/updateconversation.php", {
                method: "POST",
                body: formData, // FormData otomatik olarak Content-Type: multipart/form-data ayarlar
            });

            const result = await res.json();
            
            if (!result.success) {
                console.error("Güncelleme başarısız:", result.message);
                // Hata durumunda belki sayfayı yenileyebilir veya eski halini geri yükleyebilirsin
            }
        } catch (err) {
            console.error("API Hatası:", err);
        }
    };

    useEffect(() => {
        checkSession();
    },[]);

    useEffect(() => {
        if(!userId) return;
        fetch(`/api/gethistory.php?user_id=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP hatası! Durum: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("API Yanıtı:", data);
            setHistoryItems(data.results);
        })
        .catch(error => {
            console.error("Veri çekilirken bir sorun oluştu:", error);
        });
    },[userId]);

    const handleDelete = async () => {
        // Silinecek ID yoksa işlemi durdur
        if (!deleteTargetId) return;

        try {
            // PHP tarafı $_POST['id'] beklediği için FormData oluşturuyoruz
            const formData = new FormData();
            formData.append('id', deleteTargetId);

            const res = await fetch("/api/deleteconversation.php", {
                method: "POST",
                body: formData,
            });

            const result = await res.json();

            if (result.success) {
                // Veritabanında silindiği onaylanınca arayüzden de kaldırıyoruz
                setHistoryItems(prev => prev.filter(item => item.id !== deleteTargetId));
                console.log("Sohbet silindi:", result.deleted_id);
            } else {
                // API hata döndürürse kullanıcıya bilgi verebilirsin
                alert("Hata: " + result.message);
            }
        } catch (err) {
            console.error("Silme işlemi sırasında hata oluştu:", err);
            alert("İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.");
        } finally {
            // Her durumda modalı ve menüyü kapat
            setDeleteTargetId(null);
            setActiveMenuId(null);
        }
    };
    /*const handleDelete = () => {
        setHistoryItems(prev => prev.filter(item => item.id !== deleteTargetId));
        setDeleteTargetId(null);
        setActiveMenuId(null);
    };*/

    const handleChatClick = (item) => {
        // Chat mesajlarını localStorage'a kaydet
        localStorage.setItem('chatHistory', JSON.stringify(item.messages));
        localStorage.setItem('chatTitle', item.title);
        localStorage.setItem('chatId', item.chatId);
        
        // Chat sayfasına yönlendir
        router.push(`/dashboard/chat/?botId=${item.chatbot_id}&convId=${item.id}`);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setActiveMenuId(null);
            }
        }

        if (activeMenuId !== null) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [activeMenuId]);

    const filteredItems = historyItems.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.conversation_name.toLowerCase().includes(q) ||
            item.latest_message.toLowerCase().includes(q) ||
            item.latest_sent_time.toLowerCase().includes(q)
        );
    });

    return (
        <div className="history-wrapper">
            <div className="history-header">
                <h2>Geçmişim</h2>
                {filteredItems.length > 0 && (
                    <div className="history-search">
                        <input
                            type="text"
                            placeholder="Geçmiş sohbetlerde ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setSearchQuery('');
                            }}
                        />
                        <button aria-label="Ara" onClick={(e)=>e.preventDefault()}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.75 12.75L16.5 16.5" stroke="#f39" strokeWidth="1.5" strokeLinecap="round"/>
                                <circle cx="8" cy="8" r="5" stroke="#f39" strokeWidth="1.5"/>
                            </svg>
                        </button>
                    </div>
                )}
                
            </div>

            {filteredItems.length == 0 && <EmptyCart />}
            {filteredItems.length > 0 && <div className="history-list">
                {filteredItems.map((item) => (
                    <div key={item.id}
                        className="history-card"
                        onClick={(e) => {
                            if (
                                (menuRef.current && menuRef.current.contains(e.target)) ||
                                editingId === item.id
                            ) {
                                return;
                            }
                            handleChatClick(item);
                        }}>
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="205" height="111" viewBox="0 0 205 111" fill="none">
                                <g filter="url(#filter0_f_7772_7898)">
                                    <ellipse cx="19.5" cy="61.2" rx="66.5" ry="39.2" fill="url(#paint0_linear_7772_7898)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_7898" x="-165.698" y="-96.6976" width="370.395" height="315.796" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="59.3488" result="effect1_foregroundBlur_7772_7898" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_7898" x1="-47" y1="61.2" x2="86" y2="61.2" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="icon">
                            <Image src={item.profil_fotografi} width={40} height={40} alt="AI Icon" />
                        </div>
                        <div className="details">
                            <div className="top-card">
                                {editingId === item.id ? (
                                    <input
                                        type="text"
                                        defaultValue={item.conversation_name/*editedTitle*/}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        //onChange={(e) => setEditedTitle(e.target.value)}
                                        onBlur={() => handleUpdateTitle(item.id, editedTitle)}
                                        /*onBlur={() => {
                                            setHistoryItems(prev =>
                                                prev.map(i =>
                                                    i.id === item.id ? { ...i, title: editedTitle } : i
                                                )
                                            );
                                            setEditingId(null);
                                        }}*/
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleUpdateTitle(item.id, e.target.value);
                                            }
                                            if (e.key === "Escape") {
                                                setEditingId(null);
                                            }
                                        }}
                                        autoFocus
                                        className="editable-input"
                                    />
                                ) : (
                                    <h4>{item.conversation_name}</h4>
                                )}
                                <p>{formatDateToTurkish(item.latest_sent_time)}</p>
                            </div>
                            <span className="subtitle">
                                <div className="icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.2" d="M21 6V18C21 18.1989 20.921 18.3897 20.7803 18.5303C20.6397 18.671 20.4489 18.75 20.25 18.75H7.5L4.23281 21.5728C4.12357 21.6647 3.99038 21.7235 3.84887 21.7423C3.70737 21.7612 3.56343 21.7392 3.43397 21.6791C3.30451 21.6189 3.1949 21.523 3.11803 21.4028C3.04116 21.2825 3.00021 21.1428 3 21V6C3 5.80109 3.07902 5.61032 3.21967 5.46967C3.36032 5.32902 3.55109 5.25 3.75 5.25H20.25C20.4489 5.25 20.6397 5.32902 20.7803 5.46967C20.921 5.61032 21 5.80109 21 6Z" fill="#FFE6F2" />
                                        <path d="M20.25 4.5H3.75003C3.3522 4.5 2.97067 4.65804 2.68937 4.93934C2.40806 5.22064 2.25003 5.60218 2.25003 6V21C2.2483 21.286 2.32921 21.5665 2.48305 21.8076C2.63689 22.0488 2.8571 22.2404 3.11721 22.3594C3.31543 22.4517 3.53138 22.4997 3.75003 22.5C4.10214 22.4991 4.44256 22.3735 4.71096 22.1456L4.7194 22.1391L7.78128 19.5H20.25C20.6479 19.5 21.0294 19.342 21.3107 19.0607C21.592 18.7794 21.75 18.3978 21.75 18V6C21.75 5.60218 21.592 5.22064 21.3107 4.93934C21.0294 4.65804 20.6479 4.5 20.25 4.5ZM20.25 18H7.50003C7.31994 18.0001 7.1459 18.065 7.00971 18.1828L3.75003 21V6H20.25V18Z" fill="#FFE6F2" />
                                    </svg>

                                </div>
                                <span>
                                    {item.latest_message && item.latest_message.length > 100 ? item.latest_message.substring(0, 100) + "..." : item.latest_message}
                                </span>
                            </span>
                        </div>
                        <div className="menu-trigger">
                            <button className="dot-btn" onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === item.id ? null : item.id);
                            }}>
                                <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 14C4 14.5304 3.78929 15.0391 3.41421 15.4142C3.03914 15.7893 2.53043 16 2 16C1.46957 16 0.96086 15.7893 0.585787 15.4142C0.210714 15.0391 0 14.5304 0 14C0 13.4696 0.210714 12.9609 0.585787 12.5858C0.96086 12.2107 1.46957 12 2 12C2.53043 12 3.03914 12.2107 3.41421 12.5858C3.78929 12.9609 4 13.4696 4 14ZM4 8C4 8.53043 3.78929 9.03914 3.41421 9.41421C3.03914 9.78929 2.53043 10 2 10C1.46957 10 0.96086 9.78929 0.585787 9.41421C0.210714 9.03914 0 8.53043 0 8C0 7.46957 0.210714 6.96086 0.585787 6.58579C0.96086 6.21071 1.46957 6 2 6C2.53043 6 3.03914 6.21071 3.41421 6.58579C3.78929 6.96086 4 7.46957 4 8ZM2 4C2.53043 4 3.03914 3.78929 3.41421 3.41421C3.78929 3.03914 4 2.53043 4 2C4 1.46957 3.78929 0.960859 3.41421 0.585786C3.03914 0.210714 2.53043 0 2 0C1.46957 0 0.96086 0.210714 0.585787 0.585786C0.210714 0.960859 0 1.46957 0 2C0 2.53043 0.210714 3.03914 0.585787 3.41421C0.96086 3.78929 1.46957 4 2 4Z" fill="white" />
                                </svg>

                            </button>

                            {activeMenuId === item.id && (
                                <div className="context-menu" ref={menuRef}>
                                    <button className="menu-item" onClick={(e) => { e.preventDefault(); setDeleteTargetId(item.id) }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
                                            <path d="M0 5.375C0 5.08 -5.58794e-08 4.9325 0.0912499 4.84125C0.1825 4.75 0.33 4.75 0.625 4.75H19.375C19.67 4.75 19.8175 4.75 19.9088 4.84125C20 4.9325 20 5.08 20 5.375V5.69C20 5.8025 20 5.86 19.9825 5.91C19.9674 5.95308 19.9431 5.99233 19.9113 6.025C19.8738 6.0625 19.8237 6.0875 19.7225 6.13875C18.9088 6.545 18.5025 6.74875 18.2063 7.05375C17.9532 7.3144 17.7599 7.62707 17.64 7.97C17.5 8.37 17.5 8.825 17.5 9.735V16C17.5 18.3575 17.5 19.535 16.7675 20.2675C16.035 21 14.8575 21 12.5 21H7.5C5.1425 21 3.965 21 3.2325 20.2675C2.5 19.535 2.5 18.3575 2.5 16V9.735C2.5 8.825 2.5 8.37 2.36 7.97C2.24007 7.62707 2.04683 7.3144 1.79375 7.05375C1.4975 6.74875 1.09125 6.545 0.2775 6.13875C0.209326 6.11033 0.145723 6.072 0.0887501 6.025C0.0568881 5.99233 0.0325681 5.95308 0.0174999 5.91C-7.68341e-08 5.86 0 5.8025 0 5.69V5.375Z" fill="#FFE4E4" />
                                            <path d="M7.58594 1.4627C7.72844 1.3302 8.04219 1.2127 8.47969 1.12895C8.98179 1.0398 9.49099 0.996708 10.0009 1.0002C10.5509 1.0002 11.0859 1.0452 11.5222 1.12895C11.9584 1.2127 12.2722 1.3302 12.4159 1.46395" stroke="#DB1F35" strokeLinecap="round" />
                                            <path d="M13.75 10.375C13.75 10.0298 13.4702 9.75 13.125 9.75C12.7798 9.75 12.5 10.0298 12.5 10.375V16.625C12.5 16.9702 12.7798 17.25 13.125 17.25C13.4702 17.25 13.75 16.9702 13.75 16.625V10.375Z" fill="#DB1F35" />
                                            <path d="M7.5 10.375C7.5 10.0298 7.22018 9.75 6.875 9.75C6.52982 9.75 6.25 10.0298 6.25 10.375V16.625C6.25 16.9702 6.52982 17.25 6.875 17.25C7.22018 17.25 7.5 16.9702 7.5 16.625V10.375Z" fill="#DB1F35" />
                                        </svg>
                                        Sil
                                    </button>
                                    <div className="seperator"></div>
                                    <button className="menu-item" onClick={(e) => {
                                        e.preventDefault();
                                        //setEditedTitle(item.conversation_name);
                                        setEditingId(item.id);
                                        setActiveMenuId(null);
                                    }}>
                                        <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M15.8335 3.16732C15.511 2.87064 15.0839 2.71403 14.6461 2.73184C14.2082 2.74965 13.7953 2.94043 13.498 3.26232L8.05144 8.70924L7.125 11.8758L10.2915 10.9497L15.7385 5.54232C15.9037 5.39449 16.0375 5.21499 16.132 5.01445C16.2265 4.81392 16.2798 4.59644 16.2886 4.37493C16.2975 4.15341 16.2618 3.93238 16.1836 3.72494C16.1054 3.51749 15.9863 3.32787 15.8335 3.16732Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M9.5 2.375H3.16654C2.95661 2.375 2.75528 2.45839 2.60684 2.60684C2.45839 2.75528 2.375 2.95661 2.375 3.16654V15.8335C2.375 16.0434 2.45839 16.2447 2.60684 16.3932C2.75528 16.5416 2.95661 16.625 3.16654 16.625H15.8335C16.0434 16.625 16.2447 16.5416 16.3932 16.3932C16.5416 16.2447 16.625 16.0434 16.625 15.8335V9.5" stroke="url(#paint0_linear_7960_8661)" strokeLinecap="round" strokeLinejoin="round" />
                                            <defs>
                                                <linearGradient id="paint0_linear_7960_8661" x1="17.8437" y1="19.9659" x2="2.56565" y2="0.0473143" gradientUnits="userSpaceOnUse">
                                                    <stop offset="0.211538" stop-color="#FF66C4" />
                                                    <stop offset="1" stop-color="#4699FF" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        Başlığı Düzenle
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>}
            <DeleteConfirmModal
                isOpen={!!deleteTargetId}
                onClose={() => setDeleteTargetId(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
