'use client';
import { useState, useEffect } from 'react';

export default function AddToSaleListModal({ 
    isOpen, 
    onClose,
    botId, 
    weeklyPrice, // Mevcut haftalık fiyat (örn: 100)
    monthlyPrice, // Mevcut aylık fiyat (örn: 380)
    header = "Satış Fiyatını Düzenle" 
}) {
    const [wPrice, setWPrice] = useState(weeklyPrice || '');
    const [mPrice, setMPrice] = useState(monthlyPrice || '');
    const [selectedWeeks, setSelectedWeeks] = useState(1);
    const [showFeedback, setShowFeedback] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Modal her açıldığında proplardan gelen güncel fiyatları state'e yükle
    useEffect(() => {
        if (isOpen) {
            setWPrice(weeklyPrice);
            setMPrice(monthlyPrice);
            setErrorMsg('');
        }
    }, [isOpen, weeklyPrice, monthlyPrice]);

    // Toplam Tutar Hesaplama (Görüntüleme amaçlı)
    const calculateTotal = () => {
        const weekly = parseFloat(wPrice) || 0;
        const monthly = parseFloat(mPrice) || 0;

        if (selectedWeeks === 4) {
            return monthly.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
        }
        return (weekly * selectedWeeks).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    };

    const handleSave = async () => {
        setErrorMsg('');
        const weekly = parseFloat(wPrice);
        const monthly = parseFloat(mPrice);

        // 1. Giriş Kontrolleri
        if (isNaN(weekly) || isNaN(monthly) || weekly <= 0 || monthly <= 0) {
            setErrorMsg("Haftalık ve aylık fiyatlar geçerli pozitif sayı olmalıdır.");
            return;
        }

        // 2. Sınırlama Kontrolü
        const calculatedMax = weekly * 4; // Haftalık fiyat * 4
        const calculatedMin = weekly * 3; // Haftalık fiyat * 3 (veya dilediğiniz alt sınır)

        // Aylık fiyatın, 3 haftalık fiyat ile 4 haftalık fiyat arasında olup olmadığını kontrol ediyoruz.
        // Eğer aylık fiyat 4 haftalık fiyattan büyükse veya 3 haftalık fiyattan küçükse uyarı ver.
        if (monthly > calculatedMax || monthly < calculatedMin) {
            setErrorMsg(`Aylık fiyat, ${calculatedMin.toFixed(2)} TL ile ${calculatedMax.toFixed(2)} TL arasında olmalıdır.`);
            return;
        }

        // Eğer kontroller geçerse API çağrısını yap
        const payload = {
            id: botId, // Modal'a prop olarak botun ID'sini de geçmelisin
            ucret_haftalik: wPrice,
            ucret_aylik: mPrice
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
            const res = await fetch('/api/chatbot/updatechatbotprice.php', {
                method: 'POST',
                body: formData
            });
            const result = await res.json();
            
            if (result.success) {
                setShowFeedback(true);
                setTimeout(() => {
                    setShowFeedback(false);
                    window.dispatchEvent(new Event('cartUpdated'));
                    onClose();
                }, 1500);
            } else {
                setErrorMsg(result.message);
            }
        } catch (err) {
            setErrorMsg("Bağlantı hatası: " + err.message);
        }
    };

    useEffect(() => {
        const escHandler = (e) => e.key === 'Escape' && onClose();
        if (isOpen) document.addEventListener('keydown', escHandler);
        return () => document.removeEventListener('keydown', escHandler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="share-overlay" onClick={onClose}>
            {showFeedback && <div className="copy-badge">Fiyatlar Güncellendi ✅</div>}

            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{header}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 13.4008L7.10005 18.3008C6.91672 18.4841 6.68338 18.5758 6.40005 18.5758C6.11672 18.5758 5.88338 18.4841 5.70005 18.3008C5.51672 18.1174 5.42505 17.8841 5.42505 17.6008C5.42505 17.3174 5.51672 17.0841 5.70005 16.9008L10.6 12.0008L5.70005 7.10078C5.51672 6.91745 5.42505 6.68411 5.42505 6.40078C5.42505 6.11745 5.51672 5.88411 5.70005 5.70078C5.88338 5.51745 6.11672 5.42578 6.40005 5.42578C6.68338 5.42578 6.91672 5.51745 7.10005 5.70078L12 10.6008L16.9 5.70078C17.0834 5.51745 17.3167 5.42578 17.6 5.42578C17.8834 5.42578 18.1167 5.51745 18.3 5.70078C18.4834 5.88411 18.575 6.11745 18.575 6.40078C18.575 6.68411 18.4834 6.91745 18.3 7.10078L13.4 12.0008L18.3 16.9008C18.4834 17.0841 18.575 17.3174 18.575 17.6008C18.575 17.8841 18.4834 18.1174 18.3 18.3008C18.1167 18.4841 17.8834 18.5758 17.6 18.5758C17.3167 18.5758 17.0834 18.4841 16.9 18.3008L12 13.4008Z" fill="#FF99D6" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <p className="desc-2" style={{ marginBottom: '20px' }}>
                        Botunuzun satış fiyatlarını aşağıdan düzenleyebilirsiniz.
                    </p>

                    {/* Haftalık Fiyat Düzenleme */}
                    <div className="input-group" style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '12px', color: '#FF66C4', display: 'block', marginBottom: '5px' }}>HAFTALIK BİRİM FİYAT</label>
                        <div className="new-list-input">
                            <input
                                type="number"
                                value={wPrice}
                                onChange={(e) => setWPrice(e.target.value)}
                                placeholder="0.00"
                            />
                            <span style={{ color: '#FF66C4', fontWeight: 'bold', marginRight: '10px' }}>TL</span>
                        </div>
                    </div>

                    {/* Aylık Fiyat Düzenleme */}
                    <div className="input-group" style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', color: '#00D1FF', display: 'block', marginBottom: '5px' }}>AYLIK (4 HAFTA) ÖZEL FİYAT</label>
                        <div className="new-list-input" style={{ border: '1px solid rgba(0, 209, 255, 0.5)' }}>
                            <input
                                type="number"
                                value={mPrice}
                                onChange={(e) => setMPrice(e.target.value)}
                                placeholder="0.00"
                            />
                            <span style={{ color: '#00D1FF', fontWeight: 'bold', marginRight: '10px' }}>TL</span>
                        </div>
                        {parseFloat(wPrice) > 0 && (
                            <small style={{ display: 'block', marginTop: '6px', fontSize: '11px', opacity: 0.7 }}>
                                Aylık fiyat {(parseFloat(wPrice) * 3).toFixed(2)} TL ile {(parseFloat(wPrice) * 4).toFixed(2)} TL arasında olmalıdır.
                            </small>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="error-text" style={{ color: '#FF66C4', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
                            {errorMsg}
                        </div>
                    )}

                    <div className="seperator" style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '20px' }}></div>

                    {/* Önizleme İçin Süre Seçimi */}
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '10px' }}>ÖNİZLEME İÇİN SÜRE SEÇİN</label>
                    <div className="duration-selector" style={{ 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', // Sütunları tam yayar
    gap: '10px', 
    marginBottom: '25px',
    width: '100%', // Kapsayıcıyı tam doldur
    maxWidth: '400px' // Burayı kartın genişliğine göre artırabilirsin
}}>
    {[
        { id: 1, label: 'Bir Haftalık' },
        { id: 2, label: 'İki Haftalık' },
        { id: 3, label: 'Üç Haftalık' },
        { id: 4, label: 'Bir Aylık' }
    ].map((d) => {
        const isActive = selectedWeeks === d.id;
        return (
            <button
                key={d.id}
                className={`week-btn ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedWeeks(d.id)}
                style={{
                    width: '100%', // BUTONU GENİŞLETEN ASIL KISIM
                    padding: '14px 0', // Biraz daha heybetli dursun diye artırdım
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
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

                    {/* Özet Alanı */}
                    <div className="price-summary" style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        padding: '15px', 
                        borderRadius: '12px',
                        marginBottom: '20px',
                        textAlign: 'center',
                        border: '1px dashed rgba(255, 102, 196, 0.5)'
                    }}>
                        <span style={{ fontSize: '11px', display: 'block', opacity: 0.6, marginBottom: '5px' }}>
                            SEÇİLEN SÜREYE GÖRE TOPLAM TUTAR
                        </span>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                            {calculateTotal()} TL
                        </div>
                    </div>

                    <div className="modal-actions" style={{ display: 'flex', gap: '10px' }}>
                        <button className="cancel-btn" onClick={onClose} style={{ flex: 1 }}>İptal</button>
                        <button className="save-btn" onClick={handleSave} style={{ flex: 2 }}>Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
    );
}