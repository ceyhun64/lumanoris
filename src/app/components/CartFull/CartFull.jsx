"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import SuggestedCard from "../SuggestedCard/SuggestedCard";
import avatarBot from "../../../images/avatar-bot.jpg";
import botImage from "../../../images/bot-image.png";
import DeleteConfirmModal from "../DeleteConfirmModal";
import BotCard from "../BotCard/BotCard";

export default function CartFull({ userId, cartItems, onRemove, onConfirm }) {
    const router = useRouter();
    const [deleteTarget, setDeleteTarget] = useState(null);
    
    // Her öğe için seçilen süreyi (1, 2, 3, veya 4 hafta) tutacak state
    const [itemDurations, setItemDurations] = useState({});
    
    const [selectedItems, setSelectedItems] = useState(
        cartItems.map((item) => item.id)
    );
    const [suggestedBots, setSuggestedBots] = useState([]);
    

    const fetchSuggestedBots = useCallback(async () => {
        if (!userId) return;
        try {
            const response = await fetch(`/api/get_suggested.php?user_id=${userId}`);
            const data = await response.json();
            
            // API'den gelen veriyi SuggestedCard'ın beklediği formata dönüştürelim
            const formattedBots = data.map(bot => ({
                id: bot.id,
                title: bot.isim,
                author: bot.owner_name || "Bilinmiyor",
                dialogues: bot.toplam_chats || 0,
                time: "Yeni", // Veya ucret_haftalik üzerinden bir veri
                avatar: bot.profil_fotografi || avatarBot,
                image: bot.kapak_fotografi || botImage,
                badge: { type: "produced", label: "Önerilen" }
            }));
            
            setSuggestedBots(formattedBots);
        } catch (error) {
            console.error("Önerilen botlar yüklenirken hata:", error);
        }
    }, [userId]);

    useEffect(() => {
        fetchSuggestedBots();
    }, [fetchSuggestedBots]);

    // Başlangıçta tüm öğeleri aylık (4 hafta) olarak ayarla
    useEffect(() => {
        const initialDurations = {};
        console.log(cartItems);
        cartItems.forEach(item => {
            initialDurations[item.id] = item.order_weeks ? parseInt(item.order_weeks) : 1; // Varsayılan: Aylık (4 hafta)
        });
        setItemDurations(initialDurations);
    }, [cartItems]);


    // Toplamları hesaplayan ana fonksiyon (Döngüde kullanılacağı için useCallback)
    const calculateTotals = useCallback(() => {
        let newSubtotal = 0;
        const selectedProducts = cartItems.filter((item) => selectedItems.includes(item.id));
        
        selectedProducts.forEach(item => {
            const durationWeeks = itemDurations[item.id] || 4;
            let price = 0;

            // Varsayım: item.price haftalık, item.monthlyPrice aylık ücreti tutuyor
            const weeklyPrice = parseFloat(item.price) || 0; 
            // Aylık fiyatı yoksa, haftalık fiyatın 4 katının %95'i olarak hesaplıyoruz (Görüntüdeki mantığı taklit)
            const monthlyPrice = parseFloat(item.monthlyPrice) || (weeklyPrice * 4); 

            if (durationWeeks >= 1 && durationWeeks <= 3) {
                // 1, 2, veya 3 haftalık: Haftalık fiyat * hafta sayısı
                price = weeklyPrice * durationWeeks;
            } else if (durationWeeks === 4) {
                // Aylık (4 hafta): %5 indirimli aylık fiyat (Görüntüdeki kural)
                price = monthlyPrice * 0.95;
            }
            
            newSubtotal += price;
        });

        const finalTotal = newSubtotal;

        return {
            subtotal: newSubtotal,
            total: finalTotal
        };
    }, [cartItems, selectedItems, itemDurations]);

    const { subtotal, total } = calculateTotals();


    const handleCheckboxChange = (id) => {
        setSelectedItems((prev) =>
            prev.includes(id)
                ? prev.filter((itemId) => itemId !== id)
                : [...prev, id]
        );
    };
    
    // YENİ: Süre seçimi için
    const handleDurationChange = async (itemId, duration) => {
        // 1. Arayüzü anında güncelle (Kullanıcı gecikme hissetmesin)
        setItemDurations(prev => ({ ...prev, [itemId]: duration }));

        // 2. Veritabanını güncelle
        try {
            const formData = new FormData();
            
            // PHP'nin beklediği "data" formatında JSON objesi oluşturuyoruz
            const updatePayload = {
                id: itemId,
                order_weeks: duration
            };
            
            formData.append('data', JSON.stringify(updatePayload));

            const response = await fetch('/api/updatecart.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!result.success) {
                console.error("DB Güncelleme hatası:", result.message);
                // Opsiyonel: Hata olursa kullanıcıya bildir veya state'i geri al
            }
        } catch (error) {
            console.error("İstek hatası:", error);
        }
    };

    const handleRemoveSuggestedBot = (index) => {
        setSuggestedBots(prev => prev.filter((_, i) => i !== index));
    };

    const handleFinalConfirm = () => {
        const dataToConfirm = cartItems
            .filter(item => selectedItems.includes(item.id))
            .map(item => ({
                ...item,
                duration_weeks: itemDurations[item.id] || 1 
            }));

        if (dataToConfirm.length === 0) {
            alert("Lütfen en az bir ürün seçin.");
            return;
        }

        onConfirm(dataToConfirm); // Veriyi Checkout.jsx'e gönderir
    };

    return (
    <div className="cart-full-wrapper">
        <div className="cart-main">
            <div className="cart-left">
                <div className="cart-left-inner">
                    <div className="shadow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                            <g filter="url(#filter0_f_7772_12866)">
                                <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_12866)" />
                            </g>
                            <defs>
                                <filter id="filter0_f_7772_12866" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                    <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_12866" />
                                </filter>
                                <linearGradient id="paint0_linear_7772_12866" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                    <stop offset="0.211538" stop-color="#4699FF" />
                                    <stop offset="0.793269" stop-color="#FF66C4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <label className="checkbox-option">
                        <input
                            type="checkbox"
                            checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedItems(cartItems.map((item) => item.id));
                                } else {
                                    setSelectedItems([]);
                                }
                            }}
                        />
                        <span className="custom-check"></span>
                    </label>


                    <div className="seperator" />

                    {cartItems.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        const currentDuration = itemDurations[item.id] || 4;
        
        // Fiyat hesaplama mantığı (aynı kalıyor)
        const weeklyPrice = parseFloat(item.price) || 0;
        const monthlyPrice = parseFloat(item.monthlyPrice) || (weeklyPrice * 4);
        let currentPrice = (currentDuration === 4) ? (monthlyPrice * 0.95) : (weeklyPrice * currentDuration);

        return (
            <div className="cart-item" key={item.id} style={{ alignItems: 'flex-start', padding: '20px 0' }}>
                <label className="checkbox-option" style={{ marginTop: '30px' }}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(item.id)}
                    />
                    <span className="custom-check"></span>
                </label>

                <div className="image" style={{ marginTop: '10px' }}>
                    <Image src={item.image} width={80} height={80} alt={item.title} style={{ 
      objectFit: 'cover', 
      width: '240px', 
      height: '240px',
      flexShrink: 0 // Flexbox içindeyse küçülmesini engeller
    }} className="rounded-bot" />
                </div>

                <div className="cart-content-wrapper" style={{ flex: 1, marginLeft: '15px' }}>
                    <div className="cart-details">
                        <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>{item.title}</h3>
                        <p style={{ fontSize: '16px', opacity: 0.7, marginBottom: '15px' }}>
                            Kategori: <span style={{ fontSize: '16px', color: '#FF66C4' }}>{item.category || 'Genel'}</span>
                        </p>
                    </div>

                    {/* Süre Seçim Butonları - 2x2 Grid Tasarımı */}
                    <div className="duration-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', // 2 sütunlu yapı
                        gap: '10px', 
                        marginTop: '15px', 
                        maxWidth: '320px' 
                    }}>
                        {[
                            { id: 1, label: 'Bir Haftalık' },
                            { id: 2, label: 'İki Haftalık' },
                            { id: 3, label: 'Üç Haftalık' },
                            { id: 4, label: 'Bir Aylık' }
                        ].map((d) => {
                            const isActive = currentDuration === d.id;
                            return (
                                <button
                                    key={d.id}
                                    onClick={() => handleDurationChange(item.id, d.id)}
                                    className={`duration-btn ${isActive ? 'active' : ''}`}
                                    style={{
                                        padding: '12px 0',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontSize: '13px',
                                        fontWeight: isActive ? '600' : '400',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        // Aktifken mor gradient, pasifken koyu gri (Ekran görüntüsündeki gibi)
                                        background: isActive 
                                            ? 'linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)' 
                                            : '#23252B',
                                        color: '#fff',
                                        boxShadow: isActive ? '0 4px 15px rgba(139, 92, 246, 0.3)' : 'none'
                                    }}
                                >
                                    {d.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="right" style={{ textAlign: 'right', minWidth: '100px' }}>
                    <div className="cart-price" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {currentPrice.toFixed(2)}₺
                    </div>
                    <button className="remove-btn" onClick={() => setDeleteTarget(item.id)} style={{ marginTop: '40px' }}>
                        {/* SVG ikonun aynı kalabilir */}
                        <svg width="20" height="21" viewBox="0 0 20 21" fill="none">...</svg>
                    </button>
                </div>
            </div>
        );
    })}
                    </div>

                    <div className="suggested-bots">
                        <h5>
                            Önerilen Chatbotlar
                        </h5>

                        <div className="hr">
                            <div className="hr-inner"></div>
                        </div>

                        <div className="suggested-bots-grid">
                            {suggestedBots.map((bot, i) => (
                                <BotCard key={i} bot={bot} onRemove={() => handleRemoveSuggestedBot(i)} />
                            ))}
                        </div>

                    </div>
                </div>

                {/* Sağ Alan - Özet */}
                <div className="cart-right">
                    <div className="shadow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                            <g filter="url(#filter0_f_7772_12866)">
                                <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_12866)" />
                            </g>
                            <defs>
                                <filter id="filter0_f_7772_12866" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                    <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_12866" />
                                </filter>
                                <linearGradient id="paint0_linear_7772_12866" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                    <stop offset="0.211538" stop-color="#4699FF" />
                                    <stop offset="0.793269" stop-color="#FF66C4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <h4>Sipariş Özeti</h4>
                    <div className="summary-line">
                        <span>Ürün Tutarı</span>
                        <span className="pr">{subtotal.toFixed(2)}₺</span>
                    </div>
                    <div className="summary-line total">
                        <strong>Toplam</strong>
                        <strong className="pr">{total.toFixed(2)}₺</strong>
                    </div>
                    <div className="coupon-input">
                        <div className="ic">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" fill="#FFF0FF" />
                                <path d="M12 8V16M16 12H8" stroke="#FF66C4" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <input placeholder="İndirim kodu gir" />
                    </div>
                    <button className="checkout-btn" onClick={handleFinalConfirm}>
                        SEPETİ ONAYLA
                    </button>
                </div>
            </div>
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    onRemove(deleteTarget);
                    setSelectedItems(prev => prev.filter(id => id !== deleteTarget));
                    setDeleteTarget(null);
                }}
            />
        </div>
    );
}