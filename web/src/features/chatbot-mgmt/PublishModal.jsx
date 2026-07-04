'use client';
import { useState, useEffect } from 'react';
import useSellerStatus from '@/shared/hooks/useSellerStatus';
import SellerOnboardingWizard from '@/features/seller/SellerOnboardingWizard';

export default function PublishModal({
    isOpen,
    onClose,
    onPublished,
    botId,
    userId,
    weeklyPrice,
    monthlyPrice,
}) {
    const seller = useSellerStatus(isOpen ? userId : null);
    const [wPrice, setWPrice] = useState(weeklyPrice || '');
    const [mPrice, setMPrice] = useState(monthlyPrice || '');
    const [selectedWeeks, setSelectedWeeks] = useState(1);
    const [showFeedback, setShowFeedback] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setWPrice(weeklyPrice || '');
            setMPrice(monthlyPrice || '');
            setErrorMsg('');
        }
    }, [isOpen, weeklyPrice, monthlyPrice]);

    const calculateTotal = () => {
        const weekly = parseFloat(wPrice) || 0;
        const monthly = parseFloat(mPrice) || 0;
        if (selectedWeeks === 4) {
            return monthly.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
        }
        return (weekly * selectedWeeks).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    };

    const handlePublish = async () => {
        const weekly = parseFloat(wPrice);
        const monthly = parseFloat(mPrice);

        if (isNaN(weekly) || isNaN(monthly) || weekly <= 0 || monthly <= 0) {
            setErrorMsg('Haftalık ve aylık fiyatlar geçerli pozitif sayı olmalıdır.');
            return;
        }

        const calculatedMax = weekly * 4;
        const calculatedMin = weekly * 3;
        if (monthly > calculatedMax || monthly < calculatedMin) {
            setErrorMsg(`Aylık fiyat ${calculatedMin.toFixed(2)} TL ile ${calculatedMax.toFixed(2)} TL arasında olmalıdır.`);
            return;
        }

        const payload = { id: botId, user_id: userId, ucret_haftalik: wPrice, ucret_aylik: mPrice };
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
            const res = await fetch('/api/chatbot/publishchatbot.php', { method: 'POST', body: formData });
            const result = await res.json();

            if (result.success) {
                setShowFeedback(true);
                setTimeout(() => {
                    setShowFeedback(false);
                    if (onPublished) onPublished();
                    onClose();
                }, 1500);
            } else {
                setErrorMsg(result.message || 'Yayınlama başarısız oldu.');
            }
        } catch (err) {
            setErrorMsg('Bağlantı hatası: ' + err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="share-overlay" onClick={onClose}>
            {showFeedback && <div className="copy-badge">Chatbot Yayınlandı ✅</div>}

            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Herkese Açık Yayınla</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {seller.loading ? (
                        <p>Yükleniyor...</p>
                    ) : seller.status !== 'active' ? (
                        <>
                            <p className="desc-2" style={{ marginBottom: 16 }}>
                                Chatbotunuzu herkese açık yayınlamak için önce pazaryeri satıcı kaydınızı tamamlamalısınız.
                            </p>
                            <SellerOnboardingWizard
                                userId={userId}
                                initialStatus={seller}
                                onComplete={() => seller.refetch()}
                            />
                        </>
                    ) : (
                        <>
                            <p className="desc-2" style={{ marginBottom: '20px' }}>
                                Chatbotunuzu herkese açık yayınlamak için fiyatlarını belirleyin.
                            </p>

                            <div className="input-group" style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '12px', color: '#FF66C4', display: 'block', marginBottom: '5px' }}>HAFTALIK BİRİM FİYAT</label>
                                <div className="new-list-input">
                                    <input type="number" value={wPrice} onChange={(e) => setWPrice(e.target.value)} placeholder="0.00" />
                                    <span style={{ color: '#FF66C4', fontWeight: 'bold', marginRight: '10px' }}>TL</span>
                                </div>
                            </div>

                            <div className="input-group" style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', color: '#00D1FF', display: 'block', marginBottom: '5px' }}>AYLIK (4 HAFTA) ÖZEL FİYAT</label>
                                <div className="new-list-input" style={{ border: '1px solid rgba(0, 209, 255, 0.5)' }}>
                                    <input type="number" value={mPrice} onChange={(e) => setMPrice(e.target.value)} placeholder="0.00" />
                                    <span style={{ color: '#00D1FF', fontWeight: 'bold', marginRight: '10px' }}>TL</span>
                                </div>
                            </div>

                            <div className="seperator" style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '20px' }}></div>

                            <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '10px' }}>ÖNİZLEME İÇİN SÜRE SEÇİN</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', maxWidth: '400px' }}>
                                {[
                                    { id: 1, label: 'Bir Haftalık' },
                                    { id: 2, label: 'İki Haftalık' },
                                    { id: 3, label: 'Üç Haftalık' },
                                    { id: 4, label: 'Bir Aylık' },
                                ].map((d) => {
                                    const isActive = selectedWeeks === d.id;
                                    return (
                                        <button
                                            key={d.id}
                                            onClick={() => setSelectedWeeks(d.id)}
                                            style={{
                                                width: '100%', padding: '14px 0', borderRadius: '12px', border: 'none',
                                                fontSize: '13px', fontWeight: isActive ? '600' : '400', cursor: 'pointer',
                                                background: isActive ? 'linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)' : '#23252B',
                                                color: '#fff',
                                            }}
                                        >
                                            {d.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="price-summary" style={{
                                background: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '12px',
                                marginBottom: '12px', textAlign: 'center', border: '1px dashed rgba(255, 102, 196, 0.5)',
                            }}>
                                <span style={{ fontSize: '11px', display: 'block', opacity: 0.6, marginBottom: '5px' }}>
                                    SEÇİLEN SÜREYE GÖRE TOPLAM SATIŞ TUTARI
                                </span>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                                    {calculateTotal()} TL
                                </div>
                            </div>

                            <div className="earnings-display" style={{ marginBottom: '20px' }}>
                                <p>Haftalık Tahmini Kazancın: <span className="earning-value">{((parseFloat(wPrice) || 0) * 0.85).toFixed(2)} ₺</span></p>
                                <p>Aylık Tahmini Kazancın: <span className="earning-value">{((parseFloat(mPrice) || 0) * 0.80).toFixed(2)} ₺</span></p>
                            </div>

                            {errorMsg && (
                                <div className="error-text" style={{ color: '#FF66C4', fontSize: '13px', marginBottom: 12 }}>{errorMsg}</div>
                            )}

                            <div className="modal-actions" style={{ display: 'flex', gap: '10px' }}>
                                <button className="cancel-btn" onClick={onClose} style={{ flex: 1 }}>İptal</button>
                                <button className="save-btn" onClick={handlePublish} style={{ flex: 2 }}>Yayınla</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
