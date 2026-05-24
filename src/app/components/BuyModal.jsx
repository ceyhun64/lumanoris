// BuyModal.jsx
'use client';
import React, { useState, useEffect } from 'react';

export default function BuyModal({ isOpen, onClose, botData, userId }) {
    // botData'nın null/undefined olma ihtimaline karşı güvenlik önlemi
    if (!botData) return null; 
    const buyerId = userId;

    // Ekran görüntüsündeki gibi 'Bir Aylık' seçili olarak başlatılıyor
    const [selectedDuration, setSelectedDuration] = useState('1_month'); 
    const [price, setPrice] = useState(0);
    const [priceType, setPriceType] = useState('TL');
    const [durationIndex, setDurationIndex] = useState(1);

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
          const response = await fetch("/api/addtocart.php", {
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

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="buy-modal">
                <button className="modal-close" onClick={onClose}>&times;</button>
                <h2 className="modal-title">Satın Al</h2>
                <p className="modal-subtitle">{botData.isim || "Aristoteles"}</p>
                <p className="modal-description">Chatbotunu satın al, sınırsız kullanımın kilidini aç!</p>
                <p className="modal-info">Haftalık veya aylık seçeneklerden dilediğini seçerek kullanım süreni bütçene göre belirleyebilirsin.</p>

                <div className="duration-options">
                    <button
                        className={`duration-btn ${selectedDuration === '1_week' ? 'active' : ''}`}
                        onClick={() => setSelectedDuration('1_week')}
                    >
                        Bir Haftalık
                    </button>
                    <button
                        className={`duration-btn ${selectedDuration === '2_weeks' ? 'active' : ''}`}
                        onClick={() => setSelectedDuration('2_weeks')}
                    >
                        İki Haftalık
                    </button>
                    <button
                        className={`duration-btn ${selectedDuration === '3_weeks' ? 'active' : ''}`}
                        onClick={() => setSelectedDuration('3_weeks')}
                    >
                        Üç Haftalık
                    </button>
                    <button
                        className={`duration-btn ${selectedDuration === '1_month' ? 'active' : ''}`}
                        onClick={() => setSelectedDuration('1_month')}
                    >
                        Bir Aylık
                    </button>
                </div>

                {selectedDuration === '1_month' && (
                    <div className="monthly-discount">
                        👍 Aylık planı tercih et, haftalık toplam fiyata kıyasla %{Math.round((1 - (botData.ucret_aylik / (botData.ucret_haftalik * 4))) * 100)} kâr sağla.
                    </div>
                )}

                <div className="price-display">
                    BİR AYLIK SATIŞ FİYATI: <b>{price}{priceType}</b>
                    {/* Sale ikonu (Görüntüdeki gibi) */}
                </div>

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>İptal</button>
                    <button className="btn-buy-final" onClick={handleFinalBuy}>Satın Al</button>
                </div>
            </div>
        </div>
    );
}