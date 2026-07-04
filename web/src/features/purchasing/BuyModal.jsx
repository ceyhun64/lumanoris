// BuyModal.jsx
'use client';
import React, { useState, useEffect } from 'react';

const WEEKS_TO_DURATION = { 1: '1_week', 2: '2_weeks', 3: '3_weeks', 4: '1_month' };

// PHP tarafındaki coin_engine.php > calculateMessageAllowance() ile aynı
// formülün JS aynası (Sohbet Luma Coini, satın alınan bota özel bonus hak).
const COIN_TIER_BASE = 150;
const COIN_TIER_STEP = 100;
const COIN_TIER_CAP = 1000;
function calculateMessageAllowance(totalPaid) {
    if (!totalPaid || totalPaid < 100) return 0;
    const tier = Math.floor(totalPaid / 100);
    return Math.min(COIN_TIER_CAP, COIN_TIER_BASE + (tier - 1) * COIN_TIER_STEP);
}

export default function BuyModal({ isOpen, onClose, botData, userId, initialDurationWeeks }) {
    // botData'nın null/undefined olma ihtimaline karşı güvenlik önlemi
    if (!botData) return null;
    const buyerId = userId;

    // Sepette zaten bir süre seçilmişse onu, yoksa 'Bir Aylık'ı varsayılan al
    const [selectedDuration, setSelectedDuration] = useState(
        WEEKS_TO_DURATION[initialDurationWeeks] || '1_month'
    );
    const [price, setPrice] = useState(0);
    const [priceType, setPriceType] = useState('TL');
    const [durationIndex, setDurationIndex] = useState(initialDurationWeeks || 4);
    const [messageAllowance, setMessageAllowance] = useState(0);

    // Sepetten gelen mevcut süre bilgisi (sayfa yüklendikten sonra) değişirse seçimi güncelle
    useEffect(() => {
        if (initialDurationWeeks && WEEKS_TO_DURATION[initialDurationWeeks]) {
            setSelectedDuration(WEEKS_TO_DURATION[initialDurationWeeks]);
        }
    }, [initialDurationWeeks]);

    useEffect(() => {
        if (botData) {
            let calculatedPrice = 0;
            let pType = "TL";
            const weeklyPrice = botData.ucret_haftalik || 0; // Haftalık fiyatı al
            const monthlyPrice = botData.ucret_aylik || 0;
            // Fiyat hesaplama mantığı
            switch (selectedDuration) {
                case '1_week':
                    calculatedPrice = weeklyPrice;
                    setDurationIndex(1);
                    break;
                case '2_weeks':
                    calculatedPrice = weeklyPrice * 2;
                    setDurationIndex(2);
                    break;
                case '3_weeks':
                    calculatedPrice = weeklyPrice * 3;
                    setDurationIndex(3);
                    break;
                case '1_month':
                    const baseMonthlyPrice = monthlyPrice;
                    setDurationIndex(4);
                    calculatedPrice = botData.ucret_aylik;
                    break;
                default:
                    calculatedPrice = 0;
            }
            setPrice(calculatedPrice);
            setPriceType(pType);

            // Gerçekte ödenecek tutar üzerinden mesaj hakkı önizlemesi
            // (1 aylık seçimde createsubscription.php %5 indirim uyguluyor).
            const actualPaid = selectedDuration === '1_month' ? calculatedPrice * 0.95 : calculatedPrice;
            setMessageAllowance(calculateMessageAllowance(actualPaid));
        }
    }, [selectedDuration, botData]);

    if (!isOpen) return null;

    /*const handleFinalBuy = () => {
        console.log(`Satın alma işlemi seçildi: Süre: ${selectedDuration}, Fiyat: ${price} ${priceType}`);
        // Müşteri cevabını beklediğiniz aksiyon buraya gelecek.
        onClose(); // Şimdilik sadece kapatıyoruz.
    };*/

    const handleFinalBuy = async () => {
        const payload = {
            user_id: userId,
            chatbot_id: botData.id, // botData içinden chatbot ID'sini alıyoruz
            order_weeks: durationIndex, // Opsiyonel: Sepette süreyi de tutmak istersen
        };
        console.log(payload);

        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        console.log(formData.get('data'));
        
        try {
          const response = await fetch("/api/marketplace/addtocart.php", {
            method: "POST",
            body: formData, // JSON.stringify(payload) yerine formData gönderiyoruz
          });

          const result = await response.json();

          if (result.success) {
            // Başarılıysa Checkout sayfasına yönlendir
            console.log("Başarılı:", result.message);
            window.dispatchEvent(new Event('cartUpdated'));
            window.location.href = "/dashboard/checkout";
          } else {
            // Hata mesajını göster (Örn: "Zaten sepette")
            alert(result.message);
          }
        } catch (error) {
          console.error("Hata oluştu:", error);
          alert("Bir hata oluştu, lütfen tekrar deneyin.");
        }
    };
    
    // Modal dışına tıklama ile kapatma mantığı
    const handleBackdropClick = (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            onClose();
        }
    };

    const DURATIONS = [
        { key: '1_week', label: 'Bir Haftalık' },
        { key: '2_weeks', label: 'İki Haftalık' },
        { key: '3_weeks', label: 'Üç Haftalık' },
        { key: '1_month', label: 'Bir Aylık' },
    ];

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="buy-modal">
                <button className="modal-close" onClick={onClose}>&times;</button>
                <h2 className="modal-title">Satın Al</h2>
                <p className="modal-subtitle">{botData.isim || "Bu chatbot"}</p>
                <p className="modal-description">Chatbotunu satın al, sınırsız kullanımın kilidini aç!</p>
                <p className="modal-info">Haftalık veya aylık seçeneklerden dilediğini seçerek kullanım süreni bütçene göre belirleyebilirsin.</p>

                <div
                    className="duration-options"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0' }}
                >
                    {DURATIONS.map((d) => {
                        const isActive = selectedDuration === d.key;
                        return (
                            <button
                                key={d.key}
                                onClick={() => setSelectedDuration(d.key)}
                                style={{
                                    width: '100%', padding: '14px 0', borderRadius: '12px', border: 'none',
                                    fontSize: '13px', fontWeight: isActive ? 600 : 400, cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: isActive ? 'linear-gradient(90deg, #6366F1 0%, #06B6D4 100%)' : 'rgba(255,255,255,0.06)',
                                    color: '#fff',
                                    boxShadow: isActive ? '0 4px 15px rgba(99, 102, 241, 0.30)' : 'none',
                                }}
                            >
                                {d.label}
                            </button>
                        );
                    })}
                </div>

                {selectedDuration === '1_month' && (
                    <div className="monthly-discount">
                        👍 Aylık planı tercih et, haftalık toplam fiyata kıyasla %{Math.round((1 - (botData.ucret_aylik / (botData.ucret_haftalik * 4))) * 100)} kâr sağla.
                    </div>
                )}

                <div
                    className="price-display"
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '12px',
                        margin: '12px 0', textAlign: 'center', border: '1px dashed rgba(99, 102, 241, 0.4)',
                    }}
                >
                    <span style={{ fontSize: 11, display: 'block', opacity: 0.6, marginBottom: 5 }}>
                        {selectedDuration === '1_month' ? 'BİR AYLIK SATIŞ FİYATI' : 'SEÇİLEN SÜREYE GÖRE SATIŞ FİYATI'}
                    </span>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>{price}{priceType}</div>
                </div>

                {messageAllowance > 0 && (
                    <div className="message-allowance-preview" style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
                        🎁 Bu chatbotu satın alırsan <b>{messageAllowance} mesaj hakkı</b> kazanırsın (sadece bu chatbotta geçerli).
                    </div>
                )}

                <div className="modal-actions" style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                    <button className="btn-cancel" onClick={onClose} style={{ flex: 1 }}>İptal</button>
                    <button className="btn-buy-final" onClick={handleFinalBuy} style={{ flex: 2 }}>Satın Al</button>
                </div>
            </div>
        </div>
    );
}